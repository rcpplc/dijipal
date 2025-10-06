import requests
import sys
import json
from datetime import datetime
import time

class AdminBookingsAPITester:
    def __init__(self, base_url="https://travel-quest-3.preview.emergentagent.com"):
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

    def test_admin_login(self, password="test123"):
        """Test admin login with provided credentials"""
        admin_login_data = {
            "email": "admin@example.com",
            "password": password
        }
        
        success, response = self.run_test(
            f"Admin Login (admin@example.com/{password})",
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
                return True, response['user']
            return True, {}
        
        # Try with admin123 if test123 fails
        if password == "test123":
            print("   ℹ️  Trying with admin123 password...")
            return self.test_admin_login("admin123")
        
        return False, {}

    def test_admin_bookings_endpoint(self):
        """Test GET /api/admin/bookings endpoint"""
        if not self.token:
            self.log_test("Admin Bookings Endpoint", False, "", "No authentication token available")
            return False, {}

        success, response = self.run_test(
            "GET /api/admin/bookings - Admin Bookings List",
            "GET",
            "admin/bookings",
            200
        )
        
        if success and response:
            print(f"   ✅ Retrieved {len(response)} bookings from admin endpoint")
            return True, response
        
        return False, {}

    def validate_booking_data_format(self, bookings):
        """Validate booking data format and enum values"""
        print("\n🔍 Validating Booking Data Format...")
        
        if not bookings:
            self.log_test("Booking Data Format Validation", False, "", "No bookings data to validate")
            return False
        
        # Expected enum values
        valid_booking_statuses = ["draft", "pending", "confirmed", "paid", "completed", "cancelled"]
        valid_payment_statuses = ["pending", "success", "failed", "refunded"]
        
        # Required fields
        required_fields = ["id", "user_id", "tour_id", "participants", "cabin_type", "total_price", 
                          "booking_status", "payment_status", "booking_code", "created_at"]
        
        validation_results = {
            "total_bookings": len(bookings),
            "valid_bookings": 0,
            "invalid_bookings": 0,
            "missing_fields": [],
            "invalid_booking_statuses": [],
            "invalid_payment_statuses": [],
            "field_coverage": {}
        }
        
        for i, booking in enumerate(bookings):
            booking_valid = True
            booking_id = booking.get('id', f'booking_{i}')
            
            # Check required fields
            missing_fields = []
            for field in required_fields:
                if field not in booking:
                    missing_fields.append(field)
                    booking_valid = False
                else:
                    # Track field coverage
                    if field not in validation_results["field_coverage"]:
                        validation_results["field_coverage"][field] = 0
                    validation_results["field_coverage"][field] += 1
            
            if missing_fields:
                validation_results["missing_fields"].extend(missing_fields)
                print(f"   ⚠️  Booking {booking_id}: Missing fields: {missing_fields}")
            
            # Check booking_status enum
            booking_status = booking.get('booking_status')
            if booking_status and booking_status not in valid_booking_statuses:
                validation_results["invalid_booking_statuses"].append({
                    "booking_id": booking_id,
                    "status": booking_status
                })
                booking_valid = False
                print(f"   ❌ Booking {booking_id}: Invalid booking_status '{booking_status}'")
            
            # Check payment_status enum
            payment_status = booking.get('payment_status')
            if payment_status and payment_status not in valid_payment_statuses:
                validation_results["invalid_payment_statuses"].append({
                    "booking_id": booking_id,
                    "status": payment_status
                })
                booking_valid = False
                print(f"   ❌ Booking {booking_id}: Invalid payment_status '{payment_status}'")
            
            if booking_valid:
                validation_results["valid_bookings"] += 1
            else:
                validation_results["invalid_bookings"] += 1
        
        # Print validation summary
        print(f"\n📊 Validation Summary:")
        print(f"   Total Bookings: {validation_results['total_bookings']}")
        print(f"   Valid Bookings: {validation_results['valid_bookings']}")
        print(f"   Invalid Bookings: {validation_results['invalid_bookings']}")
        
        # Field coverage
        print(f"\n📋 Field Coverage:")
        for field, count in validation_results["field_coverage"].items():
            coverage_percent = (count / len(bookings)) * 100
            print(f"   {field}: {count}/{len(bookings)} ({coverage_percent:.1f}%)")
        
        # Enum validation results
        if validation_results["invalid_booking_statuses"]:
            print(f"\n❌ Invalid BookingStatus values found:")
            for item in validation_results["invalid_booking_statuses"]:
                print(f"   • {item['booking_id']}: '{item['status']}'")
            print(f"   Valid values: {valid_booking_statuses}")
        else:
            print(f"\n✅ All BookingStatus values are valid")
        
        if validation_results["invalid_payment_statuses"]:
            print(f"\n❌ Invalid PaymentStatus values found:")
            for item in validation_results["invalid_payment_statuses"]:
                print(f"   • {item['booking_id']}: '{item['status']}'")
            print(f"   Valid values: {valid_payment_statuses}")
        else:
            print(f"\n✅ All PaymentStatus values are valid")
        
        # Overall validation result
        is_valid = (validation_results["invalid_bookings"] == 0 and 
                   len(validation_results["invalid_booking_statuses"]) == 0 and 
                   len(validation_results["invalid_payment_statuses"]) == 0)
        
        if is_valid:
            self.log_test("Booking Data Format Validation", True, 
                         f"All {validation_results['total_bookings']} bookings have valid format")
        else:
            self.log_test("Booking Data Format Validation", False, "", 
                         f"{validation_results['invalid_bookings']} invalid bookings found")
        
        return is_valid, validation_results

    def test_admin_authorization(self):
        """Test admin authorization by trying to access endpoint without admin role"""
        print("\n🔐 Testing Admin Authorization...")
        
        # First, try without any token
        original_token = self.token
        self.token = None
        
        success1, response1 = self.run_test(
            "Admin Bookings (No Token - Should Fail)",
            "GET",
            "admin/bookings",
            401  # Expecting 401 Unauthorized
        )
        
        # Restore token
        self.token = original_token
        
        # Try to create a regular user and test with their token
        print("\n   Creating regular user to test authorization...")
        timestamp = int(time.time())
        regular_user_data = {
            "email": f"regular_user_{timestamp}@example.com",
            "full_name": "Regular User",
            "password": "TestPass123!",
            "phone": "+90 555 123 4567",
            "role": "customer"
        }
        
        # Register regular user
        reg_success, reg_response = self.run_test(
            "Register Regular User",
            "POST",
            "auth/register",
            200,
            data=regular_user_data
        )
        
        if reg_success and 'token' in reg_response:
            # Use regular user token
            regular_token = reg_response['token']
            self.token = regular_token
            
            # Try to access admin endpoint with regular user token
            success2, response2 = self.run_test(
                "Admin Bookings (Regular User Token - Should Fail)",
                "GET",
                "admin/bookings",
                403  # Expecting 403 Forbidden
            )
            
            # Restore admin token
            self.token = original_token
            
            if success1 and success2:
                self.log_test("Admin Authorization Test", True, 
                             "Properly rejects unauthorized access (401 without token, 403 with regular user token)")
                return True
            else:
                self.log_test("Admin Authorization Test", False, "", 
                             "Authorization not working properly")
                return False
        else:
            print("   ⚠️  Could not create regular user for authorization test")
            # Still check if no-token case worked
            if success1:
                self.log_test("Admin Authorization Test", True, 
                             "Properly rejects access without token (401)")
                return True
            else:
                self.log_test("Admin Authorization Test", False, "", 
                             "Does not reject access without token")
                return False

    def analyze_booking_errors(self, bookings):
        """Analyze booking data for potential errors causing frontend issues"""
        print("\n🔍 Analyzing Booking Data for Frontend Compatibility...")
        
        if not bookings:
            print("   ⚠️  No bookings to analyze")
            return
        
        issues_found = []
        
        for i, booking in enumerate(bookings):
            booking_id = booking.get('id', f'booking_{i}')
            
            # Check for null/undefined values that might cause frontend issues
            critical_fields = ['id', 'tour_id', 'user_id', 'total_price', 'booking_status', 'payment_status']
            for field in critical_fields:
                value = booking.get(field)
                if value is None or value == "":
                    issues_found.append(f"Booking {booking_id}: {field} is null/empty")
            
            # Check for invalid data types
            if 'total_price' in booking:
                try:
                    float(booking['total_price'])
                except (ValueError, TypeError):
                    issues_found.append(f"Booking {booking_id}: total_price is not a valid number")
            
            if 'participants' in booking:
                try:
                    int(booking['participants'])
                except (ValueError, TypeError):
                    issues_found.append(f"Booking {booking_id}: participants is not a valid integer")
            
            # Check date format
            if 'created_at' in booking:
                created_at = booking['created_at']
                if isinstance(created_at, str):
                    try:
                        datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    except ValueError:
                        issues_found.append(f"Booking {booking_id}: created_at has invalid date format")
        
        if issues_found:
            print(f"   ❌ Found {len(issues_found)} potential issues:")
            for issue in issues_found[:10]:  # Show first 10 issues
                print(f"      • {issue}")
            if len(issues_found) > 10:
                print(f"      ... and {len(issues_found) - 10} more issues")
            
            self.log_test("Booking Data Error Analysis", False, "", 
                         f"Found {len(issues_found)} data issues that might cause frontend problems")
        else:
            print("   ✅ No critical data issues found")
            self.log_test("Booking Data Error Analysis", True, 
                         "No critical data issues found in booking data")

    def run_comprehensive_admin_bookings_test(self):
        """Run comprehensive admin bookings endpoint test"""
        print("🎯 ADMIN BOOKINGS ENDPOINT COMPREHENSIVE TEST")
        print("=" * 70)
        print("Testing admin panel reservation loading problem")
        print("Checking: Admin Login, Admin Bookings API, Data Format, Authorization")
        print("=" * 70)
        
        # Step 1: Admin Login
        print("\n🔐 STEP 1: Admin Login Test")
        admin_success, admin_user = self.test_admin_login()
        
        if not admin_success:
            print("❌ Admin login failed - cannot proceed with admin bookings test")
            self.print_final_results()
            return False
        
        print(f"   ✅ Admin user details: {admin_user.get('full_name', 'Unknown')} ({admin_user.get('email', 'Unknown')})")
        print(f"   ✅ Admin role: {admin_user.get('role', 'Unknown')}")
        
        # Step 2: Admin Bookings API Test
        print("\n📋 STEP 2: Admin Bookings API Test")
        bookings_success, bookings_data = self.test_admin_bookings_endpoint()
        
        if not bookings_success:
            print("❌ Admin bookings endpoint failed")
            self.print_final_results()
            return False
        
        print(f"   ✅ Admin bookings endpoint working")
        print(f"   ✅ Retrieved {len(bookings_data)} reservations")
        
        # Show sample booking data
        if bookings_data:
            sample_booking = bookings_data[0]
            print(f"   📋 Sample booking fields: {list(sample_booking.keys())}")
            print(f"   📋 Sample booking ID: {sample_booking.get('id', 'N/A')}")
            print(f"   📋 Sample booking status: {sample_booking.get('booking_status', 'N/A')}")
            print(f"   📋 Sample payment status: {sample_booking.get('payment_status', 'N/A')}")
        
        # Step 3: Data Format Validation
        print("\n🔍 STEP 3: Data Format Validation")
        format_valid, validation_results = self.validate_booking_data_format(bookings_data)
        
        # Step 4: Admin Authorization Test
        print("\n🔐 STEP 4: Admin Authorization Test")
        auth_success = self.test_admin_authorization()
        
        # Step 5: Error Analysis
        print("\n🔍 STEP 5: Error Analysis for Frontend Issues")
        self.analyze_booking_errors(bookings_data)
        
        # Final Results
        self.print_final_results()
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 ADMIN BOOKINGS TEST SUMMARY")
        print("=" * 70)
        
        if admin_success and bookings_success and format_valid and auth_success:
            print("✅ ALL TESTS PASSED - Admin bookings endpoint is working correctly")
            print("✅ No issues found that would cause 'rezervasyonlar yüklenemedi' error")
            return True
        else:
            print("❌ SOME TESTS FAILED - Issues found that might cause frontend problems")
            if not admin_success:
                print("   • Admin login failed")
            if not bookings_success:
                print("   • Admin bookings endpoint failed")
            if not format_valid:
                print("   • Data format validation failed")
            if not auth_success:
                print("   • Authorization test failed")
            return False

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
        
        if success_rate >= 90:
            print("🎉 EXCELLENT: Admin bookings system working perfectly!")
        elif success_rate >= 70:
            print("⚠️  GOOD: Most features working, minor issues to address")
        else:
            print("🚨 CRITICAL: Major issues detected, needs immediate attention")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test_name']}: {test['error']}")

if __name__ == "__main__":
    print("🚀 Starting Admin Bookings API Test")
    print("Testing admin panel reservation loading problem")
    print("=" * 70)
    
    tester = AdminBookingsAPITester()
    success = tester.run_comprehensive_admin_bookings_test()
    
    if success:
        print("\n🎉 Admin bookings system is working correctly!")
        sys.exit(0)
    else:
        print("\n🚨 Issues found in admin bookings system!")
        sys.exit(1)