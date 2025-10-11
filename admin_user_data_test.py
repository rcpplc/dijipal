#!/usr/bin/env python3
"""
Admin User Data Structure Analysis Test
Turkish Review Request: Admin user'ının veri yapısını kontrol et ve ad/soyad bilgilerini analiz et
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')
load_dotenv('/app/frontend/.env')

# Get backend URL from frontend .env
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://mavibilet.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

def test_admin_login_and_user_structure():
    """
    Test admin login and analyze user object structure
    """
    print("🔍 ADMIN USER DATA STRUCTURE ANALYSIS")
    print("=" * 60)
    
    # 1. Admin Login API Test
    print("\n1. ADMIN LOGIN API TEST (/api/auth/login)")
    print("-" * 40)
    
    login_data = {
        "email": "admin@example.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{API_BASE}/auth/login", json=login_data, timeout=10)
        print(f"✅ Login Response Status: {response.status_code}")
        
        if response.status_code == 200:
            login_result = response.json()
            print(f"✅ Login successful!")
            
            # Extract user object
            user_object = login_result.get('user', {})
            token = login_result.get('token', '')
            
            print(f"✅ JWT Token received: {len(token)} characters")
            print(f"✅ Token preview: {token[:50]}...")
            
            # 2. Detailed User Object Analysis
            print("\n2. USER OBJECT DETAILED ANALYSIS")
            print("-" * 40)
            print("📋 Complete User Object Structure:")
            print(json.dumps(user_object, indent=2, ensure_ascii=False))
            
            # 3. Field Name Analysis
            print("\n3. USER OBJECT FIELD NAMES ANALYSIS")
            print("-" * 40)
            
            all_fields = list(user_object.keys())
            print(f"📝 Total fields in user object: {len(all_fields)}")
            print(f"📝 All field names: {all_fields}")
            
            # Check for specific name-related fields
            name_fields = {
                'full_name': user_object.get('full_name'),
                'firstName': user_object.get('firstName'),
                'lastName': user_object.get('lastName'),
                'first_name': user_object.get('first_name'),
                'last_name': user_object.get('last_name'),
                'name': user_object.get('name')
            }
            
            print("\n🔍 NAME-RELATED FIELDS ANALYSIS:")
            for field_name, field_value in name_fields.items():
                if field_value is not None:
                    print(f"✅ {field_name}: '{field_value}' (type: {type(field_value).__name__})")
                else:
                    print(f"❌ {field_name}: NOT FOUND")
            
            # 4. Database User Analysis via /api/users/me
            print("\n4. DATABASE USER VERIFICATION (/api/users/me)")
            print("-" * 40)
            
            headers = {"Authorization": f"Bearer {token}"}
            me_response = requests.get(f"{API_BASE}/users/me", headers=headers, timeout=10)
            
            if me_response.status_code == 200:
                db_user = me_response.json()
                print(f"✅ Database user retrieved successfully")
                print("📋 Database User Object Structure:")
                print(json.dumps(db_user, indent=2, ensure_ascii=False))
                
                # Compare login response vs database response
                print("\n🔍 LOGIN vs DATABASE USER COMPARISON:")
                login_fields = set(user_object.keys())
                db_fields = set(db_user.keys())
                
                print(f"📝 Login response fields: {sorted(login_fields)}")
                print(f"📝 Database response fields: {sorted(db_fields)}")
                
                # Check for differences
                only_in_login = login_fields - db_fields
                only_in_db = db_fields - login_fields
                
                if only_in_login:
                    print(f"⚠️ Fields only in login response: {sorted(only_in_login)}")
                if only_in_db:
                    print(f"⚠️ Fields only in database response: {sorted(only_in_db)}")
                
                # Analyze name fields in database response
                print("\n🔍 DATABASE NAME FIELDS ANALYSIS:")
                db_name_fields = {
                    'full_name': db_user.get('full_name'),
                    'firstName': db_user.get('firstName'),
                    'lastName': db_user.get('lastName'),
                    'first_name': db_user.get('first_name'),
                    'last_name': db_user.get('last_name'),
                    'name': db_user.get('name')
                }
                
                for field_name, field_value in db_name_fields.items():
                    if field_value is not None:
                        print(f"✅ {field_name}: '{field_value}' (type: {type(field_value).__name__})")
                    else:
                        print(f"❌ {field_name}: NOT FOUND")
                        
            else:
                print(f"❌ Failed to get database user: {me_response.status_code}")
                print(f"❌ Error: {me_response.text}")
            
            # 5. Admin Dashboard Test (Additional verification)
            print("\n5. ADMIN DASHBOARD VERIFICATION")
            print("-" * 40)
            
            dashboard_response = requests.get(f"{API_BASE}/admin/dashboard", headers=headers, timeout=10)
            if dashboard_response.status_code == 200:
                dashboard_data = dashboard_response.json()
                print(f"✅ Admin dashboard accessible")
                print(f"📊 Dashboard stats: {dashboard_data}")
            else:
                print(f"❌ Admin dashboard failed: {dashboard_response.status_code}")
            
            return True, user_object, db_user if 'db_user' in locals() else None
            
        else:
            print(f"❌ Login failed with status: {response.status_code}")
            print(f"❌ Error response: {response.text}")
            return False, None, None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error during login: {e}")
        return False, None, None

def analyze_backend_user_model():
    """
    Analyze the backend User model structure from server.py
    """
    print("\n6. BACKEND USER MODEL ANALYSIS")
    print("-" * 40)
    
    try:
        with open('/app/backend/server.py', 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Find User model definition
        import re
        user_model_match = re.search(r'class User\(BaseModel\):(.*?)(?=class|\Z)', content, re.DOTALL)
        
        if user_model_match:
            user_model_content = user_model_match.group(1)
            print("📋 Backend User Model Definition:")
            
            # Extract field definitions
            field_pattern = r'(\w+):\s*([^=\n]+)(?:\s*=\s*([^\n]+))?'
            fields = re.findall(field_pattern, user_model_content)
            
            print("🔍 User Model Fields:")
            for field_name, field_type, default_value in fields:
                if field_name.strip():
                    default_info = f" (default: {default_value.strip()})" if default_value else ""
                    print(f"  • {field_name}: {field_type.strip()}{default_info}")
                    
        else:
            print("❌ Could not find User model in server.py")
            
    except Exception as e:
        print(f"❌ Error analyzing backend model: {e}")

def main():
    """
    Main test execution
    """
    print("🚀 STARTING ADMIN USER DATA STRUCTURE ANALYSIS")
    print("📋 Turkish Review Request: Admin user'ının veri yapısını kontrol et ve ad/soyad bilgilerini analiz et")
    
    # Test admin login and analyze user structure
    success, login_user, db_user = test_admin_login_and_user_structure()
    
    # Analyze backend model
    analyze_backend_user_model()
    
    # Summary and Recommendations
    print("\n" + "=" * 60)
    print("📋 SUMMARY AND FRONTEND RECOMMENDATIONS")
    print("=" * 60)
    
    if success and login_user:
        print("\n✅ ADMIN LOGIN SUCCESSFUL")
        print(f"✅ User ID: {login_user.get('id', 'N/A')}")
        print(f"✅ Email: {login_user.get('email', 'N/A')}")
        print(f"✅ Role: {login_user.get('role', 'N/A')}")
        
        # Name field recommendations
        print("\n🎯 NAME FIELD RECOMMENDATIONS FOR FRONTEND:")
        
        if login_user.get('full_name'):
            print(f"✅ USE 'full_name' field: '{login_user['full_name']}'")
            print("   → This is the primary name field in the system")
        
        if not login_user.get('firstName') and not login_user.get('first_name'):
            print("⚠️ NO separate firstName/first_name field found")
            print("   → If you need separate first/last names, you'll need to parse 'full_name'")
        
        if not login_user.get('lastName') and not login_user.get('last_name'):
            print("⚠️ NO separate lastName/last_name field found")
            print("   → If you need separate first/last names, you'll need to parse 'full_name'")
        
        if not login_user.get('name'):
            print("⚠️ NO 'name' field found")
            print("   → Use 'full_name' instead")
        
        # Field mapping for frontend
        print("\n📋 FRONTEND FIELD MAPPING GUIDE:")
        print("   • For display name: user.full_name")
        print("   • For user ID: user.id")
        print("   • For email: user.email")
        print("   • For role: user.role")
        print("   • For phone: user.phone")
        print("   • For profile image: user.profile_image")
        
    else:
        print("❌ ADMIN LOGIN FAILED - Cannot provide field recommendations")
    
    print(f"\n🏁 Analysis completed!")

if __name__ == "__main__":
    main()