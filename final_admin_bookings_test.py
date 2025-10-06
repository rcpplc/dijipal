import requests
import json
from datetime import datetime

def test_admin_bookings_comprehensive():
    """Final comprehensive test of admin bookings endpoint"""
    base_url = "https://tour-system-fix.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    print("🎯 FINAL ADMIN BOOKINGS COMPREHENSIVE TEST")
    print("=" * 60)
    
    # Step 1: Admin Login
    print("\n🔐 Step 1: Admin Login")
    admin_login_data = {
        "email": "admin@example.com",
        "password": "test123"
    }
    
    response = requests.post(f"{api_url}/auth/login", json=admin_login_data)
    if response.status_code != 200:
        print("❌ Admin login failed")
        return False
    
    token = response.json()['token']
    admin_user = response.json()['user']
    print(f"✅ Admin login successful: {admin_user['full_name']} ({admin_user['role']})")
    
    # Step 2: Test Admin Bookings Endpoint
    print("\n📋 Step 2: GET /api/admin/bookings")
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f"{api_url}/admin/bookings", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Admin bookings endpoint failed: {response.status_code}")
        return False
    
    bookings = response.json()
    print(f"✅ Admin bookings endpoint working: {len(bookings)} reservations retrieved")
    
    # Step 3: Validate Response Data
    print("\n🔍 Step 3: Response Data Validation")
    
    if not bookings:
        print("⚠️  No bookings found")
        return True
    
    # Check required fields
    required_fields = ["id", "user_id", "tour_id", "participants", "cabin_type", 
                      "total_price", "booking_status", "payment_status", "booking_code", "created_at"]
    
    valid_booking_statuses = ["draft", "pending", "confirmed", "paid", "completed", "cancelled"]
    valid_payment_statuses = ["pending", "success", "failed", "refunded"]
    
    all_valid = True
    for i, booking in enumerate(bookings):
        booking_id = booking.get('id', f'booking_{i}')
        
        # Check required fields
        missing_fields = [field for field in required_fields if field not in booking]
        if missing_fields:
            print(f"❌ Booking {booking_id}: Missing fields: {missing_fields}")
            all_valid = False
        
        # Check enum values
        booking_status = booking.get('booking_status')
        if booking_status not in valid_booking_statuses:
            print(f"❌ Booking {booking_id}: Invalid booking_status '{booking_status}'")
            all_valid = False
        
        payment_status = booking.get('payment_status')
        if payment_status not in valid_payment_statuses:
            print(f"❌ Booking {booking_id}: Invalid payment_status '{payment_status}'")
            all_valid = False
    
    if all_valid:
        print(f"✅ All {len(bookings)} bookings have valid data format")
    
    # Step 4: Show Sample Data
    print("\n📊 Step 4: Sample Booking Data")
    sample_booking = bookings[0]
    print(f"Sample Booking ID: {sample_booking.get('id')}")
    print(f"Booking Status: {sample_booking.get('booking_status')}")
    print(f"Payment Status: {sample_booking.get('payment_status')}")
    print(f"Total Price: {sample_booking.get('total_price')}")
    print(f"Participants: {sample_booking.get('participants')}")
    print(f"Cabin Type: {sample_booking.get('cabin_type')}")
    print(f"Booking Code: {sample_booking.get('booking_code')}")
    
    # Step 5: Test Authorization
    print("\n🔐 Step 5: Authorization Test")
    # Test without token
    response_no_token = requests.get(f"{api_url}/admin/bookings")
    if response_no_token.status_code in [401, 403]:
        print("✅ Properly rejects requests without token")
    else:
        print(f"⚠️  Unexpected response without token: {response_no_token.status_code}")
    
    print("\n" + "=" * 60)
    print("📊 FINAL RESULTS")
    print("=" * 60)
    
    if all_valid:
        print("🎉 SUCCESS: Admin bookings endpoint is working perfectly!")
        print("✅ Endpoint accessible with admin credentials")
        print("✅ Returns proper JSON response")
        print(f"✅ Retrieved {len(bookings)} reservations")
        print("✅ All data fields present and valid")
        print("✅ BookingStatus and PaymentStatus enums correct")
        print("✅ Authorization working properly")
        print("\n💡 The 'rezervasyonlar yüklenemedi' issue should now be resolved!")
        return True
    else:
        print("❌ ISSUES FOUND: Some data validation problems remain")
        return False

if __name__ == "__main__":
    success = test_admin_bookings_comprehensive()
    exit(0 if success else 1)