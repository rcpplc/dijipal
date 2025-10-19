import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tourService, favoriteService } from '../api/services'
import toast from 'react-hot-toast'

export function useTours(params?: {
  category?: string
  search?: string
  location?: string
  min_price?: number
  max_price?: number
  page?: number
  page_size?: number
}) {
  return useQuery({
    queryKey: ['tours', params],
    queryFn: () => tourService.getTours(params),
  })
}

export function useTour(id: string) {
  return useQuery({
    queryKey: ['tour', id],
    queryFn: () => tourService.getTour(id),
    enabled: !!id,
  })
}

export function useTourDates(tourId: string) {
  return useQuery({
    queryKey: ['tour-dates', tourId],
    queryFn: () => tourService.getTourDates(tourId),
    enabled: !!tourId,
  })
}

export function useFeaturedTours() {
  return useQuery({
    queryKey: ['tours', 'featured'],
    queryFn: () => tourService.getFeaturedTours(),
  })
}

export function usePopularTours() {
  return useQuery({
    queryKey: ['tours', 'popular'],
    queryFn: () => tourService.getPopularTours(),
  })
}

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoriteService.getFavorites(),
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tourId, isAdding }: { tourId: string; isAdding: boolean }) =>
      isAdding ? favoriteService.addFavorite(tourId) : favoriteService.removeFavorite(tourId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      toast.success(variables.isAdding ? 'Favorilere eklendi' : 'Favorilerden çıkarıldı')
    },
    onError: () => {
      toast.error('Bir hata oluştu')
    },
  })
}
