#!/usr/bin/env python3
"""
Admin Sayfası Erişim Testi
Testing Turkish review request: Admin user creation, login, and dashboard access testing
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BACKEND_URL = "https://mavibilet.preview.emergentagent.com/api"

class AdminAccessTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        self.admin_token = None
        self.admin_user = None
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
            
        result = {
            "test": test_name,
            "status": status,
            "success": success,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        try:
            url = f"{self.backend_url}/{endpoint}"
            test_headers = {"Content-Type": "application/json"}
            
            # Add authorization header if we have a token
            if self.admin_token:
                test_headers["Authorization"] = f"Bearer {self.admin_token}"
            
            # Add custom headers
            if headers:
                test_headers.update(headers)
            
            print(f"🔍 Testing {method} {url}")
            if data:
                print(f"   📤 Request data: {json.dumps(data, indent=2)}")

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
                    self.log_test(name, True, f"Status: {response.status_code}", response_data)
                    return True, response_data
                except:
                    self.log_test(name, True, f"Status: {response.status_code}, No JSON response")
                    return True, {}
            else:
                try:
                    error_data = response.json() if response.content else {}
                    self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}", error_data)
                except:
                    self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}", response.text[:200])
                return False, {}

        except requests.exceptions.Timeout:
            self.log_test(name, False, "Request timeout (30s)")
            return False, {}
        except requests.exceptions.ConnectionError:
            self.log_test(name, False, "Connection error - server may be down")
            return False, {}
        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_admin_user_creation(self):
        """
        1. Admin User Oluşturma:
        - POST /api/auth/register endpoint'ine istek at
        - Body: {"email": "admin@test.com", "password": "Admin123!", "full_name": "Test Admin", "role": "admin"}
        - Eğer 400 hatası alırsan (user zaten var), devam et
        """
        print("🔐 Step 1: Admin User Oluşturma")
        print("=" * 50)
        
        admin_user_data = {
            "email": "admin@test.com",
            "password": "Admin123!",
            "full_name": "Test Admin",
            "role": "admin"
        }
        
        success, response = self.run_test(
            "Admin User Registration",
            "POST",
            "auth/register",
            200,  # Expecting 200 for success
            data=admin_user_data
        )
        
        if success:
            print("   ✅ Admin user created successfully!")
            if 'token' in response:
                print(f"   📝 Token received: {response['token'][:20]}...")
            if 'user' in response:
                user_role = response['user'].get('role')
                print(f"   👤 User role: {user_role}")
            return True, "Admin user created successfully"
        else:
            # Check if it's a 400 error (user already exists)
            if hasattr(response, 'get') and response.get('detail') and 'already exists' in str(response.get('detail')):
                print("   ℹ️  Admin user already exists (400 error) - continuing as instructed")
                return True, "Admin user already exists - continuing"
            else:
                print("   ❌ Admin user creation failed")
                return False, "Admin user creation failed"

    def test_admin_login(self):
        """
        2. Admin Login:
        - POST /api/auth/login endpoint'ine istek at
        - Body: {"email": "admin@test.com", "password": "Admin123!"}
        - Token'ı ve user bilgisini kaydet
        """
        print("🔑 Step 2: Admin Login")
        print("=" * 50)
        
        admin_login_data = {
            "email": "admin@test.com",
            "password": "Admin123!"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=admin_login_data
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
            self.admin_user = response.get('user', {})
            
            user_role = self.admin_user.get('role')
            user_email = self.admin_user.get('email')
            user_name = self.admin_user.get('full_name')
            
            print(f"   ✅ Admin login successful!")
            print(f"   📝 Token: {self.admin_token[:20]}...")
            print(f"   👤 User: {user_name} ({user_email})")
            print(f"   🎭 Role: {user_role}")
            
            if user_role == 'admin':
                print("   ✅ User has admin role - dashboard access should work")
                return True, "Admin login successful with admin role"
            else:
                print(f"   ⚠️  User role is '{user_role}', not 'admin' - dashboard access may fail")
                return True, f"Login successful but role is '{user_role}', not 'admin'"
        else:
            print("   ❌ Admin login failed")
            return False, "Admin login failed - no token received"

    def test_admin_dashboard_access(self):
        """
        3. Admin Dashboard Erişim Testi:
        - GET /api/admin/dashboard endpoint'ine token ile istek at
        - Header: Authorization: Bearer {token}
        - 200 OK dönmeli
        """
        print("📊 Step 3: Admin Dashboard Erişim Testi")
        print("=" * 50)
        
        if not self.admin_token:
            print("   ❌ No admin token available - cannot test dashboard access")
            return False, "No admin token available"
        
        success, response = self.run_test(
            "Admin Dashboard Access",
            "GET",
            "admin/dashboard",
            200
        )
        
        if success:
            print("   ✅ Admin dashboard access successful!")
            
            # Display dashboard statistics if available
            if response:
                total_tours = response.get('total_tours', 'N/A')
                total_bookings = response.get('total_bookings', 'N/A')
                total_users = response.get('total_users', 'N/A')
                total_revenue = response.get('total_revenue', 'N/A')
                
                print(f"   📈 Dashboard Statistics:")
                print(f"      • Total Tours: {total_tours}")
                print(f"      • Total Bookings: {total_bookings}")
                print(f"      • Total Users: {total_users}")
                print(f"      • Total Revenue: {total_revenue}")
            
            return True, "Admin dashboard access successful"
        else:
            print("   ❌ Admin dashboard access failed")
            if response and 'detail' in response:
                error_detail = response['detail']
                if 'Admin access required' in error_detail or 'Forbidden' in error_detail:
                    print("   🚫 Access denied - user may not have admin privileges")
                    return False, "Access denied - insufficient privileges"
                else:
                    print(f"   🚫 Error: {error_detail}")
                    return False, f"Dashboard access failed: {error_detail}"
            return False, "Admin dashboard access failed"

    def run_comprehensive_admin_test(self):
        """Run all admin access tests in sequence as requested"""
        print("🎯 Admin Sayfası Erişim Testi")
        print("=" * 70)
        print("Testing admin user creation, login, and dashboard access")
        print("=" * 70)
        
        # Results tracking
        results = {
            "admin_user_created": False,
            "admin_login_successful": False,
            "dashboard_access_granted": False
        }
        
        # Step 1: Admin User Creation
        user_creation_success, user_creation_msg = self.test_admin_user_creation()
        results["admin_user_created"] = user_creation_success
        
        # Step 2: Admin Login
        login_success, login_msg = self.test_admin_login()
        results["admin_login_successful"] = login_success
        
        # Step 3: Admin Dashboard Access (only if login successful)
        if login_success:
            dashboard_success, dashboard_msg = self.test_admin_dashboard_access()
            results["dashboard_access_granted"] = dashboard_success
        else:
            print("🚫 Skipping dashboard test - admin login failed")
            results["dashboard_access_granted"] = False
        
        # Step 4: Report Results
        self.report_final_results(results)
        
        return results

    def report_final_results(self, results):
        """
        4. Sonuçları Raporla:
        - Admin user oluşturuldu mu?
        - Login başarılı mı?
        - Dashboard'a erişim var mı?
        """
        print("\n" + "=" * 70)
        print("📋 SONUÇLARI RAPORLA")
        print("=" * 70)
        
        # Admin user oluşturuldu mu?
        if results["admin_user_created"]:
            print("✅ Admin user oluşturuldu mu? → EVET")
        else:
            print("❌ Admin user oluşturuldu mu? → HAYIR")
        
        # Login başarılı mı?
        if results["admin_login_successful"]:
            print("✅ Login başarılı mı? → EVET")
        else:
            print("❌ Login başarılı mı? → HAYIR")
        
        # Dashboard'a erişim var mı?
        if results["dashboard_access_granted"]:
            print("✅ Dashboard'a erişim var mı? → EVET")
        else:
            print("❌ Dashboard'a erişim var mı? → HAYIR")
        
        # Overall success rate
        success_count = sum(results.values())
        total_count = len(results)
        success_rate = (success_count / total_count * 100) if total_count > 0 else 0
        
        print(f"\n📊 Genel Başarı Oranı: {success_count}/{total_count} ({success_rate:.1f}%)")
        
        if success_rate == 100:
            print("🎉 MÜKEMMEL: Tüm admin erişim testleri başarılı!")
        elif success_rate >= 66:
            print("⚠️  İYİ: Çoğu test başarılı, bazı sorunlar var")
        else:
            print("🚨 KRİTİK: Önemli sorunlar tespit edildi")
        
        # Detailed test results
        print(f"\n📈 Detaylı Test Sonuçları:")
        print(f"   • Toplam Test: {self.total_tests}")
        print(f"   • Başarılı: {self.passed_tests}")
        print(f"   • Başarısız: {self.total_tests - self.passed_tests}")
        
        # Token information
        if self.admin_token:
            print(f"\n🔑 Admin Token: {self.admin_token[:30]}...")
        
        # User information
        if self.admin_user:
            print(f"👤 Admin User Info:")
            print(f"   • Email: {self.admin_user.get('email', 'N/A')}")
            print(f"   • Name: {self.admin_user.get('full_name', 'N/A')}")
            print(f"   • Role: {self.admin_user.get('role', 'N/A')}")
            print(f"   • ID: {self.admin_user.get('id', 'N/A')}")

def main():
    """Main function to run admin access tests"""
    tester = AdminAccessTester()
    
    try:
        results = tester.run_comprehensive_admin_test()
        
        # Exit with appropriate code
        if all(results.values()):
            print("\n🎯 All admin access tests passed successfully!")
            sys.exit(0)
        else:
            print("\n⚠️  Some admin access tests failed!")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Test failed with exception: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()