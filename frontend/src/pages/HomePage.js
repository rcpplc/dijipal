import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  Search, 
  MapPin, 
  Users, 
  Calendar, 
  Star, 
  ArrowRight,
  Award,
  Shield,
  Clock,
  Phone,
  Heart,
  Trees,
  Mountain,
  Building,
  Castle,
  UtensilsCrossed,
  Home,
  BookmarkCheck,
  User
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { createSlug } from '../utils/slug';
import SearchBottomSheet from '../components/search/SearchBottomSheet';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const { user, setShowLoginModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredTours, setFeaturedTours] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [favorites, setFavorites] = useState(new Set());
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const heroImages = [
    "https://images.pexels.com/photos/18754200/pexels-photo-18754200.jpeg",
    "https://images.unsplash.com/photo-1529528018027-2ee0409703af",
    "https://images.unsplash.com/photo-1727715220090-8e05aaa5b4fa"
  ];

  const heroTitles = [
    { main: "mavibilet.com", subtitle: "Mavi Yolculuğun Keyfini Çıkarın" },
    { main: "mavibilet.com", subtitle: "Göcek Koylarının Keyfini Çıkarın" },
    { main: "mavibilet.com", subtitle: "Rüzgarın Keyfini Çıkarın" }
  ];

  useEffect(() => {
    loadFeaturedTours();
    seedSampleData();
    if (user) loadFavorites();
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const seedSampleData = async () => {
    try { await axios.post(`${API}/seed-data`); } catch {}
  };

  const loadFeaturedTours = async () => {
    try {
      const res = await axios.get(`${API}/tours?limit=6`);
      setFeaturedTours(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/turlar?search=${encodeURIComponent(searchQuery.trim())}`);
    } else navigate('/turlar');
  };

  const handleAdvancedSearch = (data) => {
    const params = new URLSearchParams();
    if (data.query?.trim()) params.set('search', data.query.trim());
    if (data.filters.location) params.set('location', data.filters.location);
    if (data.filters.category) params.set('category', data.filters.category);
    if (data.filters.dateRange?.start) params.set('startDate', data.filters.dateRange.start);
    if (data.filters.dateRange?.end) params.set('endDate', data.filters.dateRange.end);
    navigate(`/turlar${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const loadFavorites = async () => {
    try {
      const res = await axios.get(`${API}/favorites`);
      setFavorites(new Set(res.data.map(t => t.id)));
    } catch {}
  };

  const toggleFavorite = async (id) => {
    if (!user) return setShowLoginModal(true);
    try {
      if (favorites.has(id)) {
        await axios.delete(`${API}/favorites/${id}`);
        setFavorites(prev => { const s = new Set(prev); s.delete(id); return s; });
        toast.success("Favorilerden çıkarıldı");
      } else {
        await axios.post(`${API}/favorites/${id}`);
        setFavorites(prev => new Set([...prev, id]));
        toast.success("Favorilere eklendi");
      }
    } catch { toast.error("Bir hata oluştu"); }
  };

  const categories = [
    { name: 'Kültürel', icon: MapPin, color: 'blue', value: 'cultural', description: 'Tarihi yerler ve müzeler' },
    { name: 'Doğa', icon: Trees, color: 'green', value: 'nature', description: 'Doğal güzellikler' },
    { name: 'Macera', icon: Mountain, color: 'orange', value: 'adventure', description: 'Adrenalin ve heyecan' },
    { name: 'Şehir', icon: Building, color: 'purple', value: 'city', description: 'Şehir keşfi' },
    { name: 'Tarihi', icon: Castle, color: 'amber', value: 'historical', description: 'Antik medeniyetler' },
    { name: 'Gastronomi', icon: UtensilsCrossed, color: 'red', value: 'food', description: 'Lezzet turları' }
  ];

  const features = [
    { icon: Shield, title: 'Güvenli Rezervasyon', description: 'SSL sertifikası ve güvenli ödeme altyapısı ile korumalı rezervasyon sistemi' },
    { icon: Award, title: 'Kaliteli Operatörler', description: 'Deneyimli ve sertifikalı tur operatörleri ile unutulmaz deneyimler' },
    { icon: Clock, title: '7/24 Destek', description: 'Seyahatiniz süresince kesintisiz müşteri desteği' },
    { icon: Phone, title: 'Anında Onay', description: 'Rezervasyon onayınızı SMS ve e-posta ile anında alın' }
  ];

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      {/* HERO */}
      <section className="relative h-[70vh] overflow-hidden">
        <div className="absolute inset-0">
          {heroImages.map((img, i) => (
            <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i===currentSlide?'opacity-100':'opacity-0'}`}>
              <img src={img} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black bg-opacity-50"></div>
            </div>
          ))}
        </div>
        <div className="relative z-10 h-full flex items-center justify-center text-center text-white px-4 max-w-4xl mx-auto">
          <div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-4">
              {heroTitles[currentSlide].main}
              <span key={currentSlide} className="block text-blue-300 text-xl sm:text-2xl md:text-3xl opacity-0 animate-fade-in-subtitle" style={{animation:'fadeInSubtitle 1000ms ease-in-out 1000ms forwards'}}>
                {heroTitles[currentSlide].subtitle}
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl mb-6 text-gray-100">Akdeniz ve Ege'nin eşsiz koylarında unutulmaz bir deniz tatili yapın</p>
            <div className="max-w-2xl mx-auto mb-6 px-4 space-y-3">
              <form onSubmit={handleSearch}>
                <div className="flex bg-white rounded-full shadow-2xl overflow-hidden">
                  <div className="flex-1 flex items-center px-4 py-3">
                    <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                    <input type="text" placeholder="Ara, Keşfet & Rezervasyon Yap" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="flex-1 outline-none text-gray-800 text-sm sm:text-base"/>
                  </div>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 flex items-center">
                    <Search className="w-5 h-5" /><span className="hidden sm:inline ml-2">Ara</span>
                  </button>
                </div>
              </form>
              <div className="text-center">
                <button onClick={()=>setIsSearchOpen(true)} className="text-white/80 hover:text-white text-sm underline flex items-center mx-auto">
                  <span>Gelişmiş Arama</span><ArrowRight className="w-4 h-4 ml-1"/>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-2">
          {heroImages.map((_,i)=>(
            <button key={i} onClick={()=>setCurrentSlide(i)} className={`w-3 h-3 rounded-full ${i===currentSlide?'bg-white':'bg-white/50'}`}/>
          ))}
        </div>
      </section>

      {/* KATEGORİLER */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Kategorilere Göre Keşfet</h2>
            <p className="text-lg text-gray-600">İlgi alanınıza uygun tur kategorilerini seçin</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map(c=>(
              <Link key={c.value} to={`/category/${c.value}`} className="group bg-white rounded-xl p-6 text-center hover:shadow-lg transition transform hover:-translate-y-1 border border-gray-100">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 bg-${c.color}-100`}>
                  <c.icon className={`w-6 h-6 text-${c.color}-600`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">{c.name}</h3>
                <p className="text-xs text-gray-600">{c.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ... Bölgeler, Öne Çıkan Turlar, Özellikler, CTA bölümleri kodunuzdaki gibi devam ediyor ... */}

      <SearchBottomSheet isOpen={isSearchOpen} onClose={()=>setIsSearchOpen(false)} onSearch={handleAdvancedSearch} initialFilters={{}} />

      {/* 📱 Mobil Alt Sabit Menü */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 md:hidden z-50">
        <div className="grid grid-cols-4">
          {/* Ana Sayfa */}
          <a
            href="https://tour-admin-hub.preview.emergentagent.com/"
            className="flex flex-col items-center py-2 text-sm text-gray-500 hover:text-blue-600"
          >
            <Home className="w-6 h-6 mb-1" />
          </a>
          {/* Rezervasyonlarım */}
          <a
            href="/bookings"
            className="flex flex-col items-center py-2 text-sm text-gray-500 hover:text-blue-600"
          >
            <BookmarkCheck className="w-6 h-6 mb-1" />
          </a>
          {/* Favorilerim */}
          <a
            href="/favorites"
            className="flex flex-col items-center py-2 text-sm text-gray-500 hover:text-blue-600"
          >
            <Heart className="w-6 h-6 mb-1" />
          </a>
          {/* Profilim */}
          <a
            href="/profile"
            className="flex flex-col items-center py-2 text-sm text-gray-500 hover:text-blue-600"
          >
            <User className="w-6 h-6 mb-1" />
          </a>
        </div>
      </nav>
    </div>
  );
};

export default HomePage;
