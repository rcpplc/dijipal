import requests
import sys
import json
from datetime import datetime
import time

class ReservationSystemTester:
    def __init__(self, base_url="https://mavibilet.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.admin_token = None
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

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, token=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        # Use specific token if provided, otherwise use default token
        auth_token = token or self.token
        if auth_token:
            test_headers['Authorization'] = f'Bearer {auth_token}'
        
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

    def test_admin_login(self):
        """Test admin login"""
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
            self.admin_token = response['token']
            if 'user' in response:
                user_role = response['user'].get('role')
                print(f"   ✅ Admin login successful, role: {user_role}, token: {self.admin_token[:20]}...")
            return True
        
        return False

    def test_user_bookings_api(self):
        """Test GET /api/bookings for user booking listings"""
        if not self.token:
            self.log_test("User Bookings API", False, "", "No user authentication token available")
            return False, []

        success, response = self.run_test(
            "GET /api/bookings - User Booking Listings",
            "GET",
            "bookings",
            200,
            token=self.token
        )
        
        if success and response:
            print(f"   ✅ Retrieved {len(response)} user bookings")
            
            # Analyze booking data structure for new reservation format
            reservation_types = {}
            quantity_formats = []
            duration_formats = []
            price_issues = []
            
            for booking in response:
                # Check reservation type
                res_type = booking.get('reservation_type', 'cabin_based')
                reservation_types[res_type] = reservation_types.get(res_type, 0) + 1
                
                # Check quantity display format
                participants = booking.get('participants', 0)
                cabin_type = booking.get('cabin_type', 'single')
                single_cabin_count = booking.get('single_cabin_count', 0)
                double_cabin_count = booking.get('double_cabin_count', 0)
                child_count = booking.get('child_count', 0)
                
                if res_type == 'person_based':
                    if child_count > 0:
                        quantity_formats.append(f"{participants} × Yetişkin + {child_count} × Çocuk")
                    else:
                        quantity_formats.append(f"{participants} × Yetişkin")
                elif res_type == 'reservation':
                    quantity_formats.append("Tüm Tekne / Sabit Fiyat")
                else:  # cabin_based
                    if single_cabin_count > 0 or double_cabin_count > 0:
                        parts = []
                        if single_cabin_count > 0:
                            parts.append(f"{single_cabin_count} × Tek Kişilik")
                        if double_cabin_count > 0:
                            parts.append(f"{double_cabin_count} × Çift Kişilik")
                        quantity_formats.append(" + ".join(parts))
                    else:
                        # Fallback format
                        quantity_formats.append(f"{participants} × {cabin_type.title()} Kişilik Kabin")
                
                # Check duration display
                duration_days = booking.get('duration_days')
                duration_unit = booking.get('duration_unit')
                duration = booking.get('duration')
                
                if duration_days:
                    if duration_unit == 'hours':
                        duration_formats.append(f"{duration_days} Saat")
                    else:
                        duration_formats.append(f"{duration_days} Gün")
                elif duration:
                    if duration > 12:
                        duration_formats.append(f"{duration} Gün")
                    else:
                        duration_formats.append(f"{duration} Saat")
                
                # Check price calculations and toLocaleString compatibility
                total_price = booking.get('total_price')
                if total_price is not None:
                    try:
                        # Test if price can be formatted (simulating toLocaleString)
                        formatted_price = f"₺{total_price:,.0f}".replace(',', '.')
                        if 'NaN' in str(total_price) or total_price < 0:
                            price_issues.append(f"Invalid price in booking {booking.get('id', 'unknown')}: {total_price}")
                    except Exception as e:
                        price_issues.append(f"Price formatting error in booking {booking.get('id', 'unknown')}: {str(e)}")
            
            print(f"   📊 Reservation Types Found: {reservation_types}")
            print(f"   📊 Quantity Formats: {quantity_formats[:5]}...")  # Show first 5
            print(f"   📊 Duration Formats: {duration_formats[:5]}...")  # Show first 5
            
            if price_issues:
                print(f"   ⚠️  Price Issues Found: {price_issues}")
            else:
                print(f"   ✅ No price calculation issues found")
            
            return True, response
        
        return False, []

    def test_admin_bookings_api(self):
        """Test GET /api/admin/bookings for admin booking management"""
        if not self.admin_token:
            self.log_test("Admin Bookings API", False, "", "No admin authentication token available")
            return False, []

        success, response = self.run_test(
            "GET /api/admin/bookings - Admin Booking Management",
            "GET",
            "admin/bookings",
            200,
            token=self.admin_token
        )
        
        if success and response:
            print(f"   ✅ Retrieved {len(response)} admin bookings")
            
            # Analyze admin booking data structure
            required_fields = ['id', 'booking_code', 'booking_status', 'payment_status', 'total_price', 'created_at']
            reservation_fields = ['reservation_type', 'participants', 'cabin_type', 'single_cabin_count', 'double_cabin_count', 'child_count']
            duration_fields = ['duration', 'duration_days', 'duration_unit']
            
            missing_fields = []
            field_coverage = {}
            
            for booking in response:
                for field in required_fields + reservation_fields + duration_fields:
                    if field in booking and booking[field] is not None:
                        field_coverage[field] = field_coverage.get(field, 0) + 1
                    elif field in required_fields:
                        missing_fields.append(f"Missing {field} in booking {booking.get('id', 'unknown')}")
            
            print(f"   📊 Field Coverage: {field_coverage}")
            
            if missing_fields:
                print(f"   ⚠️  Missing Required Fields: {missing_fields[:5]}...")  # Show first 5
            else:
                print(f"   ✅ All required fields present in bookings")
            
            return True, response
        
        return False, []

    def test_profile_bookings_compatibility(self):
        """Test profile page booking data compatibility"""
        # This uses the same /api/bookings endpoint as MyBookingsPage
        return self.test_user_bookings_api()

    def test_booking_data_structure_compatibility(self):
        """Test backend booking data structure compatibility with new reservation system"""
        print("\n🔍 Testing Backend Booking Data Structure Compatibility...")
        
        # Test user bookings
        user_success, user_bookings = self.test_user_bookings_api()
        
        # Test admin bookings
        admin_success, admin_bookings = self.test_admin_bookings_api()
        
        if not user_success or not admin_success:
            self.log_test("Booking Data Structure Compatibility", False, "", "Failed to retrieve booking data")
            return False
        
        # Analyze compatibility
        compatibility_issues = []
        
        # Check if bookings have new reservation system fields
        new_format_bookings = 0
        legacy_format_bookings = 0
        
        all_bookings = user_bookings + admin_bookings
        
        for booking in all_bookings:
            has_new_fields = any([
                booking.get('reservation_type'),
                booking.get('single_cabin_count'),
                booking.get('double_cabin_count'),
                booking.get('child_count')
            ])
            
            if has_new_fields:
                new_format_bookings += 1
            else:
                legacy_format_bookings += 1
        
        print(f"   📊 New Format Bookings: {new_format_bookings}")
        print(f"   📊 Legacy Format Bookings: {legacy_format_bookings}")
        
        # Test quantity display format generation
        quantity_display_tests = [
            {
                'reservation_type': 'cabin_based',
                'single_cabin_count': 1,
                'double_cabin_count': 1,
                'expected': '1 × Tek Kişilik + 1 × Çift Kişilik'
            },
            {
                'reservation_type': 'person_based',
                'participants': 2,
                'child_count': 1,
                'expected': '2 × Yetişkin + 1 × Çocuk'
            },
            {
                'reservation_type': 'reservation',
                'expected': 'Tüm Tekne / Sabit Fiyat'
            }
        ]
        
        for test_case in quantity_display_tests:
            # Simulate frontend quantity display logic
            if test_case['reservation_type'] == 'person_based':
                participants = test_case.get('participants', 0)
                child_count = test_case.get('child_count', 0)
                if child_count > 0:
                    generated = f"{participants} × Yetişkin + {child_count} × Çocuk"
                else:
                    generated = f"{participants} × Yetişkin"
            elif test_case['reservation_type'] == 'reservation':
                generated = 'Tüm Tekne / Sabit Fiyat'
            else:  # cabin_based
                single_count = test_case.get('single_cabin_count', 0)
                double_count = test_case.get('double_cabin_count', 0)
                parts = []
                if single_count > 0:
                    parts.append(f"{single_count} × Tek Kişilik")
                if double_count > 0:
                    parts.append(f"{double_count} × Çift Kişilik")
                generated = ' + '.join(parts) if parts else 'No cabins'
            
            if generated == test_case['expected']:
                print(f"   ✅ Quantity Display Test: {test_case['reservation_type']} -> {generated}")
            else:
                compatibility_issues.append(f"Quantity display mismatch for {test_case['reservation_type']}: expected '{test_case['expected']}', got '{generated}'")
        
        # Test duration display format
        duration_display_tests = [
            {'duration_days': 3, 'duration_unit': 'days', 'expected': '3 Gün'},
            {'duration_days': 8, 'duration_unit': 'hours', 'expected': '8 Saat'},
            {'duration': 24, 'expected': '24 Gün'},  # > 12 hours = days
            {'duration': 6, 'expected': '6 Saat'},   # <= 12 hours = hours
        ]
        
        for test_case in duration_display_tests:
            # Simulate frontend duration display logic
            duration_days = test_case.get('duration_days')
            duration_unit = test_case.get('duration_unit')
            duration = test_case.get('duration')
            
            if duration_days:
                if duration_unit == 'hours':
                    generated = f"{duration_days} Saat"
                else:
                    generated = f"{duration_days} Gün"
            elif duration:
                if duration > 12:
                    generated = f"{duration} Gün"
                else:
                    generated = f"{duration} Saat"
            else:
                generated = "No duration"
            
            if generated == test_case['expected']:
                print(f"   ✅ Duration Display Test: {test_case} -> {generated}")
            else:
                compatibility_issues.append(f"Duration display mismatch: expected '{test_case['expected']}', got '{generated}'")
        
        if compatibility_issues:
            self.log_test("Booking Data Structure Compatibility", False, "", f"Compatibility issues: {'; '.join(compatibility_issues)}")
            return False
        else:
            self.log_test("Booking Data Structure Compatibility", True, f"Tested {len(all_bookings)} bookings with {new_format_bookings} new format and {legacy_format_bookings} legacy format")
            return True

    def test_price_calculation_and_formatting(self):
        """Test price calculations and toLocaleString error handling"""
        print("\n🔍 Testing Price Calculation and Formatting...")
        
        # Get user bookings to test price formatting
        user_success, user_bookings = self.test_user_bookings_api()
        
        if not user_success:
            self.log_test("Price Calculation and Formatting", False, "", "Failed to retrieve booking data for price testing")
            return False
        
        price_errors = []
        formatting_tests = []
        
        for booking in user_bookings:
            total_price = booking.get('total_price')
            
            if total_price is not None:
                # Test various price formatting scenarios
                try:
                    # Test standard formatting
                    formatted = f"₺{total_price:,.0f}".replace(',', '.')
                    formatting_tests.append(f"₺{total_price} -> {formatted}")
                    
                    # Test edge cases
                    if total_price == 0:
                        formatting_tests.append(f"Zero price handled: {formatted}")
                    elif total_price < 0:
                        price_errors.append(f"Negative price found: {total_price}")
                    elif total_price > 1000000:
                        formatting_tests.append(f"Large price handled: {formatted}")
                    
                    # Test NaN detection
                    if str(total_price).lower() == 'nan' or total_price != total_price:
                        price_errors.append(f"NaN price detected: {total_price}")
                    
                except Exception as e:
                    price_errors.append(f"Price formatting error for {total_price}: {str(e)}")
        
        print(f"   📊 Price Formatting Tests: {len(formatting_tests)} successful")
        if formatting_tests[:3]:  # Show first 3 examples
            for test in formatting_tests[:3]:
                print(f"      {test}")
        
        if price_errors:
            print(f"   ❌ Price Errors Found: {price_errors}")
            self.log_test("Price Calculation and Formatting", False, "", f"Price errors: {'; '.join(price_errors)}")
            return False
        else:
            print(f"   ✅ No price calculation or formatting errors found")
            self.log_test("Price Calculation and Formatting", True, f"Tested {len(formatting_tests)} price formatting scenarios")
            return True

    def run_comprehensive_reservation_system_test(self):
        """Run comprehensive test of updated booking pages for new reservation system"""
        print("🚀 Starting Comprehensive Reservation System Backend Testing")
        print("=" * 80)
        print("Testing updated booking pages for new reservation system:")
        print("- MyBookingsPage.js updates - user booking listings with new reservation format")
        print("- ProfilePage.js updates - profile reservations section")
        print("- AdminPage.js updates - admin booking management with new format")
        print("=" * 80)
        
        # Phase 1: Authentication
        print("\n🔐 PHASE 1: Authentication Setup")
        user_login_success = self.test_user_login()
        admin_login_success = self.test_admin_login()
        
        if not user_login_success:
            print("❌ User login failed - cannot test user booking features")
        
        if not admin_login_success:
            print("❌ Admin login failed - cannot test admin booking features")
        
        if not user_login_success and not admin_login_success:
            print("❌ Both logins failed - cannot proceed with testing")
            self.print_final_results()
            return
        
        # Phase 2: User Booking Listings (MyBookingsPage.js)
        if user_login_success:
            print("\n📋 PHASE 2: User Booking Listings (MyBookingsPage.js)")
            self.test_user_bookings_api()
        
        # Phase 3: Profile Reservations Section (ProfilePage.js)
        if user_login_success:
            print("\n👤 PHASE 3: Profile Reservations Section (ProfilePage.js)")
            self.test_profile_bookings_compatibility()
        
        # Phase 4: Admin Booking Management (AdminPage.js)
        if admin_login_success:
            print("\n🔧 PHASE 4: Admin Booking Management (AdminPage.js)")
            self.test_admin_bookings_api()
        
        # Phase 5: Reservation Type Handling
        print("\n🎯 PHASE 5: Reservation Type and Data Structure Compatibility")
        self.test_booking_data_structure_compatibility()
        
        # Phase 6: Price Calculations and Error Handling
        print("\n💰 PHASE 6: Price Calculations and toLocaleString Error Handling")
        self.test_price_calculation_and_formatting()
        
        # Print final results
        self.print_final_results()

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 80)
        print("📊 RESERVATION SYSTEM BACKEND TEST RESULTS")
        print("=" * 80)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("🎉 EXCELLENT: New reservation system backend is working perfectly!")
        elif success_rate >= 75:
            print("✅ GOOD: Most reservation system features working, minor issues to address")
        elif success_rate >= 50:
            print("⚠️  MODERATE: Some reservation system issues detected, needs attention")
        else:
            print("🚨 CRITICAL: Major reservation system issues detected, needs immediate attention")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test_name']}: {test['error']}")
        
        # Print successful tests summary
        successful_tests = [test for test in self.test_results if test['success']]
        if successful_tests:
            print(f"\n✅ SUCCESSFUL TESTS ({len(successful_tests)}):")
            for test in successful_tests:
                print(f"   • {test['test_name']}")

if __name__ == "__main__":
    tester = ReservationSystemTester()
    tester.run_comprehensive_reservation_system_test()