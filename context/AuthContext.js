'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { 
  getAuthToken, 
  getAuthUser, 
  setAuthData, 
  clearAuthData, 
  isAuthenticated,
  getTokenPayload 
} from '../utils/auth';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isLoading: false,
      };
    
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Context provider
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on mount and set up periodic token validation
  useEffect(() => {
    checkAuthStatus();
    
    // Set up periodic token validation (every 5 minutes)
    const tokenValidationInterval = setInterval(() => {
      if (state.isAuthenticated) {
        validateToken();
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    // Also validate token when window regains focus
    const handleFocus = () => {
      if (state.isAuthenticated) {
        validateToken();
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
    }
    
    return () => {
      clearInterval(tokenValidationInterval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
      }
    };
  }, []); // Empty dependency array for mount-only effect

  const checkAuthStatus = () => {
    try {
      const token = getAuthToken();
      const user = getAuthUser();

      if (token && user && isAuthenticated()) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { token, user },
        });
      } else {
        // Clear any invalid data
        clearAuthData();
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      clearAuthData();
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const validateToken = async () => {
    const token = getAuthToken();
    
    if (!token || !isAuthenticated()) {
      // Token is expired or missing, logout user
      if (state.isAuthenticated) {
        console.log('Token expired or missing, logging out...');
        logout();
      }
      return false;
    }
    
    try {
      // Validate token with server
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5009'}/api/auth/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        // Token is invalid on server, logout user
        console.log('Token validation failed, logging out...');
        logout();
        return false;
      }
      
      const data = await response.json();
      if (data.success && data.valid) {
        // Token is still valid, update user data if needed
        const updatedUser = data.admin;
        if (updatedUser && state.user) {
          // Update user data if there are changes
          const currentUserId = state.user.id || state.user._id;
          const newUserId = updatedUser.id || updatedUser._id;
          
          if (currentUserId === newUserId) {
            updateUser({
              name: updatedUser.name || updatedUser.username,
              email: updatedUser.email,
              role: updatedUser.role,
              permissions: updatedUser.permissions || [],
              lastLogin: updatedUser.lastLogin,
            });
          }
        }
        return true;
      } else {
        // Token validation failed
        console.log('Server token validation failed, logging out...');
        logout();
        return false;
      }
    } catch (error) {
      console.error('Error validating token:', error);
      // Don't logout on network errors, just log the error
      return null;
    }
  };

  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5009'}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies in request/response
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Login failed');
      }

      if (!data.token || !data.admin) {
        throw new Error('Invalid response from server');
      }

      // Extract user info from token payload as well
      const tokenPayload = getTokenPayload(data.token);
      
      const userData = {
        id: data.admin._id || data.admin.id,
        name: data.admin.name || data.admin.username,
        email: data.admin.email,
        role: data.admin.role || 'admin',
        permissions: data.admin.permissions || [],
        lastLogin: new Date().toISOString(),
        tokenExp: tokenPayload?.exp,
      };

      // Store in cookies and localStorage
      setAuthData(data.token, userData);

      // Update state
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          token: data.token,
          user: userData,
        },
      });

      return { success: true, user: userData };
    } catch (error) {
      const errorMessage = error.message || 'Network error occurred';
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      // Optional: Call logout endpoint
      const token = getAuthToken();
      if (token) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5009'}/api/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          console.error('Error calling logout endpoint:', error);
          // Continue with local logout even if server logout fails
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local data
      clearAuthData();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  const updateUser = (userData) => {
    const updatedUser = { ...state.user, ...userData };
    
    // Update stored user data
    if (state.token) {
      setAuthData(state.token, updatedUser);
    }
    
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: userData,
    });
  };

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    // State
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    login,
    logout,
    updateUser,
    clearError,
    checkAuthStatus,
    validateToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;