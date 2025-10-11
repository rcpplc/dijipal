#!/usr/bin/env python3
"""
Database Admin User Direct Analysis
Check how admin user is stored in MongoDB database
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv('/app/backend/.env')

async def check_admin_in_database():
    """
    Direct database check for admin user
    """
    print("🔍 DATABASE ADMIN USER ANALYSIS")
    print("=" * 50)
    
    try:
        # Connect to MongoDB
        mongo_url = os.environ['MONGO_URL']
        db_name = os.environ.get('DB_NAME', 'test_database')
        
        print(f"📡 Connecting to MongoDB: {mongo_url}")
        print(f"📊 Database: {db_name}")
        
        client = AsyncIOMotorClient(
            mongo_url,
            retryWrites=True,
            w='majority',
            connectTimeoutMS=10000,
            serverSelectionTimeoutMS=10000,
            maxPoolSize=10
        )
        db = client[db_name]
        
        # Find admin user
        print("\n1. SEARCHING FOR ADMIN USER")
        print("-" * 30)
        
        admin_user = await db.users.find_one({"email": "admin@example.com"})
        
        if admin_user:
            print("✅ Admin user found in database!")
            
            # Remove MongoDB _id for cleaner display
            if "_id" in admin_user:
                del admin_user["_id"]
            
            print("\n📋 COMPLETE DATABASE RECORD:")
            print(json.dumps(admin_user, indent=2, ensure_ascii=False, default=str))
            
            # Analyze all fields
            print(f"\n📝 Total fields in database: {len(admin_user.keys())}")
            print(f"📝 All database fields: {list(admin_user.keys())}")
            
            # Check for name-related fields
            print("\n🔍 NAME FIELDS IN DATABASE:")
            name_fields = ['full_name', 'firstName', 'lastName', 'first_name', 'last_name', 'name']
            
            for field in name_fields:
                if field in admin_user:
                    value = admin_user[field]
                    print(f"✅ {field}: '{value}' (type: {type(value).__name__})")
                else:
                    print(f"❌ {field}: NOT FOUND")
            
            # Check for password field
            print("\n🔐 PASSWORD FIELD ANALYSIS:")
            if 'hashed_password' in admin_user:
                hashed_pwd = admin_user['hashed_password']
                print(f"✅ hashed_password: {hashed_pwd[:20]}... (length: {len(hashed_pwd)})")
            else:
                print("❌ hashed_password: NOT FOUND")
            
            # Additional fields analysis
            print("\n📊 OTHER IMPORTANT FIELDS:")
            important_fields = ['id', 'email', 'role', 'is_active', 'phone', 'profile_image', 'created_at']
            
            for field in important_fields:
                if field in admin_user:
                    value = admin_user[field]
                    print(f"✅ {field}: {value}")
                else:
                    print(f"❌ {field}: NOT FOUND")
            
        else:
            print("❌ Admin user NOT found in database!")
            
            # Check if any users exist
            user_count = await db.users.count_documents({})
            print(f"📊 Total users in database: {user_count}")
            
            if user_count > 0:
                print("\n📋 Sample users in database:")
                sample_users = await db.users.find({}).limit(3).to_list(length=3)
                for i, user in enumerate(sample_users, 1):
                    if "_id" in user:
                        del user["_id"]
                    print(f"  User {i}: {user.get('email', 'No email')} - {user.get('full_name', 'No name')}")
        
        # Close connection
        client.close()
        
    except Exception as e:
        print(f"❌ Database connection error: {e}")

async def main():
    """
    Main execution
    """
    print("🚀 STARTING DATABASE ADMIN USER ANALYSIS")
    await check_admin_in_database()
    
    print("\n" + "=" * 50)
    print("📋 DATABASE ANALYSIS SUMMARY")
    print("=" * 50)
    print("✅ Database analysis completed")
    print("📋 This shows the raw database structure for admin user")
    print("📋 Compare with API response to see any transformations")

if __name__ == "__main__":
    asyncio.run(main())