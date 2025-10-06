import requests
import json

def test_frontend_booking_page():
    """Test the frontend booking page endpoint"""
    base_url = "https://paket-tur-portal.preview.emergentagent.com"
    
    # Test the booking page route that user mentioned
    tour_id = "3ded39ad-36a4-47d1-87b9-7baeb5f00f55"
    booking_url = f"{base_url}/booking/{tour_id}"
    
    print("🔍 Testing Frontend Booking Page Route")
    print(f"   URL: {booking_url}")
    print("   This is the route user clicks from 'Rezervasyon Tamamla' button")
    
    try:
        # Test if the booking page loads
        response = requests.get(booking_url, timeout=30)
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Booking page loads successfully")
            
            # Check if it's an HTML page (React app)
            content_type = response.headers.get('content-type', '')
            if 'text/html' in content_type:
                print("✅ Returns HTML content (React app)")
                
                # Check if the page contains React app content
                content = response.text
                if 'react' in content.lower() or 'root' in content:
                    print("✅ Contains React app structure")
                else:
                    print("⚠️  May not be loading React app properly")
                    
                # Check for any obvious errors in the HTML
                if 'error' in content.lower() or 'not found' in content.lower():
                    print("❌ Page contains error messages")
                    print(f"   Content preview: {content[:500]}...")
                else:
                    print("✅ No obvious errors in page content")
                    
            else:
                print(f"⚠️  Unexpected content type: {content_type}")
                
        elif response.status_code == 404:
            print("❌ Booking page route not found (404)")
            print("   This could be the issue - frontend routing may not handle /booking/{tourId}")
            
        else:
            print(f"❌ Booking page failed to load: {response.status_code}")
            print(f"   Response: {response.text[:200]}...")
            
    except Exception as e:
        print(f"❌ Error testing booking page: {str(e)}")

def test_api_vs_frontend_routes():
    """Test different route patterns to understand the issue"""
    base_url = "https://paket-tur-portal.preview.emergentagent.com"
    tour_id = "3ded39ad-36a4-47d1-87b9-7baeb5f00f55"
    
    routes_to_test = [
        f"/booking/{tour_id}",  # What user mentioned
        f"/booking",  # Generic booking page
        f"/tours/{tour_id}",  # Tour detail page
        f"/api/tours/{tour_id}",  # API endpoint (should work)
    ]
    
    print("\n🔍 Testing Different Route Patterns")
    print("=" * 50)
    
    for route in routes_to_test:
        url = f"{base_url}{route}"
        print(f"\n   Testing: {route}")
        
        try:
            response = requests.get(url, timeout=30)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                if 'application/json' in content_type:
                    print("   Type: JSON API response ✅")
                elif 'text/html' in content_type:
                    print("   Type: HTML page ✅")
                else:
                    print(f"   Type: {content_type}")
            else:
                print(f"   Failed: {response.status_code}")
                
        except Exception as e:
            print(f"   Error: {str(e)}")

if __name__ == "__main__":
    print("🚀 Testing Frontend Booking Page Issue")
    print("Investigating: 'Rezervasyon Tamamla' leads to empty booking page")
    
    test_frontend_booking_page()
    test_api_vs_frontend_routes()
    
    print("\n📋 ANALYSIS:")
    print("If /booking/{tourId} returns 404 or doesn't load properly,")
    print("the issue is likely in frontend routing configuration.")
    print("The backend APIs are working correctly as confirmed by previous tests.")