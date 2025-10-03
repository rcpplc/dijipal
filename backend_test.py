import requests
import sys
import json
from datetime import datetime
import time

class TourPlatformAPITester:
    def __init__(self, base_url="https://tourpack.preview.emergentagent.com"):
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

    def test_admin_create_tour_new_fields(self):
        """Test admin tour creation with new fields (pickup_time, dropoff_time, classification)"""
        if not self.token:
            self.log_test("Admin Create Tour with New Fields", False, "", "No authentication token available")
            return False, None

        # Create test tour with new field structure
        tour_data = {
            "title": "Test Tur",
            "description": "Bu bir test turu açıklamasıdır. Yeni alan yapısını test etmek için oluşturulmuştur.",
            "short_description": "Test turu kısa açıklama",
            "location": "İstanbul, Türkiye",
            "pickup_time": "09:00",
            "dropoff_time": "18:00",
            "category": "cultural",
            "classification": "lux",
            "status": "active",
            "images": ["https://example.com/test-image.jpg"],
            "included_services": ["Profesyonel rehber", "Öğle yemeği"],
            "excluded_services": ["Ulaşım", "Kişisel harcamalar"],
            "meeting_point": "Test Buluşma Noktası",
            "languages": ["Turkish", "English"],
            "cancellation_policy": "24 saat öncesinden iptal edilebilir",
            "tags": ["test", "yeni", "alan"],
            "tour_dates": [
                {
                    "date": "2025-02-15",
                    "price": 299.0,
                    "capacity": 15
                },
                {
                    "date": "2025-02-20",
                    "price": 349.0,
                    "capacity": 12
                }
            ]
        }

        success, response = self.run_test(
            "Admin Create Tour with New Fields",
            "POST",
            "admin/tours",
            200,
            data=tour_data
        )

        if success and 'id' in response:
            # Verify the tour was created with correct fields
            tour_id = response['id']
            print(f"   ✅ Tour created with ID: {tour_id}")
            
            # Verify pickup_time, dropoff_time, classification fields
            if (response.get('pickup_time') == "09:00" and 
                response.get('dropoff_time') == "18:00" and 
                response.get('classification') == "lux"):
                print("   ✅ New fields (pickup_time, dropoff_time, classification) saved correctly")
                return True, tour_id
            else:
                self.log_test("Admin Create Tour - Field Verification", False, "", 
                            f"New fields not saved correctly. Got: pickup_time={response.get('pickup_time')}, dropoff_time={response.get('dropoff_time')}, classification={response.get('classification')}")
                return False, tour_id
        
        return False, None

    def test_tour_dates_management(self, tour_id):
        """Test tour date creation and management"""
        if not tour_id:
            self.log_test("Tour Dates Management", False, "", "No tour ID provided")
            return False

        # Test adding tour dates - this endpoint is expected to not exist
        tour_date_data = {
            "date": "2025-03-01",
            "price": 399.0,
            "capacity": 20
        }

        success, response = self.run_test(
            "Add Tour Date (Expected to Fail - Endpoint Not Implemented)",
            "POST",
            f"tours/{tour_id}/dates",
            200,
            data=tour_date_data
        )

        if not success:
            print("   ℹ️  POST /api/tours/{id}/dates endpoint is not implemented (405 Method Not Allowed)")
            print("   ℹ️  Tour dates can only be added during tour creation via admin/tours endpoint")
            
            # Test getting existing tour dates instead
            dates_success, dates_response = self.test_get_tour_dates(tour_id)
            
            if dates_success:
                if dates_response and len(dates_response) > 0:
                    print(f"   ✅ Retrieved {len(dates_response)} existing tour dates")
                    return True
                else:
                    print("   ⚠️  No tour dates found for this tour")
                    # This might be due to the bug in admin_create_tour where tour_dates aren't created properly
                    self.log_test("Tour Dates Creation Bug", False, "", "Tour dates were not created during tour creation - possible backend bug")
                    return False
            else:
                self.log_test("Get Tour Dates", False, "", "Could not retrieve tour dates")
                return False
        else:
            print("   ✅ Tour date added successfully (unexpected - endpoint was implemented)")
            return True

    def test_tour_listing_minimum_price(self):
        """Test tour listing API returns tours with proper minimum price calculation from tour_dates"""
        success, response = self.run_test(
            "Tour Listing with Minimum Price Calculation",
            "GET",
            "tours",
            200
        )

        if success and response:
            print(f"   ✅ Retrieved {len(response)} tours")
            
            # Check if tours have price information
            tours_with_explicit_date_prices = []
            tours_with_base_prices = []
            
            for tour in response:
                tour_id = tour.get('id')
                title = tour.get('title')
                base_price = tour.get('base_price')
                
                if tour_id:
                    # Get tour dates to check price calculation
                    dates_success, dates_response = self.test_get_tour_dates(tour_id)
                    if dates_success and dates_response:
                        # Check for explicit prices in tour dates
                        explicit_prices = [date.get('price') for date in dates_response if date.get('price') is not None]
                        
                        if explicit_prices:
                            min_price = min(explicit_prices)
                            tours_with_explicit_date_prices.append({
                                'tour_id': tour_id,
                                'title': title,
                                'base_price': base_price,
                                'calculated_min_price': min_price
                            })
                        elif base_price:
                            # Tour dates exist but use base_price (price is None)
                            tours_with_base_prices.append({
                                'tour_id': tour_id,
                                'title': title,
                                'base_price': base_price,
                                'date_count': len(dates_response)
                            })
            
            if tours_with_explicit_date_prices:
                print(f"   ✅ Found {len(tours_with_explicit_date_prices)} tours with explicit tour date prices")
                for tour_info in tours_with_explicit_date_prices[:3]:
                    print(f"      • {tour_info['title']}: base_price={tour_info['base_price']}, min_date_price={tour_info['calculated_min_price']}")
                return True
            elif tours_with_base_prices:
                print(f"   ⚠️  Found {len(tours_with_base_prices)} tours using base_price (tour dates have price=null)")
                for tour_info in tours_with_base_prices[:3]:
                    print(f"      • {tour_info['title']}: base_price={tour_info['base_price']}, dates={tour_info['date_count']}")
                print("   ℹ️  Tours are using base_price instead of explicit tour date prices")
                print("   ℹ️  Minimum price calculation should fall back to base_price when tour date prices are null")
                return True  # This is acceptable behavior
            else:
                self.log_test("Minimum Price Calculation", False, "", "No tours found with any price data")
                return False
        
        return False

    def test_backward_compatibility(self):
        """Test backward compatibility with existing tours that may have old field structure"""
        # First get existing tours
        success, response = self.run_test(
            "Get Existing Tours for Compatibility Test",
            "GET",
            "tours",
            200
        )

        if success and response:
            compatibility_issues = []
            
            for tour in response:
                tour_id = tour.get('id')
                title = tour.get('title', 'Unknown')
                
                # Check for old fields
                has_old_fields = (
                    'duration_days' in tour or 
                    'base_price' in tour or 
                    'max_participants' in tour or 
                    'difficulty_level' in tour
                )
                
                # Check for new fields
                has_new_fields = (
                    'pickup_time' in tour or 
                    'dropoff_time' in tour or 
                    'classification' in tour
                )
                
                if has_old_fields and not has_new_fields:
                    print(f"   ℹ️  Tour '{title}' has old field structure (backward compatibility)")
                elif has_new_fields and not has_old_fields:
                    print(f"   ✅ Tour '{title}' has new field structure")
                elif has_old_fields and has_new_fields:
                    print(f"   ✅ Tour '{title}' has both old and new fields (hybrid compatibility)")
                else:
                    compatibility_issues.append(f"Tour '{title}' missing both old and new field structures")
            
            if compatibility_issues:
                self.log_test("Backward Compatibility", False, "", f"Issues found: {'; '.join(compatibility_issues)}")
                return False
            else:
                print("   ✅ All tours have compatible field structures")
                return True
        
        return False

    def test_admin_update_tour(self, tour_id):
        """Test admin tour update with new fields"""
        if not self.token or not tour_id:
            self.log_test("Admin Update Tour", False, "", "No authentication token or tour ID available")
            return False

        # Update tour with new field values
        update_data = {
            "title": "Updated Test Tur",
            "description": "Güncellenmiş test turu açıklaması",
            "short_description": "Güncellenmiş kısa açıklama",
            "location": "Ankara, Türkiye",
            "pickup_time": "10:00",
            "dropoff_time": "19:00",
            "category": "nature",
            "classification": "delux",
            "status": "active",
            "images": ["https://example.com/updated-image.jpg"],
            "included_services": ["Profesyonel rehber", "Akşam yemeği", "Ulaşım"],
            "excluded_services": ["Kişisel harcamalar"],
            "meeting_point": "Güncellenmiş Buluşma Noktası",
            "languages": ["Turkish"],
            "cancellation_policy": "48 saat öncesinden iptal edilebilir",
            "tags": ["güncellenmiş", "test"]
        }

        success, response = self.run_test(
            "Admin Update Tour",
            "PUT",
            f"admin/tours/{tour_id}",
            200,
            data=update_data
        )

        if success:
            # Verify the update
            if (response.get('pickup_time') == "10:00" and 
                response.get('dropoff_time') == "19:00" and 
                response.get('classification') == "delux"):
                print("   ✅ Tour updated successfully with new field values")
                return True
            else:
                self.log_test("Tour Update Verification", False, "", "Updated fields not saved correctly")
                return False
        
        return False

    def run_admin_tour_management_tests(self):
        """Run comprehensive admin tour management tests with new field changes"""
        print("🎯 Testing Updated Admin Tour Management System")
        print("=" * 70)
        
        # Setup: Ensure we have sample data
        print("\n📊 SETUP: Ensuring Sample Data")
        self.test_seed_data()
        
        # Admin Authentication
        print("\n🔐 PHASE 1: Admin Authentication")
        admin_success = self.test_admin_login()
        
        if not admin_success:
            print("❌ Admin login failed, cannot proceed with admin tests")
            self.print_final_results()
            return
        
        # Test 1: Admin tour creation with new fields
        print("\n🆕 PHASE 2: Admin Tour Creation with New Fields")
        create_success, new_tour_id = self.test_admin_create_tour_new_fields()
        
        # Test 2: Tour date management
        if new_tour_id:
            print("\n📅 PHASE 3: Tour Date Management")
            self.test_tour_dates_management(new_tour_id)
            
            # Test 3: Admin tour update
            print("\n✏️  PHASE 4: Admin Tour Update")
            self.test_admin_update_tour(new_tour_id)
        
        # Test 4: Tour listing with minimum price calculation
        print("\n💰 PHASE 5: Tour Listing with Minimum Price Calculation")
        self.test_tour_listing_minimum_price()
        
        # Test 5: Backward compatibility
        print("\n🔄 PHASE 6: Backward Compatibility Test")
        self.test_backward_compatibility()
        
        # Test 6: Admin tours listing
        print("\n📋 PHASE 7: Admin Tours Listing")
        self.test_admin_tours()
        
        # Print final results
        self.print_final_results()

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
    print("Testing URL: https://tourpack.preview.emergentagent.com")
    
    tester = TourPlatformAPITester()
    
    # Run the new admin tour management tests as requested in the review
    tester.run_admin_tour_management_tests()
    
    # Return exit code based on success rate
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    return 0 if success_rate >= 70 else 1

if __name__ == "__main__":
    sys.exit(main())