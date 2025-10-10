#!/usr/bin/env python3
"""
Turkish Backend API Test - Specific Tests for Turkish Review Request
Testing GET /api/tours endpoint with focus on:
1. Tours listing functionality
2. Duration and duration_unit fields
3. Minimum_price and base_price fields
4. Sample tour data verification
"""

import requests
import json
import sys
from datetime import datetime

class TurkishTourAPITester:
    def __init__(self):
        # Use the production URL from frontend/.env
        self.base_url = "https://travel-portal-6.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
    def log_test(self, name, success, details="", error=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
            if details:
                print(f"   📋 {details}")
        else:
            print(f"❌ {name}")
            if error:
                print(f"   🚨 {error}")
        
        self.test_results.append({
            "test_name": name,
            "success": success,
            "details": details,
            "error": error,
            "timestamp": datetime.now().isoformat()
        })

    def test_backend_health(self):
        """Test if backend is accessible"""
        try:
            response = requests.get(f"{self.api_url}/health", timeout=10)
            if response.status_code == 200:
                health_data = response.json()
                self.log_test(
                    "Backend Health Check", 
                    True, 
                    f"Status: {health_data.get('status', 'unknown')}, Database: {health_data.get('database', 'unknown')}"
                )
                return True
            else:
                self.log_test("Backend Health Check", False, "", f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Backend Health Check", False, "", f"Connection error: {str(e)}")
            return False

    def test_tours_endpoint(self):
        """Test GET /api/tours endpoint - main focus of Turkish review"""
        print("\n🎯 Testing GET /api/tours endpoint (Turkish Review Focus)")
        
        try:
            response = requests.get(f"{self.api_url}/tours", timeout=15)
            
            if response.status_code != 200:
                self.log_test(
                    "GET /api/tours - HTTP Status", 
                    False, 
                    "", 
                    f"Expected 200, got {response.status_code}. Response: {response.text[:200]}"
                )
                return False, None
            
            # Parse JSON response
            try:
                tours_data = response.json()
            except json.JSONDecodeError as e:
                self.log_test(
                    "GET /api/tours - JSON Parse", 
                    False, 
                    "", 
                    f"Invalid JSON response: {str(e)}"
                )
                return False, None
            
            # Check if response is a list
            if not isinstance(tours_data, list):
                self.log_test(
                    "GET /api/tours - Response Format", 
                    False, 
                    "", 
                    f"Expected list, got {type(tours_data)}"
                )
                return False, None
            
            tour_count = len(tours_data)
            self.log_test(
                "GET /api/tours - Basic Functionality", 
                True, 
                f"Successfully retrieved {tour_count} tours"
            )
            
            return True, tours_data
            
        except requests.exceptions.Timeout:
            self.log_test("GET /api/tours - Timeout", False, "", "Request timeout (15s)")
            return False, None
        except requests.exceptions.ConnectionError:
            self.log_test("GET /api/tours - Connection", False, "", "Connection error")
            return False, None
        except Exception as e:
            self.log_test("GET /api/tours - Exception", False, "", f"Unexpected error: {str(e)}")
            return False, None

    def test_duration_fields(self, tours_data):
        """Test duration and duration_unit fields in tour data"""
        print("\n🕒 Testing Duration Fields (duration, duration_unit)")
        
        if not tours_data:
            self.log_test("Duration Fields Test", False, "", "No tour data available")
            return False
        
        tours_with_duration = 0
        tours_with_duration_unit = 0
        duration_values = []
        duration_unit_values = []
        
        for i, tour in enumerate(tours_data):
            tour_title = tour.get('title', f'Tour {i+1}')
            
            # Check duration field
            if 'duration' in tour:
                duration = tour['duration']
                duration_values.append(duration)
                tours_with_duration += 1
                print(f"   📅 {tour_title}: duration = {duration}")
            elif 'duration_days' in tour:
                duration_days = tour['duration_days']
                duration_values.append(f"{duration_days} days")
                tours_with_duration += 1
                print(f"   📅 {tour_title}: duration_days = {duration_days}")
            
            # Check duration_unit field
            if 'duration_unit' in tour:
                duration_unit = tour['duration_unit']
                duration_unit_values.append(duration_unit)
                tours_with_duration_unit += 1
                print(f"   ⏱️  {tour_title}: duration_unit = {duration_unit}")
        
        total_tours = len(tours_data)
        
        # Summary
        if tours_with_duration > 0:
            self.log_test(
                "Duration Fields - Duration", 
                True, 
                f"{tours_with_duration}/{total_tours} tours have duration data. Values: {set(duration_values)}"
            )
        else:
            self.log_test(
                "Duration Fields - Duration", 
                False, 
                "", 
                "No tours have duration or duration_days fields"
            )
        
        if tours_with_duration_unit > 0:
            self.log_test(
                "Duration Fields - Duration Unit", 
                True, 
                f"{tours_with_duration_unit}/{total_tours} tours have duration_unit data. Values: {set(duration_unit_values)}"
            )
        else:
            self.log_test(
                "Duration Fields - Duration Unit", 
                False, 
                "", 
                "No tours have duration_unit fields"
            )
        
        return tours_with_duration > 0 or tours_with_duration_unit > 0

    def test_pricing_fields(self, tours_data):
        """Test minimum_price, base_price and other pricing fields"""
        print("\n💰 Testing Pricing Fields (minimum_price, base_price)")
        
        if not tours_data:
            self.log_test("Pricing Fields Test", False, "", "No tour data available")
            return False
        
        tours_with_minimum_price = 0
        tours_with_base_price = 0
        minimum_prices = []
        base_prices = []
        
        for i, tour in enumerate(tours_data):
            tour_title = tour.get('title', f'Tour {i+1}')
            
            # Check minimum_price field
            if 'minimum_price' in tour and tour['minimum_price'] is not None:
                min_price = tour['minimum_price']
                minimum_prices.append(min_price)
                tours_with_minimum_price += 1
                print(f"   💵 {tour_title}: minimum_price = ₺{min_price}")
            
            # Check base_price field
            if 'base_price' in tour and tour['base_price'] is not None:
                base_price = tour['base_price']
                base_prices.append(base_price)
                tours_with_base_price += 1
                print(f"   💴 {tour_title}: base_price = ₺{base_price}")
        
        total_tours = len(tours_data)
        
        # Summary
        if tours_with_minimum_price > 0:
            min_price_range = f"₺{min(minimum_prices)} - ₺{max(minimum_prices)}"
            self.log_test(
                "Pricing Fields - Minimum Price", 
                True, 
                f"{tours_with_minimum_price}/{total_tours} tours have minimum_price. Range: {min_price_range}"
            )
        else:
            self.log_test(
                "Pricing Fields - Minimum Price", 
                False, 
                "", 
                "No tours have minimum_price fields"
            )
        
        if tours_with_base_price > 0:
            base_price_range = f"₺{min(base_prices)} - ₺{max(base_prices)}"
            self.log_test(
                "Pricing Fields - Base Price", 
                True, 
                f"{tours_with_base_price}/{total_tours} tours have base_price. Range: {base_price_range}"
            )
        else:
            self.log_test(
                "Pricing Fields - Base Price", 
                False, 
                "", 
                "No tours have base_price fields"
            )
        
        return tours_with_minimum_price > 0 or tours_with_base_price > 0

    def test_sample_tour_data(self, tours_data):
        """Test with sample tour data - create realistic Turkish tour examples"""
        print("\n🏛️ Testing Sample Tour Data Quality")
        
        if not tours_data:
            self.log_test("Sample Tour Data Test", False, "", "No tour data available")
            return False
        
        # Analyze tour data quality
        tours_with_complete_data = 0
        required_fields = ['id', 'title', 'description', 'location']
        optional_fields = ['images', 'category', 'duration_days', 'base_price', 'minimum_price']
        
        for i, tour in enumerate(tours_data):
            tour_title = tour.get('title', f'Tour {i+1}')
            
            # Check required fields
            missing_required = [field for field in required_fields if not tour.get(field)]
            
            # Check optional fields
            present_optional = [field for field in optional_fields if tour.get(field) is not None]
            
            if not missing_required:
                tours_with_complete_data += 1
                print(f"   ✅ {tour_title}: Complete data ({len(present_optional)}/{len(optional_fields)} optional fields)")
            else:
                print(f"   ⚠️  {tour_title}: Missing required fields: {missing_required}")
        
        total_tours = len(tours_data)
        completion_rate = (tours_with_complete_data / total_tours * 100) if total_tours > 0 else 0
        
        if completion_rate >= 80:
            self.log_test(
                "Sample Tour Data Quality", 
                True, 
                f"{tours_with_complete_data}/{total_tours} tours have complete data ({completion_rate:.1f}%)"
            )
            return True
        else:
            self.log_test(
                "Sample Tour Data Quality", 
                False, 
                "", 
                f"Only {tours_with_complete_data}/{total_tours} tours have complete data ({completion_rate:.1f}%)"
            )
            return False

    def test_tour_dates_integration(self, tours_data):
        """Test tour dates integration for pricing"""
        print("\n📅 Testing Tour Dates Integration")
        
        if not tours_data or len(tours_data) == 0:
            self.log_test("Tour Dates Integration", False, "", "No tour data available")
            return False
        
        # Test first tour's dates
        first_tour = tours_data[0]
        tour_id = first_tour.get('id')
        tour_title = first_tour.get('title', 'Unknown Tour')
        
        if not tour_id:
            self.log_test("Tour Dates Integration", False, "", "First tour has no ID")
            return False
        
        try:
            response = requests.get(f"{self.api_url}/tours/{tour_id}/dates", timeout=10)
            
            if response.status_code == 200:
                dates_data = response.json()
                
                if isinstance(dates_data, list) and len(dates_data) > 0:
                    date_count = len(dates_data)
                    
                    # Check for pricing fields in dates
                    dates_with_pricing = 0
                    pricing_fields = ['single_cabin_price', 'double_cabin_price', 'person_price', 'price']
                    
                    for date in dates_data:
                        has_pricing = any(date.get(field) is not None and date.get(field) > 0 for field in pricing_fields)
                        if has_pricing:
                            dates_with_pricing += 1
                    
                    self.log_test(
                        "Tour Dates Integration", 
                        True, 
                        f"Tour '{tour_title}' has {date_count} dates, {dates_with_pricing} with pricing data"
                    )
                    return True
                else:
                    self.log_test(
                        "Tour Dates Integration", 
                        False, 
                        "", 
                        f"Tour '{tour_title}' has no available dates"
                    )
                    return False
            else:
                self.log_test(
                    "Tour Dates Integration", 
                    False, 
                    "", 
                    f"Tour dates API returned {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Tour Dates Integration", 
                False, 
                "", 
                f"Error testing tour dates: {str(e)}"
            )
            return False

    def run_turkish_review_tests(self):
        """Run all tests requested in Turkish review"""
        print("🇹🇷 Turkish Backend API Test - Tour Platform")
        print("=" * 60)
        print("Testing specific requirements from Turkish review:")
        print("1. GET /api/tours endpoint functionality")
        print("2. Duration and duration_unit fields verification")
        print("3. Minimum_price and base_price fields verification")
        print("4. Sample tour data quality testing")
        print("=" * 60)
        
        # Test 1: Backend Health
        print("\n🏥 Phase 1: Backend Health Check")
        health_ok = self.test_backend_health()
        
        if not health_ok:
            print("\n❌ Backend is not accessible - cannot continue tests")
            self.print_final_results()
            return
        
        # Test 2: Tours Endpoint
        print("\n🎯 Phase 2: Tours Endpoint Testing")
        tours_ok, tours_data = self.test_tours_endpoint()
        
        if not tours_ok:
            print("\n❌ Tours endpoint failed - cannot continue with data tests")
            self.print_final_results()
            return
        
        if not tours_data or len(tours_data) == 0:
            print("\n⚠️  Tours endpoint works but returned no data")
            print("   This explains why frontend shows '0 tur bulundu'")
            self.log_test(
                "Tours Data Availability", 
                False, 
                "", 
                "Tours API returns empty list - no tours in database"
            )
            self.print_final_results()
            return
        
        # Test 3: Duration Fields
        print("\n🕒 Phase 3: Duration Fields Testing")
        self.test_duration_fields(tours_data)
        
        # Test 4: Pricing Fields
        print("\n💰 Phase 4: Pricing Fields Testing")
        self.test_pricing_fields(tours_data)
        
        # Test 5: Sample Tour Data Quality
        print("\n🏛️ Phase 5: Sample Tour Data Quality")
        self.test_sample_tour_data(tours_data)
        
        # Test 6: Tour Dates Integration
        print("\n📅 Phase 6: Tour Dates Integration")
        self.test_tour_dates_integration(tours_data)
        
        # Final Results
        self.print_final_results()

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 60)
        print("📊 TURKISH REVIEW TEST RESULTS")
        print("=" * 60)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        # Status assessment
        if success_rate >= 90:
            print("\n🎉 EXCELLENT: Backend APIs working perfectly!")
        elif success_rate >= 70:
            print("\n✅ GOOD: Most functionality working, minor issues")
        elif success_rate >= 50:
            print("\n⚠️  PARTIAL: Some functionality working, needs attention")
        else:
            print("\n🚨 CRITICAL: Major issues detected, immediate action needed")
        
        # Show failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test_name']}: {test['error']}")
        
        # Turkish Review Specific Summary
        print("\n🇹🇷 TURKISH REVIEW SPECIFIC FINDINGS:")
        print("=" * 40)
        
        # Check if main issues are resolved
        tours_working = any(test['test_name'] == 'GET /api/tours - Basic Functionality' and test['success'] for test in self.test_results)
        duration_working = any('Duration Fields' in test['test_name'] and test['success'] for test in self.test_results)
        pricing_working = any('Pricing Fields' in test['test_name'] and test['success'] for test in self.test_results)
        
        if tours_working:
            print("✅ GET /api/tours endpoint is working")
        else:
            print("❌ GET /api/tours endpoint has issues")
        
        if duration_working:
            print("✅ Duration fields are present in tour data")
        else:
            print("❌ Duration fields missing or incomplete")
        
        if pricing_working:
            print("✅ Pricing fields are present in tour data")
        else:
            print("❌ Pricing fields missing or incomplete")
        
        # Specific recommendation for Turkish review
        print("\n💡 RECOMMENDATIONS:")
        if not tours_working:
            print("   • Fix GET /api/tours endpoint - this is blocking frontend")
        if not duration_working:
            print("   • Add duration/duration_unit fields to tour data")
        if not pricing_working:
            print("   • Add minimum_price/base_price fields to tour data")
        
        print("\n📝 Test completed for Turkish review requirements")

if __name__ == "__main__":
    tester = TurkishTourAPITester()
    tester.run_turkish_review_tests()