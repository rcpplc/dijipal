import { Link, Outlet } from 'react-router-dom'
import { useAuthStore } from '../lib/store/authStore'
import { useCartStore } from '../lib/store/cartStore'
import { Button } from './ui/button'
import { ShoppingCart, User, Heart, Menu } from 'lucide-react'
import { useState } from 'react'

export default function Layout() {
  const { isAuthenticated } = useAuthStore()
  const totalItems = useCartStore((state) => state.getTotalItems())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="text-2xl font-bold text-blue-600">
              TurSat
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="hover:text-blue-600 transition-colors">
                Ana Sayfa
              </Link>
              <Link to="/tours" className="hover:text-blue-600 transition-colors">
                Turlar
              </Link>
              <Link to="/categories" className="hover:text-blue-600 transition-colors">
                Kategoriler
              </Link>
              <Link to="/about" className="hover:text-blue-600 transition-colors">
                Hakkımızda
              </Link>
              <Link to="/contact" className="hover:text-blue-600 transition-colors">
                İletişim
              </Link>
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link to="/favorites">
                    <Button variant="ghost" size="icon">
                      <Heart className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/cart" className="relative">
                    <Button variant="ghost" size="icon">
                      <ShoppingCart className="h-5 w-5" />
                      {totalItems > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {totalItems}
                        </span>
                      )}
                    </Button>
                  </Link>
                  <Link to="/profile">
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </Link>
                </>
              ) : (
                <Link to="/login">
                  <Button>Giriş Yap</Button>
                </Link>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 border-t">
              <div className="flex flex-col gap-2">
                <Link
                  to="/"
                  className="px-4 py-2 hover:bg-gray-100 rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Ana Sayfa
                </Link>
                <Link
                  to="/tours"
                  className="px-4 py-2 hover:bg-gray-100 rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Turlar
                </Link>
                <Link
                  to="/categories"
                  className="px-4 py-2 hover:bg-gray-100 rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Kategoriler
                </Link>
                <Link
                  to="/about"
                  className="px-4 py-2 hover:bg-gray-100 rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Hakkımızda
                </Link>
                <Link
                  to="/contact"
                  className="px-4 py-2 hover:bg-gray-100 rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  İletişim
                </Link>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">TurSat</h3>
              <p className="text-gray-400">
                Türkiye'nin en güvenilir tur rezervasyon platformu
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Hızlı Linkler</h4>
              <div className="flex flex-col gap-2">
                <Link to="/tours" className="text-gray-400 hover:text-white">
                  Turlar
                </Link>
                <Link to="/categories" className="text-gray-400 hover:text-white">
                  Kategoriler
                </Link>
                <Link to="/about" className="text-gray-400 hover:text-white">
                  Hakkımızda
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Destek</h4>
              <div className="flex flex-col gap-2">
                <Link to="/contact" className="text-gray-400 hover:text-white">
                  İletişim
                </Link>
                <Link to="/faq" className="text-gray-400 hover:text-white">
                  SSS
                </Link>
                <Link to="/terms" className="text-gray-400 hover:text-white">
                  Kullanım Koşulları
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">İletişim</h4>
              <p className="text-gray-400">
                Email: info@tursat.com<br />
                Tel: +90 (555) 123 45 67
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2025 TurSat. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
