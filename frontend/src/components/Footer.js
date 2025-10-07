import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">TurPlatform</h3>
                <p className="text-sm text-gray-400">Keşfet & Rezervasyon Yap</p>
              </div>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              Türkiye'nin en kapsamlı tur platformu. Binlerce destinasyon, 
              güvenilir operatörler ve unutulmaz deneyimler sizi bekliyor.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors duration-200"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-gray-800 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors duration-200"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-gray-800 hover:bg-blue-400 rounded-lg flex items-center justify-center transition-colors duration-200"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-gray-800 hover:bg-red-600 rounded-lg flex items-center justify-center transition-colors duration-200"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Hızlı Linkler</h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/turlar" 
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Tüm Turlar
                </Link>
              </li>
              <li>
                <Link 
                  to="/popular" 
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Popüler Turlar
                </Link>
              </li>
              <li>
                <Link 
                  to="/last-minute" 
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Son Dakika Fırsatları
                </Link>
              </li>
              <li>
                <Link 
                  to="/vendors" 
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Operatörler
                </Link>
              </li>
              <li>
                <Link 
                  to="/become-vendor" 
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Operatör Ol
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Destek</h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/help" 
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Yardım Merkezi
                </Link>
              </li>
              <li>
                <Link 
                  to="/faq" 
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Sık Sorulan Sorular
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  İletişim
                </Link>
              </li>
              <li>
                <Link 
                  to="/cancellation-policy" 
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  İptal Politikası
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms" 
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Kullanım Koşulları
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Müşteri Hizmetleri</p>
                <p className="font-medium">0850 255 53 35</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">E-posta</p>
                <p className="font-medium">info@dijipaltour.com</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Adres</p>
                <p className="font-medium">İstanbul, Türkiye</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-400 mb-4 md:mb-0">
            © 2026 DijipalTour.com Tarafından ❤️ yapıldı
          </div>
          <div className="flex space-x-6 text-sm">
            <Link 
              to="/privacy" 
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              Gizlilik Politikası
            </Link>
            <Link 
              to="/cookies" 
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              Çerez Politikası
            </Link>
            <Link 
              to="/kvkk" 
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              KVKK
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;