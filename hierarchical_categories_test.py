#!/usr/bin/env python3
"""
Hierarchical Category System Backend API Testing
Testing the updated category system with main categories and subcategories
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BACKEND_URL = "https://pakettur-2.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"

class HierarchicalCategoryTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_category_id = None
        self.test_subcategory_id = None
        self.results = []
        
    def log_result(self, test_name, success, details="", response_data=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        if response_data:
            result["response_data"] = response_data
        self.results.append(result)
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {json.dumps(response_data, indent=2)}")
        print()

    def admin_login(self):
        """Login as admin to get authentication token"""
        print("🔐 Admin Login Test")
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("token")
                self.session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
                self.log_result("Admin Login", True, f"Token received: {self.admin_token[:20]}...")
                return True
            else:
                self.log_result("Admin Login", False, f"Status: {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_result("Admin Login", False, f"Exception: {str(e)}")
            return False

    def test_create_main_category(self):
        """Test POST /api/admin/new-categories - Create main category"""
        print("📝 Testing Main Category Creation")
        
        category_data = {
            "title": "Mavi Yolculuk",
            "description": "Türkiye'nin en güzel koylarında tekne turları",
            "meta_title": "Mavi Yolculuk Turları",
            "meta_description": "Mavi yolculuk turları ile Türkiye'nin cennet koylarını keşfedin",
            "is_active": True
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/admin/new-categories", json=category_data)
            
            if response.status_code == 200:
                data = response.json()
                self.test_category_id = data.get("id")
                
                # Verify required fields
                required_fields = ["id", "title", "slug", "is_active", "created_at"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_result("Create Main Category", False, f"Missing fields: {missing_fields}", data)
                    return False
                
                # Verify slug generation
                expected_slug = "mavi-yolculuk"
                if data.get("slug") != expected_slug:
                    self.log_result("Create Main Category", False, f"Slug mismatch. Expected: {expected_slug}, Got: {data.get('slug')}", data)
                    return False
                
                # Verify no locations field required
                if "locations" in data:
                    self.log_result("Create Main Category", False, "Main category should not have locations field", data)
                    return False
                
                self.log_result("Create Main Category", True, f"Category created with ID: {self.test_category_id}, Slug: {data.get('slug')}")
                return True
            else:
                self.log_result("Create Main Category", False, f"Status: {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_result("Create Main Category", False, f"Exception: {str(e)}")
            return False

    def test_create_subcategory(self):
        """Test POST /api/admin/new-categories/{category_id}/subcategories - Create subcategory"""
        print("📝 Testing Subcategory Creation")
        
        if not self.test_category_id:
            self.log_result("Create Subcategory", False, "No main category ID available")
            return False
        
        subcategory_data = {
            "parent_category_id": self.test_category_id,
            "location_name": "Fethiye",
            "description": "Fethiye mavi yolculuk turları",
            "meta_title": "Fethiye Mavi Yolculuk",
            "is_active": True
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/admin/new-categories/{self.test_category_id}/subcategories", json=subcategory_data)
            
            if response.status_code == 200:
                data = response.json()
                self.test_subcategory_id = data.get("id")
                
                # Verify auto-title generation
                expected_title = "Mavi Yolculuk - Fethiye"
                if data.get("title") != expected_title:
                    self.log_result("Create Subcategory", False, f"Title mismatch. Expected: {expected_title}, Got: {data.get('title')}", data)
                    return False
                
                # Verify slug generation
                expected_slug = "mavi-yolculuk/fethiye"
                if data.get("slug") != expected_slug:
                    self.log_result("Create Subcategory", False, f"Slug mismatch. Expected: {expected_slug}, Got: {data.get('slug')}", data)
                    return False
                
                # Verify parent relationship
                if data.get("parent_category_id") != self.test_category_id:
                    self.log_result("Create Subcategory", False, "Parent category ID mismatch", data)
                    return False
                
                self.log_result("Create Subcategory", True, f"Subcategory created with ID: {self.test_subcategory_id}, Title: {data.get('title')}, Slug: {data.get('slug')}")
                return True
            else:
                self.log_result("Create Subcategory", False, f"Status: {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_result("Create Subcategory", False, f"Exception: {str(e)}")
            return False

    def test_list_hierarchical_categories(self):
        """Test GET /api/admin/new-categories - List hierarchical categories"""
        print("📝 Testing Hierarchical Categories List")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/admin/new-categories")
            
            if response.status_code == 200:
                data = response.json()
                
                if not isinstance(data, list):
                    self.log_result("List Hierarchical Categories", False, "Response should be a list", data)
                    return False
                
                # Find our test category
                test_category = None
                for category in data:
                    if category.get("id") == self.test_category_id:
                        test_category = category
                        break
                
                if not test_category:
                    self.log_result("List Hierarchical Categories", False, "Test category not found in response", data)
                    return False
                
                # Verify subcategories array exists
                if "subcategories" not in test_category:
                    self.log_result("List Hierarchical Categories", False, "Subcategories array missing", test_category)
                    return False
                
                # Verify our subcategory is included
                subcategories = test_category.get("subcategories", [])
                test_subcategory = None
                for subcategory in subcategories:
                    if subcategory.get("id") == self.test_subcategory_id:
                        test_subcategory = subcategory
                        break
                
                if not test_subcategory:
                    self.log_result("List Hierarchical Categories", False, "Test subcategory not found in parent category", test_category)
                    return False
                
                self.log_result("List Hierarchical Categories", True, f"Found {len(data)} categories, test category has {len(subcategories)} subcategories")
                return True
            else:
                self.log_result("List Hierarchical Categories", False, f"Status: {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_result("List Hierarchical Categories", False, f"Exception: {str(e)}")
            return False

    def test_update_main_category(self):
        """Test PUT /api/admin/new-categories/{id} - Update main category"""
        print("📝 Testing Main Category Update")
        
        if not self.test_category_id:
            self.log_result("Update Main Category", False, "No main category ID available")
            return False
        
        updated_data = {
            "title": "Mavi Yolculuk Premium",
            "description": "Premium mavi yolculuk deneyimi",
            "meta_title": "Premium Mavi Yolculuk Turları",
            "is_active": True
        }
        
        try:
            response = self.session.put(f"{BACKEND_URL}/admin/new-categories/{self.test_category_id}", json=updated_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify title update
                if data.get("title") != updated_data["title"]:
                    self.log_result("Update Main Category", False, f"Title not updated. Expected: {updated_data['title']}, Got: {data.get('title')}", data)
                    return False
                
                # Verify slug update
                expected_slug = "mavi-yolculuk-premium"
                if data.get("slug") != expected_slug:
                    self.log_result("Update Main Category", False, f"Slug not updated. Expected: {expected_slug}, Got: {data.get('slug')}", data)
                    return False
                
                self.log_result("Update Main Category", True, f"Category updated successfully. New title: {data.get('title')}, New slug: {data.get('slug')}")
                
                # Test cascade update to subcategories
                return self.verify_subcategory_cascade_update()
            else:
                self.log_result("Update Main Category", False, f"Status: {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_result("Update Main Category", False, f"Exception: {str(e)}")
            return False

    def verify_subcategory_cascade_update(self):
        """Verify that subcategory slugs and titles update when parent category changes"""
        print("📝 Testing Subcategory Cascade Update")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/admin/subcategories?category_id={self.test_category_id}")
            
            if response.status_code == 200:
                data = response.json()
                
                if not data:
                    self.log_result("Subcategory Cascade Update", False, "No subcategories found")
                    return False
                
                # Find our test subcategory
                test_subcategory = None
                for subcategory in data:
                    if subcategory.get("id") == self.test_subcategory_id:
                        test_subcategory = subcategory
                        break
                
                if not test_subcategory:
                    self.log_result("Subcategory Cascade Update", False, "Test subcategory not found")
                    return False
                
                # Verify updated title
                expected_title = "Mavi Yolculuk Premium - Fethiye"
                if test_subcategory.get("title") != expected_title:
                    self.log_result("Subcategory Cascade Update", False, f"Subcategory title not cascaded. Expected: {expected_title}, Got: {test_subcategory.get('title')}", test_subcategory)
                    return False
                
                # Verify updated slug
                expected_slug = "mavi-yolculuk-premium/fethiye"
                if test_subcategory.get("slug") != expected_slug:
                    self.log_result("Subcategory Cascade Update", False, f"Subcategory slug not cascaded. Expected: {expected_slug}, Got: {test_subcategory.get('slug')}", test_subcategory)
                    return False
                
                self.log_result("Subcategory Cascade Update", True, f"Subcategory cascaded successfully. Title: {test_subcategory.get('title')}, Slug: {test_subcategory.get('slug')}")
                return True
            else:
                self.log_result("Subcategory Cascade Update", False, f"Status: {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_result("Subcategory Cascade Update", False, f"Exception: {str(e)}")
            return False

    def test_update_subcategory(self):
        """Test PUT /api/admin/subcategories/{id} - Update subcategory"""
        print("📝 Testing Subcategory Update")
        
        if not self.test_subcategory_id:
            self.log_result("Update Subcategory", False, "No subcategory ID available")
            return False
        
        updated_data = {
            "parent_category_id": self.test_category_id,
            "location_name": "Fethiye Marina",
            "description": "Fethiye Marina'dan başlayan mavi yolculuk",
            "is_active": True
        }
        
        try:
            response = self.session.put(f"{BACKEND_URL}/admin/subcategories/{self.test_subcategory_id}", json=updated_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify location update
                if data.get("location_name") != updated_data["location_name"]:
                    self.log_result("Update Subcategory", False, f"Location not updated. Expected: {updated_data['location_name']}, Got: {data.get('location_name')}", data)
                    return False
                
                # Verify title auto-generation
                expected_title = "Mavi Yolculuk Premium - Fethiye Marina"
                if data.get("title") != expected_title:
                    self.log_result("Update Subcategory", False, f"Title not auto-generated. Expected: {expected_title}, Got: {data.get('title')}", data)
                    return False
                
                # Verify slug update
                expected_slug = "mavi-yolculuk-premium/fethiye-marina"
                if data.get("slug") != expected_slug:
                    self.log_result("Update Subcategory", False, f"Slug not updated. Expected: {expected_slug}, Got: {data.get('slug')}", data)
                    return False
                
                self.log_result("Update Subcategory", True, f"Subcategory updated successfully. Location: {data.get('location_name')}, Slug: {data.get('slug')}")
                return True
            else:
                self.log_result("Update Subcategory", False, f"Status: {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_result("Update Subcategory", False, f"Exception: {str(e)}")
            return False

    def test_public_category_endpoints(self):
        """Test public category endpoints"""
        print("📝 Testing Public Category Endpoints")
        
        # Test main category public endpoint
        try:
            response = requests.get(f"{BACKEND_URL}/categories/mavi-yolculuk-premium")
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify category data
                if data.get("title") != "Mavi Yolculuk Premium":
                    self.log_result("Public Main Category", False, f"Title mismatch in public endpoint", data)
                    return False
                
                # Verify subcategories list included
                if "subcategories" not in data:
                    self.log_result("Public Main Category", False, "Subcategories not included in public endpoint", data)
                    return False
                
                self.log_result("Public Main Category", True, f"Public main category accessible with {len(data.get('subcategories', []))} subcategories")
            else:
                self.log_result("Public Main Category", False, f"Status: {response.status_code}", response.json() if response.content else "No content")
                return False
        
        except Exception as e:
            self.log_result("Public Main Category", False, f"Exception: {str(e)}")
            return False
        
        # Test subcategory public endpoint
        try:
            response = requests.get(f"{BACKEND_URL}/categories/mavi-yolculuk-premium/fethiye-marina")
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify subcategory data
                if data.get("title") != "Mavi Yolculuk Premium - Fethiye Marina":
                    self.log_result("Public Subcategory", False, f"Title mismatch in public subcategory endpoint", data)
                    return False
                
                # Verify parent-child relationship
                if data.get("parent_category_title") != "Mavi Yolculuk Premium":
                    self.log_result("Public Subcategory", False, "Parent-child relationship not properly displayed", data)
                    return False
                
                self.log_result("Public Subcategory", True, f"Public subcategory accessible with proper parent relationship")
                return True
            else:
                self.log_result("Public Subcategory", False, f"Status: {response.status_code}", response.json() if response.content else "No content")
                return False
        
        except Exception as e:
            self.log_result("Public Subcategory", False, f"Exception: {str(e)}")
            return False

    def test_delete_subcategory(self):
        """Test DELETE /api/admin/subcategories/{id} - Delete individual subcategory"""
        print("📝 Testing Individual Subcategory Deletion")
        
        if not self.test_subcategory_id:
            self.log_result("Delete Subcategory", False, "No subcategory ID available")
            return False
        
        try:
            response = self.session.delete(f"{BACKEND_URL}/admin/subcategories/{self.test_subcategory_id}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify deletion message
                if "message" not in data:
                    self.log_result("Delete Subcategory", False, "No deletion message returned", data)
                    return False
                
                # Verify subcategory is actually deleted
                verify_response = self.session.get(f"{BACKEND_URL}/admin/subcategories?category_id={self.test_category_id}")
                if verify_response.status_code == 200:
                    subcategories = verify_response.json()
                    for subcategory in subcategories:
                        if subcategory.get("id") == self.test_subcategory_id:
                            self.log_result("Delete Subcategory", False, "Subcategory still exists after deletion")
                            return False
                
                self.log_result("Delete Subcategory", True, f"Subcategory deleted successfully: {data.get('message')}")
                return True
            else:
                self.log_result("Delete Subcategory", False, f"Status: {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_result("Delete Subcategory", False, f"Exception: {str(e)}")
            return False

    def test_delete_main_category(self):
        """Test DELETE /api/admin/new-categories/{id} - Delete main category with cascade"""
        print("📝 Testing Main Category Deletion with Cascade")
        
        if not self.test_category_id:
            self.log_result("Delete Main Category", False, "No main category ID available")
            return False
        
        # First create another subcategory to test cascade deletion
        subcategory_data = {
            "parent_category_id": self.test_category_id,
            "location_name": "Göcek",
            "is_active": True
        }
        
        try:
            # Create test subcategory
            create_response = self.session.post(f"{BACKEND_URL}/admin/new-categories/{self.test_category_id}/subcategories", json=subcategory_data)
            if create_response.status_code != 200:
                self.log_result("Delete Main Category", False, "Failed to create test subcategory for cascade test")
                return False
            
            test_subcategory_data = create_response.json()
            test_subcategory_id = test_subcategory_data.get("id")
            
            # Now delete the main category
            response = self.session.delete(f"{BACKEND_URL}/admin/new-categories/{self.test_category_id}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify deletion message includes count
                message = data.get("message", "")
                if "subcategories" not in message.lower():
                    self.log_result("Delete Main Category", False, "Deletion message should mention subcategories", data)
                    return False
                
                # Verify main category is deleted
                verify_response = self.session.get(f"{BACKEND_URL}/admin/new-categories")
                if verify_response.status_code == 200:
                    categories = verify_response.json()
                    for category in categories:
                        if category.get("id") == self.test_category_id:
                            self.log_result("Delete Main Category", False, "Main category still exists after deletion")
                            return False
                
                # Verify subcategories are also deleted
                subcategory_response = self.session.get(f"{BACKEND_URL}/admin/subcategories?category_id={self.test_category_id}")
                if subcategory_response.status_code == 200:
                    subcategories = subcategory_response.json()
                    if subcategories:
                        self.log_result("Delete Main Category", False, "Subcategories still exist after main category deletion")
                        return False
                
                self.log_result("Delete Main Category", True, f"Main category and all subcategories deleted successfully: {message}")
                return True
            else:
                self.log_result("Delete Main Category", False, f"Status: {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_result("Delete Main Category", False, f"Exception: {str(e)}")
            return False

    def test_active_inactive_status_inheritance(self):
        """Test active/inactive status inheritance from parent to child"""
        print("📝 Testing Active/Inactive Status Inheritance")
        
        # Create a new category for this test
        category_data = {
            "title": "Test Status Category",
            "is_active": True
        }
        
        try:
            # Create main category
            response = self.session.post(f"{BACKEND_URL}/admin/new-categories", json=category_data)
            if response.status_code != 200:
                self.log_result("Status Inheritance", False, "Failed to create test category")
                return False
            
            category = response.json()
            category_id = category.get("id")
            
            # Create subcategory
            subcategory_data = {
                "parent_category_id": category_id,
                "location_name": "Test Location",
                "is_active": True
            }
            
            subcategory_response = self.session.post(f"{BACKEND_URL}/admin/new-categories/{category_id}/subcategories", json=subcategory_data)
            if subcategory_response.status_code != 200:
                self.log_result("Status Inheritance", False, "Failed to create test subcategory")
                return False
            
            subcategory = subcategory_response.json()
            subcategory_id = subcategory.get("id")
            
            # Deactivate main category
            update_data = {
                "title": "Test Status Category",
                "is_active": False
            }
            
            update_response = self.session.put(f"{BACKEND_URL}/admin/new-categories/{category_id}", json=update_data)
            if update_response.status_code != 200:
                self.log_result("Status Inheritance", False, "Failed to update main category status")
                return False
            
            # Check if subcategory is also deactivated
            subcategory_check = self.session.get(f"{BACKEND_URL}/admin/subcategories?category_id={category_id}")
            if subcategory_check.status_code == 200:
                subcategories = subcategory_check.json()
                test_subcategory = None
                for sub in subcategories:
                    if sub.get("id") == subcategory_id:
                        test_subcategory = sub
                        break
                
                if not test_subcategory:
                    self.log_result("Status Inheritance", False, "Test subcategory not found")
                    return False
                
                if test_subcategory.get("is_active") != False:
                    self.log_result("Status Inheritance", False, "Subcategory status not inherited from parent")
                    return False
                
                self.log_result("Status Inheritance", True, "Active/inactive status properly inherited from parent to child")
                
                # Cleanup
                self.session.delete(f"{BACKEND_URL}/admin/new-categories/{category_id}")
                return True
            else:
                self.log_result("Status Inheritance", False, "Failed to verify subcategory status")
                return False
                
        except Exception as e:
            self.log_result("Status Inheritance", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all hierarchical category system tests"""
        print("🚀 Starting Hierarchical Category System Backend API Tests")
        print("=" * 60)
        
        # Login first
        if not self.admin_login():
            print("❌ Cannot proceed without admin authentication")
            return False
        
        # Run tests in sequence
        tests = [
            self.test_create_main_category,
            self.test_create_subcategory,
            self.test_list_hierarchical_categories,
            self.test_update_main_category,
            self.test_update_subcategory,
            self.test_public_category_endpoints,
            self.test_active_inactive_status_inheritance,
            self.test_delete_subcategory,
            self.test_delete_main_category
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            try:
                if test():
                    passed += 1
            except Exception as e:
                print(f"❌ Test {test.__name__} failed with exception: {str(e)}")
        
        # Summary
        print("=" * 60)
        print(f"📊 TEST SUMMARY")
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("🎉 ALL HIERARCHICAL CATEGORY TESTS PASSED!")
            return True
        else:
            print("⚠️  SOME TESTS FAILED - See details above")
            return False

if __name__ == "__main__":
    tester = HierarchicalCategoryTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)