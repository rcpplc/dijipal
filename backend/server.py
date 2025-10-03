from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query, File, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi import Path as FastAPIPath
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
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
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'tour_platform')]

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
    images: List[str] = []
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
    duration_hours: Optional[int] = 0
    base_price: Optional[float] = 0
    max_participants: Optional[int] = 1
    difficulty_level: Optional[str] = "Easy"

class TourDate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tour_id: str
    start_date: str  # Date in YYYY-MM-DD format
    available_cabins: int  # Total cabin capacity
    single_cabin_price: float  # Price for single occupancy cabin
    double_cabin_price: float  # Price for double occupancy cabin
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    tour_id: str
    tour_date_id: str
    participants: int
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

# Create models
class CabinPricing(BaseModel):
    single_cabin_price: float  # 1 kişilik kabin fiyatı
    double_cabin_price: float  # 2 kişilik kabin fiyatı

class TourDateCreate(BaseModel):
    date: str  # ISO date string
    capacity: int  # Available cabins count
    single_cabin_price: float  # Price for single occupancy cabin
    double_cabin_price: float  # Price for double occupancy cabin
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
    duration_hours: Optional[int] = 0
    base_price: Optional[float] = 0
    max_participants: Optional[int] = 1
    difficulty_level: Optional[str] = "Easy"

class BookingCreate(BaseModel):
    tour_id: str
    tour_date_id: str
    participants: int
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
            tour["tour_dates"].append({
                "id": date["id"],
                "date": date["start_date"],
                "capacity": date["available_cabins"],
                "single_cabin_price": date["single_cabin_price"],
                "double_cabin_price": date["double_cabin_price"],
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
        
        # Calculate minimum price from all cabin options
        if tour_dates:
            all_prices = []
            for date in tour_dates:
                if date.get("single_cabin_price"):
                    all_prices.append(date["single_cabin_price"])
                if date.get("double_cabin_price"):
                    all_prices.append(date["double_cabin_price"])
                if date.get("price") and not date.get("single_cabin_price"):
                    all_prices.append(date["price"])  # Fallback for old data
            
            if all_prices:
                tour["minimum_price"] = min(all_prices)
            else:
                tour["minimum_price"] = tour.get("base_price", 0)
        else:
            tour["minimum_price"] = tour.get("base_price", 0)
        
        result_tours.append(tour)
    
    return result_tours

@api_router.get("/tours/{tour_id}")
async def get_tour(tour_id: str = FastAPIPath(...)):
    tour = await db.tours.find_one({"id": tour_id})
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
            "id": date["id"],
            "start_date": date["start_date"],
            "date": date["start_date"],
            "capacity": date["available_cabins"],
            "single_cabin_price": date["single_cabin_price"],
            "double_cabin_price": date["double_cabin_price"],
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
    
    # Check availability
    if tour_date["available_spots"] < booking_data.participants:
        raise HTTPException(status_code=400, detail="Not enough spots available")
    
    # Calculate price
    total_price = (tour_date.get("price") or tour["base_price"]) * booking_data.participants
    
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
    return [Booking(**booking) for booking in bookings]

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

@api_router.get("/favorites", response_model=List[Tour])
async def get_user_favorites(current_user: User = Depends(get_current_user)):
    # Get user's favorite tour IDs
    favorites = await db.favorites.find({"user_id": current_user.id}).to_list(length=None)
    tour_ids = [fav["tour_id"] for fav in favorites]
    
    if not tour_ids:
        return []
    
    # Get the actual tours
    tours = await db.tours.find({"id": {"$in": tour_ids}}).to_list(length=None)
    return [Tour(**tour) for tour in tours]

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
            tour["tour_dates"].append({
                "id": date["id"],
                "date": date["start_date"],
                "capacity": date["available_cabins"],
                "single_cabin_price": date["single_cabin_price"],
                "double_cabin_price": date["double_cabin_price"],
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
        
        # Create new tour dates with cabin system
        for date_data in tour_dates_data:
            print(f"🔍 Processing cabin date: {date_data}")
            try:
                tour_date = TourDate(
                    tour_id=tour_id,
                    start_date=date_data.get("date", date_data.get("start_date")),
                    available_cabins=date_data.get("capacity", date_data.get("available_cabins", 10)),
                    single_cabin_price=float(date_data.get("single_cabin_price", 0)),
                    double_cabin_price=float(date_data.get("double_cabin_price", 0)),
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
            "available_spots": date_data["capacity"],
            "price": date_data["price"],
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
    
    # Return URL - in production this would be a proper CDN URL
    file_url = f"https://paketsafari.preview.emergentagent.com/uploads/{filename}"
    
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

@api_router.post("/create-admin-user")
async def create_admin_user():
    """Create admin user for testing purposes"""
    
    # Check if admin already exists
    existing_admin = await db.users.find_one({"email": "admin@example.com"})
    if existing_admin:
        return {"message": "Admin user already exists", "email": "admin@example.com"}
    
    # Create admin user
    admin_user = {
        "id": str(uuid.uuid4()),
        "email": "admin@example.com",
        "password": "admin123",  # In production, this should be hashed
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

# Mount static files for images
app.mount("/uploads", StaticFiles(directory="/tmp/uploads"), name="uploads")

# Include router
app.include_router(api_router)

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()