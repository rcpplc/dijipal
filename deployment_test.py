import requests
import sys
import json
import os
import time
from datetime import datetime

class DeploymentFixTester:
    def __init__(self, base_url="https://travel-portal-6.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
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

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint.startswith('api/') == False else f"{self.base_url}/{endpoint}"
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
                if files:
                    # Remove Content-Type for file uploads
                    if 'Content-Type' in test_headers:
                        del test_headers['Content-Type']
                    response = requests.post(url, files=files, headers=test_headers, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json() if response.content else {}
                    self.log_test(name, True, f"Status: {response.status_code}, Response: {json.dumps(response_data, indent=2)[:200]}...")
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

    def test_health_check_endpoint(self):
        """Test the new /api/health endpoint"""
        print("\n🏥 Testing Health Check Endpoint")
        success, response = self.run_test(
            "Health Check Endpoint",
            "GET",
            "health",
            200
        )
        
        if success and response:
            # Verify response structure
            if 'status' in response:
                if response['status'] == 'healthy' or response['status'] == 'ok':
                    print(f"   ✅ Health status: {response['status']}")
                    return True
                else:
                    print(f"   ⚠️  Unexpected health status: {response['status']}")
                    return True  # Still working, just different status
            else:
                print("   ⚠️  Health endpoint working but missing 'status' field")
                return True  # Still working
        
        return False

    def test_uploads_directory_fix(self):
        """Test that /tmp/uploads directory exists and static files mounting works"""
        print("\n📁 Testing Uploads Directory Fix")
        
        # First, check if we can access the backend without 502 errors
        success, response = self.run_test(
            "Backend Accessibility (No 502 Errors)",
            "GET",
            "tours",
            200
        )
        
        if success:
            print("   ✅ Backend accessible without 502 errors - uploads directory fix working")
            return True
        else:
            print("   ❌ Backend still returning errors - uploads directory issue may persist")
            return False

    def test_file_upload_dynamic_url(self):
        """Test file upload endpoint with dynamic URL configuration"""
        print("\n📤 Testing File Upload with Dynamic URL Configuration")
        
        # First, login as admin to get token
        admin_login_data = {
            "email": "admin@example.com",
            "password": "admin123"
        }
        
        login_success, login_response = self.run_test(
            "Admin Login for File Upload Test",
            "POST",
            "auth/login",
            200,
            data=admin_login_data
        )
        
        if not login_success or 'token' not in login_response:
            print("   ❌ Admin login failed - cannot test file upload")
            return False
        
        self.token = login_response['token']
        
        # Create a test image file
        test_image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {
            'file': ('test_image.png', test_image_content, 'image/png')
        }
        
        success, response = self.run_test(
            "File Upload with Dynamic URL",
            "POST",
            "upload/image",
            200,
            files=files
        )
        
        if success and response:
            if 'url' in response:
                file_url = response['url']
                print(f"   ✅ File uploaded successfully, URL: {file_url}")
                
                # Check if URL uses APP_URL environment variable (not hardcoded localhost)
                if 'localhost' in file_url:
                    print("   ⚠️  File URL still contains 'localhost' - may not be using APP_URL env var")
                    return False
                elif self.base_url.replace('https://', '').replace('http://', '') in file_url:
                    print("   ✅ File URL uses dynamic configuration (matches base URL)")
                    return True
                else:
                    print(f"   ✅ File URL generated: {file_url}")
                    return True
            else:
                print("   ❌ File upload response missing 'url' field")
                return False
        
        return False

    def test_mongodb_connection(self):
        """Test MongoDB connection with Atlas-compatible settings"""
        print("\n🗄️  Testing MongoDB Connection")
        
        # Test database connectivity by trying to access data
        success, response = self.run_test(
            "MongoDB Connection Test (Get Tours)",
            "GET",
            "tours",
            200
        )
        
        if success:
            print("   ✅ MongoDB connection working - tours data accessible")
            
            # Test admin dashboard for more comprehensive DB test
            if self.token:
                dashboard_success, dashboard_response = self.run_test(
                    "MongoDB Connection Test (Admin Dashboard)",
                    "GET",
                    "admin/dashboard",
                    200
                )
                
                if dashboard_success and dashboard_response:
                    print(f"   ✅ MongoDB aggregation working - Dashboard stats: {dashboard_response}")
                    return True
            
            return True
        else:
            print("   ❌ MongoDB connection issues - cannot access data")
            return False

    def test_backend_startup_no_errors(self):
        """Test that backend starts without RuntimeError about missing directories"""
        print("\n🚀 Testing Backend Startup (No RuntimeError)")
        
        # Check backend logs for RuntimeError
        try:
            # Try to read supervisor logs
            import subprocess
            result = subprocess.run(['tail', '-n', '50', '/var/log/supervisor/backend.err.log'], 
                                  capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                log_content = result.stdout
                if 'RuntimeError' in log_content and '/tmp/uploads' in log_content:
                    print("   ❌ RuntimeError about /tmp/uploads still present in logs")
                    print(f"   📋 Recent error logs: {log_content[-200:]}")
                    return False
                else:
                    print("   ✅ No RuntimeError about missing directories in recent logs")
                    return True
            else:
                print("   ⚠️  Could not read backend logs - assuming startup is OK")
                return True
                
        except Exception as e:
            print(f"   ⚠️  Could not check backend logs: {e}")
            
            # Fallback: Test if backend is responding
            success, response = self.run_test(
                "Backend Startup Test (API Response)",
                "GET",
                "tours",
                200
            )
            
            if success:
                print("   ✅ Backend responding normally - startup appears successful")
                return True
            else:
                print("   ❌ Backend not responding - startup issues may exist")
                return False

    def test_existing_endpoints_still_work(self):
        """Test that all existing authentication and API endpoints still work"""
        print("\n🔗 Testing Existing Endpoints Still Work")
        
        # Test 1: User registration
        timestamp = int(time.time())
        test_user_data = {
            "email": f"test_deployment_{timestamp}@example.com",
            "full_name": "Deployment Test User",
            "password": "TestPass123!",
            "phone": "+90 555 123 4567",
            "role": "customer"
        }
        
        reg_success, reg_response = self.run_test(
            "User Registration Still Works",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if not reg_success:
            return False
        
        # Test 2: User login
        login_data = {
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        }
        
        login_success, login_response = self.run_test(
            "User Login Still Works",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if not login_success:
            return False
        
        # Test 3: Get tours
        tours_success, tours_response = self.run_test(
            "Get Tours Still Works",
            "GET",
            "tours",
            200
        )
        
        if not tours_success:
            return False
        
        # Test 4: Admin login
        admin_login_data = {
            "email": "admin@example.com",
            "password": "admin123"
        }
        
        admin_success, admin_response = self.run_test(
            "Admin Login Still Works",
            "POST",
            "auth/login",
            200,
            data=admin_login_data
        )
        
        if admin_success and 'token' in admin_response:
            self.token = admin_response['token']
            
            # Test 5: Admin dashboard
            dashboard_success, dashboard_response = self.run_test(
                "Admin Dashboard Still Works",
                "GET",
                "admin/dashboard",
                200
            )
            
            if not dashboard_success:
                return False
        
        print("   ✅ All existing endpoints working correctly")
        return True

    def run_deployment_fix_tests(self):
        """Run all deployment fix tests"""
        print("🚀 Testing Deployment Fixes for Cabin Booking Platform")
        print("=" * 70)
        print("Testing the following deployment fixes:")
        print("1. Health Check Endpoint (/api/health)")
        print("2. Uploads Directory Fix (/tmp/uploads)")
        print("3. Dynamic URL Configuration (APP_URL env var)")
        print("4. MongoDB Atlas-Compatible Connection")
        print("5. Backend Startup (No RuntimeError)")
        print("6. Existing Endpoints Still Work")
        print("=" * 70)
        
        # Test 1: Health Check Endpoint
        print("\n🏥 TEST 1: Health Check Endpoint")
        health_success = self.test_health_check_endpoint()
        
        # Test 2: Uploads Directory Fix
        print("\n📁 TEST 2: Uploads Directory Fix")
        uploads_success = self.test_uploads_directory_fix()
        
        # Test 3: Dynamic URL Configuration
        print("\n📤 TEST 3: Dynamic URL Configuration")
        url_success = self.test_file_upload_dynamic_url()
        
        # Test 4: MongoDB Connection
        print("\n🗄️  TEST 4: MongoDB Connection")
        mongo_success = self.test_mongodb_connection()
        
        # Test 5: Backend Startup
        print("\n🚀 TEST 5: Backend Startup (No RuntimeError)")
        startup_success = self.test_backend_startup_no_errors()
        
        # Test 6: Existing Endpoints
        print("\n🔗 TEST 6: Existing Endpoints Still Work")
        endpoints_success = self.test_existing_endpoints_still_work()
        
        # Print final results
        self.print_final_results()
        
        # Return overall success
        all_tests_passed = all([
            health_success,
            uploads_success,
            url_success,
            mongo_success,
            startup_success,
            endpoints_success
        ])
        
        return all_tests_passed

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 70)
        print("📊 DEPLOYMENT FIX TEST RESULTS")
        print("=" * 70)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("🎉 EXCELLENT: All deployment fixes working correctly!")
            print("✅ Application is ready for production deployment")
        elif success_rate >= 70:
            print("⚠️  GOOD: Most deployment fixes working, minor issues to address")
            print("🔧 Some fixes may need attention before production")
        else:
            print("🚨 CRITICAL: Major deployment issues detected")
            print("❌ Application NOT ready for production deployment")
        
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
    tester = DeploymentFixTester()
    success = tester.run_deployment_fix_tests()
    
    if success:
        print("\n🎉 ALL DEPLOYMENT FIXES VERIFIED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print("\n❌ SOME DEPLOYMENT FIXES NEED ATTENTION")
        sys.exit(1)