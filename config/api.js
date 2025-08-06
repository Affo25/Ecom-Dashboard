// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5009';

export const API_ENDPOINTS = {
  products: `${API_BASE_URL}/api/products`,
  orders: `${API_BASE_URL}/api/orders`,
  categories: `${API_BASE_URL}/api/categories`,
  subcategories: `${API_BASE_URL}/api/subcategories`,
  riders: `${API_BASE_URL}/api/riders`,
  admin: `${API_BASE_URL}/api/admin`,
  auth: `${API_BASE_URL}/api/auth`,
  health: `${API_BASE_URL}/api/health`,
  analytics: `${API_BASE_URL}/api/admin/analytics`,
  analyticsSales: `${API_BASE_URL}/api/admin/analytics/sales`,
  analyticsOrders: `${API_BASE_URL}/api/admin/analytics/orders`,
  
  // CMS Endpoints - Simplified CMS API
  cms: {
    config: `${API_BASE_URL}/api/cms/theme2`,              // Get CMS data by theme
    adminConfig: `${API_BASE_URL}/api/cms/update/theme2`,  // Admin config endpoint (GET/PUT)
    save: `${API_BASE_URL}/api/cms/save`,                  // Save CMS data with files
    update: `${API_BASE_URL}/api/cms/update/theme2`,       // Update CMS data
    reset: `${API_BASE_URL}/api/cms/reset`,                // Reset to default config
    uploadBanner: `${API_BASE_URL}/api/cms/upload/banner`, // Upload banner image
    uploadLogo: `${API_BASE_URL}/api/cms/upload/logo`,     // Upload logo image
    uploadBanners: `${API_BASE_URL}/api/cms/upload/banners` // Upload multiple banners
  }
};

export { API_BASE_URL };