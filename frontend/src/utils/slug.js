// Slug utility functions for SEO-friendly URLs

export const createSlug = (title) => {
  if (!title) return '';
  
  return title
    .toLowerCase()
    // Turkish characters to Latin
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u') 
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ş/g, 'S')
    .replace(/İ/g, 'I')
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C')
    // Remove special characters and spaces
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

export const extractIdFromSlug = (slug) => {
  // If slug contains UUID pattern, extract it
  const uuidRegex = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/;
  const match = slug.match(uuidRegex);
  return match ? match[0] : null;
};

export const createSeoTitle = (tourTitle, location) => {
  return `${tourTitle} | ${location} Kabin Kiralama - DijipalTour`;
};

export const createSeoDescription = (tourTitle, location, shortDescription, price) => {
  return `${tourTitle} ${location} bölgesinde kabin kiralama. ${shortDescription} ${price ? `₺${price.toLocaleString('tr-TR')} den başlayan fiyatlarla.` : ''} Hemen rezervasyon yapın!`;
};