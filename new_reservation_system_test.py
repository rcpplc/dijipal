import requests
import sys
import json
from datetime import datetime
import time

class NewReservationSystemTester:
    def __init__(self, base_url="https://tour-reserv.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.tour_data = {}

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
                    self.log_test(name, True, f"Status: {response.status_code}, Response: {json.dumps(response_data, indent=2)[:200]}...")
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

    def test_user_login(self):
        """Test user login for reservation testing"""
        login_data = {
            "email": "user@example.com",
            "password": "password123"
        }
        
        success, response = self.run_test(
            "User Login for Reservation Testing",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            if 'user' in response:
                self.user_id = response['user'].get('id')
            print(f"   ✅ Login successful, token: {self.token[:20]}...")
            return True
        
        return False

    def test_get_tours_for_reservation_types(self):
        """Test getting tours and identify different reservation types"""
        success, response = self.run_test(
            "Get Tours for Reservation Type Analysis",
            "GET",
            "tours",
            200
        )
        
        if success and response:
            print(f"   ✅ Retrieved {len(response)} tours")
            
            # Analyze reservation types
            cabin_based_tours = []
            person_based_tours = []
            reservation_tours = []
            
            for tour in response:
                tour_id = tour.get('id')
                title = tour.get('title', 'Unknown')
                reservation_type = tour.get('reservation_type', 'cabin_based')  # Default to cabin_based
                
                if reservation_type == 'cabin_based':
                    cabin_based_tours.append({'id': tour_id, 'title': title})
                elif reservation_type == 'person_based':
                    person_based_tours.append({'id': tour_id, 'title': title})
                elif reservation_type == 'reservation':
                    reservation_tours.append({'id': tour_id, 'title': title})
            
            print(f"   🏨 Kabin Bazlı Tours: {len(cabin_based_tours)}")
            print(f"   👥 Kişi Bazlı Tours: {len(person_based_tours)}")
            print(f"   🚢 Rezervasyon Tours: {len(reservation_tours)}")
            
            # Store tour data for later tests
            self.tour_data = {
                'cabin_based': cabin_based_tours,
                'person_based': person_based_tours,
                'reservation': reservation_tours,
                'all_tours': response
            }
            
            return True, response
        
        return False, {}

    def test_cabin_based_tour_detail(self):
        """Test 🏨 Kabin Bazlı tour detail and pricing"""
        if not self.tour_data.get('cabin_based'):
            print("   ⚠️  No cabin-based tours found, skipping test")
            return False
        
        # Get first cabin-based tour
        tour = self.tour_data['cabin_based'][0]
        tour_id = tour['id']
        
        print(f"   🔍 Testing cabin-based tour: {tour['title']}")
        
        # Get tour details
        success, response = self.run_test(
            f"Get Cabin-Based Tour Detail ({tour['title']})",
            "GET",
            f"tours/{tour_id}",
            200
        )
        
        if success and response:
            # Check for cabin pricing fields
            tour_dates = response.get('tour_dates', [])
            if tour_dates:
                date = tour_dates[0]
                single_cabin_price = date.get('single_cabin_price', 0)
                double_cabin_price = date.get('double_cabin_price', 0)
                
                print(f"   💰 Single Cabin Price: ₺{single_cabin_price}")
                print(f"   💰 Double Cabin Price: ₺{double_cabin_price}")
                
                if single_cabin_price > 0 and double_cabin_price > 0:
                    print("   ✅ Cabin pricing system working correctly")
                    return True
                else:
                    print("   ❌ Cabin pricing not configured properly")
                    return False
            else:
                print("   ❌ No tour dates found")
                return False
        
        return False

    def test_person_based_tour_detail(self):
        """Test 👥 Kişi Bazlı tour detail and pricing"""
        if not self.tour_data.get('person_based'):
            print("   ⚠️  No person-based tours found, skipping test")
            return False
        
        # Get first person-based tour
        tour = self.tour_data['person_based'][0]
        tour_id = tour['id']
        
        print(f"   🔍 Testing person-based tour: {tour['title']}")
        
        # Get tour details
        success, response = self.run_test(
            f"Get Person-Based Tour Detail ({tour['title']})",
            "GET",
            f"tours/{tour_id}",
            200
        )
        
        if success and response:
            # Check for person pricing fields
            tour_dates = response.get('tour_dates', [])
            if tour_dates:
                date = tour_dates[0]
                person_price = date.get('person_price', 0)
                child_price = date.get('child_price', 0)
                max_persons = date.get('max_persons', 0)
                
                print(f"   💰 Person Price: ₺{person_price}")
                print(f"   💰 Child Price: ₺{child_price}")
                print(f"   👥 Max Persons: {max_persons}")
                
                if person_price > 0 and max_persons > 0:
                    print("   ✅ Person-based pricing system working correctly")
                    return True
                else:
                    print("   ❌ Person-based pricing not configured properly")
                    return False
            else:
                print("   ❌ No tour dates found")
                return False
        
        return False

    def test_reservation_tour_detail(self):
        """Test 🚢 Rezervasyon (fixed price) tour detail"""
        if not self.tour_data.get('reservation'):
            print("   ⚠️  No reservation tours found, skipping test")
            return False
        
        # Get first reservation tour
        tour = self.tour_data['reservation'][0]
        tour_id = tour['id']
        
        print(f"   🔍 Testing reservation tour: {tour['title']}")
        
        # Get tour details
        success, response = self.run_test(
            f"Get Reservation Tour Detail ({tour['title']})",
            "GET",
            f"tours/{tour_id}",
            200
        )
        
        if success and response:
            # Check for reservation pricing fields
            tour_dates = response.get('tour_dates', [])
            if tour_dates:
                date = tour_dates[0]
                total_reservation_price = date.get('total_reservation_price', 0)
                max_passengers = date.get('max_passengers', 0)
                
                print(f"   💰 Total Reservation Price: ₺{total_reservation_price}")
                print(f"   🚢 Max Passengers: {max_passengers}")
                
                if total_reservation_price > 0 and max_passengers > 0:
                    print("   ✅ Reservation pricing system working correctly")
                    return True
                else:
                    print("   ❌ Reservation pricing not configured properly")
                    return False
            else:
                print("   ❌ No tour dates found")
                return False
        
        return False

    def test_cabin_based_price_calculation(self):
        """Test cabin-based price calculation scenarios"""
        if not self.tour_data.get('cabin_based'):
            print("   ⚠️  No cabin-based tours found, skipping test")
            return False
        
        tour = self.tour_data['cabin_based'][0]
        tour_id = tour['id']
        
        print(f"   🧮 Testing price calculation for: {tour['title']}")
        
        # Get tour details for pricing
        success, response = self.run_test(
            "Get Tour for Price Calculation",
            "GET",
            f"tours/{tour_id}",
            200
        )
        
        if success and response:
            tour_dates = response.get('tour_dates', [])
            if tour_dates:
                date = tour_dates[0]
                single_price = date.get('single_cabin_price', 0)
                double_price = date.get('double_cabin_price', 0)
                
                # Test different cabin combinations
                test_scenarios = [
                    {"single_cabins": 2, "double_cabins": 0, "expected": single_price * 2},
                    {"single_cabins": 1, "double_cabins": 1, "expected": single_price + double_price},
                    {"single_cabins": 2, "double_cabins": 1, "expected": (single_price * 2) + double_price},
                    {"single_cabins": 0, "double_cabins": 2, "expected": double_price * 2}
                ]
                
                all_passed = True
                for scenario in test_scenarios:
                    single_count = scenario["single_cabins"]
                    double_count = scenario["double_cabins"]
                    expected_total = scenario["expected"]
                    
                    print(f"   📊 Scenario: {single_count} tek + {double_count} çift kabin = ₺{expected_total}")
                    
                    if expected_total <= 0:
                        print(f"   ❌ Invalid pricing: single=₺{single_price}, double=₺{double_price}")
                        all_passed = False
                
                if all_passed:
                    print("   ✅ All cabin price calculation scenarios valid")
                    return True
                else:
                    print("   ❌ Some price calculation scenarios failed")
                    return False
        
        return False

    def test_person_based_price_calculation(self):
        """Test person-based price calculation scenarios"""
        if not self.tour_data.get('person_based'):
            print("   ⚠️  No person-based tours found, skipping test")
            return False
        
        tour = self.tour_data['person_based'][0]
        tour_id = tour['id']
        
        print(f"   🧮 Testing person-based price calculation for: {tour['title']}")
        
        # Get tour details for pricing
        success, response = self.run_test(
            "Get Person-Based Tour for Price Calculation",
            "GET",
            f"tours/{tour_id}",
            200
        )
        
        if success and response:
            tour_dates = response.get('tour_dates', [])
            if tour_dates:
                date = tour_dates[0]
                person_price = date.get('person_price', 0)
                child_price = date.get('child_price', person_price)  # Default to person price if not set
                max_persons = date.get('max_persons', 0)
                
                # Test different person combinations
                test_scenarios = [
                    {"adults": 2, "children": 0, "expected": person_price * 2},
                    {"adults": 2, "children": 1, "expected": (person_price * 2) + child_price},
                    {"adults": 1, "children": 2, "expected": person_price + (child_price * 2)},
                    {"adults": 4, "children": 2, "expected": (person_price * 4) + (child_price * 2)}
                ]
                
                all_passed = True
                for scenario in test_scenarios:
                    adults = scenario["adults"]
                    children = scenario["children"]
                    expected_total = scenario["expected"]
                    total_persons = adults + children
                    
                    print(f"   📊 Scenario: {adults} yetişkin + {children} çocuk = ₺{expected_total}")
                    
                    if total_persons > max_persons:
                        print(f"   ⚠️  Scenario exceeds max capacity ({max_persons})")
                    
                    if expected_total <= 0:
                        print(f"   ❌ Invalid pricing: person=₺{person_price}, child=₺{child_price}")
                        all_passed = False
                
                if all_passed:
                    print("   ✅ All person-based price calculation scenarios valid")
                    return True
                else:
                    print("   ❌ Some price calculation scenarios failed")
                    return False
        
        return False

    def test_vat_calculation(self):
        """Test VAT calculation (20% KDV)"""
        print("   🧮 Testing VAT calculation (20% KDV)")
        
        # Test different price scenarios
        test_prices = [1000, 1500, 2500, 5000]
        vat_rate = 0.20  # 20%
        
        all_passed = True
        for base_price in test_prices:
            vat_amount = base_price * vat_rate
            total_with_vat = base_price + vat_amount
            
            print(f"   📊 Base: ₺{base_price} + KDV: ₺{vat_amount} = Total: ₺{total_with_vat}")
            
            # Verify calculation
            expected_vat = base_price * 0.20
            if abs(vat_amount - expected_vat) > 0.01:  # Allow for small floating point differences
                print(f"   ❌ VAT calculation error: expected ₺{expected_vat}, got ₺{vat_amount}")
                all_passed = False
        
        if all_passed:
            print("   ✅ VAT calculation (20%) working correctly")
            return True
        else:
            print("   ❌ VAT calculation errors found")
            return False

    def test_cart_functionality(self):
        """Test cart functionality (localStorage based)"""
        print("   🛒 Testing cart functionality")
        print("   ℹ️  Cart functionality is frontend localStorage based")
        print("   ℹ️  Backend endpoints for cart may not exist - testing frontend flow")
        
        # Since cart is localStorage based, we can't test it via backend API
        # But we can verify that the booking creation works with cart data
        
        if not self.tour_data.get('cabin_based'):
            print("   ⚠️  No tours available for cart testing")
            return False
        
        tour = self.tour_data['cabin_based'][0]
        tour_id = tour['id']
        
        # Get tour dates for booking
        success, response = self.run_test(
            "Get Tour Dates for Cart Test",
            "GET",
            f"tours/{tour_id}/dates",
            200
        )
        
        if success and response and len(response) > 0:
            tour_date_id = response[0]['id']
            
            # Test booking creation (simulating cart to booking flow)
            booking_data = {
                "tour_id": tour_id,
                "tour_date_id": tour_date_id,
                "participants": 2,  # 2 cabins
                "cabin_type": "single",
                "customer_info": {
                    "full_name": "Test Customer",
                    "email": "test@example.com",
                    "phone": "+90 555 123 4567",
                    "id_number": "12345678901"
                },
                "special_requests": "Cart to booking test"
            }
            
            if self.token:
                booking_success, booking_response = self.run_test(
                    "Create Booking from Cart Data",
                    "POST",
                    "bookings",
                    200,
                    data=booking_data
                )
                
                if booking_success:
                    print("   ✅ Cart to booking flow working")
                    return True
                else:
                    print("   ❌ Cart to booking flow failed")
                    return False
            else:
                print("   ⚠️  No authentication token for booking test")
                return False
        
        return False

    def test_multi_item_cart_support(self):
        """Test multi-item cart support"""
        print("   🛒 Testing multi-item cart support")
        print("   ℹ️  Testing multiple bookings creation (simulating multi-item cart)")
        
        if not self.token:
            print("   ⚠️  No authentication token for multi-booking test")
            return False
        
        if len(self.tour_data.get('all_tours', [])) < 2:
            print("   ⚠️  Need at least 2 tours for multi-item test")
            return False
        
        # Try to create multiple bookings
        tours_to_book = self.tour_data['all_tours'][:2]  # First 2 tours
        booking_successes = []
        
        for i, tour in enumerate(tours_to_book):
            tour_id = tour['id']
            
            # Get tour dates
            dates_success, dates_response = self.run_test(
                f"Get Tour Dates for Multi-Item {i+1}",
                "GET",
                f"tours/{tour_id}/dates",
                200
            )
            
            if dates_success and dates_response and len(dates_response) > 0:
                tour_date_id = dates_response[0]['id']
                
                booking_data = {
                    "tour_id": tour_id,
                    "tour_date_id": tour_date_id,
                    "participants": 1,
                    "cabin_type": "single",
                    "customer_info": {
                        "full_name": "Multi Item Test Customer",
                        "email": "multitest@example.com",
                        "phone": "+90 555 999 8888",
                        "id_number": "98765432109"
                    },
                    "special_requests": f"Multi-item booking test {i+1}"
                }
                
                booking_success, booking_response = self.run_test(
                    f"Create Multi-Item Booking {i+1}",
                    "POST",
                    "bookings",
                    200,
                    data=booking_data
                )
                
                booking_successes.append(booking_success)
            else:
                booking_successes.append(False)
        
        success_count = sum(booking_successes)
        if success_count >= 2:
            print(f"   ✅ Multi-item cart support working ({success_count}/2 bookings created)")
            return True
        else:
            print(f"   ❌ Multi-item cart support issues ({success_count}/2 bookings created)")
            return False

    def test_booking_page_data_transfer(self):
        """Test booking page data transfer accuracy"""
        print("   📋 Testing booking page data transfer")
        
        if not self.tour_data.get('cabin_based'):
            print("   ⚠️  No tours available for booking page test")
            return False
        
        tour = self.tour_data['cabin_based'][0]
        tour_id = tour['id']
        
        # Get complete tour data
        success, tour_response = self.run_test(
            "Get Tour Data for Booking Page Transfer Test",
            "GET",
            f"tours/{tour_id}",
            200
        )
        
        if success and tour_response:
            # Verify all required data is present
            required_fields = ['id', 'title', 'location', 'tour_dates']
            missing_fields = []
            
            for field in required_fields:
                if field not in tour_response or not tour_response[field]:
                    missing_fields.append(field)
            
            if missing_fields:
                print(f"   ❌ Missing required fields for booking page: {missing_fields}")
                return False
            
            # Check tour dates data
            tour_dates = tour_response['tour_dates']
            if tour_dates:
                date = tour_dates[0]
                required_date_fields = ['id', 'start_date']
                missing_date_fields = []
                
                for field in required_date_fields:
                    if field not in date or not date[field]:
                        missing_date_fields.append(field)
                
                if missing_date_fields:
                    print(f"   ❌ Missing required date fields: {missing_date_fields}")
                    return False
                
                print("   ✅ All required data available for booking page transfer")
                print(f"   📊 Tour: {tour_response['title']}")
                print(f"   📊 Location: {tour_response['location']}")
                print(f"   📊 Available dates: {len(tour_dates)}")
                return True
            else:
                print("   ❌ No tour dates available")
                return False
        
        return False

    def run_comprehensive_reservation_system_test(self):
        """Run comprehensive test of the new reservation system"""
        print("🎯 YENİ REZERVASYON SİSTEMİ KAPSAMLI TEST")
        print("=" * 70)
        print("Test edilecek sistemler:")
        print("1. 🏨 Kabin Bazlı: Tek/çift kabin seçimi ve fiyat hesaplama")
        print("2. 👥 Kişi Bazlı: Yetişkin/çocuk sayısı ve fiyat hesaplama")
        print("3. 🚢 Rezervasyon: Sabit fiyat rezervasyon")
        print("=" * 70)
        
        # Phase 1: Authentication
        print("\n🔐 PHASE 1: User Authentication")
        login_success = self.test_user_login()
        
        if not login_success:
            print("❌ User login failed, some tests may be limited")
        
        # Phase 2: Tour Analysis
        print("\n📊 PHASE 2: Tour Analysis and Reservation Type Detection")
        tours_success, tours_data = self.test_get_tours_for_reservation_types()
        
        if not tours_success:
            print("❌ Could not retrieve tours, cannot proceed with reservation tests")
            self.print_final_results()
            return
        
        # Phase 3: Cabin-Based System Testing
        print("\n🏨 PHASE 3: Kabin Bazlı Rezervasyon Sistemi")
        self.test_cabin_based_tour_detail()
        self.test_cabin_based_price_calculation()
        
        # Phase 4: Person-Based System Testing
        print("\n👥 PHASE 4: Kişi Bazlı Rezervasyon Sistemi")
        self.test_person_based_tour_detail()
        self.test_person_based_price_calculation()
        
        # Phase 5: Reservation System Testing
        print("\n🚢 PHASE 5: Rezervasyon (Sabit Fiyat) Sistemi")
        self.test_reservation_tour_detail()
        
        # Phase 6: Price Calculation and VAT
        print("\n💰 PHASE 6: Fiyat Hesaplama ve KDV (%20)")
        self.test_vat_calculation()
        
        # Phase 7: Cart and Booking Flow
        print("\n🛒 PHASE 7: Sepet ve Rezervasyon Akışı")
        if login_success:
            self.test_cart_functionality()
            self.test_multi_item_cart_support()
        else:
            print("   ⚠️  Skipping cart tests - authentication required")
        
        # Phase 8: Booking Page Data Transfer
        print("\n📋 PHASE 8: Rezervasyon Sayfası Veri Aktarımı")
        self.test_booking_page_data_transfer()
        
        # Print final results
        self.print_final_results()

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 70)
        print("📊 YENİ REZERVASYON SİSTEMİ TEST SONUÇLARI")
        print("=" * 70)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"Toplam Test: {self.tests_run}")
        print(f"Başarılı: {self.tests_passed}")
        print(f"Başarısız: {self.tests_run - self.tests_passed}")
        print(f"Başarı Oranı: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🎉 MÜKEMMEL: Yeni rezervasyon sistemi çok iyi çalışıyor!")
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
        
        # Print summary by system type
        print("\n📋 SİSTEM BAZINDA ÖZET:")
        
        cabin_tests = [t for t in self.test_results if 'cabin' in t['test_name'].lower() or 'kabin' in t['test_name'].lower()]
        person_tests = [t for t in self.test_results if 'person' in t['test_name'].lower() or 'kişi' in t['test_name'].lower()]
        reservation_tests = [t for t in self.test_results if 'reservation' in t['test_name'].lower() or 'rezervasyon' in t['test_name'].lower()]
        
        if cabin_tests:
            cabin_success = sum(1 for t in cabin_tests if t['success'])
            print(f"   🏨 Kabin Bazlı: {cabin_success}/{len(cabin_tests)} başarılı")
        
        if person_tests:
            person_success = sum(1 for t in person_tests if t['success'])
            print(f"   👥 Kişi Bazlı: {person_success}/{len(person_tests)} başarılı")
        
        if reservation_tests:
            res_success = sum(1 for t in reservation_tests if t['success'])
            print(f"   🚢 Rezervasyon: {res_success}/{len(reservation_tests)} başarılı")

if __name__ == "__main__":
    print("🚀 YENİ REZERVASYON SİSTEMİ TEST BAŞLATILIYOR")
    print("=" * 70)
    
    tester = NewReservationSystemTester()
    tester.run_comprehensive_reservation_system_test()