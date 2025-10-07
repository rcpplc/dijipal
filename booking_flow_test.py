import requests
import sys
import json
from datetime import datetime
import time

class BookingFlowTester:
    def __init__(self, base_url="https://tourboost.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

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

    def test_user_login(self):
        """Test user login with provided credentials"""
        login_data = {
            "email": "user@example.com",
            "password": "password123"
        }
        
        success, response = self.run_test(
            "User Login (user@example.com/password123)",
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
            return True, response['user']
        
        return False, None

    def test_get_tours_for_booking(self):
        """Get tours list to find a tour for booking test"""
        success, response = self.run_test(
            "Get Tours List for Booking Test",
            "GET",
            "tours",
            200
        )
        
        if success and response and len(response) > 0:
            # Find a tour with available dates
            for tour in response:
                if tour.get('tour_dates') and len(tour['tour_dates']) > 0:
                    print(f"   ✅ Found tour with dates: {tour['title']} (ID: {tour['id']})")
                    return True, tour
            
            # If no tour with dates, return first tour
            tour = response[0]
            print(f"   ⚠️  Using first tour (may not have dates): {tour['title']} (ID: {tour['id']})")
            return True, tour
        
        return False, None

    def test_get_tour_detail(self, tour_id):
        """Test getting tour detail - this is what TourDetailPage would call"""
        success, response = self.run_test(
            f"Get Tour Detail (ID: {tour_id})",
            "GET",
            f"tours/{tour_id}",
            200
        )
        
        if success and response:
            # Check if tour has the required data for booking
            required_fields = ['id', 'title', 'tour_dates']
            missing_fields = []
            
            for field in required_fields:
                if field not in response:
                    missing_fields.append(field)
            
            if missing_fields:
                print(f"   ⚠️  Tour detail missing fields: {missing_fields}")
            else:
                print(f"   ✅ Tour detail has all required fields")
                
            # Check tour dates structure
            tour_dates = response.get('tour_dates', [])
            if tour_dates:
                date = tour_dates[0]
                pricing_fields = ['single_cabin_price', 'double_cabin_price']
                has_pricing = any(field in date for field in pricing_fields)
                
                if has_pricing:
                    print(f"   ✅ Tour dates have cabin pricing: single={date.get('single_cabin_price')}, double={date.get('double_cabin_price')}")
                else:
                    print(f"   ⚠️  Tour dates missing cabin pricing fields")
                    
            return True, response
        
        return False, None

    def test_booking_endpoint_with_tour_data(self, tour_data):
        """Test booking endpoint with tour data - simulating what should happen from TourDetailPage"""
        if not self.token:
            self.log_test("Booking Endpoint Test", False, "", "No authentication token available")
            return False, None
            
        if not tour_data or not tour_data.get('tour_dates'):
            self.log_test("Booking Endpoint Test", False, "", "No tour data or tour dates available")
            return False, None
        
        # Simulate the booking data that TourDetailPage should send
        tour_date = tour_data['tour_dates'][0]  # Use first available date
        
        booking_data = {
            "tour_id": tour_data['id'],
            "tour_date_id": tour_date['id'],
            "participants": 1,  # 1 cabin
            "cabin_type": "single",  # single cabin
            "customer_info": {
                "full_name": "Test Customer",
                "email": "test@example.com",
                "phone": "+90 555 123 4567",
                "id_number": "12345678901"
            },
            "special_requests": "Test booking from tour detail page"
        }
        
        print(f"   📋 Booking data being sent:")
        print(f"      • Tour ID: {booking_data['tour_id']}")
        print(f"      • Tour Date ID: {booking_data['tour_date_id']}")
        print(f"      • Participants: {booking_data['participants']}")
        print(f"      • Cabin Type: {booking_data['cabin_type']}")
        
        success, response = self.run_test(
            "Create Booking from Tour Detail Page",
            "POST",
            "bookings",
            200,
            data=booking_data
        )
        
        if success and response:
            # Check if booking was created with correct data
            booking_id = response.get('id')
            total_price = response.get('total_price')
            
            if booking_id:
                print(f"   ✅ Booking created successfully: ID={booking_id}")
                print(f"   ✅ Total price calculated: ₺{total_price}")
                
                # Verify booking contains tour information
                if response.get('tour_id') == tour_data['id']:
                    print(f"   ✅ Booking contains correct tour ID")
                else:
                    print(f"   ❌ Booking tour ID mismatch")
                    
                return True, response
            else:
                print(f"   ❌ Booking created but no ID returned")
                return False, response
        
        return False, None

    def test_booking_page_data_structure(self, tour_data):
        """Test if booking page would receive proper data structure"""
        print(f"\n📋 Testing Booking Page Data Structure")
        
        # This simulates what should be passed to booking page via navigation state
        booking_state = {
            "tour_info": {
                "id": tour_data['id'],
                "title": tour_data['title'],
                "location": tour_data.get('location'),
                "images": tour_data.get('images', [])
            },
            "selectedDate": tour_data['tour_dates'][0] if tour_data.get('tour_dates') else None,
            "cabinType": "single",
            "participants": 1,
            "pricing": {
                "single_cabin_price": tour_data['tour_dates'][0].get('single_cabin_price') if tour_data.get('tour_dates') else 0,
                "double_cabin_price": tour_data['tour_dates'][0].get('double_cabin_price') if tour_data.get('tour_dates') else 0
            }
        }
        
        print(f"   📋 Expected booking page state:")
        print(f"      • Tour: {booking_state['tour_info']['title']}")
        print(f"      • Date: {booking_state['selectedDate']['start_date'] if booking_state['selectedDate'] else 'None'}")
        print(f"      • Cabin Type: {booking_state['cabinType']}")
        print(f"      • Participants: {booking_state['participants']}")
        print(f"      • Single Cabin Price: ₺{booking_state['pricing']['single_cabin_price']}")
        print(f"      • Double Cabin Price: ₺{booking_state['pricing']['double_cabin_price']}")
        
        # Check if all required data is present
        required_data = [
            booking_state['tour_info']['id'],
            booking_state['tour_info']['title'],
            booking_state['selectedDate'],
            booking_state['pricing']['single_cabin_price'] or booking_state['pricing']['double_cabin_price']
        ]
        
        if all(data for data in required_data):
            self.log_test("Booking Page Data Structure", True, "All required data present for booking page")
            return True, booking_state
        else:
            missing_data = []
            if not booking_state['tour_info']['id']:
                missing_data.append("tour_id")
            if not booking_state['tour_info']['title']:
                missing_data.append("tour_title")
            if not booking_state['selectedDate']:
                missing_data.append("selectedDate")
            if not (booking_state['pricing']['single_cabin_price'] or booking_state['pricing']['double_cabin_price']):
                missing_data.append("pricing")
                
            self.log_test("Booking Page Data Structure", False, "", f"Missing required data: {missing_data}")
            return False, booking_state

    def test_get_user_bookings(self):
        """Test getting user bookings to verify booking was saved"""
        if not self.token:
            self.log_test("Get User Bookings", False, "", "No authentication token available")
            return False, None

        success, response = self.run_test(
            "Get User Bookings",
            "GET",
            "bookings",
            200
        )
        
        if success and response:
            print(f"   ✅ Found {len(response)} user bookings")
            for booking in response:
                print(f"      • Booking ID: {booking.get('id')}")
                print(f"      • Tour ID: {booking.get('tour_id')}")
                print(f"      • Status: {booking.get('booking_status')}")
                print(f"      • Total Price: ₺{booking.get('total_price')}")
            return True, response
        
        return False, None

    def test_booking_flow_simulation(self):
        """Simulate the complete booking flow from tour detail to booking page"""
        print("🎯 SIMULATING COMPLETE BOOKING FLOW")
        print("=" * 70)
        print("Scenario: User clicks 'Rezervasyon Tamamla' from tour detail page")
        print("Expected: Booking page should receive all tour data and show properly")
        print("=" * 70)
        
        # Step 1: User login
        print("\n🔐 STEP 1: User Login")
        login_success, user_data = self.test_user_login()
        
        if not login_success:
            print("❌ User login failed - cannot proceed with booking flow test")
            return False
        
        # Step 2: Get tours list (simulating user browsing)
        print("\n🏛️ STEP 2: Get Tours List")
        tours_success, tour_data = self.test_get_tours_for_booking()
        
        if not tours_success:
            print("❌ Could not get tours - cannot proceed with booking flow test")
            return False
        
        # Step 3: Get tour detail (simulating TourDetailPage)
        print("\n📋 STEP 3: Get Tour Detail (TourDetailPage)")
        detail_success, detailed_tour = self.test_get_tour_detail(tour_data['id'])
        
        if not detail_success:
            print("❌ Could not get tour detail - cannot proceed with booking flow test")
            return False
        
        # Step 4: Test booking page data structure
        print("\n📄 STEP 4: Test Booking Page Data Structure")
        data_success, booking_state = self.test_booking_page_data_structure(detailed_tour)
        
        # Step 5: Test actual booking creation
        print("\n💳 STEP 5: Test Booking Creation")
        booking_success, booking_response = self.test_booking_endpoint_with_tour_data(detailed_tour)
        
        # Step 6: Verify booking was saved
        print("\n📋 STEP 6: Verify Booking Was Saved")
        verify_success, user_bookings = self.test_get_user_bookings()
        
        # Final assessment
        print("\n" + "=" * 70)
        print("📊 BOOKING FLOW TEST RESULTS")
        print("=" * 70)
        
        all_steps_passed = all([login_success, tours_success, detail_success, data_success, booking_success, verify_success])
        
        if all_steps_passed:
            print("🎉 BOOKING FLOW WORKING CORRECTLY")
            print("✅ User can successfully navigate from tour detail to booking")
            print("✅ All required data is available for booking page")
            print("✅ Booking creation works properly")
        else:
            print("🚨 BOOKING FLOW HAS ISSUES")
            failed_steps = []
            if not login_success:
                failed_steps.append("User Login")
            if not tours_success:
                failed_steps.append("Tours List")
            if not detail_success:
                failed_steps.append("Tour Detail")
            if not data_success:
                failed_steps.append("Booking Page Data")
            if not booking_success:
                failed_steps.append("Booking Creation")
            if not verify_success:
                failed_steps.append("Booking Verification")
            
            print(f"❌ Failed steps: {', '.join(failed_steps)}")
        
        return all_steps_passed

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 70)
        print("📊 FINAL BOOKING FLOW TEST RESULTS")
        print("=" * 70)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🎉 EXCELLENT: Booking flow is working well!")
        elif success_rate >= 60:
            print("⚠️  GOOD: Most booking features working, some issues to address")
        else:
            print("🚨 CRITICAL: Major booking flow issues detected, needs immediate attention")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test_name']}: {test['error']}")

if __name__ == "__main__":
    print("🚀 Starting Booking Flow Testing")
    print("Testing the reported issue: 'Rezervasyon Tamamla' button leads to empty booking page")
    
    tester = BookingFlowTester()
    success = tester.test_booking_flow_simulation()
    tester.print_final_results()
    
    if success:
        print("\n✅ BOOKING FLOW TEST COMPLETED SUCCESSFULLY")
    else:
        print("\n❌ BOOKING FLOW TEST FOUND ISSUES - NEEDS ATTENTION")