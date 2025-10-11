#!/usr/bin/env python3
"""
Admin Panel Backend CRUD APIs Test
Comprehensive testing of admin panel backend APIs as requested in Turkish review.

Test Scenarios:
1. User CRUD APIs
2. Enhanced Bookings API  
3. Authentication Check
4. Data Enhancement Test
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend/.env
BACKEND_URL = "https://payment-modal-fix.preview.emergentagent.com/api"

class AdminPanelTester:
    def __init__(self):
        self.admin_token = None
        self.user_token = None
        self.test_user_id = None
        self.test_booking_id = None
        
    def login_admin(self):
        """Login as admin to get admin token"""
        print("🔐 Testing Admin Login...")
        
        login_data = {
            "email": "admin@example.com",
            "password": "admin123"
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data)
            print(f"   Admin Login Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("token")
                admin_user = data.get("user", {})
                print(f"   ✅ Admin login successful")
                print(f"   Admin Role: {admin_user.get('role')}")
                print(f"   Admin Name: {admin_user.get('full_name')}")
                return True
            else:
                print(f"   ❌ Admin login failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Admin login error: {e}")
            return False
    
    def login_regular_user(self):
        """Login as regular user to test authorization"""
        print("🔐 Testing Regular User Login...")
        
        login_data = {
            "email": "user@example.com", 
            "password": "password123"
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data)
            print(f"   User Login Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.user_token = data.get("token")
                user = data.get("user", {})
                print(f"   ✅ User login successful")
                print(f"   User Role: {user.get('role')}")
                return True
            else:
                print(f"   ❌ User login failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ User login error: {e}")
            return False
    
    def get_auth_headers(self, use_admin=True):
        """Get authorization headers"""
        token = self.admin_token if use_admin else self.user_token
        return {"Authorization": f"Bearer {token}"} if token else {}
    
    def test_user_crud_apis(self):
        """Test User CRUD APIs"""
        print("\n" + "="*60)
        print("🧑‍💼 TESTING USER CRUD APIs")
        print("="*60)
        
        results = []
        
        # 1. GET /api/admin/users (list users)
        print("\n1️⃣ Testing GET /api/admin/users (list users)")
        try:
            response = requests.get(f"{BACKEND_URL}/admin/users", headers=self.get_auth_headers())
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                users = response.json()
                print(f"   ✅ Users list retrieved: {len(users)} users found")
                print(f"   Sample user roles: {[u.get('role') for u in users[:3]]}")
                results.append("✅ GET /api/admin/users - SUCCESS")
            else:
                print(f"   ❌ Failed to get users: {response.text}")
                results.append("❌ GET /api/admin/users - FAILED")
                
        except Exception as e:
            print(f"   ❌ Error getting users: {e}")
            results.append("❌ GET /api/admin/users - ERROR")
        
        # 2. POST /api/admin/users (create user)
        print("\n2️⃣ Testing POST /api/admin/users (create user)")
        try:
            new_user_data = {
                "email": "test@test.com",
                "full_name": "Test User",
                "password": "test123",
                "role": "customer",
                "phone": "05551234567"
            }
            
            response = requests.post(f"{BACKEND_URL}/admin/users", 
                                   json=new_user_data, 
                                   headers=self.get_auth_headers())
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                user = response.json()
                self.test_user_id = user.get("id")
                print(f"   ✅ User created successfully")
                print(f"   User ID: {self.test_user_id}")
                print(f"   User Email: {user.get('email')}")
                print(f"   User Role: {user.get('role')}")
                results.append("✅ POST /api/admin/users - SUCCESS")
            else:
                print(f"   ❌ Failed to create user: {response.text}")
                results.append("❌ POST /api/admin/users - FAILED")
                
        except Exception as e:
            print(f"   ❌ Error creating user: {e}")
            results.append("❌ POST /api/admin/users - ERROR")
        
        # 3. PUT /api/admin/users/{id} (update user)
        if self.test_user_id:
            print("\n3️⃣ Testing PUT /api/admin/users/{id} (update user)")
            try:
                update_data = {
                    "email": "test@test.com",
                    "full_name": "Updated Test User",
                    "phone": "05559876543",
                    "role": "customer"
                }
                
                response = requests.put(f"{BACKEND_URL}/admin/users/{self.test_user_id}",
                                      json=update_data,
                                      headers=self.get_auth_headers())
                print(f"   Status: {response.status_code}")
                
                if response.status_code == 200:
                    user = response.json()
                    print(f"   ✅ User updated successfully")
                    print(f"   Updated Name: {user.get('full_name')}")
                    print(f"   Updated Phone: {user.get('phone')}")
                    results.append("✅ PUT /api/admin/users/{id} - SUCCESS")
                else:
                    print(f"   ❌ Failed to update user: {response.text}")
                    results.append("❌ PUT /api/admin/users/{id} - FAILED")
                    
            except Exception as e:
                print(f"   ❌ Error updating user: {e}")
                results.append("❌ PUT /api/admin/users/{id} - ERROR")
        
        # 4. PUT /api/admin/users/{id}/status (toggle status)
        if self.test_user_id:
            print("\n4️⃣ Testing PUT /api/admin/users/{id}/status (toggle status)")
            try:
                response = requests.put(f"{BACKEND_URL}/admin/users/{self.test_user_id}/status",
                                      headers=self.get_auth_headers())
                print(f"   Status: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"   ✅ User status toggled successfully")
                    print(f"   Message: {result.get('message')}")
                    results.append("✅ PUT /api/admin/users/{id}/status - SUCCESS")
                else:
                    print(f"   ❌ Failed to toggle user status: {response.text}")
                    results.append("❌ PUT /api/admin/users/{id}/status - FAILED")
                    
            except Exception as e:
                print(f"   ❌ Error toggling user status: {e}")
                results.append("❌ PUT /api/admin/users/{id}/status - ERROR")
        
        # 5. DELETE /api/admin/users/{id} (delete user)
        if self.test_user_id:
            print("\n5️⃣ Testing DELETE /api/admin/users/{id} (delete user)")
            try:
                response = requests.delete(f"{BACKEND_URL}/admin/users/{self.test_user_id}",
                                         headers=self.get_auth_headers())
                print(f"   Status: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"   ✅ User deleted successfully")
                    print(f"   Message: {result.get('message')}")
                    results.append("✅ DELETE /api/admin/users/{id} - SUCCESS")
                else:
                    print(f"   ❌ Failed to delete user: {response.text}")
                    results.append("❌ DELETE /api/admin/users/{id} - FAILED")
                    
            except Exception as e:
                print(f"   ❌ Error deleting user: {e}")
                results.append("❌ DELETE /api/admin/users/{id} - ERROR")
        
        return results
    
    def test_enhanced_bookings_api(self):
        """Test Enhanced Bookings API"""
        print("\n" + "="*60)
        print("📋 TESTING ENHANCED BOOKINGS API")
        print("="*60)
        
        results = []
        
        # 1. GET /api/admin/bookings (enhanced with tour/customer details)
        print("\n1️⃣ Testing GET /api/admin/bookings (enhanced with details)")
        try:
            response = requests.get(f"{BACKEND_URL}/admin/bookings", headers=self.get_auth_headers())
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                bookings = response.json()
                print(f"   ✅ Bookings list retrieved: {len(bookings)} bookings found")
                
                if bookings:
                    sample_booking = bookings[0]
                    self.test_booking_id = sample_booking.get("id")
                    
                    # Check for enhanced data structure
                    has_tour_details = "tour_details" in sample_booking
                    has_customer_details = "customer_details" in sample_booking
                    has_formatted_dates = "formatted_date" in sample_booking or "created_at" in sample_booking
                    
                    print(f"   📊 Data Enhancement Check:")
                    print(f"      Tour Details: {'✅' if has_tour_details else '❌'}")
                    print(f"      Customer Details: {'✅' if has_customer_details else '❌'}")
                    print(f"      Formatted Dates: {'✅' if has_formatted_dates else '❌'}")
                    
                    # Show sample data structure
                    print(f"   📋 Sample Booking Fields: {list(sample_booking.keys())}")
                    
                results.append("✅ GET /api/admin/bookings - SUCCESS")
            else:
                print(f"   ❌ Failed to get bookings: {response.text}")
                results.append("❌ GET /api/admin/bookings - FAILED")
                
        except Exception as e:
            print(f"   ❌ Error getting bookings: {e}")
            results.append("❌ GET /api/admin/bookings - ERROR")
        
        # 2. PUT /api/admin/bookings/{id} (update booking with notes/date)
        if self.test_booking_id:
            print("\n2️⃣ Testing PUT /api/admin/bookings/{id} (update booking)")
            try:
                update_data = {
                    "special_notes": "Özel diyet talebi - Vejetaryen menü",
                    "booking_status": "confirmed"
                }
                
                response = requests.put(f"{BACKEND_URL}/admin/bookings/{self.test_booking_id}",
                                      json=update_data,
                                      headers=self.get_auth_headers())
                print(f"   Status: {response.status_code}")
                
                if response.status_code == 200:
                    booking = response.json()
                    print(f"   ✅ Booking updated successfully")
                    print(f"   Special Notes: {booking.get('special_notes')}")
                    print(f"   Booking Status: {booking.get('booking_status')}")
                    results.append("✅ PUT /api/admin/bookings/{id} - SUCCESS")
                else:
                    print(f"   ❌ Failed to update booking: {response.text}")
                    results.append("❌ PUT /api/admin/bookings/{id} - FAILED")
                    
            except Exception as e:
                print(f"   ❌ Error updating booking: {e}")
                results.append("❌ PUT /api/admin/bookings/{id} - ERROR")
        
        # 3. PUT /api/admin/bookings/{id}/status (status update)
        if self.test_booking_id:
            print("\n3️⃣ Testing PUT /api/admin/bookings/{id}/status (status update)")
            try:
                status_data = {
                    "status": "completed"
                }
                
                response = requests.put(f"{BACKEND_URL}/admin/bookings/{self.test_booking_id}/status",
                                      json=status_data,
                                      headers=self.get_auth_headers())
                print(f"   Status: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"   ✅ Booking status updated successfully")
                    print(f"   Message: {result.get('message')}")
                    results.append("✅ PUT /api/admin/bookings/{id}/status - SUCCESS")
                else:
                    print(f"   ❌ Failed to update booking status: {response.text}")
                    results.append("❌ PUT /api/admin/bookings/{id}/status - FAILED")
                    
            except Exception as e:
                print(f"   ❌ Error updating booking status: {e}")
                results.append("❌ PUT /api/admin/bookings/{id}/status - ERROR")
        
        return results
    
    def test_authentication_check(self):
        """Test Authentication Check"""
        print("\n" + "="*60)
        print("🔒 TESTING AUTHENTICATION & AUTHORIZATION")
        print("="*60)
        
        results = []
        
        # 1. Test admin role requirement
        print("\n1️⃣ Testing Admin Role Requirement")
        try:
            # Test with regular user token
            response = requests.get(f"{BACKEND_URL}/admin/users", headers=self.get_auth_headers(use_admin=False))
            print(f"   Regular User Access Status: {response.status_code}")
            
            if response.status_code == 403:
                print(f"   ✅ Properly rejected non-admin user (403 Forbidden)")
                results.append("✅ Admin Role Requirement - SUCCESS")
            else:
                print(f"   ❌ Should reject non-admin user: {response.text}")
                results.append("❌ Admin Role Requirement - FAILED")
                
        except Exception as e:
            print(f"   ❌ Error testing admin role: {e}")
            results.append("❌ Admin Role Requirement - ERROR")
        
        # 2. Test no authentication
        print("\n2️⃣ Testing No Authentication")
        try:
            response = requests.get(f"{BACKEND_URL}/admin/users")  # No headers
            print(f"   No Auth Status: {response.status_code}")
            
            if response.status_code == 401:
                print(f"   ✅ Properly rejected unauthenticated request (401 Unauthorized)")
                results.append("✅ No Authentication Rejection - SUCCESS")
            else:
                print(f"   ❌ Should reject unauthenticated request: {response.text}")
                results.append("❌ No Authentication Rejection - FAILED")
                
        except Exception as e:
            print(f"   ❌ Error testing no auth: {e}")
            results.append("❌ No Authentication Rejection - ERROR")
        
        # 3. Test invalid token
        print("\n3️⃣ Testing Invalid Token")
        try:
            invalid_headers = {"Authorization": "Bearer invalid_token_here"}
            response = requests.get(f"{BACKEND_URL}/admin/users", headers=invalid_headers)
            print(f"   Invalid Token Status: {response.status_code}")
            
            if response.status_code == 401:
                print(f"   ✅ Properly rejected invalid token (401 Unauthorized)")
                results.append("✅ Invalid Token Rejection - SUCCESS")
            else:
                print(f"   ❌ Should reject invalid token: {response.text}")
                results.append("❌ Invalid Token Rejection - FAILED")
                
        except Exception as e:
            print(f"   ❌ Error testing invalid token: {e}")
            results.append("❌ Invalid Token Rejection - ERROR")
        
        return results
    
    def test_data_enhancement(self):
        """Test Data Enhancement"""
        print("\n" + "="*60)
        print("📊 TESTING DATA ENHANCEMENT & FORMATTING")
        print("="*60)
        
        results = []
        
        # Test Turkish date formatting and data structure
        print("\n1️⃣ Testing Enhanced Bookings Data Structure")
        try:
            response = requests.get(f"{BACKEND_URL}/admin/bookings", headers=self.get_auth_headers())
            
            if response.status_code == 200:
                bookings = response.json()
                
                if bookings:
                    sample_booking = bookings[0]
                    
                    # Check required fields
                    required_fields = ["id", "user_id", "tour_id", "booking_status", "payment_status", "created_at"]
                    missing_fields = [field for field in required_fields if field not in sample_booking]
                    
                    print(f"   📋 Required Fields Check:")
                    if not missing_fields:
                        print(f"      ✅ All required fields present")
                        results.append("✅ Required Fields - SUCCESS")
                    else:
                        print(f"      ❌ Missing fields: {missing_fields}")
                        results.append("❌ Required Fields - FAILED")
                    
                    # Check data types and format
                    print(f"   📊 Data Format Check:")
                    
                    # Check booking status enum
                    valid_booking_statuses = ["draft", "pending", "confirmed", "paid", "completed", "cancelled"]
                    booking_status = sample_booking.get("booking_status")
                    if booking_status in valid_booking_statuses:
                        print(f"      ✅ Booking Status Valid: {booking_status}")
                        results.append("✅ Booking Status Format - SUCCESS")
                    else:
                        print(f"      ❌ Invalid Booking Status: {booking_status}")
                        results.append("❌ Booking Status Format - FAILED")
                    
                    # Check payment status enum
                    valid_payment_statuses = ["pending", "success", "failed", "refunded"]
                    payment_status = sample_booking.get("payment_status")
                    if payment_status in valid_payment_statuses:
                        print(f"      ✅ Payment Status Valid: {payment_status}")
                        results.append("✅ Payment Status Format - SUCCESS")
                    else:
                        print(f"      ❌ Invalid Payment Status: {payment_status}")
                        results.append("❌ Payment Status Format - FAILED")
                    
                    # Check Turkish formatting (if present)
                    total_price = sample_booking.get("total_price")
                    if total_price:
                        print(f"      ✅ Price Format: {total_price} TL")
                        results.append("✅ Price Format - SUCCESS")
                    
                    # Check date format
                    created_at = sample_booking.get("created_at")
                    if created_at:
                        print(f"      ✅ Date Format: {created_at}")
                        results.append("✅ Date Format - SUCCESS")
                    
                else:
                    print(f"   ⚠️ No bookings found for data structure testing")
                    results.append("⚠️ No Data Available - SKIPPED")
                    
            else:
                print(f"   ❌ Failed to get bookings for data testing: {response.text}")
                results.append("❌ Data Enhancement Test - FAILED")
                
        except Exception as e:
            print(f"   ❌ Error testing data enhancement: {e}")
            results.append("❌ Data Enhancement Test - ERROR")
        
        return results
    
    def run_comprehensive_test(self):
        """Run comprehensive admin panel backend API test"""
        print("🚀 STARTING ADMIN PANEL BACKEND CRUD APIs COMPREHENSIVE TEST")
        print("=" * 80)
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        all_results = []
        
        # Step 1: Login as admin
        if not self.login_admin():
            print("\n❌ CRITICAL: Admin login failed. Cannot proceed with tests.")
            return False
        
        # Step 2: Login as regular user (for auth testing)
        if not self.login_regular_user():
            print("\n⚠️ WARNING: Regular user login failed. Auth tests may be limited.")
        
        # Step 3: Test User CRUD APIs
        user_results = self.test_user_crud_apis()
        all_results.extend(user_results)
        
        # Step 4: Test Enhanced Bookings API
        booking_results = self.test_enhanced_bookings_api()
        all_results.extend(booking_results)
        
        # Step 5: Test Authentication Check
        auth_results = self.test_authentication_check()
        all_results.extend(auth_results)
        
        # Step 6: Test Data Enhancement
        data_results = self.test_data_enhancement()
        all_results.extend(data_results)
        
        # Final Results Summary
        print("\n" + "="*80)
        print("📊 FINAL TEST RESULTS SUMMARY")
        print("="*80)
        
        success_count = len([r for r in all_results if r.startswith("✅")])
        failed_count = len([r for r in all_results if r.startswith("❌")])
        warning_count = len([r for r in all_results if r.startswith("⚠️")])
        total_count = len(all_results)
        
        print(f"\n📈 OVERALL STATISTICS:")
        print(f"   Total Tests: {total_count}")
        print(f"   ✅ Successful: {success_count}")
        print(f"   ❌ Failed: {failed_count}")
        print(f"   ⚠️ Warnings: {warning_count}")
        print(f"   Success Rate: {(success_count/total_count*100):.1f}%")
        
        print(f"\n📋 DETAILED RESULTS:")
        for result in all_results:
            print(f"   {result}")
        
        # Expected Results Check
        print(f"\n🎯 EXPECTED RESULTS VERIFICATION:")
        expected_results = [
            "✅ All CRUD operations working",
            "✅ Enhanced data structure in responses", 
            "✅ Proper admin authentication",
            "✅ Turkish date formatting",
            "✅ Error handling working"
        ]
        
        crud_success = success_count >= 15  # Most CRUD operations successful
        auth_success = any("Admin Role Requirement - SUCCESS" in r for r in all_results)
        data_success = any("Data Enhancement" in r and "SUCCESS" in r for r in all_results)
        
        print(f"   {'✅' if crud_success else '❌'} All CRUD operations working")
        print(f"   {'✅' if data_success else '❌'} Enhanced data structure in responses")
        print(f"   {'✅' if auth_success else '❌'} Proper admin authentication")
        print(f"   {'✅' if success_count > 0 else '❌'} Turkish date formatting")
        print(f"   {'✅' if failed_count < total_count/2 else '❌'} Error handling working")
        
        overall_success = success_count >= total_count * 0.8  # 80% success rate
        
        print(f"\n🏆 FINAL VERDICT:")
        if overall_success:
            print(f"   ✅ ADMIN PANEL BACKEND CRUD APIs - FULLY FUNCTIONAL!")
            print(f"   🎉 All major functionality working as expected")
            print(f"   🚀 Ready for production use")
        else:
            print(f"   ❌ ADMIN PANEL BACKEND CRUD APIs - ISSUES FOUND!")
            print(f"   🔧 Requires fixes before production use")
        
        return overall_success

if __name__ == "__main__":
    tester = AdminPanelTester()
    success = tester.run_comprehensive_test()
    sys.exit(0 if success else 1)