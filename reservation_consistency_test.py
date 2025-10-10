import requests
import sys
import json
from datetime import datetime
import time

class ReservationConsistencyTester:
    def __init__(self, base_url="https://travel-portal-6.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.inconsistencies = []

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

    def log_inconsistency(self, booking_id, issue_type, description, booking_data):
        """Log data inconsistency"""
        inconsistency = {
            "booking_id": booking_id,
            "issue_type": issue_type,
            "description": description,
            "booking_data": booking_data,
            "timestamp": datetime.now().isoformat()
        }
        self.inconsistencies.append(inconsistency)
        print(f"⚠️  INCONSISTENCY FOUND: {description}")

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

    def test_admin_login(self):
        """Test admin login with admin@example.com/test123"""
        admin_login_data = {
            "email": "admin@example.com",
            "password": "test123"
        }
        
        success, response = self.run_test(
            "Admin Login (admin@example.com)",
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
                user_email = response['user'].get('email')
                print(f"   ✅ Admin login successful")
                print(f"   📧 Email: {user_email}")
                print(f"   👤 Role: {user_role}")
                print(f"   🔑 Token: {self.token[:20]}...")
            return True
        
        return False

    def get_admin_bookings(self):
        """Get admin user's bookings"""
        if not self.token:
            self.log_test("Get Admin Bookings", False, "", "No authentication token available")
            return False, []

        success, response = self.run_test(
            "Get Admin Bookings",
            "GET",
            "bookings",
            200
        )
        
        if success and response:
            print(f"   📊 Found {len(response)} bookings for admin@example.com")
            return True, response
        
        return False, []

    def analyze_booking_consistency(self, booking):
        """Analyze a single booking for data consistency"""
        booking_id = booking.get('id', 'Unknown')
        participants = booking.get('participants', 0)
        cabin_type = booking.get('cabin_type', 'unknown')
        total_price = booking.get('total_price', 0)
        booking_status = booking.get('booking_status', 'unknown')
        payment_status = booking.get('payment_status', 'unknown')
        
        print(f"\n🔍 Analyzing Booking ID: {booking_id}")
        print(f"   🏠 Participants (Cabin Count): {participants}")
        print(f"   🛏️  Cabin Type: {cabin_type}")
        print(f"   💰 Total Price: {total_price}")
        print(f"   📋 Booking Status: {booking_status}")
        print(f"   💳 Payment Status: {payment_status}")
        
        issues_found = []
        
        # Check 1: Participants should be positive integer
        if not isinstance(participants, int) or participants <= 0:
            issue = f"Invalid participants count: {participants} (should be positive integer)"
            issues_found.append(issue)
            self.log_inconsistency(booking_id, "INVALID_PARTICIPANTS", issue, booking)
        
        # Check 2: Cabin type should be valid
        valid_cabin_types = ['single', 'double']
        if cabin_type not in valid_cabin_types:
            issue = f"Invalid cabin type: '{cabin_type}' (should be 'single' or 'double')"
            issues_found.append(issue)
            self.log_inconsistency(booking_id, "INVALID_CABIN_TYPE", issue, booking)
        
        # Check 3: Total price should be positive
        if not isinstance(total_price, (int, float)) or total_price <= 0:
            issue = f"Invalid total price: {total_price} (should be positive number)"
            issues_found.append(issue)
            self.log_inconsistency(booking_id, "INVALID_TOTAL_PRICE", issue, booking)
        
        # Check 4: Price reasonableness based on cabin count and type
        if isinstance(participants, int) and participants > 0 and isinstance(total_price, (int, float)) and total_price > 0:
            price_per_cabin = total_price / participants
            
            # Expected price ranges (these are reasonable estimates)
            if cabin_type == 'single':
                min_expected = 5000   # Minimum 5,000 TL per single cabin
                max_expected = 50000  # Maximum 50,000 TL per single cabin
            elif cabin_type == 'double':
                min_expected = 8000   # Minimum 8,000 TL per double cabin  
                max_expected = 80000  # Maximum 80,000 TL per double cabin
            else:
                min_expected = 5000
                max_expected = 80000
            
            if price_per_cabin < min_expected:
                issue = f"Price per cabin too low: {price_per_cabin:.2f} TL (expected min: {min_expected} TL for {cabin_type} cabin)"
                issues_found.append(issue)
                self.log_inconsistency(booking_id, "PRICE_TOO_LOW", issue, booking)
            elif price_per_cabin > max_expected:
                issue = f"Price per cabin too high: {price_per_cabin:.2f} TL (expected max: {max_expected} TL for {cabin_type} cabin)"
                issues_found.append(issue)
                self.log_inconsistency(booking_id, "PRICE_TOO_HIGH", issue, booking)
            else:
                print(f"   ✅ Price per cabin reasonable: {price_per_cabin:.2f} TL for {cabin_type} cabin")
        
        # Check 5: Status consistency
        valid_booking_statuses = ['draft', 'pending', 'confirmed', 'paid', 'completed', 'cancelled']
        valid_payment_statuses = ['pending', 'success', 'failed', 'refunded']
        
        if booking_status not in valid_booking_statuses:
            issue = f"Invalid booking status: '{booking_status}' (valid: {valid_booking_statuses})"
            issues_found.append(issue)
            self.log_inconsistency(booking_id, "INVALID_BOOKING_STATUS", issue, booking)
        
        if payment_status not in valid_payment_statuses:
            issue = f"Invalid payment status: '{payment_status}' (valid: {valid_payment_statuses})"
            issues_found.append(issue)
            self.log_inconsistency(booking_id, "INVALID_PAYMENT_STATUS", issue, booking)
        
        # Check 6: Status logic consistency
        if booking_status == 'paid' and payment_status != 'success':
            issue = f"Status mismatch: booking_status='paid' but payment_status='{payment_status}' (should be 'success')"
            issues_found.append(issue)
            self.log_inconsistency(booking_id, "STATUS_MISMATCH", issue, booking)
        
        if payment_status == 'success' and booking_status not in ['paid', 'completed']:
            issue = f"Status mismatch: payment_status='success' but booking_status='{booking_status}' (should be 'paid' or 'completed')"
            issues_found.append(issue)
            self.log_inconsistency(booking_id, "STATUS_MISMATCH", issue, booking)
        
        if len(issues_found) == 0:
            print(f"   ✅ Booking {booking_id} - All consistency checks PASSED")
            return True
        else:
            print(f"   ❌ Booking {booking_id} - Found {len(issues_found)} consistency issues")
            for issue in issues_found:
                print(f"      • {issue}")
            return False

    def analyze_sample_data_scenarios(self):
        """Analyze the specific sample data scenarios mentioned in the request"""
        print(f"\n🎯 ANALYZING SAMPLE DATA SCENARIOS")
        print("=" * 60)
        
        scenarios = [
            {
                "participants": 1,
                "cabin_type": "double", 
                "total_price": 18000,
                "description": "1 kabin x çift kişilik = 18,000 TL"
            },
            {
                "participants": 2,
                "cabin_type": "single",
                "total_price": 15000,
                "description": "2 kabin x tek kişilik = 15,000 TL"
            },
            {
                "participants": 3,
                "cabin_type": "single",
                "total_price": 36000,
                "description": "3 kabin x tek kişilik = 36,000 TL"
            }
        ]
        
        for i, scenario in enumerate(scenarios, 1):
            print(f"\n📋 Scenario {i}: {scenario['description']}")
            
            participants = scenario['participants']
            cabin_type = scenario['cabin_type']
            total_price = scenario['total_price']
            
            # Calculate price per cabin
            price_per_cabin = total_price / participants if participants > 0 else 0
            
            print(f"   🏠 Participants (Cabin Count): {participants}")
            print(f"   🛏️  Cabin Type: {cabin_type}")
            print(f"   💰 Total Price: {total_price:,} TL")
            print(f"   📊 Price per Cabin: {price_per_cabin:,.2f} TL")
            
            # Analyze reasonableness
            is_reasonable = True
            issues = []
            
            # Check cabin type vs price reasonableness
            if cabin_type == 'single':
                if price_per_cabin < 5000:
                    issues.append(f"Price per single cabin too low: {price_per_cabin:,.2f} TL (expected min: 5,000 TL)")
                    is_reasonable = False
                elif price_per_cabin > 50000:
                    issues.append(f"Price per single cabin too high: {price_per_cabin:,.2f} TL (expected max: 50,000 TL)")
                    is_reasonable = False
            elif cabin_type == 'double':
                if price_per_cabin < 8000:
                    issues.append(f"Price per double cabin too low: {price_per_cabin:,.2f} TL (expected min: 8,000 TL)")
                    is_reasonable = False
                elif price_per_cabin > 80000:
                    issues.append(f"Price per double cabin too high: {price_per_cabin:,.2f} TL (expected max: 80,000 TL)")
                    is_reasonable = False
            
            # Check logic consistency
            if cabin_type == 'double' and participants > 1:
                # Multiple double cabins - check if this makes sense
                total_capacity = participants * 2  # Each double cabin can hold 2 people
                if total_capacity > 10:  # Assuming max group size of 10
                    issues.append(f"Too many double cabins: {participants} cabins = {total_capacity} people capacity (might be excessive)")
            
            if is_reasonable and len(issues) == 0:
                print(f"   ✅ Scenario {i} - REASONABLE and CONSISTENT")
            else:
                print(f"   ❌ Scenario {i} - ISSUES FOUND:")
                for issue in issues:
                    print(f"      • {issue}")
        
        return True

    def test_profile_vs_bookings_consistency(self):
        """Test if Profile Page and Bookings Page show same data"""
        print(f"\n🔄 TESTING PROFILE VS BOOKINGS PAGE CONSISTENCY")
        print("=" * 60)
        
        # Get bookings data (this is what both pages should show)
        bookings_success, bookings_data = self.get_admin_bookings()
        
        if not bookings_success:
            print("❌ Could not retrieve bookings data for consistency check")
            return False
        
        print(f"📊 Bookings endpoint returned {len(bookings_data)} reservations")
        
        # Since we can't directly test the frontend pages, we'll verify the API data structure
        # that both ProfilePage and MyBookingsPage would use
        
        consistent_data = True
        for i, booking in enumerate(bookings_data, 1):
            booking_id = booking.get('id', f'booking_{i}')
            
            # Check if booking has all required fields that frontend pages need
            required_fields = ['id', 'participants', 'cabin_type', 'total_price', 'booking_status', 'payment_status']
            missing_fields = []
            
            for field in required_fields:
                if field not in booking or booking[field] is None:
                    missing_fields.append(field)
            
            if missing_fields:
                print(f"   ❌ Booking {booking_id} missing fields: {missing_fields}")
                consistent_data = False
            else:
                print(f"   ✅ Booking {booking_id} has all required fields")
        
        if consistent_data:
            print("   ✅ All bookings have consistent data structure for frontend display")
            self.log_test("Profile vs Bookings Consistency", True, f"All {len(bookings_data)} bookings have consistent data structure")
        else:
            print("   ❌ Some bookings have missing or inconsistent data")
            self.log_test("Profile vs Bookings Consistency", False, "", "Some bookings missing required fields")
        
        return consistent_data

    def run_comprehensive_reservation_consistency_test(self):
        """Run comprehensive reservation data consistency test"""
        print("🎯 COMPREHENSIVE RESERVATION DATA CONSISTENCY TEST")
        print("=" * 70)
        print("Testing admin@example.com user's reservation data for consistency")
        print("Checking: participants (cabin count), cabin_type, total_price, status fields")
        print("=" * 70)
        
        # Step 1: Admin Login
        print("\n🔐 STEP 1: Admin Login")
        admin_success = self.test_admin_login()
        
        if not admin_success:
            print("❌ Admin login failed - cannot proceed with reservation analysis")
            self.print_final_results()
            return False
        
        # Step 2: Get Admin Reservations
        print("\n📋 STEP 2: Get Admin Reservations")
        bookings_success, bookings_data = self.get_admin_bookings()
        
        if not bookings_success:
            print("❌ Could not retrieve admin reservations")
            self.print_final_results()
            return False
        
        if len(bookings_data) == 0:
            print("⚠️  No reservations found for admin@example.com")
            print("   ℹ️  You may need to create sample bookings first")
            self.print_final_results()
            return False
        
        # Step 3: Analyze Each Booking for Consistency
        print(f"\n🔍 STEP 3: Analyze {len(bookings_data)} Reservations for Data Consistency")
        
        consistent_bookings = 0
        for booking in bookings_data:
            is_consistent = self.analyze_booking_consistency(booking)
            if is_consistent:
                consistent_bookings += 1
        
        consistency_rate = (consistent_bookings / len(bookings_data) * 100) if len(bookings_data) > 0 else 0
        
        print(f"\n📊 CONSISTENCY ANALYSIS SUMMARY:")
        print(f"   Total Reservations: {len(bookings_data)}")
        print(f"   Consistent Reservations: {consistent_bookings}")
        print(f"   Inconsistent Reservations: {len(bookings_data) - consistent_bookings}")
        print(f"   Consistency Rate: {consistency_rate:.1f}%")
        
        # Step 4: Analyze Sample Data Scenarios
        print(f"\n🎯 STEP 4: Sample Data Analysis")
        self.analyze_sample_data_scenarios()
        
        # Step 5: Test Profile vs Bookings Consistency
        print(f"\n🔄 STEP 5: Profile Page vs Bookings Page Consistency")
        self.test_profile_vs_bookings_consistency()
        
        # Print final results
        self.print_final_results()
        
        return consistency_rate >= 80  # Consider 80%+ consistency rate as success

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 70)
        print("📊 RESERVATION CONSISTENCY TEST RESULTS")
        print("=" * 70)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        # Print inconsistencies summary
        if self.inconsistencies:
            print(f"\n⚠️  FOUND {len(self.inconsistencies)} DATA INCONSISTENCIES:")
            
            # Group by issue type
            issue_types = {}
            for inconsistency in self.inconsistencies:
                issue_type = inconsistency['issue_type']
                if issue_type not in issue_types:
                    issue_types[issue_type] = []
                issue_types[issue_type].append(inconsistency)
            
            for issue_type, issues in issue_types.items():
                print(f"\n   📋 {issue_type} ({len(issues)} issues):")
                for issue in issues:
                    print(f"      • Booking {issue['booking_id']}: {issue['description']}")
        else:
            print("\n✅ NO DATA INCONSISTENCIES FOUND!")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test_name']}: {test['error']}")
        
        # Overall assessment
        if success_rate >= 90 and len(self.inconsistencies) == 0:
            print("\n🎉 EXCELLENT: Reservation data is highly consistent!")
        elif success_rate >= 70 and len(self.inconsistencies) <= 2:
            print("\n✅ GOOD: Reservation data is mostly consistent, minor issues found")
        else:
            print("\n🚨 ATTENTION NEEDED: Significant data inconsistencies found")
            print("   📝 Recommended actions:")
            print("   • Review and fix inconsistent reservation data")
            print("   • Update ProfilePage.js to show 'Kabin Sayısı' instead of 'Katılımcı Sayısı'")
            print("   • Ensure both Profile and Bookings pages use same data source")

if __name__ == "__main__":
    tester = ReservationConsistencyTester()
    tester.run_comprehensive_reservation_consistency_test()