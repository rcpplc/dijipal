#!/usr/bin/env python3
"""
Booking State Preservation Health Check
=====================================

This script performs a quick health check of backend endpoints to verify that 
the booking state preservation feature (frontend-only localStorage solution) 
doesn't affect backend functionality.

Endpoints to test:
1. /api/health - backend health
2. /api/tours - tour listing  
3. /api/auth/login - login system
4. /api/bookings - booking system (if user login successful)
"""

import requests
import json
import sys
from datetime import datetime

class BookingStateHealthCheck:
    def __init__(self):
        # Use the production URL from frontend/.env
        self.base_url = "https://tourboost.preview.emergentagent.com"
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
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        print(f"{status} {test_name}")
        if details:
            print(f"     Details: {details}")
        if error:
            print(f"     Error: {error}")
        
        self.results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "error": error,
            "timestamp": datetime.now().isoformat()
        })

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make HTTP request to API"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            success = response.status_code == expected_status
            
            try:
                response_data = response.json() if response.content else {}
            except:
                response_data = {"raw_response": response.text[:200]}
            
            return success, response.status_code, response_data
            
        except requests.exceptions.Timeout:
            return False, 0, {"error": "Request timeout (30s)"}
        except requests.exceptions.ConnectionError:
            return False, 0, {"error": "Connection error - server may be down"}
        except Exception as e:
            return False, 0, {"error": f"Exception: {str(e)}"}

    def test_health_endpoint(self):
        """Test 1: /api/health - Backend health check"""
        print("\n🔍 Testing /api/health endpoint...")
        
        success, status_code, response = self.make_request('GET', 'health', expected_status=200)
        
        if success:
            # Check if response contains expected health data
            if isinstance(response, dict):
                status = response.get('status', 'unknown')
                database = response.get('database', 'unknown')
                uploads_dir = response.get('uploads_dir', 'unknown')
                
                details = f"Status: {status}, Database: {database}, Uploads: {uploads_dir}"
                self.log_result("Backend Health Check", True, details)
                return True
            else:
                self.log_result("Backend Health Check", False, "", "Invalid response format")
                return False
        else:
            error_msg = f"HTTP {status_code}: {response.get('error', 'Unknown error')}"
            self.log_result("Backend Health Check", False, "", error_msg)
            return False

    def test_tours_endpoint(self):
        """Test 2: /api/tours - Tour listing"""
        print("\n🔍 Testing /api/tours endpoint...")
        
        success, status_code, response = self.make_request('GET', 'tours', expected_status=200)
        
        if success:
            if isinstance(response, list):
                tour_count = len(response)
                details = f"Retrieved {tour_count} tours"
                
                # Check if tours have expected structure
                if tour_count > 0:
                    first_tour = response[0]
                    has_id = 'id' in first_tour
                    has_title = 'title' in first_tour
                    has_location = 'location' in first_tour
                    
                    if has_id and has_title and has_location:
                        details += f" - Structure OK (id, title, location present)"
                    else:
                        details += f" - Structure issues (missing fields)"
                
                self.log_result("Tours Listing", True, details)
                return True, response
            else:
                self.log_result("Tours Listing", False, "", "Response is not a list")
                return False, []
        else:
            error_msg = f"HTTP {status_code}: {response.get('error', 'Unknown error')}"
            self.log_result("Tours Listing", False, "", error_msg)
            return False, []

    def test_login_endpoint(self):
        """Test 3: /api/auth/login - Login system"""
        print("\n🔍 Testing /api/auth/login endpoint...")
        
        # Try with test user credentials
        login_data = {
            "email": "user@example.com",
            "password": "password123"
        }
        
        success, status_code, response = self.make_request('POST', 'auth/login', data=login_data, expected_status=200)
        
        if success:
            if isinstance(response, dict) and 'token' in response and 'user' in response:
                self.token = response['token']
                user_role = response['user'].get('role', 'unknown')
                user_email = response['user'].get('email', 'unknown')
                
                details = f"Login successful - Role: {user_role}, Email: {user_email}"
                self.log_result("User Login", True, details)
                return True
            else:
                self.log_result("User Login", False, "", "Invalid response format (missing token or user)")
                return False
        else:
            # Try admin credentials as fallback
            print("     Trying admin credentials...")
            admin_login_data = {
                "email": "admin@example.com", 
                "password": "admin123"
            }
            
            admin_success, admin_status, admin_response = self.make_request('POST', 'auth/login', data=admin_login_data, expected_status=200)
            
            if admin_success:
                if isinstance(admin_response, dict) and 'token' in admin_response:
                    self.token = admin_response['token']
                    admin_role = admin_response['user'].get('role', 'unknown')
                    
                    details = f"Admin login successful - Role: {admin_role}"
                    self.log_result("Admin Login (Fallback)", True, details)
                    return True
                else:
                    self.log_result("Admin Login (Fallback)", False, "", "Invalid admin response format")
                    return False
            else:
                error_msg = f"HTTP {status_code}: {response.get('error', 'Unknown error')}"
                self.log_result("Login System", False, "", error_msg)
                return False

    def test_bookings_endpoint(self):
        """Test 4: /api/bookings - Booking system (requires authentication)"""
        print("\n🔍 Testing /api/bookings endpoint...")
        
        if not self.token:
            self.log_result("Bookings System", False, "", "No authentication token available")
            return False
        
        # Test GET /api/bookings (get user bookings)
        success, status_code, response = self.make_request('GET', 'bookings', expected_status=200)
        
        if success:
            if isinstance(response, list):
                booking_count = len(response)
                details = f"Retrieved {booking_count} user bookings"
                self.log_result("User Bookings Retrieval", True, details)
                return True
            else:
                self.log_result("User Bookings Retrieval", False, "", "Response is not a list")
                return False
        else:
            error_msg = f"HTTP {status_code}: {response.get('error', 'Unknown error')}"
            self.log_result("User Bookings Retrieval", False, "", error_msg)
            return False

    def run_health_check(self):
        """Run complete health check"""
        print("🚀 Booking State Preservation - Backend Health Check")
        print("=" * 60)
        print("Testing that frontend localStorage booking state preservation")
        print("doesn't affect backend API functionality.")
        print("=" * 60)
        
        # Test 1: Health endpoint
        health_ok = self.test_health_endpoint()
        
        # Test 2: Tours endpoint  
        tours_ok, tours_data = self.test_tours_endpoint()
        
        # Test 3: Login endpoint
        login_ok = self.test_login_endpoint()
        
        # Test 4: Bookings endpoint (only if login successful)
        bookings_ok = False
        if login_ok:
            bookings_ok = self.test_bookings_endpoint()
        else:
            print("\n⚠️  Skipping bookings test - login failed")
            self.log_result("Bookings System", False, "", "Skipped due to login failure")
        
        # Summary
        self.print_summary()
        
        return {
            "health": health_ok,
            "tours": tours_ok,
            "login": login_ok, 
            "bookings": bookings_ok,
            "overall_success": health_ok and tours_ok and login_ok
        }

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 HEALTH CHECK SUMMARY")
        print("=" * 60)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 75:
            print("\n✅ RESULT: Backend is healthy - booking state preservation doesn't affect backend")
        elif success_rate >= 50:
            print("\n⚠️  RESULT: Backend mostly healthy - minor issues detected")
        else:
            print("\n❌ RESULT: Backend has significant issues - needs investigation")
        
        # Show failed tests
        failed_tests = [r for r in self.results if not r['success']]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['error']}")
        
        print("\n💡 CONCLUSION:")
        print("   The booking state preservation feature is frontend-only (localStorage)")
        print("   and should not require any backend changes. This health check")
        print("   verifies that core backend functionality remains intact.")

if __name__ == "__main__":
    health_checker = BookingStateHealthCheck()
    results = health_checker.run_health_check()
    
    # Exit with appropriate code
    if results["overall_success"]:
        sys.exit(0)
    else:
        sys.exit(1)