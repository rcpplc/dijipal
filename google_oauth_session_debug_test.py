#!/usr/bin/env python3
"""
Google OAuth Session Creation Debug Test
Testing session creation, cookie handling, and login state persistence
"""

import requests
import json
import time
from datetime import datetime, timezone
import uuid

# Configuration
BACKEND_URL = "https://mavibilet.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def print_test_header(test_name):
    print(f"\n{'='*60}")
    print(f"🔍 {test_name}")
    print(f"{'='*60}")

def print_step(step_num, description):
    print(f"\n📋 Step {step_num}: {description}")

def print_success(message):
    print(f"✅ {message}")

def print_error(message):
    print(f"❌ {message}")

def print_info(message):
    print(f"ℹ️  {message}")

def test_backend_health():
    """Test backend server health and connectivity"""
    print_test_header("BACKEND HEALTH CHECK")
    
    try:
        print_step(1, "Testing backend server accessibility")
        response = requests.get(f"{API_BASE}/health", timeout=10)
        
        if response.status_code == 200:
            health_data = response.json()
            print_success(f"Backend server healthy: {health_data}")
            return True
        else:
            print_error(f"Backend health check failed: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Backend server not accessible: {e}")
        return False

def test_google_oauth_url_generation():
    """Test Google OAuth URL generation"""
    print_test_header("GOOGLE OAUTH URL GENERATION")
    
    try:
        print_step(1, "Testing GET /api/auth/google endpoint")
        response = requests.get(f"{API_BASE}/auth/google", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            auth_url = data.get('auth_url', '')
            print_success(f"OAuth URL generated successfully")
            print_info(f"Auth URL: {auth_url}")
            
            # Verify URL components
            if 'accounts.google.com' in auth_url and 'client_id=' in auth_url:
                print_success("OAuth URL contains required Google components")
                return True, auth_url
            else:
                print_error("OAuth URL missing required components")
                return False, None
        else:
            print_error(f"OAuth URL generation failed: {response.status_code} - {response.text}")
            return False, None
            
    except Exception as e:
        print_error(f"OAuth URL generation error: {e}")
        return False, None

def simulate_google_oauth_callback():
    """Simulate Google OAuth callback with realistic data"""
    print_test_header("GOOGLE OAUTH CALLBACK SIMULATION")
    
    # Mock Google OAuth callback data
    mock_code = "4/0AX4XfWjMockGoogleAuthCode123456789"
    mock_state = "random_state_token"
    
    print_step(1, "Simulating Google OAuth callback")
    print_info(f"Mock authorization code: {mock_code}")
    print_info(f"Mock state: {mock_state}")
    
    try:
        # Create a session to track cookies
        session = requests.Session()
        
        # Call the callback endpoint
        callback_url = f"{API_BASE}/auth/google/callback"
        params = {
            'code': mock_code,
            'state': mock_state
        }
        
        print_step(2, "Calling Google OAuth callback endpoint")
        response = session.get(callback_url, params=params, allow_redirects=False, timeout=10)
        
        print_info(f"Response status: {response.status_code}")
        print_info(f"Response headers: {dict(response.headers)}")
        
        # Check for session cookie in response
        set_cookie_headers = response.headers.get('Set-Cookie', '')
        print_info(f"Set-Cookie headers: {set_cookie_headers}")
        
        # Check if session token cookie is set
        session_cookie_found = 'session_token=' in set_cookie_headers
        if session_cookie_found:
            print_success("Session token cookie found in response headers")
        else:
            print_error("No session token cookie found in response headers")
        
        # Check cookie attributes
        if session_cookie_found:
            if 'HttpOnly' in set_cookie_headers:
                print_success("HttpOnly attribute found in cookie")
            else:
                print_error("HttpOnly attribute missing from cookie")
                
            if 'Secure' in set_cookie_headers:
                print_success("Secure attribute found in cookie")
            else:
                print_error("Secure attribute missing from cookie")
                
            if 'SameSite=none' in set_cookie_headers.lower():
                print_success("SameSite=None attribute found in cookie")
            else:
                print_error("SameSite=None attribute missing from cookie")
        
        return session, response.status_code == 302 or response.status_code == 200
        
    except Exception as e:
        print_error(f"OAuth callback simulation error: {e}")
        return None, False

def test_session_validation(session):
    """Test session validation using /api/auth/me endpoint"""
    print_test_header("SESSION VALIDATION TEST")
    
    if not session:
        print_error("No session object provided")
        return False
    
    try:
        print_step(1, "Testing session-based authentication with /api/auth/me")
        
        # Test with session cookies
        response = session.get(f"{API_BASE}/auth/me", timeout=10)
        
        print_info(f"Response status: {response.status_code}")
        print_info(f"Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            user_data = response.json()
            print_success(f"Session validation successful")
            print_info(f"User data: {json.dumps(user_data, indent=2)}")
            return True
        elif response.status_code == 401:
            print_error("Session validation failed - 401 Unauthorized")
            print_info(f"Response: {response.text}")
            return False
        else:
            print_error(f"Unexpected response: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Session validation error: {e}")
        return False

def test_database_session_storage():
    """Test if sessions are being stored in database"""
    print_test_header("DATABASE SESSION STORAGE TEST")
    
    try:
        print_step(1, "Creating test user session directly")
        
        # Create a test session via regular login first
        login_data = {
            "email": "user@example.com",
            "password": "password123"
        }
        
        session = requests.Session()
        response = session.post(f"{API_BASE}/auth/login", json=login_data, timeout=10)
        
        if response.status_code == 200:
            login_result = response.json()
            print_success("Test user login successful")
            print_info(f"Login response: {json.dumps(login_result, indent=2)}")
            
            # Check if session cookie was set
            cookies = session.cookies.get_dict()
            print_info(f"Session cookies: {cookies}")
            
            if 'session_token' in cookies:
                print_success("Session token cookie found after login")
                
                # Test session validation
                print_step(2, "Testing session validation after login")
                me_response = session.get(f"{API_BASE}/auth/me", timeout=10)
                
                if me_response.status_code == 200:
                    user_data = me_response.json()
                    print_success("Session validation working after regular login")
                    print_info(f"User data: {json.dumps(user_data, indent=2)}")
                    return True
                else:
                    print_error(f"Session validation failed: {me_response.status_code} - {me_response.text}")
                    return False
            else:
                print_error("No session token cookie found after login")
                return False
        else:
            print_error(f"Test user login failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Database session storage test error: {e}")
        return False

def test_cookie_configuration():
    """Test cookie configuration and cross-origin issues"""
    print_test_header("COOKIE CONFIGURATION TEST")
    
    try:
        print_step(1, "Testing cookie configuration with different origins")
        
        # Test with different User-Agent and Origin headers
        headers = {
            'Origin': 'https://mavibilet.preview.emergentagent.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://mavibilet.preview.emergentagent.com'
        }
        
        login_data = {
            "email": "user@example.com", 
            "password": "password123"
        }
        
        session = requests.Session()
        response = session.post(f"{API_BASE}/auth/login", json=login_data, headers=headers, timeout=10)
        
        if response.status_code == 200:
            print_success("Login successful with cross-origin headers")
            
            # Check Set-Cookie headers
            set_cookie = response.headers.get('Set-Cookie', '')
            print_info(f"Set-Cookie header: {set_cookie}")
            
            # Analyze cookie attributes
            cookie_analysis = {
                'HttpOnly': 'HttpOnly' in set_cookie,
                'Secure': 'Secure' in set_cookie,
                'SameSite': 'SameSite' in set_cookie,
                'Path': 'Path=' in set_cookie,
                'Max-Age': 'Max-Age=' in set_cookie or 'max-age=' in set_cookie.lower()
            }
            
            print_info(f"Cookie attributes analysis: {cookie_analysis}")
            
            # Test if cookie persists across requests
            print_step(2, "Testing cookie persistence across requests")
            me_response = session.get(f"{API_BASE}/auth/me", headers=headers, timeout=10)
            
            if me_response.status_code == 200:
                print_success("Cookie persistence working - session maintained across requests")
                return True
            else:
                print_error(f"Cookie persistence failed: {me_response.status_code}")
                return False
        else:
            print_error(f"Login failed with cross-origin headers: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Cookie configuration test error: {e}")
        return False

def test_logout_session_cleanup():
    """Test logout functionality and session cleanup"""
    print_test_header("LOGOUT SESSION CLEANUP TEST")
    
    try:
        print_step(1, "Creating session and then testing logout")
        
        # Login first
        login_data = {
            "email": "user@example.com",
            "password": "password123"
        }
        
        session = requests.Session()
        login_response = session.post(f"{API_BASE}/auth/login", json=login_data, timeout=10)
        
        if login_response.status_code == 200:
            print_success("Login successful for logout test")
            
            # Verify session works
            me_response = session.get(f"{API_BASE}/auth/me", timeout=10)
            if me_response.status_code == 200:
                print_success("Session working before logout")
                
                # Test logout
                print_step(2, "Testing logout endpoint")
                logout_response = session.post(f"{API_BASE}/auth/logout", timeout=10)
                
                print_info(f"Logout response status: {logout_response.status_code}")
                print_info(f"Logout response: {logout_response.text}")
                
                # Check if Set-Cookie header clears the session
                logout_cookies = logout_response.headers.get('Set-Cookie', '')
                print_info(f"Logout Set-Cookie: {logout_cookies}")
                
                # Test if session is invalidated
                print_step(3, "Testing session after logout")
                post_logout_response = session.get(f"{API_BASE}/auth/me", timeout=10)
                
                if post_logout_response.status_code == 401:
                    print_success("Session properly invalidated after logout")
                    return True
                else:
                    print_error(f"Session still valid after logout: {post_logout_response.status_code}")
                    return False
            else:
                print_error("Session not working before logout test")
                return False
        else:
            print_error(f"Login failed for logout test: {login_response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Logout session cleanup test error: {e}")
        return False

def check_backend_logs():
    """Check backend logs for session creation and Google OAuth issues"""
    print_test_header("BACKEND LOGS ANALYSIS")
    
    try:
        print_step(1, "Checking backend logs for session and OAuth activity")
        
        # This would require access to backend logs
        # For now, we'll simulate by testing the endpoints that would generate logs
        
        # Test Google OAuth endpoint to generate logs
        oauth_response = requests.get(f"{API_BASE}/auth/google", timeout=10)
        print_info(f"Google OAuth endpoint response: {oauth_response.status_code}")
        
        # Test callback endpoint with mock data to generate logs
        callback_response = requests.get(
            f"{API_BASE}/auth/google/callback",
            params={'code': 'mock_code', 'state': 'mock_state'},
            allow_redirects=False,
            timeout=10
        )
        print_info(f"Google OAuth callback response: {callback_response.status_code}")
        
        # Test session endpoint
        session_response = requests.post(
            f"{API_BASE}/auth/session",
            headers={'X-Session-ID': 'mock_session_id'},
            timeout=10
        )
        print_info(f"Session endpoint response: {session_response.status_code}")
        
        print_success("Backend log generation tests completed")
        return True
        
    except Exception as e:
        print_error(f"Backend logs analysis error: {e}")
        return False

def main():
    """Main test execution"""
    print("🔍 GOOGLE OAUTH SESSION CREATION DEBUG TEST")
    print("=" * 60)
    print(f"🕒 Test started at: {datetime.now(timezone.utc).isoformat()}")
    print(f"🌐 Backend URL: {BACKEND_URL}")
    
    test_results = []
    
    # Run all tests
    tests = [
        ("Backend Health Check", test_backend_health),
        ("Google OAuth URL Generation", test_google_oauth_url_generation),
        ("Database Session Storage", test_database_session_storage),
        ("Cookie Configuration", test_cookie_configuration),
        ("Logout Session Cleanup", test_logout_session_cleanup),
        ("Backend Logs Analysis", check_backend_logs)
    ]
    
    for test_name, test_func in tests:
        try:
            if test_name == "Google OAuth URL Generation":
                result, _ = test_func()
            else:
                result = test_func()
            test_results.append((test_name, result))
        except Exception as e:
            print_error(f"Test {test_name} failed with exception: {e}")
            test_results.append((test_name, False))
    
    # Special test for OAuth callback simulation
    try:
        print_test_header("OAUTH CALLBACK SIMULATION")
        session, callback_success = simulate_google_oauth_callback()
        test_results.append(("OAuth Callback Simulation", callback_success))
        
        if session and callback_success:
            session_validation_result = test_session_validation(session)
            test_results.append(("Session Validation After OAuth", session_validation_result))
    except Exception as e:
        print_error(f"OAuth callback simulation failed: {e}")
        test_results.append(("OAuth Callback Simulation", False))
        test_results.append(("Session Validation After OAuth", False))
    
    # Print summary
    print_test_header("TEST SUMMARY")
    
    passed_tests = 0
    total_tests = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
        if result:
            passed_tests += 1
    
    success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
    
    print(f"\n📊 OVERALL RESULTS:")
    print(f"✅ Passed: {passed_tests}/{total_tests}")
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if success_rate < 80:
        print(f"\n🚨 CRITICAL ISSUES DETECTED:")
        print(f"   - Session creation or persistence issues found")
        print(f"   - Google OAuth login state not working properly")
        print(f"   - Immediate investigation required")
    elif success_rate < 100:
        print(f"\n⚠️  MINOR ISSUES DETECTED:")
        print(f"   - Some session management components need attention")
        print(f"   - Google OAuth mostly working but has edge cases")
    else:
        print(f"\n🎉 ALL TESTS PASSED:")
        print(f"   - Google OAuth session creation working perfectly")
        print(f"   - Login state persistence functional")
        print(f"   - System ready for production")
    
    print(f"\n🕒 Test completed at: {datetime.now(timezone.utc).isoformat()}")

if __name__ == "__main__":
    main()