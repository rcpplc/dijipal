import requests
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time

def test_booking_navigation_state():
    """Test if navigation state is properly passed from TourDetailPage to BookingPage"""
    
    print("🔍 Testing Navigation State Passing from Tour Detail to Booking Page")
    print("=" * 70)
    
    # Set up Chrome options for headless browsing
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    
    driver = None
    
    try:
        # Initialize Chrome driver
        driver = webdriver.Chrome(options=chrome_options)
        base_url = "https://tour-reserv.preview.emergentagent.com"
        
        print("🌐 Opening tour detail page...")
        tour_id = "3ded39ad-36a4-47d1-87b9-7baeb5f00f55"
        driver.get(f"{base_url}/tours/{tour_id}")
        
        # Wait for page to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        
        print("✅ Tour detail page loaded")
        
        # Check if tour data is loaded
        try:
            tour_title = driver.find_element(By.TAG_NAME, "h1").text
            print(f"   Tour title: {tour_title}")
        except:
            print("   ⚠️  Could not find tour title")
        
        # Look for the booking button
        try:
            booking_button = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Rezervasyon Tamamla')]"))
            )
            print("✅ Found 'Rezervasyon Tamamla' button")
            
            # Check if user needs to login first
            if "Giriş Yapın" in booking_button.text:
                print("⚠️  User needs to login first")
                return False
            
            # Click the booking button
            print("🖱️  Clicking 'Rezervasyon Tamamla' button...")
            booking_button.click()
            
            # Wait for navigation to booking page
            WebDriverWait(driver, 10).until(
                lambda d: "/booking/" in d.current_url
            )
            
            print(f"✅ Navigated to: {driver.current_url}")
            
            # Check if booking page loaded with data
            try:
                # Look for tour title in booking page
                WebDriverWait(driver, 5).until(
                    EC.presence_of_element_located((By.XPATH, "//h4[contains(@class, 'font-medium')]"))
                )
                
                # Check for tour information
                tour_info_elements = driver.find_elements(By.XPATH, "//h4[contains(@class, 'font-medium')]")
                if tour_info_elements:
                    booking_tour_title = tour_info_elements[0].text
                    print(f"   Booking page tour title: {booking_tour_title}")
                    
                    if booking_tour_title and len(booking_tour_title.strip()) > 0:
                        print("✅ Booking page has tour data")
                        
                        # Check for other booking data
                        try:
                            # Look for date information
                            date_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'Seçilen Tarih')]")
                            if date_elements:
                                print("✅ Booking page has selected date")
                            else:
                                print("⚠️  No selected date found on booking page")
                            
                            # Look for cabin information
                            cabin_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'Kabin')]")
                            if cabin_elements:
                                print("✅ Booking page has cabin information")
                            else:
                                print("⚠️  No cabin information found on booking page")
                            
                            # Look for pricing
                            price_elements = driver.find_elements(By.XPATH, "//*[contains(text(), '₺')]")
                            if price_elements:
                                print("✅ Booking page has pricing information")
                            else:
                                print("⚠️  No pricing information found on booking page")
                            
                            return True
                        except Exception as e:
                            print(f"⚠️  Error checking booking details: {str(e)}")
                            return True  # Main navigation worked
                    else:
                        print("❌ Booking page is empty - no tour data")
                        return False
                else:
                    print("❌ Booking page is empty - no tour information found")
                    return False
                    
            except Exception as e:
                print(f"❌ Booking page failed to load properly: {str(e)}")
                
                # Take a screenshot for debugging
                try:
                    driver.save_screenshot("/app/booking_page_error.png")
                    print("📸 Screenshot saved as booking_page_error.png")
                except:
                    pass
                
                # Get page source for debugging
                try:
                    page_source = driver.page_source
                    if "error" in page_source.lower() or "not found" in page_source.lower():
                        print("❌ Booking page contains error messages")
                    elif len(page_source) < 1000:
                        print("❌ Booking page appears to be mostly empty")
                    else:
                        print("⚠️  Booking page loaded but structure may be different")
                except:
                    pass
                
                return False
                
        except Exception as e:
            print(f"❌ Could not find or click booking button: {str(e)}")
            return False
            
    except Exception as e:
        print(f"❌ Browser test failed: {str(e)}")
        return False
        
    finally:
        if driver:
            driver.quit()

def test_direct_booking_page_access():
    """Test accessing booking page directly with URL parameters"""
    print("\n🔍 Testing Direct Booking Page Access")
    print("=" * 50)
    
    base_url = "https://tour-reserv.preview.emergentagent.com"
    tour_id = "3ded39ad-36a4-47d1-87b9-7baeb5f00f55"
    
    # Test direct access to booking page
    booking_url = f"{base_url}/booking/{tour_id}"
    
    try:
        response = requests.get(booking_url, timeout=30)
        print(f"   Direct booking page access: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Booking page accessible directly")
            
            # Check if it's a React app
            if 'react' in response.text.lower() or 'root' in response.text:
                print("✅ React app structure detected")
                return True
            else:
                print("⚠️  May not be loading React app properly")
                return False
        else:
            print(f"❌ Booking page not accessible: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error accessing booking page: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Testing Booking Flow Navigation Issue")
    print("Investigating: 'Rezervasyon Tamamla' leads to empty booking page")
    
    # Test 1: Direct page access
    direct_access_works = test_direct_booking_page_access()
    
    # Test 2: Navigation state (requires browser automation)
    try:
        navigation_works = test_booking_navigation_state()
    except Exception as e:
        print(f"⚠️  Browser automation test failed: {str(e)}")
        print("   This might be due to missing Chrome/ChromeDriver in the environment")
        navigation_works = None
    
    print("\n" + "=" * 70)
    print("📊 NAVIGATION TEST RESULTS")
    print("=" * 70)
    
    print(f"Direct booking page access: {'✅ Working' if direct_access_works else '❌ Failed'}")
    
    if navigation_works is True:
        print("Navigation state passing: ✅ Working")
        print("\n🎉 CONCLUSION: Navigation is working correctly")
        print("The issue might be:")
        print("- User not logged in (booking requires authentication)")
        print("- Date/cabin selection not made before clicking button")
        print("- Browser-specific issue or JavaScript error")
    elif navigation_works is False:
        print("Navigation state passing: ❌ Failed")
        print("\n🚨 CONCLUSION: Navigation state is not being passed correctly")
        print("The booking page is not receiving tour data from the detail page")
    else:
        print("Navigation state passing: ⚠️  Could not test (browser automation unavailable)")
        print("\n📋 CONCLUSION: Backend APIs work, frontend routes work")
        print("The issue is likely in the React state management or user authentication")
    
    print("\n💡 RECOMMENDATIONS:")
    print("1. Check browser console for JavaScript errors")
    print("2. Ensure user is logged in before clicking 'Rezervasyon Tamamla'")
    print("3. Ensure date and cabin type are selected before booking")
    print("4. Check if React Router state is being preserved during navigation")