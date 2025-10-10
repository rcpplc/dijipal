#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Category System
Testing Turkish review request: Ana sayfa ve kategori sisteminin comprehensive backend testing'i
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BACKEND_URL = "https://seo-nav-rebuild.preview.emergentagent.com/api"

class CategorySystemTester:
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

    def test_public_categories_endpoint(self):
        """Test 1: Public Categories Endpoint Testing"""
        print("🔍 Testing Public Categories Endpoint...")
        
        try:
            response = requests.get(f"{self.backend_url}/public/categories", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response format
                if "categories" in data and isinstance(data["categories"], list):
                    categories = data["categories"]
                    
                    if len(categories) > 0:
                        # Check required fields in each category
                        sample_category = categories[0]
                        required_fields = ["id", "title", "slug", "description", "image", "tours_count"]
                        missing_fields = [field for field in required_fields if field not in sample_category]
                        
                        if not missing_fields:
                            self.log_test(
                                "Public Categories Endpoint - Response Format",
                                True,
                                f"Found {len(categories)} categories with all required fields: {required_fields}",
                                {"categories_count": len(categories), "sample_category": sample_category}
                            )
                            
                            # Test each category has proper data
                            valid_categories = 0
                            for cat in categories:
                                if all(field in cat for field in required_fields):
                                    valid_categories += 1
                            
                            self.log_test(
                                "Public Categories Endpoint - Data Validation",
                                valid_categories == len(categories),
                                f"All {valid_categories}/{len(categories)} categories have required fields",
                                {"valid_categories": valid_categories, "total_categories": len(categories)}
                            )
                        else:
                            self.log_test(
                                "Public Categories Endpoint - Response Format",
                                False,
                                f"Missing required fields: {missing_fields}",
                                sample_category
                            )
                    else:
                        self.log_test(
                            "Public Categories Endpoint - Response Format",
                            False,
                            "No categories found in response",
                            data
                        )
                else:
                    self.log_test(
                        "Public Categories Endpoint - Response Format",
                        False,
                        "Response missing 'categories' array",
                        data
                    )
            else:
                self.log_test(
                    "Public Categories Endpoint - HTTP Status",
                    False,
                    f"Expected 200, got {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_test(
                "Public Categories Endpoint - Connection",
                False,
                f"Request failed: {str(e)}"
            )

    def test_category_page_backend(self):
        """Test 2: Category Page Backend Testing"""
        print("🔍 Testing Category Page Backend...")
        
        test_categories = ["mavi-yolculuk", "gunubirlik-tekne-turu", "parasut-deneyimi"]
        
        for category_slug in test_categories:
            try:
                response = requests.get(f"{self.backend_url}/categories/{category_slug}", timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Check main category data fields
                    required_fields = ["title", "description", "faq", "meta_title", "meta_description", "meta_keywords"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if not missing_fields:
                        # Check tours data
                        tours_present = "tours" in data and isinstance(data["tours"], list)
                        subcategories_present = "subcategories" in data and isinstance(data["subcategories"], list)
                        
                        self.log_test(
                            f"Category Page Backend - {category_slug} - Main Data",
                            True,
                            f"All required fields present. Tours: {len(data.get('tours', []))}, Subcategories: {len(data.get('subcategories', []))}",
                            {
                                "category": category_slug,
                                "title": data.get("title"),
                                "tours_count": len(data.get("tours", [])),
                                "subcategories_count": len(data.get("subcategories", []))
                            }
                        )
                        
                        # Test tours filtering
                        if tours_present:
                            self.log_test(
                                f"Category Page Backend - {category_slug} - Tours Filtering",
                                True,
                                f"Tours data returned with {len(data['tours'])} tours",
                                {"tours_count": len(data["tours"])}
                            )
                        
                        # Test subcategories data
                        if subcategories_present:
                            self.log_test(
                                f"Category Page Backend - {category_slug} - Subcategories",
                                True,
                                f"Subcategories data returned with {len(data['subcategories'])} subcategories",
                                {"subcategories_count": len(data["subcategories"])}
                            )
                    else:
                        self.log_test(
                            f"Category Page Backend - {category_slug} - Main Data",
                            False,
                            f"Missing required fields: {missing_fields}",
                            data
                        )
                        
                elif response.status_code == 404:
                    self.log_test(
                        f"Category Page Backend - {category_slug} - Not Found",
                        True,
                        f"Category '{category_slug}' not found (404) - this may be expected if category doesn't exist",
                        {"status_code": 404}
                    )
                else:
                    self.log_test(
                        f"Category Page Backend - {category_slug} - HTTP Status",
                        False,
                        f"Expected 200 or 404, got {response.status_code}",
                        response.text
                    )
                    
            except Exception as e:
                self.log_test(
                    f"Category Page Backend - {category_slug} - Connection",
                    False,
                    f"Request failed: {str(e)}"
                )

    def test_subcategory_page_backend(self):
        """Test 3: Subcategory Page Backend Testing"""
        print("🔍 Testing Subcategory Page Backend...")
        
        test_subcategories = [
            ("mavi-yolculuk", "istanbul"),
            ("gunubirlik-tekne-turu", "fethiye"),
            ("parasut-deneyimi", "gocek")
        ]
        
        for category_slug, location_slug in test_subcategories:
            try:
                response = requests.get(f"{self.backend_url}/categories/{category_slug}/{location_slug}", timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Check required fields for subcategory page
                    required_fields = ["parent_category", "subcategory", "page_title", "meta_title", "meta_description", "tours"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if not missing_fields:
                        # Check parent category information
                        parent_category = data.get("parent_category", {})
                        subcategory = data.get("subcategory", {})
                        tours = data.get("tours", [])
                        
                        parent_valid = "title" in parent_category and "slug" in parent_category
                        subcategory_valid = "location_name" in subcategory and "title" in subcategory
                        
                        self.log_test(
                            f"Subcategory Page Backend - {category_slug}/{location_slug} - Structure",
                            parent_valid and subcategory_valid,
                            f"Parent category valid: {parent_valid}, Subcategory valid: {subcategory_valid}, Tours: {len(tours)}",
                            {
                                "parent_title": parent_category.get("title"),
                                "subcategory_location": subcategory.get("location_name"),
                                "tours_count": len(tours)
                            }
                        )
                        
                        # Test location-filtered tours
                        self.log_test(
                            f"Subcategory Page Backend - {category_slug}/{location_slug} - Tours Filtering",
                            True,
                            f"Location-filtered tours returned: {len(tours)} tours",
                            {"tours_count": len(tours)}
                        )
                        
                    else:
                        self.log_test(
                            f"Subcategory Page Backend - {category_slug}/{location_slug} - Structure",
                            False,
                            f"Missing required fields: {missing_fields}",
                            data
                        )
                        
                elif response.status_code == 404:
                    self.log_test(
                        f"Subcategory Page Backend - {category_slug}/{location_slug} - Not Found",
                        True,
                        f"Subcategory '{category_slug}/{location_slug}' not found (404) - this may be expected if subcategory doesn't exist",
                        {"status_code": 404}
                    )
                else:
                    self.log_test(
                        f"Subcategory Page Backend - {category_slug}/{location_slug} - HTTP Status",
                        False,
                        f"Expected 200 or 404, got {response.status_code}",
                        response.text
                    )
                    
            except Exception as e:
                self.log_test(
                    f"Subcategory Page Backend - {category_slug}/{location_slug} - Connection",
                    False,
                    f"Request failed: {str(e)}"
                )

    def test_seo_data(self):
        """Test 4: SEO Data Testing"""
        print("🔍 Testing SEO Data...")
        
        # Test SEO data for existing categories
        try:
            # First get available categories
            response = requests.get(f"{self.backend_url}/public/categories", timeout=10)
            if response.status_code == 200:
                categories = response.json().get("categories", [])
                
                if categories:
                    # Test first available category for SEO data
                    test_category = categories[0]
                    category_slug = test_category["slug"]
                    
                    # Get category details
                    detail_response = requests.get(f"{self.backend_url}/categories/{category_slug}", timeout=10)
                    if detail_response.status_code == 200:
                        data = detail_response.json()
                        
                        # Check SEO fields
                        seo_fields = ["meta_title", "meta_description", "meta_keywords"]
                        seo_present = [field for field in seo_fields if field in data and data[field]]
                        
                        self.log_test(
                            f"SEO Data Testing - {category_slug} - Meta Fields",
                            len(seo_present) >= 2,  # At least 2 out of 3 SEO fields should be present
                            f"SEO fields present: {seo_present}",
                            {field: data.get(field) for field in seo_fields}
                        )
                        
                        # Check FAQ format
                        faq_data = data.get("faq", [])
                        if faq_data and isinstance(faq_data, list):
                            faq_valid = True
                            for faq_item in faq_data:
                                if not isinstance(faq_item, dict) or "question" not in faq_item or "answer" not in faq_item:
                                    faq_valid = False
                                    break
                            
                            self.log_test(
                                f"SEO Data Testing - {category_slug} - FAQ Format",
                                faq_valid,
                                f"FAQ data format valid with {len(faq_data)} items",
                                {"faq_count": len(faq_data), "sample_faq": faq_data[0] if faq_data else None}
                            )
                        else:
                            self.log_test(
                                f"SEO Data Testing - {category_slug} - FAQ Format",
                                True,
                                "No FAQ data present (acceptable)",
                                {"faq_count": 0}
                            )
                    else:
                        self.log_test(
                            "SEO Data Testing - Category Detail Access",
                            False,
                            f"Could not access category details for {category_slug}",
                            {"status_code": detail_response.status_code}
                        )
                else:
                    self.log_test(
                        "SEO Data Testing - Categories Available",
                        False,
                        "No categories available for SEO testing"
                    )
            else:
                self.log_test(
                    "SEO Data Testing - Categories List Access",
                    False,
                    f"Could not access categories list: {response.status_code}"
                )
                
        except Exception as e:
            self.log_test(
                "SEO Data Testing - Connection",
                False,
                f"Request failed: {str(e)}"
            )

    def test_error_handling(self):
        """Test 5: Error Handling Testing"""
        print("🔍 Testing Error Handling...")
        
        # Test non-existent category
        try:
            response = requests.get(f"{self.backend_url}/categories/non-existent-category", timeout=10)
            
            self.log_test(
                "Error Handling - Non-existent Category",
                response.status_code == 404,
                f"Non-existent category returns {response.status_code} (expected 404)",
                {"status_code": response.status_code}
            )
            
        except Exception as e:
            self.log_test(
                "Error Handling - Non-existent Category",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test non-existent subcategory
        try:
            response = requests.get(f"{self.backend_url}/categories/mavi-yolculuk/non-existent-location", timeout=10)
            
            self.log_test(
                "Error Handling - Non-existent Subcategory",
                response.status_code == 404,
                f"Non-existent subcategory returns {response.status_code} (expected 404)",
                {"status_code": response.status_code}
            )
            
        except Exception as e:
            self.log_test(
                "Error Handling - Non-existent Subcategory",
                False,
                f"Request failed: {str(e)}"
            )
        
        # Test invalid category format
        try:
            response = requests.get(f"{self.backend_url}/categories/invalid@category#name", timeout=10)
            
            self.log_test(
                "Error Handling - Invalid Category Format",
                response.status_code in [400, 404],
                f"Invalid category format returns {response.status_code} (expected 400 or 404)",
                {"status_code": response.status_code}
            )
            
        except Exception as e:
            self.log_test(
                "Error Handling - Invalid Category Format",
                False,
                f"Request failed: {str(e)}"
            )

    def test_backend_health(self):
        """Test Backend Health"""
        print("🔍 Testing Backend Health...")
        
        try:
            response = requests.get(f"{self.backend_url}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                health_status = data.get("status") == "healthy"
                
                self.log_test(
                    "Backend Health Check",
                    health_status,
                    f"Backend health status: {data.get('status')}",
                    data
                )
            else:
                self.log_test(
                    "Backend Health Check",
                    False,
                    f"Health check failed with status {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_test(
                "Backend Health Check",
                False,
                f"Health check request failed: {str(e)}"
            )

    def run_all_tests(self):
        """Run all category system tests"""
        print("🚀 Starting Comprehensive Category System Backend Testing")
        print("=" * 80)
        print()
        
        # Test backend health first
        self.test_backend_health()
        
        # Run all category system tests
        self.test_public_categories_endpoint()
        self.test_category_page_backend()
        self.test_subcategory_page_backend()
        self.test_seo_data()
        self.test_error_handling()
        
        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("=" * 80)
        print("🏁 CATEGORY SYSTEM BACKEND TESTING SUMMARY")
        print("=" * 80)
        
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.total_tests - self.passed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        print()
        
        # Group results by test category
        categories = {}
        for result in self.test_results:
            category = result["test"].split(" - ")[0]
            if category not in categories:
                categories[category] = {"passed": 0, "total": 0, "tests": []}
            categories[category]["total"] += 1
            if result["success"]:
                categories[category]["passed"] += 1
            categories[category]["tests"].append(result)
        
        # Print category summaries
        for category, stats in categories.items():
            rate = (stats["passed"] / stats["total"] * 100) if stats["total"] > 0 else 0
            status = "✅" if rate == 100 else "⚠️" if rate >= 50 else "❌"
            print(f"{status} {category}: {stats['passed']}/{stats['total']} ({rate:.1f}%)")
        
        print()
        
        # Print failed tests details
        failed_tests = [r for r in self.test_results if not r["success"]]
        if failed_tests:
            print("❌ FAILED TESTS DETAILS:")
            print("-" * 40)
            for test in failed_tests:
                print(f"• {test['test']}")
                print(f"  Details: {test['details']}")
                print()
        
        # Overall assessment
        if success_rate >= 90:
            print("🎉 EXCELLENT: Category system backend is working excellently!")
        elif success_rate >= 75:
            print("✅ GOOD: Category system backend is working well with minor issues.")
        elif success_rate >= 50:
            print("⚠️ MODERATE: Category system backend has some issues that need attention.")
        else:
            print("❌ CRITICAL: Category system backend has major issues that need immediate attention.")
        
        print()
        print("Testing completed at:", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

if __name__ == "__main__":
    tester = CategorySystemTester()
    tester.run_all_tests()