import requests
import json

class BookingDataFixer:
    def __init__(self, base_url="https://payment-modal-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None

    def admin_login(self):
        """Login as admin"""
        admin_login_data = {
            "email": "admin@example.com",
            "password": "test123"
        }
        
        response = requests.post(f"{self.api_url}/auth/login", json=admin_login_data)
        if response.status_code == 200:
            data = response.json()
            self.token = data['token']
            print("✅ Admin login successful")
            return True
        else:
            print("❌ Admin login failed")
            return False

    def get_admin_bookings(self):
        """Get all bookings from admin endpoint"""
        headers = {'Authorization': f'Bearer {self.token}'}
        response = requests.get(f"{self.api_url}/admin/bookings", headers=headers)
        
        if response.status_code == 200:
            bookings = response.json()
            print(f"✅ Retrieved {len(bookings)} bookings")
            return bookings
        else:
            print("❌ Failed to get bookings")
            return []

    def analyze_booking_issues(self, bookings):
        """Analyze booking data issues"""
        print("\n🔍 Analyzing booking data issues...")
        
        issues = {
            'missing_booking_status': [],
            'missing_booking_code': [],
            'invalid_payment_status': []
        }
        
        for booking in bookings:
            booking_id = booking.get('id', 'unknown')
            
            # Check missing booking_status
            if not booking.get('booking_status'):
                issues['missing_booking_status'].append(booking_id)
            
            # Check missing booking_code
            if not booking.get('booking_code'):
                issues['missing_booking_code'].append(booking_id)
            
            # Check invalid payment_status
            payment_status = booking.get('payment_status')
            if payment_status == 'paid':
                issues['invalid_payment_status'].append(booking_id)
        
        print(f"📊 Issues found:")
        print(f"   Missing booking_status: {len(issues['missing_booking_status'])}")
        print(f"   Missing booking_code: {len(issues['missing_booking_code'])}")
        print(f"   Invalid payment_status: {len(issues['invalid_payment_status'])}")
        
        return issues

    def run_analysis(self):
        """Run complete analysis"""
        print("🔍 BOOKING DATA ANALYSIS")
        print("=" * 50)
        
        if not self.admin_login():
            return False
        
        bookings = self.get_admin_bookings()
        if not bookings:
            return False
        
        issues = self.analyze_booking_issues(bookings)
        
        # Show sample problematic bookings
        print("\n📋 Sample problematic bookings:")
        for booking in bookings[:5]:
            booking_id = booking.get('id', 'unknown')
            booking_status = booking.get('booking_status', 'MISSING')
            payment_status = booking.get('payment_status', 'unknown')
            booking_code = booking.get('booking_code', 'MISSING')
            
            print(f"   {booking_id}:")
            print(f"     booking_status: {booking_status}")
            print(f"     payment_status: {payment_status}")
            print(f"     booking_code: {booking_code}")
        
        return True

if __name__ == "__main__":
    fixer = BookingDataFixer()
    fixer.run_analysis()