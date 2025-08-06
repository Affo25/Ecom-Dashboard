// config/theme2.config.js
// Static Theme2 Configuration for CMS
// This configuration is used as a fallback when database is empty
// You can modify these values and then save them to database through the CMS interface

const CMS_STATIC_CONFIG = {
  theme_name: 'theme2',

  // Banner Section - Main promotional area
  banner: {
    images: [
      {
        id: 'banner1',
        url: '/uploads/banner/sample-banner.jpg', // Will be converted to localhost:5009 URL
        alt: 'Welcome to our store',
        title: 'Main Banner',
        order: 0,
      },
    ],
    headline: 'Welcome to Our Amazing Store',
    subheadline: 'Discover the best products at unbeatable prices',
    ctaText: 'Shop Now',
    ctaLink: '/products',
  },

  // Logo & Branding Section
  logo: {
    logoUrl: '/uploads/logos/sample-logo.png', // Will be converted to localhost:5009 URL
    logoAlt: 'Company Logo',
    faviconUrl: '/favicon.ico',
    brandColors: {
      primary: '#7c3aed',    // Purple - Primary brand color
      secondary: '#6366f1',  // Indigo - Secondary brand color  
      accent: '#f59e0b',     // Amber - Accent color for highlights
    },
  },

  // Text Content Section - All website text content
  textContent: {
    companyName: 'E-Commerce Store',
    tagline: 'Your One-Stop Shopping Destination',
    aboutUs: 'We are dedicated to providing high-quality products and exceptional customer service. Our mission is to make online shopping easy, convenient, and enjoyable for everyone.',
    mission: 'To deliver quality products and exceptional service that exceeds customer expectations.',
    vision: 'To be the most trusted and loved online shopping destination globally.',
    values: [
      {
        id: 'quality',
        title: 'Quality First',
        description: 'We ensure every product meets our high standards before reaching you.',
      },
      {
        id: 'customer',
        title: 'Customer Focus',
        description: 'Your satisfaction is our priority, and we go above and beyond to serve you.',
      },
      {
        id: 'innovation',
        title: 'Innovation',
        description: 'We continuously improve our services and embrace new technologies.',
      },
    ],
  },

  // Navigation Menus Section
  menus: {
    headerMenu: [
      { id: 'home', label: 'Home', url: '/', order: 0 },
      { id: 'products', label: 'Products', url: '/products', order: 1 },
      { id: 'categories', label: 'Categories', url: '/categories', order: 2 },
      { id: 'about', label: 'About Us', url: '/about', order: 3 },
      { id: 'contact', label: 'Contact', url: '/contact', order: 4 },
    ],
    footerMenu: [
      { id: 'privacy', label: 'Privacy Policy', url: '/privacy', order: 0 },
      { id: 'terms', label: 'Terms of Service', url: '/terms', order: 1 },
      { id: 'returns', label: 'Return Policy', url: '/returns', order: 2 },
      { id: 'shipping', label: 'Shipping Info', url: '/shipping', order: 3 },
      { id: 'faq', label: 'FAQ', url: '/faq', order: 4 },
    ],
  },

  // Footer Section
  footer: {
    copyright: '© 2025 E-Commerce Store. All rights reserved.',
    contactInfo: {
      address: '123 Commerce Street, Business District, City 12345',
      phone: '+1 (555) 123-4567',
      email: 'hello@ecommercestore.com',
      workingHours: 'Monday - Friday: 9:00 AM - 6:00 PM',
    },
    socialLinks: {
      facebook: 'https://facebook.com/ecommercestore',
      twitter: 'https://twitter.com/ecommercestore',
      instagram: 'https://instagram.com/ecommercestore',
      linkedin: 'https://linkedin.com/company/ecommercestore',
      youtube: 'https://youtube.com/@ecommercestore',
      tiktok: 'https://tiktok.com/@ecommercestore',
    },
    newsletter: {
      enabled: true,
      title: 'Stay Updated with Our Latest Offers',
      description: 'Subscribe to get exclusive deals, new product announcements, and special promotions.',
    },
  },

  // SEO Section - Search Engine Optimization settings
  seo: {
    title: 'E-Commerce Store - Best Products at Great Prices',
    description: 'Discover amazing products at unbeatable prices. Shop with confidence at our online store with fast shipping, secure payments, and excellent customer service.',
    keywords: 'ecommerce, online shopping, best prices, quality products, fast shipping, secure payment',
    ogTitle: 'E-Commerce Store - Your Shopping Destination',
    ogDescription: 'Find everything you need at our online store. Quality products, competitive prices, and exceptional service.',
    ogImage: '/uploads/seo/og-image.jpg', // Will be converted to localhost:5009 URL
    ogType: 'website',
    twitterCard: 'summary_large_image',
    twitterSite: '@ecommercestore',
    twitterCreator: '@ecommercestore',
    canonicalUrl: 'https://yourstore.com',
    robots: 'index, follow',
    googleSiteVerification: '',
    bingSiteVerification: '',
    yandexVerification: '',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'E-Commerce Store',
      'url': 'https://yourstore.com',
      'logo': 'https://yourstore.com/uploads/logos/sample-logo.png',
      'contactPoint': {
        '@type': 'ContactPoint',
        'telephone': '+1-555-123-4567',
        'contactType': 'customer service'
      }
    }
  },

  isActive: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default CMS_STATIC_CONFIG;
