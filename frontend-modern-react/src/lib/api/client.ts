import axios, { AxiosError, AxiosInstance } from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          const status = error.response.status
          const message = (error.response.data as any)?.detail || 'Bir hata oluştu'

          switch (status) {
            case 401:
              localStorage.removeItem('auth_token')
              localStorage.removeItem('user')
              window.location.href = '/login'
              toast.error('Oturumunuz sonlandı. Lütfen tekrar giriş yapın.')
              break
            case 403:
              toast.error('Bu işlem için yetkiniz yok.')
              break
            case 404:
              toast.error('İstenen kaynak bulunamadı.')
              break
            case 500:
              toast.error('Sunucu hatası. Lütfen daha sonra tekrar deneyin.')
              break
            default:
              toast.error(message)
          }
        } else if (error.request) {
          toast.error('Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.')
        } else {
          toast.error('Bir hata oluştu. Lütfen tekrar deneyin.')
        }

        return Promise.reject(error)
      }
    )
  }

  public get<T>(url: string, params?: any) {
    return this.client.get<T>(url, { params })
  }

  public post<T>(url: string, data?: any) {
    return this.client.post<T>(url, data)
  }

  public put<T>(url: string, data?: any) {
    return this.client.put<T>(url, data)
  }

  public patch<T>(url: string, data?: any) {
    return this.client.patch<T>(url, data)
  }

  public delete<T>(url: string) {
    return this.client.delete<T>(url)
  }

  public uploadFile<T>(url: string, file: File, onProgress?: (progress: number) => void) {
    const formData = new FormData()
    formData.append('file', file)

    return this.client.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
  }
}

export const apiClient = new ApiClient()
