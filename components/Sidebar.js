'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  ShoppingBagIcon, 
  UsersIcon, 
  ShoppingCartIcon,
  ChartBarIcon,
  TagIcon,
  FolderIcon,
  BikeIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

 function Sidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState({});

  const toggleDropdown = (itemName) => {
    setDropdownOpen(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: HomeIcon,
    },
    {
      name: 'Products',
      href: '/products',
      icon: ShoppingBagIcon,
    },
    {
      name: 'Categories',
      href: '/categories',
      icon: TagIcon,
      hasDropdown: true,
      children: [
        {
          name: 'All Categories',
          href: '/categories',
          icon: TagIcon,
        },
        {
          name: 'Subcategories',
          href: '/subcategories',
          icon: FolderIcon,
        }
      ]
    },
    {
      name: 'Customers',
      href: '/customers',
      icon: UsersIcon,
    },
    {
      name: 'Orders',
      href: '/orders',
      icon: ShoppingCartIcon,
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: ChartBarIcon,
    },
      {
      name: 'Riders',
      href: '/riders',
      icon: UsersIcon,
    },
     {
      name: 'CMS',
      href: '/cms',
      icon: ChartBarIcon,
    },
  ];

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900 bg-opacity-50 sidebar-mobile-overlay lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-600 rounded-lg overflow-hidden">
              <img
                src="/images/logo.png" // or use a public URL
                alt="Icon"
                className="w-full h-full object-cover"
              />
            </div>

            <span className="ml-3 text-xl font-bold text-gray-900 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">IBOOTHME</span>
          </div>
          <button
            className="lg:hidden"
            onClick={() => setIsOpen(false)}
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <nav className="mt-6 px-3 flex-1 overflow-y-auto scrollbar-thin pb-20">
          <div className="space-y-1">
            {menuItems.map((item) => {
              if (item.hasDropdown) {
                const isDropdownOpen = dropdownOpen[item.name];
                const isActiveParent = pathname === item.href || item.children?.some(child => pathname === child.href);
                
                return (
                  <div key={item.name}>
                    {/* Parent item with dropdown toggle */}
                    <button
                      onClick={() => toggleDropdown(item.name)}
                      className={`
                        w-full flex items-center justify-between px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                        ${isActiveParent 
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <div className="flex items-center">
                        <item.icon className="h-5 w-5 mr-3" />
                        {item.name}
                      </div>
                      {isDropdownOpen ? (
                        <ChevronUpIcon className="h-4 w-4" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </button>
                    
                    {/* Dropdown menu */}
                    {isDropdownOpen && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.children?.map((child) => {
                          const isActive = pathname === child.href;
                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={`
                                flex items-center px-4 py-2 text-sm rounded-lg transition-colors duration-200
                                ${isActive 
                                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }
                              `}
                              onClick={() => setIsOpen(false)}
                            >
                              <child.icon className="h-4 w-4 mr-3" />
                              {child.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              
              // Regular menu items without dropdown
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            Fashion Store Admin
          </div>
        </div>
      </div>
    </>
  );
} 

export default Sidebar;