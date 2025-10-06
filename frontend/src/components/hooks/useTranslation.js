import { useState, useEffect } from 'react';

// Mock translation data - in a real app, this would come from i18n library
const translations = {
  tr: {
    // Common
    'common.close': 'Kapat',
    'common.clear': 'Temizle',
    'common.retry': 'Tekrar Dene',
    'common.tours': 'tur',
    'common.trending': 'Trend',
    
    // Search
    'search.title': 'Tur Ara',
    'search.placeholder': 'Nereye gitmek istiyorsunuz?',
    'search.button': 'Ara',
    'search.clear': 'Temizle',
    'search.input.label': 'Arama yapın',
    'search.error.suggestions': 'Öneriler yüklenirken hata oluştu',
    
    // Search tabs
    'search.tabs.location': 'Konum',
    'search.tabs.category': 'Kategori', 
    'search.tabs.date': 'Tarih',
    
    // Location
    'location.current.button': 'Mevcut konumumu kullan',
    'location.current.title': 'Mevcut Konum',
    'location.current.subtitle': 'GPS ile konumunuzu tespit edin',
    'location.current.getting': 'Konum alınıyor...',
    'location.popular.title': 'Popüler Destinasyonlar',
    'location.suggestions.title': 'Önerilen Konumlar',
    'location.empty': 'Konum bulunamadı',
    'location.error.noSupport': 'Tarayıcınız konum hizmetlerini desteklemiyor',
    'location.error.permission': 'Konum izni verilmedi',
    'location.error.geocoding': 'Konum tespit edilemedi',
    
    // Categories
    'categories.cultural': 'Kültürel',
    'categories.nature': 'Doğa',
    'categories.adventure': 'Macera',
    'categories.city': 'Şehir',
    'categories.historical': 'Tarihi',
    'categories.gastronomy': 'Gastronomi',
    'categories.sea': 'Deniz',
    'categories.exploration': 'Keşif',
    'categories.popular': 'Popüler Kategoriler',
    'categories.all': 'Tüm Kategoriler',
    'categories.suggestions': 'Önerilen Kategoriler',
    'categories.custom': 'Özel Kategori',
    'categories.customPlaceholder': 'Kategori adı yazın...',
    'categories.popularTag': 'Popüler',
    
    // Date Range
    'dateRange.selectDates': 'Tarih seçin',
    'dateRange.selectStartDate': 'Başlangıç tarihi seçin',
    'dateRange.selectEndDate': 'Bitiş tarihi seçin',
    'dateRange.thisWeekend': 'Bu Hafta Sonu',
    'dateRange.nextWeek': 'Gelecek Hafta',
    'dateRange.nextMonth': 'Gelecek Ay',
    'dateRange.flexible': 'Esnek',
    'dateRange.clear': 'Tarihleri Temizle',
    'dateRange.previousMonth': 'Önceki ay',
    'dateRange.nextMonth': 'Sonraki ay',
    
    // Recent Searches
    'search.recent.title': 'Son Aramalar',
    'search.recent.clear': 'Temizle',
    'search.recent.clearAll': 'Tümünü Temizle',
    'search.recent.remove': 'Kaldır',
    'search.recent.seeAll': 'Tümünü Gör',
    'search.recent.noFilters': 'Filtre yok',
    
    // Suggestions
    'search.suggestions.title': 'Öneriler',
    'search.suggestions.loading': 'Öneriler yükleniyor...',
    'search.suggestions.empty': 'Öneri bulunamadı',
    'search.suggestions.tours': 'Turlar',
    'search.suggestions.locations': 'Konumlar',
    'search.suggestions.categories': 'Kategoriler',
    'search.suggestions.general': 'Genel',
    'search.suggestions.showMore': 'Daha Fazla Göster',
    
    // Time
    'time.justNow': 'Az önce',
    'time.hoursAgo': '{count} saat önce',
    'time.daysAgo': '{count} gün önce'
  },
  
  en: {
    // Common
    'common.close': 'Close',
    'common.clear': 'Clear',
    'common.retry': 'Retry',
    'common.tours': 'tours',
    'common.trending': 'Trending',
    
    // Search
    'search.title': 'Search Tours',
    'search.placeholder': 'Where would you like to go?',
    'search.button': 'Search',
    'search.clear': 'Clear',
    'search.input.label': 'Search',
    'search.error.suggestions': 'Error loading suggestions',
    
    // Search tabs
    'search.tabs.location': 'Location',
    'search.tabs.category': 'Category',
    'search.tabs.date': 'Date',
    
    // Location
    'location.current.button': 'Use current location',
    'location.current.title': 'Current Location',
    'location.current.subtitle': 'Detect your location with GPS',
    'location.current.getting': 'Getting location...',
    'location.popular.title': 'Popular Destinations',
    'location.suggestions.title': 'Suggested Locations',
    'location.empty': 'No locations found',
    'location.error.noSupport': 'Your browser does not support location services',
    'location.error.permission': 'Location permission denied',
    'location.error.geocoding': 'Unable to detect location',
    
    // Categories
    'categories.cultural': 'Cultural',
    'categories.nature': 'Nature',
    'categories.adventure': 'Adventure',
    'categories.city': 'City',
    'categories.historical': 'Historical',
    'categories.gastronomy': 'Gastronomy',
    'categories.sea': 'Sea',
    'categories.exploration': 'Exploration',
    'categories.popular': 'Popular Categories',
    'categories.all': 'All Categories',
    'categories.suggestions': 'Suggested Categories',
    'categories.custom': 'Custom Category',
    'categories.customPlaceholder': 'Enter category name...',
    'categories.popularTag': 'Popular',
    
    // Date Range
    'dateRange.selectDates': 'Select dates',
    'dateRange.selectStartDate': 'Select start date',
    'dateRange.selectEndDate': 'Select end date',
    'dateRange.thisWeekend': 'This Weekend',
    'dateRange.nextWeek': 'Next Week',
    'dateRange.nextMonth': 'Next Month',
    'dateRange.flexible': 'Flexible',
    'dateRange.clear': 'Clear Dates',
    'dateRange.previousMonth': 'Previous month',
    'dateRange.nextMonth': 'Next month',
    
    // Recent Searches
    'search.recent.title': 'Recent Searches',
    'search.recent.clear': 'Clear',
    'search.recent.clearAll': 'Clear All',
    'search.recent.remove': 'Remove',
    'search.recent.seeAll': 'See All',
    'search.recent.noFilters': 'No filters',
    
    // Suggestions
    'search.suggestions.title': 'Suggestions',
    'search.suggestions.loading': 'Loading suggestions...',
    'search.suggestions.empty': 'No suggestions found',
    'search.suggestions.tours': 'Tours',
    'search.suggestions.locations': 'Locations',
    'search.suggestions.categories': 'Categories',
    'search.suggestions.general': 'General',
    'search.suggestions.showMore': 'Show More',
    
    // Time
    'time.justNow': 'Just now',
    'time.hoursAgo': '{count} hours ago',
    'time.daysAgo': '{count} days ago'
  }
};

export const useTranslation = () => {
  const [locale, setLocale] = useState('tr'); // Default to Turkish
  
  useEffect(() => {
    // Get locale from localStorage or browser
    const savedLocale = localStorage.getItem('tour_app_locale');
    const browserLocale = navigator.language.split('-')[0];
    
    if (savedLocale && translations[savedLocale]) {
      setLocale(savedLocale);
    } else if (translations[browserLocale]) {
      setLocale(browserLocale);
    }
  }, []);
  
  const t = (key, params = {}) => {
    const translation = translations[locale]?.[key] || translations.tr[key] || key;
    
    // Simple parameter replacement
    return translation.replace(/\{(\w+)\}/g, (match, param) => {
      return params[param] !== undefined ? params[param] : match;
    });
  };
  
  const changeLocale = (newLocale) => {
    if (translations[newLocale]) {
      setLocale(newLocale);
      localStorage.setItem('tour_app_locale', newLocale);
    }
  };
  
  return {
    t,
    locale,
    changeLocale,
    availableLocales: Object.keys(translations)
  };
};