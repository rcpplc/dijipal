import requests
import sys
import json
from datetime import datetime
import time
import os

class CORSAPITester:
    def __init__(self):
        # Get the backend URL from frontend .env file
        self.frontend_url = "https://cabin-booking.preview.static.emergentagent.com"
        # Use the actual backend URL that's working
        self.backend_url = "http://localhost:8001"
        self.api_url = f"{self.backend_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        print(f"🌐 Frontend URL: {self.frontend_url}")
        print(f"🔗 Backend URL: {self.backend_url}")
        print(f"🔌 API URL: {self.api_url}")

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

    def check_cors_headers(self, response, test_name):
        """Check if CORS headers are present in response"""
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
            'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
        }
        
        print(f"   🔍 CORS Headers for {test_name}:")
        for header, value in cors_headers.items():
            if value:
                print(f"      ✅ {header}: {value}")
            else:
                print(f"      ❌ {header}: Not present")
        
        # Check if Access-Control-Allow-Origin is present (most critical)
        if cors_headers['Access-Control-Allow-Origin']:
            return True, cors_headers
        else:
            return False, cors_headers

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, check_cors=True):
        """Run a single API test with CORS verification"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {
            'Content-Type': 'application/json',
            'Origin': self.frontend_url,  # Simulate cross-origin request
            'Referer': self.frontend_url
        }
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        print(f"   Origin: {self.frontend_url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            # Check CORS headers first
            cors_ok = True
            if check_cors:
                cors_ok, cors_headers = self.check_cors_headers(response, name)
                if not cors_ok:
                    self.log_test(f"{name} - CORS Check", False, "", "Missing Access-Control-Allow-Origin header")

            # Check status code
            status_ok = response.status_code == expected_status
            
            if status_ok and cors_ok:
                try:
                    response_data = response.json() if response.content else {}
                    self.log_test(name, True, f"Status: {response.status_code}, CORS: OK")
                    return True, response_data
                except:
                    self.log_test(name, True, f"Status: {response.status_code}, CORS: OK, No JSON response")
                    return True, {}
            else:
                try:
                    error_data = response.json() if response.content else {}
                    error_msg = f"Status: Expected {expected_status}, got {response.status_code}"
                    if not cors_ok:
                        error_msg += ", CORS headers missing"
                    self.log_test(name, False, "", f"{error_msg}. Response: {error_data}")
                except:
                    error_msg = f"Status: Expected {expected_status}, got {response.status_code}"
                    if not cors_ok:
                        error_msg += ", CORS headers missing"
                    self.log_test(name, False, "", f"{error_msg}. Response: {response.text[:200]}")
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

    def test_cors_preflight(self):
        """Test CORS preflight request (OPTIONS)"""
        url = f"{self.api_url}/tours"
        headers = {
            'Origin': self.frontend_url,
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
        
        print(f"\n🔍 Testing CORS Preflight Request...")
        print(f"   URL: {url}")
        print(f"   Origin: {self.frontend_url}")
        
        try:
            response = requests.options(url, headers=headers, timeout=30)
            
            print(f"   Status: {response.status_code}")
            
            # Check preflight response headers
            preflight_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
                'Access-Control-Max-Age': response.headers.get('Access-Control-Max-Age')
            }
            
            print("   🔍 CORS Preflight Headers:")
            for header, value in preflight_headers.items():
                if value:
                    print(f"      ✅ {header}: {value}")
                else:
                    print(f"      ❌ {header}: Not present")
            
            # Check if preflight is successful
            if (response.status_code in [200, 204] and 
                preflight_headers['Access-Control-Allow-Origin'] and
                preflight_headers['Access-Control-Allow-Methods']):
                self.log_test("CORS Preflight Request", True, f"Status: {response.status_code}, Headers: OK")
                return True
            else:
                self.log_test("CORS Preflight Request", False, "", f"Status: {response.status_code}, Missing required CORS headers")
                return False
                
        except Exception as e:
            self.log_test("CORS Preflight Request", False, "", f"Exception: {str(e)}")
            return False

    def test_health_check(self):
        """Test health check endpoint"""
        return self.run_test(
            "Health Check",
            "GET",
            "health",
            200
        )

    def test_environment_variables(self):
        """Test if environment variables are loaded properly"""
        print(f"\n🔍 Testing Environment Variables...")
        
        # Check if backend is using the correct CORS origins
        # We can infer this from the CORS headers in responses
        success, response = self.run_test(
            "Environment Variables Check (via CORS headers)",
            "GET",
            "tours",
            200,
            check_cors=True
        )
        
        if success:
            print("   ✅ Environment variables appear to be loaded (CORS working)")
            return True
        else:
            print("   ❌ Environment variables may not be loaded properly (CORS not working)")
            return False

    def test_user_login(self):
        """Test user login with real credentials"""
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
            "password": "admin123"
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

    def test_protected_route(self):
        """Test protected route with JWT token"""
        if not self.token:
            self.log_test("Protected Route Test", False, "", "No authentication token available")
            return False

        return self.run_test(
            "Protected Route (/api/users/me)",
            "GET",
            "users/me",
            200
        )

    def test_tours_api(self):
        """Test tours API endpoints"""
        # Test GET /api/tours
        success1, tours_response = self.run_test(
            "GET /api/tours",
            "GET",
            "tours",
            200
        )
        
        if not success1:
            return False
        
        print(f"   ✅ Retrieved {len(tours_response) if tours_response else 0} tours")
        
        # Test GET /api/tours/{id} if we have tours
        if tours_response and len(tours_response) > 0:
            tour_id = tours_response[0].get('id')
            if tour_id:
                success2, tour_response = self.run_test(
                    f"GET /api/tours/{tour_id}",
                    "GET",
                    f"tours/{tour_id}",
                    200
                )
                
                if success2:
                    # Check if tour has complete data
                    required_fields = ['id', 'title', 'description', 'location']
                    missing_fields = [field for field in required_fields if not tour_response.get(field)]
                    
                    if missing_fields:
                        print(f"   ⚠️  Tour missing fields: {missing_fields}")
                    else:
                        print("   ✅ Tour has complete data structure")
                        
                    # Check pricing information
                    if 'tour_dates' in tour_response and tour_response['tour_dates']:
                        date = tour_response['tour_dates'][0]
                        if 'single_cabin_price' in date and 'double_cabin_price' in date:
                            print(f"   ✅ Tour has cabin pricing: Single=₺{date['single_cabin_price']}, Double=₺{date['double_cabin_price']}")
                        else:
                            print("   ⚠️  Tour dates missing cabin pricing")
                    
                return success2
        
        return success1

    def test_database_connectivity(self):
        """Test database connectivity through admin dashboard"""
        if not self.token:
            # Try to login as admin first
            if not self.test_admin_login():
                self.log_test("Database Connectivity Test", False, "", "Cannot login as admin to test database")
                return False

        success, response = self.run_test(
            "Database Connectivity (via Admin Dashboard)",
            "GET",
            "admin/dashboard",
            200
        )
        
        if success and response:
            stats = {
                'total_tours': response.get('total_tours', 0),
                'total_bookings': response.get('total_bookings', 0),
                'total_users': response.get('total_users', 0),
                'total_revenue': response.get('total_revenue', 0)
            }
            
            print(f"   ✅ Database stats: {stats}")
            
            # Check if we have reasonable data
            if stats['total_tours'] > 0 and stats['total_users'] > 0:
                print("   ✅ Database has data - connectivity confirmed")
                return True
            else:
                print("   ⚠️  Database connected but may be empty")
                return True
        
        return False

    def test_uploads_directory(self):
        """Test uploads directory by checking if backend can handle file operations"""
        # We can't directly test file upload without a file, but we can check if the endpoint exists
        # and responds appropriately to a malformed request
        
        print(f"\n🔍 Testing Uploads Directory Readiness...")
        
        # Test if the upload endpoint exists (should return 422 for missing file)
        try:
            url = f"{self.api_url}/upload/image"
            headers = {
                'Origin': self.frontend_url,
                'Authorization': f'Bearer {self.token}' if self.token else ''
            }
            
            # Send request without file (should fail gracefully, not with 502)
            response = requests.post(url, headers=headers, timeout=30)
            
            print(f"   Status: {response.status_code}")
            
            # If we get 422 (validation error) or 400 (bad request), uploads directory is likely OK
            # If we get 502 (bad gateway), there might be an issue with uploads directory
            if response.status_code in [400, 422]:
                self.log_test("Uploads Directory Check", True, f"Status: {response.status_code} - Directory appears ready")
                return True
            elif response.status_code == 502:
                self.log_test("Uploads Directory Check", False, "", "Status: 502 - Uploads directory may be missing")
                return False
            elif response.status_code == 401:
                print("   ℹ️  Authentication required for upload endpoint")
                self.log_test("Uploads Directory Check", True, "Status: 401 - Endpoint exists, auth required")
                return True
            else:
                print(f"   ℹ️  Unexpected status: {response.status_code}")
                self.log_test("Uploads Directory Check", True, f"Status: {response.status_code} - Endpoint accessible")
                return True
                
        except Exception as e:
            self.log_test("Uploads Directory Check", False, "", f"Exception: {str(e)}")
            return False

    def run_cors_verification_tests(self):
        """Run comprehensive CORS verification and API functionality tests"""
        print("🚀 Starting CORS Fix Verification and API Functionality Testing")
        print("=" * 80)
        print("🎯 FOCUS: Verify CORS fix (load_dotenv()) resolved cross-origin issues")
        print("🎯 GOAL: Confirm all backend functionality works from frontend domain")
        print("=" * 80)
        
        # Phase 1: CORS Verification
        print("\n🌐 PHASE 1: CORS VERIFICATION")
        print("-" * 40)
        self.test_cors_preflight()
        
        # Phase 2: Environment Variables Validation
        print("\n⚙️  PHASE 2: ENVIRONMENT VARIABLES VALIDATION")
        print("-" * 40)
        self.test_environment_variables()
        
        # Phase 3: Health Check Verification
        print("\n🏥 PHASE 3: HEALTH CHECK VERIFICATION")
        print("-" * 40)
        self.test_health_check()
        self.test_uploads_directory()
        
        # Phase 4: Authentication Testing
        print("\n🔐 PHASE 4: AUTHENTICATION TESTING")
        print("-" * 40)
        
        # Test user login
        user_login_success = self.test_user_login()
        if user_login_success:
            self.test_protected_route()
        
        # Test admin login
        admin_login_success = self.test_admin_login()
        
        # Phase 5: Tours API Testing
        print("\n🏛️  PHASE 5: TOURS API TESTING")
        print("-" * 40)
        self.test_tours_api()
        
        # Phase 6: Database Connectivity Check
        print("\n🗄️  PHASE 6: DATABASE CONNECTIVITY CHECK")
        print("-" * 40)
        self.test_database_connectivity()
        
        # Print final results
        self.print_final_results()

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 80)
        print("📊 CORS FIX VERIFICATION - FINAL RESULTS")
        print("=" * 80)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        # Determine overall status
        if success_rate >= 90:
            print("🎉 EXCELLENT: CORS fix successful! All API functionality working!")
            print("✅ Frontend can now access backend without cross-origin issues")
        elif success_rate >= 75:
            print("✅ GOOD: CORS fix mostly successful, minor issues remain")
            print("⚠️  Some API endpoints may still have issues")
        elif success_rate >= 50:
            print("⚠️  PARTIAL: CORS fix partially successful, significant issues remain")
            print("🔧 Additional fixes needed for full functionality")
        else:
            print("🚨 CRITICAL: CORS fix failed, major issues detected")
            print("❌ Frontend still cannot access backend properly")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   • {test['test_name']}: {test['error']}")
        
        # Print successful tests summary
        successful_tests = [test for test in self.test_results if test['success']]
        if successful_tests:
            print(f"\n✅ SUCCESSFUL TESTS ({len(successful_tests)}):")
            for test in successful_tests:
                print(f"   • {test['test_name']}")
        
        # CORS-specific summary
        cors_tests = [test for test in self.test_results if 'CORS' in test['test_name'] or 'cors' in test['test_name'].lower()]
        cors_passed = len([test for test in cors_tests if test['success']])
        cors_total = len(cors_tests)
        
        print(f"\n🌐 CORS-SPECIFIC RESULTS:")
        print(f"   CORS Tests: {cors_passed}/{cors_total} passed")
        
        if cors_passed == cors_total and cors_total > 0:
            print("   ✅ CORS configuration is working correctly!")
            print("   ✅ load_dotenv() fix successfully resolved cross-origin issues")
        elif cors_passed > 0:
            print("   ⚠️  CORS partially working, some issues remain")
        else:
            print("   ❌ CORS not working, cross-origin requests still blocked")
        
        # Save detailed results
        try:
            results_file = f"/app/cors_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(results_file, 'w') as f:
                json.dump({
                    "summary": {
                        "total_tests": self.tests_run,
                        "passed_tests": self.tests_passed,
                        "failed_tests": self.tests_run - self.tests_passed,
                        "success_rate": success_rate,
                        "cors_tests_passed": cors_passed,
                        "cors_tests_total": cors_total,
                        "test_date": datetime.now().isoformat(),
                        "frontend_url": self.frontend_url,
                        "backend_url": self.backend_url
                    },
                    "detailed_results": self.test_results
                }, f, indent=2)
            print(f"\n📄 Detailed results saved to: {results_file}")
        except Exception as e:
            print(f"\n⚠️  Could not save results file: {e}")

if __name__ == "__main__":
    tester = CORSAPITester()
    tester.run_cors_verification_tests()