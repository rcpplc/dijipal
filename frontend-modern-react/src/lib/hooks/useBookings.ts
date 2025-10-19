import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingService } from '../api/services'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export function useBookings() {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingService.getBookings(),
  })
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingService.getBooking(id),
    enabled: !!id,
  })
}

export function useCreateBooking() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: bookingService.createBooking,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      toast.success('Rezervasyon oluşturuldu!')
      navigate(`/booking/${response.data.id}`)
    },
    onError: () => {
      toast.error('Rezervasyon oluşturulamadı')
    },
  })
}

export function useCancelBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (bookingId: string) => bookingService.cancelBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      toast.success('Rezervasyon iptal edildi')
    },
    onError: () => {
      toast.error('Rezervasyon iptal edilemedi')
    },
  })
}
