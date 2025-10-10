import requests
import sys
import json
from datetime import datetime, date, timedelta, timezone
import time

class CronJobTester:
    def __init__(self, base_url="https://travel-portal-6.preview.emergentagent.com"):
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
        """Test admin login to get authentication token"""
        admin_login_data = {
            "email": "admin@example.com",
            "password": "admin123"  # Correct admin password
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

    def create_test_tour_with_dates(self):
        """Create a test tour with both past and future dates for testing"""
        if not self.token:
            print("❌ No admin token available for creating test tour")
            return None
        
        # Calculate dates
        today = date.today()
        past_date1 = (today - timedelta(days=5)).isoformat()  # 5 days ago
        past_date2 = (today - timedelta(days=2)).isoformat()  # 2 days ago
        future_date1 = (today + timedelta(days=3)).isoformat()  # 3 days from now
        future_date2 = (today + timedelta(days=10)).isoformat()  # 10 days from now
        
        tour_data = {
            "title": "Cron Job Test Tour",
            "description": "Test tour for cron job functionality testing",
            "short_description": "Cron job test tour",
            "location": "Test Location",
            "category": "test",
            "classification": "standart",
            "status": "active",
            "reservation_type": "cabin_based",
            "tour_dates": [
                {
                    "date": past_date1,
                    "capacity": 10,
                    "single_cabin_price": 1000,
                    "double_cabin_price": 1500,
                    "is_active": True
                },
                {
                    "date": past_date2,
                    "capacity": 8,
                    "single_cabin_price": 1200,
                    "double_cabin_price": 1800,
                    "is_active": True
                },
                {
                    "date": future_date1,
                    "capacity": 12,
                    "single_cabin_price": 1100,
                    "double_cabin_price": 1600,
                    "is_active": True
                },
                {
                    "date": future_date2,
                    "capacity": 15,
                    "single_cabin_price": 1300,
                    "double_cabin_price": 1900,
                    "is_active": True
                }
            ]
        }
        
        success, response = self.run_test(
            "Create Test Tour with Past and Future Dates",
            "POST",
            "admin/tours",
            200,
            data=tour_data
        )
        
        if success and response and 'id' in response:
            tour_id = response['id']
            print(f"   ✅ Test tour created with ID: {tour_id}")
            print(f"   📅 Past dates: {past_date1}, {past_date2}")
            print(f"   📅 Future dates: {future_date1}, {future_date2}")
            return tour_id
        
        return None

    def get_tour_dates_before_cron(self, tour_id):
        """Get tour dates before running cron job"""
        success, response = self.run_test(
            "Get Tour Dates Before Cron Job",
            "GET",
            f"tours/{tour_id}/dates",
            200
        )
        
        if success and response:
            active_dates = [date for date in response if date.get('is_active', True)]
            past_dates = []
            future_dates = []
            today = date.today()
            
            for date_entry in active_dates:
                date_str = date_entry.get('start_date') or date_entry.get('date')
                if date_str:
                    try:
                        tour_date = datetime.fromisoformat(date_str).date()
                        if tour_date < today:
                            past_dates.append(date_entry)
                        else:
                            future_dates.append(date_entry)
                    except ValueError:
                        continue
            
            print(f"   📊 Before cron: {len(active_dates)} active dates total")
            print(f"   📊 Past dates (should be deactivated): {len(past_dates)}")
            print(f"   📊 Future dates (should remain active): {len(future_dates)}")
            
            return {
                'total_active': len(active_dates),
                'past_dates': len(past_dates),
                'future_dates': len(future_dates),
                'all_dates': response
            }
        
        return None

    def test_cron_job_endpoint(self):
        """Test the cron job endpoint for updating tour dates status"""
        success, response = self.run_test(
            "Cron Job - Update Tour Dates Status",
            "POST",
            "cron/update-tour-dates-status",
            200
        )
        
        if success and response:
            # Verify response structure
            required_fields = ['success', 'message', 'stats']
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                self.log_test(
                    "Cron Job Response Structure",
                    False,
                    "",
                    f"Missing required fields: {missing_fields}"
                )
                return False, response
            
            # Verify stats structure
            stats = response.get('stats', {})
            required_stats = ['tours_checked', 'tours_updated', 'total_dates_checked', 'dates_deactivated', 'execution_date']
            missing_stats = [stat for stat in required_stats if stat not in stats]
            
            if missing_stats:
                self.log_test(
                    "Cron Job Stats Structure",
                    False,
                    "",
                    f"Missing required stats: {missing_stats}"
                )
                return False, response
            
            # Log the statistics
            print(f"   📊 Cron Job Statistics:")
            print(f"      • Tours checked: {stats.get('tours_checked', 0)}")
            print(f"      • Tours updated: {stats.get('tours_updated', 0)}")
            print(f"      • Total dates checked: {stats.get('total_dates_checked', 0)}")
            print(f"      • Dates deactivated: {stats.get('dates_deactivated', 0)}")
            print(f"      • Execution date: {stats.get('execution_date', 'N/A')}")
            
            self.log_test(
                "Cron Job Response Structure",
                True,
                f"All required fields present. Stats: {stats}"
            )
            
            return True, response
        
        return False, {}

    def get_tour_dates_after_cron(self, tour_id):
        """Get tour dates after running cron job"""
        success, response = self.run_test(
            "Get Tour Dates After Cron Job",
            "GET",
            f"tours/{tour_id}/dates",
            200
        )
        
        if success and response:
            active_dates = [date for date in response if date.get('is_active', True)]
            inactive_dates = [date for date in response if not date.get('is_active', True)]
            past_active_dates = []
            future_active_dates = []
            today = date.today()
            
            for date_entry in active_dates:
                date_str = date_entry.get('start_date') or date_entry.get('date')
                if date_str:
                    try:
                        tour_date = datetime.fromisoformat(date_str).date()
                        if tour_date < today:
                            past_active_dates.append(date_entry)
                        else:
                            future_active_dates.append(date_entry)
                    except ValueError:
                        continue
            
            print(f"   📊 After cron: {len(active_dates)} active dates, {len(inactive_dates)} inactive dates")
            print(f"   📊 Past dates still active (should be 0): {len(past_active_dates)}")
            print(f"   📊 Future dates active (should be unchanged): {len(future_active_dates)}")
            
            return {
                'total_active': len(active_dates),
                'total_inactive': len(inactive_dates),
                'past_active': len(past_active_dates),
                'future_active': len(future_active_dates),
                'all_dates': response
            }
        
        return None

    def test_date_comparison_logic(self, before_stats, after_stats):
        """Test that the date comparison logic works correctly"""
        if not before_stats or not after_stats:
            self.log_test(
                "Date Comparison Logic",
                False,
                "",
                "Missing before/after statistics"
            )
            return False
        
        # Check if past dates were properly deactivated
        past_dates_before = before_stats['past_dates']
        past_active_after = after_stats['past_active']
        
        if past_dates_before > 0 and past_active_after == 0:
            self.log_test(
                "Date Comparison Logic - Past Dates Deactivated",
                True,
                f"Successfully deactivated {past_dates_before} past dates"
            )
            past_dates_success = True
        elif past_dates_before == 0:
            self.log_test(
                "Date Comparison Logic - No Past Dates",
                True,
                "No past dates to deactivate (expected)"
            )
            past_dates_success = True
        else:
            self.log_test(
                "Date Comparison Logic - Past Dates Not Deactivated",
                False,
                "",
                f"Expected 0 past active dates, got {past_active_after}"
            )
            past_dates_success = False
        
        # Check if future dates remained active
        future_dates_before = before_stats['future_dates']
        future_active_after = after_stats['future_active']
        
        if future_dates_before == future_active_after:
            self.log_test(
                "Date Comparison Logic - Future Dates Preserved",
                True,
                f"Future dates remained active: {future_active_after}"
            )
            future_dates_success = True
        else:
            self.log_test(
                "Date Comparison Logic - Future Dates Changed",
                False,
                "",
                f"Expected {future_dates_before} future active dates, got {future_active_after}"
            )
            future_dates_success = False
        
        return past_dates_success and future_dates_success

    def test_tour_dates_filtering(self):
        """Test that tour dates filtering works correctly after cron job"""
        # Get all tours to check filtering
        success, tours_response = self.run_test(
            "Get Tours for Filtering Test",
            "GET",
            "tours",
            200
        )
        
        if not success or not tours_response:
            self.log_test(
                "Tour Dates Filtering",
                False,
                "",
                "Could not retrieve tours for filtering test"
            )
            return False
        
        # Check if tours only show active dates
        tours_with_only_future_dates = 0
        tours_with_past_dates = 0
        total_tours_checked = 0
        today = date.today()
        
        for tour in tours_response:
            tour_dates = tour.get('tour_dates', [])
            if not tour_dates:
                continue
            
            total_tours_checked += 1
            has_past_active_dates = False
            
            for date_entry in tour_dates:
                date_str = date_entry.get('date') or date_entry.get('start_date')
                is_active = date_entry.get('is_active', True)
                
                if date_str and is_active:
                    try:
                        tour_date = datetime.fromisoformat(date_str).date()
                        if tour_date < today:
                            has_past_active_dates = True
                            break
                    except ValueError:
                        continue
            
            if has_past_active_dates:
                tours_with_past_dates += 1
            else:
                tours_with_only_future_dates += 1
        
        print(f"   📊 Filtering Results:")
        print(f"      • Total tours checked: {total_tours_checked}")
        print(f"      • Tours with only future dates: {tours_with_only_future_dates}")
        print(f"      • Tours with past active dates: {tours_with_past_dates}")
        
        if tours_with_past_dates == 0:
            self.log_test(
                "Tour Dates Filtering - No Past Active Dates",
                True,
                f"All {total_tours_checked} tours have only future active dates"
            )
            return True
        else:
            self.log_test(
                "Tour Dates Filtering - Past Active Dates Found",
                False,
                "",
                f"Found {tours_with_past_dates} tours with past active dates"
            )
            return False

    def run_comprehensive_cron_job_test(self):
        """Run comprehensive cron job testing"""
        print("🎯 Testing Cron Job Endpoint for Updating Tour Dates Status")
        print("=" * 70)
        print("Background: Testing cron job to automatically deactivate past tour dates")
        print("Focus: Cron endpoint functionality, date comparison logic, status updates")
        print("=" * 70)
        
        # Step 1: Admin Authentication
        print("\n🔐 PHASE 1: Admin Authentication")
        admin_success = self.test_admin_login()
        
        if not admin_success:
            print("❌ Admin login failed, cannot proceed with cron job tests")
            self.print_final_results()
            return
        
        # Step 2: Create test tour with past and future dates
        print("\n📅 PHASE 2: Create Test Tour with Past and Future Dates")
        test_tour_id = self.create_test_tour_with_dates()
        
        if not test_tour_id:
            print("❌ Failed to create test tour, proceeding with existing tours")
        
        # Step 3: Get tour dates before cron job
        print("\n📊 PHASE 3: Analyze Tour Dates Before Cron Job")
        before_stats = None
        if test_tour_id:
            before_stats = self.get_tour_dates_before_cron(test_tour_id)
        
        # Step 4: Test cron job endpoint
        print("\n🕒 PHASE 4: Test Cron Job Endpoint")
        cron_success, cron_response = self.test_cron_job_endpoint()
        
        if not cron_success:
            print("❌ Cron job endpoint failed")
            self.print_final_results()
            return
        
        # Step 5: Verify response structure and statistics
        print("\n📈 PHASE 5: Verify Response Structure and Statistics")
        if cron_response:
            stats = cron_response.get('stats', {})
            success_flag = cron_response.get('success', False)
            
            if success_flag:
                self.log_test(
                    "Cron Job Success Flag",
                    True,
                    "Cron job reported successful execution"
                )
            else:
                self.log_test(
                    "Cron Job Success Flag",
                    False,
                    "",
                    "Cron job reported failure"
                )
            
            # Verify statistics make sense
            tours_checked = stats.get('tours_checked', 0)
            dates_deactivated = stats.get('dates_deactivated', 0)
            
            if tours_checked > 0:
                self.log_test(
                    "Cron Job Statistics - Tours Processed",
                    True,
                    f"Processed {tours_checked} tours"
                )
            else:
                self.log_test(
                    "Cron Job Statistics - No Tours",
                    False,
                    "",
                    "No tours were processed by cron job"
                )
        
        # Step 6: Get tour dates after cron job
        print("\n📊 PHASE 6: Analyze Tour Dates After Cron Job")
        after_stats = None
        if test_tour_id:
            after_stats = self.get_tour_dates_after_cron(test_tour_id)
        
        # Step 7: Test date comparison logic
        print("\n🔍 PHASE 7: Test Date Comparison Logic")
        if before_stats and after_stats:
            self.test_date_comparison_logic(before_stats, after_stats)
        else:
            print("⚠️  Skipping date comparison test - missing before/after data")
        
        # Step 8: Test tour dates filtering
        print("\n🔎 PHASE 8: Test Tour Dates Filtering")
        self.test_tour_dates_filtering()
        
        # Print final results
        self.print_final_results()

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 70)
        print("📊 CRON JOB TEST RESULTS")
        print("=" * 70)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("🎉 EXCELLENT: Cron job functionality is working perfectly!")
        elif success_rate >= 70:
            print("✅ GOOD: Cron job mostly working, minor issues to address")
        elif success_rate >= 50:
            print("⚠️  FAIR: Cron job partially working, needs attention")
        else:
            print("🚨 CRITICAL: Major issues with cron job functionality")
        
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
    tester = CronJobTester()
    tester.run_comprehensive_cron_job_test()