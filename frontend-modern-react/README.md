# Modern React Frontend - TurSat

Modern ve performanslı bir tur rezervasyon platformu frontend'i.

## 🚀 Teknolojiler

- **React 18** - UI kütüphanesi
- **TypeScript** - Tip güvenliği
- **Vite** - Hızlı geliştirme ortamı
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Server state yönetimi
- **Zustand** - Client state yönetimi
- **React Router v6** - Sayfa yönlendirme
- **Axios** - HTTP client
- **Lucide React** - Modern ikonlar
- **React Hot Toast** - Bildirimlerm

## 📦 Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Production build
npm run build

# Build'i önizle
npm run preview
```

## 🌐 Ortam Değişkenleri

`.env` dosyasını oluşturun:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## 📁 Proje Yapısı

```
src/
├── components/          # React componentleri
│   ├── ui/             # Temel UI componentleri
│   └── Layout.tsx      # Ana layout
├── pages/              # Sayfa componentleri
│   ├── HomePage.tsx
│   ├── ToursPage.tsx
│   └── TourDetailPage.tsx
├── lib/
│   ├── api/           # API servisleri
│   │   ├── client.ts  # Axios client
│   │   └── services.ts
│   ├── hooks/         # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useTours.ts
│   │   └── useBookings.ts
│   ├── store/         # Zustand stores
│   │   ├── authStore.ts
│   │   └── cartStore.ts
│   └── utils.ts       # Yardımcı fonksiyonlar
├── types/             # TypeScript tipleri
│   └── index.ts
├── App.tsx            # Ana uygulama
└── main.tsx           # Giriş noktası
```

## ✨ Özellikler

### Mevcut Özellikler
- 🏠 Ana sayfa ile öne çıkan turlar
- 📋 Tur listeleme ve filtreleme
- 🔍 Tur detay sayfası
- 🎨 Modern ve responsive tasarım
- 🌙 Dark mode desteği (CSS variables ile)
- 📱 Mobil uyumlu
- ⚡ Hızlı ve performanslı

### Geliştirilecek Özellikler
- 🔐 Kullanıcı girişi ve kaydı
- 🛒 Sepet sistemi
- ❤️ Favori turlar
- 📅 Rezervasyon sistemi
- 💳 Ödeme entegrasyonu
- 👤 Kullanıcı profili
- 🔔 Bildirimler
- 📊 Admin paneli

## 🎨 Tasarım Sistemi

Proje shadcn/ui tasarım sistemini kullanır:
- Tailwind CSS ile özelleştirilebilir
- Radix UI primitives ile erişilebilir
- Modern ve temiz arayüz

## 🔧 Geliştirme

### Yeni Bir Sayfa Eklemek

1. `src/pages/` altında yeni component oluşturun
2. `src/App.tsx` içinde route ekleyin
3. Gerekirse API servislerini `src/lib/api/services.ts` içine ekleyin

### Yeni Bir API Servisi Eklemek

```typescript
// src/lib/api/services.ts
export const myService = {
  getData: () => apiClient.get<MyType>('/my-endpoint'),
}

// src/lib/hooks/useMyData.ts
export function useMyData() {
  return useQuery({
    queryKey: ['my-data'],
    queryFn: () => myService.getData(),
  })
}
```

## 🚀 Deployment

### Vercel
```bash
npm run build
# Vercel dashboard'dan deploy edin
```

### Netlify
```bash
npm run build
# dist/ klasörünü deploy edin
```

### Docker
```bash
docker build -t frontend-modern-react .
docker run -p 3000:3000 frontend-modern-react
```

## 📝 Lisans

MIT
