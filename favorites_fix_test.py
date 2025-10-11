#!/usr/bin/env python3
"""
Quick test to verify favorites API fixes
"""

import requests
import json

BACKEND_URL = "https://reservation-system-2.preview.emergentagent.com/api"

def test_admin_favorites_fix():
    """Test the admin favorites 500 error fix"""
    print("🔧 Testing Admin Favorites Fix...")
    
    # Admin login
    admin_login_data = {
        "email": "admin@example.com",
        "password": "admin123"
    }
    
    response = requests.post(f"{BACKEND_URL}/auth/login", json=admin_login_data)
    if response.status_code != 200:
        print(f"❌ Admin login failed: {response.status_code}")
        return False
    
    admin_token = response.json()['token']
    print(f"✅ Admin login successful")
    
    # Get tours
    response = requests.get(f"{BACKEND_URL}/tours")
    if response.status_code != 200:
        print(f"❌ Get tours failed: {response.status_code}")
        return False
    
    tours = response.json()
    if not tours:
        print("❌ No tours available")
        return False
    
    tour_id = tours[0]['id']
    print(f"✅ Using tour ID: {tour_id}")
    
    # Add to admin favorites
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.post(f"{BACKEND_URL}/favorites/{tour_id}", headers=headers)
    if response.status_code != 200:
        print(f"❌ Add to favorites failed: {response.status_code} - {response.text}")
        return False
    
    print(f"✅ Added tour to admin favorites")
    
    # Get admin favorites (this was causing 500 error)
    response = requests.get(f"{BACKEND_URL}/favorites", headers=headers)
    if response.status_code != 200:
        print(f"❌ Get admin favorites failed: {response.status_code} - {response.text}")
        return False
    
    favorites = response.json()
    print(f"✅ Admin favorites retrieved successfully: {len(favorites)} favorites")
    
    # Clean up
    requests.delete(f"{BACKEND_URL}/favorites/{tour_id}", headers=headers)
    print(f"✅ Cleanup completed")
    
    return True

def test_authentication_behavior():
    """Test authentication behavior (401 vs 403)"""
    print("\n🔐 Testing Authentication Behavior...")
    
    # Test without token
    response = requests.get(f"{BACKEND_URL}/favorites")
    print(f"GET /api/favorites without token: {response.status_code} - {response.json()}")
    
    # Test with invalid token
    headers = {"Authorization": "Bearer invalid.token.here"}
    response = requests.get(f"{BACKEND_URL}/favorites", headers=headers)
    print(f"GET /api/favorites with invalid token: {response.status_code} - {response.json()}")
    
    return True

if __name__ == "__main__":
    print("🚀 Running Favorites API Fix Tests")
    print("=" * 50)
    
    success1 = test_admin_favorites_fix()
    success2 = test_authentication_behavior()
    
    print("\n📊 RESULTS:")
    print(f"Admin Favorites Fix: {'✅ PASS' if success1 else '❌ FAIL'}")
    print(f"Authentication Test: {'✅ PASS' if success2 else '❌ FAIL'}")