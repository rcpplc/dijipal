import requests
import sys
import json
from datetime import datetime
import time

class CabinBookingTester:
    def __init__(self, base_url="https://tour-admin-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.specific_tour_id = "3ded39ad-36a4-47d1-87b9-7baeb5f00f55"

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

    def test_specific_tour_exists(self):
        """Test if tour ID 3ded39ad-36a4-47d1-87b9-7baeb5f00f55 exists"""
        success, response = self.run_test(
            f"Tour Exists Check - ID: {self.specific_tour_id}",
            "GET",
            f"tours/{self.specific_tour_id}",
            200
        )
        
        if success and response:
            print(f"   ✅ Tour found: {response.get('title', 'Unknown Title')}")
            print(f"   📍 Location: {response.get('location', 'Unknown Location')}")
            print(f"   🏷️  Category: {response.get('category', 'Unknown Category')}")
            print(f"   🎯 Reservation Type: {response.get('reservation_type', 'Unknown Type')}")
            
            # Check if it's cabin-based
            reservation_type = response.get('reservation_type', '')
            if reservation_type == 'cabin_based':
                print("   ✅ Tour is cabin-based - correct for booking page testing")
                return True, response
            else:
                print(f"   ⚠️  Tour is {reservation_type} - not cabin-based")
                return True, response
        
        return False, {}

    def test_tour_cabin_pricing_structure(self, tour_data):
        """Test if tour has proper cabin pricing structure"""
        print("\n🔍 Analyzing Tour Cabin Pricing Structure...")
        
        # Check tour dates for cabin pricing
        tour_dates = tour_data.get('tour_dates', [])
        
        if not tour_dates:
            self.log_test("Tour Dates Availability", False, "", "No tour dates found")
            return False
        
        print(f"   📅 Found {len(tour_dates)} tour dates")
        
        cabin_pricing_dates = []
        for i, date in enumerate(tour_dates):
            date_str = date.get('start_date', date.get('date', 'Unknown Date'))
            single_price = date.get('single_cabin_price', 0)
            double_price = date.get('double_cabin_price', 0)
            capacity = date.get('capacity', date.get('available_cabins', 0))
            
            print(f"   📅 Date {i+1}: {date_str}")
            print(f"      💰 Single Cabin Price: ₺{single_price:,.2f}")
            print(f"      💰 Double Cabin Price: ₺{double_price:,.2f}")
            print(f"      🏠 Cabin Capacity: {capacity}")
            
            if single_price > 0 and double_price > 0:
                cabin_pricing_dates.append({
                    'date': date_str,
                    'single_price': single_price,
                    'double_price': double_price,
                    'capacity': capacity
                })
        
        if cabin_pricing_dates:
            print(f"   ✅ Found {len(cabin_pricing_dates)} dates with proper cabin pricing")
            self.log_test("Cabin Pricing Structure", True, f"{len(cabin_pricing_dates)} dates with cabin pricing")
            return True
        else:
            self.log_test("Cabin Pricing Structure", False, "", "No dates found with proper cabin pricing (single_cabin_price and double_cabin_price)")
            return False

    def test_tour_dates_endpoint(self):
        """Test GET /api/tours/{tour_id}/dates endpoint"""
        success, response = self.run_test(
            f"Tour Dates Endpoint - ID: {self.specific_tour_id}",
            "GET",
            f"tours/{self.specific_tour_id}/dates",
            200
        )
        
        if success and response:
            print(f"   📅 Retrieved {len(response)} tour dates from dates endpoint")
            
            # Analyze cabin pricing in dates endpoint
            cabin_dates_count = 0
            for date in response:
                single_price = date.get('single_cabin_price', 0)
                double_price = date.get('double_cabin_price', 0)
                
                if single_price > 0 and double_price > 0:
                    cabin_dates_count += 1
                    print(f"   💰 Date {date.get('start_date', 'Unknown')}: Single=₺{single_price:,.2f}, Double=₺{double_price:,.2f}")
            
            if cabin_dates_count > 0:
                print(f"   ✅ {cabin_dates_count} dates have cabin pricing information")
                return True, response
            else:
                print("   ❌ No dates have cabin pricing information")
                return False, response
        
        return False, {}

    def test_booking_page_calculation_data(self, tour_data, tour_dates):
        """Test if backend provides all necessary data for booking page calculations"""
        print("\n🔍 Testing Booking Page Calculation Data...")
        
        # Test scenario: 1 single cabin + 1 double cabin selection
        print("   🎯 Testing scenario: 1 single cabin + 1 double cabin selection")
        
        if not tour_dates:
            self.log_test("Booking Calculation Data", False, "", "No tour dates available for calculation")
            return False
        
        # Use first available date for calculation
        test_date = tour_dates[0]
        date_str = test_date.get('start_date', test_date.get('date', 'Unknown'))
        single_price = test_date.get('single_cabin_price', 0)
        double_price = test_date.get('double_cabin_price', 0)
        
        print(f"   📅 Using date: {date_str}")
        print(f"   💰 Single cabin price: ₺{single_price:,.2f}")
        print(f"   💰 Double cabin price: ₺{double_price:,.2f}")
        
        # Calculate expected total for 1 single + 1 double cabin
        expected_total = single_price + double_price
        print(f"   🧮 Expected total (1 single + 1 double): ₺{expected_total:,.2f}")
        
        # Check if prices are reasonable (not zero)
        if single_price <= 0 or double_price <= 0:
            self.log_test("Booking Calculation Data", False, "", f"Invalid pricing: single={single_price}, double={double_price}")
            return False
        
        # Check if data structure is complete
        required_fields = ['start_date', 'single_cabin_price', 'double_cabin_price']
        missing_fields = []
        
        for field in required_fields:
            if field not in test_date or test_date[field] is None:
                missing_fields.append(field)
        
        if missing_fields:
            self.log_test("Booking Calculation Data", False, "", f"Missing required fields: {missing_fields}")
            return False
        
        print("   ✅ All required fields present for booking page calculations")
        print("   ✅ Pricing data is valid and reasonable")
        
        # Additional checks for booking page
        tour_title = tour_data.get('title', 'Unknown Tour')
        tour_location = tour_data.get('location', 'Unknown Location')
        
        print(f"   📋 Tour title available: {tour_title}")
        print(f"   📍 Tour location available: {tour_location}")
        
        self.log_test("Booking Calculation Data", True, f"Complete data for booking calculations: {expected_total:,.2f} TL total")
        return True

    def test_user_login(self):
        """Test user login for booking functionality"""
        login_data = {
            "email": "user@example.com",
            "password": "password123"
        }
        
        success, response = self.run_test(
            "User Login for Booking Test",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            if 'user' in response:
                self.user_id = response['user'].get('id')
            print(f"   ✅ Login successful, token obtained")
            return True
        
        return False

    def test_booking_creation_with_cabin_data(self, tour_dates):
        """Test booking creation with cabin-based data"""
        if not self.token:
            self.log_test("Booking Creation Test", False, "", "No authentication token available")
            return False
        
        if not tour_dates:
            self.log_test("Booking Creation Test", False, "", "No tour dates available")
            return False
        
        # Use first available date
        test_date = tour_dates[0]
        tour_date_id = test_date.get('id')
        
        if not tour_date_id:
            self.log_test("Booking Creation Test", False, "", "No tour date ID available")
            return False
        
        # Test booking with single cabin
        booking_data = {
            "tour_id": self.specific_tour_id,
            "tour_date_id": tour_date_id,
            "participants": 1,  # 1 cabin
            "cabin_type": "single",
            "customer_info": {
                "full_name": "Test Customer",
                "email": "test@example.com",
                "phone": "+90 555 123 4567",
                "id_number": "12345678901"
            },
            "special_requests": "Test cabin booking"
        }
        
        success, response = self.run_test(
            "Create Booking (Single Cabin)",
            "POST",
            "bookings",
            200,
            data=booking_data
        )
        
        if success and response:
            booking_id = response.get('id')
            total_price = response.get('total_price', 0)
            expected_price = test_date.get('single_cabin_price', 0)
            
            print(f"   💰 Booking total price: ₺{total_price:,.2f}")
            print(f"   💰 Expected single cabin price: ₺{expected_price:,.2f}")
            
            if abs(total_price - expected_price) < 0.01:  # Allow for small floating point differences
                print("   ✅ Booking price calculation correct")
                return True, booking_id
            else:
                print("   ❌ Booking price calculation incorrect")
                return False, booking_id
        
        return False, None

    def run_cabin_booking_tests(self):
        """Run comprehensive cabin booking functionality tests"""
        print("🎯 Testing Cabin-Based Booking Page Functionality")
        print("=" * 70)
        print(f"Target Tour ID: {self.specific_tour_id}")
        print("Testing scenario: Booking page reservation summary for cabin selections")
        print("=" * 70)
        
        # Test 1: Check if specific tour exists
        print("\n📋 PHASE 1: Tour Existence and Structure")
        tour_exists, tour_data = self.test_specific_tour_exists()
        
        if not tour_exists:
            print("❌ Cannot proceed - target tour does not exist")
            self.print_final_results()
            return
        
        # Test 2: Check cabin pricing structure
        print("\n📋 PHASE 2: Cabin Pricing Structure Analysis")
        cabin_pricing_ok = self.test_tour_cabin_pricing_structure(tour_data)
        
        # Test 3: Test tour dates endpoint
        print("\n📋 PHASE 3: Tour Dates Endpoint Testing")
        dates_ok, tour_dates = self.test_tour_dates_endpoint()
        
        # Test 4: Test booking page calculation data
        print("\n📋 PHASE 4: Booking Page Calculation Data")
        if dates_ok and tour_dates:
            calculation_ok = self.test_booking_page_calculation_data(tour_data, tour_dates)
        else:
            calculation_ok = False
            print("   ❌ Cannot test calculations - no tour dates available")
        
        # Test 5: User authentication for booking
        print("\n📋 PHASE 5: User Authentication")
        login_ok = self.test_user_login()
        
        # Test 6: Booking creation test
        print("\n📋 PHASE 6: Booking Creation Test")
        if login_ok and dates_ok and tour_dates:
            booking_ok, booking_id = self.test_booking_creation_with_cabin_data(tour_dates)
        else:
            booking_ok = False
            print("   ❌ Cannot test booking creation - prerequisites not met")
        
        # Print final results
        self.print_final_results()
        
        # Summary for main agent
        print("\n" + "=" * 70)
        print("📊 CABIN BOOKING TEST SUMMARY")
        print("=" * 70)
        
        if tour_exists and cabin_pricing_ok and dates_ok and calculation_ok:
            print("✅ BACKEND DATA STRUCTURE: All required data available for booking page")
            print("✅ CABIN PRICING: Single and double cabin prices properly configured")
            print("✅ TOUR DATES: Tour dates endpoint provides complete pricing information")
            print("✅ CALCULATION DATA: Backend provides all necessary data for booking calculations")
        else:
            print("❌ BACKEND ISSUES DETECTED:")
            if not tour_exists:
                print("   • Target tour does not exist")
            if not cabin_pricing_ok:
                print("   • Cabin pricing structure incomplete")
            if not dates_ok:
                print("   • Tour dates endpoint issues")
            if not calculation_ok:
                print("   • Missing data for booking calculations")

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 70)
        print("📊 FINAL TEST RESULTS")
        print("=" * 70)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🎉 EXCELLENT: Cabin booking backend is working well!")
        elif success_rate >= 60:
            print("⚠️  GOOD: Most features working, some issues to address")
        else:
            print("🚨 CRITICAL: Major issues detected, needs immediate attention")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test_name']}: {test['error']}")

if __name__ == "__main__":
    print("🚀 Starting Cabin Booking Functionality Tests")
    print("Testing booking page functionality for cabin-based reservations")
    print("Focus: Tour ID 3ded39ad-36a4-47d1-87b9-7baeb5f00f55")
    
    tester = CabinBookingTester()
    tester.run_cabin_booking_tests()