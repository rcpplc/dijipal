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
from datetime import datetime, date, time, timezone
from enum import Enum
import jwt
import asyncio
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
    start_date: date
    end_date: Optional[date] = None
    start_time: Optional[str] = None
    available_spots: int
    price: Optional[float] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

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
class TourDateCreate(BaseModel):
    date: str  # ISO date string
    price: float
    capacity: int

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
@api_router.get("/tours", response_model=List[Tour])
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
    return [Tour(**tour) for tour in tours]

@api_router.get("/tours/{tour_id}", response_model=Tour)
async def get_tour(tour_id: str = FastAPIPath(...)):
    tour = await db.tours.find_one({"id": tour_id})
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    return Tour(**tour)

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
    today = datetime.now(timezone.utc).date().isoformat()
    tour_dates = await db.tour_dates.find({
        "tour_id": tour_id,
        "is_active": True,
        "start_date": {"$gte": today}
    }).sort("start_date", 1).to_list(length=None)
    
    return [TourDate(**date) for date in tour_dates]

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
@api_router.get("/admin/tours", response_model=List[Tour])
async def admin_get_all_tours(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    tours = await db.tours.find().to_list(length=None)
    return [Tour(**tour) for tour in tours]

@api_router.put("/admin/tours/{tour_id}", response_model=Tour)
async def admin_update_tour(tour_id: str, tour_data: TourCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Update tour
    tour_dict = tour_data.dict()
    tour_dict["updated_at"] = datetime.utcnow()
    
    result = await db.tours.update_one(
        {"id": tour_id},
        {"$set": tour_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tour not found")
    
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
            "start_date": date_data["date"],
            "price": date_data["price"],
            "available_spots": date_data["capacity"],
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
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
    file_url = f"https://tourpack.preview.emergentagent.com/uploads/{filename}"
    
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
@api_router.post("/seed-data")
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