import requests
import sys
import json
from datetime import datetime
import time

class TurkishReviewTester:
    def __init__(self, base_url="https://seo-nav-rebuild.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details="", error=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - BAŞARILI")
        else:
            print(f"❌ {name} - BAŞARISIZ: {error}")
        
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
        
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Test ediliyor: {name}...")
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
                    self.log_test(name, True, f"Status: {response.status_code}, JSON yok")
                    return True, {}
            else:
                try:
                    error_data = response.json() if response.content else {}
                    self.log_test(name, False, "", f"Beklenen {expected_status}, alınan {response.status_code}. Yanıt: {error_data}")
                except:
                    self.log_test(name, False, "", f"Beklenen {expected_status}, alınan {response.status_code}. Yanıt: {response.text[:200]}")
                return False, {}

        except requests.exceptions.Timeout:
            self.log_test(name, False, "", "İstek zaman aşımı (30s)")
            return False, {}
        except requests.exceptions.ConnectionError:
            self.log_test(name, False, "", "Bağlantı hatası - sunucu kapalı olabilir")
            return False, {}
        except Exception as e:
            self.log_test(name, False, "", f"Hata: {str(e)}")
            return False, {}

    def test_1_get_tours_endpoint(self):
        """1. GET /api/tours endpoint'ini kullanarak turları listele"""
        print("\n🎯 TEST 1: GET /api/tours endpoint'ini kullanarak turları listele")
        print("=" * 60)
        
        success, response = self.run_test(
            "GET /api/tours - Tur Listesi",
            "GET",
            "tours",
            200
        )
        
        if success and response:
            print(f"   ✅ Toplam {len(response)} tur bulundu")
            
            # Show first few tours for verification
            for i, tour in enumerate(response[:5]):
                title = tour.get('title', 'Başlık yok')
                tour_id = tour.get('id', 'ID yok')
                reservation_type = tour.get('reservation_type', 'Belirtilmemiş')
                location = tour.get('location', 'Lokasyon yok')
                print(f"   📋 Tur {i+1}: {title}")
                print(f"      • ID: {tour_id[:8]}...")
                print(f"      • Rezervasyon Tipi: {reservation_type}")
                print(f"      • Lokasyon: {location}")
            
            return True, response
        else:
            print("   ❌ Turlar alınamadı")
            return False, []

    def test_2_find_person_based_tours(self, tours):
        """2. reservation_type="person_based" olan turları bul ve tour ID'lerini ver"""
        print("\n🎯 TEST 2: reservation_type='person_based' olan turları bul ve tour ID'lerini ver")
        print("=" * 60)
        
        person_based_tours = []
        
        for tour in tours:
            reservation_type = tour.get('reservation_type')
            if reservation_type == 'person_based':
                person_based_tours.append(tour)
        
        if person_based_tours:
            print(f"   ✅ {len(person_based_tours)} adet person_based tur bulundu:")
            
            tour_ids = []
            for i, tour in enumerate(person_based_tours):
                tour_id = tour.get('id')
                title = tour.get('title', 'Başlık yok')
                location = tour.get('location', 'Lokasyon yok')
                tour_ids.append(tour_id)
                print(f"   📋 {i+1}. {title}")
                print(f"      • ID: {tour_id}")
                print(f"      • Lokasyon: {location}")
                print(f"      • Rezervasyon Tipi: {tour.get('reservation_type')}")
            
            self.log_test("Person-Based Tur Bulma", True, f"{len(person_based_tours)} person-based tur bulundu")
            return True, tour_ids, person_based_tours
        else:
            print("   ❌ Hiç person_based tur bulunamadı")
            print("   ℹ️  Mevcut rezervasyon tipleri:")
            
            reservation_types = {}
            for tour in tours:
                res_type = tour.get('reservation_type', 'Belirtilmemiş')
                if res_type in reservation_types:
                    reservation_types[res_type] += 1
                else:
                    reservation_types[res_type] = 1
            
            for res_type, count in reservation_types.items():
                print(f"      • {res_type}: {count} tur")
            
            self.log_test("Person-Based Tur Bulma", False, "", "Hiç person_based tur bulunamadı")
            return False, [], []

    def test_3_check_person_price_fields(self, tour_ids):
        """3. Bu turların person_price, child_price fieldlarının dolu olup olmadığını kontrol et"""
        print("\n🎯 TEST 3: Person_price, child_price fieldlarının dolu olup olmadığını kontrol et")
        print("=" * 60)
        
        if not tour_ids:
            print("   ❌ Kontrol edilecek person_based tur bulunamadı")
            return False, []
        
        tours_with_pricing = []
        tours_without_pricing = []
        
        for tour_id in tour_ids:
            print(f"\n   🔍 Tur ID: {tour_id[:8]}... için tarih ve fiyat bilgileri kontrol ediliyor...")
            
            # Get tour dates for this tour
            success, dates_response = self.run_test(
                f"GET /api/tours/{tour_id}/dates - Tur Tarihleri",
                "GET",
                f"tours/{tour_id}/dates",
                200
            )
            
            if success and dates_response:
                print(f"      ✅ {len(dates_response)} tarih bulundu")
                
                has_person_price = False
                has_child_price = False
                pricing_details = []
                
                for i, date in enumerate(dates_response[:3]):  # Show first 3 dates
                    start_date = date.get('start_date', 'Tarih yok')
                    person_price = date.get('person_price')
                    child_price = date.get('child_price')
                    max_persons = date.get('max_persons')
                    
                    print(f"      📅 Tarih {i+1}: {start_date}")
                    print(f"         • person_price: {person_price} TL")
                    print(f"         • child_price: {child_price} TL")
                    print(f"         • max_persons: {max_persons}")
                    
                    if person_price is not None and person_price > 0:
                        has_person_price = True
                    if child_price is not None and child_price > 0:
                        has_child_price = True
                    
                    pricing_details.append({
                        'date': start_date,
                        'person_price': person_price,
                        'child_price': child_price,
                        'max_persons': max_persons
                    })
                
                if len(dates_response) > 3:
                    print(f"      ... ve {len(dates_response) - 3} tarih daha")
                
                if has_person_price:
                    print(f"      ✅ person_price alanı dolu")
                    tours_with_pricing.append({
                        'tour_id': tour_id,
                        'has_person_price': has_person_price,
                        'has_child_price': has_child_price,
                        'pricing_details': pricing_details,
                        'total_dates': len(dates_response)
                    })
                else:
                    print(f"      ❌ person_price alanı boş veya 0")
                    tours_without_pricing.append(tour_id)
                
                if has_child_price:
                    print(f"      ✅ child_price alanı dolu")
                else:
                    print(f"      ⚠️  child_price alanı boş veya 0 (opsiyonel olabilir)")
                    
            else:
                print(f"      ❌ Tur tarihleri alınamadı")
                tours_without_pricing.append(tour_id)
        
        # Summary
        print(f"\n   📊 ÖZET:")
        print(f"      • Fiyat bilgisi olan turlar: {len(tours_with_pricing)}")
        print(f"      • Fiyat bilgisi olmayan turlar: {len(tours_without_pricing)}")
        
        if tours_with_pricing:
            self.log_test("Person-Based Fiyat Kontrolü", True, f"{len(tours_with_pricing)} tur fiyat bilgisine sahip")
            return True, tours_with_pricing
        else:
            self.log_test("Person-Based Fiyat Kontrolü", False, "", "Hiçbir turda fiyat bilgisi bulunamadı")
            return False, []

    def test_4_show_tour_details(self, tours_with_pricing):
        """4. Bu turlardan birinin detay bilgilerini göster (tarihler, fiyatlar vs)"""
        print("\n🎯 TEST 4: Bir turun detay bilgilerini göster (tarihler, fiyatlar vs)")
        print("=" * 60)
        
        if not tours_with_pricing:
            print("   ❌ Detay gösterilecek tur bulunamadı")
            return False
        
        # Take the first tour with pricing
        selected_tour = tours_with_pricing[0]
        tour_id = selected_tour['tour_id']
        
        print(f"   🎯 Seçilen Tur ID: {tour_id}")
        
        # Get full tour details
        success, tour_response = self.run_test(
            f"GET /api/tours/{tour_id} - Tur Detayları",
            "GET",
            f"tours/{tour_id}",
            200
        )
        
        if success and tour_response:
            print(f"\n   📋 TUR DETAY BİLGİLERİ:")
            print(f"   " + "=" * 50)
            
            # Basic tour info
            print(f"   📌 Başlık: {tour_response.get('title', 'Belirtilmemiş')}")
            print(f"   📌 Kısa Açıklama: {tour_response.get('short_description', 'Belirtilmemiş')}")
            print(f"   📌 Lokasyon: {tour_response.get('location', 'Belirtilmemiş')}")
            print(f"   📌 Kategori: {tour_response.get('category', 'Belirtilmemiş')}")
            print(f"   📌 Rezervasyon Tipi: {tour_response.get('reservation_type', 'Belirtilmemiş')}")
            print(f"   📌 Durum: {tour_response.get('status', 'Belirtilmemiş')}")
            
            # Tour dates and pricing
            tour_dates = tour_response.get('tour_dates', [])
            if tour_dates:
                print(f"\n   📅 TARİH VE FİYAT BİLGİLERİ ({len(tour_dates)} tarih):")
                print(f"   " + "=" * 50)
                
                # Show first 5 dates
                for i, date in enumerate(tour_dates[:5]):
                    print(f"   📅 Tarih {i+1}:")
                    print(f"      • Başlangıç: {date.get('start_date', 'Belirtilmemiş')}")
                    print(f"      • Kişi Başı Fiyat: {date.get('person_price', 'Belirtilmemiş')} TL")
                    print(f"      • Çocuk Fiyatı: {date.get('child_price', 'Belirtilmemiş')} TL")
                    print(f"      • Maksimum Kişi: {date.get('max_persons', 'Belirtilmemiş')}")
                    print(f"      • Aktif: {date.get('is_active', 'Belirtilmemiş')}")
                    print()
                
                if len(tour_dates) > 5:
                    print(f"   ... ve {len(tour_dates) - 5} tarih daha")
            else:
                print(f"   ⚠️  Tarih bilgisi bulunamadı")
            
            # Additional info
            included_services = tour_response.get('included_services', [])
            if included_services:
                print(f"\n   ✅ DAHİL SERVİSLER:")
                for service in included_services[:3]:
                    print(f"      • {service}")
                if len(included_services) > 3:
                    print(f"      ... ve {len(included_services) - 3} servis daha")
            
            excluded_services = tour_response.get('excluded_services', [])
            if excluded_services:
                print(f"\n   ❌ HARİÇ SERVİSLER:")
                for service in excluded_services[:3]:
                    print(f"      • {service}")
                if len(excluded_services) > 3:
                    print(f"      ... ve {len(excluded_services) - 3} servis daha")
            
            # Review info
            rating = tour_response.get('rating', 0)
            review_count = tour_response.get('review_count', 0)
            print(f"\n   ⭐ DEĞERLENDİRME:")
            print(f"      • Puan: {rating}/5")
            print(f"      • Yorum Sayısı: {review_count}")
            
            # Minimum price
            minimum_price = tour_response.get('minimum_price', 0)
            print(f"\n   💰 FİYAT BİLGİSİ:")
            print(f"      • Minimum Fiyat: {minimum_price} TL")
            
            self.log_test("Tur Detay Gösterimi", True, f"Tur {tour_id[:8]}... detayları başarıyla gösterildi")
            return True
        else:
            print(f"   ❌ Tur detayları alınamadı")
            self.log_test("Tur Detay Gösterimi", False, "", f"Tur {tour_id[:8]}... detayları alınamadı")
            return False

    def run_turkish_review_test(self):
        """Ana test fonksiyonu - Türkçe review request'teki tüm testleri çalıştır"""
        print("🎯 TÜRKÇE REVIEW REQUEST - BACKEND API TEST")
        print("=" * 70)
        print("Backend API test et:")
        print("1. GET /api/tours endpoint'ini kullanarak turları listele")
        print("2. reservation_type='person_based' olan turları bul ve tour ID'lerini ver")
        print("3. Bu turların person_price, child_price fieldlarının dolu olup olmadığını kontrol et")
        print("4. Bu turlardan birinin detay bilgilerini göster (tarihler, fiyatlar vs)")
        print("=" * 70)
        
        # Test 1: Get all tours
        tours_success, tours = self.test_1_get_tours_endpoint()
        
        if not tours_success:
            print("\n❌ İlk test başarısız oldu, diğer testler çalıştırılamıyor")
            self.print_final_results()
            return
        
        # Test 2: Find person-based tours
        person_tours_success, tour_ids, person_based_tours = self.test_2_find_person_based_tours(tours)
        
        if not person_tours_success:
            print("\n❌ Person-based tur bulunamadı, fiyat kontrol testleri çalıştırılamıyor")
            self.print_final_results()
            return
        
        # Test 3: Check pricing fields
        pricing_success, tours_with_pricing = self.test_3_check_person_price_fields(tour_ids)
        
        # Test 4: Show tour details (even if pricing check failed)
        if tours_with_pricing:
            self.test_4_show_tour_details(tours_with_pricing)
        elif person_based_tours:
            # If no pricing found, still show details of first person-based tour
            print("\n🎯 TEST 4: Fiyat bilgisi olmasa da person-based turun detaylarını göster")
            print("=" * 60)
            first_tour_id = person_based_tours[0].get('id')
            if first_tour_id:
                success, tour_response = self.run_test(
                    f"GET /api/tours/{first_tour_id} - Tur Detayları",
                    "GET",
                    f"tours/{first_tour_id}",
                    200
                )
                if success:
                    print(f"   📋 Tur: {tour_response.get('title', 'Başlık yok')}")
                    print(f"   📋 Rezervasyon Tipi: {tour_response.get('reservation_type')}")
                    print(f"   📋 Lokasyon: {tour_response.get('location', 'Lokasyon yok')}")
        
        # Print final results
        self.print_final_results()

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 70)
        print("📊 TÜRKÇE REVIEW TEST SONUÇLARI")
        print("=" * 70)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"Toplam Test: {self.tests_run}")
        print(f"Başarılı Test: {self.tests_passed}")
        print(f"Başarısız Test: {self.tests_run - self.tests_passed}")
        print(f"Başarı Oranı: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🎉 MÜKEMMEL: Person-based tur API'leri çalışıyor!")
        elif success_rate >= 60:
            print("⚠️  İYİ: Çoğu özellik çalışıyor, bazı sorunlar var")
        else:
            print("🚨 KRİTİK: Büyük sorunlar tespit edildi, acil müdahale gerekli")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ BAŞARISIZ TESTLER:")
            for test in failed_tests:
                print(f"   • {test['test_name']}: {test['error']}")
        
        # Print successful tests
        successful_tests = [test for test in self.test_results if test['success']]
        if successful_tests:
            print("\n✅ BAŞARILI TESTLER:")
            for test in successful_tests:
                print(f"   • {test['test_name']}")
        
        print("\n" + "=" * 70)

if __name__ == "__main__":
    print("🚀 Türkçe Review Request Testi Başlatılıyor...")
    
    tester = TurkishReviewTester()
    tester.run_turkish_review_test()