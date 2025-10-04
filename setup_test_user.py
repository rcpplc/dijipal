import requests
import json

def create_test_user():
    """Create the test user for booking flow testing"""
    base_url = "https://pakettur.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    # User registration data
    user_data = {
        "email": "user@example.com",
        "full_name": "Test User",
        "password": "password123",
        "phone": "+90 555 123 4567",
        "role": "customer"
    }
    
    print("🔧 Creating test user for booking flow testing...")
    print(f"   Email: {user_data['email']}")
    print(f"   Password: {user_data['password']}")
    
    try:
        # Try to register the user
        response = requests.post(f"{api_url}/auth/register", json=user_data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Test user created successfully!")
            print(f"   User ID: {result.get('user', {}).get('id')}")
            return True
        elif response.status_code == 400:
            error_data = response.json()
            if "already exists" in error_data.get('detail', ''):
                print("ℹ️  Test user already exists - that's fine!")
                return True
            else:
                print(f"❌ User creation failed: {error_data}")
                return False
        else:
            print(f"❌ User creation failed with status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error creating test user: {str(e)}")
        return False

if __name__ == "__main__":
    create_test_user()