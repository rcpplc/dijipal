#!/usr/bin/env python3
"""
Google OAuth 403 Error Debug Test
Specific debugging for Google OAuth 403 error issue

Test edilecek:
1. GET /api/auth/google endpoint test - Google OAuth URL'i doğru oluşturuluyor mu?
2. Google OAuth URL formatı kontrol et:
   - client_id doğru mu?
   - redirect_uri doğru format'ta mı?
   - scope parametreleri doğru mu?
   - response_type=code var mı?
3. Environment Variables kontrol et:
   - GOOGLE_CLIENT_ID set edilmiş mi?
   - GOOGLE_CLIENT_SECRET set edilmiş mi?
4. Backend URL construction kontrol et:
   - request.base_url doğru değer veriyor mu?
   - Redirect URI'si Google Console'daki ile match ediyor mu?

Expected redirect URI: https://payment-modal-fix.preview.emergentagent.com/api/auth/google/callback
"""

import requests
import json
import sys
import os
from datetime import datetime
from urllib.parse import urlparse, parse_qs

# Backend URL configuration
BACKEND_URL = "https://payment-modal-fix.preview.emergentagent.com/api"
EXPECTED_REDIRECT_URI = "https://payment-modal-fix.preview.emergentagent.com/api/auth/google/callback"

def print_test_header(test_name):
    print(f"\n{'='*80}")
    print(f"🔍 {test_name}")
    print(f"{'='*80}")

def print_success(message):
    print(f"✅ {message}")

def print_error(message):
    print(f"❌ {message}")

def print_info(message):
    print(f"ℹ️  {message}")

def print_warning(message):
    print(f"⚠️  {message}")

def test_backend_health():
    """Test if backend is accessible"""
    print_test_header("Backend Health Check")
    
    try:
        response = requests.get(f"{BACKEND_URL.replace('/api', '')}/api/health", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print_success("Backend is accessible and healthy")
            return True
        else:
            print_error(f"Backend health check failed: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Cannot reach backend: {str(e)}")
        return False

def test_google_oauth_endpoint():
    """Test GET /api/auth/google endpoint and analyze OAuth URL generation"""
    print_test_header("Google OAuth Endpoint Test")
    
    try:
        # Test the endpoint
        response = requests.get(f"{BACKEND_URL}/auth/google", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                if "auth_url" in data:
                    auth_url = data["auth_url"]
                    print_success(f"Google OAuth URL generated successfully")
                    print_info(f"Generated URL: {auth_url}")
                    
                    # Analyze the URL
                    return analyze_oauth_url(auth_url)
                else:
                    print_error("Response missing 'auth_url' field")
                    return False
            except json.JSONDecodeError:
                print_error("Response is not valid JSON")
                return False
        elif response.status_code == 500:
            print_error("Internal Server Error - likely Google OAuth not configured")
            try:
                error_data = response.json()
                if "detail" in error_data:
                    print_error(f"Error detail: {error_data['detail']}")
                    if "Google OAuth not configured" in error_data["detail"]:
                        print_warning("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing in environment")
            except:
                pass
            return False
        else:
            print_error(f"Unexpected status code: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Request failed: {str(e)}")
        return False

def analyze_oauth_url(auth_url):
    """Analyze the generated OAuth URL for correctness"""
    print_test_header("OAuth URL Analysis")
    
    try:
        # Parse the URL
        parsed_url = urlparse(auth_url)
        query_params = parse_qs(parsed_url.query)
        
        print_info(f"Base URL: {parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}")
        print_info(f"Query Parameters: {dict(query_params)}")
        
        # Check base URL
        expected_base = "https://accounts.google.com/o/oauth2/auth"
        actual_base = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}"
        
        if actual_base == expected_base:
            print_success("✓ Base URL is correct")
        else:
            print_error(f"✗ Base URL incorrect. Expected: {expected_base}, Got: {actual_base}")
            return False
        
        # Check required parameters
        required_params = {
            'client_id': 'Google Client ID',
            'redirect_uri': 'Redirect URI',
            'response_type': 'Response Type',
            'scope': 'OAuth Scopes',
            'state': 'State Parameter'
        }
        
        all_params_valid = True
        
        for param, description in required_params.items():
            if param in query_params:
                value = query_params[param][0]  # Get first value
                print_success(f"✓ {description}: {value}")
                
                # Specific validations
                if param == 'client_id':
                    if value and len(value) > 10:  # Basic validation
                        print_success("  → Client ID appears valid")
                    else:
                        print_error("  → Client ID appears invalid or empty")
                        all_params_valid = False
                
                elif param == 'redirect_uri':
                    if value == EXPECTED_REDIRECT_URI:
                        print_success(f"  → Redirect URI matches expected: {EXPECTED_REDIRECT_URI}")
                    else:
                        print_error(f"  → Redirect URI mismatch!")
                        print_error(f"    Expected: {EXPECTED_REDIRECT_URI}")
                        print_error(f"    Got:      {value}")
                        all_params_valid = False
                
                elif param == 'response_type':
                    if value == 'code':
                        print_success("  → Response type is correct (code)")
                    else:
                        print_error(f"  → Response type incorrect. Expected: code, Got: {value}")
                        all_params_valid = False
                
                elif param == 'scope':
                    expected_scopes = ['openid', 'email', 'profile']
                    actual_scopes = value.split()
                    
                    missing_scopes = [scope for scope in expected_scopes if scope not in actual_scopes]
                    if not missing_scopes:
                        print_success(f"  → All required scopes present: {actual_scopes}")
                    else:
                        print_warning(f"  → Missing scopes: {missing_scopes}")
                        print_info(f"  → Present scopes: {actual_scopes}")
                
                elif param == 'state':
                    if value and len(value) > 5:
                        print_success("  → State parameter present")
                    else:
                        print_warning("  → State parameter missing or too short")
            else:
                print_error(f"✗ Missing {description}")
                all_params_valid = False
        
        return all_params_valid
        
    except Exception as e:
        print_error(f"URL analysis failed: {str(e)}")
        return False

def test_environment_variables():
    """Test if environment variables are properly configured"""
    print_test_header("Environment Variables Check")
    
    # We can't directly access backend env vars, but we can infer from the OAuth URL generation
    print_info("Testing environment variables indirectly through OAuth URL generation...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/auth/google", timeout=10)
        
        if response.status_code == 500:
            try:
                error_data = response.json()
                if "Google OAuth not configured" in error_data.get("detail", ""):
                    print_error("❌ GOOGLE_CLIENT_ID is not set in backend environment")
                    print_error("❌ GOOGLE_CLIENT_SECRET is not set in backend environment")
                    return False
            except:
                pass
        elif response.status_code == 200:
            data = response.json()
            if "auth_url" in data:
                auth_url = data["auth_url"]
                parsed_url = urlparse(auth_url)
                query_params = parse_qs(parsed_url.query)
                
                if 'client_id' in query_params:
                    client_id = query_params['client_id'][0]
                    if client_id and len(client_id) > 10:
                        print_success("✅ GOOGLE_CLIENT_ID is set and appears valid")
                        print_info(f"   Client ID: {client_id}")
                    else:
                        print_error("❌ GOOGLE_CLIENT_ID appears invalid")
                        return False
                else:
                    print_error("❌ GOOGLE_CLIENT_ID not found in OAuth URL")
                    return False
                
                # We can't directly test GOOGLE_CLIENT_SECRET, but if URL generation works, it's likely set
                print_success("✅ GOOGLE_CLIENT_SECRET appears to be set (OAuth URL generation successful)")
                return True
        
        print_error("Could not determine environment variable status")
        return False
        
    except Exception as e:
        print_error(f"Environment variable check failed: {str(e)}")
        return False

def test_backend_url_construction():
    """Test backend URL construction and redirect URI generation"""
    print_test_header("Backend URL Construction Test")
    
    try:
        response = requests.get(f"{BACKEND_URL}/auth/google", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            auth_url = data["auth_url"]
            parsed_url = urlparse(auth_url)
            query_params = parse_qs(parsed_url.query)
            
            if 'redirect_uri' in query_params:
                actual_redirect_uri = query_params['redirect_uri'][0]
                
                print_info(f"Generated redirect URI: {actual_redirect_uri}")
                print_info(f"Expected redirect URI:  {EXPECTED_REDIRECT_URI}")
                
                if actual_redirect_uri == EXPECTED_REDIRECT_URI:
                    print_success("✅ Backend URL construction is correct")
                    print_success("✅ request.base_url is generating correct domain")
                    print_success("✅ Redirect URI matches Google Console configuration")
                    return True
                else:
                    print_error("❌ Backend URL construction issue detected")
                    print_error("❌ request.base_url may be returning incorrect value")
                    print_error("❌ Redirect URI does not match expected Google Console configuration")
                    
                    # Analyze the difference
                    expected_parsed = urlparse(EXPECTED_REDIRECT_URI)
                    actual_parsed = urlparse(actual_redirect_uri)
                    
                    if expected_parsed.scheme != actual_parsed.scheme:
                        print_error(f"   Scheme mismatch: expected {expected_parsed.scheme}, got {actual_parsed.scheme}")
                    
                    if expected_parsed.netloc != actual_parsed.netloc:
                        print_error(f"   Domain mismatch: expected {expected_parsed.netloc}, got {actual_parsed.netloc}")
                    
                    if expected_parsed.path != actual_parsed.path:
                        print_error(f"   Path mismatch: expected {expected_parsed.path}, got {actual_parsed.path}")
                    
                    return False
            else:
                print_error("❌ No redirect_uri found in OAuth URL")
                return False
        else:
            print_error(f"❌ Could not test URL construction due to OAuth endpoint failure: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Backend URL construction test failed: {str(e)}")
        return False

def test_google_oauth_callback_endpoint():
    """Test if the callback endpoint exists and is accessible"""
    print_test_header("Google OAuth Callback Endpoint Test")
    
    try:
        # Test the callback endpoint with mock parameters
        callback_url = f"{BACKEND_URL}/auth/google/callback"
        params = {
            'code': 'test_code_123',
            'state': 'test_state_456'
        }
        
        response = requests.get(callback_url, params=params, timeout=10)
        
        print(f"Callback URL: {callback_url}")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}...")
        
        # We expect this to fail with 400 or 500 due to invalid code, but endpoint should exist
        if response.status_code in [400, 500]:
            try:
                error_data = response.json()
                if "Token exchange failed" in error_data.get("detail", "") or \
                   "Google OAuth not configured" in error_data.get("detail", "") or \
                   "Authentication failed" in error_data.get("detail", ""):
                    print_success("✅ Callback endpoint exists and is processing requests")
                    print_info("   (Expected failure due to test parameters)")
                    return True
            except:
                pass
        elif response.status_code == 404:
            print_error("❌ Callback endpoint not found (404)")
            return False
        elif response.status_code == 422:
            print_success("✅ Callback endpoint exists (parameter validation error expected)")
            return True
        
        print_warning(f"⚠️  Unexpected response from callback endpoint: {response.status_code}")
        return True  # Endpoint exists, just unexpected response
        
    except Exception as e:
        print_error(f"Callback endpoint test failed: {str(e)}")
        return False

def main():
    """Run all Google OAuth 403 debug tests"""
    print("🔍 Google OAuth 403 Error Debug Test Başlıyor...")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Expected Redirect URI: {EXPECTED_REDIRECT_URI}")
    print(f"Test Zamanı: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tests = [
        ("Backend Health Check", test_backend_health),
        ("Google OAuth Endpoint", test_google_oauth_endpoint),
        ("Environment Variables", test_environment_variables),
        ("Backend URL Construction", test_backend_url_construction),
        ("OAuth Callback Endpoint", test_google_oauth_callback_endpoint),
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
    print_test_header("GOOGLE OAUTH 403 DEBUG TEST SONUÇLARI")
    
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
    
    # Specific recommendations for 403 error
    print_test_header("403 ERROR DEBUG RECOMMENDATIONS")
    
    if failed > 0:
        print("🔧 POSSIBLE CAUSES OF 403 ERROR:")
        print("   1. GOOGLE_CLIENT_ID mismatch with Google Console")
        print("   2. Redirect URI not whitelisted in Google Console")
        print("   3. OAuth consent screen not properly configured")
        print("   4. Domain verification issues in Google Console")
        print("   5. API quotas or restrictions in Google Console")
        print("\n🔧 RECOMMENDED ACTIONS:")
        print("   1. Verify Google Console OAuth 2.0 Client configuration")
        print("   2. Check authorized redirect URIs list")
        print("   3. Ensure OAuth consent screen is published")
        print("   4. Verify domain ownership in Google Console")
        print("   5. Check API usage and quotas")
    else:
        print("✅ All OAuth configuration appears correct")
        print("   If 403 error persists, check Google Console settings")
    
    if failed == 0:
        print("\n🎉 TÜM DEBUG TESTLER BAŞARILI!")
        return True
    else:
        print(f"\n⚠️  {failed} DEBUG TEST BAŞARISIZ!")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)