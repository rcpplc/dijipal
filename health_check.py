#!/usr/bin/env python3
"""
Quick Health Check for Backend APIs
Performs minimal testing of core endpoints after frontend changes
"""

import requests
import json
import sys
from datetime import datetime

class BackendHealthChecker:
    def __init__(self):
        self.base_url = "https://reservation-system-2.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
        self.tests_passed = 0
        self.tests_total = 0
        
    def test_endpoint(self, name, method, endpoint, expected_status=200, data=None, headers=None):
        """Test a single endpoint"""
        self.tests_total += 1
        url = f"{self.api_url}/{endpoint}"
        
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)
            
        print(f"🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            else:
                print(f"❌ Unsupported method: {method}")
                return False
                
            if response.status_code == expected_status:
                self.tests_passed += 1
                print(f"✅ {name} - PASSED (Status: {response.status_code})")
                
                # Try to parse JSON response
                try:
                    json_data = response.json()
                    if isinstance(json_data, list):
                        print(f"   📊 Response: Array with {len(json_data)} items")
                    elif isinstance(json_data, dict):
                        if 'message' in json_data:
                            print(f"   📝 Message: {json_data['message']}")
                        elif 'status' in json_data:
                            print(f"   📊 Status: {json_data['status']}")
                        else:
                            print(f"   📊 Response: Dict with {len(json_data)} keys")
                except:
                    print(f"   📄 Response: Non-JSON content")
                    
                return True
            else:
                print(f"❌ {name} - FAILED (Expected: {expected_status}, Got: {response.status_code})")
                try:
                    error_data = response.json()
                    print(f"   ⚠️  Error: {error_data}")
                except:
                    print(f"   ⚠️  Error: {response.text[:200]}")
                return False
                
        except requests.exceptions.Timeout:
            print(f"❌ {name} - TIMEOUT (10s)")
            return False
        except requests.exceptions.ConnectionError:
            print(f"❌ {name} - CONNECTION ERROR")
            return False
        except Exception as e:
            print(f"❌ {name} - EXCEPTION: {str(e)}")
            return False
    
    def run_health_check(self):
        """Run comprehensive health check"""
        print("🏥 Backend Health Check - Quick Verification")
        print("=" * 60)
        print(f"Backend URL: {self.base_url}")
        print(f"API URL: {self.api_url}")
        print("=" * 60)
        
        # 1. Health endpoint check
        print("\n🔍 1. HEALTH ENDPOINT CHECK")
        self.test_endpoint("Health Check", "GET", "health")
        
        # 2. Tours API check
        print("\n🏛️ 2. TOURS API CHECK")
        self.test_endpoint("Get Tours List", "GET", "tours")
        self.test_endpoint("Get Tours with Limit", "GET", "tours?limit=5")
        
        # 3. Authentication check
        print("\n🔐 3. AUTHENTICATION CHECK")
        
        # Test user login
        user_login_data = {
            "email": "user@example.com",
            "password": "password123"
        }
        user_success = self.test_endpoint("User Login", "POST", "auth/login", 200, user_login_data)
        
        # Test admin login
        admin_login_data = {
            "email": "admin@example.com", 
            "password": "admin123"
        }
        admin_success = self.test_endpoint("Admin Login", "POST", "auth/login", 200, admin_login_data)
        
        # 4. Database connectivity check (via admin dashboard)
        print("\n🗄️ 4. DATABASE CONNECTIVITY CHECK")
        if admin_success:
            # Get admin token for dashboard access
            try:
                response = requests.post(f"{self.api_url}/auth/login", json=admin_login_data, timeout=10)
                if response.status_code == 200:
                    token = response.json().get('token')
                    if token:
                        headers = {'Authorization': f'Bearer {token}'}
                        self.test_endpoint("Admin Dashboard (DB Check)", "GET", "admin/dashboard", 200, headers=headers)
                    else:
                        print("❌ Could not get admin token for DB check")
                else:
                    print("❌ Admin login failed for DB check")
            except Exception as e:
                print(f"❌ Exception during DB check: {e}")
        else:
            print("⚠️  Skipping DB check - admin login failed")
        
        # 5. Additional API endpoints
        print("\n🔧 5. ADDITIONAL API ENDPOINTS")
        self.test_endpoint("Get Tour Dates (Sample)", "GET", "tours/3ded39ad-36a4-47d1-87b9-7baeb5f00f55/dates")
        
        # Final results
        print("\n" + "=" * 60)
        print("📊 HEALTH CHECK RESULTS")
        print("=" * 60)
        
        success_rate = (self.tests_passed / self.tests_total * 100) if self.tests_total > 0 else 0
        
        print(f"Total Tests: {self.tests_total}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_total - self.tests_passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("🎉 EXCELLENT: Backend is healthy and working properly!")
            status = "HEALTHY"
        elif success_rate >= 70:
            print("⚠️  GOOD: Backend mostly working, minor issues detected")
            status = "MOSTLY_HEALTHY"
        else:
            print("🚨 CRITICAL: Backend has significant issues!")
            status = "UNHEALTHY"
            
        print(f"\n🏥 Overall Status: {status}")
        print(f"⏰ Check completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        return status == "HEALTHY"

if __name__ == "__main__":
    checker = BackendHealthChecker()
    is_healthy = checker.run_health_check()
    sys.exit(0 if is_healthy else 1)