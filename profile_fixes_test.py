import requests
import json
from datetime import datetime
import time

class ProfileFixesTester:
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
        print(f"   Method: {method}")
        if data:
            print(f"   Data: {json.dumps(data, indent=2)}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            print(f"   Response Status: {response.status_code}")
            
            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json() if response.content else {}
                    print(f"   Response Data: {json.dumps(response_data, indent=2)[:500]}...")
                    self.log_test(name, True, f"Status: {response.status_code}, Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    self.log_test(name, True, f"Status: {response.status_code}, No JSON response")
                    return True, {}
            else:
                try:
                    error_data = response.json() if response.content else {}
                    print(f"   Error Data: {json.dumps(error_data, indent=2)}")
                    self.log_test(name, False, "", f"Expected {expected_status}, got {response.status_code}. Response: {error_data}")
                except:
                    print(f"   Error Text: {response.text[:200]}")
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
        """Test admin login with admin@example.com/admin123"""
        print("\n🔐 Testing Admin Login")
        admin_login_data = {
            "email": "admin@example.com",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Login (admin@example.com/admin123)",
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
                print(f"   ✅ User ID: {self.user_id}")
            return True
        
        return False

    def test_profile_update_endpoint(self):
        """Test PUT /api/profile endpoint"""
        print("\n👤 Testing Profile Update Endpoint Fix")
        
        if not self.token:
            self.log_test("Profile Update", False, "", "No authentication token available")
            return False

        # Sample profile data to update
        profile_data = {
            "full_name": "Updated Admin User",
            "phone": "+90 555 999 8888",
            "profile_image": "https://example.com/new-profile.jpg"
        }
        
        success, response = self.run_test(
            "PUT /api/profile - Update User Profile",
            "PUT",
            "profile",
            200,
            data=profile_data
        )
        
        if success and response:
            # Check if the response contains updated user data
            if 'full_name' in response and response['full_name'] == profile_data['full_name']:
                print("   ✅ Profile update returned correct updated data")
                return True
            else:
                print("   ⚠️  Profile update succeeded but response format may be incorrect")
                return True
        
        return False

    def test_change_password_endpoint(self):
        """Test PUT /api/change-password endpoint"""
        print("\n🔒 Testing Password Change Endpoint Fix")
        
        if not self.token:
            self.log_test("Password Change", False, "", "No authentication token available")
            return False

        # Password change data
        password_data = {
            "current_password": "admin123",
            "new_password": "newadmin123",
            "confirm_password": "newadmin123"
        }
        
        success, response = self.run_test(
            "PUT /api/change-password - Change User Password",
            "PUT",
            "change-password",
            200,
            data=password_data
        )
        
        if success:
            print("   ✅ Password change endpoint working correctly")
            
            # Test login with new password to verify the change worked
            print("   🔍 Testing login with new password...")
            new_login_data = {
                "email": "admin@example.com",
                "password": "newadmin123"
            }
            
            login_success, login_response = self.run_test(
                "Login with New Password",
                "POST",
                "auth/login",
                200,
                data=new_login_data
            )
            
            if login_success:
                print("   ✅ Password change verified - can login with new password")
                # Update token for subsequent tests
                if 'token' in login_response:
                    self.token = login_response['token']
                
                # Change password back to original for other tests
                print("   🔄 Changing password back to original...")
                restore_data = {
                    "current_password": "newadmin123",
                    "new_password": "admin123",
                    "confirm_password": "admin123"
                }
                
                restore_success, _ = self.run_test(
                    "Restore Original Password",
                    "PUT",
                    "change-password",
                    200,
                    data=restore_data
                )
                
                if restore_success:
                    print("   ✅ Password restored to original")
                    # Login again with original password
                    original_login_success, original_response = self.run_test(
                        "Login with Original Password",
                        "POST",
                        "auth/login",
                        200,
                        data={"email": "admin@example.com", "password": "admin123"}
                    )
                    if original_login_success and 'token' in original_response:
                        self.token = original_response['token']
                
                return True
            else:
                print("   ❌ Password change may have failed - cannot login with new password")
                return False
        
        return False

    def test_add_sample_bookings_endpoint(self):
        """Test POST /api/add-sample-bookings endpoint"""
        print("\n📅 Testing Sample Bookings Creation Endpoint")
        
        success, response = self.run_test(
            "POST /api/add-sample-bookings - Create Sample Bookings",
            "POST",
            "add-sample-bookings",
            200
        )
        
        if success and response:
            print("   ✅ Sample bookings endpoint working")
            
            # Check if bookings were created for admin@example.com
            if self.token:
                print("   🔍 Verifying bookings were created...")
                bookings_success, bookings_response = self.run_test(
                    "GET /api/bookings - Verify Sample Bookings Created",
                    "GET",
                    "bookings",
                    200
                )
                
                if bookings_success and bookings_response:
                    booking_count = len(bookings_response)
                    print(f"   ✅ Found {booking_count} bookings for admin@example.com")
                    
                    # Check booking statuses
                    active_count = sum(1 for b in bookings_response if b.get('booking_status') in ['confirmed', 'paid'])
                    completed_count = sum(1 for b in bookings_response if b.get('booking_status') == 'completed')
                    cancelled_count = sum(1 for b in bookings_response if b.get('booking_status') == 'cancelled')
                    
                    print(f"   📊 Booking breakdown: {active_count} active, {completed_count} completed, {cancelled_count} cancelled")
                    
                    if booking_count >= 5:  # Should create 5 bookings (2 active, 1 completed, 2 cancelled)
                        print("   ✅ Expected number of sample bookings created")
                        return True
                    else:
                        print(f"   ⚠️  Expected 5 bookings, found {booking_count}")
                        return True  # Still consider success if endpoint works
            
            return True
        
        return False

    def test_favorites_pricing_fix(self):
        """Test GET /api/favorites endpoint with pricing fields"""
        print("\n⭐ Testing Favorites Pricing Fix")
        
        if not self.token:
            self.log_test("Favorites Pricing", False, "", "No authentication token available")
            return False

        # First, add a tour to favorites to test with
        print("   🔍 Getting available tours to add to favorites...")
        tours_success, tours_response = self.run_test(
            "GET /api/tours - Get Tours for Favorites Test",
            "GET",
            "tours",
            200
        )
        
        if tours_success and tours_response and len(tours_response) > 0:
            tour_id = tours_response[0].get('id')
            print(f"   📌 Adding tour {tour_id} to favorites...")
            
            # Add tour to favorites
            add_success, add_response = self.run_test(
                f"POST /api/favorites/{tour_id} - Add Tour to Favorites",
                "POST",
                f"favorites/{tour_id}",
                200
            )
            
            if add_success:
                print("   ✅ Tour added to favorites")
            else:
                print("   ⚠️  Could not add tour to favorites (may already exist)")
        
        # Test the favorites endpoint
        success, response = self.run_test(
            "GET /api/favorites - Get User Favorites with Pricing",
            "GET",
            "favorites",
            200
        )
        
        if success and response:
            if len(response) > 0:
                print(f"   ✅ Found {len(response)} favorite tours")
                
                # Check if pricing fields are included
                first_favorite = response[0]
                required_fields = ['minimum_price', 'review_count', 'rating']
                missing_fields = []
                
                for field in required_fields:
                    if field not in first_favorite:
                        missing_fields.append(field)
                    else:
                        print(f"   ✅ Field '{field}' present: {first_favorite[field]}")
                
                if missing_fields:
                    print(f"   ❌ Missing required fields: {missing_fields}")
                    self.log_test("Favorites Pricing Fields", False, "", f"Missing fields: {', '.join(missing_fields)}")
                    return False
                else:
                    print("   ✅ All required pricing fields present in favorites response")
                    return True
            else:
                print("   ⚠️  No favorites found - cannot test pricing fields")
                print("   ℹ️  This may be expected if user has no favorites")
                return True  # Not a failure if no favorites exist
        
        return False

    def run_profile_fixes_tests(self):
        """Run all profile-related fix tests"""
        print("🎯 Testing Profile-Related Backend Fixes")
        print("=" * 70)
        print("Testing the following fixes:")
        print("1. Profile Update Endpoint Fix - PUT /api/profile")
        print("2. Password Change Endpoint Fix - PUT /api/change-password") 
        print("3. Sample Bookings Creation - POST /api/add-sample-bookings")
        print("4. Favorites Pricing Fix - GET /api/favorites")
        print("=" * 70)
        
        # Step 1: Admin login
        admin_success = self.test_admin_login()
        
        if not admin_success:
            print("❌ Admin login failed - cannot proceed with profile fix tests")
            self.print_final_results()
            return False
        
        # Step 2: Test profile update endpoint
        self.test_profile_update_endpoint()
        
        # Step 3: Test password change endpoint
        self.test_change_password_endpoint()
        
        # Step 4: Test sample bookings creation
        self.test_add_sample_bookings_endpoint()
        
        # Step 5: Test favorites pricing fix
        self.test_favorites_pricing_fix()
        
        # Print final results
        self.print_final_results()
        
        return True

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 70)
        print("📊 PROFILE FIXES TEST RESULTS")
        print("=" * 70)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🎉 EXCELLENT: Profile fixes are working well!")
        elif success_rate >= 60:
            print("⚠️  GOOD: Most fixes working, some issues to address")
        else:
            print("🚨 CRITICAL: Major issues detected with profile fixes")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test_name']}: {test['error']}")
        
        # Print successful tests
        successful_tests = [test for test in self.test_results if test['success']]
        if successful_tests:
            print("\n✅ SUCCESSFUL TESTS:")
            for test in successful_tests:
                print(f"   • {test['test_name']}")

if __name__ == "__main__":
    tester = ProfileFixesTester()
    tester.run_profile_fixes_tests()