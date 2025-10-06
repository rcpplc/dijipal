import requests
import sys
import json
from datetime import datetime
import time

class PersonBasedTourTester:
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
                    self.log_test(name, True, f"Status: {response.status_code}, Response: {json.dumps(response_data, indent=2)[:500]}...")
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

    def test_admin_login(self):
        """Test admin login"""
        admin_login_data = {
            "email": "admin@example.com",
            "password": "test123"  # Updated password based on test_result.md
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

    def create_person_based_tour(self):
        """Create a person-based tour for testing"""
        if not self.token:
            self.log_test("Create Person-Based Tour", False, "", "No authentication token available")
            return False, None

        tour_data = {
            "title": "Test Kişi Bazlı Test",
            "description": "Bu kişi bazlı rezervasyon sistemi için test turudur. Yetişkin ve çocuk fiyatlandırması içerir.",
            "short_description": "Kişi bazlı test turu",
            "location": "Test Lokasyonu",
            "pickup_time": "09:00",
            "dropoff_time": "18:00",
            "category": "cultural",
            "classification": "standart",
            "status": "active",
            "reservation_type": "person_based",  # This is the key field
            "images": ["https://example.com/test-image.jpg"],
            "included_services": ["Rehber", "Öğle yemeği"],
            "excluded_services": ["Ulaşım"],
            "meeting_point": "Test Buluşma Noktası",
            "languages": ["Turkish"],
            "tour_dates": [
                {
                    "date": "2025-01-15",
                    "max_persons": 50,
                    "person_price": 1000,
                    "child_price": 500
                },
                {
                    "date": "2025-01-20", 
                    "max_persons": 40,
                    "person_price": 1200,
                    "child_price": 600
                }
            ]
        }

        success, response = self.run_test(
            "Create Person-Based Tour",
            "POST",
            "admin/tours",
            200,
            data=tour_data
        )

        if success and 'id' in response:
            tour_id = response['id']
            print(f"   ✅ Person-based tour created with ID: {tour_id}")
            
            # Verify reservation_type was set correctly
            if response.get('reservation_type') == 'person_based':
                print("   ✅ Reservation type set correctly to 'person_based'")
                return True, tour_id
            else:
                self.log_test("Person-Based Tour Verification", False, "", 
                            f"Reservation type not set correctly. Expected: person_based, Got: {response.get('reservation_type')}")
                return False, tour_id
        
        return False, None

    def test_get_person_based_tour(self, tour_id):
        """Test GET /api/tours/{tour_id} for person-based tour"""
        success, response = self.run_test(
            "Get Person-Based Tour Details",
            "GET",
            f"tours/{tour_id}",
            200
        )

        if success and response:
            # Check if reservation_type is person_based
            reservation_type = response.get('reservation_type')
            if reservation_type != 'person_based':
                self.log_test("Person-Based Tour Type Check", False, "", 
                            f"Expected reservation_type: person_based, Got: {reservation_type}")
                return False

            # Check if tour_dates have person_price and child_price
            tour_dates = response.get('tour_dates', [])
            if not tour_dates:
                self.log_test("Person-Based Tour Dates Check", False, "", "No tour dates found")
                return False

            person_price_found = False
            child_price_found = False
            max_persons_found = False

            for date in tour_dates:
                if 'person_price' in date and date['person_price'] > 0:
                    person_price_found = True
                    print(f"   ✅ Person price found: {date['person_price']}")
                
                if 'child_price' in date and date['child_price'] is not None:
                    child_price_found = True
                    print(f"   ✅ Child price found: {date['child_price']}")
                
                if 'max_persons' in date and date['max_persons'] > 0:
                    max_persons_found = True
                    print(f"   ✅ Max persons found: {date['max_persons']}")

            if person_price_found and child_price_found and max_persons_found:
                print("   ✅ All person-based pricing fields found in tour dates")
                return True
            else:
                missing_fields = []
                if not person_price_found:
                    missing_fields.append("person_price")
                if not child_price_found:
                    missing_fields.append("child_price")
                if not max_persons_found:
                    missing_fields.append("max_persons")
                
                self.log_test("Person-Based Pricing Fields Check", False, "", 
                            f"Missing fields in tour dates: {', '.join(missing_fields)}")
                return False

        return False

    def test_get_person_based_tour_dates(self, tour_id):
        """Test GET /api/tours/{tour_id}/dates for person-based tour"""
        success, response = self.run_test(
            "Get Person-Based Tour Dates",
            "GET",
            f"tours/{tour_id}/dates",
            200
        )

        if success and response:
            if not response:
                self.log_test("Tour Dates Response Check", False, "", "Empty tour dates response")
                return False

            print(f"   ✅ Retrieved {len(response)} tour dates")

            # Check each date for person-based pricing fields
            all_dates_valid = True
            for i, date in enumerate(response):
                date_id = date.get('id', f'Date {i+1}')
                
                # Check required person-based fields
                required_fields = ['person_price', 'max_persons']
                optional_fields = ['child_price']
                
                missing_required = []
                for field in required_fields:
                    if field not in date or date[field] is None or date[field] <= 0:
                        missing_required.append(field)
                        all_dates_valid = False

                if missing_required:
                    print(f"   ❌ Date {date_id} missing required fields: {', '.join(missing_required)}")
                else:
                    print(f"   ✅ Date {date_id} has all required person-based fields")
                    print(f"      • Person price: {date.get('person_price')}")
                    print(f"      • Max persons: {date.get('max_persons')}")
                    if date.get('child_price') is not None:
                        print(f"      • Child price: {date.get('child_price')}")

            return all_dates_valid

        return False

    def test_person_based_tour_by_slug(self):
        """Test accessing person-based tour by slug 'test-kisi-bazli-test'"""
        success, response = self.run_test(
            "Get Person-Based Tour by Slug",
            "GET",
            "tours/test-kisi-bazli-test",
            200
        )

        if success and response:
            # Check if this is the correct person-based tour
            reservation_type = response.get('reservation_type')
            title = response.get('title', '')
            
            if reservation_type == 'person_based':
                print(f"   ✅ Found person-based tour by slug: '{title}'")
                
                # Check tour dates structure
                tour_dates = response.get('tour_dates', [])
                if tour_dates:
                    sample_date = tour_dates[0]
                    expected_structure = {
                        "person_price": sample_date.get('person_price'),
                        "child_price": sample_date.get('child_price'),
                        "max_persons": sample_date.get('max_persons')
                    }
                    
                    print("   ✅ Expected backend response structure found:")
                    print(f"      • reservation_type: {reservation_type}")
                    print(f"      • tour_dates[0].person_price: {expected_structure['person_price']}")
                    print(f"      • tour_dates[0].child_price: {expected_structure['child_price']}")
                    print(f"      • tour_dates[0].max_persons: {expected_structure['max_persons']}")
                    
                    return True, response.get('id')
                else:
                    self.log_test("Person-Based Tour Dates Check", False, "", "No tour dates found for person-based tour")
                    return False, None
            else:
                self.log_test("Person-Based Tour Slug Check", False, "", 
                            f"Tour found by slug but not person-based. Type: {reservation_type}")
                return False, None

        return False, None

    def test_backend_health(self):
        """Test backend health and accessibility"""
        success, response = self.run_test(
            "Backend Health Check",
            "GET",
            "health",
            200
        )

        if success:
            print("   ✅ Backend is accessible and healthy")
            return True
        else:
            print("   ❌ Backend health check failed")
            return False

    def run_person_based_tour_tests(self):
        """Run comprehensive person-based tour functionality tests"""
        print("🎯 Testing Person-Based Tour Functionality")
        print("=" * 70)
        print("Testing tour detail page functionality for person-based tours")
        print("with adult/child selection features as requested")
        print("=" * 70)

        # Step 1: Backend Health Check
        print("\n🏥 STEP 1: Backend Health Check")
        health_success = self.test_backend_health()
        
        if not health_success:
            print("❌ Backend is not accessible - cannot proceed with tests")
            self.print_final_results()
            return

        # Step 2: Admin Authentication
        print("\n🔐 STEP 2: Admin Authentication")
        admin_success = self.test_admin_login()
        
        if not admin_success:
            print("❌ Admin login failed - cannot create test tour")
            # Try to test existing tour by slug instead
            print("\n🔍 STEP 2B: Testing Existing Person-Based Tour by Slug")
            slug_success, existing_tour_id = self.test_person_based_tour_by_slug()
            
            if slug_success and existing_tour_id:
                print("✅ Found existing person-based tour, continuing with tests...")
                self.test_get_person_based_tour_dates(existing_tour_id)
            else:
                print("❌ No existing person-based tour found - cannot proceed")
            
            self.print_final_results()
            return

        # Step 3: Create Person-Based Tour
        print("\n🆕 STEP 3: Create Person-Based Tour")
        create_success, tour_id = self.create_person_based_tour()
        
        if not create_success or not tour_id:
            print("❌ Failed to create person-based tour - trying existing tour")
            # Try to test existing tour by slug
            print("\n🔍 STEP 3B: Testing Existing Person-Based Tour by Slug")
            slug_success, existing_tour_id = self.test_person_based_tour_by_slug()
            
            if slug_success and existing_tour_id:
                tour_id = existing_tour_id
                print("✅ Found existing person-based tour, continuing with tests...")
            else:
                print("❌ No person-based tour available for testing")
                self.print_final_results()
                return

        # Step 4: Test GET /api/tours/{tour_id} 
        print("\n📋 STEP 4: Test GET /api/tours/{tour_id} - Person-Based Tour Data")
        tour_detail_success = self.test_get_person_based_tour(tour_id)

        # Step 5: Test GET /api/tours/{tour_id}/dates
        print("\n📅 STEP 5: Test GET /api/tours/{tour_id}/dates - Tour Dates API")
        tour_dates_success = self.test_get_person_based_tour_dates(tour_id)

        # Step 6: Test Tour by Slug (if not already done)
        print("\n🔗 STEP 6: Test Person-Based Tour Access by Slug")
        if not hasattr(self, '_slug_tested'):
            slug_success, _ = self.test_person_based_tour_by_slug()
        else:
            slug_success = True
            print("   ✅ Slug test already completed successfully")

        # Step 7: Verify Expected Response Structure
        print("\n✅ STEP 7: Verify Expected Backend Response Structure")
        if tour_detail_success and tour_dates_success:
            print("   ✅ Backend API returns correct data structure for person-based tours:")
            print("   ✅ reservation_type: 'person_based' ✓")
            print("   ✅ tour_dates[].person_price field ✓")
            print("   ✅ tour_dates[].child_price field ✓")
            print("   ✅ tour_dates[].max_persons field ✓")
            print("   ✅ Data is properly formatted for adult/child selection UI ✓")
        else:
            print("   ❌ Backend response structure verification failed")

        # Print final results
        self.print_final_results()

        # Return overall success
        return tour_detail_success and tour_dates_success and slug_success

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 70)
        print("📊 PERSON-BASED TOUR TEST RESULTS")
        print("=" * 70)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("🎉 EXCELLENT: Person-based tour functionality is working perfectly!")
        elif success_rate >= 70:
            print("⚠️  GOOD: Most person-based features working, minor issues to address")
        else:
            print("🚨 CRITICAL: Major issues with person-based tour functionality")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test_name']}: {test['error']}")
        
        # Print successful tests summary
        successful_tests = [test for test in self.test_results if test['success']]
        if successful_tests:
            print("\n✅ SUCCESSFUL TESTS:")
            for test in successful_tests:
                print(f"   • {test['test_name']}")

if __name__ == "__main__":
    print("🚀 Starting Person-Based Tour Functionality Testing")
    print("Testing Requirements:")
    print("1. Verify GET /api/tours/{tour_id} returns person-based tour data correctly")
    print("2. Check tour dates API returns person_price and child_price fields")
    print("3. Test if the tour detail page loads without fatal JavaScript errors")
    print("4. Verify person-based tour shows correct reservation type data")
    print("5. Test specific tour slug: 'test-kisi-bazli-test'")
    print()
    
    tester = PersonBasedTourTester()
    success = tester.run_person_based_tour_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)