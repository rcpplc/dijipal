#!/usr/bin/env python3
import requests
import json
from datetime import datetime

class AdditionalBackendTester:
    def __init__(self, base_url="https://tourslug.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
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

    def get_admin_token(self):
        """Get admin token for authenticated requests"""
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
                if 'token' in response_data:
                    self.token = response_data['token']
                    return True
            return False
        except:
            return False

    def test_tours_api(self):
        """Test tours listing API"""
        try:
            response = requests.get(f"{self.api_url}/tours", timeout=10)
            
            if response.status_code == 200:
                tours_data = response.json()
                if isinstance(tours_data, list):
                    return self.log_test("Tours API", True, 
                                       f"Retrieved {len(tours_data)} tours successfully")
                else:
                    return self.log_test("Tours API", False, "", 
                                       f"Expected list, got {type(tours_data)}")
            else:
                return self.log_test("Tours API", False, "", 
                                   f"Status {response.status_code}: {response.text[:200]}")
        except Exception as e:
            return self.log_test("Tours API", False, "", f"Exception: {str(e)}")

    def test_admin_dashboard(self):
        """Test admin dashboard API"""
        if not self.token:
            return self.log_test("Admin Dashboard API", False, "", "No admin token available")
        
        try:
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.token}'
            }
            response = requests.get(f"{self.api_url}/admin/dashboard", headers=headers, timeout=10)
            
            if response.status_code == 200:
                dashboard_data = response.json()
                required_fields = ['total_tours', 'total_bookings', 'total_users', 'total_revenue']
                missing_fields = [field for field in required_fields if field not in dashboard_data]
                
                if missing_fields:
                    return self.log_test("Admin Dashboard API", False, "", 
                                       f"Missing fields: {missing_fields}")
                else:
                    return self.log_test("Admin Dashboard API", True, 
                                       f"Dashboard data complete with all required fields")
            else:
                return self.log_test("Admin Dashboard API", False, "", 
                                   f"Status {response.status_code}: {response.text[:200]}")
        except Exception as e:
            return self.log_test("Admin Dashboard API", False, "", f"Exception: {str(e)}")

    def test_seed_data_endpoint(self):
        """Test seed data endpoint"""
        try:
            response = requests.post(f"{self.api_url}/seed-data", timeout=30)
            
            if response.status_code == 200:
                return self.log_test("Seed Data Endpoint", True, 
                                   "Sample data seeded successfully")
            else:
                return self.log_test("Seed Data Endpoint", False, "", 
                                   f"Status {response.status_code}: {response.text[:200]}")
        except Exception as e:
            return self.log_test("Seed Data Endpoint", False, "", f"Exception: {str(e)}")

    def test_create_admin_user_endpoint(self):
        """Test create admin user endpoint"""
        try:
            response = requests.post(f"{self.api_url}/create-admin-user", timeout=10)
            
            if response.status_code == 200:
                response_data = response.json()
                if 'message' in response_data:
                    return self.log_test("Create Admin User Endpoint", True, 
                                       f"Admin user endpoint working: {response_data['message']}")
                else:
                    return self.log_test("Create Admin User Endpoint", False, "", 
                                       f"Unexpected response format: {response_data}")
            else:
                return self.log_test("Create Admin User Endpoint", False, "", 
                                   f"Status {response.status_code}: {response.text[:200]}")
        except Exception as e:
            return self.log_test("Create Admin User Endpoint", False, "", f"Exception: {str(e)}")

    def test_reviews_api(self):
        """Test reviews API"""
        try:
            response = requests.get(f"{self.api_url}/reviews", timeout=10)
            
            if response.status_code == 200:
                reviews_data = response.json()
                if isinstance(reviews_data, list):
                    return self.log_test("Reviews API", True, 
                                       f"Retrieved {len(reviews_data)} reviews successfully")
                else:
                    return self.log_test("Reviews API", False, "", 
                                       f"Expected list, got {type(reviews_data)}")
            else:
                return self.log_test("Reviews API", False, "", 
                                   f"Status {response.status_code}: {response.text[:200]}")
        except Exception as e:
            return self.log_test("Reviews API", False, "", f"Exception: {str(e)}")

    def run_additional_tests(self):
        """Run additional backend API tests"""
        print("🔧 ADDITIONAL BACKEND API TESTING")
        print("=" * 50)
        print(f"Backend URL: {self.base_url}")
        print()
        
        # Get admin token first
        print("🔐 Getting admin token...")
        if self.get_admin_token():
            print("✅ Admin token obtained successfully")
        else:
            print("❌ Failed to get admin token")
        print()
        
        # Test core APIs
        print("📋 Testing Core APIs...")
        self.test_tours_api()
        self.test_reviews_api()
        self.test_seed_data_endpoint()
        self.test_create_admin_user_endpoint()
        
        if self.token:
            self.test_admin_dashboard()
        
        print()
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("=" * 50)
        print("📊 ADDITIONAL TESTS SUMMARY")
        print("=" * 50)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['success']])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        print()
        
        # Print failed tests
        failed_tests_list = [r for r in self.test_results if not r['success']]
        if failed_tests_list:
            print("❌ FAILED TESTS:")
            for test in failed_tests_list:
                print(f"   • {test['test_name']}: {test['error']}")
        
        print("\n✅ PASSED TESTS:")
        passed_tests_list = [r for r in self.test_results if r['success']]
        for test in passed_tests_list:
            print(f"   • {test['test_name']}")

if __name__ == "__main__":
    tester = AdditionalBackendTester()
    tester.run_additional_tests()