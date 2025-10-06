#!/usr/bin/env python3
"""
Basic Backend Health Check Test
Testing that booking state preservation optimization hasn't affected backend functionality
"""

import requests
import json
import sys
from datetime import datetime

class BackendHealthChecker:
    def __init__(self):
        # Use the production URL from frontend/.env
        self.base_url = "https://pakettur-1.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

    def log_result(self, test_name, success, details="", error=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
            if details:
                print(f"   Details: {details}")
        else:
            print(f"❌ {test_name} - FAILED")
            if error:
                print(f"   Error: {error}")
        
        self.results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "error": error,
            "timestamp": datetime.now().isoformat()
        })

    def test_health_endpoint(self):
        """Test /api/health endpoint"""
        print("\n🔍 Testing /api/health endpoint...")
        
        try:
            response = requests.get(f"{self.api_url}/health", timeout=30)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    status = data.get('status', 'unknown')
                    database = data.get('database', 'unknown')
                    uploads_dir = data.get('uploads_dir', 'unknown')
                    
                    details = f"Status: {status}, Database: {database}, Uploads: {uploads_dir}"
                    
                    if status == 'healthy' and database == 'connected':
                        self.log_result("Health Check", True, details)
                        return True
                    else:
                        self.log_result("Health Check", False, details, "Backend not fully healthy")
                        return False
                        
                except json.JSONDecodeError:
                    self.log_result("Health Check", False, "", "Invalid JSON response")
                    return False
            else:
                self.log_result("Health Check", False, "", f"HTTP {response.status_code}: {response.text[:200]}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_result("Health Check", False, "", f"Request failed: {str(e)}")
            return False

    def test_tours_endpoint(self):
        """Test /api/tours endpoint"""
        print("\n🔍 Testing /api/tours endpoint...")
        
        try:
            response = requests.get(f"{self.api_url}/tours", timeout=30)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, list):
                        tour_count = len(data)
                        details = f"Retrieved {tour_count} tours"
                        
                        # Check if tours have basic required fields
                        if tour_count > 0:
                            sample_tour = data[0]
                            has_id = 'id' in sample_tour
                            has_title = 'title' in sample_tour
                            has_location = 'location' in sample_tour
                            
                            if has_id and has_title and has_location:
                                details += f" - Sample tour: {sample_tour.get('title', 'Unknown')}"
                                self.log_result("Tours API", True, details)
                                return True, data
                            else:
                                self.log_result("Tours API", False, details, "Tours missing required fields (id, title, location)")
                                return False, data
                        else:
                            self.log_result("Tours API", True, "No tours found in database")
                            return True, data
                    else:
                        self.log_result("Tours API", False, "", "Response is not a list")
                        return False, None
                        
                except json.JSONDecodeError:
                    self.log_result("Tours API", False, "", "Invalid JSON response")
                    return False, None
            else:
                self.log_result("Tours API", False, "", f"HTTP {response.status_code}: {response.text[:200]}")
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log_result("Tours API", False, "", f"Request failed: {str(e)}")
            return False, None

    def test_auth_login(self):
        """Test /api/auth/login endpoint"""
        print("\n🔍 Testing /api/auth/login endpoint...")
        
        # Test with known user credentials
        login_data = {
            "email": "user@example.com",
            "password": "password123"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/auth/login",
                json=login_data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if 'token' in data and 'user' in data:
                        self.token = data['token']
                        user_role = data['user'].get('role', 'unknown')
                        user_email = data['user'].get('email', 'unknown')
                        
                        details = f"Login successful - Email: {user_email}, Role: {user_role}"
                        self.log_result("Auth Login", True, details)
                        return True
                    else:
                        self.log_result("Auth Login", False, "", "Response missing token or user data")
                        return False
                        
                except json.JSONDecodeError:
                    self.log_result("Auth Login", False, "", "Invalid JSON response")
                    return False
            elif response.status_code == 401:
                self.log_result("Auth Login", False, "", "Invalid credentials (401) - user may not exist")
                return False
            else:
                self.log_result("Auth Login", False, "", f"HTTP {response.status_code}: {response.text[:200]}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_result("Auth Login", False, "", f"Request failed: {str(e)}")
            return False

    def test_bookings_endpoint(self):
        """Test /api/bookings endpoint (requires authentication)"""
        print("\n🔍 Testing /api/bookings endpoint...")
        
        if not self.token:
            self.log_result("Bookings API", False, "", "No authentication token available")
            return False
        
        try:
            headers = {
                'Authorization': f'Bearer {self.token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(f"{self.api_url}/bookings", headers=headers, timeout=30)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, list):
                        booking_count = len(data)
                        details = f"Retrieved {booking_count} user bookings"
                        self.log_result("Bookings API", True, details)
                        return True
                    else:
                        self.log_result("Bookings API", False, "", "Response is not a list")
                        return False
                        
                except json.JSONDecodeError:
                    self.log_result("Bookings API", False, "", "Invalid JSON response")
                    return False
            elif response.status_code == 401:
                self.log_result("Bookings API", False, "", "Authentication failed (401) - token may be invalid")
                return False
            else:
                self.log_result("Bookings API", False, "", f"HTTP {response.status_code}: {response.text[:200]}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_result("Bookings API", False, "", f"Request failed: {str(e)}")
            return False

    def run_health_check(self):
        """Run all health check tests"""
        print("🚀 Backend Health Check - Booking State Preservation Verification")
        print("=" * 70)
        print("Testing that frontend optimizations haven't affected backend functionality")
        print("=" * 70)
        
        # Test 1: Health endpoint
        health_ok = self.test_health_endpoint()
        
        # Test 2: Tours endpoint
        tours_ok, tours_data = self.test_tours_endpoint()
        
        # Test 3: Auth login
        login_ok = self.test_auth_login()
        
        # Test 4: Bookings endpoint (only if login successful)
        bookings_ok = False
        if login_ok:
            bookings_ok = self.test_bookings_endpoint()
        else:
            print("\n⚠️  Skipping bookings test - login failed")
        
        # Print summary
        self.print_summary()
        
        return health_ok and tours_ok and login_ok and (bookings_ok or not login_ok)

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 70)
        print("📊 HEALTH CHECK SUMMARY")
        print("=" * 70)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate == 100:
            print("\n🎉 EXCELLENT: All backend endpoints are healthy!")
            print("✅ Booking state preservation optimization hasn't affected backend")
        elif success_rate >= 75:
            print("\n⚠️  GOOD: Most endpoints working, minor issues detected")
        else:
            print("\n🚨 CRITICAL: Major backend issues detected!")
        
        # Show failed tests
        failed_tests = [r for r in self.results if not r['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['error']}")
        
        print("\n" + "=" * 70)

if __name__ == "__main__":
    checker = BackendHealthChecker()
    success = checker.run_health_check()
    sys.exit(0 if success else 1)