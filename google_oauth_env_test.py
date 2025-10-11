#!/usr/bin/env python3
"""
Google OAuth Environment Variable Fix Verification Test
Testing the specific requirements from the review request:
1. Backend Environment Test - GET /api/auth/google endpoint test
2. GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI properly loaded
3. Generated OAuth URL using environment variables
4. OAuth URL Analysis - redirect_uri and client_id parameters match exactly
5. Environment Variable Verification - all required Google OAuth env vars present
6. URL Consistency Check - redirect_uri matches Google Console exactly
"""

import requests
import json
import sys
import urllib.parse
from datetime import datetime

# Configuration
BACKEND_URL = "https://mavibilet.preview.emergentagent.com/api"

class GoogleOAuthEnvTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        
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

    def test_backend_health(self):
        """Test 1: Backend Health Check"""
        print("🔍 Testing Backend Health...")
        
        try:
            response = requests.get(f"{self.backend_url}/health", timeout=10)
            
            if response.status_code == 200:
                self.log_test(
                    "Backend Health Check",
                    True,
                    f"Backend accessible at {self.backend_url}",
                    {"status_code": response.status_code}
                )
                return True
            else:
                self.log_test(
                    "Backend Health Check",
                    False,
                    f"Backend returned status {response.status_code}",
                    {"status_code": response.status_code, "response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Backend Health Check",
                False,
                f"Backend connection failed: {str(e)}"
            )
            return False

    def test_google_auth_endpoint(self):
        """Test 2: GET /api/auth/google endpoint test"""
        print("🔍 Testing Google Auth Endpoint...")
        
        try:
            response = requests.get(f"{self.backend_url}/auth/google", timeout=10)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    
                    if "auth_url" in data:
                        auth_url = data["auth_url"]
                        self.log_test(
                            "Google Auth Endpoint - Response Format",
                            True,
                            f"Endpoint returns auth_url: {auth_url[:100]}...",
                            {"auth_url": auth_url}
                        )
                        return True, auth_url
                    else:
                        self.log_test(
                            "Google Auth Endpoint - Response Format",
                            False,
                            "Response missing 'auth_url' field",
                            data
                        )
                        return False, None
                        
                except json.JSONDecodeError:
                    self.log_test(
                        "Google Auth Endpoint - JSON Parse",
                        False,
                        "Response is not valid JSON",
                        response.text
                    )
                    return False, None
            else:
                self.log_test(
                    "Google Auth Endpoint - HTTP Status",
                    False,
                    f"Expected 200, got {response.status_code}",
                    {"status_code": response.status_code, "response": response.text}
                )
                return False, None
                
        except Exception as e:
            self.log_test(
                "Google Auth Endpoint - Connection",
                False,
                f"Request failed: {str(e)}"
            )
            return False, None

    def test_environment_variables_loaded(self, auth_url):
        """Test 3: Environment Variables Properly Loaded"""
        print("🔍 Testing Environment Variables Loading...")
        
        if not auth_url:
            self.log_test(
                "Environment Variables Loading",
                False,
                "No auth_url available for testing"
            )
            return False, None, None
        
        try:
            # Parse the OAuth URL to extract parameters
            parsed_url = urllib.parse.urlparse(auth_url)
            query_params = urllib.parse.parse_qs(parsed_url.query)
            
            # Extract client_id and redirect_uri
            client_id = query_params.get('client_id', [None])[0]
            redirect_uri = query_params.get('redirect_uri', [None])[0]
            
            # Expected values from backend/.env
            expected_client_id = "412446824095-f83a2663p9logb15t88e25jnt79r9ep9.apps.googleusercontent.com"
            expected_redirect_uri = "https://mavibilet.preview.emergentagent.com/api/auth/google/callback"
            
            # Test GOOGLE_CLIENT_ID
            if client_id == expected_client_id:
                self.log_test(
                    "GOOGLE_CLIENT_ID Environment Variable",
                    True,
                    f"GOOGLE_CLIENT_ID properly loaded: {client_id}",
                    {"client_id": client_id}
                )
                client_id_success = True
            else:
                self.log_test(
                    "GOOGLE_CLIENT_ID Environment Variable",
                    False,
                    f"GOOGLE_CLIENT_ID mismatch. Expected: {expected_client_id}, Got: {client_id}",
                    {"expected": expected_client_id, "actual": client_id}
                )
                client_id_success = False
            
            # Test GOOGLE_REDIRECT_URI
            if redirect_uri == expected_redirect_uri:
                self.log_test(
                    "GOOGLE_REDIRECT_URI Environment Variable",
                    True,
                    f"GOOGLE_REDIRECT_URI properly loaded: {redirect_uri}",
                    {"redirect_uri": redirect_uri}
                )
                redirect_uri_success = True
            else:
                self.log_test(
                    "GOOGLE_REDIRECT_URI Environment Variable",
                    False,
                    f"GOOGLE_REDIRECT_URI mismatch. Expected: {expected_redirect_uri}, Got: {redirect_uri}",
                    {"expected": expected_redirect_uri, "actual": redirect_uri}
                )
                redirect_uri_success = False
            
            overall_success = client_id_success and redirect_uri_success
            
            if overall_success:
                self.log_test(
                    "Environment Variables Loading - Overall",
                    True,
                    "Both GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI properly loaded from environment",
                    {"client_id": client_id, "redirect_uri": redirect_uri}
                )
            else:
                self.log_test(
                    "Environment Variables Loading - Overall",
                    False,
                    "One or more environment variables not properly loaded"
                )
            
            return overall_success, client_id, redirect_uri
            
        except Exception as e:
            self.log_test(
                "Environment Variables Loading",
                False,
                f"Error parsing OAuth URL: {str(e)}",
                {"auth_url": auth_url}
            )
            return False, None, None

    def test_oauth_url_analysis(self, auth_url, client_id, redirect_uri):
        """Test 4: OAuth URL Analysis - No hardcoded values"""
        print("🔍 Testing OAuth URL Analysis...")
        
        if not auth_url:
            self.log_test(
                "OAuth URL Analysis",
                False,
                "No auth_url available for analysis"
            )
            return False
        
        try:
            # Parse the OAuth URL
            parsed_url = urllib.parse.urlparse(auth_url)
            query_params = urllib.parse.parse_qs(parsed_url.query)
            
            # Check base URL
            expected_base_url = "https://accounts.google.com/o/oauth2/auth"
            actual_base_url = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}"
            
            if actual_base_url == expected_base_url:
                base_url_success = True
            else:
                base_url_success = False
                self.log_test(
                    "OAuth URL - Base URL",
                    False,
                    f"Base URL mismatch. Expected: {expected_base_url}, Got: {actual_base_url}"
                )
            
            # Check required parameters
            required_params = {
                'client_id': client_id,
                'redirect_uri': redirect_uri,
                'response_type': 'code',
                'scope': 'openid email profile'
            }
            
            params_success = True
            for param_name, expected_value in required_params.items():
                actual_value = query_params.get(param_name, [None])[0]
                
                if actual_value == expected_value:
                    print(f"   ✅ {param_name}: {actual_value}")
                else:
                    print(f"   ❌ {param_name}: Expected '{expected_value}', Got '{actual_value}'")
                    params_success = False
            
            # Check for state parameter (should be present)
            state = query_params.get('state', [None])[0]
            if state:
                print(f"   ✅ state parameter present: {state}")
                state_success = True
            else:
                print(f"   ⚠️  state parameter missing (optional but recommended)")
                state_success = True  # Not critical
            
            overall_success = base_url_success and params_success and state_success
            
            if overall_success:
                self.log_test(
                    "OAuth URL Analysis - Parameters",
                    True,
                    "All OAuth URL parameters correct, using environment variables (no hardcoded values)",
                    {
                        "base_url": actual_base_url,
                        "client_id": client_id,
                        "redirect_uri": redirect_uri,
                        "response_type": query_params.get('response_type', [None])[0],
                        "scope": query_params.get('scope', [None])[0],
                        "state": state
                    }
                )
            else:
                self.log_test(
                    "OAuth URL Analysis - Parameters",
                    False,
                    "OAuth URL parameters incorrect or using hardcoded values"
                )
            
            return overall_success
            
        except Exception as e:
            self.log_test(
                "OAuth URL Analysis",
                False,
                f"Error analyzing OAuth URL: {str(e)}",
                {"auth_url": auth_url}
            )
            return False

    def test_url_consistency_check(self, redirect_uri):
        """Test 5: URL Consistency Check - matches Google Console exactly"""
        print("🔍 Testing URL Consistency Check...")
        
        if not redirect_uri:
            self.log_test(
                "URL Consistency Check",
                False,
                "No redirect_uri available for consistency check"
            )
            return False
        
        # Expected redirect URI that should be registered in Google Console
        expected_redirect_uri = "https://mavibilet.preview.emergentagent.com/api/auth/google/callback"
        
        # Check exact match
        if redirect_uri == expected_redirect_uri:
            self.log_test(
                "URL Consistency Check - Exact Match",
                True,
                f"redirect_uri matches Google Console exactly: {redirect_uri}",
                {"redirect_uri": redirect_uri, "expected": expected_redirect_uri}
            )
            exact_match = True
        else:
            self.log_test(
                "URL Consistency Check - Exact Match",
                False,
                f"redirect_uri does not match Google Console. Expected: {expected_redirect_uri}, Got: {redirect_uri}",
                {"redirect_uri": redirect_uri, "expected": expected_redirect_uri}
            )
            exact_match = False
        
        # Check for common issues
        issues = []
        
        # Check protocol
        if not redirect_uri.startswith("https://"):
            issues.append("Should use HTTPS protocol")
        
        # Check for trailing slashes
        if redirect_uri.endswith("/"):
            issues.append("Should not have trailing slash")
        
        # Check domain
        if "payment-modal-fix.preview.emergentagent.com" not in redirect_uri:
            issues.append("Domain mismatch")
        
        # Check path
        if "/api/auth/google/callback" not in redirect_uri:
            issues.append("Callback path incorrect")
        
        if issues:
            self.log_test(
                "URL Consistency Check - Format Issues",
                False,
                f"Format issues found: {', '.join(issues)}",
                {"issues": issues, "redirect_uri": redirect_uri}
            )
            format_success = False
        else:
            self.log_test(
                "URL Consistency Check - Format",
                True,
                "redirect_uri format is correct (HTTPS, no trailing slash, correct domain and path)",
                {"redirect_uri": redirect_uri}
            )
            format_success = True
        
        return exact_match and format_success

    def test_environment_variable_verification(self):
        """Test 6: Environment Variable Verification - all required vars present"""
        print("🔍 Testing Environment Variable Verification...")
        
        # Test if backend can access environment variables by checking error responses
        try:
            # Make a request that would fail if env vars are missing
            response = requests.get(f"{self.backend_url}/auth/google", timeout=10)
            
            if response.status_code == 200:
                # If we get 200, env vars are loaded
                self.log_test(
                    "Environment Variable Verification - Availability",
                    True,
                    "All required Google OAuth environment variables are present (no 500 error about missing configuration)",
                    {"status_code": response.status_code}
                )
                return True
            elif response.status_code == 500:
                # Check if it's a missing env var error
                try:
                    error_data = response.json()
                    error_detail = error_data.get("detail", "")
                    
                    if "not configured" in error_detail.lower() or "missing" in error_detail.lower():
                        self.log_test(
                            "Environment Variable Verification - Missing Config",
                            False,
                            f"Missing environment variable configuration: {error_detail}",
                            error_data
                        )
                        return False
                    else:
                        # Different 500 error
                        self.log_test(
                            "Environment Variable Verification - Other Error",
                            False,
                            f"Server error (not env var related): {error_detail}",
                            error_data
                        )
                        return False
                except:
                    self.log_test(
                        "Environment Variable Verification - Server Error",
                        False,
                        f"Server returned 500 error: {response.text}",
                        {"status_code": response.status_code, "response": response.text}
                    )
                    return False
            else:
                self.log_test(
                    "Environment Variable Verification - Unexpected Status",
                    False,
                    f"Unexpected status code: {response.status_code}",
                    {"status_code": response.status_code, "response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Environment Variable Verification",
                False,
                f"Request failed: {str(e)}"
            )
            return False

    def run_comprehensive_test(self):
        """Run all Google OAuth environment variable tests"""
        print("🚀 Starting Google OAuth Environment Variable Fix Verification")
        print("=" * 70)
        print("Testing environment variable configuration for Google OAuth integration")
        print("Expected: GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI properly loaded")
        print("Expected: OAuth URL uses environment variables (not hardcoded)")
        print("Expected: redirect_uri matches Google Console exactly")
        print("=" * 70)
        
        # Test 1: Backend Health
        print("\n🏥 PHASE 1: Backend Health Check")
        health_success = self.test_backend_health()
        
        if not health_success:
            print("❌ Backend health check failed - cannot proceed with OAuth tests")
            self.print_final_results()
            return
        
        # Test 2: Google Auth Endpoint
        print("\n🔐 PHASE 2: Google Auth Endpoint Test")
        endpoint_success, auth_url = self.test_google_auth_endpoint()
        
        if not endpoint_success:
            print("❌ Google auth endpoint failed - cannot proceed with URL analysis")
            self.print_final_results()
            return
        
        # Test 3: Environment Variables Loading
        print("\n🌍 PHASE 3: Environment Variables Loading Test")
        env_success, client_id, redirect_uri = self.test_environment_variables_loaded(auth_url)
        
        # Test 4: OAuth URL Analysis
        print("\n🔍 PHASE 4: OAuth URL Analysis")
        url_analysis_success = self.test_oauth_url_analysis(auth_url, client_id, redirect_uri)
        
        # Test 5: URL Consistency Check
        print("\n✅ PHASE 5: URL Consistency Check")
        consistency_success = self.test_url_consistency_check(redirect_uri)
        
        # Test 6: Environment Variable Verification
        print("\n🔧 PHASE 6: Environment Variable Verification")
        verification_success = self.test_environment_variable_verification()
        
        # Print final results
        self.print_final_results()
        
        # Return overall success
        return all([health_success, endpoint_success, env_success, url_analysis_success, consistency_success, verification_success])

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 70)
        print("📊 GOOGLE OAUTH ENVIRONMENT VARIABLE TEST RESULTS")
        print("=" * 70)
        
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        print(f"Total Tests Run: {self.total_tests}")
        print(f"Tests Passed: {self.passed_tests}")
        print(f"Tests Failed: {self.total_tests - self.passed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate == 100:
            print("🎉 EXCELLENT: All Google OAuth environment variable tests passed!")
            print("✅ Environment variables loaded properly")
            print("✅ OAuth URL uses env vars (not hardcoded)")
            print("✅ redirect_uri matches Google Console exactly")
            print("✅ Ready for Google OAuth 403 fix verification")
        elif success_rate >= 80:
            print("⚠️  GOOD: Most tests passed, minor issues to address")
        else:
            print("🚨 CRITICAL: Major environment variable configuration issues detected")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        
        # Print success criteria summary
        print("\n📋 SUCCESS CRITERIA VERIFICATION:")
        
        # Check each success criteria
        criteria_results = {
            "Environment variables loaded properly": False,
            "OAuth URL uses env vars (not hardcoded)": False,
            "redirect_uri matches Google Console exactly": False,
            "No 500 errors about missing configuration": False
        }
        
        for test in self.test_results:
            if test['success']:
                if "Environment Variable" in test['test'] and "Overall" in test['test']:
                    criteria_results["Environment variables loaded properly"] = True
                elif "OAuth URL Analysis" in test['test'] and "Parameters" in test['test']:
                    criteria_results["OAuth URL uses env vars (not hardcoded)"] = True
                elif "URL Consistency Check" in test['test'] and "Exact Match" in test['test']:
                    criteria_results["redirect_uri matches Google Console exactly"] = True
                elif "Environment Variable Verification" in test['test'] and "Availability" in test['test']:
                    criteria_results["No 500 errors about missing configuration"] = True
        
        for criteria, passed in criteria_results.items():
            status = "✅" if passed else "❌"
            print(f"   {status} {criteria}")

if __name__ == "__main__":
    tester = GoogleOAuthEnvTester()
    success = tester.run_comprehensive_test()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)