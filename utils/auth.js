// Simple JWT decoder (no external dependency needed)
const decodeJWT = (token) => {
  try {
    if (!token) return null;
    
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    let payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    // Add padding if necessary
    while (payload.length % 4) {
      payload += '=';
    }
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

// Cookie utility functions
export const setCookie = (name, value, days = 30) => {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
};

export const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const deleteCookie = (name) => {
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
};

// Authentication functions
export const setAuthData = (token, user) => {
  try {
    setCookie('token', token, 30); // 30 days - Match server expectation
    setCookie('adminUser', JSON.stringify(user), 30);
    
    // Also set in localStorage as fallback
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('adminUser', JSON.stringify(user));
    }
    
    console.log('✅ Auth data stored in cookies and localStorage');
  } catch (error) {
    console.error('Error setting auth data:', error);
  }
};

export const getAuthToken = () => {
  // Try cookie first, then localStorage as fallback
  let token = getCookie('token');
  if (!token && typeof localStorage !== 'undefined') {
    token = localStorage.getItem('token');
  }
  return token;
};

export const getAuthUser = () => {
  try {
    // Try cookie first, then localStorage as fallback
    let userStr = getCookie('adminUser');
    if (!userStr && typeof localStorage !== 'undefined') {
      userStr = localStorage.getItem('adminUser');
    }
    
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error getting auth user:', error);
    return null;
  }
};

export const clearAuthData = () => {
  deleteCookie('token');
  deleteCookie('adminUser');
  
  // Also clear localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('adminUser');
  }
  
  console.log('✅ Auth data cleared from cookies and localStorage');
};

export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true;
  }
};

export const isAuthenticated = () => {
  const token = getAuthToken();
  if (!token) return false;
  
  return !isTokenExpired(token);
};

export const getTokenPayload = (token) => {
  if (!token) return null;
  
  try {
    return decodeJWT(token);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// API helper with token
const apiRequest = async (url, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, config);
    
    // If token expired, clear auth data
    if (response.status === 401) {
      clearAuthData();
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Authentication expired');
    }
    
    return response;
  } catch (error) {
    console.error('API Request error:', error);
    throw error;
  }
};
export { apiRequest };

