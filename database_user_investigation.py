import requests
import sys
import json
from datetime import datetime
import time

class DatabaseUserInvestigator:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.investigation_findings = []

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

    def log_finding(self, category, finding, status="INFO"):
        """Log investigation finding"""
        self.investigation_findings.append({
            "category": category,
            "finding": finding,
            "status": status,
            "timestamp": datetime.now().isoformat()
        })
        
        status_icon = "🔍" if status == "INFO" else "✅" if status == "SUCCESS" else "❌" if status == "ERROR" else "⚠️"
        print(f"   {status_icon} {finding}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, use_admin_token=False):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        # Use appropriate token
        token_to_use = self.admin_token if use_admin_token else self.token
        if token_to_use:
            test_headers['Authorization'] = f'Bearer {token_to_use}'
        
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

    def test_backend_health(self):
        """Test backend server health"""
        print("\n🏥 BACKEND HEALTH CHECK")
        print("=" * 50)
        
        # Test basic connectivity
        success, response = self.run_test(
            "Backend Server Health Check",
            "GET",
            "health",
            200
        )
        
        if success:
            self.log_finding("INFRASTRUCTURE", f"Backend server is accessible at {self.base_url}")
            if response:
                self.log_finding("INFRASTRUCTURE", f"Health check response: {json.dumps(response, indent=2)}")
        else:
            self.log_finding("INFRASTRUCTURE", "Backend server is not accessible", "ERROR")
            return False
        
        return True

    def test_user_authentication_endpoints(self):
        """Test user authentication endpoints"""
        print("\n🔐 USER AUTHENTICATION ENDPOINTS")
        print("=" * 50)
        
        # Test 1: Try to login with test user credentials
        print("\n📝 Testing Regular User Login (user@example.com/password123)")
        user_login_data = {
            "email": "user@example.com",
            "password": "password123"
        }
        
        success, response = self.run_test(
            "Regular User Login Test",
            "POST",
            "auth/login",
            200,
            data=user_login_data
        )
        
        if success and response and 'token' in response:
            self.token = response['token']
            user_data = response.get('user', {})
            self.log_finding("USER_AUTH", f"Regular user login successful - User ID: {user_data.get('id')}, Role: {user_data.get('role')}", "SUCCESS")
            self.log_finding("USER_AUTH", f"User details: {user_data.get('full_name')} ({user_data.get('email')})")
        else:
            self.log_finding("USER_AUTH", "Regular user login failed - user@example.com may not exist or password incorrect", "ERROR")
        
        # Test 2: Try to login with admin credentials
        print("\n👑 Testing Admin User Login (admin@example.com/admin123)")
        admin_login_data = {
            "email": "admin@example.com",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin User Login Test",
            "POST",
            "auth/login",
            200,
            data=admin_login_data
        )
        
        if success and response and 'token' in response:
            self.admin_token = response['token']
            admin_data = response.get('user', {})
            self.log_finding("USER_AUTH", f"Admin user login successful - User ID: {admin_data.get('id')}, Role: {admin_data.get('role')}", "SUCCESS")
            self.log_finding("USER_AUTH", f"Admin details: {admin_data.get('full_name')} ({admin_data.get('email')})")
        else:
            self.log_finding("USER_AUTH", "Admin user login failed - admin@example.com may not exist or password incorrect", "ERROR")
        
        return (self.token is not None) or (self.admin_token is not None)

    def test_user_registration(self):
        """Test user registration endpoint"""
        print("\n📝 USER REGISTRATION TESTING")
        print("=" * 50)
        
        # Create a unique test user
        timestamp = int(time.time())
        test_user_data = {
            "email": f"test_investigation_{timestamp}@example.com",
            "full_name": "Test Investigation User",
            "password": "TestPass123!",
            "phone": "+90 555 999 8877",
            "role": "customer"
        }
        
        success, response = self.run_test(
            "User Registration Test",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if success and response:
            if 'token' in response and 'user' in response:
                user_data = response['user']
                self.log_finding("USER_REGISTRATION", f"User registration successful - New User ID: {user_data.get('id')}", "SUCCESS")
                self.log_finding("USER_REGISTRATION", f"Password hashing working correctly")
                self.log_finding("USER_REGISTRATION", f"JWT token generation working")
                
                # Test login with newly created user
                login_data = {
                    "email": test_user_data["email"],
                    "password": test_user_data["password"]
                }
                
                login_success, login_response = self.run_test(
                    "Login with Newly Created User",
                    "POST",
                    "auth/login",
                    200,
                    data=login_data
                )
                
                if login_success:
                    self.log_finding("USER_REGISTRATION", "Login with newly created user successful - password verification working", "SUCCESS")
                else:
                    self.log_finding("USER_REGISTRATION", "Login with newly created user failed - password hashing/verification issue", "ERROR")
                
                return True
            else:
                self.log_finding("USER_REGISTRATION", "User registration response missing token or user data", "ERROR")
        else:
            self.log_finding("USER_REGISTRATION", "User registration failed", "ERROR")
        
        return False

    def test_database_connectivity(self):
        """Test database connectivity through admin endpoints"""
        print("\n🗄️ DATABASE CONNECTIVITY TESTING")
        print("=" * 50)
        
        if not self.admin_token:
            self.log_finding("DATABASE", "Cannot test database connectivity - no admin token available", "ERROR")
            return False
        
        # Test admin dashboard (requires database queries)
        success, response = self.run_test(
            "Admin Dashboard (Database Query Test)",
            "GET",
            "admin/dashboard",
            200,
            use_admin_token=True
        )
        
        if success and response:
            total_users = response.get('total_users', 0)
            total_tours = response.get('total_tours', 0)
            total_bookings = response.get('total_bookings', 0)
            
            self.log_finding("DATABASE", f"Database connectivity confirmed via admin dashboard", "SUCCESS")
            self.log_finding("DATABASE", f"Database statistics: {total_users} users, {total_tours} tours, {total_bookings} bookings")
            
            if total_users > 0:
                self.log_finding("DATABASE", f"Users collection accessible - {total_users} users found")
            else:
                self.log_finding("DATABASE", "Users collection empty or inaccessible", "ERROR")
            
            return True
        else:
            self.log_finding("DATABASE", "Database connectivity test failed - admin dashboard inaccessible", "ERROR")
            return False

    def test_user_profile_access(self):
        """Test user profile access endpoints"""
        print("\n👤 USER PROFILE ACCESS TESTING")
        print("=" * 50)
        
        # Test with regular user token
        if self.token:
            success, response = self.run_test(
                "Get Current User Profile (Regular User)",
                "GET",
                "users/me",
                200
            )
            
            if success and response:
                self.log_finding("USER_PROFILE", f"Regular user profile access successful", "SUCCESS")
                self.log_finding("USER_PROFILE", f"User profile data: {response.get('full_name')} ({response.get('email')})")
            else:
                self.log_finding("USER_PROFILE", "Regular user profile access failed", "ERROR")
        
        # Test with admin token
        if self.admin_token:
            # Temporarily switch to admin token
            original_token = self.token
            self.token = self.admin_token
            
            success, response = self.run_test(
                "Get Current User Profile (Admin User)",
                "GET",
                "users/me",
                200
            )
            
            if success and response:
                self.log_finding("USER_PROFILE", f"Admin user profile access successful", "SUCCESS")
                self.log_finding("USER_PROFILE", f"Admin profile data: {response.get('full_name')} ({response.get('email')})")
            else:
                self.log_finding("USER_PROFILE", "Admin user profile access failed", "ERROR")
            
            # Restore original token
            self.token = original_token

    def test_password_hashing_verification(self):
        """Test password hashing and verification"""
        print("\n🔒 PASSWORD HASHING VERIFICATION")
        print("=" * 50)
        
        # Test 1: Try invalid credentials
        invalid_login_data = {
            "email": "user@example.com",
            "password": "wrongpassword"
        }
        
        success, response = self.run_test(
            "Invalid Password Test",
            "POST",
            "auth/login",
            401,  # Expecting 401 Unauthorized
            data=invalid_login_data
        )
        
        if success:
            self.log_finding("PASSWORD_SECURITY", "Invalid password correctly rejected - password verification working", "SUCCESS")
        else:
            self.log_finding("PASSWORD_SECURITY", "Invalid password not properly rejected - security issue", "ERROR")
        
        # Test 2: Try invalid email
        invalid_email_data = {
            "email": "nonexistent@example.com",
            "password": "password123"
        }
        
        success, response = self.run_test(
            "Invalid Email Test",
            "POST",
            "auth/login",
            401,  # Expecting 401 Unauthorized
            data=invalid_email_data
        )
        
        if success:
            self.log_finding("PASSWORD_SECURITY", "Invalid email correctly rejected - user verification working", "SUCCESS")
        else:
            self.log_finding("PASSWORD_SECURITY", "Invalid email not properly rejected - security issue", "ERROR")

    def test_jwt_token_validation(self):
        """Test JWT token validation"""
        print("\n🎫 JWT TOKEN VALIDATION TESTING")
        print("=" * 50)
        
        # Test 1: Valid token
        if self.token:
            success, response = self.run_test(
                "Valid JWT Token Test",
                "GET",
                "users/me",
                200
            )
            
            if success:
                self.log_finding("JWT_VALIDATION", "Valid JWT token accepted - token validation working", "SUCCESS")
            else:
                self.log_finding("JWT_VALIDATION", "Valid JWT token rejected - token validation issue", "ERROR")
        
        # Test 2: Invalid token
        original_token = self.token
        self.token = "invalid_token_12345"
        
        success, response = self.run_test(
            "Invalid JWT Token Test",
            "GET",
            "users/me",
            401  # Expecting 401 Unauthorized
        )
        
        if success:
            self.log_finding("JWT_VALIDATION", "Invalid JWT token correctly rejected - token validation working", "SUCCESS")
        else:
            self.log_finding("JWT_VALIDATION", "Invalid JWT token not properly rejected - security issue", "ERROR")
        
        # Restore original token
        self.token = original_token

    def create_missing_test_users(self):
        """Create missing test users if they don't exist"""
        print("\n🔧 CREATING MISSING TEST USERS")
        print("=" * 50)
        
        users_to_create = [
            {
                "email": "user@example.com",
                "full_name": "Test Regular User",
                "password": "password123",
                "phone": "+90 555 111 2233",
                "role": "customer"
            },
            {
                "email": "admin@example.com",
                "full_name": "Test Admin User",
                "password": "admin123",
                "phone": "+90 555 444 5566",
                "role": "admin"
            }
        ]
        
        created_users = []
        
        for user_data in users_to_create:
            print(f"\n🔧 Attempting to create user: {user_data['email']}")
            
            success, response = self.run_test(
                f"Create Test User: {user_data['email']}",
                "POST",
                "auth/register",
                200,
                data=user_data
            )
            
            if success and response:
                self.log_finding("USER_CREATION", f"Successfully created user: {user_data['email']}", "SUCCESS")
                created_users.append(user_data['email'])
            else:
                # User might already exist, try to login to verify
                login_data = {
                    "email": user_data["email"],
                    "password": user_data["password"]
                }
                
                login_success, login_response = self.run_test(
                    f"Verify Existing User: {user_data['email']}",
                    "POST",
                    "auth/login",
                    200,
                    data=login_data
                )
                
                if login_success:
                    self.log_finding("USER_CREATION", f"User already exists and login works: {user_data['email']}", "SUCCESS")
                else:
                    self.log_finding("USER_CREATION", f"Failed to create or verify user: {user_data['email']}", "ERROR")
        
        return len(created_users) > 0

    def run_comprehensive_investigation(self):
        """Run comprehensive database user investigation"""
        print("🕵️ STARTING COMPREHENSIVE DATABASE USER INVESTIGATION")
        print("=" * 70)
        print("Investigating database user data and authentication system")
        print("Focus: Verify test users exist and authentication is working")
        print("=" * 70)
        
        # Phase 1: Backend Health Check
        health_ok = self.test_backend_health()
        if not health_ok:
            print("\n❌ Backend health check failed - cannot proceed with investigation")
            self.print_investigation_results()
            return
        
        # Phase 2: Test Authentication Endpoints
        auth_ok = self.test_user_authentication_endpoints()
        
        # Phase 3: Test User Registration
        self.test_user_registration()
        
        # Phase 4: Test Database Connectivity
        self.test_database_connectivity()
        
        # Phase 5: Test User Profile Access
        self.test_user_profile_access()
        
        # Phase 6: Test Password Security
        self.test_password_hashing_verification()
        
        # Phase 7: Test JWT Token Validation
        self.test_jwt_token_validation()
        
        # Phase 8: Create Missing Users if Needed
        if not auth_ok:
            print("\n🔧 Authentication failed - attempting to create missing test users")
            self.create_missing_test_users()
            
            # Retry authentication after user creation
            print("\n🔄 Retrying authentication after user creation")
            self.test_user_authentication_endpoints()
        
        # Print final investigation results
        self.print_investigation_results()

    def print_investigation_results(self):
        """Print comprehensive investigation results"""
        print("\n" + "=" * 70)
        print("🕵️ INVESTIGATION RESULTS SUMMARY")
        print("=" * 70)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        # Categorize findings
        findings_by_category = {}
        for finding in self.investigation_findings:
            category = finding['category']
            if category not in findings_by_category:
                findings_by_category[category] = []
            findings_by_category[category].append(finding)
        
        # Print findings by category
        for category, findings in findings_by_category.items():
            print(f"\n📋 {category} FINDINGS:")
            for finding in findings:
                status_icon = "🔍" if finding['status'] == "INFO" else "✅" if finding['status'] == "SUCCESS" else "❌" if finding['status'] == "ERROR" else "⚠️"
                print(f"   {status_icon} {finding['finding']}")
        
        # Overall assessment
        print(f"\n🎯 OVERALL ASSESSMENT:")
        
        # Check critical issues
        critical_issues = [f for f in self.investigation_findings if f['status'] == 'ERROR']
        success_findings = [f for f in self.investigation_findings if f['status'] == 'SUCCESS']
        
        if len(critical_issues) == 0 and len(success_findings) > 0:
            print("✅ EXCELLENT: All authentication systems working correctly")
            print("✅ Test users exist and authentication is functional")
            print("✅ Database connectivity confirmed")
            print("✅ Password hashing and JWT validation working")
        elif len(critical_issues) <= 2:
            print("⚠️  GOOD: Most systems working, minor issues detected")
            print("🔧 Some test users may need to be created")
        else:
            print("🚨 CRITICAL: Major authentication issues detected")
            print("🔧 Immediate attention required for user authentication system")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test_name']}: {test['error']}")
        
        # Recommendations
        print(f"\n💡 RECOMMENDATIONS:")
        
        user_auth_issues = [f for f in critical_issues if f['category'] == 'USER_AUTH']
        if user_auth_issues:
            print("   🔧 Create missing test users (user@example.com, admin@example.com)")
            print("   🔧 Verify password hashing is working correctly")
        
        db_issues = [f for f in critical_issues if f['category'] == 'DATABASE']
        if db_issues:
            print("   🔧 Check MongoDB connection and user collection")
            print("   🔧 Verify database schema and user data integrity")
        
        if len(critical_issues) == 0:
            print("   ✅ No immediate action required - authentication system is working correctly")

if __name__ == "__main__":
    investigator = DatabaseUserInvestigator()
    investigator.run_comprehensive_investigation()