// Mock API for search suggestions
// In a real application, these would be actual API endpoints

const mockLocations = [
  { id: 1, name: 'Muğla, Fethiye', region: 'Akdeniz Bölgesi', type: 'location', tours: 12 },
  { id: 2, name: 'Muğla, Göcek', region: 'Akdeniz Bölgesi', type: 'location', tours: 8 },
  { id: 3, name: 'Antalya, Kaş', region: 'Akdeniz Bölgesi', type: 'location', tours: 15 },
  { id: 4, name: 'İzmir, Çeşme', region: 'Ege Bölgesi', type: 'location', tours: 6 },
  { id: 5, name: 'Muğla, Bodrum', region: 'Ege Bölgesi', type: 'location', tours: 10 },
  { id: 6, name: 'Balıkesir, Ayvalık', region: 'Ege Bölgesi', type: 'location', tours: 4 },
  { id: 7, name: 'İstanbul, Adalar', region: 'Marmara Bölgesi', type: 'location', tours: 7 },
  { id: 8, name: 'Çanakkale, Bozcaada', region: 'Marmara Bölgesi', type: 'location', tours: 3 }
];

const mockCategories = [
  { id: 1, name: 'Kültürel Turlar', type: 'category', tours: 25 },
  { id: 2, name: 'Doğa Turları', type: 'category', tours: 18 },
  { id: 3, name: 'Macera Turları', type: 'category', tours: 12 },
  { id: 4, name: 'Şehir Turları', type: 'category', tours: 20 },
  { id: 5, name: 'Tarihi Turlar', type: 'category', tours: 15 },
  { id: 6, name: 'Gastronomi Turları', type: 'category', tours: 8 },
  { id: 7, name: 'Deniz Turları', type: 'category', tours: 30 },
  { id: 8, name: 'Keşif Turları', type: 'category', tours: 10 }
];

const mockTours = [
  {
    id: 1,
    name: 'Fethiye – Göcek 3 Gece 4 Gün Kabin Turu',
    location: 'Muğla, Fethiye',
    category: 'Deniz Turları',
    type: 'tour',
    price: 12000,
    rating: 4.8,
    tours: 1,
    trending: true
  },
  {
    id: 2,
    name: 'Bodrum Koyları Keşif Turu',
    location: 'Muğla, Bodrum',
    category: 'Keşif Turları',
    type: 'tour',
    price: 8500,
    rating: 4.6,
    tours: 1
  },
  {
    id: 3,
    name: 'Kaş Dalış ve Doğa Turu',
    location: 'Antalya, Kaş',
    category: 'Macera Turları',
    type: 'tour',
    price: 6500,
    rating: 4.9,
    tours: 1,
    trending: true
  },
  {
    id: 4,
    name: 'Çeşme Gastronomi Turu',
    location: 'İzmir, Çeşme',
    category: 'Gastronomi Turları',
    type: 'tour',
    price: 4500,
    rating: 4.7,
    tours: 1
  }
];

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock API for search suggestions
 */
export const fetchSearchSuggestions = async (query, type = 'location') => {
  await delay(300 + Math.random() * 200); // 300-500ms delay
  
  if (!query || query.length < 2) {
    return { suggestions: [] };
  }
  
  const searchTerm = query.toLowerCase();
  let results = [];
  
  // Search based on type
  switch (type) {
    case 'location':
      results = mockLocations.filter(location =>
        location.name.toLowerCase().includes(searchTerm) ||
        location.region.toLowerCase().includes(searchTerm)
      );
      break;
      
    case 'category':
      results = mockCategories.filter(category =>
        category.name.toLowerCase().includes(searchTerm)
      );
      // Also search tours and suggest their categories
      const tourCategories = mockTours
        .filter(tour => tour.name.toLowerCase().includes(searchTerm))
        .map(tour => ({
          id: `tour-cat-${tour.id}`,
          name: tour.category,
          type: 'category',
          tours: 1
        }));
      results = [...results, ...tourCategories];
      break;
      
    case 'general':
    default:
      // Search across all types
      const locations = mockLocations.filter(location =>
        location.name.toLowerCase().includes(searchTerm)
      );
      const categories = mockCategories.filter(category =>
        category.name.toLowerCase().includes(searchTerm)
      );
      const tours = mockTours.filter(tour =>
        tour.name.toLowerCase().includes(searchTerm)
      );
      
      results = [...locations, ...categories, ...tours];
      break;
  }
  
  // Sort by relevance (exact matches first, then partial matches)
  results.sort((a, b) => {
    const aName = (a.name || a.title || '').toLowerCase();
    const bName = (b.name || b.title || '').toLowerCase();
    
    const aExact = aName.startsWith(searchTerm);
    const bExact = bName.startsWith(searchTerm);
    
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    
    return aName.localeCompare(bName);
  });
  
  // Limit results
  const limitedResults = results.slice(0, 10);
  
  return {
    suggestions: limitedResults,
    total: results.length,
    query: query
  };
};

/**
 * Mock API for reverse geocoding
 */
export const reverseGeocode = async (latitude, longitude) => {
  await delay(500 + Math.random() * 300);
  
  // Mock response based on coordinates
  // In reality, this would call a geocoding service like Google Maps API
  const mockLocations = [
    { lat: 36.6167, lng: 29.1167, location: 'Muğla, Fethiye' },
    { lat: 36.7548, lng: 28.9416, location: 'Muğla, Göcek' },
    { lat: 36.2048, lng: 29.6416, location: 'Antalya, Kaş' },
    { lat: 38.3225, lng: 26.3065, location: 'İzmir, Çeşme' },
    { lat: 37.0348, lng: 27.4305, location: 'Muğla, Bodrum' }
  ];
  
  // Find closest location (simple distance calculation)
  let closest = mockLocations[0];
  let minDistance = Math.sqrt(
    Math.pow(latitude - closest.lat, 2) + Math.pow(longitude - closest.lng, 2)
  );
  
  for (const loc of mockLocations) {
    const distance = Math.sqrt(
      Math.pow(latitude - loc.lat, 2) + Math.pow(longitude - loc.lng, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closest = loc;
    }
  }
  
  return {
    location: closest.location,
    coordinates: { latitude, longitude },
    accuracy: 'approximate'
  };
};

/**
 * Mock popular searches and trending data
 */
export const getPopularSearches = async () => {
  await delay(200);
  
  return {
    popular: [
      { query: 'fethiye tekne turu', count: 1250 },
      { query: 'bodrum koy turu', count: 890 },
      { query: 'kaş dalış', count: 567 },
      { query: 'çeşme gastronomi', count: 445 }
    ],
    trending: [
      { query: 'göcek mavi tur', growth: 85 },
      { query: 'ayvalık kamp', growth: 72 },
      { query: 'bozcaada şarap', growth: 68 }
    ]
  };
};

/**
 * Search schema for validation
 */
export const searchSchema = {
  type: 'object',
  properties: {
    query: {
      type: 'string',
      minLength: 0,
      maxLength: 100,
      description: 'Search query text'
    },
    filters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'Location filter'
        },
        category: {
          type: 'string',
          description: 'Category filter'
        },
        dateRange: {
          type: 'object',
          properties: {
            start: {
              type: ['string', 'null'],
              format: 'date',
              description: 'Start date in ISO format'
            },
            end: {
              type: ['string', 'null'],
              format: 'date',
              description: 'End date in ISO format'
            }
          }
        },
        priceRange: {
          type: 'object',
          properties: {
            min: { type: 'number', minimum: 0 },
            max: { type: 'number', minimum: 0 }
          }
        }
      }
    },
    page: {
      type: 'integer',
      minimum: 1,
      default: 1
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 50,
      default: 20
    }
  },
  required: []
};