'use client';

import React, { useState, useEffect } from 'react';
import { 
  CloudIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  RectangleStackIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const ShopifyIntegration = ({ onDataSource, currentDataSource = 'external' }) => {
  const [isShopifyConfigured, setIsShopifyConfigured] = useState(false);
  const [configStatus, setConfigStatus] = useState({
    domain: false,
    token: false,
    version: false
  });
  const [testResults, setTestResults] = useState({
    products: null,
    orders: null,
    customers: null,
    collections: null
  });
  const [testing, setTesting] = useState(false);

  // Check Shopify configuration on component mount
  useEffect(() => {
    checkShopifyConfig();
  }, []);

  const checkShopifyConfig = async () => {
    try {
      const response = await fetch('/api/shopify/products?first=1');
      const data = await response.json();
      
      if (data.success) {
        setIsShopifyConfigured(true);
        setConfigStatus({ domain: true, token: true, version: true });
      } else {
        setIsShopifyConfigured(false);
        // Try to determine which config is missing from the error message
        const errorMsg = data.error?.toLowerCase() || '';
        setConfigStatus({
          domain: !errorMsg.includes('domain'),
          token: !errorMsg.includes('token'),
          version: !errorMsg.includes('version')
        });
      }
    } catch (error) {
      console.error('Config check failed:', error);
      setIsShopifyConfigured(false);
      setConfigStatus({ domain: false, token: false, version: false });
    }
  };

  const testShopifyEndpoint = async (endpoint, testKey) => {
    setTestResults(prev => ({ ...prev, [testKey]: 'loading' }));
    
    try {
      const response = await fetch(`/api/shopify/${endpoint}?first=1`);
      const data = await response.json();
      
      setTestResults(prev => ({ 
        ...prev, 
        [testKey]: data.success ? 'success' : 'error'
      }));
      
      return data.success;
    } catch (error) {
      console.error(`${endpoint} test failed:`, error);
      setTestResults(prev => ({ ...prev, [testKey]: 'error' }));
      return false;
    }
  };

  const testAllEndpoints = async () => {
    if (!isShopifyConfigured) {
      alert('Please configure Shopify first by setting up your environment variables.');
      return;
    }

    setTesting(true);
    
    // Test all endpoints
    const tests = [
      { endpoint: 'products', key: 'products' },
      { endpoint: 'orders', key: 'orders' },
      { endpoint: 'customers', key: 'customers' },
      { endpoint: 'collections', key: 'collections' }
    ];

    for (const test of tests) {
      await testShopifyEndpoint(test.endpoint, test.key);
    }
    
    setTesting(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'loading':
        return (
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-300" />;
    }
  };

  const dataSourceOptions = [
    {
      key: 'external',
      name: 'External API',
      description: 'Use ecom-apis-w0m8.onrender.com',
      icon: CloudIcon,
      available: true,
      color: 'blue'
    },
    {
      key: 'shopify',
      name: 'Shopify GraphQL',
      description: 'Direct Shopify integration',
      icon: ShoppingBagIcon,
      available: isShopifyConfigured,
      color: 'green'
    }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <Cog6ToothIcon className="w-6 h-6 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">API Integration Settings</h3>
      </div>

      {/* Data Source Selection */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Select Data Source</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dataSourceOptions.map((option) => (
            <div
              key={option.key}
              onClick={() => option.available && onDataSource?.(option.key)}
              className={`
                relative p-4 rounded-lg border-2 cursor-pointer transition-all
                ${currentDataSource === option.key 
                  ? `border-${option.color}-500 bg-${option.color}-50` 
                  : 'border-gray-200 hover:border-gray-300'
                }
                ${!option.available ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="flex items-start gap-3">
                <option.icon className={`w-6 h-6 flex-shrink-0 ${
                  currentDataSource === option.key 
                    ? `text-${option.color}-600` 
                    : 'text-gray-400'
                }`} />
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 flex items-center gap-2">
                    {option.name}
                    {currentDataSource === option.key && (
                      <CheckCircleIcon className={`w-4 h-4 text-${option.color}-600`} />
                    )}
                    {!option.available && (
                      <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" />
                    )}
                  </h5>
                  <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                  {!option.available && option.key === 'shopify' && (
                    <p className="text-xs text-orange-600 mt-1">
                      Configure Shopify environment variables first
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shopify Configuration Status */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Shopify Configuration Status</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            {getStatusIcon(configStatus.domain ? 'success' : 'error')}
            <span className="text-sm text-gray-700">Store Domain</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            {getStatusIcon(configStatus.token ? 'success' : 'error')}
            <span className="text-sm text-gray-700">Admin Token</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            {getStatusIcon(configStatus.version ? 'success' : 'error')}
            <span className="text-sm text-gray-700">API Version</span>
          </div>
        </div>
      </div>

      {/* Shopify Endpoints Test */}
      {isShopifyConfigured && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Shopify API Endpoints</h4>
            <button
              onClick={testAllEndpoints}
              disabled={testing}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? 'Testing...' : 'Test All'}
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { key: 'products', icon: ShoppingBagIcon, label: 'Products' },
              { key: 'orders', icon: ChartBarIcon, label: 'Orders' },
              { key: 'customers', icon: UserGroupIcon, label: 'Customers' },
              { key: 'collections', icon: RectangleStackIcon, label: 'Collections' }
            ].map((item) => (
              <div key={item.key} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                {getStatusIcon(testResults[item.key])}
                <item.icon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configuration Help */}
      {!isShopifyConfigured && (
        <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h5 className="text-sm font-medium text-orange-800 mb-2">Shopify Setup Required</h5>
          <p className="text-sm text-orange-700 mb-3">
            To enable Shopify integration, add these environment variables:
          </p>
          <div className="text-xs font-mono bg-orange-100 p-3 rounded border">
            <div>SHOPIFY_STORE_DOMAIN=your-store.myshopify.com</div>
            <div>SHOPIFY_ADMIN_API_TOKEN=your-admin-access-token</div>
            <div>SHOPIFY_API_VERSION=2024-01</div>
          </div>
          <p className="text-xs text-orange-600 mt-2">
            Restart your development server after adding these variables.
          </p>
        </div>
      )}
    </div>
  );
};

export default ShopifyIntegration;