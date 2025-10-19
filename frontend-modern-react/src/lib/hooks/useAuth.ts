import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '../api/services'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import type { UserLogin, UserRegister } from '../../types'

export function useAuth() {
  const { user, isAuthenticated, login, logout: logoutStore } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationFn: (data: UserLogin) => authService.login(data),
    onSuccess: (response) => {
      login(response.data.user, response.data.access_token)
      toast.success('Başarıyla giriş yaptınız!')
      navigate('/')
    },
    onError: () => {
      toast.error('Giriş başarısız. Email ve şifrenizi kontrol edin.')
    },
  })

  const registerMutation = useMutation({
    mutationFn: (data: UserRegister) => authService.register(data),
    onSuccess: (response) => {
      login(response.data.user, response.data.access_token)
      toast.success('Hesabınız başarıyla oluşturuldu!')
      navigate('/')
    },
    onError: () => {
      toast.error('Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.')
    },
  })

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      logoutStore()
      queryClient.clear()
      toast.success('Çıkış yaptınız')
      navigate('/')
    },
  })

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  }
}
