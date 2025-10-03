import requests
import sys
import json
from datetime import datetime
import time

class TourPlatformAPITester:
    def __init__(self, base_url="https://pakettour.preview.emergentagent.com"):
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

    def test_seed_data(self):
        """Test seeding sample data"""
        return self.run_test(
            "Seed Sample Data",
            "POST",
            "seed-data",
            200
        )

    def test_add_sample_data(self):
        """Test add-sample-data endpoint (alias for seed-data)"""
        # First try the endpoint mentioned in the request
        success, response = self.run_test(
            "Add Sample Data",
            "POST",
            "add-sample-data",
            200
        )
        
        # If that fails, it might be the seed-data endpoint
        if not success:
            print("   ℹ️  add-sample-data endpoint not found, trying seed-data...")
            return self.test_seed_data()
        
        return success, response

    def test_user_registration(self):
        """Test user registration"""
        timestamp = int(time.time())
        test_user_data = {
            "email": f"test_user_{timestamp}@example.com",
            "full_name": "Test User",
            "password": "TestPass123!",
            "phone": "+90 555 123 4567",
            "role": "customer"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            if 'user' in response:
                self.user_id = response['user'].get('id')
            print(f"   ✅ Token obtained: {self.token[:20]}...")
            return True, test_user_data
        
        return False, test_user_data

    def test_user_login(self, user_data):
        """Test user login"""
        login_data = {
            "email": user_data["email"],
            "password": user_data["password"]
        }
        
        success, response = self.run_test(
            "User Login",
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

    def test_get_tours(self):
        """Test getting tours list"""
        return self.run_test(
            "Get Tours List",
            "GET",
            "tours",
            200
        )

    def test_get_tours_with_filters(self):
        """Test getting tours with filters"""
        return self.run_test(
            "Get Tours with Category Filter",
            "GET",
            "tours?category=historical&limit=5",
            200
        )

    def test_get_single_tour(self, tour_id):
        """Test getting a single tour"""
        return self.run_test(
            "Get Single Tour",
            "GET",
            f"tours/{tour_id}",
            200
        )

    def test_get_tour_dates(self, tour_id):
        """Test getting tour dates"""
        return self.run_test(
            "Get Tour Dates",
            "GET",
            f"tours/{tour_id}/dates",
            200
        )

    def test_create_booking(self, tour_id):
        """Test creating a booking"""
        if not self.token:
            self.log_test("Create Booking", False, "", "No authentication token available")
            return False, None

        # First, get available tour dates for this tour
        try:
            dates_success, dates_response = self.test_get_tour_dates(tour_id)
            
            if not dates_success or not dates_response or len(dates_response) == 0:
                self.log_test("Create Booking", False, "", "No tour dates available for booking")
                return False, None
            
            # Use the first available date
            tour_date_id = dates_response[0]['id']
            
            booking_data = {
                "tour_id": tour_id,
                "tour_date_id": tour_date_id,
                "participants": 2,
                "customer_info": {
                    "full_name": "Test Customer",
                    "email": "test@example.com",
                    "phone": "+90 555 123 4567",
                    "id_number": "12345678901"
                },
                "special_requests": "Test booking request"
            }
            
            success, response = self.run_test(
                "Create Booking",
                "POST",
                "bookings",
                200,  # Might be 201 for created
                data=booking_data
            )
            
            if success and 'id' in response:
                return True, response['id']
            
            return False, None
        except Exception as e:
            self.log_test("Create Booking", False, "", f"Exception during booking: {str(e)}")
            return False, None

    def test_get_user_bookings(self):
        """Test getting user bookings"""
        if not self.token:
            self.log_test("Get User Bookings", False, "", "No authentication token available")
            return False

        return self.run_test(
            "Get User Bookings",
            "GET",
            "bookings",
            200
        )

    def test_payment_processing(self, booking_id):
        """Test payment processing"""
        if not self.token or not booking_id:
            self.log_test("Process Payment", False, "", "No authentication token or booking ID available")
            return False

        return self.run_test(
            "Process Payment",
            "POST",
            f"bookings/{booking_id}/pay",
            200
        )

    def test_admin_login(self):
        """Test admin login with provided credentials"""
        admin_login_data = {
            "email": "admin@example.com",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=admin_login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            if 'user' in response:
                self.user_id = response['user'].get('id')
                user_role = response['user'].get('role')
                print(f"   ✅ Admin login successful, role: {user_role}, token: {self.token[:20]}...")
            return True
        
        return False

    def test_admin_dashboard(self):
        """Test admin dashboard (might fail if user is not admin)"""
        if not self.token:
            self.log_test("Admin Dashboard", False, "", "No authentication token available")
            return False

        success, response = self.run_test(
            "Admin Dashboard",
            "GET",
            "admin/dashboard",
            200  # Might be 403 if not admin
        )
        
        # If we get 403, that's expected for non-admin users
        if not success:
            print("   ℹ️  Admin access denied (expected for regular users)")
        
        return success

    def test_admin_tours(self):
        """Test admin tours endpoint"""
        if not self.token:
            self.log_test("Admin Tours", False, "", "No authentication token available")
            return False

        return self.run_test(
            "Admin Tours List",
            "GET",
            "admin/tours",
            200
        )

    def run_comprehensive_test(self):
        """Run all tests in sequence"""
        print("🚀 Starting Comprehensive API Testing for Turkish Tour Platform")
        print("=" * 70)
        
        # Test 1: Seed sample data
        print("\n📊 PHASE 1: Data Setup")
        self.test_seed_data()
        
        # Test 2: User registration and authentication
        print("\n👤 PHASE 2: User Authentication")
        reg_success, user_data = self.test_user_registration()
        
        if reg_success:
            self.test_user_login(user_data)
        else:
            print("❌ Registration failed, skipping login test")
        
        # Test 3: Tours functionality
        print("\n🏛️ PHASE 3: Tours Management")
        tours_success, tours_response = self.test_get_tours()
        self.test_get_tours_with_filters()
        
        # Get a tour ID for further testing
        tour_id = None
        if tours_success and tours_response and len(tours_response) > 0:
            tour_id = tours_response[0].get('id')
            if tour_id:
                self.test_get_single_tour(tour_id)
        
        # Test 4: Booking functionality
        print("\n📅 PHASE 4: Booking System")
        booking_id = None
        if tour_id and self.token:
            booking_success, booking_id = self.test_create_booking(tour_id)
            self.test_get_user_bookings()
            
            # Test payment if booking was created
            if booking_id:
                print("\n💳 PHASE 5: Payment Processing")
                self.test_payment_processing(booking_id)
        
        # Test 5: Admin functionality
        print("\n🔧 PHASE 6: Admin Features")
        self.test_admin_dashboard()
        
        # Test 6: Admin-specific tests with provided credentials
        print("\n👑 PHASE 7: Admin Authentication & Features")
        admin_login_success = self.test_admin_login()
        
        if admin_login_success:
            self.test_admin_dashboard()
            self.test_admin_tours()
        else:
            print("❌ Admin login failed, skipping admin-specific tests")
        
        # Print final results
        self.print_final_results()

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
            print("🎉 EXCELLENT: Backend API is working well!")
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
        
        # Save detailed results
        results_file = f"/app/test_reports/backend_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        try:
            with open(results_file, 'w') as f:
                json.dump({
                    "summary": {
                        "total_tests": self.tests_run,
                        "passed_tests": self.tests_passed,
                        "failed_tests": self.tests_run - self.tests_passed,
                        "success_rate": success_rate,
                        "test_date": datetime.now().isoformat()
                    },
                    "detailed_results": self.test_results
                }, f, indent=2)
            print(f"\n📄 Detailed results saved to: {results_file}")
        except Exception as e:
            print(f"\n⚠️  Could not save results file: {e}")

    def run_specific_admin_tests(self):
        """Run specific tests requested in the review"""
        print("🎯 Running Specific Admin Tests as Requested")
        print("=" * 70)
        
        # Test 1: GET /api/tours - tur listesi
        print("\n📋 Test 1: GET /api/tours - Tour List")
        self.test_get_tours()
        
        # Test 2: GET /api/tours/{tour_id} - tur detayları
        print("\n📋 Test 2: GET /api/tours/{tour_id} - Tour Details")
        tours_success, tours_response = self.test_get_tours()
        if tours_success and tours_response and len(tours_response) > 0:
            tour_id = tours_response[0].get('id')
            if tour_id:
                self.test_get_single_tour(tour_id)
                # Test 5: GET /api/tours/{tour_id}/dates - tour dates
                print("\n📋 Test 5: GET /api/tours/{tour_id}/dates - Tour Dates")
                self.test_get_tour_dates(tour_id)
        
        # Test 3: POST /api/auth/login - admin girişi
        print("\n📋 Test 3: POST /api/auth/login - Admin Login")
        admin_success = self.test_admin_login()
        
        if admin_success:
            # Test 4: GET /api/admin/tours - admin tur listesi
            print("\n📋 Test 4: GET /api/admin/tours - Admin Tour List")
            self.test_admin_tours()
            
            # Test admin dashboard
            print("\n📋 Test Extra: GET /api/admin/dashboard - Admin Dashboard")
            self.test_admin_dashboard()
        
        # Test 6: POST /api/add-sample-data - örnek veri ekleme
        print("\n📋 Test 6: POST /api/add-sample-data - Sample Data Loading")
        self.test_add_sample_data()
        
        # Print final results
        self.print_final_results()

def main():
    """Main test execution"""
    print("🇹🇷 Turkish Tour Platform - Backend API Testing")
    print("Testing URL: https://pakettour.preview.emergentagent.com")
    
    tester = TourPlatformAPITester()
    
    # Run specific tests as requested
    tester.run_specific_admin_tests()
    
    # Return exit code based on success rate
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    return 0 if success_rate >= 70 else 1

if __name__ == "__main__":
    sys.exit(main())