# Mobil Öncelikli Arama Komponenti

Airbnb tarzında, mobil öncelikli tasarıma sahip gelişmiş arama komponenti. Tour booking platformları için özel olarak tasarlanmış.

## 🚀 Özellikler

### Temel Özellikler
- **Mobil Öncelikli Tasarım**: Tam ekran bottom sheet davranışı
- **Klavye Güvenli Alan**: Klavye açıldığında otomatik alan ayarlama
- **Çoklu Arama Kriterleri**: Konum, kategori, tarih aralığı
- **Akıllı Öneriler**: Debounced API çağrıları ile performanslı öneriler
- **Son Aramalar**: localStorage ile kalıcı arama geçmişi

### Gelişmiş Özellikler  
- **GPS Konum Desteği**: Mevcut konum otomatik tespiti
- **i18n Desteği**: Türkçe/İngilizce çoklu dil desteği
- **Erişilebilirlik**: ARIA etiketleri ve klavye navigasyonu
- **Responsive Tasarım**: Tüm ekran boyutlarında optimum deneyim

### UI/UX Özellikleri
- **Bottom Sheet**: Smooth animasyonlu tam ekran modal
- **Skeleton Loading**: İçerik yüklenirken görsel geri bildirim
- **Error States**: Kullanıcı dostu hata mesajları
- **Empty States**: Boş durumlar için rehberlik

## 📦 Kurulum

### Gereksinimler
- React 16.8+
- Tailwind CSS 3.x
- Lucide React (iconlar için)

### Bağımlılıklar
```bash
npm install lucide-react
# veya
yarn add lucide-react
```

## 🔧 Kullanım

### Temel Kullanım

```jsx
import SearchBottomSheet from './components/search/SearchBottomSheet';

function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearch = (searchData) => {
    console.log('Arama verileri:', searchData);
    // API çağrısı yapın
    fetchTours(searchData);
  };

  return (
    <div>
      <button onClick={() => setIsSearchOpen(true)}>
        Ara
      </button>
      
      <SearchBottomSheet
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSearch={handleSearch}
        initialFilters={{
          location: 'Muğla, Fethiye',
          category: 'Deniz Turları'
        }}
      />
    </div>
  );
}
```

### Props

| Prop | Tip | Varsayılan | Açıklama |
|------|-----|------------|----------|
| `isOpen` | boolean | `false` | Modal görünürlük durumu |
| `onClose` | function | - | Modal kapatma callback'i |
| `onSearch` | function | - | Arama callback'i |
| `initialFilters` | object | `{}` | Başlangıç filtreleri |
| `className` | string | `""` | Ek CSS sınıfları |

### Arama Verisi Formatı

```javascript
{
  query: "fethiye tekne turu",
  filters: {
    location: "Muğla, Fethiye",
    category: "Deniz Turları", 
    dateRange: {
      start: "2024-06-15",
      end: "2024-06-18"
    }
  },
  timestamp: "2024-01-15T10:30:00Z"
}
```

## 🎨 Özelleştirme

### Tema Renkleri

Tailwind CSS sınıflarını kullanarak renkleri özelleştirin:

```jsx
<SearchBottomSheet
  className="custom-search-theme"
  // ... diğer props
/>
```

```css
.custom-search-theme {
  /* Ana renk paleti */
  --primary: 59 130 246; /* blue-500 */
  --secondary: 107 114 128; /* gray-500 */
  
  /* Buton stilleri */
  .search-button {
    @apply bg-purple-600 hover:bg-purple-700;
  }
}
```

### Özel Icon'lar

Lucide React icon'larını değiştirin:

```jsx
import { CustomSearch, CustomLocation } from './CustomIcons';

// SearchBottomSheet.js içinde
const iconMapping = {
  search: CustomSearch,
  location: CustomLocation,
  // ...
};
```

## 🌍 Çoklu Dil Desteği

### Dil Değiştirme

```jsx
import { useTranslation } from './hooks/useTranslation';

function LanguageToggle() {
  const { locale, changeLocale, availableLocales } = useTranslation();
  
  return (
    <select 
      value={locale} 
      onChange={(e) => changeLocale(e.target.value)}
    >
      {availableLocales.map(lang => (
        <option key={lang} value={lang}>
          {lang.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
```

### Yeni Dil Ekleme

`hooks/useTranslation.js` dosyasında translations objesine ekleyin:

```javascript
const translations = {
  // ... mevcut diller
  
  de: {
    'search.title': 'Touren suchen',
    'search.placeholder': 'Wohin möchten Sie reisen?',
    // ...
  }
};
```

## 🔌 API Entegrasyonu

### Mock API Yerine Gerçek API

```javascript
// api/search.js
export const fetchSearchSuggestions = async (query, type) => {
  const response = await fetch(`/api/search/suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, type })
  });
  
  return response.json();
};
```

### API Endpoint'leri

Gerekli backend endpoint'ler:

```
POST /api/search/suggestions
GET  /api/search/locations
GET  /api/search/categories  
POST /api/geocoding/reverse
GET  /api/search/popular
```

### Veri Modelleri

#### Suggestion Response
```json
{
  "suggestions": [
    {
      "id": 1,
      "name": "Muğla, Fethiye",
      "type": "location",
      "region": "Akdeniz Bölgesi", 
      "tours": 12,
      "trending": true
    }
  ],
  "total": 25,
  "query": "fethiye"
}
```

#### Search Request
```json
{
  "query": "fethiye tekne",
  "filters": {
    "location": "Muğla, Fethiye",
    "category": "Deniz Turları",
    "dateRange": {
      "start": "2024-06-15",
      "end": "2024-06-18"  
    },
    "priceRange": {
      "min": 1000,
      "max": 5000
    }
  },
  "page": 1,
  "limit": 20
}
```

## ♿ Erişilebilirlik

### ARIA Desteği

Komponent tam ARIA uyumludur:

```jsx
// Otomatik olarak eklenen ARIA etiketleri
<div role="dialog" aria-modal="true" aria-labelledby="search-title">
<input aria-label="Arama yapın" />
<button role="tab" aria-selected="true" />
```

### Klavye Navigasyonu

- `Tab`: Elementler arası geçiş
- `Enter/Space`: Buton aktivasyonu
- `Escape`: Modal kapatma
- `Arrow Keys`: Tab navigasyonu

### Ekran Okuyucu Desteği

Tüm etkileşimli elementlerin uygun etiketleri vardır:

```jsx
<button aria-label={t('search.clear')}>
<input aria-describedby="search-help" />
<div role="status" aria-live="polite">
```

## 🚀 Performans

### Debouncing

Arama girdisi 300ms debounce ile optimize edilmiştir:

```javascript
const debouncedSearchQuery = useDebounce(searchQuery, 300);
```

### Lazy Loading

Büyük listelerde sanal scrolling kullanın:

```jsx
import { FixedSizeList } from 'react-window';

const VirtualizedSuggestions = ({ suggestions }) => (
  <FixedSizeList
    height={300}
    itemCount={suggestions.length}
    itemSize={60}
  >
    {({ index, style }) => (
      <div style={style}>
        <SuggestionItem suggestion={suggestions[index]} />
      </div>
    )}
  </FixedSizeList>
);
```

### Memoization

Ağır hesaplamalar React.memo ile optimize edilmiştir:

```jsx
const CategoryPicker = React.memo(({ categories, onSelect }) => {
  // ...
});
```

## 🧪 Test Etme

### Unit Tests

```bash
npm test SearchBottomSheet
```

### Test Coverage

```bash
npm run test:coverage
```

### E2E Tests

```javascript
// cypress/integration/search.spec.js
describe('Search Flow', () => {
  it('should complete full search flow', () => {
    cy.visit('/');
    cy.get('[data-testid=search-button]').click();
    cy.get('[aria-label="Arama yapın"]').type('fethiye');
    cy.get('[role=button]').contains('Ara').click();
    cy.url().should('include', '/tours?search=fethiye');
  });
});
```

## 📱 Mobil Optimizasyon

### Viewport Meta Tag

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

### Safe Area

iOS cihazlarda safe area desteği:

```css
.search-bottom-sheet {
  padding-bottom: env(safe-area-inset-bottom);
}
```

### Touch Targets

Minimum 44px touch target boyutu garanti edilir:

```jsx
<button className="min-h-[44px] min-w-[44px]">
```

## 🔧 Troubleshooting

### Sık Karşılaşılan Sorunlar

**Problem**: Modal açılmıyor
```javascript
// Çözüm: z-index kontrolü
.search-modal { z-index: 9999; }
```

**Problem**: Klavye safe area çalışmıyor  
```javascript
// Çözüm: visualViewport API desteği kontrolü
if (window.visualViewport) {
  // safe area logic
}
```

**Problem**: Öneriler yüklenmiyor
```javascript
// Çözüm: CORS ve API endpoint kontrolü  
const response = await fetch(apiUrl, {
  headers: { 'Content-Type': 'application/json' }
});
```

### Debug Modu

Development ortamında debug bilgileri:

```javascript
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Search query:', searchQuery);
  console.log('Active filters:', filters);
}
```

## 📄 Lisans

MIT License - detaylar için LICENSE dosyasına bakın.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📞 Destek

- 📧 Email: dev@tourplatform.com
- 🐛 Issues: GitHub Issues
- 📖 Docs: [Documentation Site](https://docs.tourplatform.com)