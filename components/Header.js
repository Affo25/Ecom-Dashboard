'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bars3Icon, 
  BellIcon, 
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  CogIcon,
  UserIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

 function Header({ setIsSidebarOpen }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuth();
  const router = useRouter();
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const loadingToast = toast.loading('Signing out...');
    
    try {
      await logout();
      toast.dismiss(loadingToast);
      toast.success('Signed out successfully');
      router.push('/login');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Error signing out');
      console.error('Logout error:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality here
      toast.info('Search functionality coming soon...');
    }
  };

  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return 'First login';
    
    const now = new Date();
    const loginDate = new Date(lastLogin);
    const diffInMinutes = Math.floor((now - loginDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return loginDate.toLocaleDateString();
  };

  const getUserInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button & Logo */}
        <div className="flex items-center space-x-4">
          <button
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onClick={() => setIsSidebarOpen?.(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          {/* Mobile Logo/Brand */}
          <div className="lg:hidden flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg"></div>
            <span className="ml-2 text-lg font-bold text-gray-900 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Admin
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-lg lg:max-w-md mx-2 sm:mx-4">
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm sm:text-base"
            />
          </form>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <BellIcon className="h-6 w-6" />
            {/* Notification badge */}
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
              3
            </span>
          </button>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              className="flex items-center space-x-3 p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {getUserInitials(user?.name)}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.name || 'Admin User'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.role || 'Administrator'}
                  </div>
                </div>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                {/* User Info Section */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-medium">
                      {getUserInitials(user?.name)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {user?.name || 'Admin User'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user?.email || 'admin@example.com'}
                      </div>
                      <div className="flex items-center text-xs text-gray-400 mt-1">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        Last login: {formatLastLogin(user?.lastLogin)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Stats */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {user?.permissions?.length || 0}
                      </div>
                      <div className="text-xs text-gray-500">Permissions</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {user?.role === 'admin' ? 'Full' : 'Limited'}
                      </div>
                      <div className="text-xs text-gray-500">Access Level</div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      toast.info('Profile settings coming soon...');
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <UserIcon className="h-4 w-4 mr-3 text-gray-400" />
                    Profile Settings
                  </button>
                  
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      toast.info('Admin settings coming soon...');
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <CogIcon className="h-4 w-4 mr-3 text-gray-400" />
                    Admin Settings
                  </button>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      toast.info('Security settings coming soon...');
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <ShieldCheckIcon className="h-4 w-4 mr-3 text-gray-400" />
                    Security
                  </button>
                </div>

                {/* Logout Section */}
                <div className="border-t border-gray-100 pt-2">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 

export default Header;