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

// Modern SEO Templates - Hierarchical Structure Optimized
export const getSEOData = {
  homepage: () => ({
    title: 'Mavibilet - Türkiye\'nin En İyi Mavi Yolculuk Platformu | Tekne Turları ve Kabin Kiralama',
    description: 'Türkiye\'nin 4 denizindeki en güzel rotaları keşfedin. Mavi yolculuk turları, kabin kiralama ve günübirlik tekne turları. 500+ tur seçeneği, profesyonel kaptan kadrosu.',
    keywords: 'mavi yolculuk, tekne turu, kabin kiralama, günübirlik tur, bodrum marmaris göcek antalya, yacht charter, deniz tatili, tekne kiralama',
    canonicalUrl: window.location.origin,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "TravelAgency",
      "name": "Mavibilet",
      "alternateName": "Mavi Bilet",
      "description": "Türkiye'nin en kapsamlı mavi yolculuk ve tekne turu platformu",
      "url": window.location.origin,
      "logo": `${window.location.origin}/mavibilet-logo.png`,
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "TR",
        "addressLocality": "Türkiye"
      },
      "sameAs": [
        "https://www.instagram.com/mavibilet",
        "https://www.facebook.com/mavibilet"
      ],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Mavi Yolculuk Turları",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "TouristTrip",
              "name": "Mavi Yolculuk Turları"
            }
          }
        ]
      }
    }
  }),

  tours: ({ totalTours = 0, appliedFilters = {} } = {}) => {
    const filterText = Object.keys(appliedFilters).length > 0 ? ' - Filtrelenmiş Sonuçlar' : '';
    const locationText = appliedFilters.location ? ` ${appliedFilters.location}` : '';
    
    return {
      title: `Tüm Turlar${locationText} - Mavibilet | ${totalTours} Mavi Yolculuk Turu${filterText}`,
      description: `${totalTours} farklı mavi yolculuk turu${locationText ? ` ${locationText} bölgesinde` : ''}. Kabin kiralama, günübirlik tekne turları ve özel rotalar. Anında rezervasyon, %100 güvenli ödeme.`,
      keywords: `mavi yolculuk turları${locationText}, tekne turu listesi, kabin kiralama, günübirlik tur, bodrum marmaris göcek antalya turları, deniz tatili, yacht charter`,
      canonicalUrl: `${window.location.origin}/turlar`,
      structuredData: {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": `Mavi Yolculuk Turları${locationText}`,
        "description": `Türkiye'nin en güzel destinasyonlarında ${totalTours} tekne turu`,
        "url": `${window.location.origin}/turlar`,
        "numberOfItems": totalTours,
        "itemListElement": []
      }
    };
  },

  category: ({ categoryTitle, categorySlug, tourCount = 0, categoryIcon = '🚢' } = {}) => ({
    title: `${categoryTitle} Turları - Mavibilet | ${tourCount} ${categoryTitle} Turu ve Kabin Kiralama`,
    description: `${categoryTitle} kategorisinde ${tourCount} farklı tur seçeneği. Profesyonel kaptan kadrosu, modern tekneler ve güvenli rezervasyon sistemi ile ${categoryTitle.toLowerCase()} turlarında unutulmaz deneyimler.`,
    keywords: `${categoryTitle.toLowerCase()} turları, ${categoryTitle.toLowerCase()} tekne turu, mavi yolculuk ${categoryTitle.toLowerCase()}, ${categoryTitle.toLowerCase()} kabin kiralama, deniz tatili ${categoryTitle.toLowerCase()}`,
    canonicalUrl: `${window.location.origin}/${categorySlug}`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      "name": `${categoryTitle} Turları`,
      "description": `${categoryTitle} kategorisindeki mavi yolculuk turları`,
      "url": `${window.location.origin}/${categorySlug}`,
      "touristType": "Deniz Tutkunları",
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": `${categoryTitle} Turları`,
        "itemListElement": [],
        "numberOfItems": tourCount
      }
    }
  }),

  subcategory: ({ locationName, categoryTitle, categorySlug, locationSlug, tourCount = 0 } = {}) => ({
    title: `${locationName} ${categoryTitle} Turları - Mavibilet | ${tourCount} Tur Seçeneği`,
    description: `${locationName} bölgesindeki premium ${categoryTitle.toLowerCase()} turları. ${tourCount} farklı tur seçeneği, profesyonel rehberlik ve modern tekne filosu ile ${locationName}'da unutulmaz mavi yolculuk deneyimi.`,
    keywords: `${locationName} ${categoryTitle.toLowerCase()}, ${locationName} tekne turu, ${locationName} mavi yolculuk, ${locationName} kabin kiralama, ${categoryTitle.toLowerCase()} ${locationName}, ${locationName} deniz turu`,
    canonicalUrl: `${window.location.origin}/${categorySlug}/${locationSlug}`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      "name": `${locationName} ${categoryTitle} Turları`,
      "description": `${locationName} bölgesindeki ${categoryTitle.toLowerCase()} mavi yolculuk turları`,
      "url": `${window.location.origin}/${categorySlug}/${locationSlug}`,
      "geo": {
        "@type": "GeoCoordinates",
        "name": locationName,
        "addressCountry": "TR"
      },
      "touristType": ["Deniz Tutkunları", "Tatil Severler"],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": `${locationName} ${categoryTitle} Turları`,
        "itemListElement": [],
        "numberOfItems": tourCount
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