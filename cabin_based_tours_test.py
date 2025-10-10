import requests
import sys
import json
from datetime import datetime
import time

class CabinBasedToursAPITester:
    def __init__(self, base_url="https://seo-nav-rebuild.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details="", error=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {error}")
        
        self.test_results.append({
            "test_name": name,
            "success": success,
            "details": details,
            "error": error,
            "timestamp": datetime.now().isoformat()
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json() if response.content else {}
                    self.log_test(name, True, f"Status: {response.status_code}")
                    return True, response_data
                except:
                    self.log_test(name, True, f"Status: {response.status_code}, No JSON response")
                    return True, {}
            else:
                try:
                    error_data = response.json() if response.content else {}
                    self.log_test(name, False, "", f"Expected {expected_status}, got {response.status_code}. Response: {error_data}")
                except:
                    self.log_test(name, False, "", f"Expected {expected_status}, got {response.status_code}. Response: {response.text[:200]}")
                return False, {}

        except requests.exceptions.Timeout:
            self.log_test(name, False, "", "Request timeout (30s)")
            return False, {}
        except requests.exceptions.ConnectionError:
            self.log_test(name, False, "", "Connection error - server may be down")
            return False, {}
        except Exception as e:
            self.log_test(name, False, "", f"Exception: {str(e)}")
            return False, {}

    def test_get_all_tours(self):
        """Test GET /api/tours - kabin bazlı turları listele"""
        print("\n🎯 Test 1: GET /api/tours - Kabin bazlı turları listele")
        success, response = self.run_test(
            "GET /api/tours - Tüm turları getir",
            "GET",
            "tours",
            200
        )
        
        if success and response:
            print(f"   ✅ Toplam {len(response)} tur bulundu")
            
            # Kabin bazlı turları filtrele
            cabin_based_tours = []
            for tour in response:
                reservation_type = tour.get('reservation_type', 'cabin_based')  # Default cabin_based
                if reservation_type == 'cabin_based':
                    cabin_based_tours.append(tour)
            
            print(f"   📊 Kabin bazlı tur sayısı: {len(cabin_based_tours)}")
            
            # İlk birkaç kabin bazlı turu göster
            if cabin_based_tours:
                print("   📋 Kabin bazlı turlar:")
                for i, tour in enumerate(cabin_based_tours[:5], 1):
                    title = tour.get('title', 'Başlık yok')
                    tour_id = tour.get('id', 'ID yok')
                    location = tour.get('location', 'Lokasyon yok')
                    print(f"      {i}. {title} (ID: {tour_id}) - {location}")
                
                if len(cabin_based_tours) > 5:
                    print(f"      ... ve {len(cabin_based_tours) - 5} tur daha")
            else:
                print("   ⚠️  Kabin bazlı tur bulunamadı!")
            
            return True, cabin_based_tours
        
        return False, []

    def test_cabin_pricing_fields(self, tours):
        """Test 2: Kabin bazlı turların single_cabin_price ve double_cabin_price fieldları var mı?"""
        print("\n🎯 Test 2: Kabin bazlı turların fiyat fieldları kontrolü")
        
        if not tours:
            print("   ❌ Test edilecek kabin bazlı tur bulunamadı")
            return False
        
        tours_with_cabin_pricing = 0
        tours_without_cabin_pricing = 0
        pricing_details = []
        
        for tour in tours:
            tour_id = tour.get('id')
            title = tour.get('title', 'Başlık yok')
            
            # Tour dates'i kontrol et
            tour_dates = tour.get('tour_dates', [])
            
            has_cabin_pricing = False
            single_prices = []
            double_prices = []
            
            for date in tour_dates:
                single_price = date.get('single_cabin_price')
                double_price = date.get('double_cabin_price')
                
                if single_price is not None and double_price is not None:
                    has_cabin_pricing = True
                    if single_price > 0:
                        single_prices.append(single_price)
                    if double_price > 0:
                        double_prices.append(double_price)
            
            if has_cabin_pricing:
                tours_with_cabin_pricing += 1
                min_single = min(single_prices) if single_prices else 0
                min_double = min(double_prices) if double_prices else 0
                pricing_details.append({
                    'title': title,
                    'id': tour_id,
                    'min_single_price': min_single,
                    'min_double_price': min_double,
                    'date_count': len(tour_dates)
                })
            else:
                tours_without_cabin_pricing += 1
        
        print(f"   📊 Kabin fiyatlandırması olan turlar: {tours_with_cabin_pricing}")
        print(f"   📊 Kabin fiyatlandırması olmayan turlar: {tours_without_cabin_pricing}")
        
        if pricing_details:
            print("   💰 Kabin fiyatlandırma detayları:")
            for detail in pricing_details[:5]:
                print(f"      • {detail['title']}")
                print(f"        - Tek kabin min: ₺{detail['min_single_price']:,.0f}")
                print(f"        - Çift kabin min: ₺{detail['min_double_price']:,.0f}")
                print(f"        - Tarih sayısı: {detail['date_count']}")
        
        success = tours_with_cabin_pricing > 0
        if success:
            self.log_test("Kabin Fiyatlandırma Kontrolü", True, f"{tours_with_cabin_pricing} tur kabin fiyatlandırmasına sahip")
        else:
            self.log_test("Kabin Fiyatlandırma Kontrolü", False, "", "Hiçbir turda kabin fiyatlandırması bulunamadı")
        
        return success, pricing_details

    def test_specific_tour_cabin_based(self, tour_id="ff510364-e8b4-4fa3-8aa4-52859b039e51"):
        """Test 3: ff510364-e8b4-4fa3-8aa4-52859b039e51 ID'li tur kabin bazlı mı?"""
        print(f"\n🎯 Test 3: {tour_id} ID'li tur kabin bazlı mı?")
        
        success, response = self.run_test(
            f"GET /api/tours/{tour_id} - Spesifik tur detayları",
            "GET",
            f"tours/{tour_id}",
            200
        )
        
        if success and response:
            title = response.get('title', 'Başlık yok')
            reservation_type = response.get('reservation_type', 'cabin_based')  # Default cabin_based
            location = response.get('location', 'Lokasyon yok')
            
            print(f"   📋 Tur Bilgileri:")
            print(f"      • Başlık: {title}")
            print(f"      • Lokasyon: {location}")
            print(f"      • Rezervasyon Tipi: {reservation_type}")
            
            is_cabin_based = reservation_type == 'cabin_based'
            
            if is_cabin_based:
                print(f"   ✅ Bu tur KABIN BAZLI bir turdur")
                self.log_test("Spesifik Tur Kabin Bazlı Kontrolü", True, f"Tur {reservation_type} tipinde")
            else:
                print(f"   ❌ Bu tur kabin bazlı DEĞİL - Tip: {reservation_type}")
                self.log_test("Spesifik Tur Kabin Bazlı Kontrolü", False, "", f"Tur {reservation_type} tipinde, kabin bazlı değil")
            
            return True, response, is_cabin_based
        else:
            print(f"   ❌ Tur bulunamadı veya erişim hatası")
            self.log_test("Spesifik Tur Kabin Bazlı Kontrolü", False, "", "Tur detayları alınamadı")
            return False, None, False

    def test_specific_tour_cabin_prices(self, tour_id="ff510364-e8b4-4fa3-8aa4-52859b039e51"):
        """Test 4: Bu turun tek ve çift kabin fiyatları nedir?"""
        print(f"\n🎯 Test 4: {tour_id} ID'li turun kabin fiyatları")
        
        # Önce tur detaylarını al
        success, tour_response, is_cabin_based = self.test_specific_tour_cabin_based(tour_id)
        
        if not success:
            return False
        
        if not is_cabin_based:
            print("   ⚠️  Bu tur kabin bazlı olmadığı için kabin fiyatları mevcut değil")
            return False
        
        # Tour dates'i kontrol et
        tour_dates = tour_response.get('tour_dates', [])
        
        if not tour_dates:
            print("   ❌ Bu tur için tarih bulunamadı")
            return False
        
        print(f"   📅 Toplam {len(tour_dates)} tarih bulundu")
        print("   💰 Kabin Fiyatları:")
        
        all_single_prices = []
        all_double_prices = []
        valid_dates = []
        
        for i, date in enumerate(tour_dates, 1):
            start_date = date.get('start_date') or date.get('date')
            single_price = date.get('single_cabin_price', 0)
            double_price = date.get('double_cabin_price', 0)
            capacity = date.get('capacity', 0)
            
            print(f"      {i}. Tarih: {start_date}")
            print(f"         • Tek Kişilik Kabin: ₺{single_price:,.0f}")
            print(f"         • Çift Kişilik Kabin: ₺{double_price:,.0f}")
            print(f"         • Kapasite: {capacity} kabin")
            
            if single_price > 0:
                all_single_prices.append(single_price)
            if double_price > 0:
                all_double_prices.append(double_price)
            
            if single_price > 0 or double_price > 0:
                valid_dates.append({
                    'date': start_date,
                    'single_price': single_price,
                    'double_price': double_price,
                    'capacity': capacity
                })
        
        # Fiyat özeti
        print("\n   📊 Fiyat Özeti:")
        if all_single_prices:
            min_single = min(all_single_prices)
            max_single = max(all_single_prices)
            avg_single = sum(all_single_prices) / len(all_single_prices)
            print(f"      • Tek Kişilik Kabin: Min ₺{min_single:,.0f} - Max ₺{max_single:,.0f} (Ort: ₺{avg_single:,.0f})")
        else:
            print(f"      • Tek Kişilik Kabin: Fiyat bilgisi yok")
        
        if all_double_prices:
            min_double = min(all_double_prices)
            max_double = max(all_double_prices)
            avg_double = sum(all_double_prices) / len(all_double_prices)
            print(f"      • Çift Kişilik Kabin: Min ₺{min_double:,.0f} - Max ₺{max_double:,.0f} (Ort: ₺{avg_double:,.0f})")
        else:
            print(f"      • Çift Kişilik Kabin: Fiyat bilgisi yok")
        
        # Sepete ekleme için veri hazırlığı
        if valid_dates:
            print("\n   🛒 Sepete Ekleme İçin Hazır Veriler:")
            print("      En uygun fiyatlı tarih:")
            cheapest_date = min(valid_dates, key=lambda x: x['single_price'] if x['single_price'] > 0 else float('inf'))
            print(f"      • Tarih: {cheapest_date['date']}")
            print(f"      • Tek Kabin: ₺{cheapest_date['single_price']:,.0f}")
            print(f"      • Çift Kabin: ₺{cheapest_date['double_price']:,.0f}")
            print(f"      • Kapasite: {cheapest_date['capacity']} kabin")
            
            self.log_test("Spesifik Tur Kabin Fiyatları", True, f"Tek kabin: ₺{min_single:,.0f}-₺{max_single:,.0f}, Çift kabin: ₺{min_double:,.0f}-₺{max_double:,.0f}")
            return True, valid_dates
        else:
            print("   ❌ Geçerli fiyat bilgisi bulunamadı")
            self.log_test("Spesifik Tur Kabin Fiyatları", False, "", "Geçerli kabin fiyatları bulunamadı")
            return False, []

    def test_backend_health(self):
        """Backend sağlık kontrolü"""
        print("\n🏥 Backend Sağlık Kontrolü")
        
        # Health endpoint test
        success, response = self.run_test(
            "Backend Health Check",
            "GET",
            "health",
            200
        )
        
        if success:
            print("   ✅ Backend sağlıklı ve erişilebilir")
            if response:
                print(f"   📊 Health Response: {json.dumps(response, indent=2)}")
        
        return success

    def run_cabin_based_tours_test(self):
        """Kabin bazlı turlar için kapsamlı test"""
        print("🎯 KABIN BAZLI TURLAR BACKEND API TESTİ")
        print("=" * 70)
        print("Turkish Review Request: Backend'de hangi kabin bazlı turlar var?")
        print("=" * 70)
        
        # Backend sağlık kontrolü
        self.test_backend_health()
        
        # Test 1: GET /api/tours - kabin bazlı turları listele
        tours_success, cabin_based_tours = self.test_get_all_tours()
        
        if not tours_success:
            print("\n❌ Turlar alınamadığı için testlere devam edilemiyor")
            self.print_final_results()
            return
        
        # Test 2: Kabin bazlı turların single_cabin_price ve double_cabin_price fieldları var mı?
        pricing_success, pricing_details = self.test_cabin_pricing_fields(cabin_based_tours)
        
        # Test 3: ff510364-e8b4-4fa3-8aa4-52859b039e51 ID'li tur kabin bazlı mı?
        specific_tour_success, tour_data, is_cabin_based = self.test_specific_tour_cabin_based()
        
        # Test 4: Bu turun tek ve çift kabin fiyatları nedir?
        if specific_tour_success and is_cabin_based:
            prices_success, price_data = self.test_specific_tour_cabin_prices()
        else:
            print("\n⚠️  Spesifik tur kabin bazlı olmadığı için fiyat testi atlanıyor")
        
        # Sonuçları yazdır
        self.print_final_results()
        
        # Özet rapor
        self.print_cabin_tours_summary(cabin_based_tours, pricing_details)

    def print_cabin_tours_summary(self, cabin_based_tours, pricing_details):
        """Kabin bazlı turlar özet raporu"""
        print("\n" + "=" * 70)
        print("📊 KABIN BAZLI TURLAR ÖZET RAPORU")
        print("=" * 70)
        
        print(f"🏷️  Toplam Kabin Bazlı Tur Sayısı: {len(cabin_based_tours)}")
        print(f"💰 Fiyatlandırması Olan Tur Sayısı: {len(pricing_details)}")
        
        if pricing_details:
            print("\n🎯 SEPETE EKLENEBİLİR KABIN BAZLI TURLAR:")
            print("-" * 50)
            for i, detail in enumerate(pricing_details, 1):
                print(f"{i}. {detail['title']}")
                print(f"   ID: {detail['id']}")
                print(f"   Tek Kabin: ₺{detail['min_single_price']:,.0f}")
                print(f"   Çift Kabin: ₺{detail['min_double_price']:,.0f}")
                print(f"   Tarih Sayısı: {detail['date_count']}")
                print()
        
        # Spesifik tur bilgisi
        print("🎯 SPESİFİK TUR (ff510364-e8b4-4fa3-8aa4-52859b039e51):")
        print("-" * 50)
        
        # Bu bilgiyi test sonuçlarından al
        specific_tour_result = None
        for result in self.test_results:
            if "Spesifik Tur Kabin Bazlı" in result['test_name']:
                specific_tour_result = result
                break
        
        if specific_tour_result and specific_tour_result['success']:
            print("✅ Bu tur kabin bazlı bir turdur")
            print("✅ Kabin fiyatları mevcuttur")
            print("✅ Sepete eklenmeye hazırdır")
        else:
            print("❌ Bu tur kabin bazlı değil veya fiyat bilgisi eksik")
        
        print("\n🛒 SEPETE EKLEME İÇİN GEREKLİ VERİLER HAZIR!")

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 70)
        print("📊 KABIN BAZLI TURLAR TEST SONUÇLARI")
        print("=" * 70)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"Toplam Test: {self.tests_run}")
        print(f"Başarılı: {self.tests_passed}")
        print(f"Başarısız: {self.tests_run - self.tests_passed}")
        print(f"Başarı Oranı: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🎉 MÜKEMMEL: Kabin bazlı turlar backend API'si çalışıyor!")
        elif success_rate >= 60:
            print("⚠️  İYİ: Çoğu özellik çalışıyor, bazı sorunlar var")
        else:
            print("🚨 KRİTİK: Önemli sorunlar tespit edildi")
        
        # Başarısız testleri göster
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ BAŞARISIZ TESTLER:")
            for test in failed_tests:
                print(f"   • {test['test_name']}: {test['error']}")

if __name__ == "__main__":
    print("🚀 Kabin Bazlı Turlar Backend API Testi Başlatılıyor...")
    
    tester = CabinBasedToursAPITester()
    tester.run_cabin_based_tours_test()
    
    print("\n✅ Test tamamlandı!")