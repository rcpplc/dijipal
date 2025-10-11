#!/usr/bin/env python3
"""
Admin Login and Categories API Testing
Testing Turkish review request: Admin login test et ve kategori sistemi API'lerini kontrol et
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BACKEND_URL = "https://reservation-system-2.preview.emergentagent.com/api"

class AdminCategoriesTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        self.admin_token = None
        
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

    def test_admin_login(self):
        """Test 1: Admin login test - POST /api/auth/login with admin@example.com/admin123"""
        print("🔐 Testing Admin Login...")
        
        admin_login_data = {
            "email": "admin@example.com",
            "password": "admin123"
        }
        
        try:
            response = requests.post(
                f"{self.backend_url}/auth/login",
                json=admin_login_data,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if token is returned
                if 'token' in data and data['token']:
                    self.admin_token = data['token']
                    
                    # Check if user data is returned
                    if 'user' in data:
                        user = data['user']
                        user_role = user.get('role', 'unknown')
                        user_email = user.get('email', 'unknown')
                        
                        if user_role == 'admin' and user_email == 'admin@example.com':
                            self.log_test(
                                "Admin Login - Credentials Verification",
                                True,
                                f"Admin login successful. Role: {user_role}, Email: {user_email}, Token length: {len(self.admin_token)} chars",
                                {"token_preview": self.admin_token[:20] + "...", "user_role": user_role, "user_email": user_email}
                            )
                            return True
                        else:
                            self.log_test(
                                "Admin Login - Role Verification",
                                False,
                                f"Login successful but role/email incorrect. Expected: admin/admin@example.com, Got: {user_role}/{user_email}",
                                data
                            )
                            return False
                    else:
                        self.log_test(
                            "Admin Login - User Data Missing",
                            False,
                            "Token received but user data missing from response",
                            data
                        )
                        return False
                else:
                    self.log_test(
                        "Admin Login - Token Missing",
                        False,
                        "Login response missing token field",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "Admin Login - HTTP Status",
                    False,
                    f"Expected 200, got {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Admin Login - Connection Error",
                False,
                f"Request failed: {str(e)}"
            )
            return False

    def test_get_categories_api(self):
        """Test 2: Categories API test - GET /api/admin/new-categories (with admin token)"""
        print("📂 Testing Categories API...")
        
        if not self.admin_token:
            self.log_test(
                "Categories API - Authentication",
                False,
                "No admin token available - admin login must succeed first"
            )
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(
                f"{self.backend_url}/admin/new-categories",
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if response is a list
                if isinstance(data, list):
                    categories_count = len(data)
                    
                    if categories_count > 0:
                        # Check structure of first category
                        sample_category = data[0]
                        required_fields = ["id", "title", "slug", "is_active", "created_at"]
                        missing_fields = [field for field in required_fields if field not in sample_category]
                        
                        if not missing_fields:
                            self.log_test(
                                "Categories API - Data Structure",
                                True,
                                f"Found {categories_count} categories with proper structure. Required fields present: {required_fields}",
                                {"categories_count": categories_count, "sample_category": sample_category}
                            )
                            
                            # Check if categories exist in database
                            active_categories = [cat for cat in data if cat.get('is_active', False)]
                            self.log_test(
                                "Categories API - Database Content",
                                len(active_categories) > 0,
                                f"Found {len(active_categories)} active categories out of {categories_count} total categories",
                                {"active_categories": len(active_categories), "total_categories": categories_count}
                            )
                            return True
                        else:
                            self.log_test(
                                "Categories API - Missing Fields",
                                False,
                                f"Categories found but missing required fields: {missing_fields}",
                                sample_category
                            )
                            return False
                    else:
                        self.log_test(
                            "Categories API - Empty Database",
                            False,
                            "Categories API accessible but no categories found in database",
                            {"categories_count": 0}
                        )
                        return False
                else:
                    self.log_test(
                        "Categories API - Invalid Response Format",
                        False,
                        f"Expected list, got {type(data).__name__}",
                        data
                    )
                    return False
            elif response.status_code == 403:
                self.log_test(
                    "Categories API - Authorization Failed",
                    False,
                    "Admin token rejected - insufficient permissions",
                    response.text
                )
                return False
            else:
                self.log_test(
                    "Categories API - HTTP Status",
                    False,
                    f"Expected 200, got {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Categories API - Connection Error",
                False,
                f"Request failed: {str(e)}"
            )
            return False

    def test_create_category_api(self):
        """Test 3: Test category creation API - POST /api/admin/new-categories with sample data including rich text description"""
        print("📝 Testing Category Creation API...")
        
        if not self.admin_token:
            self.log_test(
                "Category Creation - Authentication",
                False,
                "No admin token available - admin login must succeed first"
            )
            return False
        
        # Sample category data with rich text description
        category_data = {
            "title": "Test Rich Text Category",
            "description": """<h2>Rich Text Description</h2>
<p>Bu kategori <strong>rich text editor</strong> için test edilmektedir.</p>
<ul>
<li>HTML formatında açıklama</li>
<li><em>İtalik</em> ve <strong>kalın</strong> metin desteği</li>
<li>Liste ve başlık desteği</li>
</ul>
<p>Rich text editor backend'in hazır olduğunu test etmek için oluşturulmuştur.</p>""",
            "image": "https://example.com/test-category-image.jpg",
            "faq": [
                {
                    "question": "Rich text editor nasıl çalışır?",
                    "answer": "<p>Rich text editor <strong>HTML formatında</strong> içerik oluşturmanıza olanak sağlar.</p>"
                },
                {
                    "question": "Hangi HTML etiketleri desteklenir?",
                    "answer": "<p>Temel HTML etiketleri: <code>&lt;p&gt;</code>, <code>&lt;strong&gt;</code>, <code>&lt;em&gt;</code>, <code>&lt;ul&gt;</code>, <code>&lt;li&gt;</code> desteklenir.</p>"
                }
            ],
            "meta_title": "Test Rich Text Category - Rich Text Editor Test",
            "meta_description": "Rich text editor backend hazırlığı için test kategorisi",
            "meta_keywords": "rich text, editor, test, kategori",
            "is_active": True
        }
        
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(
                f"{self.backend_url}/admin/new-categories",
                json=category_data,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if category was created successfully
                if 'id' in data and data['id']:
                    category_id = data['id']
                    created_title = data.get('title', '')
                    created_description = data.get('description', '')
                    
                    # Verify rich text description was saved
                    if '<h2>' in created_description and '<strong>' in created_description:
                        self.log_test(
                            "Category Creation - Rich Text Support",
                            True,
                            f"Category created successfully with ID: {category_id}. Rich text HTML preserved in description.",
                            {
                                "category_id": category_id,
                                "title": created_title,
                                "description_preview": created_description[:100] + "...",
                                "html_tags_preserved": True
                            }
                        )
                        
                        # Verify FAQ with rich text was saved
                        created_faq = data.get('faq', [])
                        if created_faq and len(created_faq) > 0:
                            faq_has_html = any('<p>' in faq.get('answer', '') for faq in created_faq)
                            self.log_test(
                                "Category Creation - FAQ Rich Text Support",
                                faq_has_html,
                                f"FAQ section created with {len(created_faq)} items. Rich text in FAQ answers: {'Yes' if faq_has_html else 'No'}",
                                {"faq_count": len(created_faq), "faq_html_support": faq_has_html}
                            )
                        
                        # Test: Verify category can be retrieved
                        self.verify_created_category(category_id)
                        
                        return True
                    else:
                        self.log_test(
                            "Category Creation - Rich Text Processing",
                            False,
                            "Category created but rich text HTML was not preserved in description",
                            {"created_description": created_description}
                        )
                        return False
                else:
                    self.log_test(
                        "Category Creation - Missing ID",
                        False,
                        "Category creation response missing ID field",
                        data
                    )
                    return False
            elif response.status_code == 403:
                self.log_test(
                    "Category Creation - Authorization Failed",
                    False,
                    "Admin token rejected - insufficient permissions for category creation",
                    response.text
                )
                return False
            elif response.status_code == 400:
                self.log_test(
                    "Category Creation - Validation Error",
                    False,
                    "Category data validation failed",
                    response.text
                )
                return False
            else:
                self.log_test(
                    "Category Creation - HTTP Status",
                    False,
                    f"Expected 200, got {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Category Creation - Connection Error",
                False,
                f"Request failed: {str(e)}"
            )
            return False

    def verify_created_category(self, category_id):
        """Verify that the created category can be retrieved and has correct data"""
        print(f"🔍 Verifying created category {category_id}...")
        
        try:
            headers = {
                "Authorization": f"Bearer {self.admin_token}",
                "Content-Type": "application/json"
            }
            
            # Get all categories and find our created one
            response = requests.get(
                f"{self.backend_url}/admin/new-categories",
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                categories = response.json()
                created_category = None
                
                for category in categories:
                    if category.get('id') == category_id:
                        created_category = category
                        break
                
                if created_category:
                    title = created_category.get('title', '')
                    description = created_category.get('description', '')
                    faq = created_category.get('faq', [])
                    
                    # Check if rich text is preserved
                    has_html_description = '<h2>' in description and '<strong>' in description
                    has_html_faq = any('<p>' in faq_item.get('answer', '') for faq_item in faq)
                    
                    self.log_test(
                        "Category Verification - Data Persistence",
                        has_html_description and has_html_faq,
                        f"Created category retrieved successfully. HTML preserved in description: {has_html_description}, HTML preserved in FAQ: {has_html_faq}",
                        {
                            "category_found": True,
                            "html_in_description": has_html_description,
                            "html_in_faq": has_html_faq,
                            "faq_count": len(faq)
                        }
                    )
                    return True
                else:
                    self.log_test(
                        "Category Verification - Not Found",
                        False,
                        f"Created category with ID {category_id} not found in categories list",
                        {"searched_categories": len(categories)}
                    )
                    return False
            else:
                self.log_test(
                    "Category Verification - API Error",
                    False,
                    f"Failed to retrieve categories for verification. Status: {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Category Verification - Connection Error",
                False,
                f"Verification request failed: {str(e)}"
            )
            return False

    def run_comprehensive_test(self):
        """Run all tests in the specified order"""
        print("🚀 Starting Admin Login and Categories API Testing")
        print("=" * 70)
        print("Testing Turkish review request:")
        print("1. Admin login test: POST /api/auth/login with admin@example.com/admin123")
        print("2. Categories API test: GET /api/admin/new-categories (with admin token)")
        print("3. Test category creation API: POST /api/admin/new-categories with rich text")
        print("=" * 70)
        
        # Test 1: Admin Login
        print("\n🔐 TEST 1: Admin Login")
        admin_login_success = self.test_admin_login()
        
        if not admin_login_success:
            print("❌ Admin login failed - cannot proceed with categories testing")
            self.print_final_results()
            return False
        
        # Test 2: Categories API
        print("\n📂 TEST 2: Categories API")
        categories_api_success = self.test_get_categories_api()
        
        # Test 3: Category Creation API
        print("\n📝 TEST 3: Category Creation API")
        category_creation_success = self.test_create_category_api()
        
        # Print final results
        self.print_final_results()
        
        # Return overall success
        return admin_login_success and categories_api_success and category_creation_success

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 70)
        print("📊 FINAL TEST RESULTS")
        print("=" * 70)
        
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        print(f"Total Tests Run: {self.total_tests}")
        print(f"Tests Passed: {self.passed_tests}")
        print(f"Tests Failed: {self.total_tests - self.passed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("🎉 EXCELLENT: Admin login and categories system working perfectly!")
            print("✅ Backend is ready for rich text editor integration!")
        elif success_rate >= 70:
            print("⚠️  GOOD: Most features working, some issues to address")
        else:
            print("🚨 CRITICAL: Major issues detected, backend not ready for rich text editor")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        
        # Print successful tests summary
        successful_tests = [test for test in self.test_results if test['success']]
        if successful_tests:
            print("\n✅ SUCCESSFUL TESTS:")
            for test in successful_tests:
                print(f"   • {test['test']}")

if __name__ == "__main__":
    tester = AdminCategoriesTester()
    success = tester.run_comprehensive_test()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)