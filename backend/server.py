from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query
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
from datetime import datetime, date, time
from enum import Enum
import jwt
from passlib.context import CryptContext
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
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-here")

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

class TourCategory(str, Enum):
    CULTURAL = "cultural"
    NATURE = "nature"
    ADVENTURE = "adventure"
    CITY = "city"
    BEACH = "beach"
    HISTORICAL = "historical"
    FOOD = "food"
    WELLNESS = "wellness"

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
    duration_days: int
    duration_hours: Optional[int] = 0
    base_price: float
    max_participants: int
    category: TourCategory
    status: TourStatus = TourStatus.DRAFT
    images: List[str] = []
    included_services: List[str] = []
    excluded_services: List[str] = []
    meeting_point: Optional[str] = None
    languages: List[str] = ["Turkish"]
    difficulty_level: Optional[str] = "Easy"
    cancellation_policy: Optional[str] = None
    tags: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TourDate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tour_id: str
    start_date: date
    end_date: Optional[date] = None
    start_time: Optional[str] = None
    available_spots: int
    price: Optional[Decimal] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    tour_id: str
    tour_date_id: str
    participants: int
    total_price: Decimal
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
class TourCreate(BaseModel):
    title: str
    description: str
    short_description: str
    location: str
    duration_days: int
    duration_hours: Optional[int] = 0
    base_price: float
    max_participants: int
    category: TourCategory
    images: List[str] = []
    included_services: List[str] = []
    excluded_services: List[str] = []
    meeting_point: Optional[str] = None
    languages: List[str] = ["Turkish"]
    difficulty_level: Optional[str] = "Easy"
    cancellation_policy: Optional[str] = None
    tags: List[str] = []

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
    async def process_payment(self, amount: Decimal, currency: str = "TRY") -> Dict[str, Any]:
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
    hashed_password = pwd_context.hash(user_data.password)
    
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
    if not user_doc or not pwd_context.verify(login_data.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = User(**user_doc)
    token = create_access_token({"sub": user.id})
    
    return {"token": token, "user": user}

# Tour endpoints
@api_router.get("/tours", response_model=List[Tour])
async def get_tours(
    category: Optional[TourCategory] = None,
    location: Optional[str] = None,
    min_price: Optional[Decimal] = None,
    max_price: Optional[Decimal] = None,
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

@api_router.get("/tours/{tour_id}/reviews", response_model=List[Review])
async def get_tour_reviews(tour_id: str):
    reviews = await db.reviews.find({"tour_id": tour_id}).to_list(length=None)
    return [Review(**review) for review in reviews]

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
            "base_price": Decimal("299.00"),
            "max_participants": 15,
            "category": TourCategory.HISTORICAL,
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
            "base_price": Decimal("450.00"),
            "max_participants": 8,
            "category": TourCategory.ADVENTURE,
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
    for tour in sample_tours:
        existing = await db.tours.find_one({"title": tour["title"]})
        if not existing:
            await db.tours.insert_one(tour)
    
    return {"message": "Sample data added successfully"}

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