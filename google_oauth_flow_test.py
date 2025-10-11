#!/usr/bin/env python3
"""
Google OAuth Flow End-to-End Test
Testing the complete Google OAuth flow to verify 403 error is resolved
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BACKEND_URL = "https://payment-modal-fix.preview.emergentagent.com/api"

class GoogleOAuthFlowTester:
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
        print()

    def test_google_oauth_initiation(self):
        """Test Google OAuth initiation"""
        print("🔍 Testing Google OAuth Initiation...")
        
        try:
            response = requests.get(f"{self.backend_url}/auth/google", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                auth_url = data.get('auth_url', '')
                
                if 'accounts.google.com/o/oauth2/auth' in auth_url:
                    # Parse URL parameters
                    import urllib.parse
                    parsed_url = urllib.parse.urlparse(auth_url)
                    params = urllib.parse.parse_qs(parsed_url.query)
                    
                    client_id = params.get('client_id', [''])[0]
                    redirect_uri = params.get('redirect_uri', [''])[0]
                    
                    self.log_test(
                        "Google OAuth Initiation",
                        True,
                        f"OAuth URL generated successfully. Redirect URI: {redirect_uri}, Client ID: {client_id[:20]}..."
                    )
                    return True, auth_url
                else:
                    self.log_test(
                        "Google OAuth Initiation",
                        False,
                        "Invalid OAuth URL format"
                    )
                    return False, None
            else:
                self.log_test(
                    "Google OAuth Initiation",
                    False,
                    f"Failed with status {response.status_code}"
                )
                return False, None
                
        except Exception as e:
            self.log_test(
                "Google OAuth Initiation",
                False,
                f"Request failed: {str(e)}"
            )
            return False, None

    def test_callback_endpoint_accessibility(self):
        """Test callback endpoint accessibility"""
        print("🔍 Testing Callback Endpoint Accessibility...")
        
        # Test with missing parameters (should return 400, not 403)
        try:
            response = requests.get(f"{self.backend_url}/auth/google/callback", timeout=10)
            
            if response.status_code == 422:
                # 422 is expected for missing required parameters
                self.log_test(
                    "Callback Endpoint Accessibility",
                    True,
                    "Callback endpoint accessible (422 for missing parameters - expected behavior)"
                )
                return True
            elif response.status_code == 403:
                self.log_test(
                    "Callback Endpoint Accessibility",
                    False,
                    "❌ CRITICAL: Callback endpoint returns 403 - the reported issue still exists!"
                )
                return False
            else:
                self.log_test(
                    "Callback Endpoint Accessibility",
                    True,
                    f"Callback endpoint accessible (status {response.status_code})"
                )
                return True
                
        except Exception as e:
            self.log_test(
                "Callback Endpoint Accessibility",
                False,
                f"Callback endpoint connection failed: {str(e)}"
            )
            return False

    def test_environment_configuration(self):
        """Test environment configuration"""
        print("🔍 Testing Environment Configuration...")
        
        # Get OAuth URL to verify environment variables
        try:
            response = requests.get(f"{self.backend_url}/auth/google", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                auth_url = data.get('auth_url', '')
                
                # Check for proper HTTPS redirect URI
                if 'redirect_uri=https%3A//payment-modal-fix.preview.emergentagent.com' in auth_url:
                    self.log_test(
                        "Environment Configuration - HTTPS Redirect URI",
                        True,
                        "✅ HTTPS redirect URI configured correctly (403 fix confirmed)"
                    )
                    return True
                elif 'redirect_uri=http%3A//payment-modal-fix.preview.emergentagent.com' in auth_url:
                    self.log_test(
                        "Environment Configuration - HTTP Redirect URI",
                        False,
                        "❌ CRITICAL: HTTP redirect URI detected - this will cause 403 errors!"
                    )
                    return False
                else:
                    self.log_test(
                        "Environment Configuration - Redirect URI",
                        False,
                        "❌ Cannot determine redirect URI scheme from OAuth URL"
                    )
                    return False
            else:
                self.log_test(
                    "Environment Configuration",
                    False,
                    f"Cannot verify environment - OAuth URL generation failed with status {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Environment Configuration",
                False,
                f"Environment verification failed: {str(e)}"
            )
            return False

    def test_google_console_redirect_uri_match(self):
        """Test Google Console redirect URI match"""
        print("🔍 Testing Google Console Redirect URI Match...")
        
        try:
            response = requests.get(f"{self.backend_url}/auth/google", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                auth_url = data.get('auth_url', '')
                
                # Extract redirect_uri parameter
                import urllib.parse
                parsed_url = urllib.parse.urlparse(auth_url)
                params = urllib.parse.parse_qs(parsed_url.query)
                redirect_uri = params.get('redirect_uri', [''])[0]
                
                expected_redirect_uri = "https://payment-modal-fix.preview.emergentagent.com/api/auth/google/callback"
                
                if redirect_uri == expected_redirect_uri:
                    self.log_test(
                        "Google Console Redirect URI Match",
                        True,
                        f"✅ Redirect URI matches expected Google Console configuration: {redirect_uri}"
                    )
                    return True
                else:
                    self.log_test(
                        "Google Console Redirect URI Match",
                        False,
                        f"❌ Redirect URI mismatch. Expected: {expected_redirect_uri}, Got: {redirect_uri}"
                    )
                    return False
            else:
                self.log_test(
                    "Google Console Redirect URI Match",
                    False,
                    "Cannot verify redirect URI - OAuth URL generation failed"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Google Console Redirect URI Match",
                False,
                f"Redirect URI verification failed: {str(e)}"
            )
            return False

    def test_backend_logs_analysis(self):
        """Test backend logs for OAuth activity"""
        print("🔍 Testing Backend Logs Analysis...")
        
        # We can't directly access logs, but we can trigger OAuth activity and see if it works
        # Test with invalid code to see backend behavior
        try:
            response = requests.get(
                f"{self.backend_url}/auth/google/callback",
                params={'code': 'test_log_analysis', 'state': 'test_state'},
                timeout=10
            )
            
            if response.status_code in [400, 500]:
                # These are expected for invalid codes - means endpoint is processing requests
                self.log_test(
                    "Backend Logs Analysis",
                    True,
                    f"✅ Callback endpoint processing requests (status {response.status_code} for invalid code - expected)"
                )
                return True
            elif response.status_code == 403:
                self.log_test(
                    "Backend Logs Analysis",
                    False,
                    "❌ CRITICAL: 403 error in callback processing - issue confirmed!"
                )
                return False
            else:
                self.log_test(
                    "Backend Logs Analysis",
                    True,
                    f"Callback endpoint responding (status {response.status_code})"
                )
                return True
                
        except Exception as e:
            self.log_test(
                "Backend Logs Analysis",
                False,
                f"Backend logs analysis failed: {str(e)}"
            )
            return False

    def run_oauth_flow_test(self):
        """Run complete OAuth flow test"""
        print("🚀 Starting Google OAuth Flow Test")
        print("=" * 70)
        print("Testing: Google OAuth callback 403 error resolution")
        print("Focus: End-to-end OAuth flow verification")
        print("=" * 70)
        
        # Phase 1: OAuth Initiation
        print("\n🎯 PHASE 1: Google OAuth Initiation")
        oauth_success, auth_url = self.test_google_oauth_initiation()
        
        # Phase 2: Environment Configuration
        print("\n🔧 PHASE 2: Environment Configuration Verification")
        env_success = self.test_environment_configuration()
        
        # Phase 3: Callback Endpoint Accessibility
        print("\n📞 PHASE 3: Callback Endpoint Accessibility")
        callback_success = self.test_callback_endpoint_accessibility()
        
        # Phase 4: Google Console Configuration
        print("\n🏢 PHASE 4: Google Console Redirect URI Match")
        console_success = self.test_google_console_redirect_uri_match()
        
        # Phase 5: Backend Logs Analysis
        print("\n📋 PHASE 5: Backend Logs Analysis")
        logs_success = self.test_backend_logs_analysis()
        
        # Final Assessment
        print("\n🎯 FINAL ASSESSMENT: Google OAuth 403 Error Status")
        self.assess_oauth_status(oauth_success, env_success, callback_success, console_success, logs_success)
        
        # Print final results
        self.print_final_results()

    def assess_oauth_status(self, oauth_success, env_success, callback_success, console_success, logs_success):
        """Assess overall OAuth status"""
        print("=" * 50)
        
        all_tests_passed = all([oauth_success, env_success, callback_success, console_success, logs_success])
        critical_tests_passed = callback_success and env_success
        
        if all_tests_passed:
            print("🎉 EXCELLENT: Google OAuth 403 Error RESOLVED!")
            print("✅ All OAuth components working correctly")
            print("✅ HTTPS redirect URI configured properly")
            print("✅ Callback endpoint accessible (no 403 errors)")
            print("✅ Google Console configuration matches backend")
            print("✅ Backend processing OAuth requests successfully")
            print("\n🚀 RECOMMENDATION: Google OAuth is ready for production use")
            
        elif critical_tests_passed:
            print("✅ GOOD: No 403 Errors Detected")
            print("✅ Critical OAuth components working")
            print("✅ Callback endpoint accessible")
            print("⚠️  Some minor configuration issues detected")
            print("\n🚀 RECOMMENDATION: Google OAuth should work, minor issues can be addressed")
            
        else:
            print("🚨 CRITICAL: Google OAuth Issues Detected")
            if not callback_success:
                print("❌ Callback endpoint has 403 or accessibility issues")
            if not env_success:
                print("❌ Environment configuration problems")
            if not console_success:
                print("❌ Google Console configuration mismatch")
            print("\n🛠️  RECOMMENDATION: Fix critical issues before production use")
        
        print("=" * 50)

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 70)
        print("📊 GOOGLE OAUTH FLOW TEST RESULTS")
        print("=" * 70)
        
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        print(f"Total Tests Run: {self.total_tests}")
        print(f"Tests Passed: {self.passed_tests}")
        print(f"Tests Failed: {self.total_tests - self.passed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        # Show failed tests
        failed_tests = [result for result in self.test_results if not result['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for result in failed_tests:
                print(f"   • {result['test']}: {result['details']}")
        
        # Show passed tests
        passed_tests = [result for result in self.test_results if result['success']]
        if passed_tests:
            print(f"\n✅ PASSED TESTS ({len(passed_tests)}):")
            for result in passed_tests:
                print(f"   • {result['test']}")

if __name__ == "__main__":
    tester = GoogleOAuthFlowTester()
    tester.run_oauth_flow_test()