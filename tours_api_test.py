import requests
import sys
import json
from datetime import datetime
import time

class ToursAPITester:
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
        
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)

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

    def test_tours_api_basic(self):
        """Test 1: GET /api/tours - Check if tours are being returned"""
        print("\n🎯 TEST 1: GET /api/tours - Basic Tours API Test")
        success, response = self.run_test(
            "GET /api/tours - Basic Tours Retrieval",
            "GET",
            "tours",
            200
        )
        
        if success and response:
            tour_count = len(response) if isinstance(response, list) else 0
            print(f"   📊 Retrieved {tour_count} tours from API")
            
            if tour_count == 0:
                print("   ⚠️  WARNING: API returned 0 tours - this explains why frontend shows '0 tur bulundu'")
                self.log_test("Tours Count Check", False, "", "API returned 0 tours - no data available")
                return False, response
            else:
                print(f"   ✅ API returned {tour_count} tours successfully")
                return True, response
        else:
            print("   ❌ Failed to retrieve tours from API")
            return False, {}

    def test_tours_location_data(self, tours_data):
        """Test 2: Verify tours have location data (should show 'Muğla, Fethiye' and 'Muğla, Göcek')"""
        print("\n🎯 TEST 2: Verify Tours Have Location Data")
        
        if not tours_data or len(tours_data) == 0:
            print("   ❌ No tours data provided for location verification")
            self.log_test("Location Data Verification", False, "", "No tours data available")
            return False
        
        locations_found = []
        tours_without_location = []
        
        for tour in tours_data:
            tour_id = tour.get('id', 'Unknown')
            tour_title = tour.get('title', 'Unknown Title')
            location = tour.get('location')
            
            if location and location.strip():
                locations_found.append(location.strip())
                print(f"   📍 Tour: '{tour_title}' → Location: '{location}'")
            else:
                tours_without_location.append({
                    'id': tour_id,
                    'title': tour_title
                })
                print(f"   ⚠️  Tour: '{tour_title}' → NO LOCATION DATA")
        
        # Check for expected locations
        unique_locations = list(set(locations_found))
        expected_locations = ["Muğla, Fethiye", "Muğla, Göcek"]
        
        print(f"\n   📊 Location Analysis:")
        print(f"   • Total tours: {len(tours_data)}")
        print(f"   • Tours with location: {len(locations_found)}")
        print(f"   • Tours without location: {len(tours_without_location)}")
        print(f"   • Unique locations found: {len(unique_locations)}")
        
        if unique_locations:
            print(f"   📍 Locations in database:")
            for i, location in enumerate(unique_locations, 1):
                print(f"      {i}. '{location}'")
        
        # Check if expected locations are present
        expected_found = []
        for expected_loc in expected_locations:
            if expected_loc in unique_locations:
                expected_found.append(expected_loc)
                print(f"   ✅ Expected location found: '{expected_loc}'")
            else:
                print(f"   ❌ Expected location missing: '{expected_loc}'")
        
        if len(expected_found) == len(expected_locations):
            print(f"   ✅ All expected locations found: {expected_found}")
            self.log_test("Location Data Verification", True, f"Found expected locations: {expected_found}")
            return True
        elif len(expected_found) > 0:
            print(f"   ⚠️  Partial success: Found {len(expected_found)}/{len(expected_locations)} expected locations")
            self.log_test("Location Data Verification", True, f"Partial: Found {expected_found}, Missing: {set(expected_locations) - set(expected_found)}")
            return True
        else:
            print(f"   ❌ None of the expected locations found")
            self.log_test("Location Data Verification", False, "", f"Expected locations {expected_locations} not found. Found: {unique_locations}")
            return False

    def test_tours_with_no_filters(self):
        """Test 3: Check if any filters are causing issues (test with no query parameters)"""
        print("\n🎯 TEST 3: GET /api/tours with No Query Parameters")
        success, response = self.run_test(
            "GET /api/tours (No Filters)",
            "GET",
            "tours",
            200
        )
        
        if success and response:
            tour_count = len(response) if isinstance(response, list) else 0
            print(f"   ✅ No filters test successful - {tour_count} tours returned")
            return True, response
        else:
            print("   ❌ No filters test failed")
            return False, {}

    def test_tours_with_filters(self):
        """Test 4: Test various filter combinations to identify issues"""
        print("\n🎯 TEST 4: GET /api/tours with Various Filters")
        
        filter_tests = [
            ("category filter", "tours?category=cultural"),
            ("location filter", "tours?location=Muğla"),
            ("location filter (Fethiye)", "tours?location=Fethiye"),
            ("location filter (Göcek)", "tours?location=Göcek"),
            ("price filter", "tours?min_price=1000&max_price=20000"),
            ("duration filter", "tours?duration_days=4"),
            ("limit filter", "tours?limit=10"),
            ("skip filter", "tours?skip=0&limit=5"),
            ("combined filters", "tours?category=cultural&location=Muğla&limit=5")
        ]
        
        all_passed = True
        filter_results = {}
        
        for filter_name, endpoint in filter_tests:
            print(f"\n   🔍 Testing {filter_name}...")
            success, response = self.run_test(
                f"Tours API with {filter_name}",
                "GET",
                endpoint,
                200
            )
            
            if success and response:
                tour_count = len(response) if isinstance(response, list) else 0
                print(f"      ✅ {filter_name}: {tour_count} tours returned")
                filter_results[filter_name] = tour_count
            else:
                print(f"      ❌ {filter_name}: Failed")
                filter_results[filter_name] = "FAILED"
                all_passed = False
        
        print(f"\n   📊 Filter Test Summary:")
        for filter_name, result in filter_results.items():
            print(f"      • {filter_name}: {result}")
        
        if all_passed:
            self.log_test("Tours API Filter Tests", True, f"All filter tests passed: {filter_results}")
        else:
            failed_filters = [name for name, result in filter_results.items() if result == "FAILED"]
            self.log_test("Tours API Filter Tests", False, "", f"Failed filters: {failed_filters}")
        
        return all_passed, filter_results

    def test_tour_data_structure(self, tours_data):
        """Test 5: Verify tour data structure is complete"""
        print("\n🎯 TEST 5: Verify Tour Data Structure is Complete")
        
        if not tours_data or len(tours_data) == 0:
            print("   ❌ No tours data provided for structure verification")
            self.log_test("Tour Data Structure", False, "", "No tours data available")
            return False
        
        # Expected fields in tour data
        required_fields = ['id', 'title', 'description', 'location', 'category']
        important_fields = ['images', 'tour_dates', 'rating', 'review_count', 'minimum_price']
        cabin_pricing_fields = ['single_cabin_price', 'double_cabin_price']
        
        structure_issues = []
        tours_analyzed = 0
        
        for tour in tours_data[:3]:  # Analyze first 3 tours
            tours_analyzed += 1
            tour_id = tour.get('id', 'Unknown')
            tour_title = tour.get('title', 'Unknown Title')
            
            print(f"\n   🔍 Analyzing Tour: '{tour_title}' (ID: {tour_id})")
            
            # Check required fields
            missing_required = []
            for field in required_fields:
                if field not in tour or tour[field] is None:
                    missing_required.append(field)
                else:
                    print(f"      ✅ {field}: {str(tour[field])[:50]}{'...' if len(str(tour[field])) > 50 else ''}")
            
            if missing_required:
                print(f"      ❌ Missing required fields: {missing_required}")
                structure_issues.append(f"Tour {tour_id}: Missing required fields {missing_required}")
            
            # Check important fields
            missing_important = []
            for field in important_fields:
                if field not in tour:
                    missing_important.append(field)
                else:
                    value = tour[field]
                    if field == 'tour_dates' and isinstance(value, list):
                        print(f"      ✅ {field}: {len(value)} dates available")
                        
                        # Check tour dates structure for cabin pricing
                        if value:  # If tour dates exist
                            first_date = value[0]
                            has_cabin_pricing = any(field in first_date for field in cabin_pricing_fields)
                            if has_cabin_pricing:
                                single_price = first_date.get('single_cabin_price', 'N/A')
                                double_price = first_date.get('double_cabin_price', 'N/A')
                                print(f"         💰 Cabin pricing: Single=₺{single_price}, Double=₺{double_price}")
                            else:
                                print(f"         ⚠️  No cabin pricing in tour dates")
                    else:
                        print(f"      ✅ {field}: {value}")
            
            if missing_important:
                print(f"      ⚠️  Missing important fields: {missing_important}")
                structure_issues.append(f"Tour {tour_id}: Missing important fields {missing_important}")
        
        print(f"\n   📊 Structure Analysis Summary:")
        print(f"   • Tours analyzed: {tours_analyzed}")
        print(f"   • Structure issues found: {len(structure_issues)}")
        
        if structure_issues:
            print(f"   ❌ Issues found:")
            for issue in structure_issues:
                print(f"      • {issue}")
            self.log_test("Tour Data Structure", False, "", f"Structure issues: {structure_issues}")
            return False
        else:
            print(f"   ✅ All tours have complete data structure")
            self.log_test("Tour Data Structure", True, f"Analyzed {tours_analyzed} tours - all have complete structure")
            return True

    def test_backend_server_status(self):
        """Test 0: Check if backend server is accessible"""
        print("\n🎯 TEST 0: Backend Server Status Check")
        try:
            response = requests.get(self.base_url, timeout=10)
            if response.status_code == 200:
                print(f"   ✅ Backend server accessible at {self.base_url}")
                self.log_test("Backend Server Status", True, f"Server responding with status {response.status_code}")
                return True
            else:
                print(f"   ⚠️  Backend server returned status {response.status_code}")
                self.log_test("Backend Server Status", False, "", f"Server returned status {response.status_code}")
                return False
        except Exception as e:
            print(f"   ❌ Backend server not accessible: {str(e)}")
            self.log_test("Backend Server Status", False, "", f"Server not accessible: {str(e)}")
            return False

    def run_tours_api_diagnosis(self):
        """Run comprehensive tours API diagnosis"""
        print("🎯 TOURS API DIAGNOSIS - Investigating '0 tur bulundu' Issue")
        print("=" * 70)
        print("Diagnosing why no tours are being loaded on the ToursPage")
        print("Expected: Tours with locations 'Muğla, Fethiye' and 'Muğla, Göcek'")
        print("=" * 70)
        
        # Test 0: Backend server status
        server_ok = self.test_backend_server_status()
        if not server_ok:
            print("\n🚨 CRITICAL: Backend server is not accessible!")
            self.print_final_results()
            return
        
        # Test 1: Basic tours API test
        tours_success, tours_data = self.test_tours_api_basic()
        
        if not tours_success or not tours_data:
            print("\n🚨 CRITICAL: Tours API is not returning data!")
            print("   This explains why frontend shows '0 tur bulundu'")
            self.print_final_results()
            return
        
        # Test 2: Location data verification
        self.test_tours_location_data(tours_data)
        
        # Test 3: No filters test
        self.test_tours_with_no_filters()
        
        # Test 4: Filter tests
        self.test_tours_with_filters()
        
        # Test 5: Data structure verification
        self.test_tour_data_structure(tours_data)
        
        # Print final diagnosis
        self.print_final_results()

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 70)
        print("📊 TOURS API DIAGNOSIS RESULTS")
        print("=" * 70)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test_name']}: {test['error']}")
        
        # Print diagnosis conclusion
        print("\n🔍 DIAGNOSIS CONCLUSION:")
        if success_rate >= 80:
            print("✅ Tours API is working correctly")
            print("   The '0 tur bulundu' issue may be a frontend problem")
        elif success_rate >= 50:
            print("⚠️  Tours API has some issues but is partially working")
            print("   Check failed tests above for specific problems")
        else:
            print("🚨 Tours API has critical issues")
            print("   This likely explains the '0 tur bulundu' problem")
        
        print("\n📋 RECOMMENDATIONS:")
        if any("0 tours" in test['error'] for test in failed_tests):
            print("   • Check database - no tours data available")
            print("   • Run data seeding endpoints to populate tours")
        if any("Connection error" in test['error'] for test in failed_tests):
            print("   • Check backend server status and connectivity")
        if any("500" in test['error'] for test in failed_tests):
            print("   • Check backend logs for internal server errors")
        if any("Location" in test['test_name'] and not test['success'] for test in failed_tests):
            print("   • Verify tour location data in database")
            print("   • Check if location filtering is working correctly")

if __name__ == "__main__":
    tester = ToursAPITester()
    tester.run_tours_api_diagnosis()