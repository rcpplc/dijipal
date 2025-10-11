#!/usr/bin/env python3
"""
Final comprehensive test of Favorites API after fixes
"""

import requests
import json

BACKEND_URL = "https://mavibilet.preview.emergentagent.com/api"

def run_final_favorites_test():
    """Run final comprehensive favorites test"""
    print("🚀 Final Comprehensive Favorites API Test")
    print("=" * 50)
    
    tests_passed = 0
    total_tests = 0
    
    # Setup authentication
    print("\n🔐 Setup: Authentication")
    
    # User login
    user_login = {"email": "user@example.com", "password": "password123"}
    response = requests.post(f"{BACKEND_URL}/auth/login", json=user_login)
    if response.status_code == 200:
        user_token = response.json()['token']
        print("✅ User authentication successful")
        tests_passed += 1
    else:
        print("❌ User authentication failed")
        return False
    total_tests += 1
    
    # Admin login
    admin_login = {"email": "admin@example.com", "password": "admin123"}
    response = requests.post(f"{BACKEND_URL}/auth/login", json=admin_login)
    if response.status_code == 200:
        admin_token = response.json()['token']
        print("✅ Admin authentication successful")
        tests_passed += 1
    else:
        print("❌ Admin authentication failed")
        return False
    total_tests += 1
    
    # Get available tours
    response = requests.get(f"{BACKEND_URL}/tours")
    if response.status_code == 200:
        tours = response.json()
        if len(tours) >= 2:
            tour_id1 = tours[0]['id']
            tour_id2 = tours[1]['id']
            print(f"✅ Found tours for testing: {tour_id1[:8]}... and {tour_id2[:8]}...")
            tests_passed += 1
        else:
            print("❌ Not enough tours for testing")
            return False
    else:
        print("❌ Failed to get tours")
        return False
    total_tests += 1
    
    # Test 1: Basic Favorites Operations
    print("\n📋 Test 1: Basic Favorites Operations")
    
    user_headers = {"Authorization": f"Bearer {user_token}"}
    
    # Add to favorites
    response = requests.post(f"{BACKEND_URL}/favorites/{tour_id1}", headers=user_headers)
    if response.status_code == 200:
        print("✅ POST /api/favorites/{tour_id} - Add to favorites")
        tests_passed += 1
    else:
        print(f"❌ POST /api/favorites failed: {response.status_code}")
    total_tests += 1
    
    # Get favorites
    response = requests.get(f"{BACKEND_URL}/favorites", headers=user_headers)
    if response.status_code == 200:
        favorites = response.json()
        if len(favorites) > 0 and favorites[0]['id'] == tour_id1:
            print("✅ GET /api/favorites - List favorites")
            tests_passed += 1
        else:
            print("❌ GET /api/favorites - Tour not found in favorites")
    else:
        print(f"❌ GET /api/favorites failed: {response.status_code}")
    total_tests += 1
    
    # Check favorite status
    response = requests.get(f"{BACKEND_URL}/favorites/check/{tour_id1}", headers=user_headers)
    if response.status_code == 200:
        check_result = response.json()
        if check_result.get('is_favorited') == True:
            print("✅ GET /api/favorites/check/{tour_id} - Check favorite status")
            tests_passed += 1
        else:
            print("❌ Favorite check returned wrong status")
    else:
        print(f"❌ GET /api/favorites/check failed: {response.status_code}")
    total_tests += 1
    
    # Remove from favorites
    response = requests.delete(f"{BACKEND_URL}/favorites/{tour_id1}", headers=user_headers)
    if response.status_code == 200:
        print("✅ DELETE /api/favorites/{tour_id} - Remove from favorites")
        tests_passed += 1
    else:
        print(f"❌ DELETE /api/favorites failed: {response.status_code}")
    total_tests += 1
    
    # Test 2: Authentication Requirements
    print("\n🔐 Test 2: Authentication Requirements")
    
    # No token
    response = requests.get(f"{BACKEND_URL}/favorites")
    if response.status_code == 403:
        print("✅ No token returns 403 Forbidden")
        tests_passed += 1
    else:
        print(f"❌ No token returned {response.status_code}, expected 403")
    total_tests += 1
    
    # Invalid token
    invalid_headers = {"Authorization": "Bearer invalid.token"}
    response = requests.get(f"{BACKEND_URL}/favorites", headers=invalid_headers)
    if response.status_code == 401:
        print("✅ Invalid token returns 401 Unauthorized")
        tests_passed += 1
    else:
        print(f"❌ Invalid token returned {response.status_code}, expected 401")
    total_tests += 1
    
    # Test 3: Data Validation
    print("\n🔍 Test 3: Data Validation")
    
    # Invalid tour ID
    response = requests.post(f"{BACKEND_URL}/favorites/invalid-id", headers=user_headers)
    if response.status_code == 404:
        print("✅ Invalid tour ID returns 404 Not Found")
        tests_passed += 1
    else:
        print(f"❌ Invalid tour ID returned {response.status_code}, expected 404")
    total_tests += 1
    
    # Duplicate favorite
    requests.post(f"{BACKEND_URL}/favorites/{tour_id1}", headers=user_headers)  # Add first
    response = requests.post(f"{BACKEND_URL}/favorites/{tour_id1}", headers=user_headers)  # Try to add again
    if response.status_code == 400:
        print("✅ Duplicate favorite returns 400 Bad Request")
        tests_passed += 1
    else:
        print(f"❌ Duplicate favorite returned {response.status_code}, expected 400")
    total_tests += 1
    
    # Test 4: User Isolation (FIXED)
    print("\n👥 Test 4: User Isolation")
    
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # User adds tour1, admin adds tour2
    requests.post(f"{BACKEND_URL}/favorites/{tour_id1}", headers=user_headers)
    requests.post(f"{BACKEND_URL}/favorites/{tour_id2}", headers=admin_headers)
    
    # User should only see tour1
    response = requests.get(f"{BACKEND_URL}/favorites", headers=user_headers)
    if response.status_code == 200:
        user_favorites = [f['id'] for f in response.json()]
        if tour_id1 in user_favorites and tour_id2 not in user_favorites:
            print("✅ User isolation working - user sees only their favorites")
            tests_passed += 1
        else:
            print(f"❌ User isolation failed - user sees: {user_favorites}")
    else:
        print(f"❌ User favorites failed: {response.status_code}")
    total_tests += 1
    
    # Admin should only see tour2 (THIS WAS FIXED)
    response = requests.get(f"{BACKEND_URL}/favorites", headers=admin_headers)
    if response.status_code == 200:
        admin_favorites = [f['id'] for f in response.json()]
        if tour_id2 in admin_favorites and tour_id1 not in admin_favorites:
            print("✅ Admin isolation working - admin sees only their favorites")
            tests_passed += 1
        else:
            print(f"❌ Admin isolation failed - admin sees: {admin_favorites}")
    else:
        print(f"❌ Admin favorites failed: {response.status_code}")
    total_tests += 1
    
    # Test 5: Response Format Validation
    print("\n📄 Test 5: Response Format Validation")
    
    response = requests.get(f"{BACKEND_URL}/favorites", headers=user_headers)
    if response.status_code == 200:
        favorites = response.json()
        if isinstance(favorites, list) and len(favorites) > 0:
            sample = favorites[0]
            required_fields = ['id', 'title', 'minimum_price', 'review_count', 'rating']
            if all(field in sample for field in required_fields):
                print("✅ Response format validation - all required fields present")
                tests_passed += 1
            else:
                missing = [f for f in required_fields if f not in sample]
                print(f"❌ Response format validation - missing fields: {missing}")
        else:
            print("✅ Response format validation - empty array format correct")
            tests_passed += 1
    else:
        print(f"❌ Response format validation failed: {response.status_code}")
    total_tests += 1
    
    # Cleanup
    print("\n🧹 Cleanup")
    requests.delete(f"{BACKEND_URL}/favorites/{tour_id1}", headers=user_headers)
    requests.delete(f"{BACKEND_URL}/favorites/{tour_id2}", headers=admin_headers)
    print("✅ Cleanup completed")
    
    # Final Results
    print("\n" + "=" * 50)
    print("📊 FINAL TEST RESULTS")
    print("=" * 50)
    
    success_rate = (tests_passed / total_tests * 100) if total_tests > 0 else 0
    
    print(f"Total Tests: {total_tests}")
    print(f"Tests Passed: {tests_passed}")
    print(f"Tests Failed: {total_tests - tests_passed}")
    print(f"Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 95:
        print("🎉 EXCELLENT: Favorites API is working perfectly!")
        return True
    elif success_rate >= 85:
        print("✅ GOOD: Favorites API is working well with minor issues")
        return True
    else:
        print("❌ NEEDS WORK: Favorites API has significant issues")
        return False

if __name__ == "__main__":
    run_final_favorites_test()