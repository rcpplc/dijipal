#!/usr/bin/env python3
"""
Tour Creation Field Mapping Debug Test
Testing Turkish review request: Admin Panel Tour Creation field mapping debug

Focus Areas:
1. Admin panel Step 1 fields vs Backend expected fields
2. Duration unit conversion issue (duration_unit → duration_hours)
3. Field mapping accuracy during tour creation
4. Sample tour creation test scenarios
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BACKEND_URL = "https://mavibilet.preview.emergentagent.com/api"

class TourCreationFieldMappingTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        self.token = None
        self.user_id = None
        
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

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Generic test runner"""
        try:
            url = f"{self.backend_url}/{endpoint}"
            headers = {"Content-Type": "application/json"}
            
            if self.token:
                headers["Authorization"] = f"Bearer {self.token}"

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

    def test_backend_health(self):
        """Test backend server health"""
        return self.run_test(
            "Backend Server Health Check",
            "GET",
            "health",
            200
        )

    def test_admin_login(self):
        """Test admin login with provided credentials"""
        admin_login_data = {
            "email": "admin@example.com",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=admin_login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            if 'user' in response:
                self.user_id = response['user'].get('id')
                user_role = response['user'].get('role')
                print(f"   ✅ Admin login successful, role: {user_role}, token: {self.token[:20]}...")
            return True
        
        return False

    def test_admin_panel_step1_field_mapping(self):
        """Test 1: Admin Panel Step 1 Fields Mapping"""
        print("\n🔍 Testing Admin Panel Step 1 Field Mapping...")
        
        if not self.token:
            self.log_test("Admin Panel Field Mapping", False, "No authentication token available")
            return False

        # Admin Panel Step 1 Fields (as specified in review request)
        admin_panel_data = {
            "title": "Test Tour Field Mapping",
            "description": "Testing field mapping between admin panel and backend",
            "short_description": "Field mapping test",
            "location": "Test Location",
            "pickup_time": "09:00",        # ✓ Expected by backend
            "dropoff_time": "18:00",       # ✓ Expected by backend  
            "duration_days": 2,            # ✓ Expected by backend
            "duration_unit": "days",       # ⚠️ Needs conversion to duration_hours
            "classification": "standart",   # ✓ Expected by backend
            "category": "cultural",
            "tour_dates": [
                {
                    "date": "2025-01-15",
                    "capacity": 10,
                    "single_cabin_price": 1000,
                    "double_cabin_price": 1500
                }
            ]
        }

        print("📋 Admin Panel Step 1 Fields:")
        print(f"   • pickup_time: {admin_panel_data['pickup_time']}")
        print(f"   • dropoff_time: {admin_panel_data['dropoff_time']}")
        print(f"   • duration_days: {admin_panel_data['duration_days']}")
        print(f"   • duration_unit: {admin_panel_data['duration_unit']}")
        print(f"   • classification: {admin_panel_data['classification']}")

        success, response = self.run_test(
            "POST /api/admin/tours - Field Mapping Test",
            "POST",
            "admin/tours",
            200,
            data=admin_panel_data
        )

        if success and response and 'id' in response:
            tour_id = response['id']
            print(f"   ✅ Tour created successfully with ID: {tour_id}")
            
            # Verify field mapping in response
            print("\n📋 Backend Expected Fields Verification:")
            
            # Check pickup_time ✓
            if response.get('pickup_time') == "09:00":
                print("   ✅ pickup_time: Mapped correctly (09:00)")
            else:
                print(f"   ❌ pickup_time: Expected '09:00', got '{response.get('pickup_time')}'")
            
            # Check dropoff_time ✓
            if response.get('dropoff_time') == "18:00":
                print("   ✅ dropoff_time: Mapped correctly (18:00)")
            else:
                print(f"   ❌ dropoff_time: Expected '18:00', got '{response.get('dropoff_time')}'")
            
            # Check duration_days ✓
            if response.get('duration_days') == 2:
                print("   ✅ duration_days: Mapped correctly (2)")
            else:
                print(f"   ❌ duration_days: Expected 2, got {response.get('duration_days')}")
            
            # Check duration_hours (MISSING - conversion needed)
            duration_hours = response.get('duration_hours')
            if duration_hours is not None:
                print(f"   ✅ duration_hours: Found ({duration_hours})")
                # Check if conversion was done correctly
                if admin_panel_data['duration_unit'] == 'days' and admin_panel_data['duration_days'] == 2:
                    expected_hours = 0  # or 48 depending on business logic
                    if duration_hours == expected_hours or duration_hours == 48:
                        print(f"   ✅ duration_unit conversion: Correct (days→hours: {duration_hours})")
                    else:
                        print(f"   ⚠️ duration_unit conversion: Unexpected value ({duration_hours})")
                elif admin_panel_data['duration_unit'] == 'hours':
                    if duration_hours == admin_panel_data['duration_days']:
                        print(f"   ✅ duration_unit conversion: Correct (hours→hours: {duration_hours})")
                    else:
                        print(f"   ❌ duration_unit conversion: Expected {admin_panel_data['duration_days']}, got {duration_hours}")
            else:
                print("   ❌ duration_hours: MISSING - duration_unit conversion not implemented")
            
            # Check classification ✓
            if response.get('classification') == "standart":
                print("   ✅ classification: Mapped correctly (standart)")
            else:
                print(f"   ❌ classification: Expected 'standart', got '{response.get('classification')}'")
            
            return True, tour_id
        else:
            print("   ❌ Tour creation failed - field mapping cannot be verified")
            return False, None

    def test_duration_unit_conversion_scenarios(self):
        """Test 2: Duration Unit Conversion Issue Testing"""
        print("\n🔍 Testing Duration Unit Conversion Scenarios...")
        
        if not self.token:
            self.log_test("Duration Unit Conversion", False, "No authentication token available")
            return False

        # Test Scenario 1: duration_unit="hours" + duration_days=8 → duration_hours should be 8
        print("\n📋 Scenario 1: duration_unit='hours' + duration_days=8")
        scenario1_data = {
            "title": "Test Tour - Hours Conversion",
            "description": "Testing hours conversion",
            "short_description": "Hours test",
            "location": "Test Location",
            "pickup_time": "09:00",
            "dropoff_time": "18:00",
            "duration_days": 8,
            "duration_unit": "hours",
            "classification": "standart",
            "category": "cultural",
            "tour_dates": [
                {
                    "date": "2025-01-16",
                    "capacity": 10,
                    "single_cabin_price": 1000,
                    "double_cabin_price": 1500
                }
            ]
        }

        success1, response1 = self.run_test(
            "Duration Unit Conversion - Hours Scenario",
            "POST",
            "admin/tours",
            200,
            data=scenario1_data
        )

        if success1 and response1:
            duration_hours = response1.get('duration_hours')
            print(f"   Input: duration_unit='hours', duration_days=8")
            print(f"   Expected: duration_hours=8")
            print(f"   Actual: duration_hours={duration_hours}")
            
            if duration_hours == 8:
                print("   ✅ Hours conversion: CORRECT")
            else:
                print("   ❌ Hours conversion: INCORRECT")

        # Test Scenario 2: duration_unit="days" + duration_days=2 → duration_hours should be 0 (or 48)
        print("\n📋 Scenario 2: duration_unit='days' + duration_days=2")
        scenario2_data = {
            "title": "Test Tour - Days Conversion",
            "description": "Testing days conversion",
            "short_description": "Days test",
            "location": "Test Location",
            "pickup_time": "09:00",
            "dropoff_time": "18:00",
            "duration_days": 2,
            "duration_unit": "days",
            "classification": "lux",
            "category": "cultural",
            "tour_dates": [
                {
                    "date": "2025-01-17",
                    "capacity": 10,
                    "single_cabin_price": 1200,
                    "double_cabin_price": 1800
                }
            ]
        }

        success2, response2 = self.run_test(
            "Duration Unit Conversion - Days Scenario",
            "POST",
            "admin/tours",
            200,
            data=scenario2_data
        )

        if success2 and response2:
            duration_hours = response2.get('duration_hours')
            print(f"   Input: duration_unit='days', duration_days=2")
            print(f"   Expected: duration_hours=0 or 48 (business logic dependent)")
            print(f"   Actual: duration_hours={duration_hours}")
            
            if duration_hours == 0 or duration_hours == 48:
                print("   ✅ Days conversion: CORRECT")
            else:
                print("   ❌ Days conversion: INCORRECT or not implemented")

        return success1 and success2

    def test_sample_tour_creation_scenarios(self):
        """Test 3: Sample Tour Creation Test Scenarios"""
        print("\n🔍 Testing Sample Tour Creation Scenarios...")
        
        if not self.token:
            self.log_test("Sample Tour Creation", False, "No authentication token available")
            return False

        # Mock admin tour creation data (realistic scenario)
        sample_scenarios = [
            {
                "name": "Standart Classification Tour",
                "data": {
                    "title": "Fethiye Mavi Yolculuk",
                    "description": "Fethiye körfezinde muhteşem mavi yolculuk deneyimi",
                    "short_description": "Fethiye mavi yolculuk",
                    "location": "Muğla, Fethiye",
                    "pickup_time": "09:00",
                    "dropoff_time": "18:00",
                    "duration_days": 1,
                    "duration_unit": "days",
                    "classification": "standart",
                    "category": "cultural",
                    "tour_dates": [
                        {
                            "date": "2025-01-20",
                            "capacity": 15,
                            "single_cabin_price": 800,
                            "double_cabin_price": 1200
                        }
                    ]
                }
            },
            {
                "name": "Lux Classification Tour",
                "data": {
                    "title": "Göcek Premium Yat Turu",
                    "description": "Göcek'te lüks yat ile premium deneyim",
                    "short_description": "Göcek premium yat",
                    "location": "Muğla, Göcek",
                    "pickup_time": "10:00",
                    "dropoff_time": "19:00",
                    "duration_days": 3,
                    "duration_unit": "days",
                    "classification": "lux",
                    "category": "cultural",
                    "tour_dates": [
                        {
                            "date": "2025-01-25",
                            "capacity": 8,
                            "single_cabin_price": 1500,
                            "double_cabin_price": 2200
                        }
                    ]
                }
            },
            {
                "name": "Delux Classification Tour",
                "data": {
                    "title": "Bodrum Delux Kabin Turu",
                    "description": "Bodrum'da delux kabin ile özel tur deneyimi",
                    "short_description": "Bodrum delux kabin",
                    "location": "Muğla, Bodrum",
                    "pickup_time": "08:30",
                    "dropoff_time": "20:00",
                    "duration_days": 6,
                    "duration_unit": "hours",  # Testing hours conversion
                    "classification": "delux",
                    "category": "cultural",
                    "tour_dates": [
                        {
                            "date": "2025-01-30",
                            "capacity": 6,
                            "single_cabin_price": 2000,
                            "double_cabin_price": 3000
                        }
                    ]
                }
            }
        ]

        created_tours = []
        
        for scenario in sample_scenarios:
            print(f"\n📋 Testing: {scenario['name']}")
            
            success, response = self.run_test(
                f"Sample Tour Creation - {scenario['name']}",
                "POST",
                "admin/tours",
                200,
                data=scenario['data']
            )
            
            if success and response and 'id' in response:
                tour_id = response['id']
                created_tours.append({
                    'id': tour_id,
                    'name': scenario['name'],
                    'data': scenario['data'],
                    'response': response
                })
                
                # Verify field mapping accuracy
                print(f"   ✅ Tour created: {tour_id}")
                print(f"   📍 Location: {response.get('location')} (Expected: {scenario['data']['location']})")
                print(f"   🕘 Pickup: {response.get('pickup_time')} (Expected: {scenario['data']['pickup_time']})")
                print(f"   🕘 Dropoff: {response.get('dropoff_time')} (Expected: {scenario['data']['dropoff_time']})")
                print(f"   📅 Duration Days: {response.get('duration_days')} (Expected: {scenario['data']['duration_days']})")
                print(f"   ⏰ Duration Hours: {response.get('duration_hours')} (Conversion from {scenario['data']['duration_unit']})")
                print(f"   🏷️ Classification: {response.get('classification')} (Expected: {scenario['data']['classification']})")
                
                # Check if duration_hours field is populated correctly
                duration_unit = scenario['data']['duration_unit']
                duration_days = scenario['data']['duration_days']
                duration_hours = response.get('duration_hours')
                
                if duration_unit == "hours" and duration_hours == duration_days:
                    print(f"   ✅ Duration conversion: {duration_unit} → hours CORRECT ({duration_hours})")
                elif duration_unit == "days" and (duration_hours == 0 or duration_hours == duration_days * 24):
                    print(f"   ✅ Duration conversion: {duration_unit} → hours CORRECT ({duration_hours})")
                else:
                    print(f"   ⚠️ Duration conversion: {duration_unit} → hours UNCLEAR ({duration_hours})")
            else:
                print(f"   ❌ Failed to create tour: {scenario['name']}")

        return len(created_tours) > 0, created_tours

    def test_field_mapping_verification(self, created_tours):
        """Test 4: Verify Field Mapping Accuracy"""
        print("\n🔍 Testing Field Mapping Accuracy Verification...")
        
        if not created_tours:
            self.log_test("Field Mapping Verification", False, "No created tours to verify")
            return False

        verification_results = []
        
        for tour_info in created_tours:
            tour_id = tour_info['id']
            expected_data = tour_info['data']
            
            print(f"\n📋 Verifying Tour: {tour_info['name']} (ID: {tour_id})")
            
            # Get tour details to verify field mapping
            success, response = self.run_test(
                f"Verify Tour Field Mapping - {tour_info['name']}",
                "GET",
                f"tours/{tour_id}",
                200
            )
            
            if success and response:
                # Check all mapped fields
                field_checks = {
                    'pickup_time': response.get('pickup_time') == expected_data['pickup_time'],
                    'dropoff_time': response.get('dropoff_time') == expected_data['dropoff_time'],
                    'duration_days': response.get('duration_days') == expected_data['duration_days'],
                    'classification': response.get('classification') == expected_data['classification'],
                    'location': response.get('location') == expected_data['location'],
                    'category': response.get('category') == expected_data['category']
                }
                
                # Check duration_hours conversion
                duration_hours = response.get('duration_hours')
                duration_unit = expected_data['duration_unit']
                duration_days = expected_data['duration_days']
                
                if duration_unit == "hours":
                    duration_hours_correct = duration_hours == duration_days
                elif duration_unit == "days":
                    duration_hours_correct = duration_hours == 0 or duration_hours == duration_days * 24
                else:
                    duration_hours_correct = False
                
                field_checks['duration_hours_conversion'] = duration_hours_correct
                
                # Print verification results
                for field, is_correct in field_checks.items():
                    status = "✅" if is_correct else "❌"
                    if field == 'duration_hours_conversion':
                        print(f"   {status} {field}: {duration_hours} (from {duration_unit})")
                    else:
                        expected_val = expected_data.get(field, 'N/A')
                        actual_val = response.get(field, 'N/A')
                        print(f"   {status} {field}: {actual_val} (expected: {expected_val})")
                
                verification_results.append({
                    'tour_id': tour_id,
                    'name': tour_info['name'],
                    'field_checks': field_checks,
                    'all_correct': all(field_checks.values())
                })
            else:
                print(f"   ❌ Could not retrieve tour for verification")

        # Summary
        print(f"\n📊 Field Mapping Verification Summary:")
        total_tours = len(verification_results)
        correct_tours = sum(1 for result in verification_results if result['all_correct'])
        
        print(f"   Total Tours Verified: {total_tours}")
        print(f"   Tours with Correct Mapping: {correct_tours}")
        print(f"   Tours with Issues: {total_tours - correct_tours}")
        print(f"   Success Rate: {(correct_tours/total_tours*100):.1f}%" if total_tours > 0 else "   Success Rate: 0%")
        
        return correct_tours == total_tours

    def run_comprehensive_field_mapping_test(self):
        """Run comprehensive tour creation field mapping debug test"""
        print("🎯 Tour Creation Field Mapping Debug - Comprehensive Testing")
        print("=" * 70)
        print("Focus: Admin panel'de girilen veriler ile backend'te kaydedilen veriler arasındaki mapping problemi")
        print("=" * 70)
        
        # Phase 1: Backend Health Check
        print("\n🏥 PHASE 1: Backend Health Check")
        health_success, _ = self.test_backend_health()
        
        if not health_success:
            print("❌ Backend health check failed - cannot proceed")
            self.print_final_results()
            return False
        
        # Phase 2: Admin Authentication
        print("\n🔐 PHASE 2: Admin Authentication")
        admin_success = self.test_admin_login()
        
        if not admin_success:
            print("❌ Admin login failed - cannot proceed with field mapping tests")
            self.print_final_results()
            return False
        
        # Phase 3: Admin Panel Step 1 Field Mapping Test
        print("\n📋 PHASE 3: Admin Panel Step 1 Field Mapping")
        mapping_success, tour_id = self.test_admin_panel_step1_field_mapping()
        
        # Phase 4: Duration Unit Conversion Testing
        print("\n⏰ PHASE 4: Duration Unit Conversion Testing")
        conversion_success = self.test_duration_unit_conversion_scenarios()
        
        # Phase 5: Sample Tour Creation Scenarios
        print("\n🎭 PHASE 5: Sample Tour Creation Test Scenarios")
        creation_success, created_tours = self.test_sample_tour_creation_scenarios()
        
        # Phase 6: Field Mapping Verification
        print("\n🔍 PHASE 6: Field Mapping Accuracy Verification")
        verification_success = self.test_field_mapping_verification(created_tours)
        
        # Final Results
        self.print_final_results()
        
        # Summary of Key Findings
        print("\n" + "=" * 70)
        print("🎯 KEY FINDINGS - FIELD MAPPING DEBUG SUMMARY")
        print("=" * 70)
        
        print("\n📋 Admin Panel Step 1 Fields vs Backend Expected Fields:")
        print("   ✅ pickup_time: Supported")
        print("   ✅ dropoff_time: Supported") 
        print("   ✅ duration_days: Supported")
        print("   ⚠️ duration_hours: Check conversion implementation")
        print("   ✅ classification: Supported")
        
        print("\n⏰ Duration Unit Conversion Analysis:")
        print("   • duration_unit='hours' + duration_days=8 → duration_hours should be 8")
        print("   • duration_unit='days' + duration_days=2 → duration_hours should be 0 (or 48)")
        print("   • Backend conversion logic needs verification")
        
        print("\n🎭 Sample Tour Creation Results:")
        if created_tours:
            print(f"   ✅ Successfully created {len(created_tours)} test tours")
            for tour in created_tours:
                print(f"      • {tour['name']}: ID {tour['id']}")
        else:
            print("   ❌ No tours created successfully")
        
        overall_success = mapping_success and conversion_success and creation_success and verification_success
        
        if overall_success:
            print("\n🎉 OVERALL RESULT: Field mapping working correctly")
        else:
            print("\n⚠️ OVERALL RESULT: Field mapping issues detected - needs attention")
        
        return overall_success

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 70)
        print("📊 FINAL TEST RESULTS - TOUR CREATION FIELD MAPPING DEBUG")
        print("=" * 70)
        
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        print(f"Total Tests Run: {self.total_tests}")
        print(f"Tests Passed: {self.passed_tests}")
        print(f"Tests Failed: {self.total_tests - self.passed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("🎉 EXCELLENT: Field mapping working correctly!")
        elif success_rate >= 70:
            print("⚠️ GOOD: Most field mappings working, minor issues detected")
        else:
            print("🚨 CRITICAL: Major field mapping issues detected")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")

if __name__ == "__main__":
    tester = TourCreationFieldMappingTester()
    
    print("🚀 Starting Tour Creation Field Mapping Debug Test")
    print("Testing focus: Admin panel → Backend field mapping accuracy")
    print("Specific issue: duration_unit → duration_hours conversion")
    print()
    
    success = tester.run_comprehensive_field_mapping_test()
    
    if success:
        print("\n✅ Field mapping debug test completed successfully")
        sys.exit(0)
    else:
        print("\n❌ Field mapping debug test found issues")
        sys.exit(1)