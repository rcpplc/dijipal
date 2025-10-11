#!/usr/bin/env python3
"""
Google Login ve Session Management Backend Test
Test edilecek endpoint'ler:
1. POST /api/auth/session - Session ID ile kullanıcı authentication
2. GET /api/auth/me - Mevcut kullanıcı bilgileri (session cookie ile)
3. POST /api/auth/logout - Session temizleme
4. POST /api/auth/google - Google Auth redirect URL
"""

import requests
import json
import sys
import os
from datetime import datetime

# Backend URL configuration
BACKEND_URL = "https://payment-modal-fix.preview.emergentagent.com/api"

def print_test_header(test_name):
    print(f"\n{'='*60}")
    print(f"🧪 {test_name}")
    print(f"{'='*60}")

def print_success(message):
    print(f"✅ {message}")

def print_error(message):
    print(f"❌ {message}")

def print_info(message):
    print(f"ℹ️  {message}")

def test_google_auth_redirect():
    """Test POST /api/auth/google - Google Auth redirect URL"""
    print_test_header("Google Auth Redirect URL Test")
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/google")
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if "auth_url" in data:
                print_success(f"Google Auth redirect URL received: {data['auth_url']}")
                return True
            else:
                print_error("Response missing 'auth_url' field")
                return False
        else:
            print_error(f"Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Request failed: {str(e)}")
        return False

def test_session_authentication_mock():
    """Test POST /api/auth/session with mock session data"""
    print_test_header("Session Authentication Test (Mock Data)")
    
    # Mock session ID for testing
    mock_session_id = "test_session_123"
    
    try:
        headers = {
            "X-Session-ID": mock_session_id,
            "Content-Type": "application/json"
        }
        
        response = requests.post(f"{BACKEND_URL}/auth/session", headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Since we're using a mock session ID, we expect this to fail with 401
        # But we want to verify the endpoint is accessible and handles the request properly
        if response.status_code == 401:
            data = response.json()
            if "detail" in data and "Invalid session ID" in data["detail"]:
                print_success("Session endpoint properly rejects invalid session ID")
                return True
            else:
                print_error("Unexpected error message for invalid session")
                return False
        elif response.status_code == 200:
            # If somehow it works (maybe with a real session), that's also good
            data = response.json()
            if "user" in data and "session_token" in data:
                print_success("Session authentication successful")
                return True
            else:
                print_error("Response missing required fields")
                return False
        else:
            print_error(f"Unexpected status code: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Request failed: {str(e)}")
        return False

def test_session_authentication_missing_header():
    """Test POST /api/auth/session without session ID header"""
    print_test_header("Session Authentication Test (Missing Header)")
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/session")
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 400:
            data = response.json()
            if "detail" in data and "Session ID required" in data["detail"]:
                print_success("Endpoint properly validates missing session ID")
                return True
            else:
                print_error("Unexpected error message for missing session ID")
                return False
        else:
            print_error(f"Expected 400, got {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Request failed: {str(e)}")
        return False

def test_get_current_user_no_auth():
    """Test GET /api/auth/me without authentication"""
    print_test_header("Get Current User Test (No Auth)")
    
    try:
        response = requests.get(f"{BACKEND_URL}/auth/me")
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 401:
            data = response.json()
            if "detail" in data and "Not authenticated" in data["detail"]:
                print_success("Endpoint properly requires authentication")
                return True
            else:
                print_error("Unexpected error message for unauthenticated request")
                return False
        else:
            print_error(f"Expected 401, got {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Request failed: {str(e)}")
        return False

def test_get_current_user_with_mock_cookie():
    """Test GET /api/auth/me with mock session cookie"""
    print_test_header("Get Current User Test (Mock Cookie)")
    
    try:
        # Mock session token cookie
        cookies = {"session_token": "mock_session_token_123"}
        
        response = requests.get(f"{BACKEND_URL}/auth/me", cookies=cookies)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        # We expect 401 since it's a mock token, but we want to verify the endpoint processes cookies
        if response.status_code == 401:
            data = response.json()
            if "detail" in data and "Not authenticated" in data["detail"]:
                print_success("Endpoint properly validates session cookie")
                return True
            else:
                print_error("Unexpected error message for invalid session cookie")
                return False
        elif response.status_code == 200:
            # If somehow it works, that's also acceptable
            data = response.json()
            if "user" in data:
                print_success("Session cookie authentication successful")
                return True
            else:
                print_error("Response missing user data")
                return False
        else:
            print_error(f"Unexpected status code: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Request failed: {str(e)}")
        return False

def test_logout_no_session():
    """Test POST /api/auth/logout without session"""
    print_test_header("Logout Test (No Session)")
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/logout")
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Logout should always return success even without session
        if response.status_code == 200:
            data = response.json()
            if "success" in data and data["success"] == True:
                print_success("Logout endpoint returns success even without session")
                return True
            else:
                print_error("Logout response format incorrect")
                return False
        else:
            print_error(f"Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Request failed: {str(e)}")
        return False

def test_logout_with_mock_cookie():
    """Test POST /api/auth/logout with mock session cookie"""
    print_test_header("Logout Test (Mock Cookie)")
    
    try:
        # Mock session token cookie
        cookies = {"session_token": "mock_session_token_123"}
        
        response = requests.post(f"{BACKEND_URL}/auth/logout", cookies=cookies)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if "success" in data and data["success"] == True:
                print_success("Logout with session cookie successful")
                
                # Check if Set-Cookie header is present to clear the cookie
                if 'Set-Cookie' in response.headers:
                    print_success("Response includes cookie clearing header")
                else:
                    print_info("No Set-Cookie header found (may be handled differently)")
                
                return True
            else:
                print_error("Logout response format incorrect")
                return False
        else:
            print_error(f"Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Request failed: {str(e)}")
        return False

def test_session_flow_integration():
    """Test complete session flow with existing user authentication"""
    print_test_header("Session Flow Integration Test")
    
    try:
        # First, try to login with existing user to get a real JWT token
        login_data = {
            "email": "user@example.com",
            "password": "password123"
        }
        
        login_response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data)
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            jwt_token = login_result.get("token")
            
            if jwt_token:
                print_success("Successfully obtained JWT token from regular login")
                
                # Test /api/auth/me with JWT token
                headers = {"Authorization": f"Bearer {jwt_token}"}
                me_response = requests.get(f"{BACKEND_URL}/auth/me", headers=headers)
                
                if me_response.status_code == 200:
                    user_data = me_response.json()
                    print_success(f"JWT authentication working - User: {user_data.get('user', {}).get('email', 'Unknown')}")
                    return True
                else:
                    print_error(f"JWT authentication failed: {me_response.status_code}")
                    return False
            else:
                print_error("No JWT token in login response")
                return False
        else:
            print_error(f"Login failed: {login_response.status_code}")
            print_info("Cannot test session flow without valid authentication")
            return False
            
    except Exception as e:
        print_error(f"Session flow test failed: {str(e)}")
        return False

def test_emergent_auth_integration():
    """Test integration with Emergent Auth API (informational)"""
    print_test_header("Emergent Auth Integration Test (Informational)")
    
    print_info("Testing connection to Emergent Auth API...")
    
    try:
        # Test if we can reach the Emergent Auth endpoint
        emergent_url = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
        headers = {"X-Session-ID": "test_session_for_connectivity"}
        
        response = requests.get(emergent_url, headers=headers, timeout=10)
        
        print(f"Emergent Auth Status Code: {response.status_code}")
        print(f"Emergent Auth Response: {response.text[:200]}...")
        
        if response.status_code in [200, 401, 403]:
            print_success("Emergent Auth API is accessible")
            return True
        else:
            print_error(f"Emergent Auth API returned unexpected status: {response.status_code}")
            return False
            
    except requests.exceptions.Timeout:
        print_error("Emergent Auth API timeout")
        return False
    except Exception as e:
        print_error(f"Cannot reach Emergent Auth API: {str(e)}")
        return False

def main():
    """Run all Google Login and Session Management tests"""
    print("🚀 Google Login ve Session Management Backend Test Başlıyor...")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Zamanı: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tests = [
        ("Google Auth Redirect URL", test_google_auth_redirect),
        ("Session Authentication (Mock)", test_session_authentication_mock),
        ("Session Authentication (Missing Header)", test_session_authentication_missing_header),
        ("Get Current User (No Auth)", test_get_current_user_no_auth),
        ("Get Current User (Mock Cookie)", test_get_current_user_with_mock_cookie),
        ("Logout (No Session)", test_logout_no_session),
        ("Logout (Mock Cookie)", test_logout_with_mock_cookie),
        ("Session Flow Integration", test_session_flow_integration),
        ("Emergent Auth Integration", test_emergent_auth_integration),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print_error(f"Test '{test_name}' crashed: {str(e)}")
            results.append((test_name, False))
    
    # Test Summary
    print_test_header("TEST SONUÇLARI")
    
    passed = 0
    failed = 0
    
    for test_name, result in results:
        if result:
            print_success(f"{test_name}")
            passed += 1
        else:
            print_error(f"{test_name}")
            failed += 1
    
    print(f"\n📊 ÖZET:")
    print(f"✅ Başarılı: {passed}")
    print(f"❌ Başarısız: {failed}")
    print(f"📈 Başarı Oranı: {(passed/(passed+failed)*100):.1f}%")
    
    if failed == 0:
        print("\n🎉 TÜM TESTLER BAŞARILI!")
        return True
    else:
        print(f"\n⚠️  {failed} TEST BAŞARISIZ!")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)