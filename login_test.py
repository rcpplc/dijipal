#!/usr/bin/env python3
import requests
import json
import sys
from datetime import datetime

class LoginTester:
    def __init__(self, base_url="https://seo-nav-rebuild.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.test_results = []
        
    def log_test(self, name, success, details="", error=""):
        """Log test result"""
        if success:
            print(f"✅ {name} - PASSED")
            if details:
                print(f"   Details: {details}")
        else:
            print(f"❌ {name} - FAILED: {error}")
        
        self.test_results.append({
            "test_name": name,
            "success": success,
            "details": details,
            "error": error,
            "timestamp": datetime.now().isoformat()
        })
        return success

    def test_server_accessibility(self):
        """Test if backend server is accessible"""
        try:
            response = requests.get(f"{self.base_url}/docs", timeout=10)
            if response.status_code == 200:
                return self.log_test("Backend Server Accessibility", True, f"Server responding with status {response.status_code}")
            else:
                return self.log_test("Backend Server Accessibility", False, "", f"Server returned status {response.status_code}")
        except requests.exceptions.ConnectionError:
            return self.log_test("Backend Server Accessibility", False, "", "Connection error - server may be down")
        except requests.exceptions.Timeout:
            return self.log_test("Backend Server Accessibility", False, "", "Request timeout")
        except Exception as e:
            return self.log_test("Backend Server Accessibility", False, "", f"Exception: {str(e)}")

    def test_user_registration(self):
        """Test user registration to create a test user"""
        timestamp = int(datetime.now().timestamp())
        test_user_data = {
            "email": f"testuser_{timestamp}@example.com",
            "full_name": "Test User",
            "password": "TestPassword123!",
            "phone": "+90 555 123 4567",
            "role": "customer"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/auth/register",
                json=test_user_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                response_data = response.json()
                if 'token' in response_data and 'user' in response_data:
                    return self.log_test("User Registration", True, 
                                       f"User created successfully with email: {test_user_data['email']}")
                else:
                    return self.log_test("User Registration", False, "", 
                                       f"Registration successful but missing token or user data: {response_data}")
            else:
                try:
                    error_data = response.json()
                    return self.log_test("User Registration", False, "", 
                                       f"Status {response.status_code}: {error_data}")
                except:
                    return self.log_test("User Registration", False, "", 
                                       f"Status {response.status_code}: {response.text}")
        except Exception as e:
            return self.log_test("User Registration", False, "", f"Exception: {str(e)}")

    def test_login_valid_credentials(self, email, password):
        """Test login with valid credentials"""
        login_data = {
            "email": email,
            "password": password
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/auth/login",
                json=login_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                response_data = response.json()
                if 'token' in response_data and 'user' in response_data:
                    user_data = response_data['user']
                    return self.log_test("Login with Valid Credentials", True, 
                                       f"Login successful for {email}, role: {user_data.get('role', 'unknown')}")
                else:
                    return self.log_test("Login with Valid Credentials", False, "", 
                                       f"Login response missing token or user data: {response_data}")
            else:
                try:
                    error_data = response.json()
                    return self.log_test("Login with Valid Credentials", False, "", 
                                       f"Status {response.status_code}: {error_data}")
                except:
                    return self.log_test("Login with Valid Credentials", False, "", 
                                       f"Status {response.status_code}: {response.text}")
        except Exception as e:
            return self.log_test("Login with Valid Credentials", False, "", f"Exception: {str(e)}")

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        invalid_login_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/auth/login",
                json=invalid_login_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 401:
                return self.log_test("Login with Invalid Credentials", True, 
                                   "Correctly rejected invalid credentials with 401 status")
            else:
                try:
                    error_data = response.json()
                    return self.log_test("Login with Invalid Credentials", False, "", 
                                       f"Expected 401, got {response.status_code}: {error_data}")
                except:
                    return self.log_test("Login with Invalid Credentials", False, "", 
                                       f"Expected 401, got {response.status_code}: {response.text}")
        except Exception as e:
            return self.log_test("Login with Invalid Credentials", False, "", f"Exception: {str(e)}")

    def test_login_missing_fields(self):
        """Test login with missing required fields"""
        test_cases = [
            {"email": "test@example.com"},  # Missing password
            {"password": "password123"},    # Missing email
            {}                             # Missing both
        ]
        
        all_passed = True
        for i, login_data in enumerate(test_cases):
            try:
                response = requests.post(
                    f"{self.api_url}/auth/login",
                    json=login_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if response.status_code in [400, 422]:  # Bad request or validation error
                    self.log_test(f"Login Missing Fields Test {i+1}", True, 
                                f"Correctly rejected incomplete data with {response.status_code}")
                else:
                    self.log_test(f"Login Missing Fields Test {i+1}", False, "", 
                                f"Expected 400/422, got {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"Login Missing Fields Test {i+1}", False, "", f"Exception: {str(e)}")
                all_passed = False
        
        return all_passed

    def test_admin_login(self):
        """Test admin login with provided credentials"""
        admin_login_data = {
            "email": "admin@example.com",
            "password": "admin123"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/auth/login",
                json=admin_login_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                response_data = response.json()
                if 'token' in response_data and 'user' in response_data:
                    user_data = response_data['user']
                    user_role = user_data.get('role')
                    if user_role == 'admin':
                        return self.log_test("Admin Login", True, 
                                           f"Admin login successful, role: {user_role}")
                    else:
                        return self.log_test("Admin Login", False, "", 
                                           f"Login successful but user role is '{user_role}', not 'admin'")
                else:
                    return self.log_test("Admin Login", False, "", 
                                       f"Login response missing token or user data: {response_data}")
            else:
                try:
                    error_data = response.json()
                    return self.log_test("Admin Login", False, "", 
                                       f"Status {response.status_code}: {error_data}")
                except:
                    return self.log_test("Admin Login", False, "", 
                                       f"Status {response.status_code}: {response.text}")
        except Exception as e:
            return self.log_test("Admin Login", False, "", f"Exception: {str(e)}")

    def test_login_response_format(self):
        """Test login response format and required fields"""
        # First create a test user
        timestamp = int(datetime.now().timestamp())
        test_user_data = {
            "email": f"formattest_{timestamp}@example.com",
            "full_name": "Format Test User",
            "password": "FormatTest123!",
            "phone": "+90 555 987 6543",
            "role": "customer"
        }
        
        try:
            # Register user
            reg_response = requests.post(
                f"{self.api_url}/auth/register",
                json=test_user_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if reg_response.status_code != 200:
                return self.log_test("Login Response Format Test", False, "", 
                                   "Could not create test user for format testing")
            
            # Now test login response format
            login_data = {
                "email": test_user_data["email"],
                "password": test_user_data["password"]
            }
            
            response = requests.post(
                f"{self.api_url}/auth/login",
                json=login_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                response_data = response.json()
                
                # Check required fields
                required_fields = ['token', 'user']
                missing_fields = [field for field in required_fields if field not in response_data]
                
                if missing_fields:
                    return self.log_test("Login Response Format Test", False, "", 
                                       f"Missing required fields: {missing_fields}")
                
                # Check user object structure
                user_data = response_data['user']
                user_required_fields = ['id', 'email', 'full_name', 'role']
                missing_user_fields = [field for field in user_required_fields if field not in user_data]
                
                if missing_user_fields:
                    return self.log_test("Login Response Format Test", False, "", 
                                       f"Missing required user fields: {missing_user_fields}")
                
                # Check token format (should be a string)
                token = response_data['token']
                if not isinstance(token, str) or len(token) < 10:
                    return self.log_test("Login Response Format Test", False, "", 
                                       f"Invalid token format: {type(token)}, length: {len(token) if isinstance(token, str) else 'N/A'}")
                
                return self.log_test("Login Response Format Test", True, 
                                   f"Response format correct with all required fields")
            else:
                return self.log_test("Login Response Format Test", False, "", 
                                   f"Login failed with status {response.status_code}")
                
        except Exception as e:
            return self.log_test("Login Response Format Test", False, "", f"Exception: {str(e)}")

    def run_comprehensive_login_tests(self):
        """Run all login-related tests"""
        print("🔐 COMPREHENSIVE LOGIN FUNCTIONALITY TESTING")
        print("=" * 60)
        print(f"Backend URL: {self.base_url}")
        print()
        
        # Test 1: Server accessibility
        print("📡 PHASE 1: Server Accessibility")
        server_accessible = self.test_server_accessibility()
        print()
        
        if not server_accessible:
            print("❌ Server not accessible, cannot proceed with login tests")
            self.print_summary()
            return
        
        # Test 2: User registration (to create test users)
        print("👤 PHASE 2: User Registration")
        reg_success = self.test_user_registration()
        print()
        
        # Test 3: Valid login scenarios
        print("🔑 PHASE 3: Valid Login Tests")
        if reg_success:
            # Extract email from the last registration
            last_reg_result = [r for r in self.test_results if r['test_name'] == 'User Registration' and r['success']]
            if last_reg_result:
                # We know the pattern from registration
                timestamp = int(datetime.now().timestamp())
                test_email = f"testuser_{timestamp}@example.com"
                self.test_login_valid_credentials(test_email, "TestPassword123!")
        
        # Test admin login
        self.test_admin_login()
        print()
        
        # Test 4: Invalid login scenarios
        print("❌ PHASE 4: Invalid Login Tests")
        self.test_login_invalid_credentials()
        self.test_login_missing_fields()
        print()
        
        # Test 5: Response format validation
        print("📋 PHASE 5: Response Format Validation")
        self.test_login_response_format()
        print()
        
        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("=" * 60)
        print("📊 LOGIN TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['success']])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        print()
        
        if success_rate >= 80:
            print("🎉 EXCELLENT: Login functionality is working well!")
        elif success_rate >= 60:
            print("⚠️  GOOD: Most login features working, some issues to address")
        else:
            print("🚨 CRITICAL: Major login issues detected, needs immediate attention")
        
        # Print failed tests
        failed_tests_list = [r for r in self.test_results if not r['success']]
        if failed_tests_list:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests_list:
                print(f"   • {test['test_name']}: {test['error']}")
        
        print("\n✅ PASSED TESTS:")
        passed_tests_list = [r for r in self.test_results if r['success']]
        for test in passed_tests_list:
            print(f"   • {test['test_name']}")

if __name__ == "__main__":
    tester = LoginTester()
    tester.run_comprehensive_login_tests()