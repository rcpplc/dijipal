import requests
import json
from datetime import datetime

class DurationTestChecker:
    def __init__(self, base_url="https://pakettur-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.test_results = []

    def log_result(self, test_name, success, details="", error=""):
        """Log test result"""
        result = {
            "test_name": test_name,
            "success": success,
            "details": details,
            "error": error,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        if success:
            print(f"✅ {test_name}")
            if details:
                print(f"   📋 {details}")
        else:
            print(f"❌ {test_name}")
            if error:
                print(f"   ❌ {error}")

    def check_tour_by_slug(self, tour_slug):
        """Check tour data by slug"""
        print(f"\n🔍 Checking tour data for slug: '{tour_slug}'")
        
        try:
            # Try to get tour by slug
            url = f"{self.api_url}/tours/{tour_slug}"
            print(f"   📡 GET {url}")
            
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                tour_data = response.json()
                
                # Extract key information
                tour_id = tour_data.get('id', 'N/A')
                title = tour_data.get('title', 'N/A')
                duration_days = tour_data.get('duration_days', 'N/A')
                duration_unit = tour_data.get('duration_unit', 'N/A')
                duration_hours = tour_data.get('duration_hours', 'N/A')
                
                self.log_result(
                    f"Tour Found: {title}",
                    True,
                    f"ID: {tour_id}, Duration: {duration_days} {duration_unit}, Hours: {duration_hours}"
                )
                
                # Check duration fields specifically
                print(f"\n📊 DURATION ANALYSIS FOR: {title}")
                print(f"   🔢 duration_days: {duration_days}")
                print(f"   🔢 duration_unit: {duration_unit}")
                print(f"   🔢 duration_hours: {duration_hours}")
                
                # Validate duration for 4-day tour
                if "4 gece" in title.lower() or "4-gece" in title.lower():
                    print(f"\n✅ This appears to be a 4-night tour based on title")
                    
                    if duration_unit == "days" and duration_days == 4:
                        self.log_result(
                            "Duration Unit Validation",
                            True,
                            f"Correctly stored as {duration_days} {duration_unit}"
                        )
                    elif duration_unit == "hours":
                        self.log_result(
                            "Duration Unit Issue Found",
                            False,
                            "",
                            f"Tour stored as {duration_days} {duration_unit} but should be 'days' for 4-night tour"
                        )
                    else:
                        self.log_result(
                            "Duration Unit Check",
                            False,
                            "",
                            f"Unexpected duration_unit: {duration_unit} (expected 'days')"
                        )
                
                return tour_data
                
            elif response.status_code == 404:
                self.log_result(
                    "Tour Not Found",
                    False,
                    "",
                    f"Tour with slug '{tour_slug}' not found (404)"
                )
                return None
            else:
                self.log_result(
                    "API Error",
                    False,
                    "",
                    f"HTTP {response.status_code}: {response.text[:200]}"
                )
                return None
                
        except requests.exceptions.Timeout:
            self.log_result("Request Timeout", False, "", "Request timed out after 30 seconds")
            return None
        except requests.exceptions.ConnectionError:
            self.log_result("Connection Error", False, "", "Could not connect to server")
            return None
        except Exception as e:
            self.log_result("Exception", False, "", f"Unexpected error: {str(e)}")
            return None

    def search_tours_for_gocek_fethiye(self):
        """Search all tours for Göcek-Fethiye tours"""
        print(f"\n🔍 Searching all tours for Göcek-Fethiye tours...")
        
        try:
            url = f"{self.api_url}/tours"
            print(f"   📡 GET {url}")
            
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                tours = response.json()
                print(f"   📊 Found {len(tours)} total tours in database")
                
                # Search for Göcek-Fethiye tours
                matching_tours = []
                for tour in tours:
                    title = tour.get('title', '').lower()
                    location = tour.get('location', '').lower()
                    
                    if ('göcek' in title or 'gocek' in title or 'göcek' in location or 'gocek' in location) and \
                       ('fethiye' in title or 'fethiye' in location):
                        matching_tours.append(tour)
                
                if matching_tours:
                    print(f"\n✅ Found {len(matching_tours)} Göcek-Fethiye tours:")
                    
                    for i, tour in enumerate(matching_tours, 1):
                        tour_id = tour.get('id', 'N/A')
                        title = tour.get('title', 'N/A')
                        duration_days = tour.get('duration_days', 'N/A')
                        duration_unit = tour.get('duration_unit', 'N/A')
                        
                        print(f"\n   {i}. {title}")
                        print(f"      ID: {tour_id}")
                        print(f"      Duration: {duration_days} {duration_unit}")
                        
                        # Check if this matches the requested tour
                        if "4 gece" in title.lower() or "4-gece" in title.lower():
                            print(f"      🎯 THIS APPEARS TO BE THE REQUESTED 4-NIGHT TOUR!")
                            
                            # Detailed analysis
                            print(f"\n📊 DETAILED ANALYSIS FOR: {title}")
                            print(f"   🔢 duration_days: {duration_days}")
                            print(f"   🔢 duration_unit: {duration_unit}")
                            
                            if duration_unit == "days":
                                self.log_result(
                                    "Target Tour Duration Check",
                                    True,
                                    f"Tour correctly stored with duration_unit='days' ({duration_days} days)"
                                )
                            else:
                                self.log_result(
                                    "Target Tour Duration Issue",
                                    False,
                                    "",
                                    f"Tour stored with duration_unit='{duration_unit}' but should be 'days'"
                                )
                            
                            # Get full tour data
                            print(f"\n🔍 Getting full tour data for detailed analysis...")
                            full_tour_data = self.check_tour_by_slug(tour_id)
                            
                            if full_tour_data:
                                print(f"\n📋 COMPLETE TOUR DATA STRUCTURE:")
                                print(json.dumps(full_tour_data, indent=2, ensure_ascii=False))
                    
                    return matching_tours
                else:
                    self.log_result(
                        "No Matching Tours",
                        False,
                        "",
                        "No Göcek-Fethiye tours found in database"
                    )
                    return []
                    
            else:
                self.log_result(
                    "Tours API Error",
                    False,
                    "",
                    f"HTTP {response.status_code}: {response.text[:200]}"
                )
                return []
                
        except Exception as e:
            self.log_result("Search Exception", False, "", f"Error searching tours: {str(e)}")
            return []

    def run_duration_check(self):
        """Run the complete duration check test"""
        print("🎯 DURATION UNIT VERIFICATION TEST")
        print("=" * 70)
        print("Checking tour data for 'gocek-fethiye-4-gece-5-gun-kabin-turu'")
        print("Verifying duration and duration_unit fields")
        print("=" * 70)
        
        # Method 1: Try direct slug lookup
        print("\n📋 METHOD 1: Direct Slug Lookup")
        tour_data = self.check_tour_by_slug("gocek-fethiye-4-gece-5-gun-kabin-turu")
        
        if not tour_data:
            # Method 2: Search all tours
            print("\n📋 METHOD 2: Search All Tours")
            matching_tours = self.search_tours_for_gocek_fethiye()
            
            if not matching_tours:
                print("\n❌ No Göcek-Fethiye tours found in database")
                print("   This could explain why the tour is not displaying correctly")
        
        # Print summary
        print("\n" + "=" * 70)
        print("📊 TEST SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['success']])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test_name']}: {result['error']}")
        
        # Specific findings for the review request
        print(f"\n🎯 FINDINGS FOR REVIEW REQUEST:")
        print(f"1. Tour slug 'gocek-fethiye-4-gece-5-gun-kabin-turu' search completed")
        print(f"2. Duration and duration_unit field verification completed")
        print(f"3. Database structure analysis completed")
        
        if passed_tests == total_tests:
            print(f"\n✅ All tests passed - no duration_unit issues found")
        else:
            print(f"\n⚠️  Issues found - see failed tests above")

if __name__ == "__main__":
    checker = DurationTestChecker()
    checker.run_duration_check()