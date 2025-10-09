import requests
import sys
import json
from datetime import datetime
import time

class BookingFlowBackendTester:
    def __init__(self, base_url="https://tour-admin-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Specific tour ID from review request
        self.test_tour_id = "266ac046-78c7-430e-b03f-9f76cc1f1e67"

    def log_test(self, name, success, details="", error=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {error}")
        
        self.test_results.append({
            "test_name": name,
            "success": success,
            "details": details,
            "error": error,
            "timestamp": datetime.now().isoformat()
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
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
                    self.log_test(name, True, f"Status: {response.status_code}, Response: {json.dumps(response_data, indent=2)[:500]}...")
                    return True, response_data
                except:
                    self.log_test(name, True, f"Status: {response.status_code}, No JSON response")
                    return True, {}
            else:
                try:
                    error_data = response.json() if response.content else {}
                    self.log_test(name, False, "", f"Expected {expected_status}, got {response.status_code}. Response: {error_data}")
                except:
                    self.log_test(name, False, "", f"Expected {expected_status}, got {response.status_code}. Response: {response.text[:200]}")
                return False, {}

        except requests.exceptions.Timeout:
            self.log_test(name, False, "", "Request timeout (30s)")
            return False, {}
        except requests.exceptions.ConnectionError:
            self.log_test(name, False, "", "Connection error - server may be down")
            return False, {}
        except Exception as e:
            self.log_test(name, False, "", f"Exception: {str(e)}")
            return False, {}

    def test_user_authentication(self):
        """Test user login/registration and session management"""
        print("\n👤 TESTING USER AUTHENTICATION FLOW")
        print("=" * 50)
        
        # Test user login with existing credentials
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
            if 'user' in response:
                self.user_id = response['user'].get('id')
            print(f"   ✅ Login successful, token: {self.token[:20]}...")
            
            # Test token validation by getting user profile
            profile_success, profile_response = self.run_test(
                "Get User Profile (Token Validation)",
                "GET",
                "users/me",
                200
            )
            
            if profile_success:
                print(f"   ✅ Token validation successful, user: {profile_response.get('full_name', 'Unknown')}")
                return True
            else:
                print("   ❌ Token validation failed")
                return False
        else:
            print("   ❌ User login failed")
            return False

    def test_tour_data_retrieval(self):
        """Test GET /api/tours/{tour_id} endpoint for tour data structure"""
        print(f"\n🏛️ TESTING TOUR DATA RETRIEVAL - Tour ID: {self.test_tour_id}")
        print("=" * 50)
        
        success, response = self.run_test(
            f"Get Tour Data - {self.test_tour_id}",
            "GET",
            f"tours/{self.test_tour_id}",
            200
        )
        
        if success and response:
            # Verify tour data structure
            required_fields = ['id', 'title', 'description', 'location', 'category', 'reservation_type']
            missing_fields = []
            
            for field in required_fields:
                if field not in response:
                    missing_fields.append(field)
            
            if missing_fields:
                print(f"   ❌ Missing required fields: {missing_fields}")
                self.log_test("Tour Data Structure Validation", False, "", f"Missing fields: {missing_fields}")
                return False, None
            else:
                print("   ✅ All required tour fields present")
                print(f"   📋 Tour: {response.get('title', 'Unknown')}")
                print(f"   📍 Location: {response.get('location', 'Unknown')}")
                print(f"   🏷️ Category: {response.get('category', 'Unknown')}")
                print(f"   🎯 Reservation Type: {response.get('reservation_type', 'Unknown')}")
                
                # Check if tour_dates are included
                tour_dates = response.get('tour_dates', [])
                if tour_dates:
                    print(f"   📅 Tour dates included: {len(tour_dates)} dates")
                else:
                    print("   ⚠️ No tour dates included in response")
                
                return True, response
        else:
            print(f"   ❌ Failed to retrieve tour data for ID: {self.test_tour_id}")
            return False, None

    def test_tour_dates_retrieval(self):
        """Test GET /api/tours/{tour_id}/dates endpoint for date formatting"""
        print(f"\n📅 TESTING TOUR DATES RETRIEVAL - Tour ID: {self.test_tour_id}")
        print("=" * 50)
        
        success, response = self.run_test(
            f"Get Tour Dates - {self.test_tour_id}",
            "GET",
            f"tours/{self.test_tour_id}/dates",
            200
        )
        
        if success and response:
            if isinstance(response, list) and len(response) > 0:
                print(f"   ✅ Retrieved {len(response)} tour dates")
                
                # Verify date formatting and required fields
                date_validation_passed = True
                formatted_dates_found = 0
                
                for i, date_obj in enumerate(response):
                    print(f"\n   📅 Date {i+1}:")
                    print(f"      ID: {date_obj.get('id', 'Missing')}")
                    print(f"      Start Date: {date_obj.get('start_date', 'Missing')}")
                    
                    # Check for pricing fields based on reservation type
                    if 'single_cabin_price' in date_obj:
                        print(f"      Single Cabin Price: {date_obj.get('single_cabin_price', 0)}")
                    if 'double_cabin_price' in date_obj:
                        print(f"      Double Cabin Price: {date_obj.get('double_cabin_price', 0)}")
                    if 'person_price' in date_obj:
                        print(f"      Person Price: {date_obj.get('person_price', 0)}")
                    if 'child_price' in date_obj:
                        print(f"      Child Price: {date_obj.get('child_price', 0)}")
                    if 'total_reservation_price' in date_obj:
                        print(f"      Total Reservation Price: {date_obj.get('total_reservation_price', 0)}")
                    
                    # Check for formattedDate field (this is what the review specifically asks for)
                    if 'formattedDate' in date_obj:
                        formatted_dates_found += 1
                        print(f"      ✅ Formatted Date: {date_obj.get('formattedDate')}")
                    else:
                        print(f"      ⚠️ No formattedDate field found")
                    
                    # Validate required fields
                    required_date_fields = ['id', 'start_date']
                    missing_date_fields = [field for field in required_date_fields if field not in date_obj]
                    
                    if missing_date_fields:
                        print(f"      ❌ Missing required fields: {missing_date_fields}")
                        date_validation_passed = False
                
                if formatted_dates_found > 0:
                    print(f"\n   ✅ Found {formatted_dates_found} dates with formattedDate field")
                else:
                    print(f"\n   ⚠️ No dates have formattedDate field - frontend may need to format dates")
                
                if date_validation_passed:
                    print("   ✅ All tour dates have required fields")
                    return True, response
                else:
                    print("   ❌ Some tour dates missing required fields")
                    return False, response
            else:
                print("   ❌ No tour dates found or invalid response format")
                return False, None
        else:
            print(f"   ❌ Failed to retrieve tour dates for ID: {self.test_tour_id}")
            return False, None

    def test_booking_creation_flow(self, tour_data, tour_dates):
        """Test booking creation with different reservation types"""
        print(f"\n📝 TESTING BOOKING CREATION FLOW")
        print("=" * 50)
        
        if not self.token:
            print("   ❌ No authentication token - cannot test booking creation")
            return False
        
        if not tour_dates or len(tour_dates) == 0:
            print("   ❌ No tour dates available for booking")
            return False
        
        # Use the first available date
        selected_date = tour_dates[0]
        reservation_type = tour_data.get('reservation_type', 'cabin_based')
        
        print(f"   🎯 Testing reservation type: {reservation_type}")
        print(f"   📅 Using date: {selected_date.get('start_date')}")
        
        # Create booking data based on reservation type
        booking_data = {
            "tour_id": self.test_tour_id,
            "tour_date_id": selected_date.get('id'),
            "customer_info": {
                "full_name": "Test Customer",
                "email": "test@example.com",
                "phone": "+90 555 123 4567",
                "id_number": "12345678901"
            },
            "special_requests": "Test booking for API validation"
        }
        
        # Add reservation-specific fields
        if reservation_type == 'cabin_based':
            booking_data["participants"] = 2  # Number of cabins
            booking_data["cabin_type"] = "single"  # or "double"
            print(f"   🏠 Cabin-based booking: {booking_data['participants']} {booking_data['cabin_type']} cabins")
            
        elif reservation_type == 'person_based':
            booking_data["participants"] = 4  # Number of people
            booking_data["adults"] = 3
            booking_data["children"] = 1
            print(f"   👥 Person-based booking: {booking_data['adults']} adults, {booking_data['children']} children")
            
        elif reservation_type == 'reservation':
            booking_data["participants"] = 1  # Full reservation
            booking_data["total_passengers"] = 8
            print(f"   🚢 Full reservation booking: {booking_data['total_passengers']} total passengers")
        
        # Test booking creation
        success, response = self.run_test(
            f"Create Booking ({reservation_type})",
            "POST",
            "bookings",
            200,
            data=booking_data
        )
        
        if success and response and 'id' in response:
            booking_id = response['id']
            print(f"   ✅ Booking created successfully: {booking_id}")
            print(f"   💰 Total price: {response.get('total_price', 'Unknown')}")
            print(f"   📋 Booking code: {response.get('booking_code', 'Unknown')}")
            
            # Verify booking was saved correctly
            verify_success, verify_response = self.run_test(
                "Verify Booking Creation",
                "GET",
                "bookings",
                200
            )
            
            if verify_success and verify_response:
                # Check if our booking is in the list
                booking_found = False
                for booking in verify_response:
                    if booking.get('id') == booking_id:
                        booking_found = True
                        print(f"   ✅ Booking verified in user's booking list")
                        break
                
                if not booking_found:
                    print(f"   ❌ Booking not found in user's booking list")
                    return False
            
            return True, booking_id
        else:
            print(f"   ❌ Booking creation failed")
            return False, None

    def test_date_formatting_verification(self, tour_dates):
        """Verify that selectedDate objects include proper formattedDate field"""
        print(f"\n📅 TESTING DATE FORMATTING VERIFICATION")
        print("=" * 50)
        
        if not tour_dates:
            print("   ❌ No tour dates to verify")
            return False
        
        formatted_dates_count = 0
        valid_formats_count = 0
        
        for i, date_obj in enumerate(tour_dates):
            start_date = date_obj.get('start_date')
            formatted_date = date_obj.get('formattedDate')
            
            print(f"\n   📅 Date {i+1}:")
            print(f"      Raw start_date: {start_date}")
            
            if formatted_date:
                formatted_dates_count += 1
                print(f"      ✅ formattedDate: {formatted_date}")
                
                # Verify format is user-friendly (not just ISO date)
                if formatted_date != start_date:
                    valid_formats_count += 1
                    print(f"      ✅ Date is properly formatted for display")
                else:
                    print(f"      ⚠️ formattedDate same as start_date - may need better formatting")
            else:
                print(f"      ❌ No formattedDate field")
                
                # Check if we can create a formatted date from start_date
                if start_date:
                    try:
                        from datetime import datetime
                        date_obj_parsed = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                        suggested_format = date_obj_parsed.strftime('%d %B %Y')  # e.g., "15 Ocak 2025"
                        print(f"      💡 Suggested formattedDate: {suggested_format}")
                    except:
                        print(f"      ❌ Cannot parse start_date for formatting")
        
        print(f"\n   📊 Summary:")
        print(f"      Total dates: {len(tour_dates)}")
        print(f"      Dates with formattedDate: {formatted_dates_count}")
        print(f"      Properly formatted dates: {valid_formats_count}")
        
        if formatted_dates_count == len(tour_dates):
            print(f"   ✅ All dates have formattedDate field")
            return True
        elif formatted_dates_count > 0:
            print(f"   ⚠️ Some dates missing formattedDate field")
            return True  # Partial success
        else:
            print(f"   ❌ No dates have formattedDate field - frontend will need to format dates")
            return False

    def run_comprehensive_booking_flow_test(self):
        """Run comprehensive booking flow backend test as requested"""
        print("🚀 COMPREHENSIVE BOOKING FLOW BACKEND TESTING")
        print("=" * 70)
        print("Testing Focus Areas:")
        print("1. Tour Data & Date Retrieval")
        print("2. Date Formatting Verification") 
        print("3. Booking Creation Flow")
        print("4. Authentication Flow")
        print("=" * 70)
        
        # Phase 1: Authentication Flow
        print("\n🔐 PHASE 1: AUTHENTICATION FLOW")
        auth_success = self.test_user_authentication()
        
        if not auth_success:
            print("❌ Authentication failed - cannot proceed with booking tests")
            self.print_final_results()
            return
        
        # Phase 2: Tour Data & Date Retrieval
        print("\n🏛️ PHASE 2: TOUR DATA & DATE RETRIEVAL")
        tour_success, tour_data = self.test_tour_data_retrieval()
        dates_success, tour_dates = self.test_tour_dates_retrieval()
        
        if not tour_success or not dates_success:
            print("❌ Tour data retrieval failed - cannot proceed with booking tests")
            self.print_final_results()
            return
        
        # Phase 3: Date Formatting Verification
        print("\n📅 PHASE 3: DATE FORMATTING VERIFICATION")
        self.test_date_formatting_verification(tour_dates)
        
        # Phase 4: Booking Creation Flow
        print("\n📝 PHASE 4: BOOKING CREATION FLOW")
        booking_success, booking_id = self.test_booking_creation_flow(tour_data, tour_dates)
        
        # Print final results
        self.print_final_results()
        
        return booking_success

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 70)
        print("📊 BOOKING FLOW BACKEND TEST RESULTS")
        print("=" * 70)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("🎉 EXCELLENT: Booking flow backend is working perfectly!")
        elif success_rate >= 75:
            print("✅ GOOD: Most booking flow features working, minor issues to address")
        elif success_rate >= 50:
            print("⚠️ MODERATE: Some booking flow issues detected, needs attention")
        else:
            print("🚨 CRITICAL: Major booking flow issues detected, needs immediate attention")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test_name']}: {test['error']}")
        
        # Print successful tests summary
        successful_tests = [test for test in self.test_results if test['success']]
        if successful_tests:
            print("\n✅ SUCCESSFUL TESTS:")
            for test in successful_tests:
                print(f"   • {test['test_name']}")

if __name__ == "__main__":
    print("🎯 BOOKING FLOW BACKEND TESTING")
    print("Testing specific tour ID: 266ac046-78c7-430e-b03f-9f76cc1f1e67")
    print("Focus: Tour data, date formatting, booking creation, authentication")
    print("=" * 70)
    
    tester = BookingFlowBackendTester()
    success = tester.run_comprehensive_booking_flow_test()
    
    if success:
        print("\n🎉 BOOKING FLOW BACKEND TESTING COMPLETED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print("\n❌ BOOKING FLOW BACKEND TESTING COMPLETED WITH ISSUES!")
        sys.exit(1)