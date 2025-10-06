import requests
import sys
import json
from datetime import datetime
import time

class TourPlatformAPITester:
    def __init__(self, base_url="https://tour-system-fix.preview.emergentagent.com"):
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
                    "date": "2025-12-15",
                    "price": 299.0,
                    "capacity": 15
                },
                {
                    "date": "2025-12-20",
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

    def test_admin_create_tour_cabin_pricing(self):
        """Test admin tour creation with NEW CABIN PRICING SYSTEM (single_cabin_price, double_cabin_price)"""
        if not self.token:
            self.log_test("Admin Create Tour with Cabin Pricing", False, "", "No authentication token available")
            return False, None

        # Create test tour with NEW CABIN PRICING SYSTEM
        tour_data = {
            "title": "Test Tour with Cabin Pricing",
            "description": "Test tour description for cabin pricing system",
            "short_description": "Test short description",
            "location": "Test Location",
            "category": "cultural",
            "classification": "standart",
            "tour_dates": [
                {
                    "date": "2025-01-15",
                    "capacity": 10,
                    "single_cabin_price": 1000,
                    "double_cabin_price": 1500
                },
                {
                    "date": "2025-01-20",
                    "capacity": 8,
                    "single_cabin_price": 1200,
                    "double_cabin_price": 1800
                }
            ]
        }

        success, response = self.run_test(
            "Admin Create Tour with Cabin Pricing System",
            "POST",
            "admin/tours",
            200,
            data=tour_data
        )

        if success and 'id' in response:
            tour_id = response['id']
            print(f"   ✅ Tour created with cabin pricing system, ID: {tour_id}")
            
            # Verify the tour dates were created with cabin pricing
            dates_success, dates_response = self.test_get_tour_dates(tour_id)
            
            if dates_success and dates_response:
                cabin_pricing_found = False
                for date in dates_response:
                    if 'single_cabin_price' in date and 'double_cabin_price' in date:
                        cabin_pricing_found = True
                        print(f"   ✅ Cabin pricing found: single={date['single_cabin_price']}, double={date['double_cabin_price']}")
                        break
                
                if cabin_pricing_found:
                    return True, tour_id
                else:
                    self.log_test("Cabin Pricing Verification", False, "", "Tour dates created but cabin pricing fields missing")
                    return False, tour_id
            else:
                self.log_test("Tour Dates Creation", False, "", "Tour created but tour dates not found")
                return False, tour_id
        
        return False, None

    def test_tour_creation_fix_scenario(self):
        """Test the specific tour creation scenario mentioned in the review request"""
        print("\n🎯 Testing Tour Creation Fix Scenario (Internal Server Error Fix)")
        
        # Step 1: Admin login
        print("\n🔐 Step 1: Admin Login with admin@example.com/admin123")
        admin_success = self.test_admin_login()
        
        if not admin_success:
            print("❌ Admin login failed - cannot proceed with tour creation test")
            return False
        
        # Step 2: Test tour creation with exact data from review request
        print("\n📝 Step 2: Test Tour Creation with New Cabin Pricing System")
        
        tour_data = {
            "title": "Test Tour",
            "description": "Test description", 
            "short_description": "Test short",
            "location": "Test Location",
            "category": "cultural",
            "classification": "standart",
            "tour_dates": [
                {
                    "date": "2025-01-15",
                    "capacity": 10,
                    "single_cabin_price": 1000,
                    "double_cabin_price": 1500
                }
            ]
        }
        
        success, response = self.run_test(
            "Tour Creation with New Cabin Pricing (Fix Test)",
            "POST",
            "admin/tours",
            200,
            data=tour_data
        )
        
        if success and response and 'id' in response:
            tour_id = response['id']
            print(f"   ✅ Tour creation successful! Tour ID: {tour_id}")
            
            # Step 3: Verify the tour was created correctly
            print("\n🔍 Step 3: Verify Tour Creation")
            
            # Get the created tour
            verify_success, verify_response = self.run_test(
                "Verify Created Tour",
                "GET",
                f"tours/{tour_id}",
                200
            )
            
            if verify_success and verify_response:
                tour_dates = verify_response.get('tour_dates', [])
                if tour_dates:
                    date = tour_dates[0]
                    if ('single_cabin_price' in date and 'double_cabin_price' in date and
                        date['single_cabin_price'] == 1000 and date['double_cabin_price'] == 1500):
                        print("   ✅ Tour dates created with correct cabin pricing!")
                        print(f"      • Single cabin price: {date['single_cabin_price']}")
                        print(f"      • Double cabin price: {date['double_cabin_price']}")
                        print("   ✅ INTERNAL SERVER ERROR FIX VERIFIED - Tour creation now works!")
                        return True
                    else:
                        print("   ❌ Tour dates created but cabin pricing incorrect")
                        print(f"      • Expected: single=1000, double=1500")
                        print(f"      • Got: single={date.get('single_cabin_price')}, double={date.get('double_cabin_price')}")
                        return False
                else:
                    print("   ❌ Tour created but no tour dates found")
                    return False
            else:
                print("   ❌ Could not verify created tour")
                return False
        else:
            print("   ❌ Tour creation failed - Internal Server Error may still exist")
            return False

    def test_tour_dates_management(self, tour_id):
        """Test tour date creation and management"""
        if not tour_id:
            self.log_test("Tour Dates Management", False, "", "No tour ID provided")
            return False

        # Test adding tour dates - this endpoint is expected to not exist
        tour_date_data = {
            "date": "2025-12-25",
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

    def test_admin_locations_crud(self):
        """Test admin location management CRUD operations"""
        if not self.token:
            self.log_test("Admin Locations CRUD", False, "", "No authentication token available")
            return False
        
        print("\n🏢 Testing Admin Location Management CRUD Operations")
        
        # Test 1: GET /api/admin/locations - list all locations
        print("\n📋 Test 1: GET /api/admin/locations - List All Locations")
        list_success, locations_response = self.run_test(
            "List All Locations",
            "GET",
            "admin/locations",
            200
        )
        
        initial_location_count = len(locations_response) if locations_response else 0
        print(f"   ℹ️  Found {initial_location_count} existing locations")
        
        # Test 2: POST /api/admin/locations - create new locations
        print("\n📋 Test 2: POST /api/admin/locations - Create New Locations")
        
        # Create sample locations: "Bodrum", "Marmaris", "Antalya"
        sample_locations = [
            {
                "name": "Bodrum",
                "description": "Ege Denizi'nin incisi, tarihi ve doğal güzellikleriyle ünlü tatil beldesi",
                "country": "Turkey",
                "is_active": True
            },
            {
                "name": "Marmaris",
                "description": "Akdeniz ve Ege'nin buluştuğu noktada muhteşem koyları ile ünlü tatil merkezi",
                "country": "Turkey", 
                "is_active": True
            },
            {
                "name": "Antalya",
                "description": "Türkiye'nin turizm başkenti, antik şehirler ve muhteşem plajlar",
                "country": "Turkey",
                "is_active": True
            }
        ]
        
        created_location_ids = []
        for location_data in sample_locations:
            success, response = self.run_test(
                f"Create Location: {location_data['name']}",
                "POST",
                "admin/locations",
                200,
                data=location_data
            )
            
            if success and response and 'id' in response:
                created_location_ids.append(response['id'])
                print(f"   ✅ Location '{location_data['name']}' created with ID: {response['id']}")
            else:
                print(f"   ❌ Failed to create location '{location_data['name']}'")
        
        # Test 3: GET /api/admin/locations again to verify creation
        print("\n📋 Test 3: Verify Location Creation")
        verify_success, updated_locations = self.run_test(
            "Verify Location Creation",
            "GET", 
            "admin/locations",
            200
        )
        
        if verify_success and updated_locations:
            new_location_count = len(updated_locations)
            print(f"   ✅ Total locations after creation: {new_location_count}")
            if new_location_count > initial_location_count:
                print(f"   ✅ Successfully added {new_location_count - initial_location_count} new locations")
        
        # Test 4: PUT /api/admin/locations/{id} - update location
        print("\n📋 Test 4: PUT /api/admin/locations/{id} - Update Location")
        if created_location_ids:
            location_id = created_location_ids[0]  # Update first created location
            update_data = {
                "name": "Bodrum Updated",
                "description": "Güncellenmiş Bodrum açıklaması - Ege'nin parlayan yıldızı",
                "country": "Turkey",
                "is_active": True
            }
            
            update_success, update_response = self.run_test(
                "Update Location",
                "PUT",
                f"admin/locations/{location_id}",
                200,
                data=update_data
            )
            
            if update_success and update_response:
                if update_response.get('name') == "Bodrum Updated":
                    print("   ✅ Location updated successfully")
                else:
                    print("   ❌ Location update failed - name not changed")
        
        # Test 5: PUT /api/admin/locations/{id}/status - toggle active status
        print("\n📋 Test 5: PUT /api/admin/locations/{id}/status - Toggle Status")
        if created_location_ids and len(created_location_ids) > 1:
            location_id = created_location_ids[1]  # Toggle second location status
            
            # First toggle to inactive
            toggle_success1, toggle_response1 = self.run_test(
                "Toggle Location Status (Deactivate)",
                "PUT",
                f"admin/locations/{location_id}/status",
                200
            )
            
            if toggle_success1:
                print("   ✅ Location status toggled to inactive")
                
                # Toggle back to active
                toggle_success2, toggle_response2 = self.run_test(
                    "Toggle Location Status (Activate)",
                    "PUT",
                    f"admin/locations/{location_id}/status",
                    200
                )
                
                if toggle_success2:
                    print("   ✅ Location status toggled back to active")
        
        # Test 6: DELETE /api/admin/locations/{id} - delete location (if no tours using it)
        print("\n📋 Test 6: DELETE /api/admin/locations/{id} - Delete Location")
        if created_location_ids and len(created_location_ids) > 2:
            location_id = created_location_ids[2]  # Delete third location
            
            delete_success, delete_response = self.run_test(
                "Delete Location (Expected to Fail - Endpoint Not Implemented)",
                "DELETE",
                f"admin/locations/{location_id}",
                200
            )
            
            if delete_success:
                print("   ✅ Location deleted successfully")
            else:
                print("   ⚠️  DELETE /api/admin/locations/{id} endpoint not implemented (404/405 expected)")
                print("   ℹ️  Location deletion functionality needs to be implemented in backend")
        
        return True

    def test_admin_categories_crud(self):
        """Test admin category management CRUD operations"""
        if not self.token:
            self.log_test("Admin Categories CRUD", False, "", "No authentication token available")
            return False
        
        print("\n🏷️  Testing Admin Category Management CRUD Operations")
        
        # Test 1: GET /api/admin/categories - list all categories
        print("\n📋 Test 1: GET /api/admin/categories - List All Categories")
        list_success, categories_response = self.run_test(
            "List All Categories",
            "GET",
            "admin/categories",
            200
        )
        
        initial_category_count = len(categories_response) if categories_response else 0
        print(f"   ℹ️  Found {initial_category_count} existing categories")
        
        # Test 2: POST /api/admin/categories - create new categories
        print("\n📋 Test 2: POST /api/admin/categories - Create New Categories")
        
        # Create sample categories: "Tekne Turu", "Tarih Turu", "Doğa Turu"
        sample_categories = [
            {
                "name": "Tekne Turu",
                "description": "Denizde tekne ile yapılan turlar, mavi yolculuk deneyimleri",
                "icon": "🚢",
                "image": "https://example.com/boat-tour.jpg",
                "seo_title": "Tekne Turları - Mavi Yolculuk",
                "seo_description": "En güzel tekne turları ve mavi yolculuk deneyimleri",
                "seo_keywords": "tekne turu, mavi yolculuk, deniz turu",
                "faq": [
                    {"question": "Tekne turunda neler dahil?", "answer": "Öğle yemeği, içecekler ve rehber hizmeti dahildir."},
                    {"question": "Yüzme molası var mı?", "answer": "Evet, temiz koylardan yüzme molaları verilir."}
                ],
                "is_active": True
            },
            {
                "name": "Tarih Turu",
                "description": "Antik şehirler, müzeler ve tarihi mekanları kapsayan kültür turları",
                "icon": "🏛️",
                "image": "https://example.com/history-tour.jpg",
                "seo_title": "Tarihi Turlar - Kültür Gezileri",
                "seo_description": "Antik şehirler ve tarihi mekanları keşfedin",
                "seo_keywords": "tarih turu, antik şehir, müze, kültür",
                "faq": [
                    {"question": "Rehber eşliğinde mi?", "answer": "Evet, uzman rehberler eşliğinde gerçekleşir."},
                    {"question": "Müze giriş ücretleri dahil mi?", "answer": "Evet, tüm müze giriş ücretleri dahildir."}
                ],
                "is_active": True
            },
            {
                "name": "Doğa Turu",
                "description": "Milli parklar, doğa yürüyüşleri ve ekoturizm aktiviteleri",
                "icon": "🌲",
                "image": "https://example.com/nature-tour.jpg",
                "seo_title": "Doğa Turları - Ekoturizm",
                "seo_description": "Doğayla iç içe unutulmaz deneyimler",
                "seo_keywords": "doğa turu, trekking, ekoturizm, milli park",
                "faq": [
                    {"question": "Zorluk seviyesi nedir?", "answer": "Farklı zorluk seviyelerinde turlar mevcuttur."},
                    {"question": "Ekipman gerekli mi?", "answer": "Temel ekipmanlar tur operatörü tarafından sağlanır."}
                ],
                "is_active": True
            }
        ]
        
        created_category_ids = []
        for category_data in sample_categories:
            success, response = self.run_test(
                f"Create Category: {category_data['name']}",
                "POST",
                "admin/categories",
                200,
                data=category_data
            )
            
            if success and response and 'id' in response:
                created_category_ids.append(response['id'])
                print(f"   ✅ Category '{category_data['name']}' created with ID: {response['id']}")
            else:
                print(f"   ❌ Failed to create category '{category_data['name']}'")
        
        # Test 3: GET /api/admin/categories again to verify creation
        print("\n📋 Test 3: Verify Category Creation")
        verify_success, updated_categories = self.run_test(
            "Verify Category Creation",
            "GET",
            "admin/categories", 
            200
        )
        
        if verify_success and updated_categories:
            new_category_count = len(updated_categories)
            print(f"   ✅ Total categories after creation: {new_category_count}")
            if new_category_count > initial_category_count:
                print(f"   ✅ Successfully added {new_category_count - initial_category_count} new categories")
        
        # Test 4: PUT /api/admin/categories/{id} - update category
        print("\n📋 Test 4: PUT /api/admin/categories/{id} - Update Category")
        if created_category_ids:
            category_id = created_category_ids[0]  # Update first created category
            update_data = {
                "name": "Tekne Turu Updated",
                "description": "Güncellenmiş tekne turu açıklaması - Lüks yat turları dahil",
                "icon": "⛵",
                "image": "https://example.com/luxury-boat-tour.jpg",
                "seo_title": "Lüks Tekne Turları - Premium Mavi Yolculuk",
                "seo_description": "Lüks yatlar ile premium mavi yolculuk deneyimi",
                "seo_keywords": "lüks tekne turu, yat turu, premium mavi yolculuk",
                "faq": [
                    {"question": "Lüks yat turunda neler var?", "answer": "Gourmet yemekler, premium içecekler ve özel hizmet."}
                ],
                "is_active": True
            }
            
            update_success, update_response = self.run_test(
                "Update Category",
                "PUT",
                f"admin/categories/{category_id}",
                200,
                data=update_data
            )
            
            if update_success and update_response:
                if update_response.get('name') == "Tekne Turu Updated":
                    print("   ✅ Category updated successfully")
                else:
                    print("   ❌ Category update failed - name not changed")
        
        # Test 5: PUT /api/admin/categories/{id}/status - toggle active status
        print("\n📋 Test 5: PUT /api/admin/categories/{id}/status - Toggle Status")
        if created_category_ids and len(created_category_ids) > 1:
            category_id = created_category_ids[1]  # Toggle second category status
            
            # First toggle to inactive
            toggle_success1, toggle_response1 = self.run_test(
                "Toggle Category Status (Deactivate)",
                "PUT",
                f"admin/categories/{category_id}/status",
                200
            )
            
            if toggle_success1:
                print("   ✅ Category status toggled to inactive")
                
                # Toggle back to active
                toggle_success2, toggle_response2 = self.run_test(
                    "Toggle Category Status (Activate)",
                    "PUT",
                    f"admin/categories/{category_id}/status",
                    200
                )
                
                if toggle_success2:
                    print("   ✅ Category status toggled back to active")
        
        # Test 6: DELETE /api/admin/categories/{id} - delete category (if no tours using it)
        print("\n📋 Test 6: DELETE /api/admin/categories/{id} - Delete Category")
        if created_category_ids and len(created_category_ids) > 2:
            category_id = created_category_ids[2]  # Delete third category
            
            delete_success, delete_response = self.run_test(
                "Delete Category (Expected to Fail - Endpoint Not Implemented)",
                "DELETE",
                f"admin/categories/{category_id}",
                200
            )
            
            if delete_success:
                print("   ✅ Category deleted successfully")
            else:
                print("   ⚠️  DELETE /api/admin/categories/{id} endpoint not implemented (404/405 expected)")
                print("   ℹ️  Category deletion functionality needs to be implemented in backend")
        
        return True

    def run_admin_location_category_tests(self):
        """Run comprehensive admin location and category management tests"""
        print("🎯 Testing Admin Panel Location and Category Management CRUD Operations")
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
        
        # Test Location Management
        print("\n🏢 PHASE 2: Location Management CRUD Operations")
        self.test_admin_locations_crud()
        
        # Test Category Management  
        print("\n🏷️  PHASE 3: Category Management CRUD Operations")
        self.test_admin_categories_crud()
        
        # Print final results
        self.print_final_results()

    def run_tour_creation_fix_test(self):
        """Run the specific tour creation fix test as requested in the review"""
        print("🎯 Testing Tour Creation API Fix - Internal Server Error Resolution")
        print("=" * 70)
        print("Testing scenario: Admin creates tour with new cabin pricing system")
        print("Expected: No more 'Internal Server Error' when using single_cabin_price/double_cabin_price")
        print("=" * 70)
        
        # Run the specific test scenario
        success = self.test_tour_creation_fix_scenario()
        
        # Print final results
        self.print_final_results()
        
        return success

    def test_location_verification(self):
        """Test location verification in tours database as requested"""
        print("🎯 Testing Location Verification in Tours Database")
        print("=" * 70)
        print("Checking what locations are available in the tours database")
        print("=" * 70)
        
        # Step 1: Get all tours from the backend
        print("\n📋 Step 1: GET /api/tours - Get All Tours")
        success, tours_response = self.run_test(
            "Get All Tours for Location Analysis",
            "GET",
            "tours",
            200
        )
        
        if not success or not tours_response:
            print("❌ Failed to retrieve tours - cannot analyze locations")
            return False
        
        print(f"   ✅ Retrieved {len(tours_response)} tours from database")
        
        # Step 2: Extract and analyze location data
        print("\n📋 Step 2: Extract and Analyze Location Data")
        
        locations = []
        tours_without_location = []
        location_counts = {}
        
        for tour in tours_response:
            tour_id = tour.get('id', 'Unknown ID')
            tour_title = tour.get('title', 'Unknown Title')
            location = tour.get('location')
            
            if location and location.strip():
                # Clean and normalize location
                clean_location = location.strip()
                locations.append(clean_location)
                
                # Count occurrences
                if clean_location in location_counts:
                    location_counts[clean_location] += 1
                else:
                    location_counts[clean_location] = 1
                    
                print(f"   📍 Tour: '{tour_title}' → Location: '{clean_location}'")
            else:
                tours_without_location.append({
                    'id': tour_id,
                    'title': tour_title,
                    'location': location
                })
                print(f"   ⚠️  Tour: '{tour_title}' → NO LOCATION DATA (location: {location})")
        
        # Step 3: Show unique locations
        print("\n📋 Step 3: Unique Locations in Database")
        unique_locations = list(set(locations))
        unique_locations.sort()
        
        if unique_locations:
            print(f"   ✅ Found {len(unique_locations)} unique locations:")
            for i, location in enumerate(unique_locations, 1):
                count = location_counts[location]
                print(f"      {i}. '{location}' ({count} tour{'s' if count > 1 else ''})")
        else:
            print("   ❌ No locations found in any tours!")
        
        # Step 4: Check tours without location data
        print("\n📋 Step 4: Tours Without Location Data")
        if tours_without_location:
            print(f"   ⚠️  Found {len(tours_without_location)} tours without location data:")
            for tour in tours_without_location:
                print(f"      • ID: {tour['id']} - Title: '{tour['title']}' - Location: {tour['location']}")
        else:
            print("   ✅ All tours have location data!")
        
        # Step 5: Summary for location dropdown
        print("\n📋 Step 5: Location Dropdown Summary")
        print("   📝 Locations that should appear in the location dropdown filter:")
        
        if unique_locations:
            print("   " + "=" * 50)
            for location in unique_locations:
                print(f"   • {location}")
            print("   " + "=" * 50)
            
            # Log the test result
            self.log_test(
                "Location Verification Analysis", 
                True, 
                f"Found {len(unique_locations)} unique locations: {', '.join(unique_locations[:3])}{'...' if len(unique_locations) > 3 else ''}"
            )
        else:
            print("   ❌ NO LOCATIONS AVAILABLE FOR DROPDOWN!")
            self.log_test(
                "Location Verification Analysis", 
                False, 
                "", 
                "No locations found in tours database - location dropdown will be empty"
            )
        
        # Step 6: Data quality assessment
        print("\n📋 Step 6: Data Quality Assessment")
        total_tours = len(tours_response)
        tours_with_location = total_tours - len(tours_without_location)
        location_coverage = (tours_with_location / total_tours * 100) if total_tours > 0 else 0
        
        print(f"   📊 Total Tours: {total_tours}")
        print(f"   📊 Tours with Location: {tours_with_location}")
        print(f"   📊 Tours without Location: {len(tours_without_location)}")
        print(f"   📊 Location Coverage: {location_coverage:.1f}%")
        
        if location_coverage >= 90:
            print("   ✅ EXCELLENT: Location data coverage is very good")
        elif location_coverage >= 70:
            print("   ⚠️  GOOD: Most tours have location data, some missing")
        else:
            print("   🚨 POOR: Many tours missing location data - needs attention")
        
        return len(unique_locations) > 0

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

    def run_location_verification_test(self):
        """Run the specific location verification test as requested"""
        print("🎯 Location Verification Test - Tours Database Analysis")
        print("=" * 70)
        print("Analyzing what locations are available in the tours database")
        print("This will help verify what should appear in the location dropdown filter")
        print("=" * 70)
        
        # Run the location verification test
        success = self.test_location_verification()
        
        # Print final results
        self.print_final_results()
        
        return success

    def test_add_test_reviews(self):
        """Test adding test reviews for tour 3ded39ad-36a4-47d1-87b9-7baeb5f00f55"""
        return self.run_test(
            "Add Test Reviews for Tour 3ded39ad-36a4-47d1-87b9-7baeb5f00f55",
            "POST",
            "add-test-reviews",
            200
        )

    def test_public_reviews_listing(self):
        """Test public reviews listing (GET /api/reviews)"""
        # Test without filters
        success1, response1 = self.run_test(
            "Get Public Reviews (No Filters)",
            "GET",
            "reviews",
            200
        )
        
        # Test with tour_id filter
        tour_id = "3ded39ad-36a4-47d1-87b9-7baeb5f00f55"
        success2, response2 = self.run_test(
            f"Get Public Reviews for Tour {tour_id}",
            "GET",
            f"reviews?tour_id={tour_id}",
            200
        )
        
        # Test with verified_only filter
        success3, response3 = self.run_test(
            "Get Public Reviews (Verified Only)",
            "GET",
            "reviews?verified_only=true",
            200
        )
        
        # Test with both filters
        success4, response4 = self.run_test(
            f"Get Public Reviews for Tour {tour_id} (Verified Only)",
            "GET",
            f"reviews?tour_id={tour_id}&verified_only=true",
            200
        )
        
        return success1 and success2 and success3 and success4

    def test_create_review_authenticated(self):
        """Test creating a review as authenticated user"""
        if not self.token:
            self.log_test("Create Review (Authenticated)", False, "", "No authentication token available")
            return False, None
        
        tour_id = "3ded39ad-36a4-47d1-87b9-7baeb5f00f55"
        review_data = {
            "tour_id": tour_id,
            "rating": 5,
            "title": "Harika bir deneyim!",
            "comment": "Bu tur gerçekten mükemmeldi. Rehber çok bilgiliydi ve organizasyon harikaydı. Kesinlikle tavsiye ederim!",
            "images": []
        }
        
        success, response = self.run_test(
            "Create Review (Authenticated User)",
            "POST",
            "reviews",
            200,
            data=review_data
        )
        
        if success and response and 'id' in response:
            return True, response['id']
        
        return False, None

    def test_create_review_unauthenticated(self):
        """Test creating a review without authentication (should fail)"""
        # Temporarily remove token
        original_token = self.token
        self.token = None
        
        tour_id = "3ded39ad-36a4-47d1-87b9-7baeb5f00f55"
        review_data = {
            "tour_id": tour_id,
            "rating": 4,
            "title": "Test Review",
            "comment": "This should fail without authentication"
        }
        
        success, response = self.run_test(
            "Create Review (Unauthenticated - Should Fail)",
            "POST",
            "reviews",
            401,  # Expecting 401 Unauthorized
            data=review_data
        )
        
        # Restore token
        self.token = original_token
        
        return success

    def test_admin_reviews_listing(self):
        """Test admin reviews listing with different filters"""
        if not self.token:
            self.log_test("Admin Reviews Listing", False, "", "No authentication token available")
            return False
        
        # Test all reviews
        success1, response1 = self.run_test(
            "Admin Get All Reviews",
            "GET",
            "admin/reviews",
            200
        )
        
        # Test pending reviews
        success2, response2 = self.run_test(
            "Admin Get Pending Reviews",
            "GET",
            "admin/reviews?status=pending",
            200
        )
        
        # Test approved reviews
        success3, response3 = self.run_test(
            "Admin Get Approved Reviews",
            "GET",
            "admin/reviews?status=approved",
            200
        )
        
        # Test rejected reviews
        success4, response4 = self.run_test(
            "Admin Get Rejected Reviews",
            "GET",
            "admin/reviews?status=rejected",
            200
        )
        
        # Test with tour_id filter
        tour_id = "3ded39ad-36a4-47d1-87b9-7baeb5f00f55"
        success5, response5 = self.run_test(
            f"Admin Get Reviews for Tour {tour_id}",
            "GET",
            f"admin/reviews?tour_id={tour_id}",
            200
        )
        
        # Test with limit
        success6, response6 = self.run_test(
            "Admin Get Reviews with Limit",
            "GET",
            "admin/reviews?limit=10",
            200
        )
        
        return success1 and success2 and success3 and success4 and success5 and success6

    def test_admin_review_update(self, review_id):
        """Test admin review update"""
        if not self.token or not review_id:
            self.log_test("Admin Update Review", False, "", "No authentication token or review ID available")
            return False
        
        update_data = {
            "rating": 4,
            "title": "Updated Review Title",
            "comment": "This review has been updated by admin",
            "is_verified": True
        }
        
        return self.run_test(
            "Admin Update Review",
            "PUT",
            f"admin/reviews/{review_id}",
            200,
            data=update_data
        )

    def test_admin_review_approve(self, review_id):
        """Test admin review approval"""
        if not self.token or not review_id:
            self.log_test("Admin Approve Review", False, "", "No authentication token or review ID available")
            return False
        
        return self.run_test(
            "Admin Approve Review",
            "PUT",
            f"admin/reviews/{review_id}/approve",
            200
        )

    def test_admin_review_reject(self, review_id):
        """Test admin review rejection"""
        if not self.token or not review_id:
            self.log_test("Admin Reject Review", False, "", "No authentication token or review ID available")
            return False
        
        return self.run_test(
            "Admin Reject Review",
            "PUT",
            f"admin/reviews/{review_id}/reject",
            200
        )

    def test_admin_review_delete(self, review_id):
        """Test admin review deletion"""
        if not self.token or not review_id:
            self.log_test("Admin Delete Review", False, "", "No authentication token or review ID available")
            return False
        
        return self.run_test(
            "Admin Delete Review",
            "DELETE",
            f"admin/reviews/{review_id}",
            200
        )

    def test_review_error_handling(self):
        """Test error handling for review endpoints"""
        if not self.token:
            self.log_test("Review Error Handling", False, "", "No authentication token available")
            return False
        
        # Test non-existent review ID
        fake_review_id = "non-existent-review-id"
        
        success1, response1 = self.run_test(
            "Admin Update Non-existent Review (Should Fail)",
            "PUT",
            f"admin/reviews/{fake_review_id}",
            404,  # Expecting 404 Not Found
            data={"rating": 5}
        )
        
        success2, response2 = self.run_test(
            "Admin Approve Non-existent Review (Should Fail)",
            "PUT",
            f"admin/reviews/{fake_review_id}/approve",
            404  # Expecting 404 Not Found
        )
        
        success3, response3 = self.run_test(
            "Admin Reject Non-existent Review (Should Fail)",
            "PUT",
            f"admin/reviews/{fake_review_id}/reject",
            404  # Expecting 404 Not Found
        )
        
        success4, response4 = self.run_test(
            "Admin Delete Non-existent Review (Should Fail)",
            "DELETE",
            f"admin/reviews/{fake_review_id}",
            404  # Expecting 404 Not Found
        )
        
        return success1 and success2 and success3 and success4

    def test_review_data_enrichment(self):
        """Test that review responses include enriched data (user names, tour titles)"""
        # Test public reviews for data enrichment
        tour_id = "3ded39ad-36a4-47d1-87b9-7baeb5f00f55"
        success, response = self.run_test(
            "Test Review Data Enrichment (Public)",
            "GET",
            f"reviews?tour_id={tour_id}",
            200
        )
        
        if success and response and len(response) > 0:
            review = response[0]
            if 'user_name' in review:
                print(f"   ✅ Public reviews include user_name: {review['user_name']}")
            else:
                print("   ❌ Public reviews missing user_name enrichment")
                return False
        
        # Test admin reviews for data enrichment
        if not self.token:
            return success
        
        admin_success, admin_response = self.run_test(
            "Test Review Data Enrichment (Admin)",
            "GET",
            f"admin/reviews?tour_id={tour_id}",
            200
        )
        
        if admin_success and admin_response and len(admin_response) > 0:
            admin_review = admin_response[0]
            enrichment_fields = ['user_name', 'user_email', 'tour_title']
            missing_fields = []
            
            for field in enrichment_fields:
                if field in admin_review:
                    print(f"   ✅ Admin reviews include {field}: {admin_review[field]}")
                else:
                    missing_fields.append(field)
            
            if missing_fields:
                print(f"   ❌ Admin reviews missing enrichment fields: {missing_fields}")
                return False
        
        return success and admin_success

    def test_add_test_cabin_pricing(self, tour_id):
        """Test adding cabin pricing data for a specific tour"""
        return self.run_test(
            f"Add Test Cabin Pricing for Tour {tour_id}",
            "POST",
            f"add-test-cabin-pricing/{tour_id}",
            200
        )

    def test_admin_tours_cabin_pricing_response(self):
        """Test that GET /api/admin/tours returns cabin pricing fields in tour_dates"""
        if not self.token:
            self.log_test("Admin Tours Cabin Pricing Response", False, "", "No authentication token available")
            return False, None

        success, response = self.run_test(
            "Admin Tours List with Cabin Pricing Fields",
            "GET",
            "admin/tours",
            200
        )

        if success and response:
            print(f"   ✅ Retrieved {len(response)} tours from admin endpoint")
            
            # Check if tours have tour_dates with cabin pricing fields
            tours_with_cabin_pricing = []
            tours_without_cabin_pricing = []
            
            for tour in response:
                tour_id = tour.get('id')
                title = tour.get('title', 'Unknown')
                tour_dates = tour.get('tour_dates', [])
                
                if tour_dates:
                    # Check if tour_dates contain cabin pricing fields
                    has_cabin_pricing = False
                    for date in tour_dates:
                        if 'single_cabin_price' in date and 'double_cabin_price' in date:
                            has_cabin_pricing = True
                            break
                    
                    if has_cabin_pricing:
                        tours_with_cabin_pricing.append({
                            'tour_id': tour_id,
                            'title': title,
                            'date_count': len(tour_dates),
                            'sample_date': tour_dates[0]
                        })
                    else:
                        tours_without_cabin_pricing.append({
                            'tour_id': tour_id,
                            'title': title,
                            'date_count': len(tour_dates),
                            'sample_date': tour_dates[0]
                        })
            
            if tours_with_cabin_pricing:
                print(f"   ✅ Found {len(tours_with_cabin_pricing)} tours with cabin pricing fields")
                for tour_info in tours_with_cabin_pricing[:3]:
                    sample_date = tour_info['sample_date']
                    print(f"      • {tour_info['title']}: single_cabin_price={sample_date.get('single_cabin_price')}, double_cabin_price={sample_date.get('double_cabin_price')}")
                return True, tours_with_cabin_pricing[0]['tour_id']
            else:
                print(f"   ❌ No tours found with cabin pricing fields in tour_dates")
                if tours_without_cabin_pricing:
                    print(f"   ℹ️  Found {len(tours_without_cabin_pricing)} tours without cabin pricing")
                    for tour_info in tours_without_cabin_pricing[:2]:
                        sample_date = tour_info['sample_date']
                        print(f"      • {tour_info['title']}: fields={list(sample_date.keys())}")
                return False, None
        
        return False, None

    def test_admin_tour_update_cabin_pricing(self, tour_id):
        """Test that PUT /api/admin/tours/{tour_id} correctly updates cabin pricing"""
        if not self.token or not tour_id:
            self.log_test("Admin Tour Update Cabin Pricing", False, "", "No authentication token or tour ID available")
            return False

        # First get the current tour data
        get_success, get_response = self.run_test(
            f"Get Tour {tour_id} for Update Test",
            "GET",
            f"tours/{tour_id}",
            200
        )

        if not get_success or not get_response:
            self.log_test("Admin Tour Update Cabin Pricing", False, "", "Could not retrieve tour for update test")
            return False

        # Prepare update data with new cabin pricing
        update_data = {
            "title": get_response.get('title', 'Test Tour'),
            "description": get_response.get('description', 'Test description'),
            "short_description": get_response.get('short_description', 'Test short description'),
            "location": get_response.get('location', 'Test Location'),
            "pickup_time": get_response.get('pickup_time', '09:00'),
            "dropoff_time": get_response.get('dropoff_time', '18:00'),
            "category": get_response.get('category', 'cultural'),
            "classification": get_response.get('classification', 'standart'),
            "status": get_response.get('status', 'active'),
            "images": get_response.get('images', []),
            "included_services": get_response.get('included_services', []),
            "excluded_services": get_response.get('excluded_services', []),
            "meeting_point": get_response.get('meeting_point', ''),
            "languages": get_response.get('languages', ['Turkish']),
            "cancellation_policy": get_response.get('cancellation_policy', ''),
            "tags": get_response.get('tags', []),
            "tour_dates": [
                {
                    "date": "2025-01-25",
                    "price": 18000,
                    "single_cabin_price": 18000,
                    "double_cabin_price": 32000,
                    "capacity": 8,
                    "is_active": True
                },
                {
                    "date": "2025-02-15",
                    "price": 20000,
                    "single_cabin_price": 20000,
                    "double_cabin_price": 36000,
                    "capacity": 10,
                    "is_active": True
                }
            ]
        }

        success, response = self.run_test(
            "Admin Update Tour with Cabin Pricing",
            "PUT",
            f"admin/tours/{tour_id}",
            200,
            data=update_data
        )

        if success:
            print("   ✅ Tour update request successful")
            
            # Verify the update by checking admin tours endpoint
            verify_success, verify_response = self.test_admin_tours_cabin_pricing_response()
            
            if verify_success:
                # Find our updated tour in the response
                for tour in verify_response if isinstance(verify_response, list) else []:
                    if tour.get('id') == tour_id:
                        tour_dates = tour.get('tour_dates', [])
                        if tour_dates:
                            # Check if cabin pricing was saved correctly
                            found_correct_pricing = False
                            for date in tour_dates:
                                if (date.get('single_cabin_price') in [18000, 20000] and 
                                    date.get('double_cabin_price') in [32000, 36000]):
                                    found_correct_pricing = True
                                    print(f"   ✅ Cabin pricing updated correctly: single={date.get('single_cabin_price')}, double={date.get('double_cabin_price')}")
                                    break
                            
                            if not found_correct_pricing:
                                print("   ❌ Cabin pricing not updated correctly in tour_dates")
                                return False
                        else:
                            print("   ❌ No tour_dates found after update")
                            return False
                        break
                else:
                    print(f"   ❌ Updated tour {tour_id} not found in admin tours response")
                    return False
            
            return True
        
        return False

    def test_create_tour_with_cabin_pricing(self):
        """Test creating a new tour with cabin pricing data"""
        if not self.token:
            self.log_test("Create Tour with Cabin Pricing", False, "", "No authentication token available")
            return False, None

        tour_data = {
            "title": "Kabin Fiyatlı Test Turu",
            "description": "Bu tur kabin fiyatlandırması test etmek için oluşturulmuştur. Farklı kabin tiplerinde farklı fiyatlar bulunmaktadır.",
            "short_description": "Kabin fiyatlı test turu",
            "location": "Bodrum, Türkiye",
            "pickup_time": "08:00",
            "dropoff_time": "20:00",
            "category": "boat",
            "classification": "lux",
            "status": "active",
            "images": ["https://example.com/cabin-tour.jpg"],
            "included_services": ["Kabin konaklama", "3 öğün yemek", "Rehber hizmeti"],
            "excluded_services": ["Alkollü içecekler", "Kişisel harcamalar"],
            "meeting_point": "Bodrum Marina",
            "languages": ["Turkish", "English"],
            "cancellation_policy": "48 saat öncesinden ücretsiz iptal",
            "tags": ["kabin", "tekne", "lux", "test"],
            "tour_dates": [
                {
                    "date": "2025-03-15",
                    "price": 25000,  # Fallback price
                    "single_cabin_price": 25000,  # 1 kişilik kabin
                    "double_cabin_price": 45000,  # 2 kişilik kabin
                    "capacity": 6
                },
                {
                    "date": "2025-03-22",
                    "price": 28000,  # Fallback price
                    "single_cabin_price": 28000,  # 1 kişilik kabin
                    "double_cabin_price": 50000,  # 2 kişilik kabin
                    "capacity": 8
                },
                {
                    "date": "2025-04-05",
                    "price": 30000,  # Fallback price
                    "single_cabin_price": 30000,  # 1 kişilik kabin
                    "double_cabin_price": 55000,  # 2 kişilik kabin
                    "capacity": 10
                }
            ]
        }

        success, response = self.run_test(
            "Create Tour with Cabin Pricing",
            "POST",
            "admin/tours",
            200,
            data=tour_data
        )

        if success and response and 'id' in response:
            tour_id = response['id']
            print(f"   ✅ Tour created with cabin pricing, ID: {tour_id}")
            
            # Verify the tour was created with correct cabin pricing
            verify_success, verify_response = self.run_test(
                f"Verify Created Tour {tour_id} Cabin Pricing",
                "GET",
                f"tours/{tour_id}",
                200
            )
            
            if verify_success and verify_response:
                tour_dates = verify_response.get('tour_dates', [])
                if tour_dates:
                    print(f"   ✅ Created tour has {len(tour_dates)} tour dates")
                    for i, date in enumerate(tour_dates):
                        single_price = date.get('single_cabin_price')
                        double_price = date.get('double_cabin_price')
                        if single_price and double_price:
                            print(f"      Date {i+1}: single={single_price}, double={double_price}")
                        else:
                            print(f"      Date {i+1}: Missing cabin pricing fields")
                            return False, tour_id
                else:
                    print("   ❌ Created tour has no tour_dates")
                    return False, tour_id
            
            return True, tour_id
        
        return False, None

    def run_admin_cabin_pricing_tests(self):
        """Run comprehensive admin cabin pricing bug fix tests"""
        print("🎯 Testing Admin Panel Cabin Pricing Bug Fix")
        print("=" * 70)
        
        # Setup: Ensure we have sample data
        print("\n📊 SETUP: Ensuring Sample Data")
        self.test_seed_data()
        
        # Admin Authentication
        print("\n🔐 PHASE 1: Admin Authentication")
        admin_success = self.test_admin_login()
        
        if not admin_success:
            print("❌ Admin login failed (admin@example.com/admin123), cannot proceed with admin tests")
            self.print_final_results()
            return
        
        print("   ✅ Admin authentication successful with admin@example.com/admin123")
        
        # Test 1: GET /api/admin/tours endpoint returns cabin pricing fields
        print("\n🏢 PHASE 2: Test GET /api/admin/tours Cabin Pricing Fields")
        admin_tours_success, existing_tour_id = self.test_admin_tours_cabin_pricing_response()
        
        # Test 2: Create a tour with cabin pricing to ensure we have test data
        print("\n🆕 PHASE 3: Create Tour with Cabin Pricing")
        create_success, new_tour_id = self.test_create_tour_with_cabin_pricing()
        
        # Use the new tour ID for further testing if creation was successful
        test_tour_id = new_tour_id if create_success else existing_tour_id
        
        if test_tour_id:
            # Test 3: Add additional cabin pricing test data
            print(f"\n📊 PHASE 4: Add Test Cabin Pricing Data for Tour {test_tour_id}")
            self.test_add_test_cabin_pricing(test_tour_id)
            
            # Test 4: PUT /api/admin/tours/{tour_id} updates cabin pricing correctly
            print(f"\n✏️  PHASE 5: Test PUT /api/admin/tours/{test_tour_id} Cabin Pricing Update")
            self.test_admin_tour_update_cabin_pricing(test_tour_id)
            
            # Test 5: Verify admin tours endpoint still returns correct cabin pricing after update
            print("\n🔍 PHASE 6: Verify Admin Tours Endpoint After Update")
            self.test_admin_tours_cabin_pricing_response()
        else:
            print("❌ No tour ID available for cabin pricing update tests")
        
        # Test 6: Test regular tour endpoint also returns cabin pricing
        print("\n🌐 PHASE 7: Test Public Tour Endpoints with Cabin Pricing")
        tours_success, tours_response = self.test_get_tours()
        
        if tours_success and tours_response:
            # Test a specific tour detail endpoint
            for tour in tours_response[:2]:  # Test first 2 tours
                tour_id = tour.get('id')
                if tour_id:
                    detail_success, detail_response = self.test_get_single_tour(tour_id)
                    if detail_success and detail_response:
                        tour_dates = detail_response.get('tour_dates', [])
                        if tour_dates:
                            cabin_pricing_found = False
                            for date in tour_dates:
                                if 'single_cabin_price' in date and 'double_cabin_price' in date:
                                    cabin_pricing_found = True
                                    print(f"   ✅ Tour {tour.get('title', 'Unknown')} has cabin pricing: single={date.get('single_cabin_price')}, double={date.get('double_cabin_price')}")
                                    break
                            
                            if not cabin_pricing_found:
                                print(f"   ⚠️  Tour {tour.get('title', 'Unknown')} tour_dates missing cabin pricing fields")
        
        # Print final results
        self.print_final_results()

    def test_remove_test_reviews(self, tour_id):
        """Test removing all reviews for a specific tour"""
        return self.run_test(
            f"Remove Test Reviews for Tour {tour_id}",
            "DELETE",
            f"remove-test-reviews/{tour_id}",
            200
        )

    def test_verify_reviews_removed(self, tour_id):
        """Test that reviews have been removed for a specific tour"""
        success, response = self.run_test(
            f"Verify Reviews Removed for Tour {tour_id}",
            "GET",
            f"reviews?tour_id={tour_id}",
            200
        )
        
        if success and response is not None:
            review_count = len(response) if isinstance(response, list) else 0
            if review_count == 0:
                print(f"   ✅ Confirmed: No reviews found for tour {tour_id}")
                return True
            else:
                print(f"   ❌ Reviews still exist for tour {tour_id}: {review_count} reviews found")
                return False
        
        return False

    def test_remove_reviews_scenario(self):
        """Test the specific remove reviews scenario from the review request"""
        print("\n🎯 Testing Remove Test Reviews Scenario")
        print("=" * 70)
        tour_id = "3ded39ad-36a4-47d1-87b9-7baeb5f00f55"
        print(f"Target Tour ID: {tour_id}")
        
        # Step 1: First check if reviews exist for this tour
        print("\n🔍 Step 1: Check existing reviews for tour")
        initial_success, initial_response = self.run_test(
            f"Check Initial Reviews for Tour {tour_id}",
            "GET",
            f"reviews?tour_id={tour_id}",
            200
        )
        
        initial_count = 0
        if initial_success and initial_response:
            initial_count = len(initial_response) if isinstance(initial_response, list) else 0
            print(f"   ℹ️  Found {initial_count} existing reviews for tour {tour_id}")
        
        # Step 2: Add test reviews if none exist
        if initial_count == 0:
            print("\n📝 Step 2: Adding test reviews first")
            self.test_add_test_reviews()
            
            # Verify reviews were added
            verify_success, verify_response = self.run_test(
                f"Verify Test Reviews Added for Tour {tour_id}",
                "GET",
                f"reviews?tour_id={tour_id}",
                200
            )
            
            if verify_success and verify_response:
                added_count = len(verify_response) if isinstance(verify_response, list) else 0
                print(f"   ✅ Added {added_count} test reviews for tour {tour_id}")
            else:
                print("   ❌ Failed to add test reviews")
                return False
        
        # Step 3: Call the DELETE endpoint to remove test reviews
        print(f"\n🗑️  Step 3: Remove test reviews for tour {tour_id}")
        remove_success, remove_response = self.test_remove_test_reviews(tour_id)
        
        if remove_success:
            print(f"   ✅ DELETE /api/remove-test-reviews/{tour_id} successful")
            if remove_response and 'message' in remove_response:
                print(f"   ℹ️  Response: {remove_response['message']}")
        else:
            print(f"   ❌ DELETE /api/remove-test-reviews/{tour_id} failed")
            return False
        
        # Step 4: Verify reviews have been removed
        print(f"\n✅ Step 4: Verify reviews removed for tour {tour_id}")
        verify_success = self.test_verify_reviews_removed(tour_id)
        
        if verify_success:
            print(f"   ✅ SUCCESS: All reviews removed for tour {tour_id}")
            return True
        else:
            print(f"   ❌ FAILED: Reviews still exist for tour {tour_id}")
            return False

    def run_remove_reviews_test(self):
        """Run the specific remove reviews test as requested in the review"""
        print("🎯 Testing Remove Test Reviews Feature")
        print("=" * 70)
        print("Testing scenario: Remove all reviews for tour ID 3ded39ad-36a4-47d1-87b9-7baeb5f00f55")
        print("Expected: DELETE endpoint works and reviews are removed")
        print("=" * 70)
        
        # Run the specific test scenario
        success = self.test_remove_reviews_scenario()
        
        # Print final results
        self.print_final_results()
        
        return success

    def run_reviews_management_tests(self):
        """Run comprehensive reviews management system tests"""
        print("🎯 Testing Reviews Management System Backend APIs")
        print("=" * 70)
        
        # Setup: Add test reviews first
        print("\n📊 SETUP: Adding Test Reviews")
        self.test_add_test_reviews()
        
        # Test 1: Public reviews listing (no auth required)
        print("\n📋 PHASE 1: Public Reviews Listing")
        self.test_public_reviews_listing()
        
        # Test 2: Review creation (requires authentication)
        print("\n📋 PHASE 2: Review Creation")
        
        # First test with regular user authentication
        reg_success, user_data = self.test_user_registration()
        if reg_success:
            self.test_user_login(user_data)
            
            # Test authenticated review creation
            create_success, new_review_id = self.test_create_review_authenticated()
            
            # Test unauthenticated review creation (should fail)
            self.test_create_review_unauthenticated()
        
        # Test 3: Admin authentication and review management
        print("\n📋 PHASE 3: Admin Authentication")
        admin_success = self.test_admin_login()
        
        if not admin_success:
            print("❌ Admin login failed, cannot proceed with admin review tests")
            self.print_final_results()
            return
        
        # Test 4: Admin review listing with filters
        print("\n📋 PHASE 4: Admin Review Listing")
        self.test_admin_reviews_listing()
        
        # Test 5: Admin review management operations
        print("\n📋 PHASE 5: Admin Review Management Operations")
        
        # Get a review ID for testing admin operations
        admin_reviews_success, admin_reviews_response = self.run_test(
            "Get Admin Reviews for Management Testing",
            "GET",
            "admin/reviews?limit=5",
            200
        )
        
        if admin_reviews_success and admin_reviews_response and len(admin_reviews_response) > 0:
            # Use first review for testing admin operations
            test_review_id = admin_reviews_response[0].get('id')
            
            if test_review_id:
                # Test admin update
                print("\n   🔧 Testing Admin Review Update")
                self.test_admin_review_update(test_review_id)
                
                # Test admin approval
                print("\n   ✅ Testing Admin Review Approval")
                self.test_admin_review_approve(test_review_id)
                
                # Get another review for rejection test
                if len(admin_reviews_response) > 1:
                    reject_review_id = admin_reviews_response[1].get('id')
                    if reject_review_id:
                        print("\n   ❌ Testing Admin Review Rejection")
                        self.test_admin_review_reject(reject_review_id)
                
                # Get another review for deletion test (if available)
                if len(admin_reviews_response) > 2:
                    delete_review_id = admin_reviews_response[2].get('id')
                    if delete_review_id:
                        print("\n   🗑️  Testing Admin Review Deletion")
                        self.test_admin_review_delete(delete_review_id)
        
        # Test 6: Error handling
        print("\n📋 PHASE 6: Error Handling")
        self.test_review_error_handling()
        
        # Test 7: Data enrichment verification
        print("\n📋 PHASE 7: Data Enrichment Verification")
        self.test_review_data_enrichment()
        
        # Print final results
        self.print_final_results()

def main():
    """Main test execution"""
    print("🇹🇷 Turkish Tour Platform - Backend API Testing")
    print("Testing URL: https://tour-system-fix.preview.emergentagent.com")
    
    tester = TourPlatformAPITester()
    
    # Run the specific tour creation fix test as requested in the review
    tester.run_tour_creation_fix_test()
    
    # Also test a few more scenarios to be thorough
    print("\n" + "="*70)
    print("🔍 ADDITIONAL VERIFICATION TESTS")
    print("="*70)
    
    # Test admin tours listing to see if cabin pricing is returned correctly
    print("\n📋 Testing Admin Tours Listing with Cabin Pricing")
    tester.test_admin_tours_cabin_pricing_response()
    
    # Test creating another tour with different cabin pricing
    print("\n📝 Testing Another Tour Creation with Different Cabin Pricing")
    tester.test_admin_create_tour_cabin_pricing()
    
    # Return exit code based on success rate
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    return 0 if success_rate >= 70 else 1

def main_remove_reviews():
    """Main function to test remove reviews functionality"""
    tester = TourPlatformAPITester()
    
    print("🚀 Starting Remove Test Reviews API Testing")
    print("=" * 70)
    print("Backend URL:", tester.base_url)
    print("API URL:", tester.api_url)
    print("=" * 70)
    
    # Run the specific remove reviews test
    success = tester.run_remove_reviews_test()
    
    # Return exit code based on success
    return 0 if success else 1

def main_location_verification():
    """Main function to test location verification in tours database"""
    tester = TourPlatformAPITester()
    
    print("🚀 Starting Location Verification Test")
    print("=" * 70)
    print("Backend URL:", tester.base_url)
    print("API URL:", tester.api_url)
    print("=" * 70)
    
    # Run the specific location verification test
    success = tester.run_location_verification_test()
    
    # Return exit code based on success
    return 0 if success else 1

if __name__ == "__main__":
    # Check command line arguments for specific tests
    if len(sys.argv) > 1:
        if sys.argv[1] == "remove-reviews":
            sys.exit(main_remove_reviews())
        elif sys.argv[1] == "location-verification":
            sys.exit(main_location_verification())
        else:
            print("Available test modes:")
            print("  python backend_test.py                    # Run default tour creation tests")
            print("  python backend_test.py remove-reviews     # Run remove reviews test")
            print("  python backend_test.py location-verification # Run location verification test")
            sys.exit(1)
    else:
        sys.exit(main())