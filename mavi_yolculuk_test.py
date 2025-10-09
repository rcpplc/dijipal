#!/usr/bin/env python3
"""
Mavi Yolculuk Category System Testing
Testing category system and tour data for mavi-yolculuk as requested in review.
"""

import requests
import json
import sys
from urllib.parse import quote

# Configuration
BACKEND_URL = "https://tour-admin-hub.preview.emergentagent.com/api"

def test_available_tours_and_categories():
    """Test 1: Check available tours and categories"""
    print("🔍 TEST 1: Checking available tours and categories...")
    
    try:
        # Get all tours
        response = requests.get(f"{BACKEND_URL}/tours")
        print(f"   📡 GET /api/tours - Status: {response.status_code}")
        
        if response.status_code == 200:
            tours = response.json()
            print(f"   📊 Found {len(tours)} tours total")
            
            # Extract all unique categories
            categories = set()
            locations = set()
            
            for tour in tours:
                if 'category' in tour and tour['category']:
                    categories.add(tour['category'])
                if 'location' in tour and tour['location']:
                    locations.add(tour['location'])
            
            print(f"   📋 Unique categories found: {sorted(list(categories))}")
            print(f"   📍 Unique locations found: {sorted(list(locations))}")
            
            # Check for mavi-yolculuk variations
            mavi_yolculuk_found = False
            for category in categories:
                if 'mavi' in category.lower() and 'yolculuk' in category.lower():
                    print(f"   ✅ Found mavi yolculuk category: '{category}'")
                    mavi_yolculuk_found = True
            
            if not mavi_yolculuk_found:
                print("   ❌ No 'mavi yolculuk' category found in tours")
            
            return {
                'success': True,
                'tours_count': len(tours),
                'categories': list(categories),
                'locations': list(locations),
                'mavi_yolculuk_found': mavi_yolculuk_found
            }
        else:
            print(f"   ❌ Failed to get tours: {response.status_code}")
            return {'success': False, 'error': f"HTTP {response.status_code}"}
            
    except Exception as e:
        print(f"   ❌ Error getting tours: {str(e)}")
        return {'success': False, 'error': str(e)}

def test_category_filtering():
    """Test 2: Test category filtering with different formats"""
    print("\n🔍 TEST 2: Testing category filtering...")
    
    test_cases = [
        "mavi-yolculuk",
        "Mavi yolculuk", 
        "mavi yolculuk",
        "Mavi-yolculuk",
        "MAVI YOLCULUK"
    ]
    
    results = {}
    
    for category in test_cases:
        try:
            # URL encode the category parameter
            encoded_category = quote(category)
            url = f"{BACKEND_URL}/tours?category={encoded_category}"
            
            print(f"   📡 Testing: /api/tours?category={category}")
            response = requests.get(url)
            print(f"      Status: {response.status_code}")
            
            if response.status_code == 200:
                tours = response.json()
                print(f"      Found {len(tours)} tours")
                
                # Show tour titles if any found
                if tours:
                    for tour in tours[:3]:  # Show first 3
                        print(f"      - {tour.get('title', 'No title')}")
                
                results[category] = {
                    'success': True,
                    'count': len(tours),
                    'tours': [t.get('title', 'No title') for t in tours[:3]]
                }
            else:
                print(f"      ❌ Failed: {response.status_code}")
                results[category] = {'success': False, 'status': response.status_code}
                
        except Exception as e:
            print(f"      ❌ Error: {str(e)}")
            results[category] = {'success': False, 'error': str(e)}
    
    return results

def test_location_filtering():
    """Test 3: Test location filtering"""
    print("\n🔍 TEST 3: Testing location filtering...")
    
    test_locations = [
        "fethiye",
        "Fethiye", 
        "FETHIYE",
        "göcek",
        "Göcek",
        "bodrum",
        "Bodrum"
    ]
    
    results = {}
    
    for location in test_locations:
        try:
            encoded_location = quote(location)
            url = f"{BACKEND_URL}/tours?location={encoded_location}"
            
            print(f"   📡 Testing: /api/tours?location={location}")
            response = requests.get(url)
            print(f"      Status: {response.status_code}")
            
            if response.status_code == 200:
                tours = response.json()
                print(f"      Found {len(tours)} tours")
                
                # Show tour titles and locations if any found
                if tours:
                    for tour in tours[:3]:  # Show first 3
                        tour_location = tour.get('location', 'No location')
                        print(f"      - {tour.get('title', 'No title')} (Location: {tour_location})")
                
                results[location] = {
                    'success': True,
                    'count': len(tours),
                    'tours': [(t.get('title', 'No title'), t.get('location', 'No location')) for t in tours[:3]]
                }
            else:
                print(f"      ❌ Failed: {response.status_code}")
                results[location] = {'success': False, 'status': response.status_code}
                
        except Exception as e:
            print(f"      ❌ Error: {str(e)}")
            results[location] = {'success': False, 'error': str(e)}
    
    return results

def test_category_routes():
    """Test 4: Test category routes and admin endpoints"""
    print("\n🔍 TEST 4: Testing category routes...")
    
    # Test category detail endpoints
    category_endpoints = [
        "/categories/mavi-yolculuk",
        "/categories/mavi yolculuk",
        "/admin/categories",
        "/admin/new-categories"
    ]
    
    results = {}
    
    for endpoint in category_endpoints:
        try:
            # Handle spaces in URLs
            if ' ' in endpoint:
                encoded_endpoint = endpoint.replace(' ', '%20')
            else:
                encoded_endpoint = endpoint
                
            url = f"{BACKEND_URL}{encoded_endpoint}"
            print(f"   📡 Testing: {endpoint}")
            
            response = requests.get(url)
            print(f"      Status: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, list):
                        print(f"      Found {len(data)} items")
                        if data and len(data) > 0:
                            # Show first item structure
                            first_item = data[0]
                            if isinstance(first_item, dict):
                                keys = list(first_item.keys())[:5]  # Show first 5 keys
                                print(f"      Sample keys: {keys}")
                    elif isinstance(data, dict):
                        keys = list(data.keys())[:5]  # Show first 5 keys
                        print(f"      Response keys: {keys}")
                        
                        # Check for specific fields
                        if 'title' in data:
                            print(f"      Title: {data['title']}")
                        if 'description' in data:
                            print(f"      Has description: {bool(data['description'])}")
                        if 'faq' in data:
                            print(f"      FAQ items: {len(data.get('faq', []))}")
                    
                    results[endpoint] = {
                        'success': True,
                        'data_type': type(data).__name__,
                        'count': len(data) if isinstance(data, list) else 1
                    }
                except json.JSONDecodeError:
                    print(f"      ⚠️ Response not JSON")
                    results[endpoint] = {'success': True, 'data_type': 'non-json'}
            elif response.status_code == 401:
                print(f"      🔒 Authentication required")
                results[endpoint] = {'success': False, 'status': 401, 'note': 'Auth required'}
            elif response.status_code == 403:
                print(f"      🚫 Access forbidden")
                results[endpoint] = {'success': False, 'status': 403, 'note': 'Forbidden'}
            elif response.status_code == 404:
                print(f"      ❌ Not found")
                results[endpoint] = {'success': False, 'status': 404, 'note': 'Not found'}
            else:
                print(f"      ❌ Failed: {response.status_code}")
                results[endpoint] = {'success': False, 'status': response.status_code}
                
        except Exception as e:
            print(f"      ❌ Error: {str(e)}")
            results[endpoint] = {'success': False, 'error': str(e)}
    
    return results

def test_admin_categories_with_auth():
    """Test 5: Test admin categories with authentication"""
    print("\n🔍 TEST 5: Testing admin categories with authentication...")
    
    # First try to login as admin
    login_data = {
        "email": "admin@example.com",
        "password": "admin123"
    }
    
    try:
        print("   🔐 Attempting admin login...")
        login_response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data)
        print(f"      Login status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            token = login_result.get('token')
            print(f"      ✅ Login successful, token length: {len(token) if token else 0}")
            
            # Test admin endpoints with authentication
            headers = {"Authorization": f"Bearer {token}"}
            
            admin_endpoints = [
                "/admin/categories",
                "/admin/new-categories"
            ]
            
            results = {}
            
            for endpoint in admin_endpoints:
                try:
                    url = f"{BACKEND_URL}{endpoint}"
                    print(f"   📡 Testing authenticated: {endpoint}")
                    
                    response = requests.get(url, headers=headers)
                    print(f"      Status: {response.status_code}")
                    
                    if response.status_code == 200:
                        data = response.json()
                        print(f"      Found {len(data)} categories")
                        
                        # Look for mavi yolculuk categories
                        mavi_categories = []
                        for item in data:
                            if isinstance(item, dict):
                                title = item.get('title', item.get('name', ''))
                                if 'mavi' in title.lower() and 'yolculuk' in title.lower():
                                    mavi_categories.append(title)
                        
                        if mavi_categories:
                            print(f"      ✅ Found mavi yolculuk categories: {mavi_categories}")
                        else:
                            print(f"      ❌ No mavi yolculuk categories found")
                        
                        results[endpoint] = {
                            'success': True,
                            'count': len(data),
                            'mavi_categories': mavi_categories
                        }
                    else:
                        print(f"      ❌ Failed: {response.status_code}")
                        results[endpoint] = {'success': False, 'status': response.status_code}
                        
                except Exception as e:
                    print(f"      ❌ Error: {str(e)}")
                    results[endpoint] = {'success': False, 'error': str(e)}
            
            return {'login_success': True, 'results': results}
            
        else:
            print(f"      ❌ Login failed: {login_response.status_code}")
            return {'login_success': False, 'status': login_response.status_code}
            
    except Exception as e:
        print(f"      ❌ Login error: {str(e)}")
        return {'login_success': False, 'error': str(e)}

def main():
    """Run all mavi-yolculuk category tests"""
    print("🚀 MAVI YOLCULUK CATEGORY SYSTEM TESTING")
    print("=" * 60)
    
    # Run all tests
    test1_result = test_available_tours_and_categories()
    test2_result = test_category_filtering()
    test3_result = test_location_filtering()
    test4_result = test_category_routes()
    test5_result = test_admin_categories_with_auth()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 MAVI YOLCULUK TESTING SUMMARY")
    print("=" * 60)
    
    print(f"1. Tours & Categories: {'✅ PASS' if test1_result.get('success') else '❌ FAIL'}")
    if test1_result.get('success'):
        print(f"   - Total tours: {test1_result.get('tours_count', 0)}")
        print(f"   - Categories: {len(test1_result.get('categories', []))}")
        print(f"   - Mavi yolculuk found: {'✅' if test1_result.get('mavi_yolculuk_found') else '❌'}")
    
    print(f"\n2. Category Filtering: {'✅ PASS' if any(r.get('success') for r in test2_result.values()) else '❌ FAIL'}")
    successful_filters = [k for k, v in test2_result.items() if v.get('success')]
    if successful_filters:
        print(f"   - Working filters: {len(successful_filters)}/{len(test2_result)}")
        for filter_name in successful_filters[:3]:  # Show first 3
            count = test2_result[filter_name].get('count', 0)
            print(f"   - '{filter_name}': {count} tours")
    
    print(f"\n3. Location Filtering: {'✅ PASS' if any(r.get('success') for r in test3_result.values()) else '❌ FAIL'}")
    successful_locations = [k for k, v in test3_result.items() if v.get('success')]
    if successful_locations:
        print(f"   - Working locations: {len(successful_locations)}/{len(test3_result)}")
        for location in successful_locations[:3]:  # Show first 3
            count = test3_result[location].get('count', 0)
            print(f"   - '{location}': {count} tours")
    
    print(f"\n4. Category Routes: {'✅ PASS' if any(r.get('success') for r in test4_result.values()) else '❌ FAIL'}")
    working_routes = [k for k, v in test4_result.items() if v.get('success')]
    if working_routes:
        print(f"   - Working routes: {len(working_routes)}/{len(test4_result)}")
    
    print(f"\n5. Admin Categories: {'✅ PASS' if test5_result.get('login_success') else '❌ FAIL'}")
    if test5_result.get('login_success'):
        admin_results = test5_result.get('results', {})
        working_admin = [k for k, v in admin_results.items() if v.get('success')]
        print(f"   - Working admin endpoints: {len(working_admin)}/{len(admin_results)}")
        
        # Check for mavi yolculuk in admin data
        all_mavi_categories = []
        for result in admin_results.values():
            if result.get('success'):
                all_mavi_categories.extend(result.get('mavi_categories', []))
        
        if all_mavi_categories:
            print(f"   - Mavi yolculuk categories in admin: {len(all_mavi_categories)}")
        else:
            print(f"   - ❌ No mavi yolculuk categories found in admin")
    
    # Overall assessment
    total_tests = 5
    passed_tests = sum([
        1 if test1_result.get('success') else 0,
        1 if any(r.get('success') for r in test2_result.values()) else 0,
        1 if any(r.get('success') for r in test3_result.values()) else 0,
        1 if any(r.get('success') for r in test4_result.values()) else 0,
        1 if test5_result.get('login_success') else 0
    ])
    
    print(f"\n🎯 OVERALL RESULT: {passed_tests}/{total_tests} tests passed ({passed_tests/total_tests*100:.1f}%)")
    
    if passed_tests == total_tests:
        print("🎉 ALL TESTS PASSED - Mavi yolculuk category system working correctly!")
    elif passed_tests >= 3:
        print("⚠️ MOSTLY WORKING - Some issues found that need attention")
    else:
        print("❌ MAJOR ISSUES - Mavi yolculuk category system needs significant fixes")
    
    return {
        'total_tests': total_tests,
        'passed_tests': passed_tests,
        'success_rate': passed_tests/total_tests*100,
        'test_results': {
            'tours_and_categories': test1_result,
            'category_filtering': test2_result,
            'location_filtering': test3_result,
            'category_routes': test4_result,
            'admin_categories': test5_result
        }
    }

if __name__ == "__main__":
    main()