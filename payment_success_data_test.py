#!/usr/bin/env python3
"""
PaymentSuccessPage Bilet Bilgileri Data Structure Test
Testing Turkish review request: PaymentSuccessPage bilet bilgileri data structure test

Focus Areas:
1. Tour Data Structure Test - GET /api/tours endpoint field analysis
2. Booking Data Flow Test - Booking creation and tour data copying
3. Sample Tour Data Analysis - Real tour object structure analysis
4. Missing field identification for PaymentSuccessPage
"""

import requests
import json
import sys
from datetime import datetime
import time

# Configuration
BACKEND_URL = "https://payment-modal-fix.preview.emergentagent.com/api"

class PaymentSuccessDataTester:
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

    def test_user_login(self):
        """Test user login to get authentication token"""
        login_data = {
            "email": "user@example.com",
            "password": "password123"
        }
        
        success, response = self.run_test(
            "User Login for Authentication",
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
            return True
        
        return False

    def test_tour_data_structure(self):
        """Test 1: Tour Data Structure Analysis - GET /api/tours endpoint"""
        print("\n🔍 TEST 1: TOUR DATA STRUCTURE ANALYSIS")
        print("=" * 60)
        print("Analyzing tour objects for PaymentSuccessPage required fields:")
        print("- pickup_time, dropoff_time")
        print("- duration_days, duration_hours") 
        print("- classification, location")
        print("=" * 60)
        
        # Get all tours
        success, tours_response = self.run_test(
            "GET /api/tours - Tour Data Structure Analysis",
            "GET",
            "tours",
            200
        )
        
        if not success or not tours_response:
            print("❌ Failed to retrieve tours - cannot analyze data structure")
            return False
        
        print(f"   📊 Retrieved {len(tours_response)} tours for analysis")
        
        # Analyze each tour for required fields
        required_fields = {
            'pickup_time': 'Biniş Saati',
            'dropoff_time': 'İniş Saati', 
            'duration_days': 'Tur Süresi (Gün)',
            'duration_hours': 'Tur Süresi (Saat)',
            'classification': 'Sınıf',
            'location': 'Lokasyon'
        }
        
        field_analysis = {}
        tours_with_complete_data = 0
        
        for field in required_fields:
            field_analysis[field] = {
                'present': 0,
                'missing': 0,
                'null_or_empty': 0,
                'sample_values': []
            }
        
        print("\n📋 FIELD-BY-FIELD ANALYSIS:")
        
        for i, tour in enumerate(tours_response):
            tour_id = tour.get('id', f'tour_{i}')
            tour_title = tour.get('title', 'Unknown Title')
            
            print(f"\n   🎯 Tour {i+1}: '{tour_title}' (ID: {tour_id})")
            
            tour_complete = True
            
            for field, description in required_fields.items():
                value = tour.get(field)
                
                if field in tour:
                    field_analysis[field]['present'] += 1
                    if value is None or value == "" or value == 0:
                        field_analysis[field]['null_or_empty'] += 1
                        print(f"      ⚠️  {description} ({field}): NULL/EMPTY")
                        tour_complete = False
                    else:
                        field_analysis[field]['sample_values'].append(str(value))
                        print(f"      ✅ {description} ({field}): {value}")
                else:
                    field_analysis[field]['missing'] += 1
                    print(f"      ❌ {description} ({field}): MISSING")
                    tour_complete = False
            
            if tour_complete:
                tours_with_complete_data += 1
        
        # Summary analysis
        print(f"\n📊 SUMMARY ANALYSIS:")
        print(f"   Total Tours Analyzed: {len(tours_response)}")
        print(f"   Tours with Complete Data: {tours_with_complete_data}")
        print(f"   Tours with Missing Data: {len(tours_response) - tours_with_complete_data}")
        
        print(f"\n📋 FIELD AVAILABILITY SUMMARY:")
        critical_issues = []
        
        for field, description in required_fields.items():
            analysis = field_analysis[field]
            total = len(tours_response)
            present_rate = (analysis['present'] / total * 100) if total > 0 else 0
            valid_rate = ((analysis['present'] - analysis['null_or_empty']) / total * 100) if total > 0 else 0
            
            print(f"   {description} ({field}):")
            print(f"      Present: {analysis['present']}/{total} ({present_rate:.1f}%)")
            print(f"      Valid (non-null): {analysis['present'] - analysis['null_or_empty']}/{total} ({valid_rate:.1f}%)")
            print(f"      Missing: {analysis['missing']}")
            print(f"      Null/Empty: {analysis['null_or_empty']}")
            
            if analysis['sample_values']:
                unique_values = list(set(analysis['sample_values'][:5]))
                print(f"      Sample Values: {', '.join(unique_values)}")
            
            if valid_rate < 50:
                critical_issues.append(f"{description} ({field}) - only {valid_rate:.1f}% valid data")
            
            print()
        
        # Critical issues summary
        if critical_issues:
            print(f"🚨 CRITICAL ISSUES FOR PAYMENTSUCCESSPAGE:")
            for issue in critical_issues:
                print(f"   • {issue}")
            
            self.log_test(
                "Tour Data Structure - Critical Issues Found",
                False,
                f"Found {len(critical_issues)} critical data issues",
                critical_issues
            )
        else:
            print(f"✅ All required fields have sufficient data for PaymentSuccessPage")
            self.log_test(
                "Tour Data Structure - All Fields Available",
                True,
                f"All {len(required_fields)} required fields have sufficient data"
            )
        
        return len(critical_issues) == 0

    def test_booking_data_flow(self):
        """Test 2: Booking Data Flow - Check if booking creation copies tour data correctly"""
        print("\n🔍 TEST 2: BOOKING DATA FLOW ANALYSIS")
        print("=" * 60)
        print("Testing if booking creation copies tour data correctly")
        print("Focus: Does booking object contain complete tour information?")
        print("=" * 60)
        
        if not self.token:
            print("❌ No authentication token - cannot test booking flow")
            return False
        
        # Step 1: Get a tour with dates for booking
        tours_success, tours_response = self.run_test(
            "Get Tours for Booking Test",
            "GET", 
            "tours",
            200
        )
        
        if not tours_success or not tours_response:
            print("❌ Cannot get tours for booking test")
            return False
        
        # Find a tour with available dates
        test_tour = None
        test_tour_date = None
        
        for tour in tours_response:
            tour_dates = tour.get('tour_dates', [])
            if tour_dates and len(tour_dates) > 0:
                test_tour = tour
                test_tour_date = tour_dates[0]
                break
        
        if not test_tour or not test_tour_date:
            print("❌ No tours with available dates found for booking test")
            return False
        
        tour_id = test_tour['id']
        tour_title = test_tour.get('title', 'Unknown')
        tour_date_id = test_tour_date['id']
        
        print(f"   🎯 Using Tour: '{tour_title}' (ID: {tour_id})")
        print(f"   📅 Using Date: {test_tour_date.get('date', 'Unknown')} (ID: {tour_date_id})")
        
        # Step 2: Analyze tour data before booking
        print(f"\n📋 TOUR DATA BEFORE BOOKING:")
        required_fields = ['pickup_time', 'dropoff_time', 'duration_days', 'duration_hours', 'classification', 'location']
        
        tour_data_summary = {}
        for field in required_fields:
            value = test_tour.get(field)
            tour_data_summary[field] = value
            print(f"   {field}: {value}")
        
        # Step 3: Create a booking
        booking_data = {
            "tour_id": tour_id,
            "tour_date_id": tour_date_id,
            "participants": 1,
            "cabin_type": "single",
            "customer_info": {
                "full_name": "Test Customer",
                "email": "test@example.com", 
                "phone": "+90 555 123 4567",
                "id_number": "12345678901"
            },
            "special_requests": "Test booking for data flow analysis"
        }
        
        booking_success, booking_response = self.run_test(
            "Create Booking for Data Flow Test",
            "POST",
            "bookings",
            200,
            data=booking_data
        )
        
        if not booking_success or not booking_response:
            print("❌ Failed to create booking for data flow test")
            return False
        
        booking_id = booking_response.get('id')
        print(f"   ✅ Booking created successfully (ID: {booking_id})")
        
        # Step 4: Get user bookings to analyze booking data
        bookings_success, bookings_response = self.run_test(
            "Get User Bookings for Data Analysis",
            "GET",
            "bookings",
            200
        )
        
        if not bookings_success or not bookings_response:
            print("❌ Failed to get user bookings for analysis")
            return False
        
        # Find our test booking
        test_booking = None
        for booking in bookings_response:
            if booking.get('id') == booking_id:
                test_booking = booking
                break
        
        if not test_booking:
            print("❌ Test booking not found in user bookings")
            return False
        
        # Step 5: Analyze booking data structure
        print(f"\n📋 BOOKING DATA ANALYSIS:")
        print(f"   Booking ID: {test_booking.get('id')}")
        print(f"   Tour ID: {test_booking.get('tour_id')}")
        print(f"   Tour Date ID: {test_booking.get('tour_date_id')}")
        print(f"   Total Price: {test_booking.get('total_price')}")
        print(f"   Cabin Type: {test_booking.get('cabin_type')}")
        print(f"   Participants: {test_booking.get('participants')}")
        
        # Check if booking contains tour information
        booking_has_tour_data = False
        missing_tour_fields = []
        
        for field in required_fields:
            if field in test_booking:
                booking_has_tour_data = True
                print(f"   ✅ {field}: {test_booking[field]}")
            else:
                missing_tour_fields.append(field)
                print(f"   ❌ {field}: MISSING")
        
        # Step 6: Analysis conclusion
        print(f"\n📊 BOOKING DATA FLOW ANALYSIS RESULTS:")
        
        if booking_has_tour_data and len(missing_tour_fields) == 0:
            print("   ✅ EXCELLENT: Booking contains all required tour data")
            print("   ✅ PaymentSuccessPage should have access to all tour information")
            self.log_test(
                "Booking Data Flow - Complete Tour Data",
                True,
                "Booking object contains all required tour fields"
            )
            return True
        elif booking_has_tour_data and len(missing_tour_fields) < len(required_fields):
            print(f"   ⚠️  PARTIAL: Booking contains some tour data, missing {len(missing_tour_fields)} fields")
            print(f"   Missing fields: {', '.join(missing_tour_fields)}")
            print("   ⚠️  PaymentSuccessPage may need to fetch additional tour data")
            self.log_test(
                "Booking Data Flow - Partial Tour Data",
                False,
                f"Booking missing {len(missing_tour_fields)} tour fields: {', '.join(missing_tour_fields)}"
            )
            return False
        else:
            print("   ❌ CRITICAL: Booking does not contain tour data")
            print("   ❌ PaymentSuccessPage must fetch tour data separately")
            print("   💡 RECOMMENDATION: Modify booking creation to include tour data")
            self.log_test(
                "Booking Data Flow - No Tour Data",
                False,
                "Booking object does not contain tour information - PaymentSuccessPage cannot display tour details"
            )
            return False

    def test_sample_tour_data_analysis(self):
        """Test 3: Sample Tour Data Analysis - Real tour object structure"""
        print("\n🔍 TEST 3: SAMPLE TOUR DATA ANALYSIS")
        print("=" * 60)
        print("Detailed analysis of real tour objects in database")
        print("Focus: Which fields are populated vs null/empty")
        print("=" * 60)
        
        # Get tours
        success, tours_response = self.run_test(
            "Get Tours for Sample Data Analysis",
            "GET",
            "tours",
            200
        )
        
        if not success or not tours_response:
            print("❌ Failed to retrieve tours for sample analysis")
            return False
        
        print(f"   📊 Analyzing {len(tours_response)} tour objects")
        
        # Detailed analysis of first few tours
        sample_size = min(3, len(tours_response))
        
        for i in range(sample_size):
            tour = tours_response[i]
            tour_title = tour.get('title', f'Tour {i+1}')
            tour_id = tour.get('id', 'Unknown ID')
            
            print(f"\n🎯 SAMPLE TOUR {i+1}: '{tour_title}'")
            print(f"   ID: {tour_id}")
            print("   " + "=" * 50)
            
            # Analyze all fields in the tour object
            all_fields = sorted(tour.keys())
            
            # PaymentSuccessPage required fields
            required_fields = {
                'pickup_time': 'Biniş Saati',
                'dropoff_time': 'İniş Saati', 
                'duration_days': 'Tur Süresi (Gün)',
                'duration_hours': 'Tur Süresi (Saat)',
                'classification': 'Sınıf',
                'location': 'Lokasyon bilgileri'
            }
            
            # Check required fields first
            print("   📋 PAYMENTSUCCESSPAGE REQUIRED FIELDS:")
            for field, description in required_fields.items():
                value = tour.get(field)
                if value is not None and value != "" and value != 0:
                    print(f"      ✅ {description} ({field}): {value}")
                elif field in tour:
                    print(f"      ⚠️  {description} ({field}): NULL/EMPTY ({value})")
                else:
                    print(f"      ❌ {description} ({field}): MISSING")
            
            # Check tour dates for additional time/duration info
            tour_dates = tour.get('tour_dates', [])
            if tour_dates:
                print(f"   📅 TOUR DATES ({len(tour_dates)} dates):")
                sample_date = tour_dates[0]
                print(f"      Sample Date: {sample_date.get('date', 'Unknown')}")
                print(f"      Single Cabin Price: {sample_date.get('single_cabin_price', 'N/A')}")
                print(f"      Double Cabin Price: {sample_date.get('double_cabin_price', 'N/A')}")
            else:
                print("   📅 TOUR DATES: NONE")
            
            # Check other potentially useful fields
            print("   📋 OTHER USEFUL FIELDS:")
            other_fields = ['category', 'short_description', 'images', 'included_services', 'meeting_point']
            for field in other_fields:
                value = tour.get(field)
                if value is not None and value != "" and (not isinstance(value, list) or len(value) > 0):
                    if isinstance(value, list):
                        print(f"      ✅ {field}: {len(value)} items")
                    elif isinstance(value, str) and len(value) > 50:
                        print(f"      ✅ {field}: {value[:50]}...")
                    else:
                        print(f"      ✅ {field}: {value}")
                else:
                    print(f"      ⚠️  {field}: NULL/EMPTY")
        
        # Overall data quality assessment
        print(f"\n📊 OVERALL DATA QUALITY ASSESSMENT:")
        
        required_fields = ['pickup_time', 'dropoff_time', 'duration_days', 'duration_hours', 'classification', 'location']
        field_quality = {}
        
        for field in required_fields:
            valid_count = 0
            for tour in tours_response:
                value = tour.get(field)
                if value is not None and value != "" and value != 0:
                    valid_count += 1
            
            quality_rate = (valid_count / len(tours_response) * 100) if tours_response else 0
            field_quality[field] = {
                'valid_count': valid_count,
                'total_count': len(tours_response),
                'quality_rate': quality_rate
            }
            
            if quality_rate >= 80:
                status = "✅ EXCELLENT"
            elif quality_rate >= 50:
                status = "⚠️  NEEDS IMPROVEMENT"
            else:
                status = "🚨 CRITICAL"
            
            print(f"   {field}: {valid_count}/{len(tours_response)} ({quality_rate:.1f}%) {status}")
        
        # Recommendations
        print(f"\n💡 RECOMMENDATIONS FOR PAYMENTSUCCESSPAGE:")
        
        critical_fields = [field for field, data in field_quality.items() if data['quality_rate'] < 50]
        needs_improvement = [field for field, data in field_quality.items() if 50 <= data['quality_rate'] < 80]
        
        if critical_fields:
            print(f"   🚨 CRITICAL: These fields need immediate attention:")
            for field in critical_fields:
                print(f"      • {field} - only {field_quality[field]['quality_rate']:.1f}% populated")
            print(f"   💡 Consider setting default values or making these fields required")
        
        if needs_improvement:
            print(f"   ⚠️  IMPROVEMENT NEEDED:")
            for field in needs_improvement:
                print(f"      • {field} - {field_quality[field]['quality_rate']:.1f}% populated")
        
        if not critical_fields and not needs_improvement:
            print(f"   ✅ All fields have good data quality (>80% populated)")
        
        # Log final result
        overall_quality = sum(data['quality_rate'] for data in field_quality.values()) / len(field_quality)
        
        if overall_quality >= 80:
            self.log_test(
                "Sample Tour Data Analysis - Excellent Quality",
                True,
                f"Overall data quality: {overall_quality:.1f}% - PaymentSuccessPage should work well"
            )
            return True
        elif overall_quality >= 60:
            self.log_test(
                "Sample Tour Data Analysis - Good Quality",
                True,
                f"Overall data quality: {overall_quality:.1f}% - PaymentSuccessPage may have some missing info"
            )
            return True
        else:
            self.log_test(
                "Sample Tour Data Analysis - Poor Quality",
                False,
                f"Overall data quality: {overall_quality:.1f}% - PaymentSuccessPage will have significant missing data"
            )
            return False

    def test_payment_success_data_completeness(self):
        """Test 4: PaymentSuccessPage Data Completeness Simulation"""
        print("\n🔍 TEST 4: PAYMENTSUCCESSPAGE DATA COMPLETENESS SIMULATION")
        print("=" * 60)
        print("Simulating what data PaymentSuccessPage would actually receive")
        print("Testing complete booking → tour data → display flow")
        print("=" * 60)
        
        if not self.token:
            print("❌ No authentication token - cannot simulate complete flow")
            return False
        
        # Step 1: Get a tour for simulation
        tours_success, tours_response = self.run_test(
            "Get Tours for PaymentSuccessPage Simulation",
            "GET",
            "tours",
            200
        )
        
        if not tours_success or not tours_response:
            print("❌ Cannot get tours for simulation")
            return False
        
        # Find best tour for simulation (most complete data)
        best_tour = None
        best_score = -1
        
        required_fields = ['pickup_time', 'dropoff_time', 'duration_days', 'duration_hours', 'classification', 'location']
        
        for tour in tours_response:
            score = 0
            for field in required_fields:
                value = tour.get(field)
                if value is not None and value != "" and value != 0:
                    score += 1
            
            if score > best_score and tour.get('tour_dates'):
                best_score = score
                best_tour = tour
        
        if not best_tour:
            print("❌ No suitable tour found for simulation")
            return False
        
        tour_id = best_tour['id']
        tour_title = best_tour.get('title', 'Unknown')
        tour_date = best_tour['tour_dates'][0] if best_tour.get('tour_dates') else None
        
        print(f"   🎯 Simulating with Tour: '{tour_title}'")
        print(f"   📊 Tour Data Completeness: {best_score}/{len(required_fields)} fields")
        
        # Step 2: Simulate PaymentSuccessPage data collection
        print(f"\n📋 PAYMENTSUCCESSPAGE DATA SIMULATION:")
        
        # Simulate what PaymentSuccessPage would display
        payment_success_data = {
            'tour_info': {
                'title': best_tour.get('title', 'Tur Adı Bulunamadı'),
                'location': best_tour.get('location', 'Lokasyon Bilgisi Yok'),
                'classification': best_tour.get('classification', 'Sınıf Bilgisi Yok')
            },
            'time_info': {
                'pickup_time': best_tour.get('pickup_time', 'Biniş Saati Belirtilmemiş'),
                'dropoff_time': best_tour.get('dropoff_time', 'İniş Saati Belirtilmemiş')
            },
            'duration_info': {
                'duration_days': best_tour.get('duration_days', 0),
                'duration_hours': best_tour.get('duration_hours', 0)
            },
            'date_info': {
                'selected_date': tour_date.get('date', 'Tarih Bilgisi Yok') if tour_date else 'Tarih Seçilmemiş'
            },
            'pricing_info': {
                'single_cabin_price': tour_date.get('single_cabin_price', 0) if tour_date else 0,
                'double_cabin_price': tour_date.get('double_cabin_price', 0) if tour_date else 0
            }
        }
        
        # Display simulation results
        print("   🎫 BILET BİLGİLERİ (TICKET INFORMATION):")
        print("   " + "=" * 40)
        
        # Tour basic info
        print(f"   📍 Tur Adı: {payment_success_data['tour_info']['title']}")
        print(f"   📍 Lokasyon: {payment_success_data['tour_info']['location']}")
        print(f"   🏷️  Sınıf: {payment_success_data['tour_info']['classification']}")
        
        # Date and time info
        print(f"   📅 Tur Tarihi: {payment_success_data['date_info']['selected_date']}")
        print(f"   🕘 Biniş Saati: {payment_success_data['time_info']['pickup_time']}")
        print(f"   🕕 İniş Saati: {payment_success_data['time_info']['dropoff_time']}")
        
        # Duration info
        duration_days = payment_success_data['duration_info']['duration_days']
        duration_hours = payment_success_data['duration_info']['duration_hours']
        
        if duration_days and duration_days > 0:
            if duration_hours and duration_hours > 0:
                duration_text = f"{duration_days} Gün {duration_hours} Saat"
            else:
                duration_text = f"{duration_days} Gün"
        elif duration_hours and duration_hours > 0:
            duration_text = f"{duration_hours} Saat"
        else:
            duration_text = "Süre Bilgisi Yok"
        
        print(f"   ⏱️  Tur Süresi: {duration_text}")
        
        # Pricing info
        single_price = payment_success_data['pricing_info']['single_cabin_price']
        double_price = payment_success_data['pricing_info']['double_cabin_price']
        print(f"   💰 Tek Kişilik Kabin: {single_price} TL" if single_price > 0 else "   💰 Tek Kişilik Kabin: Fiyat Bilgisi Yok")
        print(f"   💰 Çift Kişilik Kabin: {double_price} TL" if double_price > 0 else "   💰 Çift Kişilik Kabin: Fiyat Bilgisi Yok")
        
        # Step 3: Identify missing or problematic data
        print(f"\n🔍 DATA QUALITY ANALYSIS:")
        
        issues = []
        
        # Check each field for issues
        if payment_success_data['tour_info']['location'] == 'Lokasyon Bilgisi Yok':
            issues.append("Lokasyon bilgisi eksik")
        
        if payment_success_data['tour_info']['classification'] == 'Sınıf Bilgisi Yok':
            issues.append("Sınıf bilgisi eksik")
        
        if payment_success_data['time_info']['pickup_time'] == 'Biniş Saati Belirtilmemiş':
            issues.append("Biniş saati eksik")
        
        if payment_success_data['time_info']['dropoff_time'] == 'İniş Saati Belirtilmemiş':
            issues.append("İniş saati eksik")
        
        if duration_text == "Süre Bilgisi Yok":
            issues.append("Tur süresi bilgisi eksik")
        
        if single_price == 0 and double_price == 0:
            issues.append("Fiyat bilgileri eksik")
        
        # Report issues
        if issues:
            print(f"   🚨 IDENTIFIED ISSUES ({len(issues)}):")
            for i, issue in enumerate(issues, 1):
                print(f"      {i}. {issue}")
            
            print(f"\n   💡 IMPACT ON USER EXPERIENCE:")
            print(f"      • Kullanıcı eksik bilgiler görecek")
            print(f"      • PaymentSuccessPage tam olarak doldurulmayacak")
            print(f"      • Bilet bilgileri eksik olacak")
            
            self.log_test(
                "PaymentSuccessPage Data Completeness - Issues Found",
                False,
                f"Found {len(issues)} data issues that will affect user experience",
                issues
            )
            return False
        else:
            print(f"   ✅ NO ISSUES FOUND")
            print(f"   ✅ PaymentSuccessPage will display complete information")
            print(f"   ✅ User will see all required ticket details")
            
            self.log_test(
                "PaymentSuccessPage Data Completeness - Perfect",
                True,
                "All required data available for complete PaymentSuccessPage display"
            )
            return True

    def run_comprehensive_test(self):
        """Run all PaymentSuccessPage data structure tests"""
        print("🎯 PAYMENTSUCCESSPAGE BİLET BİLGİLERİ DATA STRUCTURE TEST")
        print("=" * 70)
        print("Comprehensive testing of tour data structure for PaymentSuccessPage")
        print("Focus: Tur tarihi, Biniş/İniş saati, Tur süresi, Sınıf, Lokasyon")
        print("=" * 70)
        
        # Authentication
        print("\n🔐 PHASE 1: Authentication")
        auth_success = self.test_user_login()
        
        if not auth_success:
            print("⚠️  Authentication failed - some tests will be limited")
        
        # Test 1: Tour Data Structure Analysis
        print("\n📊 PHASE 2: Tour Data Structure Analysis")
        structure_success = self.test_tour_data_structure()
        
        # Test 2: Booking Data Flow Analysis
        print("\n🔄 PHASE 3: Booking Data Flow Analysis")
        if auth_success:
            flow_success = self.test_booking_data_flow()
        else:
            print("⚠️  Skipping booking flow test - no authentication")
            flow_success = False
        
        # Test 3: Sample Tour Data Analysis
        print("\n🔬 PHASE 4: Sample Tour Data Analysis")
        sample_success = self.test_sample_tour_data_analysis()
        
        # Test 4: PaymentSuccessPage Simulation
        print("\n🎫 PHASE 5: PaymentSuccessPage Data Completeness Simulation")
        if auth_success:
            completeness_success = self.test_payment_success_data_completeness()
        else:
            print("⚠️  Skipping completeness simulation - no authentication")
            completeness_success = False
        
        # Final Results
        self.print_final_results()
        
        return structure_success and sample_success

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 70)
        print("📊 PAYMENTSUCCESSPAGE DATA STRUCTURE TEST RESULTS")
        print("=" * 70)
        
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        print(f"Total Tests Run: {self.total_tests}")
        print(f"Tests Passed: {self.passed_tests}")
        print(f"Tests Failed: {self.total_tests - self.passed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        # Overall assessment
        if success_rate >= 80:
            print("\n🎉 EXCELLENT: PaymentSuccessPage data structure is well-prepared!")
            print("   ✅ Most tour data fields are properly populated")
            print("   ✅ Users should see complete ticket information")
        elif success_rate >= 60:
            print("\n⚠️  GOOD: PaymentSuccessPage will work but with some missing data")
            print("   ⚠️  Some tour information fields need improvement")
            print("   💡 Consider adding default values for missing fields")
        else:
            print("\n🚨 CRITICAL: PaymentSuccessPage will have significant data issues")
            print("   ❌ Many required fields are missing or empty")
            print("   🔧 Immediate backend data structure improvements needed")
        
        # Specific recommendations
        print(f"\n💡 RECOMMENDATIONS:")
        failed_tests = [test for test in self.test_results if not test['success']]
        
        if any('Tour Data Structure' in test['test'] for test in failed_tests):
            print("   🔧 Fix tour data structure - ensure all required fields are populated")
        
        if any('Booking Data Flow' in test['test'] for test in failed_tests):
            print("   🔧 Modify booking creation to include complete tour data")
        
        if any('Data Completeness' in test['test'] for test in failed_tests):
            print("   🔧 Add validation to ensure PaymentSuccessPage has all required data")
        
        print(f"\n📋 CRITICAL FIELDS FOR PAYMENTSUCCESSPAGE:")
        print("   • pickup_time (Biniş Saati)")
        print("   • dropoff_time (İniş Saati)")
        print("   • duration_days, duration_hours (Tur Süresi)")
        print("   • classification (Sınıf)")
        print("   • location (Lokasyon bilgileri)")
        
        # Save results
        try:
            results_file = f"/app/payment_success_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(results_file, 'w', encoding='utf-8') as f:
                json.dump({
                    "test_type": "PaymentSuccessPage Data Structure Test",
                    "summary": {
                        "total_tests": self.total_tests,
                        "passed_tests": self.passed_tests,
                        "failed_tests": self.total_tests - self.passed_tests,
                        "success_rate": success_rate,
                        "test_date": datetime.now().isoformat()
                    },
                    "detailed_results": self.test_results
                }, f, indent=2, ensure_ascii=False)
            print(f"\n📄 Detailed results saved to: {results_file}")
        except Exception as e:
            print(f"\n⚠️  Could not save results file: {e}")

if __name__ == "__main__":
    tester = PaymentSuccessDataTester()
    tester.run_comprehensive_test()