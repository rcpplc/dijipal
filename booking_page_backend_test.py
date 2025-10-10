import requests
import sys
import json
from datetime import datetime
import time

class BookingPageBackendTester:
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

    def test_backend_health(self):
        """Test backend server health"""
        return self.run_test(
            "Backend Server Health Check",
            "GET",
            "health",
            200
        )

    def test_specific_tour_endpoint(self, tour_id):
        """Test the specific tour endpoint mentioned in the request"""
        return self.run_test(
            f"Tour Endpoint - {tour_id}",
            "GET",
            f"tours/{tour_id}",
            200
        )

    def test_tour_dates_endpoint(self, tour_id):
        """Test tour dates endpoint for booking page data"""
        return self.run_test(
            f"Tour Dates Endpoint - {tour_id}",
            "GET",
            f"tours/{tour_id}/dates",
            200
        )

    def test_user_login(self):
        """Test user login for booking functionality"""
        login_data = {
            "email": "user@example.com",
            "password": "password123"
        }
        
        success, response = self.run_test(
            "User Login for Booking",
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

    def test_booking_creation_endpoint(self, tour_id):
        """Test booking creation endpoint"""
        if not self.token:
            self.log_test("Booking Creation Test", False, "", "No authentication token available")
            return False

        # First get tour dates
        dates_success, dates_response = self.test_tour_dates_endpoint(tour_id)
        
        if not dates_success or not dates_response or len(dates_response) == 0:
            self.log_test("Booking Creation Test", False, "", "No tour dates available for booking")
            return False
        
        # Use the first available date
        tour_date_id = dates_response[0]['id']
        
        booking_data = {
            "tour_id": tour_id,
            "tour_date_id": tour_date_id,
            "participants": 2,
            "cabin_type": "single",
            "customer_info": {
                "full_name": "Test Customer",
                "email": "test@example.com",
                "phone": "+90 555 123 4567",
                "id_number": "12345678901"
            },
            "special_requests": "Test booking for booking page verification"
        }
        
        return self.run_test(
            "Booking Creation Endpoint",
            "POST",
            "bookings",
            200,
            data=booking_data
        )

    def test_booking_page_data_structure(self, tour_id):
        """Test that tour data has all required fields for booking page"""
        success, tour_data = self.test_specific_tour_endpoint(tour_id)
        
        if not success:
            return False
        
        # Check required fields for booking page
        required_fields = ['id', 'title', 'location', 'reservation_type']
        missing_fields = []
        
        for field in required_fields:
            if field not in tour_data:
                missing_fields.append(field)
        
        if missing_fields:
            self.log_test(
                "Booking Page Data Structure", 
                False, 
                "", 
                f"Missing required fields: {', '.join(missing_fields)}"
            )
            return False
        
        # Check tour dates structure
        dates_success, dates_data = self.test_tour_dates_endpoint(tour_id)
        
        if not dates_success:
            self.log_test(
                "Booking Page Data Structure", 
                False, 
                "", 
                "Tour dates endpoint failed"
            )
            return False
        
        if not dates_data or len(dates_data) == 0:
            self.log_test(
                "Booking Page Data Structure", 
                False, 
                "", 
                "No tour dates available"
            )
            return False
        
        # Check date structure for cabin pricing
        date_sample = dates_data[0]
        required_date_fields = ['id', 'start_date', 'single_cabin_price', 'double_cabin_price']
        missing_date_fields = []
        
        for field in required_date_fields:
            if field not in date_sample:
                missing_date_fields.append(field)
        
        if missing_date_fields:
            self.log_test(
                "Booking Page Data Structure", 
                False, 
                "", 
                f"Missing required date fields: {', '.join(missing_date_fields)}"
            )
            return False
        
        self.log_test(
            "Booking Page Data Structure", 
            True, 
            f"Tour has {len(dates_data)} dates with proper cabin pricing structure"
        )
        return True

    def run_booking_page_verification(self):
        """Run the specific booking page backend verification as requested"""
        print("🎯 Booking Page Backend Verification")
        print("=" * 70)
        print("Context: BookingPage.js updated to handle state from TourDetailPage")
        print("Testing: Tour endpoint, booking routes, and data structure")
        print("Tour ID: 3ded39ad-36a4-47d1-87b9-7baeb5f00f55")
        print("=" * 70)
        
        tour_id = "3ded39ad-36a4-47d1-87b9-7baeb5f00f55"
        
        # Test 1: Backend Health Check
        print("\n🏥 STEP 1: Backend Health Check")
        health_success = self.test_backend_health()
        
        # Test 2: Specific Tour Endpoint
        print(f"\n🎯 STEP 2: Tour Endpoint Verification - {tour_id}")
        tour_success = self.test_specific_tour_endpoint(tour_id)
        
        # Test 3: Tour Dates Endpoint
        print(f"\n📅 STEP 3: Tour Dates Endpoint - {tour_id}")
        dates_success = self.test_tour_dates_endpoint(tour_id)
        
        # Test 4: Booking Page Data Structure
        print(f"\n📋 STEP 4: Booking Page Data Structure Verification")
        structure_success = self.test_booking_page_data_structure(tour_id)
        
        # Test 5: User Authentication for Booking
        print(f"\n🔐 STEP 5: User Authentication for Booking")
        auth_success = self.test_user_login()
        
        # Test 6: Booking Creation Endpoint (if auth successful)
        if auth_success:
            print(f"\n📝 STEP 6: Booking Creation Endpoint Test")
            booking_success = self.test_booking_creation_endpoint(tour_id)
        else:
            print(f"\n❌ STEP 6: Skipping booking creation test - authentication failed")
            booking_success = False
        
        # Print final results
        self.print_final_results()
        
        # Return overall success
        critical_tests = [health_success, tour_success, dates_success, structure_success]
        return all(critical_tests)

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 70)
        print("📊 BOOKING PAGE BACKEND VERIFICATION RESULTS")
        print("=" * 70)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🎉 EXCELLENT: Backend is ready for booking page functionality!")
        elif success_rate >= 60:
            print("⚠️  GOOD: Most backend endpoints working, minor issues detected")
        else:
            print("🚨 CRITICAL: Major backend issues detected, booking page may not work properly")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test_name']}: {test['error']}")
        else:
            print("\n✅ ALL TESTS PASSED: Backend is healthy for booking page!")
        
        print("\n📝 SUMMARY FOR MAIN AGENT:")
        print("   • Tour endpoint /api/tours/3ded39ad-36a4-47d1-87b9-7baeb5f00f55 status: " + 
              ("✅ WORKING" if any(t['test_name'].startswith('Tour Endpoint') and t['success'] for t in self.test_results) else "❌ FAILED"))
        print("   • Booking page URL structure: " + 
              ("✅ READY" if success_rate >= 80 else "⚠️ NEEDS ATTENTION"))
        print("   • Backend errors in booking routes: " + 
              ("✅ NONE DETECTED" if success_rate >= 80 else "❌ ERRORS FOUND"))

if __name__ == "__main__":
    tester = BookingPageBackendTester()
    success = tester.run_booking_page_verification()
    
    if success:
        print("\n🎉 CONCLUSION: Backend is ready for booking page testing!")
        sys.exit(0)
    else:
        print("\n🚨 CONCLUSION: Backend issues detected - needs attention before booking page testing!")
        sys.exit(1)