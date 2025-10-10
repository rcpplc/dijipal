#!/usr/bin/env python3
"""
Contact Form System Backend API Testing
Test edilecek endpoint'ler:
1. Contact Form Submission: POST /api/contact/send
2. Admin Messages List: GET /api/admin/contact-messages
3. Message Status Update: PUT /api/admin/contact-messages/{message_id}
4. Message Delete: DELETE /api/admin/contact-messages/{message_id}
5. Database Integration: MongoDB contact_messages collection
"""

import requests
import json
import time
from datetime import datetime

# Backend URL from frontend/.env
BACKEND_URL = "https://travel-portal-6.preview.emergentagent.com/api"

# Test credentials
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "test123"  # Updated password from test_result.md

class ContactFormTester:
    def __init__(self):
        self.admin_token = None
        self.test_message_id = None
        self.results = []
        
    def log_result(self, test_name, success, details):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        print()
    
    def admin_login(self):
        """Login as admin to get authentication token"""
        print("🔐 ADMIN LOGIN TEST")
        try:
            response = requests.post(f"{BACKEND_URL}/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("token")
                user_role = data.get("user", {}).get("role")
                
                if self.admin_token and user_role == "admin":
                    self.log_result("Admin Login", True, f"Token received, Role: {user_role}")
                    return True
                else:
                    self.log_result("Admin Login", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_result("Admin Login", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Admin Login", False, f"Exception: {str(e)}")
            return False
    
    def test_contact_form_submission(self):
        """Test 1: Contact Form Submission - POST /api/contact/send"""
        print("📝 CONTACT FORM SUBMISSION TEST")
        
        # Test with valid data
        valid_data = {
            "name": "Test Kullanıcı",
            "email": "test@example.com",
            "phone": "05551234567",
            "subject": "Test Mesaj Konusu",
            "message": "Bu bir test mesajıdır. Admin panelinde görünüp görünmediğini kontrol ediyoruz."
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/contact/send", json=valid_data)
            
            if response.status_code == 200:
                data = response.json()
                self.test_message_id = data.get("id")
                self.log_result("Contact Form Submission - Valid Data", True, 
                              f"Message ID: {self.test_message_id}, Response: {data.get('message')}")
            else:
                self.log_result("Contact Form Submission - Valid Data", False, 
                              f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Contact Form Submission - Valid Data", False, f"Exception: {str(e)}")
        
        # Test field validation - missing name
        try:
            invalid_data = {
                "email": "test@example.com",
                "subject": "Test",
                "message": "Test message"
            }
            
            response = requests.post(f"{BACKEND_URL}/contact/send", json=invalid_data)
            
            if response.status_code == 400:
                self.log_result("Contact Form Validation - Missing Name", True, 
                              f"Correctly rejected: {response.text}")
            else:
                self.log_result("Contact Form Validation - Missing Name", False, 
                              f"Should return 400, got {response.status_code}")
                
        except Exception as e:
            self.log_result("Contact Form Validation - Missing Name", False, f"Exception: {str(e)}")
        
        # Test field validation - missing email
        try:
            invalid_data = {
                "name": "Test User",
                "subject": "Test",
                "message": "Test message"
            }
            
            response = requests.post(f"{BACKEND_URL}/contact/send", json=invalid_data)
            
            if response.status_code == 400:
                self.log_result("Contact Form Validation - Missing Email", True, 
                              f"Correctly rejected: {response.text}")
            else:
                self.log_result("Contact Form Validation - Missing Email", False, 
                              f"Should return 400, got {response.status_code}")
                
        except Exception as e:
            self.log_result("Contact Form Validation - Missing Email", False, f"Exception: {str(e)}")
    
    def test_admin_messages_list(self):
        """Test 2: Admin Messages List - GET /api/admin/contact-messages"""
        print("📋 ADMIN MESSAGES LIST TEST")
        
        if not self.admin_token:
            self.log_result("Admin Messages List", False, "No admin token available")
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        try:
            response = requests.get(f"{BACKEND_URL}/admin/contact-messages", headers=headers)
            
            if response.status_code == 200:
                messages = response.json()
                message_count = len(messages)
                
                # Check if our test message is in the list
                test_message_found = False
                if self.test_message_id:
                    for msg in messages:
                        if msg.get("id") == self.test_message_id:
                            test_message_found = True
                            break
                
                self.log_result("Admin Messages List", True, 
                              f"Retrieved {message_count} messages, Test message found: {test_message_found}")
                
                # Verify message structure
                if messages:
                    first_message = messages[0]
                    required_fields = ["id", "name", "email", "subject", "message", "status", "created_at"]
                    missing_fields = [field for field in required_fields if field not in first_message]
                    
                    if not missing_fields:
                        self.log_result("Message Structure Validation", True, 
                                      f"All required fields present: {required_fields}")
                    else:
                        self.log_result("Message Structure Validation", False, 
                                      f"Missing fields: {missing_fields}")
                
            else:
                self.log_result("Admin Messages List", False, 
                              f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Admin Messages List", False, f"Exception: {str(e)}")
        
        # Test unauthorized access
        try:
            response = requests.get(f"{BACKEND_URL}/admin/contact-messages")
            
            if response.status_code == 403 or response.status_code == 401:
                self.log_result("Admin Messages List - Unauthorized Access", True, 
                              f"Correctly rejected unauthorized access: HTTP {response.status_code}")
            else:
                self.log_result("Admin Messages List - Unauthorized Access", False, 
                              f"Should reject unauthorized access, got {response.status_code}")
                
        except Exception as e:
            self.log_result("Admin Messages List - Unauthorized Access", False, f"Exception: {str(e)}")
    
    def test_message_status_update(self):
        """Test 3: Message Status Update - PUT /api/admin/contact-messages/{message_id}"""
        print("🔄 MESSAGE STATUS UPDATE TEST")
        
        if not self.admin_token or not self.test_message_id:
            self.log_result("Message Status Update", False, "No admin token or test message ID available")
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test status update: new → read
        try:
            update_data = {"status": "read"}
            response = requests.put(f"{BACKEND_URL}/admin/contact-messages/{self.test_message_id}", 
                                  json=update_data, headers=headers)
            
            if response.status_code == 200:
                self.log_result("Message Status Update - Read", True, 
                              f"Status updated to 'read': {response.json()}")
            else:
                self.log_result("Message Status Update - Read", False, 
                              f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Message Status Update - Read", False, f"Exception: {str(e)}")
        
        # Test admin reply
        try:
            update_data = {
                "admin_reply": "Mesajınız için teşekkür ederiz. En kısa sürede size dönüş yapacağız.",
                "status": "replied"
            }
            response = requests.put(f"{BACKEND_URL}/admin/contact-messages/{self.test_message_id}", 
                                  json=update_data, headers=headers)
            
            if response.status_code == 200:
                self.log_result("Message Status Update - Reply", True, 
                              f"Admin reply added: {response.json()}")
            else:
                self.log_result("Message Status Update - Reply", False, 
                              f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Message Status Update - Reply", False, f"Exception: {str(e)}")
        
        # Test invalid status
        try:
            update_data = {"status": "invalid_status"}
            response = requests.put(f"{BACKEND_URL}/admin/contact-messages/{self.test_message_id}", 
                                  json=update_data, headers=headers)
            
            if response.status_code == 400:
                self.log_result("Message Status Update - Invalid Status", True, 
                              f"Correctly rejected invalid status: {response.text}")
            else:
                self.log_result("Message Status Update - Invalid Status", False, 
                              f"Should return 400, got {response.status_code}")
                
        except Exception as e:
            self.log_result("Message Status Update - Invalid Status", False, f"Exception: {str(e)}")
    
    def test_message_delete(self):
        """Test 4: Message Delete - DELETE /api/admin/contact-messages/{message_id}"""
        print("🗑️ MESSAGE DELETE TEST")
        
        if not self.admin_token or not self.test_message_id:
            self.log_result("Message Delete", False, "No admin token or test message ID available")
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # First, verify message exists
        try:
            response = requests.get(f"{BACKEND_URL}/admin/contact-messages", headers=headers)
            if response.status_code == 200:
                messages = response.json()
                message_exists = any(msg.get("id") == self.test_message_id for msg in messages)
                
                if message_exists:
                    self.log_result("Message Exists Before Delete", True, 
                                  f"Test message {self.test_message_id} found in list")
                else:
                    self.log_result("Message Exists Before Delete", False, 
                                  f"Test message {self.test_message_id} not found")
                    
        except Exception as e:
            self.log_result("Message Exists Before Delete", False, f"Exception: {str(e)}")
        
        # Test delete
        try:
            response = requests.delete(f"{BACKEND_URL}/admin/contact-messages/{self.test_message_id}", 
                                     headers=headers)
            
            if response.status_code == 200:
                self.log_result("Message Delete", True, 
                              f"Message deleted successfully: {response.json()}")
            else:
                self.log_result("Message Delete", False, 
                              f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Message Delete", False, f"Exception: {str(e)}")
        
        # Verify message is deleted
        try:
            response = requests.get(f"{BACKEND_URL}/admin/contact-messages", headers=headers)
            if response.status_code == 200:
                messages = response.json()
                message_exists = any(msg.get("id") == self.test_message_id for msg in messages)
                
                if not message_exists:
                    self.log_result("Message Deleted Verification", True, 
                                  f"Test message {self.test_message_id} successfully removed from list")
                else:
                    self.log_result("Message Deleted Verification", False, 
                                  f"Test message {self.test_message_id} still exists after delete")
                    
        except Exception as e:
            self.log_result("Message Deleted Verification", False, f"Exception: {str(e)}")
        
        # Test delete non-existent message
        try:
            fake_id = "non-existent-message-id"
            response = requests.delete(f"{BACKEND_URL}/admin/contact-messages/{fake_id}", 
                                     headers=headers)
            
            if response.status_code == 404:
                self.log_result("Delete Non-existent Message", True, 
                              f"Correctly returned 404 for non-existent message")
            else:
                self.log_result("Delete Non-existent Message", False, 
                              f"Should return 404, got {response.status_code}")
                
        except Exception as e:
            self.log_result("Delete Non-existent Message", False, f"Exception: {str(e)}")
    
    def test_database_integration(self):
        """Test 5: Database Integration - MongoDB contact_messages collection"""
        print("🗄️ DATABASE INTEGRATION TEST")
        
        # Create a test message to verify database integration
        test_data = {
            "name": "Database Test User",
            "email": "dbtest@example.com",
            "phone": "05559999999",
            "subject": "Database Integration Test",
            "message": "Testing MongoDB contact_messages collection integration."
        }
        
        try:
            # Create message
            response = requests.post(f"{BACKEND_URL}/contact/send", json=test_data)
            
            if response.status_code == 200:
                data = response.json()
                db_test_message_id = data.get("id")
                
                # Verify message appears in admin list
                if self.admin_token:
                    headers = {"Authorization": f"Bearer {self.admin_token}"}
                    admin_response = requests.get(f"{BACKEND_URL}/admin/contact-messages", headers=headers)
                    
                    if admin_response.status_code == 200:
                        messages = admin_response.json()
                        db_message_found = any(msg.get("id") == db_test_message_id for msg in messages)
                        
                        if db_message_found:
                            self.log_result("Database Integration - Message Persistence", True, 
                                          f"Message {db_test_message_id} successfully stored and retrieved from MongoDB")
                            
                            # Verify data format
                            db_message = next((msg for msg in messages if msg.get("id") == db_test_message_id), None)
                            if db_message:
                                expected_fields = ["name", "email", "phone", "subject", "message", "status", "created_at", "updated_at"]
                                all_fields_present = all(field in db_message for field in expected_fields)
                                
                                if all_fields_present:
                                    self.log_result("Database Integration - Data Format", True, 
                                                  f"All required fields present in database record")
                                else:
                                    missing = [f for f in expected_fields if f not in db_message]
                                    self.log_result("Database Integration - Data Format", False, 
                                                  f"Missing fields: {missing}")
                                
                                # Verify data values
                                data_correct = (
                                    db_message.get("name") == test_data["name"] and
                                    db_message.get("email") == test_data["email"] and
                                    db_message.get("subject") == test_data["subject"] and
                                    db_message.get("message") == test_data["message"] and
                                    db_message.get("status") == "new"
                                )
                                
                                if data_correct:
                                    self.log_result("Database Integration - Data Accuracy", True, 
                                                  f"All data values correctly stored in MongoDB")
                                else:
                                    self.log_result("Database Integration - Data Accuracy", False, 
                                                  f"Data mismatch in database record")
                            
                            # Clean up test message
                            delete_response = requests.delete(f"{BACKEND_URL}/admin/contact-messages/{db_test_message_id}", 
                                                            headers=headers)
                            if delete_response.status_code == 200:
                                self.log_result("Database Integration - Cleanup", True, 
                                              f"Test message successfully deleted from database")
                        else:
                            self.log_result("Database Integration - Message Persistence", False, 
                                          f"Message {db_test_message_id} not found in admin list")
                    else:
                        self.log_result("Database Integration - Message Persistence", False, 
                                      f"Could not retrieve admin messages: HTTP {admin_response.status_code}")
                else:
                    self.log_result("Database Integration - Message Persistence", False, 
                                  "No admin token available for verification")
            else:
                self.log_result("Database Integration - Message Creation", False, 
                              f"Could not create test message: HTTP {response.status_code}")
                
        except Exception as e:
            self.log_result("Database Integration", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all contact form system tests"""
        print("🚀 CONTACT FORM SYSTEM BACKEND API TESTING STARTED")
        print("=" * 60)
        
        # Step 1: Admin login
        if not self.admin_login():
            print("❌ Cannot proceed without admin authentication")
            return
        
        # Step 2: Test contact form submission
        self.test_contact_form_submission()
        
        # Step 3: Test admin messages list
        self.test_admin_messages_list()
        
        # Step 4: Test message status update
        self.test_message_status_update()
        
        # Step 5: Test message delete
        self.test_message_delete()
        
        # Step 6: Test database integration
        self.test_database_integration()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("=" * 60)
        print("📊 CONTACT FORM SYSTEM TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.results)
        passed_tests = len([r for r in self.results if r["success"]])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        print()
        
        if failed_tests > 0:
            print("❌ FAILED TESTS:")
            for result in self.results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
            print()
        
        print("✅ PASSED TESTS:")
        for result in self.results:
            if result["success"]:
                print(f"  - {result['test']}")
        
        print("=" * 60)
        
        if success_rate >= 90:
            print("🎉 EXCELLENT: Contact form system is working perfectly!")
        elif success_rate >= 75:
            print("✅ GOOD: Contact form system is mostly working with minor issues")
        elif success_rate >= 50:
            print("⚠️ MODERATE: Contact form system has some issues that need attention")
        else:
            print("❌ CRITICAL: Contact form system has major issues requiring immediate attention")

if __name__ == "__main__":
    tester = ContactFormTester()
    tester.run_all_tests()