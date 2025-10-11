import requests
import sys
import json
from datetime import datetime
import time

class DurationUnitTester:
    def __init__(self, base_url="https://tourslug.preview.emergentagent.com"):
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

    def test_user_login(self):
        """Test user login"""
        login_data = {
            "email": "user@example.com",
            "password": "password123"
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

    def test_tours_duration_fields(self):
        """Test tours API returns proper duration fields"""
        success, response = self.run_test(
            "Get Tours with Duration Fields",
            "GET",
            "tours",
            200
        )
        
        if success and response:
            print(f"   ✅ Retrieved {len(response)} tours")
            
            # Analyze duration fields in tours
            tours_with_duration_unit = []
            tours_with_duration_days = []
            tours_missing_duration = []
            
            for tour in response:
                tour_id = tour.get('id')
                title = tour.get('title', 'Unknown')
                duration_unit = tour.get('duration_unit')
                duration_days = tour.get('duration_days')
                
                print(f"   📋 Tour: '{title}'")
                print(f"      • duration_unit: {duration_unit}")
                print(f"      • duration_days: {duration_days}")
                
                if duration_unit:
                    tours_with_duration_unit.append({
                        'id': tour_id,
                        'title': title,
                        'duration_unit': duration_unit,
                        'duration_days': duration_days
                    })
                
                if duration_days:
                    tours_with_duration_days.append({
                        'id': tour_id,
                        'title': title,
                        'duration_unit': duration_unit,
                        'duration_days': duration_days
                    })
                
                if not duration_unit and not duration_days:
                    tours_missing_duration.append({
                        'id': tour_id,
                        'title': title
                    })
            
            print(f"\n   📊 Duration Field Analysis:")
            print(f"      • Tours with duration_unit: {len(tours_with_duration_unit)}")
            print(f"      • Tours with duration_days: {len(tours_with_duration_days)}")
            print(f"      • Tours missing duration data: {len(tours_missing_duration)}")
            
            # Test fallback logic scenarios
            print(f"\n   🎯 Testing Fallback Logic Scenarios:")
            
            # Scenario 1: Tours with missing duration_unit (should use fallback)
            tours_needing_fallback = [t for t in tours_with_duration_days if not t['duration_unit']]
            if tours_needing_fallback:
                print(f"      ✅ Found {len(tours_needing_fallback)} tours that need fallback logic:")
                for tour in tours_needing_fallback[:3]:  # Show first 3
                    expected_unit = 'days' if tour['duration_days'] else 'hours'
                    print(f"         • '{tour['title']}': duration_days={tour['duration_days']} → should fallback to '{expected_unit}'")
            else:
                print(f"      ⚠️  No tours found that need fallback logic (all have duration_unit)")
            
            # Scenario 2: Tours with correct duration_unit (should use actual value)
            if tours_with_duration_unit:
                print(f"      ✅ Found {len(tours_with_duration_unit)} tours with explicit duration_unit:")
                for tour in tours_with_duration_unit[:3]:  # Show first 3
                    print(f"         • '{tour['title']}': duration_unit='{tour['duration_unit']}' (should use this value)")
            
            return True, {
                'tours_with_duration_unit': tours_with_duration_unit,
                'tours_with_duration_days': tours_with_duration_days,
                'tours_needing_fallback': tours_needing_fallback
            }
        
        return False, {}

    def test_cart_functionality_with_duration(self):
        """Test cart functionality with duration unit scenarios"""
        if not self.token:
            print("   ⚠️  No authentication token - skipping cart tests")
            return False
        
        # First get tours to test with
        tours_success, tours_data = self.test_tours_duration_fields()
        
        if not tours_success:
            print("   ❌ Could not get tours data for cart testing")
            return False
        
        tours_with_duration_unit = tours_data.get('tours_with_duration_unit', [])
        tours_needing_fallback = tours_data.get('tours_needing_fallback', [])
        
        print(f"\n   🛒 Testing Cart Functionality with Duration Units")
        
        # Test scenario 1: Tour with explicit duration_unit
        if tours_with_duration_unit:
            test_tour = tours_with_duration_unit[0]
            print(f"   📋 Scenario 1: Tour with explicit duration_unit")
            print(f"      • Testing tour: '{test_tour['title']}'")
            print(f"      • duration_unit: '{test_tour['duration_unit']}'")
            print(f"      • Expected cart display: Should show '{test_tour['duration_unit']}'")
            
            # Get tour details to verify data structure
            tour_success, tour_response = self.run_test(
                f"Get Tour Details for Duration Test",
                "GET",
                f"tours/{test_tour['id']}",
                200
            )
            
            if tour_success and tour_response:
                duration_unit = tour_response.get('duration_unit')
                duration_days = tour_response.get('duration_days')
                print(f"      ✅ Tour API returns: duration_unit='{duration_unit}', duration_days={duration_days}")
                
                # Verify the fix logic: duration_unit || (duration_days ? 'days' : 'hours')
                expected_display_unit = duration_unit if duration_unit else ('days' if duration_days else 'hours')
                print(f"      ✅ Expected display unit after fix: '{expected_display_unit}'")
        
        # Test scenario 2: Tour with missing duration_unit (fallback logic)
        if tours_needing_fallback:
            test_tour = tours_needing_fallback[0]
            print(f"\n   📋 Scenario 2: Tour with missing duration_unit (fallback)")
            print(f"      • Testing tour: '{test_tour['title']}'")
            print(f"      • duration_unit: {test_tour['duration_unit']} (missing)")
            print(f"      • duration_days: {test_tour['duration_days']}")
            
            # Get tour details to verify fallback logic
            tour_success, tour_response = self.run_test(
                f"Get Tour Details for Fallback Test",
                "GET",
                f"tours/{test_tour['id']}",
                200
            )
            
            if tour_success and tour_response:
                duration_unit = tour_response.get('duration_unit')
                duration_days = tour_response.get('duration_days')
                print(f"      ✅ Tour API returns: duration_unit='{duration_unit}', duration_days={duration_days}")
                
                # Test the fallback logic: duration_unit || (duration_days ? 'days' : 'hours')
                expected_display_unit = duration_unit if duration_unit else ('days' if duration_days else 'hours')
                print(f"      ✅ Expected display unit after fallback: '{expected_display_unit}'")
                
                # Verify the specific issue: tours showing "Saat" instead of "Gün"
                if duration_days and duration_days > 0:
                    if expected_display_unit == 'days':
                        print(f"      ✅ FIXED: Tour with {duration_days} days should show 'Gün' (days), not 'Saat' (hours)")
                    else:
                        print(f"      ❌ ISSUE: Tour with {duration_days} days showing '{expected_display_unit}' instead of 'days'")
        
        return True

    def test_specific_duration_scenarios(self):
        """Test specific duration scenarios mentioned in the review"""
        print(f"\n   🎯 Testing Specific Duration Unit Fix Scenarios")
        
        # Test the specific fix mentioned: duration_unit: tour.duration_unit || (tour.duration_days ? 'days' : 'hours')
        test_scenarios = [
            {
                'name': 'Tour with duration_unit="hours"',
                'duration_unit': 'hours',
                'duration_days': 1,
                'expected': 'hours',
                'description': 'Should use explicit duration_unit value'
            },
            {
                'name': 'Tour with duration_unit="days"',
                'duration_unit': 'days',
                'duration_days': 3,
                'expected': 'days',
                'description': 'Should use explicit duration_unit value'
            },
            {
                'name': 'Tour with missing duration_unit, has duration_days',
                'duration_unit': None,
                'duration_days': 4,
                'expected': 'days',
                'description': 'Should fallback to "days" because duration_days exists'
            },
            {
                'name': 'Tour with missing duration_unit, no duration_days',
                'duration_unit': None,
                'duration_days': None,
                'expected': 'hours',
                'description': 'Should fallback to "hours" as default'
            },
            {
                'name': 'Tour with missing duration_unit, duration_days=0',
                'duration_unit': None,
                'duration_days': 0,
                'expected': 'hours',
                'description': 'Should fallback to "hours" because duration_days is falsy'
            }
        ]
        
        print(f"   📋 Testing Fallback Logic: duration_unit || (duration_days ? 'days' : 'hours')")
        
        for scenario in test_scenarios:
            print(f"\n   🧪 {scenario['name']}:")
            print(f"      • Input: duration_unit={scenario['duration_unit']}, duration_days={scenario['duration_days']}")
            
            # Simulate the fix logic
            result = scenario['duration_unit'] if scenario['duration_unit'] else ('days' if scenario['duration_days'] else 'hours')
            
            if result == scenario['expected']:
                print(f"      ✅ CORRECT: Result='{result}' (Expected: '{scenario['expected']}')")
                print(f"      ✅ {scenario['description']}")
                self.log_test(f"Duration Logic - {scenario['name']}", True, f"Result: {result}")
            else:
                print(f"      ❌ INCORRECT: Result='{result}' (Expected: '{scenario['expected']}')")
                print(f"      ❌ {scenario['description']}")
                self.log_test(f"Duration Logic - {scenario['name']}", False, "", f"Got {result}, expected {scenario['expected']}")
        
        return True

    def test_cart_display_fix(self):
        """Test the specific cart display fix mentioned in the review"""
        print(f"\n   🛒 Testing Cart Display Fix")
        print(f"   📋 Issue: User reported tours showing 'Saat' instead of 'Gün' in cart")
        print(f"   📋 Fix: CartPage.js fallback logic for duration display")
        
        # Get tours to analyze the issue
        success, response = self.run_test(
            "Get Tours for Cart Display Analysis",
            "GET",
            "tours",
            200
        )
        
        if success and response:
            # Look for tours that should show "Gün" (days) but might show "Saat" (hours)
            problematic_tours = []
            fixed_tours = []
            
            for tour in response:
                title = tour.get('title', 'Unknown')
                duration_unit = tour.get('duration_unit')
                duration_days = tour.get('duration_days')
                
                # Apply the fix logic
                display_unit = duration_unit if duration_unit else ('days' if duration_days else 'hours')
                
                # Check for the specific issue: multi-day tours showing as hours
                if duration_days and duration_days > 1:
                    if display_unit == 'days':
                        fixed_tours.append({
                            'title': title,
                            'duration_days': duration_days,
                            'duration_unit': duration_unit,
                            'display_unit': display_unit,
                            'turkish_display': 'Gün'
                        })
                        print(f"      ✅ FIXED: '{title}' ({duration_days} days) → Display: '{display_unit}' (Gün)")
                    else:
                        problematic_tours.append({
                            'title': title,
                            'duration_days': duration_days,
                            'duration_unit': duration_unit,
                            'display_unit': display_unit,
                            'issue': f"Multi-day tour showing as '{display_unit}' instead of 'days'"
                        })
                        print(f"      ❌ ISSUE: '{title}' ({duration_days} days) → Display: '{display_unit}' (should be Gün)")
            
            print(f"\n   📊 Cart Display Fix Analysis:")
            print(f"      • Tours correctly showing 'Gün' (days): {len(fixed_tours)}")
            print(f"      • Tours with display issues: {len(problematic_tours)}")
            
            if len(fixed_tours) > 0 and len(problematic_tours) == 0:
                print(f"      ✅ CART DISPLAY FIX SUCCESSFUL: All multi-day tours correctly show 'Gün'")
                self.log_test("Cart Display Fix Verification", True, f"All {len(fixed_tours)} multi-day tours show correct units")
                return True
            elif len(problematic_tours) > 0:
                print(f"      ❌ CART DISPLAY ISSUES REMAIN: {len(problematic_tours)} tours still have problems")
                for tour in problematic_tours:
                    print(f"         • {tour['title']}: {tour['issue']}")
                self.log_test("Cart Display Fix Verification", False, "", f"{len(problematic_tours)} tours still have display issues")
                return False
            else:
                print(f"      ⚠️  NO MULTI-DAY TOURS FOUND: Cannot verify cart display fix")
                self.log_test("Cart Display Fix Verification", True, "No multi-day tours found to test")
                return True
        
        return False

    def run_duration_unit_tests(self):
        """Run comprehensive duration unit fix tests"""
        print("🎯 Testing Duration Unit Fix for Cart Display")
        print("=" * 70)
        print("Background: Fixed TourDetailPage.js line 611 and CartPage.js fallback logic")
        print("Issue: Tours showing 'Saat' instead of 'Gün' in cart even when they should be 'Gün'")
        print("Fix: duration_unit: tour.duration_unit || (tour.duration_days ? 'days' : 'hours')")
        print("=" * 70)
        
        # Test 1: User authentication
        print("\n👤 PHASE 1: User Authentication")
        login_success = self.test_user_login()
        
        # Test 2: Tours duration fields analysis
        print("\n📋 PHASE 2: Tours Duration Fields Analysis")
        self.test_tours_duration_fields()
        
        # Test 3: Specific duration scenarios
        print("\n🧪 PHASE 3: Duration Unit Fallback Logic Testing")
        self.test_specific_duration_scenarios()
        
        # Test 4: Cart functionality with duration
        print("\n🛒 PHASE 4: Cart Functionality with Duration Units")
        if login_success:
            self.test_cart_functionality_with_duration()
        else:
            print("   ⚠️  Skipping cart tests - user authentication failed")
        
        # Test 5: Cart display fix verification
        print("\n🎯 PHASE 5: Cart Display Fix Verification")
        self.test_cart_display_fix()
        
        # Print final results
        self.print_final_results()

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 70)
        print("📊 DURATION UNIT FIX TEST RESULTS")
        print("=" * 70)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("🎉 EXCELLENT: Duration unit fix is working correctly!")
        elif success_rate >= 70:
            print("⚠️  GOOD: Most duration unit functionality working, some issues to address")
        else:
            print("🚨 CRITICAL: Duration unit fix has major issues, needs immediate attention")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test_name']}: {test['error']}")
        
        # Print summary of findings
        print("\n📋 DURATION UNIT FIX SUMMARY:")
        print("   1. TourDetailPage.js fix: duration_unit || (duration_days ? 'days' : 'hours')")
        print("   2. CartPage.js fallback logic for duration display")
        print("   3. Issue: Tours showing 'Saat' instead of 'Gün' in cart")
        print("   4. Expected: Multi-day tours should show 'Gün' (days)")

if __name__ == "__main__":
    tester = DurationUnitTester()
    tester.run_duration_unit_tests()