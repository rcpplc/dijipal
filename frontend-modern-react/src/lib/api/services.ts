import { apiClient } from './client'
import type {
  User,
  UserLogin,
  UserRegister,
  Tour,
  TourDate,
  Booking,
  Review,
  Category,
  PaginatedResponse,
} from '../../types'

// Auth Services
export const authService = {
  login: (data: UserLogin) => 
    apiClient.post<{ access_token: string; user: User }>('/auth/login', data),
  
  register: (data: UserRegister) => 
    apiClient.post<{ access_token: string; user: User }>('/auth/register', data),
  
  logout: () => 
    apiClient.post('/auth/logout'),
  
  getCurrentUser: () => 
    apiClient.get<User>('/auth/me'),
  
  googleLogin: (token: string) => 
    apiClient.post<{ access_token: string; user: User }>('/auth/google', { token }),
}

// Tour Services
export const tourService = {
  getTours: (params?: {
    category?: string
    search?: string
    location?: string
    min_price?: number
    max_price?: number
    page?: number
    page_size?: number
  }) => 
    apiClient.get<PaginatedResponse<Tour>>('/tours', params),
  
  getTour: (id: string) => 
    apiClient.get<Tour>(`/tours/${id}`),
  
  getTourDates: (tourId: string) => 
    apiClient.get<TourDate[]>(`/tours/${tourId}/dates`),
  
  getFeaturedTours: () => 
    apiClient.get<Tour[]>('/tours/featured'),
  
  getPopularTours: () => 
    apiClient.get<Tour[]>('/tours/popular'),
}

// Category Services
export const categoryService = {
  getCategories: () => 
    apiClient.get<Category[]>('/categories'),
  
  getCategory: (slug: string) => 
    apiClient.get<Category>(`/categories/${slug}`),
  
  getCategoryTours: (slug: string, params?: { page?: number; page_size?: number }) => 
    apiClient.get<PaginatedResponse<Tour>>(`/categories/${slug}/tours`, params),
}

// Booking Services
export const bookingService = {
  createBooking: (data: {
    tour_id: string
    tour_date_id: string
    participants: number
    cabin_type: string
    customer_info: Record<string, any>
    special_requests?: string
  }) => 
    apiClient.post<Booking>('/bookings', data),
  
  getBookings: () => 
    apiClient.get<Booking[]>('/bookings/my-bookings'),
  
  getBooking: (id: string) => 
    apiClient.get<Booking>(`/bookings/${id}`),
  
  cancelBooking: (id: string) => 
    apiClient.post(`/bookings/${id}/cancel`),
}

// Review Services
export const reviewService = {
  getTourReviews: (tourId: string) => 
    apiClient.get<Review[]>(`/tours/${tourId}/reviews`),
  
  createReview: (data: {
    tour_id: string
    booking_id: string
    rating: number
    title?: string
    comment?: string
  }) => 
    apiClient.post<Review>('/reviews', data),
}

// Favorites Services
export const favoriteService = {
  getFavorites: () => 
    apiClient.get<Tour[]>('/favorites'),
  
  addFavorite: (tourId: string) => 
    apiClient.post(`/favorites/${tourId}`),
  
  removeFavorite: (tourId: string) => 
    apiClient.delete(`/favorites/${tourId}`),
}

// Search Service
export const searchService = {
  search: (query: string) => 
    apiClient.get<{ tours: Tour[]; categories: Category[] }>('/search', { q: query }),
}

// Upload Service
export const uploadService = {
  uploadImage: (file: File, onProgress?: (progress: number) => void) => 
    apiClient.uploadFile<{ url: string }>('/upload', file, onProgress),
}
