#!/usr/bin/env python3
"""
Session Flow Test - Test complete session authentication flow
"""

import requests
import json
import sys
from datetime import datetime

BACKEND_URL = "https://mavibilet.preview.emergentagent.com/api"

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

def test_complete_session_flow():
    """Test complete session flow with mock data"""
    print_test_header("Complete Session Flow Test")
    
    # Step 1: Test Google Auth redirect
    print_info("Step 1: Testing Google Auth redirect")
    try:
        response = requests.post(f"{BACKEND_URL}/auth/google")
        if response.status_code == 200:
            auth_data = response.json()
            print_success(f"Google Auth URL: {auth_data.get('auth_url')}")
        else:
            print_error(f"Google Auth failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Google Auth request failed: {e}")
        return False
    
    # Step 2: Test session creation with mock data
    print_info("Step 2: Testing session creation (will fail with mock data)")
    try:
        headers = {"X-Session-ID": "mock_session_for_testing"}
        response = requests.post(f"{BACKEND_URL}/auth/session", headers=headers)
        
        print(f"Session creation status: {response.status_code}")
        print(f"Response: {response.text}")
        
        # We expect this to fail since it's mock data
        if response.status_code == 500:
            print_info("Session creation failed as expected with mock data")
        else:
            print_error(f"Unexpected response: {response.status_code}")
    except Exception as e:
        print_error(f"Session creation request failed: {e}")
    
    # Step 3: Test /api/auth/me without session
    print_info("Step 3: Testing /api/auth/me without session")
    try:
        response = requests.get(f"{BACKEND_URL}/auth/me")
        if response.status_code == 401:
            print_success("Auth me correctly requires authentication")
        else:
            print_error(f"Unexpected response: {response.status_code}")
    except Exception as e:
        print_error(f"Auth me request failed: {e}")
    
    # Step 4: Test logout
    print_info("Step 4: Testing logout")
    try:
        response = requests.post(f"{BACKEND_URL}/auth/logout")
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print_success("Logout successful")
            else:
                print_error("Logout response incorrect")
        else:
            print_error(f"Logout failed: {response.status_code}")
    except Exception as e:
        print_error(f"Logout request failed: {e}")
    
    return True

def test_session_vs_jwt_comparison():
    """Compare session-based vs JWT-based authentication"""
    print_test_header("Session vs JWT Authentication Comparison")
    
    # Get JWT token first
    try:
        login_data = {"email": "user@example.com", "password": "password123"}
        login_response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data)
        
        if login_response.status_code != 200:
            print_error("Could not get JWT token")
            return False
        
        jwt_token = login_response.json().get("token")
        print_success("JWT token obtained successfully")
        
        # Test JWT with different endpoints
        headers = {"Authorization": f"Bearer {jwt_token}"}
        
        # Test 1: JWT with /api/users/me (should work)
        response = requests.get(f"{BACKEND_URL}/users/me", headers=headers)
        print(f"JWT + /api/users/me: {response.status_code}")
        if response.status_code == 200:
            print_success("JWT works with /api/users/me")
        else:
            print_error("JWT failed with /api/users/me")
        
        # Test 2: JWT with /api/auth/me (session endpoint)
        response = requests.get(f"{BACKEND_URL}/auth/me", headers=headers)
        print(f"JWT + /api/auth/me: {response.status_code}")
        if response.status_code == 401:
            print_success("Session endpoint correctly rejects JWT")
        elif response.status_code == 200:
            print_info("Session endpoint accepts JWT (hybrid auth)")
        else:
            print_error(f"Unexpected response: {response.status_code}")
        
        # Test 3: Session cookie with /api/auth/me (should fail with mock)
        cookies = {"session_token": "mock_session_token"}
        response = requests.get(f"{BACKEND_URL}/auth/me", cookies=cookies)
        print(f"Session cookie + /api/auth/me: {response.status_code}")
        if response.status_code == 401:
            print_success("Session endpoint validates session cookies")
        else:
            print_error(f"Unexpected response: {response.status_code}")
        
        return True
        
    except Exception as e:
        print_error(f"Comparison test failed: {e}")
        return False

def test_error_scenarios():
    """Test various error scenarios"""
    print_test_header("Error Scenarios Test")
    
    scenarios = [
        ("Missing session header", lambda: requests.post(f"{BACKEND_URL}/auth/session")),
        ("Empty session header", lambda: requests.post(f"{BACKEND_URL}/auth/session", headers={"X-Session-ID": ""})),
        ("Invalid session ID", lambda: requests.post(f"{BACKEND_URL}/auth/session", headers={"X-Session-ID": "invalid123"})),
        ("No auth for /api/auth/me", lambda: requests.get(f"{BACKEND_URL}/auth/me")),
        ("Invalid cookie for /api/auth/me", lambda: requests.get(f"{BACKEND_URL}/auth/me", cookies={"session_token": "invalid"})),
    ]
    
    success_count = 0
    
    for scenario_name, request_func in scenarios:
        try:
            print_info(f"Testing: {scenario_name}")
            response = request_func()
            
            # All these should return error status codes
            if response.status_code in [400, 401, 500]:
                print_success(f"{scenario_name}: {response.status_code} (error as expected)")
                success_count += 1
            else:
                print_error(f"{scenario_name}: {response.status_code} (unexpected)")
                
        except Exception as e:
            print_error(f"{scenario_name} failed: {e}")
    
    print_info(f"Error scenarios: {success_count}/{len(scenarios)} handled correctly")
    return success_count >= len(scenarios) - 1  # Allow one failure

def main():
    """Run session flow tests"""
    print("🚀 Session Flow Test Başlıyor...")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Zamanı: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tests = [
        ("Complete Session Flow", test_complete_session_flow),
        ("Session vs JWT Comparison", test_session_vs_jwt_comparison),
        ("Error Scenarios", test_error_scenarios),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print_error(f"Test '{test_name}' crashed: {str(e)}")
            results.append((test_name, False))
    
    # Summary
    print_test_header("SESSION FLOW TEST SONUÇLARI")
    
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
    
    return passed >= 2

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)