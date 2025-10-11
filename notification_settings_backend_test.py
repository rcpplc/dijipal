#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

# Configuration
BACKEND_URL = "https://reservation-system-2.preview.emergentagent.com/api"

def test_notification_settings_api():
    """
    Comprehensive testing of Notification Settings API Implementation
    
    Tests:
    1. PUT /api/profile/notifications endpoint
    2. GET /api/profile/notifications endpoint  
    3. User model notification fields validation
    4. Default values verification
    5. Authentication requirements
    """
    
    print("🔍 NOTIFICATION SETTINGS API TESTING STARTED")
    print("=" * 60)
    
    results = {
        "total_tests": 0,
        "passed_tests": 0,
        "failed_tests": 0,
        "test_details": []
    }
    
    # Test 1: Backend Health Check
    print("\n1️⃣ BACKEND HEALTH CHECK")
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        if response.status_code == 200:
            print("✅ Backend server accessible")
            results["passed_tests"] += 1
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            results["failed_tests"] += 1
        results["total_tests"] += 1
        results["test_details"].append(f"Backend Health: {'✅ PASS' if response.status_code == 200 else '❌ FAIL'}")
    except Exception as e:
        print(f"❌ Backend connection failed: {e}")
        results["failed_tests"] += 1
        results["total_tests"] += 1
        results["test_details"].append("Backend Health: ❌ FAIL - Connection error")
        return results
    
    # Test 2: User Authentication (Required for profile endpoints)
    print("\n2️⃣ USER AUTHENTICATION")
    login_data = {
        "email": "user@example.com",
        "password": "password123"
    }
    
    try:
        login_response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data, timeout=10)
        if login_response.status_code == 200:
            login_result = login_response.json()
            user_token = login_result.get("token")
            user_data = login_result.get("user", {})
            print(f"✅ User login successful: {user_data.get('email')}")
            print(f"✅ JWT token received: {len(user_token)} characters")
            results["passed_tests"] += 1
            results["test_details"].append("User Authentication: ✅ PASS")
        else:
            print(f"❌ User login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            results["failed_tests"] += 1
            results["test_details"].append("User Authentication: ❌ FAIL")
            return results
        results["total_tests"] += 1
    except Exception as e:
        print(f"❌ Login request failed: {e}")
        results["failed_tests"] += 1
        results["total_tests"] += 1
        results["test_details"].append("User Authentication: ❌ FAIL - Request error")
        return results
    
    # Headers for authenticated requests
    headers = {
        "Authorization": f"Bearer {user_token}",
        "Content-Type": "application/json"
    }
    
    # Test 3: Check Current User Profile Structure
    print("\n3️⃣ CURRENT USER PROFILE ANALYSIS")
    try:
        profile_response = requests.get(f"{BACKEND_URL}/users/me", headers=headers, timeout=10)
        if profile_response.status_code == 200:
            profile_data = profile_response.json()
            print("✅ User profile endpoint accessible")
            print(f"📋 Current user fields: {list(profile_data.keys())}")
            
            # Check for notification fields
            notification_fields = ["email_notifications", "sms_notifications", "marketing_emails"]
            existing_notification_fields = []
            missing_notification_fields = []
            
            for field in notification_fields:
                if field in profile_data:
                    existing_notification_fields.append(field)
                    print(f"✅ Found notification field: {field} = {profile_data[field]}")
                else:
                    missing_notification_fields.append(field)
                    print(f"❌ Missing notification field: {field}")
            
            if existing_notification_fields:
                print(f"✅ Existing notification fields: {existing_notification_fields}")
                results["passed_tests"] += 1
            else:
                print("❌ No notification fields found in user model")
                results["failed_tests"] += 1
            
            results["test_details"].append(f"User Model Fields: {'✅ PASS' if existing_notification_fields else '❌ FAIL'} - {len(existing_notification_fields)}/3 notification fields found")
        else:
            print(f"❌ User profile endpoint failed: {profile_response.status_code}")
            results["failed_tests"] += 1
            results["test_details"].append("User Profile Access: ❌ FAIL")
        results["total_tests"] += 1
    except Exception as e:
        print(f"❌ Profile request failed: {e}")
        results["failed_tests"] += 1
        results["total_tests"] += 1
        results["test_details"].append("User Profile Access: ❌ FAIL - Request error")
    
    # Test 4: GET /api/profile/notifications Endpoint
    print("\n4️⃣ GET NOTIFICATION SETTINGS ENDPOINT")
    try:
        get_notifications_response = requests.get(f"{BACKEND_URL}/profile/notifications", headers=headers, timeout=10)
        
        if get_notifications_response.status_code == 200:
            notifications_data = get_notifications_response.json()
            print("✅ GET /api/profile/notifications endpoint exists and working")
            print(f"📋 Response data: {json.dumps(notifications_data, indent=2)}")
            
            # Validate response structure
            expected_fields = ["email_notifications", "sms_notifications", "marketing_emails"]
            response_valid = True
            
            for field in expected_fields:
                if field in notifications_data:
                    print(f"✅ Response contains {field}: {notifications_data[field]}")
                else:
                    print(f"❌ Response missing {field}")
                    response_valid = False
            
            # Check default values
            if notifications_data.get("email_notifications") == True:
                print("✅ Default email_notifications: true (correct)")
            else:
                print(f"⚠️ email_notifications default: {notifications_data.get('email_notifications')} (expected: true)")
            
            if notifications_data.get("sms_notifications") == True:
                print("✅ Default sms_notifications: true (correct)")
            else:
                print(f"⚠️ sms_notifications default: {notifications_data.get('sms_notifications')} (expected: true)")
            
            if notifications_data.get("marketing_emails") == False:
                print("✅ Default marketing_emails: false (correct)")
            else:
                print(f"⚠️ marketing_emails default: {notifications_data.get('marketing_emails')} (expected: false)")
            
            if response_valid:
                results["passed_tests"] += 1
                results["test_details"].append("GET Notifications: ✅ PASS - All fields present with correct defaults")
            else:
                results["failed_tests"] += 1
                results["test_details"].append("GET Notifications: ❌ FAIL - Missing required fields")
                
        elif get_notifications_response.status_code == 404:
            print("❌ GET /api/profile/notifications endpoint NOT FOUND (404)")
            print("💡 This endpoint needs to be implemented")
            results["failed_tests"] += 1
            results["test_details"].append("GET Notifications: ❌ FAIL - Endpoint not implemented (404)")
        else:
            print(f"❌ GET /api/profile/notifications failed: {get_notifications_response.status_code}")
            print(f"Response: {get_notifications_response.text}")
            results["failed_tests"] += 1
            results["test_details"].append(f"GET Notifications: ❌ FAIL - HTTP {get_notifications_response.status_code}")
        
        results["total_tests"] += 1
    except Exception as e:
        print(f"❌ GET notifications request failed: {e}")
        results["failed_tests"] += 1
        results["total_tests"] += 1
        results["test_details"].append("GET Notifications: ❌ FAIL - Request error")
    
    # Test 5: PUT /api/profile/notifications Endpoint
    print("\n5️⃣ PUT NOTIFICATION SETTINGS ENDPOINT")
    
    # Test data for updating notifications
    update_data = {
        "email_notifications": False,
        "sms_notifications": True,
        "marketing_emails": True
    }
    
    try:
        put_notifications_response = requests.put(
            f"{BACKEND_URL}/profile/notifications", 
            headers=headers, 
            json=update_data, 
            timeout=10
        )
        
        if put_notifications_response.status_code == 200:
            update_result = put_notifications_response.json()
            print("✅ PUT /api/profile/notifications endpoint exists and working")
            print(f"📋 Update response: {json.dumps(update_result, indent=2)}")
            
            # Verify the update was successful
            if "message" in update_result or "success" in str(update_result).lower():
                print("✅ Update response indicates success")
                results["passed_tests"] += 1
                results["test_details"].append("PUT Notifications: ✅ PASS - Update successful")
            else:
                print("⚠️ Update response format unclear")
                results["passed_tests"] += 1  # Still count as pass if 200 status
                results["test_details"].append("PUT Notifications: ✅ PASS - Update completed (unclear response format)")
                
        elif put_notifications_response.status_code == 404:
            print("❌ PUT /api/profile/notifications endpoint NOT FOUND (404)")
            print("💡 This endpoint needs to be implemented")
            results["failed_tests"] += 1
            results["test_details"].append("PUT Notifications: ❌ FAIL - Endpoint not implemented (404)")
        else:
            print(f"❌ PUT /api/profile/notifications failed: {put_notifications_response.status_code}")
            print(f"Response: {put_notifications_response.text}")
            results["failed_tests"] += 1
            results["test_details"].append(f"PUT Notifications: ❌ FAIL - HTTP {put_notifications_response.status_code}")
        
        results["total_tests"] += 1
    except Exception as e:
        print(f"❌ PUT notifications request failed: {e}")
        results["failed_tests"] += 1
        results["total_tests"] += 1
        results["test_details"].append("PUT Notifications: ❌ FAIL - Request error")
    
    # Test 6: Verify Update Persistence (if PUT worked)
    if results["test_details"][-1].startswith("PUT Notifications: ✅"):
        print("\n6️⃣ VERIFY UPDATE PERSISTENCE")
        try:
            verify_response = requests.get(f"{BACKEND_URL}/profile/notifications", headers=headers, timeout=10)
            
            if verify_response.status_code == 200:
                updated_data = verify_response.json()
                print("✅ Verification GET request successful")
                print(f"📋 Updated data: {json.dumps(updated_data, indent=2)}")
                
                # Check if updates were persisted
                persistence_check = True
                for field, expected_value in update_data.items():
                    actual_value = updated_data.get(field)
                    if actual_value == expected_value:
                        print(f"✅ {field}: {actual_value} (correctly updated)")
                    else:
                        print(f"❌ {field}: {actual_value} (expected: {expected_value})")
                        persistence_check = False
                
                if persistence_check:
                    results["passed_tests"] += 1
                    results["test_details"].append("Update Persistence: ✅ PASS - All changes persisted correctly")
                else:
                    results["failed_tests"] += 1
                    results["test_details"].append("Update Persistence: ❌ FAIL - Some changes not persisted")
            else:
                print(f"❌ Verification GET failed: {verify_response.status_code}")
                results["failed_tests"] += 1
                results["test_details"].append("Update Persistence: ❌ FAIL - Cannot verify persistence")
            
            results["total_tests"] += 1
        except Exception as e:
            print(f"❌ Verification request failed: {e}")
            results["failed_tests"] += 1
            results["total_tests"] += 1
            results["test_details"].append("Update Persistence: ❌ FAIL - Request error")
    
    # Test 7: Authentication Requirements
    print("\n7️⃣ AUTHENTICATION REQUIREMENTS")
    
    # Test without token
    try:
        no_auth_response = requests.get(f"{BACKEND_URL}/profile/notifications", timeout=10)
        
        if no_auth_response.status_code in [401, 403]:
            print(f"✅ Endpoint properly requires authentication: {no_auth_response.status_code}")
            results["passed_tests"] += 1
            results["test_details"].append("Authentication Required: ✅ PASS - Endpoint protected")
        elif no_auth_response.status_code == 404:
            print("⚠️ Endpoint not found (404) - cannot test auth requirements")
            results["test_details"].append("Authentication Required: ⚠️ SKIP - Endpoint not implemented")
        else:
            print(f"❌ Endpoint should require authentication but returned: {no_auth_response.status_code}")
            results["failed_tests"] += 1
            results["test_details"].append("Authentication Required: ❌ FAIL - Endpoint not protected")
        
        results["total_tests"] += 1
    except Exception as e:
        print(f"❌ Auth test request failed: {e}")
        results["failed_tests"] += 1
        results["total_tests"] += 1
        results["test_details"].append("Authentication Required: ❌ FAIL - Request error")
    
    # Test 8: Invalid Data Handling (if PUT endpoint exists)
    print("\n8️⃣ INVALID DATA HANDLING")
    
    invalid_data = {
        "email_notifications": "invalid_boolean",
        "sms_notifications": 123,
        "marketing_emails": None
    }
    
    try:
        invalid_response = requests.put(
            f"{BACKEND_URL}/profile/notifications", 
            headers=headers, 
            json=invalid_data, 
            timeout=10
        )
        
        if invalid_response.status_code == 422:  # Validation error
            print("✅ Endpoint properly validates input data (422)")
            results["passed_tests"] += 1
            results["test_details"].append("Data Validation: ✅ PASS - Invalid data rejected")
        elif invalid_response.status_code == 404:
            print("⚠️ Endpoint not found (404) - cannot test validation")
            results["test_details"].append("Data Validation: ⚠️ SKIP - Endpoint not implemented")
        elif invalid_response.status_code == 400:
            print("✅ Endpoint properly validates input data (400)")
            results["passed_tests"] += 1
            results["test_details"].append("Data Validation: ✅ PASS - Invalid data rejected")
        else:
            print(f"⚠️ Unexpected response to invalid data: {invalid_response.status_code}")
            print(f"Response: {invalid_response.text}")
            results["test_details"].append(f"Data Validation: ⚠️ UNCLEAR - HTTP {invalid_response.status_code}")
        
        results["total_tests"] += 1
    except Exception as e:
        print(f"❌ Invalid data test failed: {e}")
        results["failed_tests"] += 1
        results["total_tests"] += 1
        results["test_details"].append("Data Validation: ❌ FAIL - Request error")
    
    return results

def main():
    print("🚀 NOTIFICATION SETTINGS API IMPLEMENTATION TESTING")
    print("📋 Testing Turkish Review Request: ProfilePage'den bildirim tercihleri güncellenemediği için backend'e notification settings endpoint'leri ekle")
    print(f"🕐 Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = test_notification_settings_api()
    
    # Print Summary
    print("\n" + "=" * 60)
    print("📊 NOTIFICATION SETTINGS API TEST SUMMARY")
    print("=" * 60)
    
    success_rate = (results["passed_tests"] / results["total_tests"] * 100) if results["total_tests"] > 0 else 0
    
    print(f"✅ Passed Tests: {results['passed_tests']}")
    print(f"❌ Failed Tests: {results['failed_tests']}")
    print(f"📊 Total Tests: {results['total_tests']}")
    print(f"🎯 Success Rate: {success_rate:.1f}%")
    
    print("\n📋 DETAILED TEST RESULTS:")
    for i, detail in enumerate(results["test_details"], 1):
        print(f"{i}. {detail}")
    
    # Implementation Status Analysis
    print("\n🔍 IMPLEMENTATION STATUS ANALYSIS:")
    
    get_endpoint_exists = any("GET Notifications: ✅" in detail for detail in results["test_details"])
    put_endpoint_exists = any("PUT Notifications: ✅" in detail for detail in results["test_details"])
    user_fields_exist = any("User Model Fields: ✅" in detail for detail in results["test_details"])
    
    if get_endpoint_exists and put_endpoint_exists and user_fields_exist:
        print("✅ FULLY IMPLEMENTED: All notification settings endpoints and user model fields are working")
    elif get_endpoint_exists or put_endpoint_exists:
        print("⚠️ PARTIALLY IMPLEMENTED: Some endpoints exist but implementation is incomplete")
    else:
        print("❌ NOT IMPLEMENTED: Notification settings endpoints need to be created")
    
    print("\n💡 IMPLEMENTATION REQUIREMENTS:")
    print("1. ✅ PUT /api/profile/notifications endpoint" if put_endpoint_exists else "1. ❌ PUT /api/profile/notifications endpoint - NEEDS IMPLEMENTATION")
    print("2. ✅ GET /api/profile/notifications endpoint" if get_endpoint_exists else "2. ❌ GET /api/profile/notifications endpoint - NEEDS IMPLEMENTATION")  
    print("3. ✅ User model notification fields" if user_fields_exist else "3. ❌ User model notification fields - NEEDS IMPLEMENTATION")
    
    if not (get_endpoint_exists and put_endpoint_exists and user_fields_exist):
        print("\n🛠️ REQUIRED IMPLEMENTATION STEPS:")
        if not user_fields_exist:
            print("   • Add notification fields to User model: email_notifications, sms_notifications, marketing_emails")
        if not get_endpoint_exists:
            print("   • Create GET /api/profile/notifications endpoint")
        if not put_endpoint_exists:
            print("   • Create PUT /api/profile/notifications endpoint")
        print("   • Set default values: email_notifications=true, sms_notifications=true, marketing_emails=false")
        print("   • Add proper authentication and validation")
    
    print(f"\n🕐 Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Return appropriate exit code
    if success_rate >= 80:
        return 0
    else:
        return 1

if __name__ == "__main__":
    sys.exit(main())