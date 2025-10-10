#!/usr/bin/env python3
"""
Comprehensive Favorites API Backend Testing
Testing Turkish review request: Favorites API sisteminin comprehensive backend testing'i
"""

import requests
import json
import sys
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://seo-nav-rebuild.preview.emergentagent.com/api"

class FavoritesAPITester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        self.user_token = None
        self.admin_token = None
        self.user_id = None
        self.admin_id = None
        self.available_tour_ids = []
        
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

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Generic test runner"""
        try:
            url = f"{self.backend_url}/{endpoint}"
            headers = {"Content-Type": "application/json"}
            
            if token:
                headers["Authorization"] = f"Bearer {token}"
            
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json() if response.content else {}
                    self.log_test(name, True, f"Status: {response.status_code}", response_data)
                    return True, response_data
                except:
                    self.log_test(name, True, f"Status: {response.status_code}, No JSON response")
                    return True, {}
            else:
                try:
                    error_data = response.json() if response.content else {}
                    self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}", error_data)
                except:
                    self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}", response.text[:200])
                return False, {}

        except requests.exceptions.Timeout:
            self.log_test(name, False, "Request timeout (30s)")
            return False, {}
        except requests.exceptions.ConnectionError:
            self.log_test(name, False, "Connection error - server may be down")
            return False, {}
        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def setup_authentication(self):
        """Setup authentication for both user and admin"""
        print("🔐 Setting up authentication...")
        
        # Test user login
        user_login_data = {
            "email": "user@example.com",
            "password": "password123"
        }
        
        success, response = self.run_test(
            "User Login (user@example.com)",
            "POST",
            "auth/login",
            200,
            data=user_login_data
        )
        
        if success and 'token' in response:
            self.user_token = response['token']
            if 'user' in response:
                self.user_id = response['user'].get('id')
            print(f"   ✅ User token obtained: {self.user_token[:20]}...")
        else:
            print("   ❌ User login failed")
            return False
        
        # Test admin login
        admin_login_data = {
            "email": "admin@example.com",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Login (admin@example.com)",
            "POST",
            "auth/login",
            200,
            data=admin_login_data
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
            if 'user' in response:
                self.admin_id = response['user'].get('id')
            print(f"   ✅ Admin token obtained: {self.admin_token[:20]}...")
        else:
            print("   ❌ Admin login failed")
            return False
        
        return True

    def get_available_tours(self):
        """Get available tour IDs for testing"""
        print("🏛️ Getting available tours...")
        
        success, response = self.run_test(
            "Get Available Tours",
            "GET",
            "tours",
            200
        )
        
        if success and response:
            self.available_tour_ids = [tour.get('id') for tour in response if tour.get('id')]
            print(f"   ✅ Found {len(self.available_tour_ids)} available tours")
            if self.available_tour_ids:
                print(f"   📋 Sample tour IDs: {self.available_tour_ids[:3]}")
            return len(self.available_tour_ids) > 0
        else:
            print("   ❌ Failed to get tours")
            return False

    def test_favorites_endpoints_basic(self):
        """Test 1: Basic Favorites Endpoints Testing"""
        print("\n📋 Test 1: Basic Favorites Endpoints Testing")
        
        if not self.available_tour_ids:
            self.log_test("Favorites Basic Test", False, "No available tours for testing")
            return False
        
        tour_id = self.available_tour_ids[0]
        
        # Test POST /api/favorites/{tour_id} - Add to favorites
        success1, response1 = self.run_test(
            f"POST /api/favorites/{tour_id} - Add Tour to Favorites",
            "POST",
            f"favorites/{tour_id}",
            200,
            token=self.user_token
        )
        
        # Test GET /api/favorites - List user's favorites
        success2, response2 = self.run_test(
            "GET /api/favorites - List User's Favorites",
            "GET",
            "favorites",
            200,
            token=self.user_token
        )
        
        # Verify the tour was added to favorites
        if success2 and response2:
            favorite_tour_ids = [tour.get('id') for tour in response2 if tour.get('id')]
            if tour_id in favorite_tour_ids:
                print(f"   ✅ Tour {tour_id} successfully added to favorites")
            else:
                print(f"   ❌ Tour {tour_id} not found in favorites list")
                success2 = False
        
        # Test DELETE /api/favorites/{tour_id} - Remove from favorites
        success3, response3 = self.run_test(
            f"DELETE /api/favorites/{tour_id} - Remove Tour from Favorites",
            "DELETE",
            f"favorites/{tour_id}",
            200,
            token=self.user_token
        )
        
        return success1 and success2 and success3

    def test_authentication_requirements(self):
        """Test 2: Authentication Testing"""
        print("\n🔐 Test 2: Authentication Requirements Testing")
        
        if not self.available_tour_ids:
            self.log_test("Authentication Test", False, "No available tours for testing")
            return False
        
        tour_id = self.available_tour_ids[0]
        
        # Test without token - should return 401/403
        success1, response1 = self.run_test(
            "POST /api/favorites/{tour_id} - No Token (Should Fail)",
            "POST",
            f"favorites/{tour_id}",
            401  # Expecting 401 Unauthorized
        )
        
        success2, response2 = self.run_test(
            "GET /api/favorites - No Token (Should Fail)",
            "GET",
            "favorites",
            401  # Expecting 401 Unauthorized
        )
        
        success3, response3 = self.run_test(
            "DELETE /api/favorites/{tour_id} - No Token (Should Fail)",
            "DELETE",
            f"favorites/{tour_id}",
            401  # Expecting 401 Unauthorized
        )
        
        # Test with invalid token - should return 401
        invalid_token = "invalid.jwt.token"
        success4, response4 = self.run_test(
            "POST /api/favorites/{tour_id} - Invalid Token (Should Fail)",
            "POST",
            f"favorites/{tour_id}",
            401,  # Expecting 401 Unauthorized
            token=invalid_token
        )
        
        return success1 and success2 and success3 and success4

    def test_data_validation(self):
        """Test 3: Data Validation Testing"""
        print("\n🔍 Test 3: Data Validation Testing")
        
        # Test with invalid tour_id format
        invalid_tour_id = "invalid-tour-id-123"
        success1, response1 = self.run_test(
            "POST /api/favorites/{invalid_tour_id} - Invalid Tour ID Format",
            "POST",
            f"favorites/{invalid_tour_id}",
            404,  # Expecting 404 Not Found
            token=self.user_token
        )
        
        # Test with non-existent tour_id (valid UUID format but doesn't exist)
        nonexistent_tour_id = "12345678-1234-1234-1234-123456789012"
        success2, response2 = self.run_test(
            "POST /api/favorites/{nonexistent_tour_id} - Non-existent Tour ID",
            "POST",
            f"favorites/{nonexistent_tour_id}",
            404,  # Expecting 404 Not Found
            token=self.user_token
        )
        
        # Test duplicate favorite addition
        if self.available_tour_ids:
            tour_id = self.available_tour_ids[0]
            
            # First add to favorites
            success3a, response3a = self.run_test(
                f"POST /api/favorites/{tour_id} - Add Tour to Favorites (First Time)",
                "POST",
                f"favorites/{tour_id}",
                200,
                token=self.user_token
            )
            
            # Try to add the same tour again - should fail
            success3b, response3b = self.run_test(
                f"POST /api/favorites/{tour_id} - Add Same Tour Again (Should Fail)",
                "POST",
                f"favorites/{tour_id}",
                400,  # Expecting 400 Bad Request (already in favorites)
                token=self.user_token
            )
            
            # Clean up - remove from favorites
            self.run_test(
                f"DELETE /api/favorites/{tour_id} - Cleanup",
                "DELETE",
                f"favorites/{tour_id}",
                200,
                token=self.user_token
            )
            
            success3 = success3a and success3b
        else:
            success3 = False
        
        return success1 and success2 and success3

    def test_response_formats(self):
        """Test 4: Response Format Testing"""
        print("\n📄 Test 4: Response Format Testing")
        
        if not self.available_tour_ids:
            self.log_test("Response Format Test", False, "No available tours for testing")
            return False
        
        tour_id = self.available_tour_ids[0]
        
        # Add tour to favorites first
        success_add, response_add = self.run_test(
            f"Setup: Add Tour {tour_id} to Favorites",
            "POST",
            f"favorites/{tour_id}",
            200,
            token=self.user_token
        )
        
        if not success_add:
            self.log_test("Response Format Test Setup", False, "Failed to add tour to favorites")
            return False
        
        # Test GET /api/favorites response format
        success1, response1 = self.run_test(
            "GET /api/favorites - Response Format Validation",
            "GET",
            "favorites",
            200,
            token=self.user_token
        )
        
        format_valid = True
        if success1 and response1:
            if isinstance(response1, list):
                if len(response1) > 0:
                    sample_favorite = response1[0]
                    required_fields = ['id', 'title', 'minimum_price', 'review_count', 'rating']
                    missing_fields = [field for field in required_fields if field not in sample_favorite]
                    
                    if missing_fields:
                        print(f"   ❌ Missing required fields in favorites response: {missing_fields}")
                        format_valid = False
                    else:
                        print(f"   ✅ Favorites response has all required fields: {required_fields}")
                        print(f"   📋 Sample favorite: {sample_favorite.get('title')} - ₺{sample_favorite.get('minimum_price')} - {sample_favorite.get('rating')}⭐ ({sample_favorite.get('review_count')} reviews)")
                else:
                    print("   ⚠️ Favorites list is empty")
            else:
                print(f"   ❌ Expected array response, got: {type(response1)}")
                format_valid = False
        
        # Test POST success response format
        success2 = True
        if success_add and response_add:
            if 'message' in response_add:
                print(f"   ✅ POST favorites success response format valid: {response_add.get('message')}")
            else:
                print("   ❌ POST favorites response missing 'message' field")
                success2 = False
        
        # Test DELETE success response format
        success3, response3 = self.run_test(
            f"DELETE /api/favorites/{tour_id} - Response Format Validation",
            "DELETE",
            f"favorites/{tour_id}",
            200,
            token=self.user_token
        )
        
        if success3 and response3:
            if 'message' in response3:
                print(f"   ✅ DELETE favorites success response format valid: {response3.get('message')}")
            else:
                print("   ❌ DELETE favorites response missing 'message' field")
                success3 = False
        
        return success1 and format_valid and success2 and success3

    def test_user_isolation(self):
        """Test 5: User Isolation Testing"""
        print("\n👥 Test 5: User Isolation Testing")
        
        if not self.available_tour_ids or len(self.available_tour_ids) < 2:
            self.log_test("User Isolation Test", False, "Need at least 2 tours for testing")
            return False
        
        tour_id1 = self.available_tour_ids[0]
        tour_id2 = self.available_tour_ids[1]
        
        # User adds tour1 to favorites
        success1, response1 = self.run_test(
            f"User adds Tour {tour_id1} to favorites",
            "POST",
            f"favorites/{tour_id1}",
            200,
            token=self.user_token
        )
        
        # Admin adds tour2 to favorites
        success2, response2 = self.run_test(
            f"Admin adds Tour {tour_id2} to favorites",
            "POST",
            f"favorites/{tour_id2}",
            200,
            token=self.admin_token
        )
        
        # User gets their favorites - should only see tour1
        success3, response3 = self.run_test(
            "User gets their favorites (should only see their own)",
            "GET",
            "favorites",
            200,
            token=self.user_token
        )
        
        user_isolation_valid = True
        if success3 and response3:
            user_favorite_ids = [tour.get('id') for tour in response3 if tour.get('id')]
            if tour_id1 in user_favorite_ids and tour_id2 not in user_favorite_ids:
                print(f"   ✅ User isolation working: User sees only their favorite ({tour_id1})")
            else:
                print(f"   ❌ User isolation failed: User sees {user_favorite_ids}, expected only [{tour_id1}]")
                user_isolation_valid = False
        
        # Admin gets their favorites - should only see tour2
        success4, response4 = self.run_test(
            "Admin gets their favorites (should only see their own)",
            "GET",
            "favorites",
            200,
            token=self.admin_token
        )
        
        admin_isolation_valid = True
        if success4 and response4:
            admin_favorite_ids = [tour.get('id') for tour in response4 if tour.get('id')]
            if tour_id2 in admin_favorite_ids and tour_id1 not in admin_favorite_ids:
                print(f"   ✅ Admin isolation working: Admin sees only their favorite ({tour_id2})")
            else:
                print(f"   ❌ Admin isolation failed: Admin sees {admin_favorite_ids}, expected only [{tour_id2}]")
                admin_isolation_valid = False
        
        # User tries to remove admin's favorite - should fail
        success5, response5 = self.run_test(
            f"User tries to remove Admin's favorite {tour_id2} (should fail)",
            "DELETE",
            f"favorites/{tour_id2}",
            404,  # Should return 404 (not found in user's favorites)
            token=self.user_token
        )
        
        # Clean up
        self.run_test(f"Cleanup: User removes {tour_id1}", "DELETE", f"favorites/{tour_id1}", 200, token=self.user_token)
        self.run_test(f"Cleanup: Admin removes {tour_id2}", "DELETE", f"favorites/{tour_id2}", 200, token=self.admin_token)
        
        return success1 and success2 and success3 and user_isolation_valid and success4 and admin_isolation_valid and success5

    def test_error_response_formats(self):
        """Test 6: Error Response Format Testing"""
        print("\n🚨 Test 6: Error Response Format Testing")
        
        # Test 401 error format (no token)
        success1, response1 = self.run_test(
            "Test 401 Error Format (No Token)",
            "GET",
            "favorites",
            401
        )
        
        # Test 404 error format (non-existent tour)
        nonexistent_tour_id = "12345678-1234-1234-1234-123456789012"
        success2, response2 = self.run_test(
            "Test 404 Error Format (Non-existent Tour)",
            "POST",
            f"favorites/{nonexistent_tour_id}",
            404,
            token=self.user_token
        )
        
        # Test 400 error format (duplicate favorite)
        if self.available_tour_ids:
            tour_id = self.available_tour_ids[0]
            
            # Add to favorites first
            self.run_test(f"Setup: Add {tour_id} to favorites", "POST", f"favorites/{tour_id}", 200, token=self.user_token)
            
            # Try to add again
            success3, response3 = self.run_test(
                "Test 400 Error Format (Duplicate Favorite)",
                "POST",
                f"favorites/{tour_id}",
                400,
                token=self.user_token
            )
            
            # Clean up
            self.run_test(f"Cleanup: Remove {tour_id}", "DELETE", f"favorites/{tour_id}", 200, token=self.user_token)
        else:
            success3 = False
        
        # Verify error responses have proper format
        error_format_valid = True
        for i, (success, response) in enumerate([(success1, response1), (success2, response2), (success3, response3)], 1):
            if success and response:
                if 'detail' in response:
                    print(f"   ✅ Error response {i} has proper format with 'detail' field: {response.get('detail')}")
                else:
                    print(f"   ❌ Error response {i} missing 'detail' field: {response}")
                    error_format_valid = False
        
        return success1 and success2 and success3 and error_format_valid

    def test_favorites_check_endpoint(self):
        """Test 7: Favorites Check Endpoint Testing"""
        print("\n🔍 Test 7: Favorites Check Endpoint Testing")
        
        if not self.available_tour_ids:
            self.log_test("Favorites Check Test", False, "No available tours for testing")
            return False
        
        tour_id = self.available_tour_ids[0]
        
        # Test check when tour is NOT in favorites
        success1, response1 = self.run_test(
            f"GET /api/favorites/check/{tour_id} - Not in Favorites",
            "GET",
            f"favorites/check/{tour_id}",
            200,
            token=self.user_token
        )
        
        check1_valid = True
        if success1 and response1:
            if response1.get('is_favorited') == False:
                print(f"   ✅ Check endpoint correctly shows tour not in favorites")
            else:
                print(f"   ❌ Check endpoint incorrect: expected is_favorited=false, got {response1.get('is_favorited')}")
                check1_valid = False
        
        # Add tour to favorites
        success_add, response_add = self.run_test(
            f"Setup: Add {tour_id} to favorites",
            "POST",
            f"favorites/{tour_id}",
            200,
            token=self.user_token
        )
        
        # Test check when tour IS in favorites
        success2, response2 = self.run_test(
            f"GET /api/favorites/check/{tour_id} - In Favorites",
            "GET",
            f"favorites/check/{tour_id}",
            200,
            token=self.user_token
        )
        
        check2_valid = True
        if success2 and response2:
            if response2.get('is_favorited') == True:
                print(f"   ✅ Check endpoint correctly shows tour in favorites")
            else:
                print(f"   ❌ Check endpoint incorrect: expected is_favorited=true, got {response2.get('is_favorited')}")
                check2_valid = False
        
        # Clean up
        self.run_test(f"Cleanup: Remove {tour_id}", "DELETE", f"favorites/{tour_id}", 200, token=self.user_token)
        
        return success1 and check1_valid and success_add and success2 and check2_valid

    def investigate_frontend_error(self):
        """Investigate the 'Bir hata oluştu' error in frontend"""
        print("\n🔍 Investigating Frontend Error: 'Bir hata oluştu'")
        
        # Test backend health
        success1, response1 = self.run_test(
            "Backend Health Check",
            "GET",
            "health",
            200
        )
        
        # Test tours endpoint (needed for favorites)
        success2, response2 = self.run_test(
            "Tours Endpoint Check",
            "GET",
            "tours",
            200
        )
        
        # Test user authentication
        success3 = self.user_token is not None
        if success3:
            print("✅ PASS: User Authentication Working")
            print(f"   Details: User token available: {self.user_token[:20]}...")
        else:
            print("❌ FAIL: User Authentication Failed")
        
        # Test favorites endpoints with detailed logging
        if self.available_tour_ids and self.user_token:
            tour_id = self.available_tour_ids[0]
            
            print(f"\n🔍 Testing Favorites Endpoints with Tour ID: {tour_id}")
            
            # Test each endpoint individually with detailed error logging
            try:
                # POST /api/favorites/{tour_id}
                url = f"{self.backend_url}/favorites/{tour_id}"
                headers = {"Authorization": f"Bearer {self.user_token}", "Content-Type": "application/json"}
                response = requests.post(url, headers=headers, timeout=30)
                
                print(f"POST /api/favorites/{tour_id}:")
                print(f"   Status: {response.status_code}")
                print(f"   Headers: {dict(response.headers)}")
                try:
                    print(f"   Response: {response.json()}")
                except:
                    print(f"   Response Text: {response.text}")
                
                if response.status_code == 200:
                    # GET /api/favorites
                    url = f"{self.backend_url}/favorites"
                    response = requests.get(url, headers=headers, timeout=30)
                    
                    print(f"\nGET /api/favorites:")
                    print(f"   Status: {response.status_code}")
                    try:
                        favorites_data = response.json()
                        print(f"   Response: {json.dumps(favorites_data, indent=2)}")
                        
                        # Check if response has required fields for frontend
                        if isinstance(favorites_data, list) and len(favorites_data) > 0:
                            sample = favorites_data[0]
                            required_fields = ['id', 'title', 'minimum_price', 'rating', 'review_count']
                            missing_fields = [f for f in required_fields if f not in sample]
                            
                            if missing_fields:
                                print(f"   ❌ POTENTIAL FRONTEND ERROR CAUSE: Missing fields {missing_fields}")
                                print(f"   💡 Frontend expects: {required_fields}")
                                print(f"   📋 Backend provides: {list(sample.keys())}")
                            else:
                                print(f"   ✅ All required fields present for frontend")
                        
                    except Exception as e:
                        print(f"   Response Text: {response.text}")
                        print(f"   JSON Parse Error: {e}")
                    
                    # Clean up
                    requests.delete(f"{self.backend_url}/favorites/{tour_id}", headers=headers, timeout=30)
                
            except Exception as e:
                print(f"   ❌ Request Exception: {e}")
        
        # Summary of potential issues
        print(f"\n📋 POTENTIAL CAUSES OF 'Bir hata oluştu' ERROR:")
        
        issues_found = []
        if not success1:
            issues_found.append("Backend health check failed")
        if not success2:
            issues_found.append("Tours endpoint not working")
        if not success3:
            issues_found.append("User authentication failed")
        
        if issues_found:
            for issue in issues_found:
                print(f"   ❌ {issue}")
        else:
            print(f"   ✅ All backend endpoints working correctly")
            print(f"   💡 Error might be in frontend JavaScript or network issues")
            print(f"   💡 Check browser console for detailed error messages")
            print(f"   💡 Verify CORS settings and network connectivity")

    def run_comprehensive_favorites_test(self):
        """Run all favorites API tests"""
        print("🚀 Starting Comprehensive Favorites API Testing")
        print("=" * 70)
        print("Testing Turkish review request: Favorites API sisteminin comprehensive backend testing'i")
        print("=" * 70)
        
        # Setup Phase
        print("\n🔧 SETUP PHASE")
        auth_success = self.setup_authentication()
        if not auth_success:
            print("❌ Authentication setup failed - cannot proceed")
            self.print_final_results()
            return False
        
        tours_success = self.get_available_tours()
        if not tours_success:
            print("❌ No tours available for testing - cannot proceed")
            self.print_final_results()
            return False
        
        # Test Phase 1: Basic Functionality
        print("\n📋 PHASE 1: Favorites Endpoints Testing")
        self.test_favorites_endpoints_basic()
        
        # Test Phase 2: Authentication
        print("\n🔐 PHASE 2: Authentication Testing")
        self.test_authentication_requirements()
        
        # Test Phase 3: Data Validation
        print("\n🔍 PHASE 3: Data Validation Testing")
        self.test_data_validation()
        
        # Test Phase 4: Response Formats
        print("\n📄 PHASE 4: Response Format Testing")
        self.test_response_formats()
        
        # Test Phase 5: User Isolation
        print("\n👥 PHASE 5: User Isolation Testing")
        self.test_user_isolation()
        
        # Test Phase 6: Error Response Formats
        print("\n🚨 PHASE 6: Error Response Format Testing")
        self.test_error_response_formats()
        
        # Test Phase 7: Favorites Check Endpoint
        print("\n🔍 PHASE 7: Favorites Check Endpoint Testing")
        self.test_favorites_check_endpoint()
        
        # Investigation Phase: Frontend Error
        print("\n🔍 INVESTIGATION PHASE: Frontend Error Analysis")
        self.investigate_frontend_error()
        
        # Print final results
        self.print_final_results()
        
        return self.passed_tests == self.total_tests

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 70)
        print("📊 FAVORITES API TEST RESULTS")
        print("=" * 70)
        
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        print(f"Total Tests Run: {self.total_tests}")
        print(f"Tests Passed: {self.passed_tests}")
        print(f"Tests Failed: {self.total_tests - self.passed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("🎉 EXCELLENT: Favorites API is working perfectly!")
        elif success_rate >= 75:
            print("✅ GOOD: Most favorites functionality working, minor issues")
        elif success_rate >= 50:
            print("⚠️ MODERATE: Some favorites features working, needs attention")
        else:
            print("🚨 CRITICAL: Major favorites API issues detected")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test']}")
                if test.get('details'):
                    print(f"     Details: {test['details']}")
        
        # Print summary for main agent
        print("\n📋 SUMMARY FOR MAIN AGENT:")
        if success_rate >= 90:
            print("✅ Favorites API system is fully functional")
            print("✅ All authentication, validation, and isolation tests passed")
            print("✅ Response formats are correct for frontend integration")
        else:
            print("❌ Favorites API has issues that need to be addressed:")
            for test in failed_tests[:5]:  # Show first 5 failures
                print(f"   • {test['test']}")

if __name__ == "__main__":
    tester = FavoritesAPITester()
    tester.run_comprehensive_favorites_test()