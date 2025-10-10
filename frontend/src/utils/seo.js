// SEO Meta Tag Management Utility

export const updateSEOTags = ({
  title,
  description,
  keywords,
  ogImage,
  canonicalUrl,
  structuredData
}) => {
  // Update document title
  if (title) {
    document.title = title;
  }

  // Update meta description
  updateMetaTag('name', 'description', description);
  
  // Update keywords
  if (keywords) {
    updateMetaTag('name', 'keywords', keywords);
  }

  // Update Open Graph tags
  updateMetaTag('property', 'og:title', title);
  updateMetaTag('property', 'og:description', description);
  updateMetaTag('property', 'og:url', canonicalUrl || window.location.href);
  updateMetaTag('property', 'og:type', 'website');
  updateMetaTag('property', 'og:site_name', 'Mavibilet');
  
  if (ogImage) {
    updateMetaTag('property', 'og:image', ogImage);
  }

  // Update Twitter Card tags
  updateMetaTag('name', 'twitter:card', 'summary_large_image');
  updateMetaTag('name', 'twitter:title', title);
  updateMetaTag('name', 'twitter:description', description);
  if (ogImage) {
    updateMetaTag('name', 'twitter:image', ogImage);
  }

  // Update canonical URL
  if (canonicalUrl) {
    updateCanonicalURL(canonicalUrl);
  }

  // Add structured data (JSON-LD)
  if (structuredData) {
    updateStructuredData(structuredData);
  }
};

const updateMetaTag = (attribute, attributeValue, content) => {
  if (!content) return;
  
  let element = document.querySelector(`meta[${attribute}="${attributeValue}"]`);
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, attributeValue);
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', content);
};

const updateCanonicalURL = (url) => {
  let canonical = document.querySelector('link[rel="canonical"]');
  
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  
  canonical.setAttribute('href', url);
};

const updateStructuredData = (data) => {
  // Remove existing structured data
  const existingScript = document.querySelector('script[type="application/ld+json"]');
  if (existingScript) {
    existingScript.remove();
  }

  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
};

// SEO Templates for different page types
export const getSEOData = {
  homepage: () => ({
    title: 'Mavibilet - Mavi Yolculuk Turları | Kabin Kiralama ve Günübirlik Tekne Turları',
    description: 'Türkiye\'nin en güzel koylarında mavi yolculuk turları, kabin kiralama ve günübirlik tekne turları. Profesyonel kaptan eşliğinde unutulmaz tatil deneyimi yaşayın.',
    keywords: 'mavi yolculuk, kabin kiralama, tekne turu, günübirlik tur, bodrum tekne turu, göcek turu, marmaris tekne, yacht charter',
    canonicalUrl: window.location.origin,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Mavibilet",
      "description": "Mavi yolculuk turları ve kabin kiralama hizmetleri",
      "url": window.location.origin,
      "logo": `${window.location.origin}/mavibilet-logo.png`,
      "sameAs": [
        "https://www.instagram.com/mavibilet",
        "https://www.facebook.com/mavibilet"
      ]
    }
  }),

  tours: ({ totalTours = 0 } = {}) => ({
    title: 'Tüm Turlar - Mavibilet | Mavi Yolculuk ve Tekne Turları Listesi',
    description: `${totalTours} farklı mavi yolculuk turu seçeneği. Bodrum, Göcek, Marmaris, İstanbul ve daha fazla destinasyonda tekne turları ve kabin kiralama imkanları.`,
    keywords: 'mavi yolculuk turları, tekne turu listesi, kabin kiralama, günübirlik tur, bodrum marmaris göcek turları',
    canonicalUrl: `${window.location.origin}/turlar`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Mavi Yolculuk Turları",
      "description": "Türkiye'nin en güzel destinasyonlarında tekne turları",
      "url": `${window.location.origin}/turlar`,
      "numberOfItems": totalTours
    }
  }),

  category: ({ categoryTitle, categorySlug, tourCount = 0 }) => ({
    title: `${categoryTitle} Turları - Mavibilet | En İyi ${categoryTitle} Tekne Turları`,
    description: `${categoryTitle} kategorisinde ${tourCount} farklı tur seçeneği. Profesyonel rehberlik ve konforlu tekne ile ${categoryTitle.toLowerCase()} turlarında unutulmaz anılar biriktirin.`,
    keywords: `${categoryTitle.toLowerCase()} turları, ${categoryTitle.toLowerCase()} tekne turu, mavi yolculuk ${categoryTitle.toLowerCase()}, kabin kiralama`,
    canonicalUrl: `${window.location.origin}/${categorySlug}`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": `${categoryTitle} Turları`,
      "description": `${categoryTitle} kategorisindeki tekne turları`,
      "url": `${window.location.origin}/${categorySlug}`,
      "numberOfItems": tourCount
    }
  }),

  subcategory: ({ locationName, categoryTitle, categorySlug, locationSlug, tourCount = 0 }) => ({
    title: `${locationName} ${categoryTitle} Turları - Mavibilet | ${locationName} Tekne Turları`,
    description: `${locationName} bölgesindeki en güzel ${categoryTitle.toLowerCase()} turları. ${tourCount} farklı seçenek ile ${locationName}'da unutulmaz mavi yolculuk deneyimi yaşayın.`,
    keywords: `${locationName} ${categoryTitle.toLowerCase()}, ${locationName} tekne turu, ${locationName} mavi yolculuk, ${locationName} kabin kiralama, ${categoryTitle.toLowerCase()} ${locationName}`,
    canonicalUrl: `${window.location.origin}/${categorySlug}/${locationSlug}`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": `${locationName} ${categoryTitle} Turları`,
      "description": `${locationName} bölgesindeki ${categoryTitle.toLowerCase()} turları`,
      "url": `${window.location.origin}/${categorySlug}/${locationSlug}`,
      "numberOfItems": tourCount,
      "geo": {
        "@type": "GeoCoordinates",
        "name": locationName
      }
    }
  }),

  tourDetail: ({ tour }) => ({
    title: `${tour.title} - Mavibilet | ${tour.location} ${tour.category} Turu`,
    description: `${tour.title}. ${tour.short_description || ''} ${tour.location} bölgesinde ${tour.category.toLowerCase()} turu. ${tour.minimum_price ? `₺${tour.minimum_price.toLocaleString('tr-TR')}` : ''} den başlayan fiyatlarla.`,
    keywords: `${tour.title}, ${tour.location} ${tour.category.toLowerCase()}, ${tour.location} tekne turu, mavi yolculuk ${tour.location}, kabin kiralama ${tour.location}`,
    canonicalUrl: `${window.location.origin}/turlar/${tour.slug || tour.title.toLowerCase().replace(/\s+/g, '-')}`,
    ogImage: tour.images?.[0],
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": tour.title,
      "description": tour.short_description,
      "image": tour.images?.[0],
      "brand": {
        "@type": "Brand",
        "name": "Mavibilet"
      },
      "offers": {
        "@type": "Offer",
        "price": tour.minimum_price,
        "priceCurrency": "TRY",
        "availability": "https://schema.org/InStock",
        "url": `${window.location.origin}/turlar/${tour.slug || tour.title.toLowerCase().replace(/\s+/g, '-')}`
      },
      "aggregateRating": tour.rating ? {
        "@type": "AggregateRating",
        "ratingValue": tour.rating,
        "reviewCount": tour.review_count || 1
      } : null
    }
  })
};