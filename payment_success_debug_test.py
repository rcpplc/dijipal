#!/usr/bin/env python3
"""
PaymentSuccessPage Data Mapping Debug Test
Testing specific tour data analysis for incorrect field mapping

SPECIFIC TOUR DATA ANALYSIS:
- Tour URL: /tur/tum-tekne-sabit-fiyattum-tekne-sabit-fiyattum-tekne-sabit-fiyattum-tekne-sabit-fiyat
- Expected vs Actual comparison for duration, classification, pickup/dropoff times
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BACKEND_URL = "https://payment-modal-fix.preview.emergentagent.com/api"

class PaymentSuccessDebugTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        self.token = None
        
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

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        try:
            url = f"{self.backend_url}/{endpoint}"
            test_headers = {}
            
            if self.token:
                test_headers["Authorization"] = f"Bearer {self.token}"
            
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json() if response.content else {}
                    self.log_test(name, True, f"Status: {response.status_code}")
                    return True, response_data
                except:
                    self.log_test(name, True, f"Status: {response.status_code}, No JSON response")
                    return True, {}
            else:
                try:
                    error_data = response.json() if response.content else {}
                    self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}", error_data)
                except:
                    self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}", {"error": response.text[:200]})
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
        print("🔍 Testing Backend Server Health...")
        
        try:
            response = requests.get(f"{self.backend_url.replace('/api', '')}/health", timeout=10)
            if response.status_code == 200:
                self.log_test("Backend Health Check", True, "Backend server is accessible")
                return True
            else:
                self.log_test("Backend Health Check", False, f"Health endpoint returned {response.status_code}")
                return False
        except Exception as e:
            # Try basic tours endpoint as fallback
            try:
                response = requests.get(f"{self.backend_url}/tours", timeout=10)
                if response.status_code == 200:
                    self.log_test("Backend Health Check", True, "Backend accessible via tours endpoint")
                    return True
                else:
                    self.log_test("Backend Health Check", False, f"Tours endpoint returned {response.status_code}")
                    return False
            except Exception as e2:
                self.log_test("Backend Health Check", False, f"Backend not accessible: {str(e2)}")
                return False

    def test_specific_tour_lookup(self):
        """Test finding the specific tour mentioned in the URL"""
        print("🔍 Testing Specific Tour Lookup...")
        
        # The tour URL slug from the request
        tour_slug = "tum-tekne-sabit-fiyattum-tekne-sabit-fiyattum-tekne-sabit-fiyattum-tekne-sabit-fiyat"
        
        # First, try direct slug lookup
        success, response = self.run_test(
            f"Get Tour by Slug: {tour_slug}",
            "GET",
            f"tours/{tour_slug}",
            200
        )
        
        if success and response:
            print(f"   ✅ Found tour via slug lookup")
            return True, response
        
        # If slug lookup fails, search through all tours
        print("   ℹ️  Slug lookup failed, searching through all tours...")
        
        success, tours_response = self.run_test(
            "Get All Tours for Search",
            "GET",
            "tours",
            200
        )
        
        if not success or not tours_response:
            self.log_test("Tour Search", False, "Could not retrieve tours list")
            return False, None
        
        # Search for tours with similar titles or containing "tekne" and "sabit fiyat"
        matching_tours = []
        for tour in tours_response:
            title = tour.get('title', '').lower()
            if ('tekne' in title and 'sabit' in title) or 'tum-tekne' in title:
                matching_tours.append(tour)
        
        if matching_tours:
            print(f"   ✅ Found {len(matching_tours)} matching tours:")
            for tour in matching_tours:
                print(f"      • ID: {tour.get('id')} - Title: {tour.get('title')}")
            
            # Return the first matching tour
            return True, matching_tours[0]
        else:
            # If no matches, just return the first tour for testing
            if tours_response:
                print(f"   ⚠️  No exact matches found, using first available tour for testing")
                print(f"      • ID: {tours_response[0].get('id')} - Title: {tours_response[0].get('title')}")
                return True, tours_response[0]
            else:
                self.log_test("Tour Search", False, "No tours found in database")
                return False, None

    def test_all_tours_data_analysis(self):
        """Analyze all tours to find any with incorrect data mapping"""
        print("🔍 Testing All Tours Data Analysis...")
        
        success, tours_response = self.run_test(
            "Get All Tours for Analysis",
            "GET",
            "tours",
            200
        )
        
        if not success or not tours_response:
            self.log_test("All Tours Analysis", False, "Could not retrieve tours list")
            return False, []
        
        print(f"   ✅ Found {len(tours_response)} tours to analyze")
        
        problematic_tours = []
        
        for tour in tours_response:
            tour_id = tour.get('id')
            title = tour.get('title')
            
            # Check for potential mapping issues
            duration_unit = tour.get('duration_unit')
            duration_days = tour.get('duration_days')
            duration_hours = tour.get('duration_hours')
            classification = tour.get('classification')
            pickup_time = tour.get('pickup_time')
            dropoff_time = tour.get('dropoff_time')
            
            issues = []
            
            # Check duration mapping
            if duration_unit == 'hours' and duration_hours != duration_days:
                issues.append(f"duration mismatch: unit=hours, days={duration_days}, hours={duration_hours}")
            
            # Check for default values that might indicate incorrect data
            if classification == 'standart' and pickup_time == '09:00' and dropoff_time == '18:00':
                if duration_hours == 1 or (duration_unit == 'days' and duration_days == 1):
                    issues.append("has default values: standart, 09:00-18:00, 1 hour/day")
            
            if issues:
                problematic_tours.append({
                    'id': tour_id,
                    'title': title,
                    'issues': issues,
                    'data': {
                        'duration_unit': duration_unit,
                        'duration_days': duration_days,
                        'duration_hours': duration_hours,
                        'classification': classification,
                        'pickup_time': pickup_time,
                        'dropoff_time': dropoff_time
                    }
                })
        
        if problematic_tours:
            print(f"   ⚠️  Found {len(problematic_tours)} tours with potential data issues:")
            for tour in problematic_tours[:5]:  # Show first 5
                print(f"      • {tour['title']}")
                print(f"        ID: {tour['id']}")
                for issue in tour['issues']:
                    print(f"        Issue: {issue}")
                print(f"        Data: {tour['data']}")
                print()
        else:
            print("   ✅ No tours found with obvious data mapping issues")
        
        return True, problematic_tours

    def analyze_tour_data_structure(self, tour_data):
        """Analyze the tour data structure for field mapping issues"""
        print("🔍 Analyzing Tour Data Structure...")
        
        tour_id = tour_data.get('id')
        title = tour_data.get('title')
        
        print(f"   📋 Tour Analysis: {title}")
        print(f"   📋 Tour ID: {tour_id}")
        
        # Check critical fields mentioned in the issue
        critical_fields = {
            'duration_unit': tour_data.get('duration_unit'),
            'duration_days': tour_data.get('duration_days'), 
            'duration_hours': tour_data.get('duration_hours'),
            'pickup_time': tour_data.get('pickup_time'),
            'dropoff_time': tour_data.get('dropoff_time'),
            'classification': tour_data.get('classification')
        }
        
        print("   📋 Critical Fields Analysis:")
        for field, value in critical_fields.items():
            print(f"      • {field}: {value}")
        
        # Expected vs Actual comparison based on the issue report
        expected_values = {
            'duration_hours': 5,  # Should be "5 Saat" 
            'classification': 'delux',  # Should be "Delux"
            'pickup_time': '12:00',  # Should be 12:00
            'dropoff_time': '21:00'  # Should be 21:00
        }
        
        actual_values = {
            'duration_hours': critical_fields.get('duration_hours'),
            'classification': critical_fields.get('classification'),
            'pickup_time': critical_fields.get('pickup_time'),
            'dropoff_time': critical_fields.get('dropoff_time')
        }
        
        print("   📋 Expected vs Actual Comparison:")
        issues_found = []
        
        for field, expected in expected_values.items():
            actual = actual_values.get(field)
            status = "✅" if actual == expected else "❌"
            print(f"      {status} {field}: Expected={expected}, Actual={actual}")
            
            if actual != expected:
                issues_found.append(f"{field}: expected {expected}, got {actual}")
        
        if issues_found:
            self.log_test("Tour Data Field Mapping", False, f"Field mapping issues found: {'; '.join(issues_found)}")
            return False, issues_found
        else:
            self.log_test("Tour Data Field Mapping", True, "All fields match expected values")
            return True, []

    def test_tour_dates_data(self, tour_id):
        """Test tour dates data structure"""
        print("🔍 Testing Tour Dates Data Structure...")
        
        success, dates_response = self.run_test(
            f"Get Tour Dates for {tour_id}",
            "GET",
            f"tours/{tour_id}/dates",
            200
        )
        
        if not success or not dates_response:
            self.log_test("Tour Dates Analysis", False, "Could not retrieve tour dates")
            return False, None
        
        print(f"   ✅ Found {len(dates_response)} tour dates")
        
        # Analyze first date for pricing structure
        if dates_response:
            first_date = dates_response[0]
            print("   📋 First Tour Date Analysis:")
            
            date_fields = {
                'id': first_date.get('id'),
                'start_date': first_date.get('start_date'),
                'single_cabin_price': first_date.get('single_cabin_price'),
                'double_cabin_price': first_date.get('double_cabin_price'),
                'available_cabins': first_date.get('available_cabins')
            }
            
            for field, value in date_fields.items():
                print(f"      • {field}: {value}")
            
            return True, dates_response
        
        return False, None

    def simulate_booking_data_structure(self, tour_data, tour_dates):
        """Simulate booking data structure that would be sent to PaymentSuccessPage"""
        print("🔍 Simulating Booking Data Structure...")
        
        if not tour_dates:
            self.log_test("Booking Simulation", False, "No tour dates available for booking simulation")
            return False, None
        
        # Simulate a booking object that would be created
        selected_date = tour_dates[0]
        
        booking_data = {
            'id': 'mock-booking-id',
            'tour_id': tour_data.get('id'),
            'tour_date_id': selected_date.get('id'),
            'participants': 1,
            'cabin_type': 'single',
            'total_price': selected_date.get('single_cabin_price', 0),
            'tour': tour_data,  # This is where the mapping issue might occur
            'tourId': tour_data.get('id'),  # Alternative field name
            'customer_info': {
                'full_name': 'Test Customer',
                'email': 'test@example.com'
            }
        }
        
        print("   📋 Simulated Booking Data Structure:")
        print(f"      • Booking ID: {booking_data['id']}")
        print(f"      • Tour ID: {booking_data['tour_id']}")
        print(f"      • Selected Date: {selected_date.get('start_date')}")
        print(f"      • Cabin Type: {booking_data['cabin_type']}")
        print(f"      • Total Price: {booking_data['total_price']}")
        
        # Check if tour object vs tourId field difference could cause issues
        print("   📋 Data Mapping Analysis:")
        print(f"      • booking.tour exists: {'tour' in booking_data}")
        print(f"      • booking.tourId exists: {'tourId' in booking_data}")
        
        # Analyze what PaymentSuccessPage would receive
        tour_from_booking = booking_data.get('tour', {})
        
        payment_page_data = {
            'duration': self.calculate_duration_display(tour_from_booking),
            'classification': tour_from_booking.get('classification', 'standart'),
            'pickup_time': tour_from_booking.get('pickup_time', '09:00'),
            'dropoff_time': tour_from_booking.get('dropoff_time', '18:00')
        }
        
        print("   📋 PaymentSuccessPage Would Display:")
        for field, value in payment_page_data.items():
            print(f"      • {field}: {value}")
        
        self.log_test("Booking Data Simulation", True, "Booking data structure simulated successfully")
        return True, booking_data

    def calculate_duration_display(self, tour_data):
        """Calculate how duration would be displayed on PaymentSuccessPage"""
        duration_unit = tour_data.get('duration_unit', 'days')
        duration_days = tour_data.get('duration_days', 1)
        duration_hours = tour_data.get('duration_hours', 0)
        
        if duration_unit == 'hours' and duration_hours > 0:
            return f"{duration_hours} Saat"
        elif duration_unit == 'hours' and duration_days > 0:
            # This might be the bug - using duration_days when unit is hours
            return f"{duration_days} Saat"
        elif duration_unit == 'days':
            return f"{duration_days} Gün"
        else:
            # Fallback
            return f"{duration_days} Gün"

    def test_user_login(self):
        """Test user login to get authentication token"""
        print("🔍 Testing User Authentication...")
        
        # Try with test user credentials
        login_data = {
            "email": "user@example.com",
            "password": "password123"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            print(f"   ✅ Login successful, token obtained")
            return True
        else:
            print("   ⚠️  User login failed, continuing without authentication")
            return False

    def test_problematic_tour_booking(self, problematic_tours):
        """Test booking flow with problematic tours to see actual PaymentSuccessPage data"""
        if not problematic_tours or len(problematic_tours) == 0:
            print("   ℹ️  No problematic tours to test booking flow")
            return True, None
        
        print("🔍 Testing Booking Flow with Problematic Tour...")
        
        # Use the first problematic tour
        problem_tour = problematic_tours[0]
        tour_id = problem_tour['id']
        tour_title = problem_tour['title']
        
        print(f"   📋 Testing booking with: {tour_title}")
        print(f"   📋 Tour ID: {tour_id}")
        print(f"   📋 Issues: {problem_tour['issues']}")
        
        # Get tour dates for this problematic tour
        dates_success, tour_dates = self.test_tour_dates_data(tour_id)
        
        if not dates_success or not tour_dates:
            print("   ❌ No tour dates available for booking test")
            return False, None
        
        # Simulate booking creation
        selected_date = tour_dates[0]
        
        booking_data = {
            "tour_id": tour_id,
            "tour_date_id": selected_date.get('id'),
            "participants": 1,
            "cabin_type": "single",
            "customer_info": {
                "full_name": "Test Customer",
                "email": "test@example.com",
                "phone": "+90 555 123 4567",
                "id_number": "12345678901"
            },
            "special_requests": "Test booking for PaymentSuccessPage debug"
        }
        
        # Create actual booking
        success, booking_response = self.run_test(
            f"Create Booking for Problematic Tour",
            "POST",
            "bookings",
            200,
            data=booking_data
        )
        
        if success and booking_response:
            booking_id = booking_response.get('id')
            print(f"   ✅ Booking created successfully: {booking_id}")
            
            # Get the created booking to see what data structure it has
            bookings_success, bookings_list = self.run_test(
                "Get User Bookings",
                "GET",
                "bookings",
                200
            )
            
            if bookings_success and bookings_list:
                # Find our booking
                our_booking = None
                for booking in bookings_list:
                    if booking.get('id') == booking_id:
                        our_booking = booking
                        break
                
                if our_booking:
                    print("   📋 Actual Booking Data Structure:")
                    print(f"      • Booking ID: {our_booking.get('id')}")
                    print(f"      • Tour ID: {our_booking.get('tour_id')}")
                    print(f"      • Total Price: {our_booking.get('total_price')}")
                    
                    # Now get the tour data that would be used in PaymentSuccessPage
                    tour_success, tour_data = self.run_test(
                        f"Get Tour Data for PaymentSuccessPage",
                        "GET",
                        f"tours/{tour_id}",
                        200
                    )
                    
                    if tour_success and tour_data:
                        print("   📋 PaymentSuccessPage Would Show:")
                        duration_display = self.calculate_duration_display(tour_data)
                        print(f"      • Tur Süresi: {duration_display}")
                        print(f"      • Sınıf: {tour_data.get('classification', 'standart').title()}")
                        print(f"      • Biniş saati: {tour_data.get('pickup_time', '09:00')}")
                        print(f"      • İniş saati: {tour_data.get('dropoff_time', '18:00')}")
                        
                        # This is the actual data that would cause the reported issue
                        if (duration_display == "1 Gün" and 
                            tour_data.get('classification') == 'standart' and
                            tour_data.get('pickup_time') == '09:00' and
                            tour_data.get('dropoff_time') == '18:00'):
                            print("   🎯 ISSUE CONFIRMED: This booking would show incorrect data!")
                            self.log_test("Problematic Booking Test", False, 
                                        "Booking would show: 1 Gün, Standart, 09:00, 18:00 instead of expected values")
                            return False, our_booking
                        else:
                            print("   ✅ This booking data looks correct")
                            return True, our_booking
                    
            return True, booking_response
        else:
            print("   ❌ Failed to create booking for testing")
            return False, None

    def run_payment_success_debug_analysis(self):
        """Run comprehensive PaymentSuccessPage data mapping debug analysis"""
        print("🎯 PaymentSuccessPage Data Mapping Debug Analysis")
        print("=" * 70)
        print("Analyzing specific tour data for incorrect field mapping")
        print("Expected: 5 Saat, Delux, 12:00, 21:00")
        print("Actual: 1 Saat, Standart, 09:00, 18:00")
        print("=" * 70)
        
        # Step 1: Backend Health Check
        print("\n🔧 STEP 1: Backend Health Check")
        health_ok = self.test_backend_health()
        
        if not health_ok:
            print("❌ Backend not accessible, cannot proceed with analysis")
            self.print_final_results()
            return False
        
        # Step 2: User Authentication (optional)
        print("\n🔐 STEP 2: User Authentication")
        self.test_user_login()
        
        # Step 3: Find Specific Tour
        print("\n🔍 STEP 3: Find Specific Tour")
        tour_found, tour_data = self.test_specific_tour_lookup()
        
        if not tour_found or not tour_data:
            print("❌ Could not find the specific tour, cannot proceed with analysis")
            self.print_final_results()
            return False
        
        # Step 4: Analyze Tour Data Structure
        print("\n📋 STEP 4: Analyze Tour Data Structure")
        fields_ok, field_issues = self.analyze_tour_data_structure(tour_data)
        
        # Step 5: Get Tour Dates Data
        print("\n📅 STEP 5: Get Tour Dates Data")
        dates_ok, tour_dates = self.test_tour_dates_data(tour_data.get('id'))
        
        # Step 6: Simulate Booking Data Structure
        print("\n💳 STEP 6: Simulate Booking Data Structure")
        booking_ok, booking_data = self.simulate_booking_data_structure(tour_data, tour_dates)
        
        # Step 7: Analyze All Tours for Data Issues
        print("\n📊 STEP 7: Analyze All Tours for Data Issues")
        all_tours_ok, problematic_tours = self.test_all_tours_data_analysis()
        
        # Step 8: Test Actual Booking Flow with Problematic Tours
        print("\n🎯 STEP 8: Test Actual Booking Flow with Problematic Tours")
        booking_test_ok, actual_booking = self.test_problematic_tour_booking(problematic_tours)
        
        # Step 9: Root Cause Analysis
        print("\n🔍 STEP 9: Root Cause Analysis")
        self.perform_root_cause_analysis(tour_data, field_issues, problematic_tours)
        
        # Print final results
        self.print_final_results()
        
        return fields_ok and booking_test_ok

    def perform_root_cause_analysis(self, tour_data, field_issues, problematic_tours=None):
        """Perform root cause analysis of the field mapping issues"""
        print("🔍 Root Cause Analysis...")
        
        if not field_issues and (not problematic_tours or len(problematic_tours) == 0):
            print("   ✅ No field mapping issues found in specific tour")
            if problematic_tours is not None:
                print("   ✅ No problematic tours found in database")
            print("   💡 CONCLUSION: The reported issue might be:")
            print("      • Frontend data handling problem")
            print("      • Different tour than the one analyzed")
            print("      • Caching issue showing old data")
            print("      • User testing with different booking data")
            self.log_test("Root Cause Analysis", True, "No backend data issues found - likely frontend issue")
            return
        
        if field_issues:
            print("   📋 Issues Found in Specific Tour:")
            for issue in field_issues:
                print(f"      • {issue}")
        
        if problematic_tours and len(problematic_tours) > 0:
            print(f"   📋 Found {len(problematic_tours)} tours with potential data issues:")
            for tour in problematic_tours[:3]:  # Show first 3
                print(f"      • Tour: {tour['title']}")
                for issue in tour['issues']:
                    print(f"        - {issue}")
        
        # Analyze potential causes
        duration_unit = tour_data.get('duration_unit')
        duration_days = tour_data.get('duration_days')
        duration_hours = tour_data.get('duration_hours')
        
        print("   📋 Potential Root Causes:")
        
        # Duration mapping issue
        if 'duration_hours' in str(field_issues):
            print("      🔍 DURATION MAPPING ISSUE:")
            print(f"         • duration_unit: {duration_unit}")
            print(f"         • duration_days: {duration_days}")
            print(f"         • duration_hours: {duration_hours}")
            
            if duration_unit == 'hours' and duration_hours != duration_days:
                print("      ❌ FOUND: duration_unit='hours' but duration_hours != duration_days")
                print("      💡 FIX: Backend should set duration_hours = duration_days when duration_unit='hours'")
            elif duration_unit == 'days' and duration_hours != 0:
                print("      ❌ FOUND: duration_unit='days' but duration_hours is not 0")
                print("      💡 FIX: Backend should set duration_hours = 0 when duration_unit='days'")
        
        # Classification mapping issue
        if 'classification' in str(field_issues):
            classification = tour_data.get('classification')
            print("      🔍 CLASSIFICATION MAPPING ISSUE:")
            print(f"         • Current classification: {classification}")
            print("      💡 FIX: Tour classification should be updated to 'delux' in database")
        
        # Time mapping issue
        if 'pickup_time' in str(field_issues) or 'dropoff_time' in str(field_issues):
            pickup_time = tour_data.get('pickup_time')
            dropoff_time = tour_data.get('dropoff_time')
            print("      🔍 TIME MAPPING ISSUE:")
            print(f"         • Current pickup_time: {pickup_time}")
            print(f"         • Current dropoff_time: {dropoff_time}")
            print("      💡 FIX: Tour times should be updated to pickup_time='12:00', dropoff_time='21:00'")
        
        # General database issues
        if problematic_tours and len(problematic_tours) > 0:
            print("      🔍 DATABASE CONSISTENCY ISSUES:")
            print("      💡 RECOMMENDATIONS:")
            print("         • Review tour data creation/update logic")
            print("         • Ensure duration_unit conversion is working properly")
            print("         • Check admin panel field mapping")
            print("         • Verify default values are not overriding user input")
        
        has_issues = bool(field_issues) or (problematic_tours and len(problematic_tours) > 0)
        self.log_test("Root Cause Analysis", not has_issues, 
                     f"Found issues in {len(field_issues)} specific fields and {len(problematic_tours) if problematic_tours else 0} tours", 
                     {"field_issues": field_issues, "problematic_tours_count": len(problematic_tours) if problematic_tours else 0})

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 70)
        print("📊 PAYMENTSUCCESSPAGE DEBUG ANALYSIS RESULTS")
        print("=" * 70)
        
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        print(f"Total Tests Run: {self.total_tests}")
        print(f"Tests Passed: {self.passed_tests}")
        print(f"Tests Failed: {self.total_tests - self.passed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ ISSUES FOUND:")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        else:
            print("\n✅ NO ISSUES FOUND: Tour data mapping is correct")
        
        print("\n📋 SUMMARY:")
        if failed_tests:
            print("   🚨 PaymentSuccessPage data mapping issues confirmed")
            print("   💡 Backend tour data needs to be updated with correct values")
            print("   🔧 Check tour database fields: duration_hours, classification, pickup_time, dropoff_time")
        else:
            print("   ✅ PaymentSuccessPage data mapping appears to be working correctly")
            print("   ℹ️  Issue might be in frontend data handling or different tour")

if __name__ == "__main__":
    tester = PaymentSuccessDebugTester()
    tester.run_payment_success_debug_analysis()