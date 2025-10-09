import requests
import sys
import json
from datetime import datetime
import time
import hashlib
import os

class AdminLoginTester:
    def __init__(self, base_url="https://tour-admin-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.admin_user = None
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

            success = response.status_code == expected_status
            
            print(f"   Status Code: {response.status_code} (Expected: {expected_status})")
            
            if success:
                try:
                    response_data = response.json() if response.content else {}
                    print(f"   Response: {json.dumps(response_data, indent=2)[:500]}...")
                    self.log_test(name, True, f"Status: {response.status_code}")
                    return True, response_data
                except:
                    self.log_test(name, True, f"Status: {response.status_code}, No JSON response")
                    return True, {}
            else:
                try:
                    error_data = response.json() if response.content else {}
                    print(f"   Error Response: {json.dumps(error_data, indent=2)}")
                    self.log_test(name, False, "", f"Expected {expected_status}, got {response.status_code}. Response: {error_data}")
                except:
                    print(f"   Error Response: {response.text[:200]}")
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

    def test_backend_server_health(self):
        """Test if backend server is accessible"""
        print("\n🏥 Testing Backend Server Health")
        try:
            response = requests.get(self.base_url, timeout=10)
            if response.status_code == 200:
                self.log_test("Backend Server Health", True, f"Server accessible at {self.base_url}")
                return True
            else:
                self.log_test("Backend Server Health", False, "", f"Server returned {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Backend Server Health", False, "", f"Server not accessible: {str(e)}")
            return False

    def check_admin_user_in_database(self):
        """Check if admin user exists by attempting login"""
        print("\n👤 Step 1: Check if admin@example.com exists in database")
        
        # Try to login to see if user exists
        admin_login_data = {
            "email": "admin@example.com",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Check Admin User Existence (via login attempt)",
            "POST",
            "auth/login",
            200,  # If user exists and password is correct
            data=admin_login_data
        )
        
        if success:
            print("   ✅ Admin user exists and password is correct")
            return True, response
        else:
            print("   ❌ Admin user either doesn't exist or password is incorrect")
            return False, response

    def verify_admin_password_hash(self):
        """Verify admin password hash matches expected value"""
        print("\n🔐 Step 2: Verify admin password hash")
        
        # We can't directly access the database, but we can infer from login success
        # The backend uses SHA256 with SECRET_KEY
        print("   ℹ️  Password hash verification can only be done indirectly via login success")
        print("   ℹ️  Backend uses SHA256(password + SECRET_KEY) for hashing")
        
        # Try with correct password
        correct_login = {
            "email": "admin@example.com", 
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Verify Password Hash (Correct Password)",
            "POST",
            "auth/login", 
            200,
            data=correct_login
        )
        
        if success:
            print("   ✅ Password hash verification successful (login succeeded)")
            return True
        
        # Try with wrong password to confirm hash verification
        wrong_login = {
            "email": "admin@example.com",
            "password": "wrongpassword"
        }
        
        wrong_success, wrong_response = self.run_test(
            "Verify Password Hash (Wrong Password - Should Fail)",
            "POST", 
            "auth/login",
            401,  # Should fail with 401
            data=wrong_login
        )
        
        if wrong_success:
            print("   ✅ Password hash verification working (wrong password correctly rejected)")
            return True
        else:
            print("   ❌ Password hash verification may have issues")
            return False

    def test_admin_login_detailed(self):
        """Test POST /api/auth/login with admin credentials"""
        print("\n🔑 Step 3: Test POST /api/auth/login with admin credentials")
        
        admin_login_data = {
            "email": "admin@example.com",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Login (POST /api/auth/login)",
            "POST",
            "auth/login",
            200,
            data=admin_login_data
        )
        
        if success and response:
            # Check if token is returned
            if 'token' in response:
                self.token = response['token']
                print(f"   ✅ Token received: {self.token[:20]}...")
                
                # Check if user data is returned
                if 'user' in response:
                    self.admin_user = response['user']
                    print(f"   ✅ User data received: {json.dumps(self.admin_user, indent=2)}")
                    return True
                else:
                    print("   ❌ No user data in response")
                    return False
            else:
                print("   ❌ No token in response")
                return False
        
        return False

    def verify_token_returned(self):
        """Step 4: Verify response returns token"""
        print("\n🎫 Step 4: Verify response returns token")
        
        if self.token:
            print(f"   ✅ Token confirmed: {self.token[:30]}...")
            print(f"   ✅ Token length: {len(self.token)} characters")
            
            # Try to decode token (basic validation)
            try:
                import jwt
                # We can't decode without the secret, but we can check if it's a valid JWT format
                parts = self.token.split('.')
                if len(parts) == 3:
                    print("   ✅ Token has valid JWT format (3 parts)")
                    return True
                else:
                    print("   ❌ Token doesn't have valid JWT format")
                    return False
            except ImportError:
                print("   ℹ️  JWT library not available, skipping token format validation")
                return True
        else:
            print("   ❌ No token available")
            return False

    def verify_admin_role(self):
        """Step 5: Verify admin role is correct"""
        print("\n👑 Step 5: Verify admin role is correct")
        
        if self.admin_user:
            user_role = self.admin_user.get('role')
            user_email = self.admin_user.get('email')
            user_id = self.admin_user.get('id')
            
            print(f"   📧 Email: {user_email}")
            print(f"   🆔 User ID: {user_id}")
            print(f"   👤 Role: {user_role}")
            
            if user_role == 'admin':
                print("   ✅ Admin role verified correctly")
                return True
            else:
                print(f"   ❌ Expected role 'admin', got '{user_role}'")
                return False
        else:
            print("   ❌ No admin user data available")
            return False

    def test_admin_endpoints_access(self):
        """Test access to admin-only endpoints"""
        print("\n🔧 Step 6: Test admin endpoints access")
        
        if not self.token:
            print("   ❌ No token available for admin endpoint testing")
            return False
        
        # Test admin dashboard
        dashboard_success, dashboard_response = self.run_test(
            "Admin Dashboard Access",
            "GET",
            "admin/dashboard",
            200
        )
        
        if dashboard_success:
            print("   ✅ Admin dashboard accessible")
            if dashboard_response:
                print(f"   📊 Dashboard data: {json.dumps(dashboard_response, indent=2)}")
        
        # Test admin tours
        tours_success, tours_response = self.run_test(
            "Admin Tours Access", 
            "GET",
            "admin/tours",
            200
        )
        
        if tours_success:
            print("   ✅ Admin tours endpoint accessible")
            if tours_response:
                print(f"   📋 Found {len(tours_response)} tours in admin panel")
        
        # Test admin users
        users_success, users_response = self.run_test(
            "Admin Users Access",
            "GET", 
            "admin/users",
            200
        )
        
        if users_success:
            print("   ✅ Admin users endpoint accessible")
            if users_response:
                print(f"   👥 Found {len(users_response)} users in system")
        
        return dashboard_success and tours_success and users_success

    def test_user_profile_endpoint(self):
        """Test /api/users/me endpoint with admin token"""
        print("\n👤 Step 7: Test /api/users/me endpoint")
        
        if not self.token:
            print("   ❌ No token available")
            return False
        
        success, response = self.run_test(
            "Get Current User Profile",
            "GET",
            "users/me", 
            200
        )
        
        if success and response:
            print(f"   ✅ User profile retrieved: {json.dumps(response, indent=2)}")
            
            # Verify it matches our admin user
            if response.get('email') == 'admin@example.com' and response.get('role') == 'admin':
                print("   ✅ Profile matches admin user")
                return True
            else:
                print("   ❌ Profile doesn't match expected admin user")
                return False
        
        return False

    def test_invalid_admin_credentials(self):
        """Test with invalid admin credentials"""
        print("\n🚫 Step 8: Test invalid admin credentials")
        
        # Test wrong password
        wrong_password = {
            "email": "admin@example.com",
            "password": "wrongpassword"
        }
        
        success1, response1 = self.run_test(
            "Invalid Password Test",
            "POST",
            "auth/login",
            401,  # Should return 401 Unauthorized
            data=wrong_password
        )
        
        # Test wrong email
        wrong_email = {
            "email": "wrongadmin@example.com", 
            "password": "admin123"
        }
        
        success2, response2 = self.run_test(
            "Invalid Email Test",
            "POST",
            "auth/login", 
            401,  # Should return 401 Unauthorized
            data=wrong_email
        )
        
        # Test missing fields
        missing_password = {
            "email": "admin@example.com"
        }
        
        success3, response3 = self.run_test(
            "Missing Password Test",
            "POST",
            "auth/login",
            422,  # Should return 422 Validation Error
            data=missing_password
        )
        
        if success1 and success2:
            print("   ✅ Invalid credentials properly rejected")
            return True
        else:
            print("   ❌ Invalid credentials not properly handled")
            return False

    def create_admin_user_if_missing(self):
        """Create admin user if it doesn't exist"""
        print("\n🔧 Creating admin user if missing")
        
        success, response = self.run_test(
            "Create Admin User",
            "POST",
            "create-admin-user",
            200
        )
        
        if success:
            print("   ✅ Admin user creation endpoint called successfully")
            return True
        else:
            print("   ⚠️  Admin user creation endpoint may not exist or failed")
            return False

    def run_comprehensive_admin_login_test(self):
        """Run comprehensive admin login testing"""
        print("🎯 COMPREHENSIVE ADMIN LOGIN TESTING")
        print("=" * 70)
        print("Testing admin login functionality as requested:")
        print("1. Admin user account check - database admin@example.com exists?")
        print("2. Admin password correct? admin123 hash matches?") 
        print("3. POST /api/auth/login admin login test")
        print("4. Response returns token?")
        print("5. Admin role correct?")
        print("=" * 70)
        
        # Pre-test: Check backend server health
        server_healthy = self.test_backend_server_health()
        if not server_healthy:
            print("❌ Backend server not accessible, cannot proceed with tests")
            self.print_final_results()
            return
        
        # Step 1: Check if admin user exists
        admin_exists, login_response = self.check_admin_user_in_database()
        
        if not admin_exists:
            print("\n🔧 Admin user may not exist, attempting to create...")
            self.create_admin_user_if_missing()
            
            # Try again after creation
            admin_exists, login_response = self.check_admin_user_in_database()
        
        if admin_exists:
            # If login was successful, we already have token and user data
            if 'token' in login_response:
                self.token = login_response['token']
            if 'user' in login_response:
                self.admin_user = login_response['user']
        
        # Step 2: Verify password hash
        self.verify_admin_password_hash()
        
        # Step 3: Detailed admin login test
        if not self.token:  # Only if we don't already have token
            self.test_admin_login_detailed()
        
        # Step 4: Verify token returned
        self.verify_token_returned()
        
        # Step 5: Verify admin role
        self.verify_admin_role()
        
        # Step 6: Test admin endpoints access
        self.test_admin_endpoints_access()
        
        # Step 7: Test user profile endpoint
        self.test_user_profile_endpoint()
        
        # Step 8: Test invalid credentials
        self.test_invalid_admin_credentials()
        
        # Print final results
        self.print_final_results()

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 70)
        print("📊 ADMIN LOGIN TEST RESULTS")
        print("=" * 70)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("🎉 EXCELLENT: Admin login system working perfectly!")
        elif success_rate >= 70:
            print("⚠️  GOOD: Admin login mostly working, minor issues")
        else:
            print("🚨 CRITICAL: Admin login has major issues")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test_name']}: {test['error']}")
        
        # Print successful tests
        passed_tests = [test for test in self.test_results if test['success']]
        if passed_tests:
            print("\n✅ PASSED TESTS:")
            for test in passed_tests:
                print(f"   • {test['test_name']}")

if __name__ == "__main__":
    tester = AdminLoginTester()
    tester.run_comprehensive_admin_login_test()