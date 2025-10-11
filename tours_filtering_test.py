import requests
import sys
import json
from datetime import datetime
import time
from collections import Counter

class ToursFilteringSystemTester:
    def __init__(self, base_url="https://tourslug.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.tours_data = []

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

    def test_backend_tours_api(self):
        """Test GET /api/tours endpoint to see what tour data is available"""
        print("\n🎯 PHASE 1: Backend Tours API Testing")
        print("=" * 60)
        
        success, response = self.run_test(
            "GET /api/tours - Retrieve All Tours",
            "GET",
            "tours",
            200
        )
        
        if success and response:
            self.tours_data = response
            print(f"   📊 Retrieved {len(response)} tours from database")
            
            # Log sample tour structure
            if len(response) > 0:
                sample_tour = response[0]
                print(f"\n   📋 Sample Tour Structure:")
                print(f"      • ID: {sample_tour.get('id', 'N/A')}")
                print(f"      • Title: {sample_tour.get('title', 'N/A')}")
                print(f"      • Category: {sample_tour.get('category', 'N/A')}")
                print(f"      • Location: {sample_tour.get('location', 'N/A')}")
                print(f"      • Classification: {sample_tour.get('classification', 'N/A')}")
                print(f"      • Duration Days: {sample_tour.get('duration_days', 'N/A')}")
                print(f"      • Duration Hours: {sample_tour.get('duration_hours', 'N/A')}")
                print(f"      • Duration Unit: {sample_tour.get('duration_unit', 'N/A')}")
                print(f"      • Rating: {sample_tour.get('rating', 'N/A')}")
                print(f"      • Review Count: {sample_tour.get('review_count', 'N/A')}")
                print(f"      • Minimum Price: {sample_tour.get('minimum_price', 'N/A')}")
                print(f"      • Base Price: {sample_tour.get('base_price', 'N/A')}")
                
                # Check tour dates structure
                tour_dates = sample_tour.get('tour_dates', [])
                if tour_dates:
                    print(f"      • Tour Dates Count: {len(tour_dates)}")
                    sample_date = tour_dates[0]
                    print(f"      • Sample Date Structure:")
                    print(f"        - Date: {sample_date.get('date', 'N/A')}")
                    print(f"        - Single Cabin Price: {sample_date.get('single_cabin_price', 'N/A')}")
                    print(f"        - Double Cabin Price: {sample_date.get('double_cabin_price', 'N/A')}")
                    print(f"        - Capacity: {sample_date.get('capacity', 'N/A')}")
                else:
                    print(f"      • Tour Dates: None")
            
            return True
        else:
            print("   ❌ Failed to retrieve tours from backend")
            return False

    def analyze_tour_structure(self):
        """Analyze tour structure for filtering fields"""
        print("\n🎯 PHASE 2: Tour Structure Analysis for Filtering")
        print("=" * 60)
        
        if not self.tours_data:
            print("   ❌ No tour data available for analysis")
            return False
        
        # Analyze each field that could be used for filtering
        categories = []
        locations = []
        classifications = []
        ratings = []
        duration_formats = []
        
        tours_with_category = 0
        tours_with_location = 0
        tours_with_classification = 0
        tours_with_rating = 0
        tours_with_duration = 0
        
        print(f"\n   📊 Analyzing {len(self.tours_data)} tours for filter data...")
        
        for i, tour in enumerate(self.tours_data):
            tour_title = tour.get('title', f'Tour {i+1}')
            
            # Category analysis
            category = tour.get('category')
            if category and category.strip():
                categories.append(category.strip())
                tours_with_category += 1
            
            # Location analysis
            location = tour.get('location')
            if location and location.strip():
                locations.append(location.strip())
                tours_with_location += 1
            
            # Classification analysis
            classification = tour.get('classification')
            if classification and classification.strip():
                classifications.append(classification.strip())
                tours_with_classification += 1
            
            # Rating analysis
            rating = tour.get('rating')
            if rating is not None and rating > 0:
                ratings.append(rating)
                tours_with_rating += 1
            
            # Duration analysis
            duration_days = tour.get('duration_days')
            duration_hours = tour.get('duration_hours')
            duration_unit = tour.get('duration_unit')
            
            if duration_days or duration_hours or duration_unit:
                tours_with_duration += 1
                
                # Analyze duration format
                if duration_unit == "days" and duration_days:
                    duration_formats.append(f"{duration_days} days")
                elif duration_unit == "hours" and duration_hours:
                    duration_formats.append(f"{duration_hours} hours")
                elif duration_days and not duration_unit:
                    duration_formats.append(f"{duration_days} (no unit)")
                elif duration_hours and not duration_unit:
                    duration_formats.append(f"{duration_hours} (no unit)")
                else:
                    duration_formats.append(f"days:{duration_days}, hours:{duration_hours}, unit:{duration_unit}")
        
        # Print analysis results
        print(f"\n   📋 FILTER DATA ANALYSIS RESULTS:")
        print(f"   " + "=" * 50)
        
        # Categories
        unique_categories = list(set(categories))
        print(f"   🏷️  CATEGORIES:")
        print(f"      • Tours with category data: {tours_with_category}/{len(self.tours_data)} ({tours_with_category/len(self.tours_data)*100:.1f}%)")
        print(f"      • Unique categories found: {len(unique_categories)}")
        if unique_categories:
            for cat in sorted(unique_categories):
                count = categories.count(cat)
                print(f"        - '{cat}' ({count} tours)")
        else:
            print(f"        - No categories found")
        
        # Locations
        unique_locations = list(set(locations))
        print(f"\n   📍 LOCATIONS:")
        print(f"      • Tours with location data: {tours_with_location}/{len(self.tours_data)} ({tours_with_location/len(self.tours_data)*100:.1f}%)")
        print(f"      • Unique locations found: {len(unique_locations)}")
        if unique_locations:
            for loc in sorted(unique_locations):
                count = locations.count(loc)
                print(f"        - '{loc}' ({count} tours)")
        else:
            print(f"        - No locations found")
        
        # Classifications
        unique_classifications = list(set(classifications))
        print(f"\n   ⭐ CLASSIFICATIONS:")
        print(f"      • Tours with classification data: {tours_with_classification}/{len(self.tours_data)} ({tours_with_classification/len(self.tours_data)*100:.1f}%)")
        print(f"      • Unique classifications found: {len(unique_classifications)}")
        if unique_classifications:
            for cls in sorted(unique_classifications):
                count = classifications.count(cls)
                print(f"        - '{cls}' ({count} tours)")
        else:
            print(f"        - No classifications found")
        
        # Ratings
        print(f"\n   ⭐ RATINGS:")
        print(f"      • Tours with rating data: {tours_with_rating}/{len(self.tours_data)} ({tours_with_rating/len(self.tours_data)*100:.1f}%)")
        if ratings:
            min_rating = min(ratings)
            max_rating = max(ratings)
            avg_rating = sum(ratings) / len(ratings)
            print(f"      • Rating range: {min_rating:.1f} - {max_rating:.1f}")
            print(f"      • Average rating: {avg_rating:.1f}")
            
            # Rating distribution
            rating_counts = Counter([round(r) for r in ratings])
            for rating in sorted(rating_counts.keys()):
                count = rating_counts[rating]
                print(f"        - {rating} stars: {count} tours")
        else:
            print(f"        - No ratings found")
        
        # Duration
        unique_durations = list(set(duration_formats))
        print(f"\n   ⏱️  DURATION:")
        print(f"      • Tours with duration data: {tours_with_duration}/{len(self.tours_data)} ({tours_with_duration/len(self.tours_data)*100:.1f}%)")
        print(f"      • Duration formats found: {len(unique_durations)}")
        if unique_durations:
            for dur in sorted(unique_durations):
                count = duration_formats.count(dur)
                print(f"        - '{dur}' ({count} tours)")
        else:
            print(f"        - No duration data found")
        
        # Store results for later use
        self.filter_analysis = {
            'categories': unique_categories,
            'locations': unique_locations,
            'classifications': unique_classifications,
            'ratings': ratings,
            'duration_formats': unique_durations,
            'coverage': {
                'category': tours_with_category / len(self.tours_data) * 100,
                'location': tours_with_location / len(self.tours_data) * 100,
                'classification': tours_with_classification / len(self.tours_data) * 100,
                'rating': tours_with_rating / len(self.tours_data) * 100,
                'duration': tours_with_duration / len(self.tours_data) * 100
            }
        }
        
        return True

    def test_sample_tour_data_analysis(self):
        """Get a few sample tours and log their complete structure"""
        print("\n🎯 PHASE 3: Sample Tour Data Analysis")
        print("=" * 60)
        
        if not self.tours_data:
            print("   ❌ No tour data available for sample analysis")
            return False
        
        # Take first 3 tours for detailed analysis
        sample_count = min(3, len(self.tours_data))
        print(f"   📊 Analyzing {sample_count} sample tours in detail...")
        
        for i in range(sample_count):
            tour = self.tours_data[i]
            print(f"\n   📋 SAMPLE TOUR {i+1}:")
            print(f"   " + "-" * 40)
            
            # Basic info
            print(f"   ID: {tour.get('id', 'N/A')}")
            print(f"   Title: {tour.get('title', 'N/A')}")
            print(f"   Description: {tour.get('description', 'N/A')[:100]}{'...' if len(str(tour.get('description', ''))) > 100 else ''}")
            
            # Filter-relevant fields
            print(f"\n   FILTER FIELDS:")
            print(f"   • Category: '{tour.get('category', 'EMPTY')}' {'✅' if tour.get('category') else '❌'}")
            print(f"   • Location: '{tour.get('location', 'EMPTY')}' {'✅' if tour.get('location') else '❌'}")
            print(f"   • Classification: '{tour.get('classification', 'EMPTY')}' {'✅' if tour.get('classification') else '❌'}")
            print(f"   • Rating: {tour.get('rating', 'EMPTY')} {'✅' if tour.get('rating') else '❌'}")
            print(f"   • Review Count: {tour.get('review_count', 'EMPTY')} {'✅' if tour.get('review_count') else '❌'}")
            
            # Duration fields
            print(f"\n   DURATION FIELDS:")
            print(f"   • Duration Days: {tour.get('duration_days', 'EMPTY')} {'✅' if tour.get('duration_days') else '❌'}")
            print(f"   • Duration Hours: {tour.get('duration_hours', 'EMPTY')} {'✅' if tour.get('duration_hours') else '❌'}")
            print(f"   • Duration Unit: '{tour.get('duration_unit', 'EMPTY')}' {'✅' if tour.get('duration_unit') else '❌'}")
            
            # Price fields
            print(f"\n   PRICE FIELDS:")
            print(f"   • Minimum Price: {tour.get('minimum_price', 'EMPTY')} {'✅' if tour.get('minimum_price') else '❌'}")
            print(f"   • Base Price: {tour.get('base_price', 'EMPTY')} {'✅' if tour.get('base_price') else '❌'}")
            
            # Tour dates analysis
            tour_dates = tour.get('tour_dates', [])
            print(f"\n   TOUR DATES ({len(tour_dates)} dates):")
            if tour_dates:
                for j, date in enumerate(tour_dates[:2]):  # Show first 2 dates
                    print(f"   Date {j+1}:")
                    print(f"     • Date: {date.get('date', 'N/A')}")
                    print(f"     • Single Cabin Price: {date.get('single_cabin_price', 'N/A')} {'✅' if date.get('single_cabin_price') else '❌'}")
                    print(f"     • Double Cabin Price: {date.get('double_cabin_price', 'N/A')} {'✅' if date.get('double_cabin_price') else '❌'}")
                    print(f"     • Capacity: {date.get('capacity', 'N/A')} {'✅' if date.get('capacity') else '❌'}")
                if len(tour_dates) > 2:
                    print(f"     ... and {len(tour_dates) - 2} more dates")
            else:
                print(f"   ❌ No tour dates found")
            
            # Additional fields
            print(f"\n   OTHER FIELDS:")
            print(f"   • Images: {len(tour.get('images', []))} images")
            print(f"   • Status: {tour.get('status', 'N/A')}")
            print(f"   • Created At: {tour.get('created_at', 'N/A')}")
        
        return True

    def test_filter_data_extraction(self):
        """Test that filter data can be extracted correctly from tours"""
        print("\n🎯 PHASE 4: Filter Data Extraction Testing")
        print("=" * 60)
        
        if not hasattr(self, 'filter_analysis'):
            print("   ❌ No filter analysis data available")
            return False
        
        analysis = self.filter_analysis
        
        print(f"   🧪 Testing filter data extraction capabilities...")
        
        # Test 1: Category extraction
        categories = analysis['categories']
        category_coverage = analysis['coverage']['category']
        
        if categories and len(categories) > 0:
            self.log_test("Category Filter Data Extraction", True, 
                         f"Found {len(categories)} unique categories with {category_coverage:.1f}% coverage")
            print(f"   ✅ Categories can be extracted: {', '.join(categories)}")
        else:
            self.log_test("Category Filter Data Extraction", False, "", 
                         "No categories found in tour data")
            print(f"   ❌ No categories available for filter dropdown")
        
        # Test 2: Location extraction
        locations = analysis['locations']
        location_coverage = analysis['coverage']['location']
        
        if locations and len(locations) > 0:
            self.log_test("Location Filter Data Extraction", True, 
                         f"Found {len(locations)} unique locations with {location_coverage:.1f}% coverage")
            print(f"   ✅ Locations can be extracted: {', '.join(locations)}")
        else:
            self.log_test("Location Filter Data Extraction", False, "", 
                         "No locations found in tour data")
            print(f"   ❌ No locations available for filter dropdown")
        
        # Test 3: Classification extraction
        classifications = analysis['classifications']
        classification_coverage = analysis['coverage']['classification']
        
        if classifications and len(classifications) > 0:
            self.log_test("Classification Filter Data Extraction", True, 
                         f"Found {len(classifications)} unique classifications with {classification_coverage:.1f}% coverage")
            print(f"   ✅ Classifications can be extracted: {', '.join(classifications)}")
        else:
            self.log_test("Classification Filter Data Extraction", False, "", 
                         "No classifications found in tour data")
            print(f"   ❌ No classifications available for filter dropdown")
        
        # Test 4: Rating extraction
        ratings = analysis['ratings']
        rating_coverage = analysis['coverage']['rating']
        
        if ratings and len(ratings) > 0:
            min_rating = min(ratings)
            max_rating = max(ratings)
            self.log_test("Rating Filter Data Extraction", True, 
                         f"Found ratings ranging from {min_rating:.1f} to {max_rating:.1f} with {rating_coverage:.1f}% coverage")
            print(f"   ✅ Ratings can be extracted: {min_rating:.1f} - {max_rating:.1f}")
        else:
            self.log_test("Rating Filter Data Extraction", False, "", 
                         "No ratings found in tour data")
            print(f"   ❌ No ratings available for filter")
        
        # Test 5: Duration extraction
        durations = analysis['duration_formats']
        duration_coverage = analysis['coverage']['duration']
        
        if durations and len(durations) > 0:
            self.log_test("Duration Filter Data Extraction", True, 
                         f"Found {len(durations)} duration formats with {duration_coverage:.1f}% coverage")
            print(f"   ✅ Duration data can be extracted:")
            for duration in durations:
                print(f"      • {duration}")
        else:
            self.log_test("Duration Filter Data Extraction", False, "", 
                         "No duration data found in tours")
            print(f"   ❌ No duration data available for filter")
        
        return True

    def test_duration_format_analysis(self):
        """Analyze duration formats used in the database"""
        print("\n🎯 PHASE 5: Duration Format Analysis")
        print("=" * 60)
        
        if not self.tours_data:
            print("   ❌ No tour data available for duration analysis")
            return False
        
        print(f"   🔍 Analyzing duration formats in {len(self.tours_data)} tours...")
        
        duration_patterns = {
            'days_only': [],
            'hours_only': [],
            'days_and_hours': [],
            'with_unit_days': [],
            'with_unit_hours': [],
            'no_duration': []
        }
        
        for tour in self.tours_data:
            title = tour.get('title', 'Unknown')
            duration_days = tour.get('duration_days')
            duration_hours = tour.get('duration_hours')
            duration_unit = tour.get('duration_unit')
            
            if duration_unit == 'days' and duration_days:
                duration_patterns['with_unit_days'].append({
                    'title': title,
                    'days': duration_days,
                    'hours': duration_hours,
                    'unit': duration_unit
                })
            elif duration_unit == 'hours' and duration_hours:
                duration_patterns['with_unit_hours'].append({
                    'title': title,
                    'days': duration_days,
                    'hours': duration_hours,
                    'unit': duration_unit
                })
            elif duration_days and duration_hours and not duration_unit:
                duration_patterns['days_and_hours'].append({
                    'title': title,
                    'days': duration_days,
                    'hours': duration_hours,
                    'unit': duration_unit
                })
            elif duration_days and not duration_hours and not duration_unit:
                duration_patterns['days_only'].append({
                    'title': title,
                    'days': duration_days,
                    'hours': duration_hours,
                    'unit': duration_unit
                })
            elif duration_hours and not duration_days and not duration_unit:
                duration_patterns['hours_only'].append({
                    'title': title,
                    'days': duration_days,
                    'hours': duration_hours,
                    'unit': duration_unit
                })
            else:
                duration_patterns['no_duration'].append({
                    'title': title,
                    'days': duration_days,
                    'hours': duration_hours,
                    'unit': duration_unit
                })
        
        # Print analysis results
        print(f"\n   📊 DURATION FORMAT ANALYSIS:")
        
        for pattern_name, tours in duration_patterns.items():
            count = len(tours)
            percentage = (count / len(self.tours_data)) * 100
            print(f"\n   {pattern_name.upper().replace('_', ' ')}: {count} tours ({percentage:.1f}%)")
            
            if count > 0 and count <= 3:
                for tour in tours:
                    print(f"      • {tour['title']}: days={tour['days']}, hours={tour['hours']}, unit={tour['unit']}")
            elif count > 3:
                for tour in tours[:2]:
                    print(f"      • {tour['title']}: days={tour['days']}, hours={tour['hours']}, unit={tour['unit']}")
                print(f"      ... and {count - 2} more")
        
        # Recommendations for frontend filtering
        print(f"\n   💡 RECOMMENDATIONS FOR FRONTEND FILTERING:")
        
        if duration_patterns['with_unit_days']:
            print(f"   ✅ Use duration_days + duration_unit='days' for day-based filters")
        
        if duration_patterns['with_unit_hours']:
            print(f"   ✅ Use duration_hours + duration_unit='hours' for hour-based filters")
        
        if duration_patterns['days_only']:
            print(f"   ⚠️  Some tours have duration_days without unit - assume 'days'")
        
        if duration_patterns['hours_only']:
            print(f"   ⚠️  Some tours have duration_hours without unit - assume 'hours'")
        
        if duration_patterns['no_duration']:
            print(f"   ❌ {len(duration_patterns['no_duration'])} tours have no duration data")
        
        return True

    def generate_filter_recommendations(self):
        """Generate recommendations for the filtering system"""
        print("\n🎯 PHASE 6: Filter System Recommendations")
        print("=" * 60)
        
        if not hasattr(self, 'filter_analysis'):
            print("   ❌ No filter analysis data available")
            return False
        
        analysis = self.filter_analysis
        
        print(f"   💡 RECOMMENDATIONS FOR TOURSPAGE FILTERING SYSTEM:")
        print(f"   " + "=" * 55)
        
        # Category filter recommendations
        categories = analysis['categories']
        category_coverage = analysis['coverage']['category']
        
        print(f"\n   🏷️  CATEGORY FILTER:")
        if categories and category_coverage >= 70:
            print(f"   ✅ IMPLEMENT: Good category coverage ({category_coverage:.1f}%)")
            print(f"      • Available options: {', '.join(categories)}")
            print(f"      • Recommended: Dynamic dropdown from database")
        elif categories and category_coverage >= 30:
            print(f"   ⚠️  IMPLEMENT WITH CAUTION: Moderate coverage ({category_coverage:.1f}%)")
            print(f"      • Available options: {', '.join(categories)}")
            print(f"      • Recommended: Show 'No category' option for tours without category")
        else:
            print(f"   ❌ NOT RECOMMENDED: Poor coverage ({category_coverage:.1f}%)")
            print(f"      • Consider adding category data to tours first")
        
        # Location filter recommendations
        locations = analysis['locations']
        location_coverage = analysis['coverage']['location']
        
        print(f"\n   📍 LOCATION FILTER:")
        if locations and location_coverage >= 70:
            print(f"   ✅ IMPLEMENT: Good location coverage ({location_coverage:.1f}%)")
            print(f"      • Available options: {', '.join(locations)}")
            print(f"      • Recommended: Dynamic dropdown from database")
        elif locations and location_coverage >= 30:
            print(f"   ⚠️  IMPLEMENT WITH CAUTION: Moderate coverage ({location_coverage:.1f}%)")
            print(f"      • Available options: {', '.join(locations)}")
            print(f"      • Recommended: Show 'No location' option")
        else:
            print(f"   ❌ NOT RECOMMENDED: Poor coverage ({location_coverage:.1f}%)")
            print(f"      • Consider adding location data to tours first")
        
        # Classification filter recommendations
        classifications = analysis['classifications']
        classification_coverage = analysis['coverage']['classification']
        
        print(f"\n   ⭐ CLASSIFICATION FILTER:")
        if classifications and classification_coverage >= 70:
            print(f"   ✅ IMPLEMENT: Good classification coverage ({classification_coverage:.1f}%)")
            print(f"      • Available options: {', '.join(classifications)}")
            print(f"      • Recommended: Dynamic dropdown from database")
        elif classifications and classification_coverage >= 30:
            print(f"   ⚠️  IMPLEMENT WITH CAUTION: Moderate coverage ({classification_coverage:.1f}%)")
            print(f"      • Available options: {', '.join(classifications)}")
        else:
            print(f"   ❌ NOT RECOMMENDED: Poor coverage ({classification_coverage:.1f}%)")
        
        # Rating filter recommendations
        ratings = analysis['ratings']
        rating_coverage = analysis['coverage']['rating']
        
        print(f"\n   ⭐ RATING FILTER:")
        if ratings and rating_coverage >= 50:
            min_rating = min(ratings)
            max_rating = max(ratings)
            print(f"   ✅ IMPLEMENT: Good rating coverage ({rating_coverage:.1f}%)")
            print(f"      • Rating range: {min_rating:.1f} - {max_rating:.1f}")
            print(f"      • Recommended: 'Minimum rating' slider or star selection")
        elif ratings and rating_coverage >= 20:
            print(f"   ⚠️  IMPLEMENT WITH CAUTION: Moderate coverage ({rating_coverage:.1f}%)")
            print(f"      • Many tours don't have ratings yet")
        else:
            print(f"   ❌ NOT RECOMMENDED: Poor coverage ({rating_coverage:.1f}%)")
        
        # Duration filter recommendations
        duration_coverage = analysis['coverage']['duration']
        
        print(f"\n   ⏱️  DURATION FILTER:")
        if duration_coverage >= 70:
            print(f"   ✅ IMPLEMENT: Good duration coverage ({duration_coverage:.1f}%)")
            print(f"      • Recommended: Separate filters for hours and days")
            print(f"      • Use duration_unit field to distinguish between hours/days")
        elif duration_coverage >= 30:
            print(f"   ⚠️  IMPLEMENT WITH CAUTION: Moderate coverage ({duration_coverage:.1f}%)")
        else:
            print(f"   ❌ NOT RECOMMENDED: Poor coverage ({duration_coverage:.1f}%)")
        
        # Overall recommendation
        print(f"\n   🎯 OVERALL FILTERING SYSTEM RECOMMENDATION:")
        
        implementable_filters = []
        if category_coverage >= 30: implementable_filters.append("Category")
        if location_coverage >= 30: implementable_filters.append("Location")
        if classification_coverage >= 30: implementable_filters.append("Classification")
        if rating_coverage >= 20: implementable_filters.append("Rating")
        if duration_coverage >= 30: implementable_filters.append("Duration")
        
        if len(implementable_filters) >= 3:
            print(f"   ✅ GOOD: {len(implementable_filters)} filters can be implemented")
            print(f"      • Recommended filters: {', '.join(implementable_filters)}")
            print(f"      • Dynamic filtering system is viable")
        elif len(implementable_filters) >= 1:
            print(f"   ⚠️  MODERATE: {len(implementable_filters)} filters can be implemented")
            print(f"      • Recommended filters: {', '.join(implementable_filters)}")
            print(f"      • Consider improving data quality for other filters")
        else:
            print(f"   ❌ POOR: No filters have sufficient data coverage")
            print(f"      • Recommend improving tour data quality first")
        
        return True

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 70)
        print("📊 TOURS FILTERING SYSTEM TEST RESULTS")
        print("=" * 70)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🎉 EXCELLENT: Tours filtering system data is ready!")
        elif success_rate >= 60:
            print("⚠️  GOOD: Most filter data available, some improvements needed")
        else:
            print("🚨 CRITICAL: Major data quality issues for filtering system")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test_name']}: {test['error']}")
        
        # Print summary of filter data availability
        if hasattr(self, 'filter_analysis'):
            analysis = self.filter_analysis
            print(f"\n📊 FILTER DATA SUMMARY:")
            print(f"   • Categories: {len(analysis['categories'])} unique ({analysis['coverage']['category']:.1f}% coverage)")
            print(f"   • Locations: {len(analysis['locations'])} unique ({analysis['coverage']['location']:.1f}% coverage)")
            print(f"   • Classifications: {len(analysis['classifications'])} unique ({analysis['coverage']['classification']:.1f}% coverage)")
            print(f"   • Ratings: Available in {analysis['coverage']['rating']:.1f}% of tours")
            print(f"   • Duration: Available in {analysis['coverage']['duration']:.1f}% of tours")

    def run_comprehensive_filtering_test(self):
        """Run comprehensive filtering system test"""
        print("🚀 Starting ToursPage Filtering System Testing")
        print("=" * 70)
        print("Testing the updated ToursPage filtering system to verify")
        print("that dynamic filtering can extract real filter options from tour data")
        print("=" * 70)
        
        # Phase 1: Backend Tours API Testing
        if not self.test_backend_tours_api():
            print("❌ Cannot proceed without tour data")
            self.print_final_results()
            return False
        
        # Phase 2: Tour Structure Analysis
        if not self.analyze_tour_structure():
            print("❌ Cannot analyze tour structure")
            self.print_final_results()
            return False
        
        # Phase 3: Sample Tour Data Analysis
        self.test_sample_tour_data_analysis()
        
        # Phase 4: Filter Data Extraction Testing
        self.test_filter_data_extraction()
        
        # Phase 5: Duration Format Analysis
        self.test_duration_format_analysis()
        
        # Phase 6: Generate Recommendations
        self.generate_filter_recommendations()
        
        # Print final results
        self.print_final_results()
        
        return True

if __name__ == "__main__":
    tester = ToursFilteringSystemTester()
    tester.run_comprehensive_filtering_test()