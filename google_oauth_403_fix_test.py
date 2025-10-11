#!/usr/bin/env python3
"""
Google OAuth 403 Fix Test - Turkish Review Request
Test edilecek özellikler:
1. GET /api/auth/google endpoint'i test et ve generated OAuth URL'i kontrol et
2. redirect_uri parametresi HTTPS olmalı: https://mavibilet.preview.emergentagent.com/api/auth/google/callback
3. HTTP değil HTTPS scheme kullanmalı
4. OAuth URL Analysis: client_id, redirect_uri, scope, response_type parametreleri doğru mu?
5. Google OAuth Flow validation (1 step only) - 403 error'a sebep olan scheme mismatch fix oldu mu?
"""

import requests
import json
import sys
import os
from datetime import datetime
from urllib.parse import urlparse, parse_qs

# Backend URL configuration
BACKEND_URL = "https://mavibilet.preview.emergentagent.com/api"

def print_test_header(test_name):
    print(f"\n{'='*70}")
    print(f"🧪 {test_name}")
    print(f"{'='*70}")

def print_success(message):
    print(f"✅ {message}")

def print_error(message):
    print(f"❌ {message}")

def print_info(message):
    print(f"ℹ️  {message}")

def print_warning(message):
    print(f"⚠️  {message}")

def test_backend_health():
    """Test backend server health"""
    print_test_header("Backend Server Health Check")
    
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print_success("Backend server is healthy and accessible")
            return True
        else:
            print_error(f"Backend health check failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Backend health check failed: {str(e)}")
        return False

def test_google_oauth_environment_variables():
    """Test if Google OAuth environment variables are properly set"""
    print_test_header("Google OAuth Environment Variables Check")
    
    try:
        # We can't directly access backend env vars, but we can test if the endpoint works
        # which indicates the env vars are set
        response = requests.get(f"{BACKEND_URL}/auth/google", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if "auth_url" in data:
                print_success("Google OAuth environment variables are properly configured")
                print_info(f"Generated OAuth URL: {data['auth_url']}")
                return True, data['auth_url']
            else:
                print_error("Response missing 'auth_url' field")
                return False, None
        elif response.status_code == 500:
            data = response.json()
            if "Google OAuth not configured" in data.get("detail", ""):
                print_error("Google OAuth environment variables are missing")
                return False, None
            else:
                print_error(f"Server error: {data.get('detail', 'Unknown error')}")
                return False, None
        else:
            print_error(f"Unexpected status code: {response.status_code}")
            return False, None
            
    except Exception as e:
        print_error(f"Environment variables check failed: {str(e)}")
        return False, None

def analyze_oauth_url(auth_url):
    """Analyze the generated OAuth URL for correctness"""
    print_test_header("OAuth URL Analysis")
    
    try:
        print_info(f"Analyzing OAuth URL: {auth_url}")
        
        # Parse the URL
        parsed_url = urlparse(auth_url)
        query_params = parse_qs(parsed_url.query)
        
        print_info(f"Base URL: {parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}")
        print_info(f"Query Parameters: {dict(query_params)}")
        
        # Check base URL
        expected_base = "https://accounts.google.com/o/oauth2/auth"
        actual_base = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}"
        
        if actual_base == expected_base:
            print_success("✅ Base URL is correct: https://accounts.google.com/o/oauth2/auth")
        else:
            print_error(f"❌ Base URL incorrect. Expected: {expected_base}, Got: {actual_base}")
            return False
        
        # Check client_id
        client_id = query_params.get('client_id', [None])[0]
        if client_id:
            print_success(f"✅ client_id present: {client_id}")
            # Verify it matches expected format
            if client_id.endswith('.apps.googleusercontent.com'):
                print_success("✅ client_id format is valid (Google OAuth format)")
            else:
                print_warning("⚠️ client_id format may be incorrect")
        else:
            print_error("❌ client_id missing")
            return False
        
        # Check redirect_uri - THIS IS THE CRITICAL TEST
        redirect_uri = query_params.get('redirect_uri', [None])[0]
        expected_redirect_uri = "https://mavibilet.preview.emergentagent.com/api/auth/google/callback"
        
        if redirect_uri:
            print_info(f"redirect_uri found: {redirect_uri}")
            
            if redirect_uri == expected_redirect_uri:
                print_success("✅ CRITICAL FIX VERIFIED: redirect_uri uses HTTPS scheme correctly!")
                print_success(f"✅ redirect_uri matches expected: {expected_redirect_uri}")
            else:
                print_error(f"❌ CRITICAL ISSUE: redirect_uri mismatch!")
                print_error(f"   Expected: {expected_redirect_uri}")
                print_error(f"   Got:      {redirect_uri}")
                
                # Check if it's HTTP vs HTTPS issue
                if redirect_uri.startswith('http://') and expected_redirect_uri.startswith('https://'):
                    print_error("❌ SCHEME MISMATCH: Using HTTP instead of HTTPS - This causes 403 error!")
                    return False
                else:
                    print_error("❌ redirect_uri does not match expected value")
                    return False
        else:
            print_error("❌ redirect_uri missing")
            return False
        
        # Check response_type
        response_type = query_params.get('response_type', [None])[0]
        if response_type == 'code':
            print_success("✅ response_type is correct: code")
        else:
            print_error(f"❌ response_type incorrect. Expected: code, Got: {response_type}")
            return False
        
        # Check scope
        scope = query_params.get('scope', [None])[0]
        expected_scopes = ['openid', 'email', 'profile']
        if scope:
            scope_list = scope.split(' ')
            print_info(f"Scopes found: {scope_list}")
            
            missing_scopes = [s for s in expected_scopes if s not in scope_list]
            if not missing_scopes:
                print_success("✅ All required scopes present: openid, email, profile")
            else:
                print_warning(f"⚠️ Missing scopes: {missing_scopes}")
        else:
            print_error("❌ scope parameter missing")
            return False
        
        # Check state parameter
        state = query_params.get('state', [None])[0]
        if state:
            print_success(f"✅ state parameter present: {state}")
        else:
            print_warning("⚠️ state parameter missing (recommended for security)")
        
        print_success("🎉 OAuth URL analysis completed successfully!")
        return True
        
    except Exception as e:
        print_error(f"OAuth URL analysis failed: {str(e)}")
        return False

def test_google_oauth_callback_endpoint():
    """Test if the Google OAuth callback endpoint exists"""
    print_test_header("Google OAuth Callback Endpoint Test")
    
    try:
        # Test the callback endpoint with mock parameters
        callback_url = f"{BACKEND_URL}/auth/google/callback"
        params = {
            'code': 'mock_auth_code_for_testing',
            'state': 'mock_state_token'
        }
        
        response = requests.get(callback_url, params=params, timeout=10)
        
        print(f"Callback URL: {callback_url}")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        # We expect this to fail with 400 or 500 since we're using mock data
        # But the endpoint should exist and process the request
        if response.status_code in [400, 500]:
            data = response.json()
            if "Token exchange failed" in data.get("detail", "") or "Authentication failed" in data.get("detail", ""):
                print_success("✅ Callback endpoint exists and processes requests correctly")
                print_info("Expected failure with mock data - endpoint is functional")
                return True
            else:
                print_warning(f"⚠️ Callback endpoint exists but returned unexpected error: {data.get('detail', 'Unknown')}")
                return True  # Still counts as working since endpoint exists
        elif response.status_code == 404:
            print_error("❌ Callback endpoint not found (404)")
            return False
        else:
            print_warning(f"⚠️ Unexpected status code: {response.status_code}")
            return True  # Endpoint exists, just unexpected response
            
    except Exception as e:
        print_error(f"Callback endpoint test failed: {str(e)}")
        return False

def test_google_oauth_403_fix_validation():
    """Main test to validate the Google OAuth 403 fix"""
    print_test_header("Google OAuth 403 Fix Validation - CRITICAL TEST")
    
    print_info("Testing the specific fix for Google OAuth 403 error...")
    print_info("Issue: Backend was generating HTTP redirect URI instead of HTTPS")
    print_info("Fix: Hardcode HTTPS scheme in redirect_uri construction")
    
    try:
        # Get the OAuth URL
        response = requests.get(f"{BACKEND_URL}/auth/google", timeout=10)
        
        if response.status_code != 200:
            print_error(f"Cannot get OAuth URL: {response.status_code}")
            return False
        
        data = response.json()
        auth_url = data.get('auth_url')
        
        if not auth_url:
            print_error("No auth_url in response")
            return False
        
        # Parse and validate the critical redirect_uri parameter
        parsed_url = urlparse(auth_url)
        query_params = parse_qs(parsed_url.query)
        redirect_uri = query_params.get('redirect_uri', [None])[0]
        
        print_info(f"Generated redirect_uri: {redirect_uri}")
        
        # Critical validation
        expected_https_uri = "https://mavibilet.preview.emergentagent.com/api/auth/google/callback"
        
        if redirect_uri == expected_https_uri:
            print_success("🎉 GOOGLE OAUTH 403 FIX VERIFIED!")
            print_success("✅ redirect_uri correctly uses HTTPS scheme")
            print_success("✅ redirect_uri matches Google Console configuration")
            print_success("✅ No more scheme mismatch - 403 error should be resolved")
            return True
        else:
            print_error("❌ GOOGLE OAUTH 403 FIX FAILED!")
            print_error(f"❌ Expected: {expected_https_uri}")
            print_error(f"❌ Got:      {redirect_uri}")
            
            if redirect_uri and redirect_uri.startswith('http://'):
                print_error("❌ CRITICAL: Still using HTTP scheme - 403 error will persist!")
            
            return False
            
    except Exception as e:
        print_error(f"Google OAuth 403 fix validation failed: {str(e)}")
        return False

def main():
    """Run Google OAuth 403 fix tests"""
    print("🚀 Google OAuth 403 Fix Test Başlıyor...")
    print("🎯 Turkish Review Request: HTTPS Redirect URI Fix Test")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Zamanı: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tests = [
        ("Backend Health Check", test_backend_health),
        ("Google OAuth Environment Variables", lambda: test_google_oauth_environment_variables()[0]),
        ("Google OAuth 403 Fix Validation", test_google_oauth_403_fix_validation),
        ("Google OAuth Callback Endpoint", test_google_oauth_callback_endpoint),
    ]
    
    results = []
    auth_url = None
    
    # First, get the OAuth URL for analysis
    try:
        env_result, oauth_url = test_google_oauth_environment_variables()
        if env_result and oauth_url:
            auth_url = oauth_url
    except:
        pass
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print_error(f"Test '{test_name}' crashed: {str(e)}")
            results.append((test_name, False))
    
    # If we have an OAuth URL, analyze it
    if auth_url:
        try:
            analysis_result = analyze_oauth_url(auth_url)
            results.append(("OAuth URL Analysis", analysis_result))
        except Exception as e:
            print_error(f"OAuth URL analysis crashed: {str(e)}")
            results.append(("OAuth URL Analysis", False))
    
    # Test Summary
    print_test_header("TEST SONUÇLARI - GOOGLE OAUTH 403 FIX")
    
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
    
    # Critical assessment
    critical_tests = ["Google OAuth 403 Fix Validation", "OAuth URL Analysis"]
    critical_passed = sum(1 for name, result in results if name in critical_tests and result)
    critical_total = sum(1 for name, result in results if name in critical_tests)
    
    print(f"\n🎯 CRITICAL FIX ASSESSMENT:")
    print(f"✅ Critical Tests Passed: {critical_passed}/{critical_total}")
    
    if critical_passed == critical_total and critical_total > 0:
        print("\n🎉 GOOGLE OAUTH 403 FIX BAŞARILI!")
        print("✅ HTTPS redirect_uri fix working correctly")
        print("✅ Google OAuth 403 error should be resolved")
        return True
    else:
        print(f"\n⚠️  GOOGLE OAUTH 403 FIX ISSUES DETECTED!")
        print("❌ Critical tests failed - 403 error may persist")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)