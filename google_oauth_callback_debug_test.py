#!/usr/bin/env python3
"""
Google OAuth Callback 403 Error Debug Test
Testing Turkish review request: Google OAuth callback endpoint debug - 403 error investigation

Critical Google OAuth Callback Debug:
- Kullanıcı bildirimi: Google OAuth ilk aşamada çalışıyor, Google authentication tamamlanıyor, ama callback sonrası 403 hatası alınıyor.

Debug Points:
1. Callback Endpoint Test: GET /api/auth/google/callback endpoint çalışıyor mu?
2. Backend Logs Analysis: Callback endpoint'ine request geliyor mu?
3. Environment Variables: GOOGLE_CLIENT_SECRET doğru mu?
4. Token Exchange Process: Google token exchange API call başarılı mı?
5. Response Analysis: Backend hangi response dönüyor?
"""

import requests
import json
import sys
import os
from datetime import datetime

# Configuration
BACKEND_URL = "https://mavibilet.preview.emergentagent.com/api"

class GoogleOAuthCallbackDebugger:
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
        if response_data and not success:
            print(f"   Response: {json.dumps(response_data, indent=2)[:500]}...")
        print()

    def test_backend_health(self):
        """Test 1: Backend Health Check"""
        print("🔍 Testing Backend Health...")
        
        try:
            response = requests.get(f"{self.backend_url}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "Backend Health Check",
                    True,
                    f"Backend is healthy and accessible. Status: {data.get('status', 'unknown')}",
                    data
                )
                return True
            else:
                self.log_test(
                    "Backend Health Check",
                    False,
                    f"Backend returned status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Backend Health Check",
                False,
                f"Backend connection failed: {str(e)}"
            )
            return False

    def test_google_oauth_url_generation(self):
        """Test 2: Google OAuth URL Generation"""
        print("🔍 Testing Google OAuth URL Generation...")
        
        try:
            response = requests.get(f"{self.backend_url}/auth/google", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                auth_url = data.get('auth_url', '')
                
                # Analyze the OAuth URL
                if 'accounts.google.com/o/oauth2/auth' in auth_url:
                    # Extract parameters from URL
                    import urllib.parse
                    parsed_url = urllib.parse.urlparse(auth_url)
                    params = urllib.parse.parse_qs(parsed_url.query)
                    
                    client_id = params.get('client_id', [''])[0]
                    redirect_uri = params.get('redirect_uri', [''])[0]
                    response_type = params.get('response_type', [''])[0]
                    scope = params.get('scope', [''])[0]
                    state = params.get('state', [''])[0]
                    
                    analysis = {
                        "auth_url": auth_url,
                        "client_id": client_id,
                        "redirect_uri": redirect_uri,
                        "response_type": response_type,
                        "scope": scope,
                        "state": state
                    }
                    
                    # Check for HTTPS in redirect_uri (critical for 403 fix)
                    if redirect_uri.startswith('https://'):
                        https_status = "✅ HTTPS redirect URI (correct)"
                    else:
                        https_status = "❌ HTTP redirect URI (will cause 403 error)"
                    
                    self.log_test(
                        "Google OAuth URL Generation",
                        True,
                        f"OAuth URL generated successfully. {https_status}. Client ID: {client_id[:20]}..., Redirect URI: {redirect_uri}",
                        analysis
                    )
                    return True, analysis
                else:
                    self.log_test(
                        "Google OAuth URL Generation",
                        False,
                        "Invalid OAuth URL format - does not contain Google OAuth endpoint",
                        data
                    )
                    return False, None
            else:
                self.log_test(
                    "Google OAuth URL Generation",
                    False,
                    f"OAuth URL generation failed with status {response.status_code}",
                    response.text
                )
                return False, None
                
        except Exception as e:
            self.log_test(
                "Google OAuth URL Generation",
                False,
                f"OAuth URL generation request failed: {str(e)}"
            )
            return False, None

    def test_callback_endpoint_with_mock_data(self):
        """Test 3: Callback Endpoint with Mock Parameters"""
        print("🔍 Testing Callback Endpoint with Mock Parameters...")
        
        # Test with mock parameters as requested
        mock_params = {
            'code': 'test_code_mock_12345',
            'state': 'test_state_mock_67890'
        }
        
        try:
            response = requests.get(
                f"{self.backend_url}/auth/google/callback",
                params=mock_params,
                timeout=30
            )
            
            status_code = response.status_code
            
            # Analyze the response
            if status_code == 403:
                self.log_test(
                    "Callback Endpoint - 403 Error Analysis",
                    False,
                    "❌ CRITICAL: Callback endpoint returns 403 Forbidden - this is the reported issue!",
                    {
                        "status_code": status_code,
                        "response_text": response.text[:500],
                        "headers": dict(response.headers)
                    }
                )
                return False, "403_error"
            elif status_code == 400:
                # 400 is expected with mock data (invalid code)
                try:
                    error_data = response.json()
                    self.log_test(
                        "Callback Endpoint - Mock Data Test",
                        True,
                        "✅ Callback endpoint accessible (400 expected with mock data). Endpoint is working, not returning 403.",
                        {
                            "status_code": status_code,
                            "error_data": error_data
                        }
                    )
                    return True, "accessible"
                except:
                    self.log_test(
                        "Callback Endpoint - Mock Data Test",
                        True,
                        "✅ Callback endpoint accessible (400 expected with mock data). Endpoint is working, not returning 403.",
                        {
                            "status_code": status_code,
                            "response_text": response.text[:200]
                        }
                    )
                    return True, "accessible"
            elif status_code == 500:
                # 500 might indicate token exchange failure
                self.log_test(
                    "Callback Endpoint - Server Error",
                    False,
                    "❌ Callback endpoint returns 500 Internal Server Error - token exchange or processing issue",
                    {
                        "status_code": status_code,
                        "response_text": response.text[:500]
                    }
                )
                return False, "server_error"
            else:
                # Unexpected status code
                self.log_test(
                    "Callback Endpoint - Unexpected Response",
                    False,
                    f"❌ Callback endpoint returns unexpected status {status_code}",
                    {
                        "status_code": status_code,
                        "response_text": response.text[:500]
                    }
                )
                return False, "unexpected"
                
        except Exception as e:
            self.log_test(
                "Callback Endpoint - Connection Test",
                False,
                f"Callback endpoint connection failed: {str(e)}"
            )
            return False, "connection_error"

    def test_environment_variables_verification(self):
        """Test 4: Environment Variables Verification"""
        print("🔍 Testing Environment Variables Configuration...")
        
        # We can't directly access backend environment variables, but we can infer from OAuth URL
        oauth_success, oauth_analysis = self.test_google_oauth_url_generation()
        
        if oauth_success and oauth_analysis:
            client_id = oauth_analysis.get('client_id', '')
            redirect_uri = oauth_analysis.get('redirect_uri', '')
            
            # Check if environment variables are properly loaded
            env_issues = []
            
            if not client_id or len(client_id) < 20:
                env_issues.append("GOOGLE_CLIENT_ID appears to be missing or invalid")
            
            if not redirect_uri or not redirect_uri.startswith('https://'):
                env_issues.append("GOOGLE_REDIRECT_URI appears to be missing or not using HTTPS")
            
            if 'payment-modal-fix.preview.emergentagent.com' not in redirect_uri:
                env_issues.append("GOOGLE_REDIRECT_URI does not match expected domain")
            
            if env_issues:
                self.log_test(
                    "Environment Variables Verification",
                    False,
                    f"Environment variable issues detected: {'; '.join(env_issues)}",
                    oauth_analysis
                )
                return False
            else:
                self.log_test(
                    "Environment Variables Verification",
                    True,
                    f"Environment variables appear to be properly configured. Client ID: {client_id[:20]}..., Redirect URI: {redirect_uri}",
                    oauth_analysis
                )
                return True
        else:
            self.log_test(
                "Environment Variables Verification",
                False,
                "Cannot verify environment variables - OAuth URL generation failed"
            )
            return False

    def test_redirect_uri_analysis(self):
        """Test 5: Redirect URI Analysis (Critical for 403 Fix)"""
        print("🔍 Testing Redirect URI Configuration Analysis...")
        
        oauth_success, oauth_analysis = self.test_google_oauth_url_generation()
        
        if oauth_success and oauth_analysis:
            redirect_uri = oauth_analysis.get('redirect_uri', '')
            
            # Detailed redirect URI analysis
            analysis_results = {
                "redirect_uri": redirect_uri,
                "uses_https": redirect_uri.startswith('https://'),
                "correct_domain": 'payment-modal-fix.preview.emergentagent.com' in redirect_uri,
                "correct_path": '/api/auth/google/callback' in redirect_uri,
                "no_trailing_slash": not redirect_uri.endswith('/'),
                "url_encoded_properly": '%' not in redirect_uri or redirect_uri.count('%') < 3
            }
            
            # Check for common 403 causes
            issues = []
            if not analysis_results["uses_https"]:
                issues.append("❌ CRITICAL: Using HTTP instead of HTTPS (will cause 403)")
            if not analysis_results["correct_domain"]:
                issues.append("❌ CRITICAL: Domain mismatch with Google Console configuration")
            if not analysis_results["correct_path"]:
                issues.append("❌ CRITICAL: Callback path incorrect")
            
            if issues:
                self.log_test(
                    "Redirect URI Analysis - 403 Root Cause",
                    False,
                    f"Redirect URI issues found: {'; '.join(issues)}",
                    analysis_results
                )
                return False, issues
            else:
                self.log_test(
                    "Redirect URI Analysis - 403 Root Cause",
                    True,
                    f"✅ Redirect URI configuration appears correct: {redirect_uri}",
                    analysis_results
                )
                return True, []
        else:
            self.log_test(
                "Redirect URI Analysis",
                False,
                "Cannot analyze redirect URI - OAuth URL generation failed"
            )
            return False, ["OAuth URL generation failed"]

    def test_google_console_compatibility(self):
        """Test 6: Google Console Compatibility Check"""
        print("🔍 Testing Google Console Compatibility...")
        
        oauth_success, oauth_analysis = self.test_google_oauth_url_generation()
        
        if oauth_success and oauth_analysis:
            redirect_uri = oauth_analysis.get('redirect_uri', '')
            client_id = oauth_analysis.get('client_id', '')
            
            # Expected configuration based on environment
            expected_redirect_uri = "https://mavibilet.preview.emergentagent.com/api/auth/google/callback"
            expected_client_id_format = client_id.endswith('.apps.googleusercontent.com')
            
            compatibility_check = {
                "redirect_uri_matches_expected": redirect_uri == expected_redirect_uri,
                "client_id_format_valid": expected_client_id_format,
                "redirect_uri_actual": redirect_uri,
                "redirect_uri_expected": expected_redirect_uri,
                "client_id": client_id
            }
            
            if compatibility_check["redirect_uri_matches_expected"] and compatibility_check["client_id_format_valid"]:
                self.log_test(
                    "Google Console Compatibility",
                    True,
                    f"✅ Configuration matches expected Google Console setup. Redirect URI: {redirect_uri}",
                    compatibility_check
                )
                return True
            else:
                issues = []
                if not compatibility_check["redirect_uri_matches_expected"]:
                    issues.append(f"Redirect URI mismatch: got '{redirect_uri}', expected '{expected_redirect_uri}'")
                if not compatibility_check["client_id_format_valid"]:
                    issues.append(f"Client ID format invalid: {client_id}")
                
                self.log_test(
                    "Google Console Compatibility",
                    False,
                    f"Configuration issues: {'; '.join(issues)}",
                    compatibility_check
                )
                return False
        else:
            self.log_test(
                "Google Console Compatibility",
                False,
                "Cannot check Google Console compatibility - OAuth URL generation failed"
            )
            return False

    def test_token_exchange_simulation(self):
        """Test 7: Token Exchange Process Simulation"""
        print("🔍 Testing Token Exchange Process (Simulation)...")
        
        # We can't actually test token exchange without valid Google tokens,
        # but we can test the endpoint behavior
        
        # Test with various invalid codes to see how the endpoint behaves
        test_cases = [
            {"code": "invalid_code_123", "state": "test_state", "expected": "400 or 500"},
            {"code": "", "state": "test_state", "expected": "400"},
            {"state": "test_state", "expected": "400"},  # Missing code
        ]
        
        results = []
        for i, test_case in enumerate(test_cases, 1):
            try:
                params = {k: v for k, v in test_case.items() if k not in ['expected']}
                response = requests.get(
                    f"{self.backend_url}/auth/google/callback",
                    params=params,
                    timeout=15
                )
                
                result = {
                    "test_case": i,
                    "params": params,
                    "status_code": response.status_code,
                    "expected": test_case["expected"],
                    "response_preview": response.text[:200]
                }
                results.append(result)
                
                print(f"   Test Case {i}: {params} → Status {response.status_code}")
                
            except Exception as e:
                result = {
                    "test_case": i,
                    "params": params,
                    "error": str(e),
                    "expected": test_case["expected"]
                }
                results.append(result)
                print(f"   Test Case {i}: {params} → Error: {str(e)}")
        
        # Analyze results
        has_403_errors = any(r.get('status_code') == 403 for r in results)
        has_connection_errors = any('error' in r for r in results)
        
        if has_403_errors:
            self.log_test(
                "Token Exchange Process Simulation",
                False,
                "❌ CRITICAL: Token exchange endpoint returns 403 errors - this confirms the reported issue",
                results
            )
            return False
        elif has_connection_errors:
            self.log_test(
                "Token Exchange Process Simulation",
                False,
                "❌ Token exchange endpoint has connection issues",
                results
            )
            return False
        else:
            self.log_test(
                "Token Exchange Process Simulation",
                True,
                "✅ Token exchange endpoint accessible (returns 400/500 for invalid codes as expected, no 403 errors)",
                results
            )
            return True

    def run_comprehensive_debug(self):
        """Run comprehensive Google OAuth callback 403 debug"""
        print("🚀 Starting Google OAuth Callback 403 Error Debug")
        print("=" * 70)
        print("Investigating: Google OAuth callback sonrası 403 hatası")
        print("Focus: /api/auth/google/callback endpoint debug")
        print("=" * 70)
        
        # Phase 1: Backend Health
        print("\n🏥 PHASE 1: Backend Health Check")
        backend_healthy = self.test_backend_health()
        
        if not backend_healthy:
            print("❌ Backend is not accessible - cannot proceed with OAuth debug")
            self.print_final_results()
            return
        
        # Phase 2: Environment Variables
        print("\n🔧 PHASE 2: Environment Variables Verification")
        env_ok = self.test_environment_variables_verification()
        
        # Phase 3: OAuth URL Generation
        print("\n🔗 PHASE 3: Google OAuth URL Generation Analysis")
        oauth_success, oauth_analysis = self.test_google_oauth_url_generation()
        
        # Phase 4: Redirect URI Analysis (Critical for 403)
        print("\n🎯 PHASE 4: Redirect URI Analysis (403 Root Cause Investigation)")
        redirect_ok, redirect_issues = self.test_redirect_uri_analysis()
        
        # Phase 5: Callback Endpoint Test
        print("\n📞 PHASE 5: Callback Endpoint Test with Mock Parameters")
        callback_success, callback_status = self.test_callback_endpoint_with_mock_data()
        
        # Phase 6: Google Console Compatibility
        print("\n🏢 PHASE 6: Google Console Compatibility Check")
        console_ok = self.test_google_console_compatibility()
        
        # Phase 7: Token Exchange Simulation
        print("\n🔄 PHASE 7: Token Exchange Process Simulation")
        token_exchange_ok = self.test_token_exchange_simulation()
        
        # Final Analysis
        print("\n🔍 FINAL ANALYSIS: 403 Error Root Cause")
        self.analyze_403_root_cause(callback_status, redirect_issues, env_ok, console_ok)
        
        # Print final results
        self.print_final_results()

    def analyze_403_root_cause(self, callback_status, redirect_issues, env_ok, console_ok):
        """Analyze the root cause of 403 errors"""
        print("=" * 50)
        
        if callback_status == "403_error":
            print("🚨 CONFIRMED: 403 Error Detected in Callback Endpoint")
            print("\n🔍 ROOT CAUSE ANALYSIS:")
            
            if redirect_issues:
                print("❌ LIKELY CAUSE: Redirect URI Configuration Issues")
                for issue in redirect_issues:
                    print(f"   • {issue}")
            elif not env_ok:
                print("❌ LIKELY CAUSE: Environment Variables Configuration")
                print("   • GOOGLE_CLIENT_SECRET or GOOGLE_REDIRECT_URI may be incorrect")
            elif not console_ok:
                print("❌ LIKELY CAUSE: Google Console Configuration Mismatch")
                print("   • Redirect URI not whitelisted in Google Cloud Console")
            else:
                print("❓ UNKNOWN CAUSE: All configurations appear correct")
                print("   • May require deeper investigation of Google Console settings")
                print("   • Check if OAuth consent screen is properly configured")
                print("   • Verify domain verification in Google Console")
            
            print("\n🛠️  RECOMMENDED FIXES:")
            print("   1. Verify GOOGLE_REDIRECT_URI uses HTTPS")
            print("   2. Check Google Cloud Console OAuth 2.0 credentials")
            print("   3. Ensure redirect URI is exactly whitelisted in Google Console")
            print("   4. Verify OAuth consent screen configuration")
            
        elif callback_status == "accessible":
            print("✅ GOOD NEWS: No 403 Error Detected")
            print("   • Callback endpoint is accessible and working")
            print("   • The 403 error may have been resolved")
            print("   • Or the issue occurs only with real Google OAuth flow")
            
        elif callback_status == "server_error":
            print("⚠️  SERVER ERROR: 500 Internal Server Error")
            print("   • Callback endpoint accessible but has processing issues")
            print("   • May be related to token exchange or user creation")
            print("   • Check backend logs for detailed error information")
            
        else:
            print("❓ INCONCLUSIVE: Unable to determine 403 error status")
            print("   • Callback endpoint may have connection issues")
            print("   • Requires manual testing with actual Google OAuth flow")
        
        print("=" * 50)

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 70)
        print("📊 GOOGLE OAUTH CALLBACK DEBUG RESULTS")
        print("=" * 70)
        
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        print(f"Total Tests Run: {self.total_tests}")
        print(f"Tests Passed: {self.passed_tests}")
        print(f"Tests Failed: {self.total_tests - self.passed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        # Categorize results
        critical_failures = []
        warnings = []
        successes = []
        
        for result in self.test_results:
            if not result['success']:
                if '403' in result['details'] or 'CRITICAL' in result['details']:
                    critical_failures.append(result)
                else:
                    warnings.append(result)
            else:
                successes.append(result)
        
        if critical_failures:
            print(f"\n🚨 CRITICAL ISSUES ({len(critical_failures)}):")
            for result in critical_failures:
                print(f"   • {result['test']}: {result['details']}")
        
        if warnings:
            print(f"\n⚠️  WARNINGS ({len(warnings)}):")
            for result in warnings:
                print(f"   • {result['test']}: {result['details']}")
        
        if successes:
            print(f"\n✅ WORKING COMPONENTS ({len(successes)}):")
            for result in successes[:5]:  # Show first 5
                print(f"   • {result['test']}")
            if len(successes) > 5:
                print(f"   • ... and {len(successes) - 5} more")
        
        # Overall assessment
        print(f"\n🎯 OVERALL ASSESSMENT:")
        if len(critical_failures) > 0:
            print("🚨 CRITICAL: 403 error confirmed - immediate action required")
        elif len(warnings) > 2:
            print("⚠️  MODERATE: Some issues detected - investigation recommended")
        else:
            print("✅ GOOD: No critical 403 errors detected - OAuth may be working")

if __name__ == "__main__":
    debugger = GoogleOAuthCallbackDebugger()
    debugger.run_comprehensive_debug()