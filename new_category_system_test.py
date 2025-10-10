#!/usr/bin/env python3
"""
New Category System Backend API Testing
Testing all the newly implemented category system APIs with location combinations
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://travel-portal-6.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"  # Default admin password

class NewCategorySystemTester:
    def __init__(self):
        self.admin_token = None
        self.test_category_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, details):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
    
    def admin_login(self):
        """Login as admin to get authentication token"""
        try:
            response = requests.post(f"{BASE_URL}/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("token")
                self.log_test("Admin Login", True, f"Successfully logged in as {ADMIN_EMAIL}")
                return True
            else:
                self.log_test("Admin Login", False, f"Login failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin Login", False, f"Login error: {str(e)}")
            return False
    
    def get_auth_headers(self):
        """Get authorization headers for admin requests"""
        if not self.admin_token:
            return {}
        return {"Authorization": f"Bearer {self.admin_token}"}
    
    def test_create_new_category(self):
        """Test POST /api/admin/new-categories - Create new category with locations"""
        try:
            category_data = {
                "title": "Test Mavi Yolculuk",
                "description": "Test category for blue voyage tours",
                "image": "https://example.com/test-image.jpg",
                "locations": ["Fethiye", "Göcek"],
                "meta_title": "Test Mavi Yolculuk - Blue Voyage Tours",
                "meta_description": "Discover the best blue voyage tours in Turkey",
                "meta_keywords": "mavi yolculuk, blue voyage, sailing, turkey",
                "faq": [
                    {
                        "question": "What is included in the tour?",
                        "answer": "All meals, accommodation, and activities are included."
                    },
                    {
                        "question": "What should I bring?",
                        "answer": "Bring comfortable clothes, sunscreen, and personal items."
                    }
                ],
                "is_active": True
            }
            
            response = requests.post(
                f"{BASE_URL}/admin/new-categories",
                json=category_data,
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                self.test_category_id = data.get("id")
                
                # Verify response structure
                required_fields = ["id", "title", "slug", "description", "meta_title", "meta_description", "meta_keywords", "faq", "is_active", "created_at"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Create New Category", False, f"Missing fields in response: {missing_fields}")
                    return False
                
                # Verify slug generation
                expected_slug = "test-mavi-yolculuk"
                if data.get("slug") != expected_slug:
                    self.log_test("Create New Category", False, f"Incorrect slug generation. Expected: {expected_slug}, Got: {data.get('slug')}")
                    return False
                
                self.log_test("Create New Category", True, f"Category created successfully with ID: {self.test_category_id}, Slug: {data.get('slug')}")
                return True
            else:
                self.log_test("Create New Category", False, f"Failed to create category: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Create New Category", False, f"Error creating category: {str(e)}")
            return False
    
    def test_get_admin_categories(self):
        """Test GET /api/admin/new-categories - List all categories with locations"""
        try:
            response = requests.get(
                f"{BASE_URL}/admin/new-categories",
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                categories = response.json()
                
                if not isinstance(categories, list):
                    self.log_test("Get Admin Categories", False, "Response is not a list")
                    return False
                
                # Find our test category
                test_category = None
                for category in categories:
                    if category.get("id") == self.test_category_id:
                        test_category = category
                        break
                
                if not test_category:
                    self.log_test("Get Admin Categories", False, "Test category not found in response")
                    return False
                
                # Verify category has locations
                if "locations" not in test_category:
                    self.log_test("Get Admin Categories", False, "Category missing locations field")
                    return False
                
                locations = test_category["locations"]
                if len(locations) != 2:
                    self.log_test("Get Admin Categories", False, f"Expected 2 locations, got {len(locations)}")
                    return False
                
                # Verify location structure
                for location in locations:
                    required_location_fields = ["id", "category_id", "location_name", "location_slug", "combined_slug", "is_active", "created_at"]
                    missing_fields = [field for field in required_location_fields if field not in location]
                    if missing_fields:
                        self.log_test("Get Admin Categories", False, f"Location missing fields: {missing_fields}")
                        return False
                
                self.log_test("Get Admin Categories", True, f"Retrieved {len(categories)} categories with location combinations")
                return True
            else:
                self.log_test("Get Admin Categories", False, f"Failed to get categories: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Admin Categories", False, f"Error getting categories: {str(e)}")
            return False
    
    def test_update_category(self):
        """Test PUT /api/admin/new-categories/{id} - Update existing category"""
        if not self.test_category_id:
            self.log_test("Update Category", False, "No test category ID available")
            return False
        
        try:
            updated_data = {
                "title": "Updated Test Mavi Yolculuk",
                "description": "Updated description for blue voyage tours",
                "image": "https://example.com/updated-image.jpg",
                "locations": ["Fethiye", "Göcek", "Bodrum"],  # Added new location
                "meta_title": "Updated Test Mavi Yolculuk - Blue Voyage Tours",
                "meta_description": "Updated description for the best blue voyage tours",
                "meta_keywords": "updated, mavi yolculuk, blue voyage, sailing",
                "faq": [
                    {
                        "question": "Updated: What is included?",
                        "answer": "Updated: All meals, accommodation, and activities."
                    }
                ],
                "is_active": True
            }
            
            response = requests.put(
                f"{BASE_URL}/admin/new-categories/{self.test_category_id}",
                json=updated_data,
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify updates
                if data.get("title") != "Updated Test Mavi Yolculuk":
                    self.log_test("Update Category", False, f"Title not updated correctly: {data.get('title')}")
                    return False
                
                # Verify slug regeneration
                expected_slug = "updated-test-mavi-yolculuk"
                if data.get("slug") != expected_slug:
                    self.log_test("Update Category", False, f"Slug not regenerated correctly. Expected: {expected_slug}, Got: {data.get('slug')}")
                    return False
                
                self.log_test("Update Category", True, f"Category updated successfully with new slug: {data.get('slug')}")
                return True
            else:
                self.log_test("Update Category", False, f"Failed to update category: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Update Category", False, f"Error updating category: {str(e)}")
            return False
    
    def test_public_category_page(self):
        """Test GET /api/categories/{category_slug} - Public category page"""
        try:
            # Use the updated slug
            category_slug = "updated-test-mavi-yolculuk"
            
            response = requests.get(f"{BASE_URL}/categories/{category_slug}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify response structure
                required_fields = ["id", "title", "slug", "description", "meta_title", "meta_description", "tours"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Public Category Page", False, f"Missing fields in response: {missing_fields}")
                    return False
                
                # Verify tours field is a list
                if not isinstance(data.get("tours"), list):
                    self.log_test("Public Category Page", False, "Tours field is not a list")
                    return False
                
                self.log_test("Public Category Page", True, f"Category page accessible with {len(data['tours'])} related tours")
                return True
            else:
                self.log_test("Public Category Page", False, f"Failed to access category page: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Public Category Page", False, f"Error accessing category page: {str(e)}")
            return False
    
    def test_public_category_location_page(self):
        """Test GET /api/categories/{category_slug}/{location_slug} - Public category+location page"""
        try:
            # Use the updated slug and test with Fethiye location
            category_slug = "updated-test-mavi-yolculuk"
            location_slug = "fethiye"
            
            response = requests.get(f"{BASE_URL}/categories/{category_slug}/{location_slug}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify response structure
                required_fields = ["category", "location", "page_title", "page_description", "meta_title", "meta_description", "tours"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Public Category+Location Page", False, f"Missing fields in response: {missing_fields}")
                    return False
                
                # Verify category and location objects
                if not isinstance(data.get("category"), dict):
                    self.log_test("Public Category+Location Page", False, "Category field is not an object")
                    return False
                
                if not isinstance(data.get("location"), dict):
                    self.log_test("Public Category+Location Page", False, "Location field is not an object")
                    return False
                
                # Verify tours field is a list
                if not isinstance(data.get("tours"), list):
                    self.log_test("Public Category+Location Page", False, "Tours field is not a list")
                    return False
                
                # Verify page title format
                expected_title_pattern = "Updated Test Mavi Yolculuk - Fethiye"
                if data.get("page_title") != expected_title_pattern:
                    self.log_test("Public Category+Location Page", False, f"Incorrect page title format. Expected: {expected_title_pattern}, Got: {data.get('page_title')}")
                    return False
                
                self.log_test("Public Category+Location Page", True, f"Category+Location page accessible with combined data and {len(data['tours'])} filtered tours")
                return True
            else:
                self.log_test("Public Category+Location Page", False, f"Failed to access category+location page: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Public Category+Location Page", False, f"Error accessing category+location page: {str(e)}")
            return False
    
    def test_error_cases(self):
        """Test error cases for non-existent categories and invalid slugs"""
        try:
            # Test non-existent category slug
            response = requests.get(f"{BASE_URL}/categories/non-existent-category")
            if response.status_code != 404:
                self.log_test("Error Cases - Non-existent Category", False, f"Expected 404, got {response.status_code}")
                return False
            
            # Test non-existent category+location combination
            response = requests.get(f"{BASE_URL}/categories/non-existent-category/non-existent-location")
            if response.status_code != 404:
                self.log_test("Error Cases - Non-existent Category+Location", False, f"Expected 404, got {response.status_code}")
                return False
            
            # Test invalid category ID for admin endpoints
            response = requests.get(
                f"{BASE_URL}/admin/new-categories/invalid-id",
                headers=self.get_auth_headers()
            )
            # This should either return 404 or empty result, not 500
            if response.status_code == 500:
                self.log_test("Error Cases - Invalid Category ID", False, f"Server error for invalid ID: {response.status_code}")
                return False
            
            self.log_test("Error Cases", True, "All error cases handled correctly with appropriate status codes")
            return True
            
        except Exception as e:
            self.log_test("Error Cases", False, f"Error testing error cases: {str(e)}")
            return False
    
    def test_slug_generation_turkish_chars(self):
        """Test slug generation from Turkish characters"""
        try:
            turkish_category_data = {
                "title": "Türkiye Güzel Şehirler Turu",
                "description": "Turkish cities tour with special characters",
                "locations": ["İstanbul", "Göcek"],
                "is_active": True
            }
            
            response = requests.post(
                f"{BASE_URL}/admin/new-categories",
                json=turkish_category_data,
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                expected_slug = "turkiye-guzel-sehirler-turu"
                
                if data.get("slug") != expected_slug:
                    self.log_test("Turkish Character Slug Generation", False, f"Incorrect Turkish slug. Expected: {expected_slug}, Got: {data.get('slug')}")
                    return False
                
                # Clean up - delete the test category
                requests.delete(
                    f"{BASE_URL}/admin/new-categories/{data.get('id')}",
                    headers=self.get_auth_headers()
                )
                
                self.log_test("Turkish Character Slug Generation", True, f"Turkish characters converted correctly to slug: {data.get('slug')}")
                return True
            else:
                self.log_test("Turkish Character Slug Generation", False, f"Failed to create Turkish category: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Turkish Character Slug Generation", False, f"Error testing Turkish slug generation: {str(e)}")
            return False
    
    def test_delete_category(self):
        """Test DELETE /api/admin/new-categories/{id} - Delete category"""
        if not self.test_category_id:
            self.log_test("Delete Category", False, "No test category ID available")
            return False
        
        try:
            response = requests.delete(
                f"{BASE_URL}/admin/new-categories/{self.test_category_id}",
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                # Verify category is deleted by trying to access it
                verify_response = requests.get(
                    f"{BASE_URL}/admin/new-categories",
                    headers=self.get_auth_headers()
                )
                
                if verify_response.status_code == 200:
                    categories = verify_response.json()
                    deleted_category = None
                    for category in categories:
                        if category.get("id") == self.test_category_id:
                            deleted_category = category
                            break
                    
                    if deleted_category:
                        self.log_test("Delete Category", False, "Category still exists after deletion")
                        return False
                    
                    self.log_test("Delete Category", True, "Category and all its location combinations deleted successfully")
                    return True
                else:
                    self.log_test("Delete Category", False, f"Could not verify deletion: {verify_response.status_code}")
                    return False
            else:
                self.log_test("Delete Category", False, f"Failed to delete category: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Delete Category", False, f"Error deleting category: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all category system tests"""
        print("🧪 NEW CATEGORY SYSTEM BACKEND API TESTING")
        print("=" * 60)
        
        # Step 1: Admin login
        if not self.admin_login():
            print("❌ Cannot proceed without admin authentication")
            return False
        
        # Step 2: Test category creation
        if not self.test_create_new_category():
            print("❌ Category creation failed - cannot proceed with other tests")
            return False
        
        # Step 3: Test admin category listing
        self.test_get_admin_categories()
        
        # Step 4: Test category update
        self.test_update_category()
        
        # Step 5: Test public category page
        self.test_public_category_page()
        
        # Step 6: Test public category+location page
        self.test_public_category_location_page()
        
        # Step 7: Test error cases
        self.test_error_cases()
        
        # Step 8: Test Turkish character slug generation
        self.test_slug_generation_turkish_chars()
        
        # Step 9: Test category deletion (cleanup)
        self.test_delete_category()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed_tests = sum(1 for result in self.test_results if result["success"])
        total_tests = len(self.test_results)
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        
        print(f"✅ Passed: {passed_tests}/{total_tests} ({success_rate:.1f}%)")
        
        if passed_tests < total_tests:
            print(f"❌ Failed: {total_tests - passed_tests}/{total_tests}")
            print("\nFailed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        return success_rate >= 80  # Consider 80%+ as overall success

if __name__ == "__main__":
    tester = NewCategorySystemTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 NEW CATEGORY SYSTEM TESTING COMPLETED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print("\n⚠️  NEW CATEGORY SYSTEM TESTING COMPLETED WITH ISSUES")
        sys.exit(1)