// User Types
export enum UserRole {
  CUSTOMER = "customer",
  VENDOR = "vendor",
  ADMIN = "admin",
}

export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  role: UserRole
  is_active: boolean
  created_at: string
  profile_image?: string
}

export interface UserLogin {
  email: string
  password: string
}

export interface UserRegister {
  email: string
  full_name: string
  password: string
  phone?: string
}

// Tour Types
export enum TourStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  INACTIVE = "inactive",
  ARCHIVED = "archived",
}

export enum ReservationType {
  CABIN_BASED = "cabin_based",
  PERSON_BASED = "person_based",
  RESERVATION = "reservation",
}

export interface Tour {
  id: string
  vendor_id: string
  title: string
  description: string
  short_description: string
  location: string
  pickup_time?: string
  dropoff_time?: string
  category: string
  classification?: string
  status: TourStatus
  reservation_type: ReservationType
  images: string[]
  included_services: string[]
  excluded_services: string[]
  meeting_point?: string
  languages: string[]
  program_details?: string
  cancellation_policy?: string
  tags: string[]
  created_at: string
  updated_at: string
  duration_days?: number
  duration_unit?: string
  duration_hours?: number
  base_price?: number
  max_participants?: number
  difficulty_level?: string
}

export interface TourDate {
  id: string
  tour_id: string
  start_date: string
  available_cabins: number
  single_cabin_price: number
  double_cabin_price: number
  max_persons: number
  person_price: number
  child_price?: number
  total_reservation_price: number
  max_passengers: number
  is_active: boolean
  created_at: string
}

// Booking Types
export enum BookingStatus {
  DRAFT = "draft",
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PAID = "paid",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum PaymentStatus {
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export interface Booking {
  id: string
  user_id: string
  tour_id: string
  tour_date_id: string
  participants: number
  cabin_type: string
  total_price: number
  customer_info: Record<string, any>
  special_requests?: string
  booking_status: BookingStatus
  payment_status: PaymentStatus
  booking_code: string
  created_at: string
  updated_at: string
}

// Review Types
export interface Review {
  id: string
  user_id: string
  tour_id: string
  booking_id: string
  rating: number
  title?: string
  comment?: string
  images: string[]
  is_verified: boolean
  created_at: string
}

// Category Types
export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parent_id?: string
  icon?: string
  image?: string
  is_active: boolean
  order: number
  created_at: string
}

// Cart Types
export interface CartItem {
  tour_id: string
  tour_date_id: string
  tour: Tour
  tour_date: TourDate
  participants: number
  cabin_type: string
  price: number
}

// API Response Types
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}
