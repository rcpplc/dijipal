# 🚀 Frontend'ler Kurulum ve Kullanım Rehberi

Bu rehber, oluşturulan farklı frontend versiyonları için kurulum ve kullanım talimatlarını içerir.

## 📁 Proje Yapısı

```
/workspace/
├── backend/                    # Mevcut FastAPI backend
├── frontend/                   # Mevcut React frontend
├── frontend-modern-react/      # ✅ YENİ: Modern React + TypeScript + Vite
├── frontend-nextjs/           # 🔄 YAKINDA: Next.js versiyonu
├── frontend-vue/              # 🔄 YAKINDA: Vue.js versiyonu
└── FRONTEND_GUIDE.md          # Bu dosya
```

---

## 1️⃣ Modern React Frontend (Vite + TypeScript) ✅

### 📍 Konum
`/workspace/frontend-modern-react/`

### 🎯 Özellikler
- ⚡ **Vite** - Çok hızlı geliştirme deneyimi
- 🎯 **TypeScript** - Tip güvenliği
- 🎨 **Tailwind CSS** - Modern tasarım sistemi
- 🔄 **React Query** - Server state yönetimi
- 📦 **Zustand** - Client state yönetimi
- 🚦 **React Router v6** - Sayfa yönlendirme
- 🎭 **Lucide Icons** - Modern ikonlar
- 🔥 **React Hot Toast** - Bildirimler

### 🚀 Kurulum ve Çalıştırma

```bash
cd /workspace/frontend-modern-react

# Bağımlılıkları yükle (zaten yüklü)
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Production build
npm run build

# Build önizlemesi
npm run preview
```

### 🌐 Erişim
- **Geliştirme**: http://localhost:5173
- **Backend API**: http://localhost:8000/api

### 📝 Ortam Değişkenleri

`.env` dosyası:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### 📦 Mevcut Sayfalar
- ✅ Ana Sayfa (`/`) - Hero section, öne çıkan turlar
- ✅ Turlar Listesi (`/tours`) - Arama, filtreleme
- ✅ Tur Detayı (`/tours/:id`) - Detaylı bilgi, rezervasyon

### 🔨 Geliştirilecek Sayfalar
- 🔐 Login / Register
- 🛒 Sepet
- ❤️ Favoriler
- 📅 Rezervasyonlar
- 👤 Profil
- 🎫 Kategoriler

### 📚 Temel Kullanım

#### API Çağrısı Örneği
```typescript
// Hook kullanımı
import { useTours } from '../lib/hooks/useTours'

function MyComponent() {
  const { data, isLoading } = useTours({ 
    category: 'deniz',
    page: 1 
  })
  
  if (isLoading) return <div>Yükleniyor...</div>
  
  return <div>{data?.items.map(tour => ...)}</div>
}
```

#### State Yönetimi
```typescript
// Auth state
import { useAuthStore } from '../lib/store/authStore'

function Header() {
  const { user, isAuthenticated, logout } = useAuthStore()
  // ...
}

// Cart state
import { useCartStore } from '../lib/store/cartStore'

function Cart() {
  const { items, addItem, removeItem } = useCartStore()
  // ...
}
```

### 🎨 UI Components

Tüm UI componentleri shadcn/ui standardında:
- `Button` - Çeşitli varyantlar (default, outline, ghost, etc.)
- `Card` - Kart layout'u
- Daha fazlası eklenebilir (Dialog, Dropdown, etc.)

---

## 2️⃣ Next.js Full-Stack Frontend 🔄

### 📍 Konum
`/workspace/frontend-nextjs/` (Yakında)

### 🎯 Özellikler
- ⚡ Next.js 15 (App Router)
- 🎯 TypeScript
- 🎨 Tailwind CSS + shadcn/ui
- 🔄 Server Components
- 📱 SEO Optimizasyonu
- 🖼️ Image Optimization
- 🚀 Static Site Generation

### 📦 Planlanan Özellikler
- Server-side rendering
- API routes
- Metadata API
- Route handlers
- Streaming

---

## 3️⃣ Vue.js Frontend 🔄

### 📍 Konum
`/workspace/frontend-vue/` (Yakında)

### 🎯 Özellikler
- ⚡ Vue 3 (Composition API)
- 🎯 TypeScript
- 🎨 Tailwind CSS
- 📦 Pinia (State Management)
- 🚦 Vue Router
- ⚡ Vite

---

## 4️⃣ Mevcut Frontend İyileştirme 🔄

### 📍 Konum
`/workspace/frontend/`

### 🎯 Planlar
- TypeScript migration
- Code splitting
- Performance optimization
- Bundle size reduction

---

## 🔧 Backend Bağlantısı

Tüm frontend'ler aynı backend'i kullanır:

### Backend Başlatma
```bash
cd /workspace/backend
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### API Endpoints
- `GET /api/tours` - Tur listesi
- `GET /api/tours/{id}` - Tur detayı
- `GET /api/categories` - Kategoriler
- `POST /api/auth/login` - Giriş
- `POST /api/auth/register` - Kayıt
- Ve daha fazlası...

---

## 📊 Karşılaştırma

| Özellik | Modern React | Next.js | Vue.js | Mevcut Frontend |
|---------|-------------|---------|--------|-----------------|
| Hız | ⚡⚡⚡ | ⚡⚡ | ⚡⚡⚡ | ⚡ |
| SEO | ⚡⚡ | ⚡⚡⚡ | ⚡⚡ | ⚡ |
| TypeScript | ✅ | ✅ | ✅ | ❌ |
| Bundle Size | Küçük | Orta | Küçük | Büyük |
| Learning Curve | Kolay | Orta | Kolay | Kolay |

---

## 🎯 Hangi Frontend'i Kullanmalıyım?

### Modern React (Önerilir) ✨
- Hızlı geliştirme istiyorsanız
- Modern tooling seviyorsanız
- SPA yeterli ise
- **ŞU AN KULLANIMA HAZIR**

### Next.js
- SEO çok önemli ise
- Server-side rendering gerekirse
- Blog/içerik sitesi için
- **YAKINDA**

### Vue.js
- Vue ekosistemini seviyorsanız
- Daha basit syntax istiyorsanız
- Küçük öğrenme eğrisi
- **YAKINDA**

### Mevcut Frontend
- Hemen kullanıma hazır
- Değişiklik yapmak istemiyorsanız
- **MEVCUT**

---

## 📝 Notlar

1. **Backend bağımlılığı**: Tüm frontend'ler aynı backend API'yi kullanır
2. **Environment**: `.env` dosyalarını oluşturmayı unutmayın
3. **CORS**: Backend CORS ayarları yapılmalı
4. **Port çakışması**: Her frontend farklı port kullanır

---

## 🐛 Sorun Giderme

### Port zaten kullanımda
```bash
# Port'u öldür
lsof -ti:5173 | xargs kill -9

# Veya farklı port kullan
npm run dev -- --port 3001
```

### Backend'e bağlanamıyor
1. Backend'in çalıştığından emin olun
2. CORS ayarlarını kontrol edin
3. `.env` dosyasındaki API URL'ini kontrol edin

### Build hatası
```bash
# node_modules'ü temizle
rm -rf node_modules
npm install

# Cache'i temizle
npm run build -- --force
```

---

## 🚀 Sonraki Adımlar

1. ✅ Modern React Frontend - **TAMAMLANDI**
2. 🔄 Next.js Frontend - Başlanıyor
3. 🔄 Vue.js Frontend - Sırada
4. 🔄 Mevcut frontend iyileştirme - Sonda

---

**Hazırlayan**: AI Assistant  
**Tarih**: 2025-10-19  
**Versiyon**: 1.0
