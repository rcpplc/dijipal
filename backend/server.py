from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query, File, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi import Path as FastAPIPath
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import unicodedata

# Load environment variables from .env file
load_dotenv()
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, date, time, timezone, timedelta
from enum import Enum
import jwt
import asyncio
import json
# from decimal import Decimal

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
# Configure MongoDB client with Atlas-compatible settings
client = AsyncIOMotorClient(
    mongo_url,
    retryWrites=True,
    w='majority',
    connectTimeoutMS=10000,
    serverSelectionTimeoutMS=10000,
    maxPoolSize=10
)
db = client[os.environ.get('DB_NAME', 'test_database')]

# Security
security = HTTPBearer()
import hashlib
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-here")

def hash_password(password: str) -> str:
    """Simple password hashing using SHA256"""
    return hashlib.sha256((password + SECRET_KEY).encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == hashed

# Utility functions for SEO-friendly URLs and file management
def create_seo_slug(text: str) -> str:
    """Create SEO-friendly URL slug from Turkish text"""
    if not text:
        return ""
    
    # Turkish character mapping
    turkish_chars = {
        'ı': 'i', 'İ': 'I', 'ğ': 'g', 'Ğ': 'G', 'ü': 'u', 'Ü': 'U',
        'ş': 's', 'Ş': 'S', 'ö': 'o', 'Ö': 'O', 'ç': 'c', 'Ç': 'C'
    }
    
    # Replace Turkish characters
    for turkish, english in turkish_chars.items():
        text = text.replace(turkish, english)
    
    # Convert to lowercase and replace spaces/special chars with hyphens
    text = re.sub(r'[^a-zA-Z0-9\s-]', '', text.lower())
    text = re.sub(r'[\s_-]+', '-', text)
    text = text.strip('-')
    
    return text

# Removed complex utility functions - keeping it simple

# Create the main app
app = FastAPI(title="Paket Tur Satış Platformu", version="1.0.0")
api_router = APIRouter(prefix="/api")

# Enums
class UserRole(str, Enum):
    CUSTOMER = "customer"
    VENDOR = "vendor"
    ADMIN = "admin"

class BookingStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PAID = "paid"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"

class TourStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"

# TourCategory will be dynamic, no longer an enum
# Categories will come from admin/categories collection

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    profile_image: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    phone: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Vendor(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    company_name: str
    description: Optional[str] = None
    address: Optional[str] = None
    phone: str
    website: Optional[str] = None
    logo: Optional[str] = None
    is_verified: bool = False
    rating: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ReservationType(str, Enum):
    CABIN_BASED = "cabin_based"
    PERSON_BASED = "person_based"
    RESERVATION = "reservation"

# Simplified - no complex media library model needed

class Tour(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vendor_id: str
    title: str
    description: str
    short_description: str
    location: str
    pickup_time: Optional[str] = "09:00"
    dropoff_time: Optional[str] = "18:00"
    category: str
    classification: Optional[str] = "standart"  # standart, lux, delux
    status: TourStatus = TourStatus.DRAFT
    reservation_type: ReservationType = ReservationType.CABIN_BASED
    images: List[str] = []  # Image URLs
    included_services: List[str] = []
    excluded_services: List[str] = []
    meeting_point: Optional[str] = None
    languages: List[str] = ["Turkish"]
    program_details: Optional[str] = None  # Daily program and itinerary information
    cancellation_policy: Optional[str] = None
    tags: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Backward compatibility fields
    duration_days: Optional[int] = 1
    duration_unit: Optional[str] = "days"  # "hours" or "days"
    duration_hours: Optional[int] = 0
    base_price: Optional[float] = 0
    max_participants: Optional[int] = 1
    difficulty_level: Optional[str] = "Easy"

class TourDate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tour_id: str
    start_date: str  # Date in YYYY-MM-DD format
    
    # Cabin-based pricing (existing)
    available_cabins: int = 0  # Total cabin capacity
    single_cabin_price: float = 0  # Price for single occupancy cabin
    double_cabin_price: float = 0  # Price for double occupancy cabin
    
    # Person-based pricing (new)
    max_persons: int = 0  # Maximum person capacity
    person_price: float = 0  # Price per person
    child_price: Optional[float] = None  # Optional child price
    
    # Reservation-based pricing (new)
    total_reservation_price: float = 0  # Total reservation price
    max_passengers: int = 0  # Maximum passenger capacity
    
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    tour_id: str
    tour_date_id: str
    participants: int  # Kabin sayısı
    cabin_type: str = "single"  # "single" or "double"
    total_price: float
    customer_info: Dict[str, Any]
    special_requests: Optional[str] = None
    booking_status: BookingStatus = BookingStatus.DRAFT
    payment_status: PaymentStatus = PaymentStatus.PENDING
    booking_code: str = Field(default_factory=lambda: str(uuid.uuid4())[:8].upper())
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    tour_id: str
    booking_id: str
    rating: int = Field(ge=1, le=5)
    title: Optional[str] = None
    comment: Optional[str] = None
    images: List[str] = []
    is_verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ContactMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: Optional[str] = None
    subject: str
    message: str
    status: str = "new"  # new, read, replied, resolved
    admin_reply: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Create models
class TourDateCreate(BaseModel):
    date: str  # ISO date string
    
    # Cabin-based fields (existing)
    capacity: int = 0  # Available cabins count
    single_cabin_price: float = 0  # Price for single occupancy cabin
    double_cabin_price: float = 0  # Price for double occupancy cabin
    
    # Person-based fields (new)
    max_persons: int = 0  # Maximum person capacity
    person_price: float = 0  # Price per person
    child_price: Optional[float] = None  # Optional child price
    
    # Reservation-based fields (new)
    total_reservation_price: float = 0  # Total reservation price
    max_passengers: int = 0  # Maximum passenger capacity
    
    is_active: Optional[bool] = True

class TourCreate(BaseModel):
    title: str
    description: str
    short_description: str
    location: str
    pickup_time: Optional[str] = "09:00"
    dropoff_time: Optional[str] = "18:00"
    category: str
    classification: Optional[str] = "standart"  # standart, lux, delux
    status: TourStatus = TourStatus.DRAFT
    reservation_type: ReservationType = ReservationType.CABIN_BASED
    images: List[str] = []
    included_services: List[str] = []
    excluded_services: List[str] = []
    meeting_point: Optional[str] = None
    languages: List[str] = ["Turkish"]
    program_details: Optional[str] = None  # Daily program and itinerary information
    cancellation_policy: Optional[str] = None
    tags: List[str] = []
    tour_dates: List[TourDateCreate] = []
    
    # Backward compatibility fields
    duration_days: Optional[int] = 1
    duration_unit: Optional[str] = "days"  # "hours" or "days"
    duration_hours: Optional[int] = 0
    base_price: Optional[float] = 0
    max_participants: Optional[int] = 1
    difficulty_level: Optional[str] = "Easy"

class BookingCreate(BaseModel):
    tour_id: str
    tour_date_id: str
    participants: int  # Kabin sayısı
    cabin_type: str = "single"  # "single" or "double"
    customer_info: Dict[str, Any]
    special_requests: Optional[str] = None

# Helper functions
def create_access_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm="HS256")

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(token_data = Depends(verify_token)):
    user = await db.users.find_one({"id": token_data["sub"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

# Mock Services
class MockPaymentService:
    async def process_payment(self, amount: float, currency: str = "TRY") -> Dict[str, Any]:
        # Mock iyzico payment processing
        await asyncio.sleep(1)  # Simulate processing time
        return {
            "success": True,
            "payment_id": str(uuid.uuid4()),
            "transaction_id": f"mock_txn_{uuid.uuid4()}",
            "status": "success",
            "amount": amount,
            "currency": currency
        }

class MockSMSService:
    async def send_sms(self, phone: str, message: str) -> bool:
        # Mock Verimor SMS service
        print(f"📱 SMS to {phone}: {message}")
        await asyncio.sleep(0.5)
        return True

class MockEmailService:
    async def send_email(self, to_email: str, subject: str, content: str, html: bool = False) -> bool:
        # Mock SMTP email service
        print(f"📧 Email to {to_email}: {subject}")
        await asyncio.sleep(0.5)
        return True

# Service instances
payment_service = MockPaymentService()
sms_service = MockSMSService()
email_service = MockEmailService()

# Auth endpoints
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create user
    user = User(**user_data.dict(exclude={"password"}))
    user_dict = user.dict()
    user_dict["hashed_password"] = hashed_password
    
    await db.users.insert_one(user_dict)
    
    # Create token
    token = create_access_token({"sub": user.id})
    
    return {"message": "User created successfully", "token": token, "user": user}

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    # Find user
    user_doc = await db.users.find_one({"email": login_data.email})
    if not user_doc or not verify_password(login_data.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = User(**user_doc)
    token = create_access_token({"sub": user.id})
    
    return {"token": token, "user": user}

@api_router.get("/users/me", response_model=User)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.post("/auth/google")
async def google_auth(google_token: dict):
    """Google OAuth authentication - Mock implementation"""
    # Mock Google authentication
    # In real implementation, verify Google token here
    
    email = google_token.get("email", "google_user@gmail.com")
    name = google_token.get("name", "Google User")
    
    # Check if user exists
    user_doc = await db.users.find_one({"email": email})
    
    if user_doc:
        user = User(**user_doc)
    else:
        # Create new user
        user = User(
            email=email,
            full_name=name,
            role=UserRole.CUSTOMER
        )
        user_dict = user.dict()
        user_dict["hashed_password"] = hash_password("google_oauth_user")  # Dummy password
        await db.users.insert_one(user_dict)
    
    token = create_access_token({"sub": user.id})
    return {"token": token, "user": user}

# Tour endpoints
@api_router.get("/tours")
async def get_tours(
    category: Optional[str] = None,
    location: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    duration_days: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100)
):
    """Get tours with filtering"""
    filter_query = {"status": TourStatus.ACTIVE}
    
    if category:
        filter_query["category"] = category
    if location:
        filter_query["location"] = {"$regex": location, "$options": "i"}
    if min_price is not None:
        filter_query.setdefault("base_price", {})["$gte"] = min_price
    if max_price is not None:
        filter_query.setdefault("base_price", {})["$lte"] = max_price
    if duration_days:
        filter_query["duration_days"] = duration_days
    
    tours = await db.tours.find(filter_query).skip(skip).limit(limit).to_list(length=None)
    
    # Convert and add tour_dates to each tour for price calculation
    result_tours = []
    for tour in tours:
        # Remove MongoDB _id to avoid serialization issues
        if "_id" in tour:
            del tour["_id"]
            
        tour_dates = await db.tour_dates.find({
            "tour_id": tour["id"],
            "is_active": True
        }).sort("start_date", 1).to_list(length=None)
        
        # Convert tour_dates for frontend
        tour["tour_dates"] = []
        for date in tour_dates:
            if "_id" in date:
                del date["_id"]
            # Only add if date has id field
            if "id" in date:
                tour["tour_dates"].append({
                    "id": date["id"],
                    "date": date["start_date"],
                    # Cabin-based fields
                    "capacity": date.get("available_cabins", 0),
                    "single_cabin_price": date.get("single_cabin_price", 0),
                    "double_cabin_price": date.get("double_cabin_price", 0),
                    # Person-based fields
                    "max_persons": date.get("max_persons", 0),
                    "person_price": date.get("person_price", 0),
                    "child_price": date.get("child_price"),
                    # Reservation-based fields
                    "total_reservation_price": date.get("total_reservation_price", 0),
                    "max_passengers": date.get("max_passengers", 0),
                    "is_active": date.get("is_active", True)
                })
        
        # Add review statistics
        reviews = await db.reviews.find({
            "tour_id": tour["id"],
            "is_verified": True
        }).to_list(length=None)
        
        if reviews:
            ratings = [review["rating"] for review in reviews]
            tour["rating"] = sum(ratings) / len(ratings)
            tour["review_count"] = len(reviews)
        else:
            tour["rating"] = 0
            tour["review_count"] = 0
        
        # Calculate minimum price from all reservation types
        if tour_dates:
            all_prices = []
            for date_data in tour_dates:
                # Cabin-based prices
                if date_data.get("single_cabin_price") and date_data["single_cabin_price"] > 0:
                    all_prices.append(date_data["single_cabin_price"])
                if date_data.get("double_cabin_price") and date_data["double_cabin_price"] > 0:
                    all_prices.append(date_data["double_cabin_price"])
                
                # Person-based prices
                if date_data.get("person_price") and date_data["person_price"] > 0:
                    all_prices.append(date_data["person_price"])
                
                # Reservation-based prices
                if date_data.get("total_reservation_price") and date_data["total_reservation_price"] > 0:
                    all_prices.append(date_data["total_reservation_price"])
                
                # Fallback for old data
                if date_data.get("price") and date_data["price"] > 0:
                    all_prices.append(date_data["price"])
            
            if all_prices:
                tour["minimum_price"] = min(all_prices)
            else:
                tour["minimum_price"] = tour.get("base_price", 0)
        else:
            tour["minimum_price"] = tour.get("base_price", 0)
        
        result_tours.append(tour)
    
    return result_tours

def create_slug(title):
    """Create SEO-friendly slug from tour title"""
    if not title:
        return ''
    
    # Turkish character mappings
    char_map = {
        'ğ': 'g', 'ü': 'u', 'ş': 's', 'ı': 'i', 'ö': 'o', 'ç': 'c',
        'Ğ': 'G', 'Ü': 'U', 'Ş': 'S', 'İ': 'I', 'Ö': 'O', 'Ç': 'C'
    }
    
    # Replace Turkish characters
    for turkish, latin in char_map.items():
        title = title.replace(turkish, latin)
    
    # Create slug
    import re
    slug = title.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)  # Remove special chars
    slug = re.sub(r'\s+', '-', slug.strip())  # Replace spaces with dashes
    slug = re.sub(r'-+', '-', slug)  # Remove multiple dashes
    slug = slug.strip('-')  # Remove leading/trailing dashes
    
    return slug

@api_router.get("/tours/{tour_identifier}")
async def get_tour_by_id(tour_identifier: str):
    # Check if it's a UUID (old format) or slug (new format)
    import re
    uuid_pattern = r'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'
    
    if re.match(uuid_pattern, tour_identifier):
        # Direct UUID lookup
        tour = await db.tours.find_one({"id": tour_identifier})
    else:
        # Slug lookup - find by matching slug or extract ID from slug
        # First try to extract UUID from slug (if slug contains UUID)
        uuid_match = re.search(r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}', tour_identifier)
        if uuid_match:
            tour = await db.tours.find_one({"id": uuid_match.group()})
        else:
            # Search by generating slug from title
            all_tours = await db.tours.find().to_list(length=None)
            tour = None
            for t in all_tours:
                if create_slug(t.get('title', '')) == tour_identifier:
                    tour = t
                    break
    
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    
    # Remove MongoDB _id to avoid serialization issues
    if "_id" in tour:
        del tour["_id"]
    
    # Add tour dates
    tour_dates = await db.tour_dates.find({
        "tour_id": tour["id"],
        "is_active": True
    }).sort("start_date", 1).to_list(length=None)
    
    tour["tour_dates"] = []
    for date in tour_dates:
        if "_id" in date:
            del date["_id"]
        tour["tour_dates"].append({
            "id": date.get("id", str(uuid.uuid4())),
            "start_date": date["start_date"],
            "date": date["start_date"],
            "capacity": date.get("available_cabins", 0),
            "single_cabin_price": date.get("single_cabin_price", 0),
            "double_cabin_price": date.get("double_cabin_price", 0),
            "max_persons": date.get("max_persons", 0),
            "person_price": date.get("person_price", 0),
            "child_price": date.get("child_price", 0),
            "total_reservation_price": date.get("total_reservation_price", 0),
            "is_active": date.get("is_active", True)
        })
    
    # Add review statistics
    reviews = await db.reviews.find({
        "tour_id": tour["id"],
        "is_verified": True
    }).to_list(length=None)
    
    if reviews:
        ratings = [review["rating"] for review in reviews]
        tour["rating"] = sum(ratings) / len(ratings)
        tour["review_count"] = len(reviews)
    else:
        tour["rating"] = 0
        tour["review_count"] = 0
    
    return tour

@api_router.post("/tours", response_model=Tour)
async def create_tour(tour_data: TourCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.VENDOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get vendor_id
    vendor_id = current_user.id
    if current_user.role == UserRole.VENDOR:
        vendor = await db.vendors.find_one({"user_id": current_user.id})
        if vendor:
            vendor_id = vendor["id"]
    
    tour = Tour(**tour_data.dict(), vendor_id=vendor_id)
    await db.tours.insert_one(tour.dict())
    return tour

# Booking endpoints
@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking_data: BookingCreate, current_user: User = Depends(get_current_user)):
    # Validate tour and date
    tour = await db.tours.find_one({"id": booking_data.tour_id})
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    
    tour_date = await db.tour_dates.find_one({"id": booking_data.tour_date_id})
    if not tour_date:
        raise HTTPException(status_code=404, detail="Tour date not found")
    
    # Check cabin availability  
    if tour_date["available_cabins"] < booking_data.participants:
        raise HTTPException(status_code=400, detail="Not enough cabins available")
    
    # Calculate price based on cabin type
    if booking_data.cabin_type == "double":
        cabin_price = tour_date.get("double_cabin_price") or tour["base_price"]
    else:
        cabin_price = tour_date.get("single_cabin_price") or tour["base_price"]
    
    total_price = cabin_price * booking_data.participants
    
    # Create booking
    booking = Booking(
        **booking_data.dict(),
        user_id=current_user.id,
        total_price=total_price
    )
    
    await db.bookings.insert_one(booking.dict())
    
    # Send confirmation SMS and email
    await sms_service.send_sms(
        current_user.phone or booking_data.customer_info.get("phone", ""),
        f"Rezervasyonunuz onaylandı! Kod: {booking.booking_code}"
    )
    
    await email_service.send_email(
        current_user.email,
        "Rezervasyon Onayı",
        f"Sayın {current_user.full_name}, rezervasyonunuz başarıyla oluşturuldu. Rezervasyon kodu: {booking.booking_code}"
    )
    
    return booking

@api_router.get("/bookings", response_model=List[Booking])
async def get_user_bookings(current_user: User = Depends(get_current_user)):
    bookings = await db.bookings.find({"user_id": current_user.id}).to_list(length=None)
    
    # Handle legacy bookings that may be missing required fields
    valid_bookings = []
    for booking in bookings:
        # Remove MongoDB _id to avoid serialization issues
        if "_id" in booking:
            del booking["_id"]
        
        # Fix legacy payment_status values
        if booking.get("payment_status") == "paid":
            booking["payment_status"] = "success"
        
        # Add missing required fields with defaults
        if "tour_date_id" not in booking:
            booking["tour_date_id"] = "legacy-booking"
        
        if "booking_status" not in booking:
            booking["booking_status"] = "completed" if booking.get("payment_status") == "success" else "draft"
        
        try:
            valid_bookings.append(Booking(**booking))
        except Exception as e:
            # Skip invalid bookings but log the error
            print(f"Skipping invalid booking {booking.get('id', 'unknown')}: {e}")
            continue
    
    return valid_bookings

@api_router.post("/bookings/{booking_id}/pay")
async def pay_booking(booking_id: str, current_user: User = Depends(get_current_user)):
    booking_doc = await db.bookings.find_one({"id": booking_id, "user_id": current_user.id})
    if not booking_doc:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    booking = Booking(**booking_doc)
    
    # Process payment (mock)
    payment_result = await payment_service.process_payment(booking.total_price)
    
    if payment_result["success"]:
        # Update booking
        await db.bookings.update_one(
            {"id": booking_id},
            {
                "$set": {
                    "payment_status": PaymentStatus.SUCCESS,
                    "booking_status": BookingStatus.PAID,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Send confirmation
        await sms_service.send_sms(
            current_user.phone or "",
            f"Ödemeniz başarılı! Rezervasyon: {booking.booking_code}"
        )
        
        return {"message": "Payment successful", "payment_id": payment_result["payment_id"]}
    
    raise HTTPException(status_code=400, detail="Payment failed")

# Review endpoints
class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    title: Optional[str] = None
    comment: Optional[str] = None

@api_router.post("/tours/{tour_id}/reviews")
async def create_review(
    tour_id: str,
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user)
):
    # Check if user has booked this tour
    booking = await db.bookings.find_one({
        "user_id": current_user.id,
        "tour_id": tour_id,
        "booking_status": BookingStatus.COMPLETED
    })
    if not booking:
        raise HTTPException(status_code=400, detail="You can only review tours you have completed")
    
    review = Review(
        user_id=current_user.id,
        tour_id=tour_id,
        booking_id=booking["id"],
        rating=review_data.rating,
        title=review_data.title,
        comment=review_data.comment
    )
    
    await db.reviews.insert_one(review.dict())
    return review

class ReviewWithUser(BaseModel):
    id: str
    user_id: str
    tour_id: str
    booking_id: str
    rating: int = Field(ge=1, le=5)
    title: Optional[str] = None
    comment: Optional[str] = None
    images: List[str] = []
    is_verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_name: Optional[str] = None

@api_router.get("/tours/{tour_id}/dates", response_model=List[TourDate])
async def get_tour_dates(tour_id: str):
    """Get available dates for a tour"""
    # Get all active dates for this tour
    tour_dates = await db.tour_dates.find({
        "tour_id": tour_id,
        "is_active": True
    }).sort("start_date", 1).to_list(length=None)
    
    return [TourDate(**date) for date in tour_dates]

@api_router.get("/debug/tour_dates")
async def debug_all_tour_dates():
    """Debug endpoint to see all tour dates"""
    try:
        all_dates = await db.tour_dates.find({}).to_list(length=None)
        # Remove MongoDB _id to avoid serialization issues
        for date in all_dates:
            if "_id" in date:
                del date["_id"]
        return {"count": len(all_dates), "dates": all_dates}
    except Exception as e:
        return {"error": str(e), "count": 0, "dates": []}

@api_router.get("/tours/{tour_id}/reviews", response_model=List[ReviewWithUser])
async def get_tour_reviews(tour_id: str):
    reviews = await db.reviews.find({"tour_id": tour_id}).to_list(length=None)
    
    # Kullanıcı bilgilerini ekle
    review_list = []
    for review in reviews:
        user = await db.users.find_one({"id": review["user_id"]})
        review_with_user = ReviewWithUser(
            **review,
            user_name=user.get("full_name", "Anonim") if user else "Anonim"
        )
        review_list.append(review_with_user)
    
    return review_list

# Admin endpoints
@api_router.get("/admin/dashboard")
async def admin_dashboard(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get statistics
    total_tours = await db.tours.count_documents({})
    total_bookings = await db.bookings.count_documents({})
    total_users = await db.users.count_documents({})
    total_revenue = await db.bookings.aggregate([
        {"$match": {"payment_status": PaymentStatus.SUCCESS}},
        {"$group": {"_id": None, "total": {"$sum": "$total_price"}}}
    ]).to_list(length=1)
    
    return {
        "total_tours": total_tours,
        "total_bookings": total_bookings,
        "total_users": total_users,
        "total_revenue": total_revenue[0]["total"] if total_revenue else 0
    }

# Favorites system
class Favorite(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    tour_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

@api_router.post("/favorites/{tour_id}")
async def add_to_favorites(tour_id: str, current_user: User = Depends(get_current_user)):
    # Check if tour exists
    tour = await db.tours.find_one({"id": tour_id})
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    
    # Check if already favorited
    existing = await db.favorites.find_one({"user_id": current_user.id, "tour_id": tour_id})
    if existing:
        raise HTTPException(status_code=400, detail="Tour already in favorites")
    
    # Add to favorites
    favorite = Favorite(user_id=current_user.id, tour_id=tour_id)
    await db.favorites.insert_one(favorite.dict())
    
    return {"message": "Tour added to favorites"}

@api_router.delete("/favorites/{tour_id}")
async def remove_from_favorites(tour_id: str, current_user: User = Depends(get_current_user)):
    result = await db.favorites.delete_one({"user_id": current_user.id, "tour_id": tour_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    return {"message": "Tour removed from favorites"}

@api_router.get("/favorites")
async def get_user_favorites(current_user: User = Depends(get_current_user)):
    # Get user's favorite tour IDs
    favorites = await db.favorites.find({"user_id": current_user.id}).to_list(length=None)
    tour_ids = [fav["tour_id"] for fav in favorites]
    
    if not tour_ids:
        return []
    
    # Get the actual tours
    tours = await db.tours.find({"id": {"$in": tour_ids}}).to_list(length=None)
    
    # Add minimum price and other required fields for each tour
    enriched_tours = []
    for tour in tours:
        # Get tour dates to calculate minimum price
        tour_dates = await db.tour_dates.find({"tour_id": tour["id"]}).to_list(length=None)
        
        # Calculate minimum price from tour dates
        minimum_price = None
        if tour_dates:
            all_prices = []
            for td in tour_dates:
                all_prices.append(td.get("single_cabin_price", 0))
                all_prices.append(td.get("double_cabin_price", 0))
            # Fix: Handle case where all prices are 0 or empty
            valid_prices = [p for p in all_prices if p > 0]
            minimum_price = min(valid_prices) if valid_prices else 0
        
        # Get review count and rating
        reviews = await db.reviews.find({"tour_id": tour["id"]}).to_list(length=None)
        review_count = len(reviews)
        rating = sum(r.get("rating", 0) for r in reviews) / len(reviews) if reviews else 0
        
        # Add calculated fields to tour
        tour_data = Tour(**tour).dict()
        tour_data.update({
            "minimum_price": minimum_price or tour.get("base_price", 0),
            "review_count": review_count,
            "rating": round(rating, 1)
        })
        
        enriched_tours.append(tour_data)
    
    return enriched_tours

@api_router.get("/favorites/check/{tour_id}")
async def check_favorite_status(tour_id: str, current_user: User = Depends(get_current_user)):
    favorite = await db.favorites.find_one({"user_id": current_user.id, "tour_id": tour_id})
    return {"is_favorited": favorite is not None}

# Admin endpoints
@api_router.get("/admin/tours")
async def admin_get_all_tours(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    tours = await db.tours.find().to_list(length=None)
    
    # Convert and add tour_dates to each tour
    result_tours = []
    for tour in tours:
        # Remove MongoDB _id to avoid serialization issues
        if "_id" in tour:
            del tour["_id"]
            
        tour_dates = await db.tour_dates.find({
            "tour_id": tour["id"],
            "is_active": True
        }).sort("start_date", 1).to_list(length=None)
        
        # Convert tour_dates for frontend
        tour["tour_dates"] = []
        for date in tour_dates:
            if "_id" in date:
                del date["_id"]
            # Only add if date has id field
            if "id" in date:
                tour["tour_dates"].append({
                    "id": date["id"],
                    "date": date["start_date"],
                    # Cabin-based fields
                    "capacity": date.get("available_cabins", 0),
                    "single_cabin_price": date.get("single_cabin_price", 0),
                    "double_cabin_price": date.get("double_cabin_price", 0),
                    # Person-based fields
                    "max_persons": date.get("max_persons", 0),
                    "person_price": date.get("person_price", 0),
                    "child_price": date.get("child_price"),
                    # Reservation-based fields
                    "total_reservation_price": date.get("total_reservation_price", 0),
                    "max_passengers": date.get("max_passengers", 0),
                    "is_active": date.get("is_active", True)
                })
        
        result_tours.append(tour)
    
    return result_tours

@api_router.put("/admin/tours/{tour_id}", response_model=Tour)
async def admin_update_tour(tour_id: str, tour_data: TourCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Update tour
    tour_dict = tour_data.dict()
    
    # Debug: Log incoming tour_dates
    print(f"🔄 UPDATING TOUR {tour_id}")
    print(f"📋 Complete tour_update received: {json.dumps(tour_dict, indent=2, default=str)}")
    
    # Extract tour_dates from the update
    tour_dates_data = tour_dict.pop("tour_dates", [])
    print(f"📅 tour_dates data: {json.dumps(tour_dates_data, indent=2, default=str)}")
    
    tour_dict["updated_at"] = datetime.utcnow()
    
    result = await db.tours.update_one(
        {"id": tour_id},
        {"$set": tour_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tour not found")
    
    # Handle tour dates update - delete existing and create new ones
    if tour_dates_data:
        # Delete existing tour dates
        await db.tour_dates.delete_many({"tour_id": tour_id})
        
        # Create new tour dates with all reservation types support
        for date_data in tour_dates_data:
            print(f"🔍 Processing tour date: {date_data}")
            try:
                tour_date = TourDate(
                    tour_id=tour_id,
                    start_date=date_data.get("date", date_data.get("start_date")),
                    
                    # Cabin-based fields
                    available_cabins=date_data.get("capacity", 0),
                    single_cabin_price=float(date_data.get("single_cabin_price", 0)),
                    double_cabin_price=float(date_data.get("double_cabin_price", 0)),
                    
                    # Person-based fields
                    max_persons=date_data.get("max_persons", 0),
                    person_price=float(date_data.get("person_price", 0)),
                    child_price=float(date_data.get("child_price", 0)) if date_data.get("child_price") else None,
                    
                    # Reservation-based fields
                    total_reservation_price=float(date_data.get("total_reservation_price", 0)),
                    max_passengers=date_data.get("max_passengers", 0),
                    
                    is_active=date_data.get("is_active", True)
                )
                print(f"✅ Created tour_date: {tour_date.dict()}")
            except Exception as e:
                print(f"❌ ERROR creating tour_date: {e}")
                print(f"❌ Date data causing error: {date_data}")
                raise HTTPException(status_code=422, detail=f"Invalid tour date data: {str(e)}")
            
            # Convert to dict and handle datetime serialization
            tour_date_dict = tour_date.dict()
            if isinstance(tour_date_dict.get("created_at"), datetime):
                tour_date_dict["created_at"] = tour_date_dict["created_at"].isoformat()
            
            await db.tour_dates.insert_one(tour_date_dict)
    
    updated_tour = await db.tours.find_one({"id": tour_id})
    return Tour(**updated_tour)

@api_router.delete("/admin/tours/{tour_id}")
async def admin_delete_tour(tour_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if tour has active bookings
    active_bookings = await db.bookings.find({
        "tour_id": tour_id,
        "booking_status": {"$in": ["confirmed", "paid"]}
    }).to_list(length=1)
    
    if active_bookings:
        raise HTTPException(status_code=400, detail="Cannot delete tour with active bookings")
    
    result = await db.tours.delete_one({"id": tour_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tour not found")
    
    # Also delete related tour dates and reviews
    await db.tour_dates.delete_many({"tour_id": tour_id})
    await db.reviews.delete_many({"tour_id": tour_id})
    
    return {"message": "Tour deleted successfully"}

@api_router.post("/admin/tours", response_model=Tour)
async def admin_create_tour(tour_data: TourCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Create tour data without tour_dates 
    tour_dict = tour_data.dict()
    tour_dates_data = tour_dict.pop('tour_dates', [])
    
    # Create new tour
    tour = Tour(**tour_dict, vendor_id=current_user.id)
    await db.tours.insert_one(tour.dict())
    
    # Create tour dates
    for date_data in tour_dates_data:
        tour_date = {
            "id": str(uuid.uuid4()),
            "tour_id": tour.id,
            "start_date": date_data["date"],  # Keep as string for MongoDB compatibility
            
            # Cabin-based fields
            "available_cabins": date_data.get("capacity", 0),
            "single_cabin_price": float(date_data.get("single_cabin_price", 0)),
            "double_cabin_price": float(date_data.get("double_cabin_price", 0)),
            
            # Person-based fields
            "max_persons": date_data.get("max_persons", 0),
            "person_price": float(date_data.get("person_price", 0)),
            "child_price": float(date_data.get("child_price", 0)) if date_data.get("child_price") else None,
            
            # Reservation-based fields
            "total_reservation_price": float(date_data.get("total_reservation_price", 0)),
            "max_passengers": date_data.get("max_passengers", 0),
            
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.tour_dates.insert_one(tour_date)
    
    return tour

# File Upload
@api_router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Create uploads directory if not exists
    import os
    upload_dir = "/tmp/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    import time
    filename = f"{int(time.time())}_{file.filename}"
    file_path = os.path.join(upload_dir, filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Return URL - construct from environment or request headers
    app_url = os.environ.get('APP_URL', 'http://localhost:8001')
    file_url = f"{app_url}/uploads/{filename}"
    
    return {"url": file_url, "filename": filename}

# Location Management
class LocationCreate(BaseModel):
    name: str
    description: Optional[str] = None
    country: str = "Turkey"
    is_active: bool = True

class Location(LocationCreate):
    id: str
    created_at: datetime

@api_router.get("/admin/locations", response_model=List[Location])
async def admin_get_locations(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    locations = await db.locations.find().to_list(length=None)
    return [Location(**location) for location in locations]

@api_router.post("/admin/locations", response_model=Location)
async def admin_create_location(location_data: LocationCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    location = {
        "id": str(uuid.uuid4()),
        "name": location_data.name,
        "description": location_data.description,
        "country": location_data.country,
        "is_active": location_data.is_active,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.locations.insert_one(location)
    return Location(**location)

@api_router.put("/admin/locations/{location_id}", response_model=Location)
async def admin_update_location(location_id: str, location_data: LocationCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Lokasyonun varlığını kontrol et
    existing_location = await db.locations.find_one({"id": location_id})
    if not existing_location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Güncelleme verilerini hazırla
    updated_data = {
        "name": location_data.name,
        "description": location_data.description,
        "country": location_data.country,
        "is_active": location_data.is_active,
        "updated_at": datetime.now(timezone.utc)
    }
    
    # Lokasyonu güncelle
    await db.locations.update_one(
        {"id": location_id}, 
        {"$set": updated_data}
    )
    
    # Güncellenmiş lokasyonu getir ve döndür
    updated_location = await db.locations.find_one({"id": location_id})
    return Location(**updated_location)

@api_router.put("/admin/locations/{location_id}/status")
async def admin_toggle_location_status(location_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    location = await db.locations.find_one({"id": location_id})
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    new_status = not location.get("is_active", True)
    await db.locations.update_one(
        {"id": location_id}, 
        {"$set": {"is_active": new_status, "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": f"Location {'activated' if new_status else 'deactivated'} successfully"}

@api_router.delete("/admin/locations/{location_id}")
async def admin_delete_location(location_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if location is being used by any tours
    tours_using_location = await db.tours.find_one({"location": {"$regex": f".*{location_id}.*", "$options": "i"}})
    if tours_using_location:
        raise HTTPException(status_code=400, detail="Cannot delete location that is being used by tours")
    
    location = await db.locations.find_one({"id": location_id})
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    await db.locations.delete_one({"id": location_id})
    return {"message": "Location deleted successfully"}

# Category Management
class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    image: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_keywords: Optional[str] = None
    faq: List[Dict[str, str]] = []  # [{"question": "...", "answer": "..."}]
    is_active: bool = True

class Category(CategoryCreate):
    id: str
    created_at: datetime

@api_router.get("/admin/categories", response_model=List[Category])
async def admin_get_categories(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    categories = await db.categories.find().to_list(length=None)
    return [Category(**category) for category in categories]

@api_router.post("/admin/categories", response_model=Category)
async def admin_create_category(category_data: CategoryCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    category = {
        "id": str(uuid.uuid4()),
        "name": category_data.name,
        "description": category_data.description,
        "icon": category_data.icon,
        "image": category_data.image,
        "seo_title": category_data.seo_title,
        "seo_description": category_data.seo_description,
        "seo_keywords": category_data.seo_keywords,
        "faq": category_data.faq,
        "is_active": category_data.is_active,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.categories.insert_one(category)
    return Category(**category)

@api_router.put("/admin/categories/{category_id}", response_model=Category)
async def admin_update_category(category_id: str, category_data: CategoryCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Kategorinin varlığını kontrol et
    existing_category = await db.categories.find_one({"id": category_id})
    if not existing_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Güncelleme verilerini hazırla
    updated_data = {
        "name": category_data.name,
        "description": category_data.description,
        "icon": category_data.icon,
        "image": category_data.image,
        "seo_title": category_data.seo_title,
        "seo_description": category_data.seo_description,
        "seo_keywords": category_data.seo_keywords,
        "faq": category_data.faq,
        "is_active": category_data.is_active,
        "updated_at": datetime.now(timezone.utc)
    }
    
    # Kategoriyi güncelle
    await db.categories.update_one(
        {"id": category_id}, 
        {"$set": updated_data}
    )
    
    # Güncellenmiş kategoriyi getir ve döndür
    updated_category = await db.categories.find_one({"id": category_id})
    return Category(**updated_category)

@api_router.put("/admin/categories/{category_id}/status")
async def admin_toggle_category_status(category_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    category = await db.categories.find_one({"id": category_id})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    new_status = not category.get("is_active", True)
    await db.categories.update_one(
        {"id": category_id}, 
        {"$set": {"is_active": new_status, "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": f"Category {'activated' if new_status else 'deactivated'} successfully"}

@api_router.delete("/admin/categories/{category_id}")
async def admin_delete_category(category_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if category is being used by any tours
    tours_using_category = await db.tours.find_one({"category": {"$regex": f".*{category_id}.*", "$options": "i"}})
    if tours_using_category:
        raise HTTPException(status_code=400, detail="Cannot delete category that is being used by tours")
    
    category = await db.categories.find_one({"id": category_id})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    await db.categories.delete_one({"id": category_id})
    return {"message": "Category deleted successfully"}

# New Category System - Hierarchical Structure
class NewCategoryCreate(BaseModel):
    title: str
    description: Optional[str] = None
    image: Optional[str] = None
    faq: List[Dict[str, str]] = []  # [{"question": "...", "answer": "..."}]
    custom_slug: Optional[str] = None  # Manual URL override
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    is_active: bool = True

class NewCategory(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    image: Optional[str] = None
    faq: List[Dict[str, str]] = []
    slug: str
    custom_slug: Optional[str] = None  # Manual URL if set
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None

class SubCategoryCreate(BaseModel):
    parent_category_id: str
    location_name: Optional[str] = None  # Location name optional now
    title: Optional[str] = None  # Required if no location
    description: Optional[str] = None
    image: Optional[str] = None
    faq: List[Dict[str, str]] = []
    custom_slug: Optional[str] = None  # Manual URL override
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    is_active: bool = True

class SubCategory(BaseModel):
    id: str
    parent_category_id: str
    parent_category_title: str
    parent_category_slug: str
    location_name: Optional[str] = None
    location_slug: Optional[str] = None
    title: str  # Auto-generated or custom
    slug: str  # parent-slug/location-slug or parent-slug/custom-slug
    custom_slug: Optional[str] = None  # Manual URL if set
    description: Optional[str] = None
    image: Optional[str] = None
    faq: List[Dict[str, str]] = []
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None

# MAIN CATEGORY MANAGEMENT
@api_router.post("/admin/new-categories", response_model=NewCategory)
async def admin_create_new_category(category_data: NewCategoryCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Create category slug - use custom_slug if provided, otherwise generate from title
    if category_data.custom_slug:
        category_slug = category_data.custom_slug.strip().lower()
        # Validate custom slug format
        if not re.match(r'^[a-z0-9-]+$', category_slug):
            raise HTTPException(status_code=400, detail="Özel URL sadece küçük harf, rakam ve tire içerebilir")
    else:
        category_slug = create_seo_slug(category_data.title)
    
    # Check if slug already exists
    existing_category = await db.new_categories.find_one({"slug": category_slug})
    if existing_category:
        raise HTTPException(status_code=400, detail="Bu URL zaten kullanımda, farklı bir URL deneyin")
    
    # Create new main category
    category = {
        "id": str(uuid.uuid4()),
        "title": category_data.title,
        "description": category_data.description,
        "image": category_data.image,
        "faq": category_data.faq,
        "slug": category_slug,
        "custom_slug": category_data.custom_slug,
        "meta_title": category_data.meta_title or category_data.title,
        "meta_description": category_data.meta_description,
        "meta_keywords": category_data.meta_keywords,
        "is_active": category_data.is_active,
        "created_at": datetime.now(timezone.utc)
    }
    
    # Insert main category
    await db.new_categories.insert_one(category)
    
    return NewCategory(**category)

# SUB CATEGORY MANAGEMENT
@api_router.post("/admin/new-categories/{category_id}/subcategories", response_model=SubCategory)
async def admin_create_subcategory(category_id: str, subcategory_data: SubCategoryCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Validate input - either location_name or title must be provided
    if not subcategory_data.location_name and not subcategory_data.title:
        raise HTTPException(status_code=400, detail="Lokasyon adı veya özel başlık belirtilmelidir")
    
    # Get parent category
    parent_category = await db.new_categories.find_one({"id": category_id})
    if not parent_category:
        raise HTTPException(status_code=404, detail="Ana kategori bulunamadı")
    
    # Create slug based on custom_slug or location/title
    if subcategory_data.custom_slug:
        # Use custom slug
        sub_slug = subcategory_data.custom_slug.strip().lower()
        if not re.match(r'^[a-z0-9-]+$', sub_slug):
            raise HTTPException(status_code=400, detail="Özel URL sadece küçük harf, rakam ve tire içerebilir")
        combined_slug = f"{parent_category['slug']}/{sub_slug}"
        location_slug = None
    elif subcategory_data.location_name:
        # Use location-based slug
        location_slug = create_seo_slug(subcategory_data.location_name)
        combined_slug = f"{parent_category['slug']}/{location_slug}"
    else:
        # Use title-based slug
        location_slug = create_seo_slug(subcategory_data.title)
        combined_slug = f"{parent_category['slug']}/{location_slug}"
    
    # Check if this slug already exists
    existing_subcategory = await db.sub_categories.find_one({
        "slug": combined_slug
    })
    if existing_subcategory:
        raise HTTPException(status_code=400, detail="Bu URL zaten kullanımda, farklı bir URL deneyin")
    
    # Create title
    if subcategory_data.title:
        title = subcategory_data.title
    elif subcategory_data.location_name:
        title = f"{parent_category['title']} - {subcategory_data.location_name}"
    else:
        title = parent_category['title']
    
    # Create subcategory
    subcategory = {
        "id": str(uuid.uuid4()),
        "parent_category_id": category_id,
        "parent_category_title": parent_category["title"],
        "parent_category_slug": parent_category["slug"],
        "location_name": subcategory_data.location_name,
        "location_slug": location_slug,
        "title": title,
        "slug": combined_slug,
        "custom_slug": subcategory_data.custom_slug,
        "description": subcategory_data.description,
        "image": subcategory_data.image,
        "faq": subcategory_data.faq,
        "meta_title": subcategory_data.meta_title or title,
        "meta_description": subcategory_data.meta_description,
        "meta_keywords": subcategory_data.meta_keywords,
        "is_active": subcategory_data.is_active and parent_category["is_active"],  # Inherit parent status
        "created_at": datetime.now(timezone.utc)
    }
    
    # Insert subcategory
    await db.sub_categories.insert_one(subcategory)
    
    return SubCategory(**subcategory)

@api_router.get("/admin/subcategories")
async def admin_get_subcategories(category_id: str = None, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Build query
    query = {}
    if category_id:
        query["parent_category_id"] = category_id
    
    # Get subcategories
    subcategories = await db.sub_categories.find(query).to_list(length=None)
    
    result = []
    for subcategory in subcategories:
        if "_id" in subcategory:
            del subcategory["_id"]
        result.append(SubCategory(**subcategory).dict())
    
    return result

@api_router.put("/admin/subcategories/{subcategory_id}", response_model=SubCategory)
async def admin_update_subcategory(subcategory_id: str, subcategory_data: SubCategoryCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Validate input - either location_name or title must be provided
    if not subcategory_data.location_name and not subcategory_data.title:
        raise HTTPException(status_code=400, detail="Lokasyon adı veya özel başlık belirtilmelidir")
    
    # Check if subcategory exists
    existing_subcategory = await db.sub_categories.find_one({"id": subcategory_id})
    if not existing_subcategory:
        raise HTTPException(status_code=404, detail="Alt kategori bulunamadı")
    
    # Get parent category
    parent_category = await db.new_categories.find_one({"id": existing_subcategory["parent_category_id"]})
    if not parent_category:
        raise HTTPException(status_code=404, detail="Ana kategori bulunamadı")
    
    # Create slug based on custom_slug or location/title
    if subcategory_data.custom_slug:
        # Use custom slug
        sub_slug = subcategory_data.custom_slug.strip().lower()
        if not re.match(r'^[a-z0-9-]+$', sub_slug):
            raise HTTPException(status_code=400, detail="Özel URL sadece küçük harf, rakam ve tire içerebilir")
        combined_slug = f"{parent_category['slug']}/{sub_slug}"
        location_slug = None
    elif subcategory_data.location_name:
        # Use location-based slug
        location_slug = create_seo_slug(subcategory_data.location_name)
        combined_slug = f"{parent_category['slug']}/{location_slug}"
    else:
        # Use title-based slug
        location_slug = create_seo_slug(subcategory_data.title)
        combined_slug = f"{parent_category['slug']}/{location_slug}"
    
    # Check if new slug conflicts with existing subcategories (excluding current)
    if combined_slug != existing_subcategory["slug"]:
        conflicting_subcategory = await db.sub_categories.find_one({
            "slug": combined_slug,
            "id": {"$ne": subcategory_id}
        })
        if conflicting_subcategory:
            raise HTTPException(status_code=400, detail="Bu URL zaten kullanımda, farklı bir URL deneyin")
    
    # Create title
    if subcategory_data.title:
        title = subcategory_data.title
    elif subcategory_data.location_name:
        title = f"{parent_category['title']} - {subcategory_data.location_name}"
    else:
        title = parent_category['title']
    
    # Update subcategory
    updated_data = {
        "location_name": subcategory_data.location_name,
        "location_slug": location_slug,
        "title": title,
        "slug": combined_slug,
        "custom_slug": subcategory_data.custom_slug,
        "description": subcategory_data.description,
        "image": subcategory_data.image,
        "faq": subcategory_data.faq,
        "meta_title": subcategory_data.meta_title or title,
        "meta_description": subcategory_data.meta_description,
        "meta_keywords": subcategory_data.meta_keywords,
        "is_active": subcategory_data.is_active and parent_category["is_active"],  # Inherit parent status
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.sub_categories.update_one(
        {"id": subcategory_id},
        {"$set": updated_data}
    )
    
    # Get updated subcategory
    updated_subcategory = await db.sub_categories.find_one({"id": subcategory_id})
    return SubCategory(**updated_subcategory)

@api_router.delete("/admin/subcategories/{subcategory_id}")
async def admin_delete_subcategory(subcategory_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if subcategory exists
    subcategory = await db.sub_categories.find_one({"id": subcategory_id})
    if not subcategory:
        raise HTTPException(status_code=404, detail="Alt kategori bulunamadı")
    
    # Delete subcategory
    await db.sub_categories.delete_one({"id": subcategory_id})
    
    return {"message": "Alt kategori başarıyla silindi"}

@api_router.get("/admin/new-categories")
async def admin_get_new_categories(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get all main categories
    categories = await db.new_categories.find().to_list(length=None)
    
    # Build hierarchical structure
    result = []
    for category in categories:
        if "_id" in category:
            del category["_id"]
            
        # Get subcategories for this category
        subcategories = await db.sub_categories.find({"parent_category_id": category["id"]}).to_list(length=None)
        
        category_data = NewCategory(**category).dict()
        category_data["subcategories"] = []
        
        for subcategory in subcategories:
            if "_id" in subcategory:
                del subcategory["_id"]
            category_data["subcategories"].append(SubCategory(**subcategory).dict())
        
        result.append(category_data)
    
    return result

@api_router.put("/admin/new-categories/{category_id}", response_model=NewCategory)
async def admin_update_new_category(category_id: str, category_data: NewCategoryCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if category exists
    existing_category = await db.new_categories.find_one({"id": category_id})
    if not existing_category:
        raise HTTPException(status_code=404, detail="Kategori bulunamadı")
    
    # Update category slug
    if category_data.custom_slug:
        new_slug = category_data.custom_slug.strip().lower()
        if not re.match(r'^[a-z0-9-]+$', new_slug):
            raise HTTPException(status_code=400, detail="Özel URL sadece küçük harf, rakam ve tire içerebilir")
    else:
        new_slug = create_seo_slug(category_data.title)
    
    # Check if new slug conflicts with existing categories (excluding current)
    if new_slug != existing_category["slug"]:
        conflicting_category = await db.new_categories.find_one({
            "slug": new_slug,
            "id": {"$ne": category_id}
        })
        if conflicting_category:
            raise HTTPException(status_code=400, detail="Bu URL zaten kullanımda, farklı bir URL deneyin")
    
    # Update main category
    updated_data = {
        "title": category_data.title,
        "description": category_data.description,
        "image": category_data.image,
        "faq": category_data.faq,
        "slug": new_slug,
        "custom_slug": category_data.custom_slug,
        "meta_title": category_data.meta_title or category_data.title,
        "meta_description": category_data.meta_description,
        "meta_keywords": category_data.meta_keywords,
        "is_active": category_data.is_active,
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.new_categories.update_one(
        {"id": category_id},
        {"$set": updated_data}
    )
    
    # Update all subcategories with new parent info and cascade active status
    if existing_category["slug"] != new_slug or existing_category["title"] != category_data.title:
        # Update subcategory parent info and slugs
        subcategories = await db.sub_categories.find({"parent_category_id": category_id}).to_list(length=None)
        
        for subcategory in subcategories:
            new_combined_slug = f"{new_slug}/{subcategory['location_slug']}"
            new_title = f"{category_data.title} - {subcategory['location_name']}"
            
            subcategory_update = {
                "parent_category_title": category_data.title,
                "parent_category_slug": new_slug,
                "slug": new_combined_slug,
                "title": new_title,
                "is_active": subcategory["is_active"] and category_data.is_active,  # Cascade active status
                "updated_at": datetime.now(timezone.utc)
            }
            
            await db.sub_categories.update_one(
                {"id": subcategory["id"]},
                {"$set": subcategory_update}
            )
    
    # If parent category is deactivated, deactivate all subcategories
    if not category_data.is_active:
        await db.sub_categories.update_many(
            {"parent_category_id": category_id},
            {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}}
        )
    
    # Get updated category
    updated_category = await db.new_categories.find_one({"id": category_id})
    return NewCategory(**updated_category)

@api_router.delete("/admin/new-categories/{category_id}")
async def admin_delete_new_category(category_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if category exists
    category = await db.new_categories.find_one({"id": category_id})
    if not category:
        raise HTTPException(status_code=404, detail="Kategori bulunamadı")
    
    # Count subcategories
    subcategory_count = await db.sub_categories.count_documents({"parent_category_id": category_id})
    
    # Delete main category and all its subcategories
    await db.new_categories.delete_one({"id": category_id})
    await db.sub_categories.delete_many({"parent_category_id": category_id})
    
    return {
        "message": f"Ana kategori ve {subcategory_count} alt kategorisi başarıyla silindi",
        "deleted_subcategories": subcategory_count
    }

# Frontend Category APIs
@api_router.get("/public/categories")
async def get_public_categories():
    """Get all public categories for homepage"""
    categories = await db.new_categories.find({"is_active": True}).to_list(length=None)
    
    result = []
    for category in categories:
        if "_id" in category:
            del category["_id"]
        
        # Count tours for this category
        tour_count = await db.tours.count_documents({
            "category": {"$regex": category["title"], "$options": "i"},
            "status": "active"
        })
        
        result.append({
            "id": category["id"],
            "title": category["title"],
            "slug": category["slug"],
            "description": category["description"],
            "image": category.get("image"),
            "tours_count": tour_count
        })
    
    return {"categories": result}
@api_router.get("/categories/{category_slug}")
async def get_category_by_slug(category_slug: str):
    """Get main category details by slug"""
    category = await db.new_categories.find_one({"slug": category_slug, "is_active": True})
    if not category:
        raise HTTPException(status_code=404, detail="Kategori bulunamadı")
    
    if "_id" in category:
        del category["_id"]
    
    # Get related tours for this category
    tours = await db.tours.find({
        "category": {"$regex": category["title"], "$options": "i"},
        "status": "active"
    }).limit(20).to_list(length=None)
    
    # Add tour dates and pricing for each tour
    for tour in tours:
        if "_id" in tour:
            del tour["_id"]
            
        tour_dates = await db.tour_dates.find({
            "tour_id": tour["id"],
            "is_active": True
        }).to_list(length=None)
        
        if tour_dates:
            prices = []
            for td in tour_dates:
                if td.get("single_cabin_price") and td["single_cabin_price"] > 0:
                    prices.append(td["single_cabin_price"])
                if td.get("person_price") and td["person_price"] > 0:
                    prices.append(td["person_price"])
                if td.get("total_reservation_price") and td["total_reservation_price"] > 0:
                    prices.append(td["total_reservation_price"])
            
            tour["minimum_price"] = min(prices) if prices else 0
        else:
            tour["minimum_price"] = tour.get("base_price", 0)
    
    # Get subcategories for this category
    subcategories = await db.sub_categories.find({
        "parent_category_id": category["id"],
        "is_active": True
    }).to_list(length=None)
    
    subcategory_list = []
    for sub in subcategories:
        if "_id" in sub:
            del sub["_id"]
        subcategory_list.append(SubCategory(**sub).dict())
    
    category_data = NewCategory(**category).dict()
    category_data["tours"] = tours
    category_data["subcategories"] = subcategory_list
    
    return category_data

@api_router.get("/categories/{category_slug}/{location_slug}")
async def get_subcategory_page(category_slug: str, location_slug: str):
    """Get subcategory (category+location) page"""
    combined_slug = f"{category_slug}/{location_slug}"
    
    # Find the subcategory
    subcategory = await db.sub_categories.find_one({
        "slug": combined_slug,
        "is_active": True
    })
    
    if not subcategory:
        raise HTTPException(status_code=404, detail="Alt kategori bulunamadı")
    
    # Get the parent category details
    parent_category = await db.new_categories.find_one({
        "id": subcategory["parent_category_id"],
        "is_active": True
    })
    
    if not parent_category:
        raise HTTPException(status_code=404, detail="Ana kategori bulunamadı")
    
    if "_id" in parent_category:
        del parent_category["_id"]
    if "_id" in subcategory:
        del subcategory["_id"]
    
    # Get related tours for this category and location
    tours = await db.tours.find({
        "category": {"$regex": parent_category["title"], "$options": "i"},
        "location": {"$regex": subcategory["location_name"], "$options": "i"},
        "status": "active"
    }).limit(20).to_list(length=None)
    
    # Add tour dates and pricing for each tour
    for tour in tours:
        if "_id" in tour:
            del tour["_id"]
            
        tour_dates = await db.tour_dates.find({
            "tour_id": tour["id"],
            "is_active": True
        }).to_list(length=None)
        
        if tour_dates:
            prices = []
            for td in tour_dates:
                if td.get("single_cabin_price") and td["single_cabin_price"] > 0:
                    prices.append(td["single_cabin_price"])
                if td.get("person_price") and td["person_price"] > 0:
                    prices.append(td["person_price"])
                if td.get("total_reservation_price") and td["total_reservation_price"] > 0:
                    prices.append(td["total_reservation_price"])
            
            tour["minimum_price"] = min(prices) if prices else 0
        else:
            tour["minimum_price"] = tour.get("base_price", 0)
    
    # Build response
    result = {
        "parent_category": NewCategory(**parent_category).dict(),
        "subcategory": SubCategory(**subcategory).dict(),
        "page_title": subcategory["title"],
        "page_description": f"{subcategory['location_name']} bölgesindeki {parent_category['title'].lower()} turları",
        "meta_title": subcategory["meta_title"] or f"{subcategory['title']} | TurPlatform",
        "meta_description": subcategory["meta_description"] or f"{subcategory['location_name']} bölgesindeki en iyi {parent_category['title'].lower()} turlarını keşfedin",
        "tours": tours
    }
    
    return result

# Admin Users Management
@api_router.get("/admin/users", response_model=List[User])
async def admin_get_users(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find().to_list(length=None)
    return [User(**user) for user in users]

@api_router.put("/admin/users/{user_id}/status")
async def admin_toggle_user_status(user_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_status = not user.get("is_active", True)
    await db.users.update_one(
        {"id": user_id}, 
        {"$set": {"is_active": new_status}}
    )
    
    return {"message": f"User {'activated' if new_status else 'deactivated'} successfully"}

# Sample data endpoint
# @api_router.post("/seed-data") # TEMPORARILY DISABLED
async def seed_sample_data():
    """Add sample data for testing"""
    
    # Sample tours
    sample_tours = [
        {
            "id": str(uuid.uuid4()),
            "vendor_id": "vendor1",
            "title": "İstanbul Tarihi Yarımada Turu",
            "description": "Sultanahmet, Topkapı Sarayı, Ayasofya ve Kapalıçarşı'yı kapsayan muhteşem bir İstanbul turu.",
            "short_description": "İstanbul'un tarihi güzelliklerini keşfedin",
            "location": "İstanbul, Türkiye",
            "duration_days": 1,
            "duration_hours": 6,
            "base_price": 299.00,
            "max_participants": 15,
            "category": "historical",
            "status": TourStatus.ACTIVE,
            "images": [
                "https://images.unsplash.com/photo-1613381234024-4e0bdcaf86ce",
                "https://images.unsplash.com/photo-1563999774341-62c6656086cb"
            ],
            "included_services": ["Profesyonel rehber", "Müze giriş ücretleri", "Öğle yemeği"],
            "excluded_services": ["Ulaşım", "Kişisel harcamalar"],
            "meeting_point": "Sultanahmet Meydanı",
            "languages": ["Türkçe", "İngilizce"],
            "difficulty_level": "Kolay",
            "tags": ["tarihi", "müze", "İstanbul", "kültür"],
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "vendor_id": "vendor1",
            "title": "Kapadokya Balon Turu",
            "description": "Kapadokya'nın eşsiz manzaralarını sıcak hava balonuyla keşfetme deneyimi.",
            "short_description": "Gökyüzünden Kapadokya manzaraları",
            "location": "Nevşehir, Kapadokya",
            "duration_days": 1,
            "duration_hours": 3,
            "base_price": 450.00,
            "max_participants": 8,
            "category": "adventure",
            "status": TourStatus.ACTIVE,
            "images": [
                "https://images.pexels.com/photos/34020240/pexels-photo-34020240.jpeg"
            ],
            "included_services": ["Balon turu", "Sertifika", "Şampanya servisi"],
            "excluded_services": ["Otel transferi", "Kahvaltı"],
            "meeting_point": "Göreme Milli Parkı",
            "languages": ["Türkçe", "İngilizce"],
            "difficulty_level": "Orta",
            "tags": ["balon", "manzara", "Kapadokya", "macera"],
            "created_at": datetime.utcnow()
        }
    ]
    
    # Insert sample data
    tour_ids = []
    for tour in sample_tours:
        existing = await db.tours.find_one({"title": tour["title"]})
        if not existing:
            await db.tours.insert_one(tour)
            tour_ids.append(tour["id"])
        else:
            tour_ids.append(existing["id"])
    
    # Create sample tour dates for each tour
    from datetime import date, timedelta
    today = date.today()
    
    for tour_id in tour_ids:
        # Create dates for the next 30 days
        for i in range(0, 30, 3):  # Every 3 days
            tour_date_id = str(uuid.uuid4())
            start_date = today + timedelta(days=i+1)
            
            tour_date = {
                "id": tour_date_id,
                "tour_id": tour_id,
                "start_date": start_date.isoformat(),
                "end_date": None,
                "start_time": "09:00",
                "available_spots": 10,
                "price": None,  # Will use tour base price
                "is_active": True,
                "created_at": datetime.utcnow()
            }
            
            # Check if tour date already exists
            existing_date = await db.tour_dates.find_one({
                "tour_id": tour_id,
                "start_date": start_date.isoformat()
            })
            if not existing_date:
                await db.tour_dates.insert_one(tour_date)
    
    # Create sample reviews
    sample_reviews = []
    if tour_ids:
        for i, tour_id in enumerate(tour_ids[:2]):  # İlk 2 tur için
            for j in range(3):  # Her tur için 3 yorum
                review_id = str(uuid.uuid4())
                user_id = f"sample_user_{i}_{j}"
                
                # Sample user oluştur
                sample_user = {
                    "id": user_id,
                    "email": f"user{i}{j}@example.com",
                    "full_name": f"Kullanıcı {i+1}{j+1}",
                    "phone": f"055123456{i}{j}",
                    "role": "customer",
                    "is_active": True,
                    "created_at": datetime.utcnow(),
                    "hashed_password": hash_password("123456")
                }
                
                # Kullanıcı yoksa ekle
                existing_user = await db.users.find_one({"email": sample_user["email"]})
                if not existing_user:
                    await db.users.insert_one(sample_user)
                
                sample_review = {
                    "id": review_id,
                    "user_id": user_id,
                    "tour_id": tour_id,
                    "booking_id": str(uuid.uuid4()),
                    "rating": 4 + (j % 2),  # 4 veya 5 yıldız
                    "title": ["Harika deneyim!", "Mükemmel tur!", "Çok keyifli"][j],
                    "comment": [
                        "Gerçekten unutulmaz bir deneyim yaşadık. Rehber çok bilgiliydi ve grup küçük olduğu için herkes rahat etti.",
                        "Organizasyon mükemmeldi. Zamanında başladık, her şey planlandığı gibi gitti. Kesinlikle tavsiye ederim.",
                        "Ailecek katıldık ve herkesten tam not aldı. Özellikle çocuklar çok eğlendi. Tekrar katılacağız."
                    ][j],
                    "images": [],
                    "is_verified": True,
                    "created_at": datetime.utcnow() - timedelta(days=(j+1)*5)
                }
                
                # Yorum yoksa ekle
                existing_review = await db.reviews.find_one({
                    "user_id": user_id,
                    "tour_id": tour_id
                })
                if not existing_review:
                    await db.reviews.insert_one(sample_review)

    # Create admin user
    admin_email = "admin@turplatform.com"
    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        admin_user = {
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "full_name": "Admin Kullanıcı",
            "phone": "05551234567",
            "role": UserRole.ADMIN,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "hashed_password": hash_password("admin123")
        }
        await db.users.insert_one(admin_user)

    # Create requested admin user for testing
    requested_admin_email = "admin@example.com"
    existing_requested_admin = await db.users.find_one({"email": requested_admin_email})
    if not existing_requested_admin:
        requested_admin_user = {
            "id": str(uuid.uuid4()),
            "email": requested_admin_email,
            "full_name": "Test Admin User",
            "phone": "05551234568",
            "role": UserRole.ADMIN,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "hashed_password": hash_password("admin123")
        }
        await db.users.insert_one(requested_admin_user)

    return {"message": "Sample data, tour dates, reviews and admin user added successfully"}

@api_router.post("/add-test-reviews")
async def add_test_reviews():
    """Add specific test reviews for tour ID 3ded39ad-36a4-47d1-87b9-7baeb5f00f55"""
    tour_id = "3ded39ad-36a4-47d1-87b9-7baeb5f00f55"
    
    # Create test users for reviews if they don't exist
    test_users = [
        {
            "id": str(uuid.uuid4()),
            "email": "ahmet.yilmaz@example.com",
            "full_name": "Ahmet Yılmaz",
            "phone": "05551111111",
            "role": UserRole.CUSTOMER,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "hashed_password": hash_password("123456")
        },
        {
            "id": str(uuid.uuid4()),
            "email": "elif.kaya@example.com", 
            "full_name": "Elif Kaya",
            "phone": "05552222222",
            "role": UserRole.CUSTOMER,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "hashed_password": hash_password("123456")
        },
        {
            "id": str(uuid.uuid4()),
            "email": "mehmet.demir@example.com",
            "full_name": "Mehmet Demir", 
            "phone": "05553333333",
            "role": UserRole.CUSTOMER,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "hashed_password": hash_password("123456")
        },
        {
            "id": str(uuid.uuid4()),
            "email": "ayse.ozkan@example.com",
            "full_name": "Ayşe Özkan",
            "phone": "05554444444", 
            "role": UserRole.CUSTOMER,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "hashed_password": hash_password("123456")
        }
    ]
    
    # Insert test users
    user_ids = []
    for user in test_users:
        existing_user = await db.users.find_one({"email": user["email"]})
        if not existing_user:
            await db.users.insert_one(user)
            user_ids.append(user["id"])
        else:
            user_ids.append(existing_user["id"])
    
    # Create 4 test reviews
    test_reviews = [
        {
            "id": str(uuid.uuid4()),
            "user_id": user_ids[0],
            "tour_id": tour_id,
            "booking_id": str(uuid.uuid4()),
            "rating": 5,
            "title": "Muhteşem bir deneyim!",
            "comment": "Gerçekten harika bir turdu. Rehberimiz çok bilgiliydi ve grup atmosferi mükemmeldi. Kesinlikle tavsiye ederim. Her şey mükemmel organizeydi, zamanında başladık ve beklediğimizden çok daha keyifli geçti.",
            "images": [],
            "is_verified": True,
            "status": "approved",
            "created_at": datetime.utcnow() - timedelta(days=5)
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": user_ids[1],
            "tour_id": tour_id,
            "booking_id": str(uuid.uuid4()),
            "rating": 4,
            "title": "Çok güzel vakit geçirdik",
            "comment": "Ailecek katıldık ve herkes çok memnun kaldı. Özellikle çocuklar çok eğlendi. Organizasyon güzeldi, sadece yemek konusunda biraz daha çeşit olabilirdi. Genel olarak çok başarılı bir tur.",
            "images": [],
            "is_verified": False,
            "status": "pending",
            "created_at": datetime.utcnow() - timedelta(days=3)
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": user_ids[2],
            "tour_id": tour_id,
            "booking_id": str(uuid.uuid4()),
            "rating": 5,
            "title": "Harika bir gün geçirdik!",
            "comment": "Profesyonel ekip, mükemmel organizasyon. Her detay düşünülmüş. Fotoğraf çekim noktaları harikaydı. Rehber çok samimi ve bilgiliydi. Para vermeye değdi kesinlikle.",
            "images": [],
            "is_verified": True,  
            "status": "approved",
            "created_at": datetime.utcnow() - timedelta(days=8)
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": user_ids[3],
            "tour_id": tour_id,
            "booking_id": str(uuid.uuid4()),
            "rating": 3,
            "title": "İdare eder",
            "comment": "Tur genel olarak iyiydi ama bazı beklentilerimiz karşılanmadı. Grup biraz kalabalıktı ve rehber zaman zaman yetersiz kalıyordu. Manzaralar güzeldi tabii ki ama organizasyon daha iyi olabilirdi.",
            "images": [],
            "is_verified": False,
            "status": "pending", 
            "created_at": datetime.utcnow() - timedelta(days=1)
        }
    ]
    
    # Insert test reviews
    inserted_count = 0
    for review in test_reviews:
        existing_review = await db.reviews.find_one({
            "user_id": review["user_id"],
            "tour_id": tour_id
        })
        if not existing_review:
            await db.reviews.insert_one(review)
            inserted_count += 1
    
    return {"message": f"Test reviews added successfully. Inserted {inserted_count} new reviews for tour {tour_id}"}

@api_router.delete("/remove-test-reviews/{tour_id}")
async def remove_test_reviews(tour_id: str):
    """Remove all reviews for a specific tour"""
    try:
        # Delete all reviews for this tour
        result = await db.reviews.delete_many({"tour_id": tour_id})
        deleted_count = result.deleted_count
        
        return {"message": f"Successfully removed {deleted_count} reviews for tour {tour_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error removing reviews: {str(e)}")

@api_router.post("/add-simple-tour")
async def add_simple_tour():
    """Add a simple test tour"""
    
    tour = {
        "id": str(uuid.uuid4()),
        "vendor_id": "vendor1",
        "title": "Test Kabin Turu",
        "description": "Test tour description",
        "short_description": "Test açıklama",
        "location": "Test Location",
        "duration_days": 3,
        "classification": "standart",
        "category": "Doğa",
        "status": TourStatus.ACTIVE,
        "images": ["https://images.unsplash.com/photo-1529528018027-2ee0409703af"],
        "minimum_price": 10000,
        "rating": 4.5,
        "review_count": 5,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.tours.insert_one(tour)
    return {"message": "Simple tour added", "id": tour["id"]}

@api_router.post("/add-10-tours")
async def add_10_tours():
    """Add 10 sample tours with cabin pricing"""
    
    sample_tours = [
        {
            "id": str(uuid.uuid4()),
            "vendor_id": "vendor1",
            "title": "Göcek - Fethiye 4 Gece 5 Gün Kabin Turu",
            "description": "Türkiye'nin en güzel koylarında unutulmaz mavi yolculuk deneyimi. Göcek'ten başlayarak Fethiye körfezinin saklı koylarını keşfedin.",
            "short_description": "Göcek ve Fethiye'nin saklı koylarında mavi yolculuk",
            "location": "Muğla, Göcek",
            "duration_days": 5,
            "classification": "lux",
            "category": "Doğa",
            "status": TourStatus.ACTIVE,
            "images": ["https://blog.yachtdunyasi.com/wp-content/uploads/2022/10/marmaris-en-guzel-koylari-400x400.webp"],
            "minimum_price": 15000,
            "rating": 4.8,
            "review_count": 12,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "vendor_id": "vendor1", 
            "title": "Marmaris - Datça 3 Gece 4 Gün Kabin Turu",
            "description": "Marmaris'ten başlayarak Datça yarımadasının kristal berraklığındaki sularında kabin turu deneyimi.",
            "short_description": "Marmaris ve Datça'nın berrak sularında kabin keyfi",
            "location": "Muğla, Marmaris",
            "duration_days": 4,
            "classification": "standart",
            "category": "Doğa", 
            "status": TourStatus.ACTIVE,
            "images": ["https://images.unsplash.com/photo-1529528018027-2ee0409703af"],
            "minimum_price": 12000,
            "rating": 4.5,
            "review_count": 8,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "vendor_id": "vendor2",
            "title": "Bodrum - Gökova 6 Gece 7 Gün Kabin Turu", 
            "description": "Bodrum'dan başlayarak Gökova körfezinin eşsiz güzelliklerini kabin kiralama ile keşfedin.",
            "short_description": "Bodrum ve Gökova körfezinde lüks kabin deneyimi",
            "location": "Muğla, Bodrum",
            "duration_days": 7,
            "classification": "delux",
            "category": "Doğa",
            "status": TourStatus.ACTIVE,
            "images": ["https://images.unsplash.com/photo-1727715220090-8e05aaa5b4fa"],
            "minimum_price": 22000,
            "rating": 4.9,
            "review_count": 15,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "vendor_id": "vendor2",
            "title": "Kaş - Kekova 2 Gece 3 Gün Kabin Turu",
            "description": "Kaş'tan başlayarak Kekova'nın suya batmış şehir kalıntılarını kabin turu ile keşfedin.",
            "short_description": "Kaş ve Kekova'da tarihi kabin yolculuğu",
            "location": "Antalya, Kaş", 
            "duration_days": 3,
            "classification": "standart",
            "category": "Tarihi",
            "status": TourStatus.ACTIVE,
            "images": ["https://images.pexels.com/photos/10659549/pexels-photo-10659549.jpeg"],
            "minimum_price": 9500,
            "rating": 4.3,
            "review_count": 6,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "vendor_id": "vendor3",
            "title": "Antalya - Kemer 3 Gece 4 Gün Kabin Turu",
            "description": "Antalya'dan Kemer'e uzanan sahillerde kabin kiralama ile Akdeniz'in tadını çıkarın.",
            "short_description": "Antalya - Kemer sahillerinde kabin macerası",
            "location": "Antalya, Kemer",
            "duration_days": 4,
            "classification": "lux",
            "category": "Macera",
            "status": TourStatus.ACTIVE,
            "images": ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4"],
            "minimum_price": 14000,
            "rating": 4.6,
            "review_count": 9,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "vendor_id": "vendor3",
            "title": "Çeşme - Alaçatı 2 Gece 3 Gün Kabin Turu",
            "description": "Çeşme'den Alaçatı'ya kadar Ege'nin rüzgarlı sularında kabin turu deneyimi.",
            "short_description": "Çeşme ve Alaçatı'da rüzgarlı kabin turu",
            "location": "İzmir, Çeşme",
            "duration_days": 3,
            "classification": "standart", 
            "category": "Kültürel",
            "status": TourStatus.ACTIVE,
            "images": ["https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg"],
            "minimum_price": 8500,
            "rating": 4.2,
            "review_count": 4,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "vendor_id": "vendor4",
            "title": "Kuşadası - Samos 4 Gece 5 Gün Kabin Turu",
            "description": "Kuşadası'ndan Yunan adası Samos'a uzanan uluslararası kabin turu macerası.",
            "short_description": "Kuşadası - Samos arası uluslararası kabin yolculuğu", 
            "location": "Aydın, Kuşadası",
            "duration_days": 5,
            "classification": "delux",
            "category": "Kültürel",
            "status": TourStatus.ACTIVE,
            "images": ["https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff"],
            "minimum_price": 18500,
            "rating": 4.7,
            "review_count": 11,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "vendor_id": "vendor4",
            "title": "Kalkan - Patara 1 Gece 2 Gün Kabin Turu",
            "description": "Kalkan'dan Patara'ya kısa ve keyifli kabin turu. Antik kent kalıntıları ve plaj keyfi.",
            "short_description": "Kalkan - Patara'da kısa kabin getaway",
            "location": "Antalya, Kalkan",
            "duration_days": 2,
            "classification": "standart",
            "category": "Tarihi",
            "status": TourStatus.ACTIVE, 
            "images": ["https://images.pexels.com/photos/2034335/pexels-photo-2034335.jpeg"],
            "minimum_price": 6500,
            "rating": 4.1,
            "review_count": 3,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "vendor_id": "vendor5",
            "title": "Ayvalık - Cunda 3 Gece 4 Gün Kabin Turu", 
            "description": "Ayvalık'tan Cunda adasına uzanan nostaljik kabin turu. Ege'nin sakin sularında huzur.",
            "short_description": "Ayvalık ve Cunda'da nostaljik kabin deneyimi",
            "location": "Balıkesir, Ayvalık",
            "duration_days": 4,
            "classification": "lux",
            "category": "Kültürel", 
            "status": TourStatus.ACTIVE,
            "images": ["https://images.pexels.com/photos/1371360/pexels-photo-1371360.jpeg"],
            "minimum_price": 13500,
            "rating": 4.4,
            "review_count": 7,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "vendor_id": "vendor5",
            "title": "Sinop - Amasra 5 Gece 6 Gün Kabin Turu",
            "description": "Karadeniz'in en güzel kıyılarında Sinop'tan Amasra'ya kabin turu. Yeşil ve mavi buluşması.",
            "short_description": "Karadeniz'de Sinop - Amasra kabin macerası",
            "location": "Sinop, Merkez",
            "duration_days": 6,
            "classification": "standart",
            "category": "Doğa",
            "status": TourStatus.ACTIVE,
            "images": ["https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg"],
            "minimum_price": 16000,
            "rating": 4.0,
            "review_count": 2,
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    # Insert tours
    inserted_tours = []
    for tour in sample_tours:
        await db.tours.insert_one(tour)
        inserted_tours.append(tour)
        
        # Add cabin pricing dates for each tour
        tour_dates = [
                {
                    "id": str(uuid.uuid4()),
                    "tour_id": tour["id"],
                    "start_date": "2025-01-15",
                    "available_cabins": 8,
                    "single_cabin_price": tour["minimum_price"],
                    "double_cabin_price": int(tour["minimum_price"] * 1.5),
                    "is_active": True,
                    "created_at": datetime.now(timezone.utc)
                },
                {
                    "id": str(uuid.uuid4()),
                    "tour_id": tour["id"],
                    "start_date": "2025-01-20", 
                    "available_cabins": 6,
                    "single_cabin_price": tour["minimum_price"],
                    "double_cabin_price": int(tour["minimum_price"] * 1.5),
                    "is_active": True,
                    "created_at": datetime.now(timezone.utc)
                },
                {
                    "id": str(uuid.uuid4()),
                    "tour_id": tour["id"],
                    "start_date": "2025-02-01",
                    "available_cabins": 10,
                    "single_cabin_price": int(tour["minimum_price"] * 0.9),
                    "double_cabin_price": int(tour["minimum_price"] * 1.3),
                    "is_active": True,
                    "created_at": datetime.now(timezone.utc)
                }
        ]
        
        for date in tour_dates:
            await db.tour_dates.insert_one(date)
    
    return {"message": f"Added {len(inserted_tours)} new tours with cabin pricing successfully"}

@api_router.post("/create-sample-bookings")
async def create_sample_bookings():
    """Create 2 sample bookings for test user"""
    
    # Get test user (user@example.com)
    test_user = await db.users.find_one({"email": "user@example.com"})
    if not test_user:
        raise HTTPException(status_code=404, detail="Test user not found")
    
    # Get first 2 tours
    tours = await db.tours.find().limit(2).to_list(2)
    if len(tours) < 2:
        raise HTTPException(status_code=404, detail="Not enough tours available")
    
    bookings = []
    
    # Booking 1 - Completed
    booking1 = {
        "id": str(uuid.uuid4()),
        "user_id": test_user["id"],
        "tour_id": tours[0]["id"],
        "tour_title": tours[0]["title"],
        "tour_location": tours[0]["location"],
        "selected_date": "2025-01-15",
        "cabin_type": "single",
        "participants": 2,
        "total_price": 24000.0,
        "status": "confirmed",
        "payment_status": "paid",
        "customer_info": {
            "full_name": "Test User",
            "email": "user@example.com", 
            "phone": "+90 555 123 4567",
            "emergency_contact": "+90 555 987 6543"
        },
        "special_requests": "Vejetaryen yemek tercihi",
        "created_at": datetime.now(timezone.utc) - timedelta(days=5),
        "updated_at": datetime.now(timezone.utc) - timedelta(days=3)
    }
    
    # Booking 2 - Active
    booking2 = {
        "id": str(uuid.uuid4()),
        "user_id": test_user["id"],
        "tour_id": tours[1]["id"], 
        "tour_title": tours[1]["title"],
        "tour_location": tours[1]["location"],
        "selected_date": "2025-02-01",
        "cabin_type": "double",
        "participants": 2,
        "total_price": 18000.0,
        "status": "confirmed",
        "payment_status": "paid",
        "customer_info": {
            "full_name": "Test User",
            "email": "user@example.com",
            "phone": "+90 555 123 4567", 
            "emergency_contact": "+90 555 987 6543"
        },
        "special_requests": "Balayı turumuz, özel organizasyon istiyoruz",
        "created_at": datetime.now(timezone.utc) - timedelta(days=2),
        "updated_at": datetime.now(timezone.utc) - timedelta(days=1)
    }
    
    # Insert bookings
    await db.bookings.insert_one(booking1)
    await db.bookings.insert_one(booking2)
    bookings.extend([booking1, booking2])
    
    return {"message": f"Created {len(bookings)} sample bookings successfully", "bookings": [{"id": b["id"], "tour_title": b["tour_title"], "status": b["status"]} for b in bookings]}

# Admin Bookings Management
@api_router.get("/admin/bookings")
async def admin_get_bookings(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    bookings = await db.bookings.find().sort("created_at", -1).to_list(length=None)
    
    # Handle legacy bookings that may be missing required fields
    valid_bookings = []
    for booking in bookings:
        # Remove MongoDB _id to avoid serialization issues
        if "_id" in booking:
            del booking["_id"]
        
        # Fix legacy payment_status values
        if booking.get("payment_status") == "paid":
            booking["payment_status"] = "success"
        
        # Add missing required fields with defaults
        if "booking_status" not in booking or not booking["booking_status"]:
            booking["booking_status"] = "completed" if booking.get("payment_status") == "success" else "draft"
        
        # Add missing booking_code
        if "booking_code" not in booking or not booking["booking_code"]:
            booking["booking_code"] = str(uuid.uuid4())[:8].upper()
        
        # Add missing tour_date_id for legacy bookings
        if "tour_date_id" not in booking:
            booking["tour_date_id"] = "legacy-booking"
        
        try:
            # Validate the booking can be serialized
            valid_bookings.append(booking)
        except Exception as e:
            # Skip invalid bookings but log the error
            print(f"Skipping invalid booking {booking.get('id', 'unknown')}: {e}")
            continue
    
    return valid_bookings

@api_router.put("/admin/bookings/{booking_id}/status")
async def admin_update_booking_status(
    booking_id: str, 
    status_data: dict,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    new_status = status_data.get("status")
    valid_statuses = ["draft", "pending", "confirmed", "paid", "completed", "cancelled"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Valid statuses: {valid_statuses}")
    
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"booking_status": new_status, "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": "Booking status updated successfully"}

# Profile Management
@api_router.put("/profile")
async def update_profile(
    profile_data: dict,
    current_user: User = Depends(get_current_user)
):
    # Update user profile
    update_data = {
        "full_name": profile_data.get("full_name", current_user.full_name),
        "phone": profile_data.get("phone", current_user.phone),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": update_data}
    )
    
    # Return updated user without password hash
    updated_user = await db.users.find_one({"id": current_user.id})
    if updated_user:
        # Remove hashed_password from response
        updated_user.pop('hashed_password', None)
        return User(**updated_user)
    
    raise HTTPException(status_code=404, detail="User not found")

@api_router.put("/change-password")
async def change_password(
    password_data: dict,
    current_user: User = Depends(get_current_user)
):
    current_password = password_data.get("current_password")
    new_password = password_data.get("new_password")
    
    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="Current and new passwords required")
    
    # Get user with password hash from database
    user_doc = await db.users.find_one({"id": current_user.id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not verify_password(current_password, user_doc["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Hash new password
    new_password_hash = hash_password(new_password)
    
    # Update password
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {
            "hashed_password": new_password_hash,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    return {"message": "Password updated successfully"}

@api_router.post("/add-test-cabin-pricing/{tour_id}")
async def add_test_cabin_pricing(tour_id: str):
    """Add test cabin pricing for a tour (NEW CABIN SYSTEM)"""
    
    # Delete existing tour dates for this tour
    await db.tour_dates.delete_many({"tour_id": tour_id})
    
    # Test data with new cabin system
    test_dates = [
        {
            "tour_id": tour_id,
            "start_date": "2025-01-15",
            "available_cabins": 8,
            "single_cabin_price": 12000.0,
            "double_cabin_price": 18000.0,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "tour_id": tour_id,
            "start_date": "2025-01-20", 
            "available_cabins": 10,
            "single_cabin_price": 15000.0,
            "double_cabin_price": 25000.0,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "tour_id": tour_id,
            "start_date": "2025-02-10",
            "available_cabins": 12,
            "single_cabin_price": 18000.0,
            "double_cabin_price": 32000.0,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    for date in test_dates:
        date["id"] = str(uuid.uuid4())
        print(f"Inserting NEW CABIN DATE: {date['start_date']} - Single Cabin: ₺{date['single_cabin_price']} - Double Cabin: ₺{date['double_cabin_price']}")
        await db.tour_dates.insert_one(date)
    
    return {"message": f"NEW CABIN SYSTEM: Test cabin pricing added for tour {tour_id}. Added {len(test_dates)} dates with cabin pricing."}

@api_router.post("/reset-database")
async def reset_database():
    """Reset tour_dates collection for new cabin system"""
    try:
        # Clear all tour dates
        result = await db.tour_dates.delete_many({})
        return {"message": f"Database reset complete. Deleted {result.deleted_count} tour dates."}
    except Exception as e:
        return {"error": str(e)}

@api_router.post("/update-tour-duration/{tour_id}")
async def update_tour_duration(tour_id: str, duration: int = 4, duration_unit: str = "days"):
    """Update tour duration for testing"""
    
    await db.tours.update_one(
        {"id": tour_id},
        {"$set": {
            "duration": duration,
            "duration_unit": duration_unit
        }}
    )
    
    return {"message": f"Tour {tour_id} duration updated to {duration} {duration_unit}"}

@api_router.post("/make-tour-cabin-type/{tour_id}")
async def make_tour_cabin_type(tour_id: str):
    """Convert tour back to cabin type"""
    
    # Update tour to cabin type (remove reservation_type or set to null)
    await db.tours.update_one(
        {"id": tour_id},
        {"$unset": {"reservation_type": ""}, 
         "$set": {"title": "Fethiye – Göcek 3 Gece 4 Gün Kabin Turu"}}
    )
    
    # Update tour dates back to cabin pricing
    await db.tour_dates.update_many(
        {"tour_id": tour_id},
        {"$unset": {"total_reservation_price": ""},
         "$set": {
            "single_cabin_price": 25000.0,
            "double_cabin_price": 30000.0
         }}
    )
    
    return {"message": f"Tour {tour_id} converted back to cabin type successfully"}

@api_router.post("/make-tour-reservation-type/{tour_id}")
async def make_tour_reservation_type(tour_id: str):
    """Convert existing tour to reservation type"""
    
    # Update tour to reservation type  
    await db.tours.update_one(
        {"id": tour_id},
        {"$set": {
            "reservation_type": "reservation",
            "title": "Özel Tekne Rezervasyonu - Fethiye Göcek"
        }}
    )
    
    # Update tour dates to have reservation pricing
    await db.tour_dates.update_many(
        {"tour_id": tour_id},
        {"$set": {
            "total_reservation_price": 8000.0,
            "max_persons": 12
        }}
    )
    
    return {
        "message": f"Tour {tour_id} converted to reservation type successfully",
        "test_url": f"https://travel-portal-6.preview.emergentagent.com/turlar/{tour_id}"
    }

@api_router.post("/create-reservation-tour")
async def create_reservation_tour():
    """Create a test reservation type tour"""
    
    # Create reservation type tour
    reservation_tour = {
        "id": str(uuid.uuid4()),
        "vendor_id": "test-vendor",
        "title": "Özel Tekne Rezervasyonu - Tüm Gün",
        "description": "Tüm tekneyi kendinize ayırın, arkadaşlarınız ve ailenizle unutulmaz bir gün geçirin.",
        "location": "Fethiye",
        "category": "Tekne Turu",
        "duration": 8,
        "duration_unit": "hours",
        "reservation_type": "reservation",
        "includes": ["Özel tekne", "Kaptan hizmeti", "Yakıt", "Öğle yemeği"],
        "excludes": ["Kişisel harcamalar", "İçecekler"],
        "important_notes": ["Minimum 4 kişi", "Maksimum 12 kişi"],
        "cancellation_policy": "48 saat öncesine kadar iptal edilebilir",
        "images": ["https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800"],
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Insert tour
    result = await db.tours.insert_one(reservation_tour)
    tour_id = reservation_tour["id"]
    
    # Create tour dates with reservation pricing
    tour_dates = []
    for i in range(5):
        date_obj = datetime.now(timezone.utc) + timedelta(days=i+1)
        tour_date = {
            "id": str(uuid.uuid4()),
            "tour_id": tour_id,
            "start_date": date_obj.date().isoformat(),
            "start_time": "09:00:00",
            "end_time": "17:00:00",
            "total_reservation_price": 8000.0,
            "max_persons": 12,
            "is_available": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        tour_dates.append(tour_date)
    
    # Insert tour dates
    if tour_dates:
        await db.tour_dates.insert_many(tour_dates)
    
    return {
        "message": "Reservation tour created successfully", 
        "tour_id": tour_id,
        "tour_title": reservation_tour["title"],
        "slug": "ozel-tekne-rezervasyonu-tum-gun"
    }

@api_router.post("/create-admin-user")
async def create_admin_user():
    """Create admin user for testing purposes"""
    
    # Delete existing admin if any (force recreate)
    await db.users.delete_many({"email": "admin@example.com"})
    
    # Create admin user with proper hashed password
    admin_user = {
        "id": str(uuid.uuid4()),
        "email": "admin@example.com",
        "hashed_password": hash_password("admin123"),  # Properly hashed password
        "full_name": "Test Admin User",
        "phone": "05551234568",
        "role": "admin",
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "profile_image": None
    }
    
    await db.users.insert_one(admin_user)
    
    return {"message": "Admin user created successfully", "email": "admin@example.com", "password": "admin123"}

# Reviews Management
class ReviewCreate(BaseModel):
    tour_id: str
    rating: int = Field(ge=1, le=5)
    title: Optional[str] = None
    comment: Optional[str] = None
    images: List[str] = []

class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    title: Optional[str] = None
    comment: Optional[str] = None
    is_verified: Optional[bool] = None

class ReviewStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class ReviewWithDetails(BaseModel):
    id: str
    user_id: str
    tour_id: str
    booking_id: Optional[str] = None
    rating: int
    title: Optional[str] = None
    comment: Optional[str] = None
    images: List[str] = []
    is_verified: bool
    status: str = "pending"
    created_at: datetime
    
    # Additional details
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    tour_title: Optional[str] = None

# Review endpoints
@api_router.get("/reviews")
async def get_reviews(
    tour_id: Optional[str] = Query(None),
    verified_only: bool = Query(True),
    limit: int = Query(10, ge=1, le=100)
):
    """Get public reviews for a tour"""
    query = {}
    if tour_id:
        query["tour_id"] = tour_id
    if verified_only:
        query["is_verified"] = True
    
    reviews = await db.reviews.find(query).sort("created_at", -1).limit(limit).to_list(length=None)
    
    # Add user names to reviews
    enriched_reviews = []
    for review in reviews:
        user = await db.users.find_one({"id": review["user_id"]})
        review_data = Review(**review)
        review_dict = review_data.dict()
        review_dict["user_name"] = user.get("full_name", "Anonim") if user else "Anonim"
        enriched_reviews.append(review_dict)
    
    return enriched_reviews

@api_router.post("/reviews", response_model=Review)
async def create_review(review_data: ReviewCreate, current_user: User = Depends(get_current_user)):
    """Create a new review"""
    # Check if tour exists
    tour = await db.tours.find_one({"id": review_data.tour_id})
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    
    # Check if user has already reviewed this tour
    existing_review = await db.reviews.find_one({
        "user_id": current_user.id,
        "tour_id": review_data.tour_id
    })
    if existing_review:
        raise HTTPException(status_code=400, detail="You have already reviewed this tour")
    
    review = Review(
        user_id=current_user.id,
        tour_id=review_data.tour_id,
        booking_id="",  # Will be set if from booking
        rating=review_data.rating,
        title=review_data.title,
        comment=review_data.comment,
        images=review_data.images,
        is_verified=False  # Admin needs to verify
    )
    
    review_dict = review.dict()
    review_dict["status"] = "pending"
    await db.reviews.insert_one(review_dict)
    
    return review

# Admin Review Management
@api_router.get("/admin/reviews")
async def admin_get_all_reviews(
    current_user: User = Depends(get_current_user),
    status: Optional[str] = Query(None),
    tour_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200)
):
    """Get all reviews for admin management"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if status:
        if status == "pending":
            query["is_verified"] = False
            query["status"] = {"$ne": "rejected"}
        elif status == "approved":
            query["is_verified"] = True
        elif status == "rejected":
            query["status"] = "rejected"
    
    if tour_id:
        query["tour_id"] = tour_id
    
    reviews = await db.reviews.find(query).sort("created_at", -1).limit(limit).to_list(length=None)
    
    # Enrich with user and tour details
    enriched_reviews = []
    for review in reviews:
        user = await db.users.find_one({"id": review["user_id"]})
        tour = await db.tours.find_one({"id": review["tour_id"]})
        
        review_with_details = ReviewWithDetails(
            **review,
            user_name=user.get("full_name", "Unknown") if user else "Unknown",
            user_email=user.get("email", "") if user else "",
            tour_title=tour.get("title", "Unknown Tour") if tour else "Unknown Tour"
        )
        enriched_reviews.append(review_with_details)
    
    return enriched_reviews

@api_router.put("/admin/reviews/{review_id}")
async def admin_update_review(
    review_id: str, 
    review_data: ReviewUpdate, 
    current_user: User = Depends(get_current_user)
):
    """Update review details (admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    review = await db.reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    update_data = {}
    if review_data.rating is not None:
        update_data["rating"] = review_data.rating
    if review_data.title is not None:
        update_data["title"] = review_data.title
    if review_data.comment is not None:
        update_data["comment"] = review_data.comment
    if review_data.is_verified is not None:
        update_data["is_verified"] = review_data.is_verified
        update_data["status"] = "approved" if review_data.is_verified else "pending"
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
        await db.reviews.update_one({"id": review_id}, {"$set": update_data})
    
    return {"message": "Review updated successfully"}

@api_router.put("/admin/reviews/{review_id}/approve")
async def admin_approve_review(review_id: str, current_user: User = Depends(get_current_user)):
    """Approve a review"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    review = await db.reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    await db.reviews.update_one(
        {"id": review_id}, 
        {"$set": {
            "is_verified": True,
            "status": "approved",
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    return {"message": "Review approved successfully"}

@api_router.put("/admin/reviews/{review_id}/reject")
async def admin_reject_review(review_id: str, current_user: User = Depends(get_current_user)):
    """Reject a review"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    review = await db.reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    await db.reviews.update_one(
        {"id": review_id}, 
        {"$set": {
            "is_verified": False,
            "status": "rejected",
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    return {"message": "Review rejected successfully"}

@api_router.delete("/admin/reviews/{review_id}")
async def admin_delete_review(review_id: str, current_user: User = Depends(get_current_user)):
    """Delete a review permanently"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    review = await db.reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    await db.reviews.delete_one({"id": review_id})
    return {"message": "Review deleted successfully"}

@api_router.post("/cleanup-data")
async def cleanup_data(current_user: User = Depends(get_current_user)):
    """Clean all tours, bookings, and tour_dates for fresh start"""
    try:
        # Delete all tours, bookings, tour_dates
        await db.tours.delete_many({})
        await db.bookings.delete_many({})
        await db.tour_dates.delete_many({})
        await db.reviews.delete_many({})
        
        return {"message": "All tours, bookings, tour_dates and reviews cleaned successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")

# Search functionality
class SearchSuggestionRequest(BaseModel):
    query: str = Field(min_length=1, max_length=100)
    type: Optional[str] = Field(default="location")  # location, category, general

class SearchSuggestion(BaseModel):
    id: str
    name: str
    type: str
    region: Optional[str] = None
    tours: Optional[int] = None
    trending: Optional[bool] = False

class GeocodeRequest(BaseModel):
    latitude: float
    longitude: float

@api_router.get("/search/suggestions")
async def get_search_suggestions(
    q: str = Query(..., min_length=1, max_length=100),
    type: str = Query(default="location")
):
    """Get search suggestions based on query and type"""
    suggestions = []
    
    if type == "location" or type == "general":
        # Search in tours for locations
        tours = await db.tours.find({
            "location": {"$regex": q, "$options": "i"}
        }).limit(10).to_list(length=None)
        
        # Group by location and count tours
        location_counts = {}
        for tour in tours:
            location = tour.get("location", "")
            if location:
                if location not in location_counts:
                    location_counts[location] = 0
                location_counts[location] += 1
        
        # Create location suggestions
        for location, count in location_counts.items():
            suggestions.append({
                "id": f"location-{hash(location)}",
                "name": location,
                "type": "location",
                "tours": count,
                "trending": count > 5
            })
    
    if type == "category" or type == "general":
        # Search in tours for categories
        tours = await db.tours.find({
            "category": {"$regex": q, "$options": "i"}
        }).limit(10).to_list(length=None)
        
        # Group by category and count tours
        category_counts = {}
        for tour in tours:
            category = tour.get("category", "")
            if category:
                if category not in category_counts:
                    category_counts[category] = 0
                category_counts[category] += 1
        
        # Create category suggestions
        for category, count in category_counts.items():
            suggestions.append({
                "id": f"category-{hash(category)}",
                "name": category,
                "type": "category",
                "tours": count
            })
    
    if type == "tour" or type == "general":
        # Search in tour titles
        tours = await db.tours.find({
            "$or": [
                {"title": {"$regex": q, "$options": "i"}},
                {"short_description": {"$regex": q, "$options": "i"}}
            ]
        }).limit(5).to_list(length=None)
        
        for tour in tours:
            price = None
            # Get minimum price from tour dates
            tour_dates = await db.tour_dates.find({"tour_id": tour["id"]}).to_list(length=None)
            if tour_dates:
                prices = []
                for date in tour_dates:
                    if date.get("single_cabin_price"):
                        prices.append(date["single_cabin_price"])
                    if date.get("double_cabin_price"):
                        prices.append(date["double_cabin_price"])
                if prices:
                    price = min(prices)
            
            suggestions.append({
                "id": tour["id"],
                "name": tour["title"],
                "type": "tour",
                "location": tour.get("location"),
                "category": tour.get("category"),
                "rating": tour.get("rating"),
                "price": price
            })
    
    # Sort suggestions by relevance (exact matches first)
    query_lower = q.lower()
    suggestions.sort(key=lambda x: (
        not x["name"].lower().startswith(query_lower),  # Exact matches first
        x["name"].lower()
    ))
    
    return {
        "suggestions": suggestions[:10],
        "total": len(suggestions),
        "query": q
    }

@api_router.post("/geocoding/reverse")
async def reverse_geocode(request: GeocodeRequest):
    """Mock reverse geocoding - in production use Google Maps API"""
    # Mock locations based on Turkey's popular coastal areas
    mock_locations = [
        {"lat_range": (36.6, 36.7), "lng_range": (29.0, 29.3), "location": "Muğla, Fethiye"},
        {"lat_range": (36.7, 36.8), "lng_range": (28.9, 29.0), "location": "Muğla, Göcek"},
        {"lat_range": (36.1, 36.3), "lng_range": (29.6, 29.7), "location": "Antalya, Kaş"},
        {"lat_range": (38.3, 38.4), "lng_range": (26.2, 26.4), "location": "İzmir, Çeşme"},
        {"lat_range": (37.0, 37.1), "lng_range": (27.3, 27.5), "location": "Muğla, Bodrum"},
    ]
    
    # Find closest location
    for loc in mock_locations:
        if (loc["lat_range"][0] <= request.latitude <= loc["lat_range"][1] and 
            loc["lng_range"][0] <= request.longitude <= loc["lng_range"][1]):
            return {
                "location": loc["location"],
                "coordinates": {
                    "latitude": request.latitude,
                    "longitude": request.longitude
                },
                "accuracy": "approximate"
            }
    
    # Default fallback
    return {
        "location": "Türkiye, Akdeniz Bölgesi",
        "coordinates": {
            "latitude": request.latitude,
            "longitude": request.longitude
        },
        "accuracy": "country"
    }

@api_router.get("/search/locations")
async def get_available_locations():
    """Get all unique locations from tours"""
    tours = await db.tours.find({}, {"location": 1}).to_list(length=None)
    
    # Count tours per location
    location_counts = {}
    for tour in tours:
        location = tour.get("location")
        if location:
            location_counts[location] = location_counts.get(location, 0) + 1
    
    # Format for frontend
    locations = []
    for location, count in location_counts.items():
        locations.append({
            "id": f"loc-{hash(location)}",
            "name": location,
            "tours": count,
            "popular": count > 5
        })
    
    # Sort by tour count (most popular first)
    locations.sort(key=lambda x: x["tours"], reverse=True)
    
    return {"locations": locations}

@api_router.get("/categories/{category}")
async def get_category_by_slug(category: str):
    """Get category data by slug for public access"""
    
    # Map URL slug to category name
    category_mapping = {
        'mavi-yolculuk': 'Mavi yolculuk',
        'gunubirlik-tekne': 'Günübirlik Tekne Turları',
        'kabin-turlari': 'Kabin Turları',
        'balik-dalis': 'Balık & Dalış',
        'yuzme-turlari': 'Yüzme Turları'
    }
    
    category_name = category_mapping.get(category, category)
    
    # Try to find category in categories collection
    category_doc = await db.categories.find_one({"name": category_name})
    
    if not category_doc:
        # Return default category data if not found
        return {
            "id": category,
            "name": category_name,
            "title": category_name,
            "description": f"{category_name} kategorisindeki turları keşfedin",
            "seo_title": None,
            "seo_description": None,
            "seo_keywords": None,
            "faq": [],
            "is_active": True
        }
    
    return category_doc

@api_router.get("/search/categories")
async def get_available_categories():
    """Get all unique categories from tours with icons"""
    tours = await db.tours.find({}, {"category": 1}).to_list(length=None)
    
    # Count tours per category
    category_counts = {}
    for tour in tours:
        category = tour.get("category")
        if category:
            category_counts[category] = category_counts.get(category, 0) + 1
    
    # Category to icon mapping
    category_icons = {
        "kültürel": {"icon": "Camera", "color": "purple"},
        "cultural": {"icon": "Camera", "color": "purple"},
        "doğa": {"icon": "TreePine", "color": "green"},
        "nature": {"icon": "TreePine", "color": "green"},
        "macera": {"icon": "Mountain", "color": "orange"},
        "adventure": {"icon": "Mountain", "color": "orange"},
        "şehir": {"icon": "Building", "color": "blue"},
        "city": {"icon": "Building", "color": "blue"},
        "tarihi": {"icon": "Castle", "color": "amber"},
        "historical": {"icon": "Castle", "color": "amber"},
        "gastronomi": {"icon": "Utensils", "color": "red"},
        "food": {"icon": "Utensils", "color": "red"},
        "deniz": {"icon": "Waves", "color": "cyan"},
        "sea": {"icon": "Waves", "color": "cyan"},
        "tekne": {"icon": "Waves", "color": "blue"},
        "boat": {"icon": "Waves", "color": "blue"},
        "keşif": {"icon": "Compass", "color": "indigo"},
        "exploration": {"icon": "Compass", "color": "indigo"},
        "dalış": {"icon": "Fish", "color": "teal"},
        "diving": {"icon": "Fish", "color": "teal"}
    }
    
    # Format for frontend
    categories = []
    for category, count in category_counts.items():
        category_lower = category.lower()
        icon_info = category_icons.get(category_lower, {"icon": "MapPin", "color": "gray"})
        
        categories.append({
            "id": f"cat-{hash(category)}",
            "name": category,
            "tours": count,
            "icon": icon_info["icon"],
            "color": icon_info["color"],
            "popular": count > 5
        })
    
    # Sort by tour count (most popular first)
    categories.sort(key=lambda x: x["tours"], reverse=True)
    
    return {"categories": categories}

@api_router.get("/search/popular")
async def get_popular_searches():
    """Get popular and trending searches"""
    # In production, this would come from analytics data
    return {
        "popular": [
            {"query": "fethiye tekne turu", "count": 1250},
            {"query": "bodrum koy turu", "count": 890},
            {"query": "kaş dalış", "count": 567},
            {"query": "çeşme gastronomi", "count": 445}
        ],
        "trending": [
            {"query": "göcek mavi tur", "growth": 85},
            {"query": "ayvalık kamp", "growth": 72},
            {"query": "bozcaada şarap", "growth": 68}
        ]
    }

# Health check endpoint for deployment monitoring
@api_router.get("/health")
async def health_check():
    """Health check endpoint for deployment monitoring"""
    try:
        # Test database connectivity
        await db.list_collection_names()
        return {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "database": "connected",
            "uploads_dir": "ready"
        }
    except Exception as e:
        raise HTTPException(
            status_code=503, 
            detail=f"Service unavailable: {str(e)}"
        )

# Sample bookings endpoint for testing
@api_router.post("/add-sample-bookings")
async def add_sample_bookings():
    """Add sample bookings for admin@example.com for testing"""
    
    # Find admin user
    admin_user = await db.users.find_one({"email": "admin@example.com"})
    if not admin_user:
        raise HTTPException(status_code=404, detail="Admin user not found")
    
    # Get tours for booking
    tours = await db.tours.find({}).limit(2).to_list(length=None)
    if not tours:
        raise HTTPException(status_code=404, detail="No tours found")
    
    # Get tour dates
    tour_dates = await db.tour_dates.find({}).limit(3).to_list(length=None)
    if not tour_dates:
        raise HTTPException(status_code=404, detail="No tour dates found")
    
    # Create sample bookings
    sample_bookings = []
    
    # Active booking 1
    booking1 = {
        "id": str(uuid.uuid4()),
        "user_id": admin_user["id"],
        "tour_id": tours[0]["id"],
        "tour_date_id": tour_dates[0]["id"] if tour_dates else str(uuid.uuid4()),
        "participants": 2,
        "cabin_type": "single",
        "total_price": 15000.0,
        "customer_info": {
            "full_name": "Test Admin User",
            "email": "admin@example.com",
            "phone": "05551234568",
            "emergency_contact": "05559876543"
        },
        "special_requests": "Vejetaryen yemek tercihi",
        "booking_status": "confirmed",
        "payment_status": "success",
        "booking_code": "TUR-2025-001",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    # Active booking 2
    booking2 = {
        "id": str(uuid.uuid4()),
        "user_id": admin_user["id"],
        "tour_id": tours[1]["id"] if len(tours) > 1 else tours[0]["id"],
        "tour_date_id": tour_dates[1]["id"] if len(tour_dates) > 1 else tour_dates[0]["id"],
        "participants": 1,
        "cabin_type": "double",
        "total_price": 18000.0,
        "customer_info": {
            "full_name": "Test Admin User",
            "email": "admin@example.com",
            "phone": "05551234568",
            "emergency_contact": "05559876543"
        },
        "special_requests": None,
        "booking_status": "paid",
        "payment_status": "success",
        "booking_code": "TUR-2025-002",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    # Completed booking
    booking3 = {
        "id": str(uuid.uuid4()),
        "user_id": admin_user["id"],
        "tour_id": tours[0]["id"],
        "tour_date_id": tour_dates[2]["id"] if len(tour_dates) > 2 else tour_dates[0]["id"],
        "participants": 1,
        "cabin_type": "single",
        "total_price": 12000.0,
        "customer_info": {
            "full_name": "Test Admin User",
            "email": "admin@example.com",
            "phone": "05551234568",
            "emergency_contact": "05559876543"
        },
        "special_requests": "Erken check-in",
        "booking_status": "completed",
        "payment_status": "success",
        "booking_code": "TUR-2024-999",
        "created_at": datetime.now(timezone.utc) - timedelta(days=30),
        "updated_at": datetime.now(timezone.utc) - timedelta(days=30)
    }
    
    # Cancelled booking 1
    booking4 = {
        "id": str(uuid.uuid4()),
        "user_id": admin_user["id"],
        "tour_id": tours[0]["id"],
        "tour_date_id": tour_dates[0]["id"],
        "participants": 2,
        "cabin_type": "double",
        "total_price": 24000.0,
        "customer_info": {
            "full_name": "Test Admin User",
            "email": "admin@example.com",
            "phone": "05551234568",
            "emergency_contact": "05559876543"
        },
        "special_requests": "Müzik sistemi",
        "booking_status": "cancelled",
        "payment_status": "refunded",
        "booking_code": "TUR-2025-003",
        "created_at": datetime.now(timezone.utc) - timedelta(days=5),
        "updated_at": datetime.now(timezone.utc) - timedelta(days=1)
    }
    
    # Cancelled booking 2
    booking5 = {
        "id": str(uuid.uuid4()),
        "user_id": admin_user["id"],
        "tour_id": tours[1]["id"] if len(tours) > 1 else tours[0]["id"],
        "tour_date_id": tour_dates[1]["id"] if len(tour_dates) > 1 else tour_dates[0]["id"],
        "participants": 3,
        "cabin_type": "single",
        "total_price": 36000.0,
        "customer_info": {
            "full_name": "Test Admin User",
            "email": "admin@example.com",
            "phone": "05551234568",
            "emergency_contact": "05559876543"
        },
        "special_requests": None,
        "booking_status": "cancelled",
        "payment_status": "failed",
        "booking_code": "TUR-2025-004",
        "created_at": datetime.now(timezone.utc) - timedelta(days=10),
        "updated_at": datetime.now(timezone.utc) - timedelta(days=8)
    }
    
    sample_bookings = [booking1, booking2, booking3, booking4, booking5]
    
    # Remove existing admin bookings first
    await db.bookings.delete_many({"user_id": admin_user["id"]})
    
    # Insert sample bookings
    await db.bookings.insert_many(sample_bookings)
    
    return {
        "message": "Sample bookings created successfully", 
        "bookings_created": len(sample_bookings),
        "user": admin_user["email"]
    }

# Contact Messages endpoints
@api_router.post("/contact/send")
async def send_contact_message(message_data: dict):
    """Send a contact form message"""
    
    # Validate required fields
    required_fields = ["name", "email", "subject", "message"]
    for field in required_fields:
        if not message_data.get(field):
            raise HTTPException(status_code=400, detail=f"{field} is required")
    
    # Create contact message
    contact_message = {
        "id": str(uuid.uuid4()),
        "name": message_data["name"],
        "email": message_data["email"],
        "phone": message_data.get("phone"),
        "subject": message_data["subject"],
        "message": message_data["message"],
        "status": "new",
        "admin_reply": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    # Save to database
    await db.contact_messages.insert_one(contact_message)
    
    return {"message": "Message sent successfully", "id": contact_message["id"]}

@api_router.get("/admin/contact-messages")
async def get_admin_contact_messages(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get all contact messages for admin"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Build filter
    filter_query = {}
    if status and status != "all":
        filter_query["status"] = status
    
    # Get messages
    messages = await db.contact_messages.find(filter_query).sort([("created_at", -1)]).to_list(length=None)
    
    return [ContactMessage(**msg).dict() for msg in messages]

@api_router.put("/admin/contact-messages/{message_id}")
async def update_contact_message(
    message_id: str,
    update_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Update contact message status or reply"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    message = await db.contact_messages.find_one({"id": message_id})
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Prepare update data
    update_fields = {}
    if "status" in update_data:
        valid_statuses = ["new", "read", "replied", "resolved"]
        if update_data["status"] not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Valid statuses: {valid_statuses}")
        update_fields["status"] = update_data["status"]
    
    if "admin_reply" in update_data:
        update_fields["admin_reply"] = update_data["admin_reply"]
        # Auto-update status to replied if admin adds a reply
        if update_data["admin_reply"] and not update_data.get("status"):
            update_fields["status"] = "replied"
    
    update_fields["updated_at"] = datetime.now(timezone.utc)
    
    # Update message
    await db.contact_messages.update_one(
        {"id": message_id},
        {"$set": update_fields}
    )
    
    return {"message": "Message updated successfully"}

@api_router.delete("/admin/contact-messages/{message_id}")
async def delete_contact_message(
    message_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a contact message"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.contact_messages.delete_one({"id": message_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    
    return {"message": "Message deleted successfully"}

# Ensure uploads directory exists before mounting static files
import os
uploads_dir = "uploads"
os.makedirs(uploads_dir, exist_ok=True)

# Mount static files with different path to avoid cache
app.mount("/files", StaticFiles(directory=uploads_dir), name="files")

# Include router
app.include_router(api_router)

# Upload endpoints - added after router
@app.post("/api/upload-images")
async def upload_images(files: List[UploadFile] = File(...)):
    """Simple image upload endpoint with base64 embedding"""
    import time
    import base64
    
    try:
        uploaded_files = []
        
        for file in files:
            timestamp = int(time.time())
            
            # Clean filename - remove special characters and spaces
            clean_filename = re.sub(r'[^a-zA-Z0-9._-]', '_', file.filename)
            filename = f"{timestamp}_{clean_filename}"
            
            # Read file content
            content = await file.read()
            
            # Create base64 data URL for immediate display
            content_type = "image/jpeg"  # Default
            if filename.lower().endswith('.png'):
                content_type = "image/png"
            elif filename.lower().endswith('.gif'):
                content_type = "image/gif"
            elif filename.lower().endswith('.webp'):
                content_type = "image/webp"
            
            base64_content = base64.b64encode(content).decode('utf-8')
            data_url = f"data:{content_type};base64,{base64_content}"
            
            uploaded_files.append({
                "filename": file.filename,
                "stored_name": filename,
                "url": data_url,  # Direct base64 data URL
                "size": len(content)
            })
            
            print(f"✅ Uploaded: {filename} ({len(content)} bytes) as base64")
        
        return {
            "success": True,
            "files": uploaded_files,
            "count": len(uploaded_files)
        }
        
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return {"success": False, "error": str(e)}

@app.post("/api/simple-upload") 
async def simple_upload(files: List[UploadFile] = File(...)):
    """Ultra simple upload - returns base64 data URLs"""
    import base64
    
    result = []
    
    for file in files:
        # Read file
        content = await file.read()
        
        # Convert to base64
        base64_str = base64.b64encode(content).decode()
        
        # Create data URL
        if file.filename.lower().endswith(('.jpg', '.jpeg')):
            mime = "image/jpeg"
        elif file.filename.lower().endswith('.png'):
            mime = "image/png"
        elif file.filename.lower().endswith('.gif'):
            mime = "image/gif"
        else:
            mime = "image/jpeg"
        
        data_url = f"data:{mime};base64,{base64_str}"
        
        result.append({
            "name": file.filename,
            "url": data_url,
            "size": len(content)
        })
    
    return {"success": True, "images": result}

@app.get("/api/test-upload")
async def test_upload():
    """Test endpoint"""
    return {"message": "Upload endpoint is working", "success": True}

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ====================================================================
# CRON JOB ENDPOINTS
# ====================================================================

@app.post("/api/cron/update-tour-dates-status")
async def update_expired_tour_dates():
    """
    Cron job endpoint to deactivate past tour dates
    Bu endpoint günlük olarak çalıştırılarak geçmiş tarihleri pasif yapar
    """
    try:
        today = datetime.now(timezone.utc).date()
        today_str = today.isoformat()
        
        print(f"🕒 Cron job started: Checking tour dates before {today_str}")
        
        # tour_dates collection'ından geçmiş tarihleri bul ve pasif yap
        # Önce aktif olan geçmiş tarihleri bul
        past_active_dates = await db.tour_dates.find({
            "start_date": {"$lt": today_str},
            "is_active": True
        }).to_list(length=None)
        
        print(f"🔍 Found {len(past_active_dates)} active past dates to deactivate")
        
        dates_deactivated = 0
        
        # Her geçmiş tarihi pasif yap
        for date_entry in past_active_dates:
            try:
                result = await db.tour_dates.update_one(
                    {"id": date_entry["id"]},
                    {
                        "$set": {
                            "is_active": False,
                            "updated_at": datetime.utcnow(),
                            "deactivated_by": "cron_job",
                            "deactivated_at": datetime.utcnow()
                        }
                    }
                )
                
                if result.modified_count > 0:
                    dates_deactivated += 1
                    print(f"   📅 Deactivated: Tour Date ID {date_entry['id']} - {date_entry.get('start_date')}")
                    
            except Exception as date_error:
                print(f"   ❌ Error updating date ID {date_entry.get('id', 'unknown')}: {str(date_error)}")
                continue
        
        # İstatistikleri topla
        total_tour_dates = await db.tour_dates.count_documents({})
        active_dates = await db.tour_dates.count_documents({"is_active": True})
        inactive_dates = await db.tour_dates.count_documents({"is_active": False})
        
        result = {
            "success": True,
            "message": "Tour dates status update completed",
            "stats": {
                "total_tour_dates": total_tour_dates,
                "dates_deactivated": dates_deactivated,
                "active_dates_remaining": active_dates,
                "inactive_dates_total": inactive_dates,
                "execution_date": today_str,
                "execution_time": datetime.utcnow().isoformat()
            }
        }
        
        print(f"✅ Cron job completed:")
        print(f"   - Total tour dates: {total_tour_dates}")
        print(f"   - Dates deactivated: {dates_deactivated}")
        print(f"   - Active dates remaining: {active_dates}")
        print(f"   - Inactive dates total: {inactive_dates}")
        
        return result
        
    except Exception as e:
        error_msg = f"Cron job error: {str(e)}"
        print(f"❌ {error_msg}")
        return {
            "success": False,
            "message": error_msg,
            "stats": {
                "execution_date": datetime.now(timezone.utc).date().isoformat(),
                "execution_time": datetime.utcnow().isoformat()
            }
        }

# Move upload endpoints after router include

# Old media endpoints removed - using simple upload now

# Use StaticFiles for serving - simpler and more reliable

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()