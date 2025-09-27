'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBagIcon,
  UserGroupIcon,
  RectangleStackIcon,
  ChartBarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CloudIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import ShopifyIntegration from '../../components/ShopifyIntegration';
import toast, { Toaster } from 'react-hot-toast';

const ShopifyExamplePage = () => {
  const [activeTab, setActiveTab] = useState('integration');
  const [shopifyData, setShopifyData] = useState({
    products: [],
    orders: [],
    customers: [],
    collections: []
  });
  const [loading, setLoading] = useState({});
  const [dataSource, setDataSource] = useState('external');

  // Test data for demonstration
  const [testProductData, setTestProductData] = useState({
    title: 'Test Product',
    descriptionHtml: '<p>This is a test product created via Shopify GraphQL API</p>',
    vendor: 'Test Vendor',
    productType: 'Test Type',
    tags: ['test', 'demo', 'api'],
    price: '29.99',
    sku: 'TEST-001',
    inventoryQuantity: 10
  });

  const tabs = [
    { key: 'integration', name: 'API Integration', icon: CloudIcon },
    { key: 'products', name: 'Products', icon: ShoppingBagIcon },
    { key: 'orders', name: 'Orders', icon: ChartBarIcon },
    { key: 'customers', name: 'Customers', icon: UserGroupIcon },
    { key: 'collections', name: 'Collections', icon: RectangleStackIcon }
  ];

  // Generic API call function
  const makeShopifyCall = async (endpoint, options = {}) => {
    const { method = 'GET', body, params = {} } = options;
    
    let url = `/api/shopify/${endpoint}`;
    if (Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(url, config);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'API call failed');
    }

    return data;
  };

  // Fetch data functions
  const fetchShopifyProducts = async () => {
    setLoading(prev => ({ ...prev, products: true }));
    try {
      const data = await makeShopifyCall('products', {
        params: { first: 5 }
      });
      setShopifyData(prev => ({ 
        ...prev, 
        products: data.data.products?.edges || [] 
      }));
      toast.success(`Fetched ${data.data.products?.edges?.length || 0} products`);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error(`Failed to fetch products: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  const fetchShopifyOrders = async () => {
    setLoading(prev => ({ ...prev, orders: true }));
    try {
      const data = await makeShopifyCall('orders', {
        params: { first: 5 }
      });
      setShopifyData(prev => ({ 
        ...prev, 
        orders: data.data.orders?.edges || [] 
      }));
      toast.success(`Fetched ${data.data.orders?.edges?.length || 0} orders`);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error(`Failed to fetch orders: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, orders: false }));
    }
  };

  const fetchShopifyCustomers = async () => {
    setLoading(prev => ({ ...prev, customers: true }));
    try {
      const data = await makeShopifyCall('customers', {
        params: { first: 5 }
      });
      setShopifyData(prev => ({ 
        ...prev, 
        customers: data.data.customers?.edges || [] 
      }));
      toast.success(`Fetched ${data.data.customers?.edges?.length || 0} customers`);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      toast.error(`Failed to fetch customers: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, customers: false }));
    }
  };

  const fetchShopifyCollections = async () => {
    setLoading(prev => ({ ...prev, collections: true }));
    try {
      const data = await makeShopifyCall('collections', {
        params: { first: 5 }
      });
      setShopifyData(prev => ({ 
        ...prev, 
        collections: data.data.collections?.edges || [] 
      }));
      toast.success(`Fetched ${data.data.collections?.edges?.length || 0} collections`);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
      toast.error(`Failed to fetch collections: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, collections: false }));
    }
  };

  // Create test product
  const createTestProduct = async () => {
    setLoading(prev => ({ ...prev, createProduct: true }));
    try {
      const data = await makeShopifyCall('products', {
        method: 'POST',
        body: testProductData
      });
      toast.success('Test product created successfully!');
      console.log('Created product:', data.data);
      // Refresh products list
      fetchShopifyProducts();
    } catch (error) {
      console.error('Failed to create product:', error);
      toast.error(`Failed to create product: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, createProduct: false }));
    }
  };

  const renderDataTable = (data, type) => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No {type} found. Click "Fetch {type}" to load data.</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              {type === 'products' && (
                <>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                </>
              )}
              {type === 'orders' && (
                <>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </>
              )}
              {type === 'customers' && (
                <>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                </>
              )}
              {type === 'collections' && (
                <>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Handle</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item, index) => {
              const node = item.node;
              return (
                <tr key={node.id || index} className="hover:bg-gray-50">
                  {type === 'products' && (
                    <>
                      <td className="px-4 py-2 text-sm text-gray-500 font-mono">
                        {node.id?.split('/').pop()}
                      </td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">
                        {node.title}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          node.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {node.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">{node.vendor}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{node.productType}</td>
                    </>
                  )}
                  {type === 'orders' && (
                    <>
                      <td className="px-4 py-2 text-sm font-mono text-gray-500">
                        #{node.orderNumber || node.name}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {node.customer?.displayName || 'Guest'}
                      </td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">
                        {node.totalPrice || 'N/A'}
                      </td>
                      <td className="px-4 py-2">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {node.displayFulfillmentStatus || node.financialStatus}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {new Date(node.createdAt).toLocaleDateString()}
                      </td>
                    </>
                  )}
                  {type === 'customers' && (
                    <>
                      <td className="px-4 py-2 text-sm text-gray-500 font-mono">
                        {node.id?.split('/').pop()}
                      </td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">
                        {node.displayName}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">{node.email}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{node.numberOfOrders}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {new Date(node.createdAt).toLocaleDateString()}
                      </td>
                    </>
                  )}
                  {type === 'collections' && (
                    <>
                      <td className="px-4 py-2 text-sm text-gray-500 font-mono">
                        {node.id?.split('/').pop()}
                      </td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">
                        {node.title}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">{node.handle}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {node.productsCount?.count || 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {new Date(node.updatedAt).toLocaleDateString()}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Shopify GraphQL Integration Example
            </h1>
            <p className="mt-2 text-gray-600">
              Test and demonstrate Shopify API integration with GraphQL utilities
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Integration Tab */}
        {activeTab === 'integration' && (
          <div className="space-y-6">
            <ShopifyIntegration 
              currentDataSource={dataSource}
              onDataSource={setDataSource}
            />
            
            {/* Test Product Creation */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Product Creation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Product Data:</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        value={testProductData.title}
                        onChange={(e) => setTestProductData(prev => ({ ...prev, title: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={testProductData.price}
                        onChange={(e) => setTestProductData(prev => ({ ...prev, price: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">SKU</label>
                      <input
                        type="text"
                        value={testProductData.sku}
                        onChange={(e) => setTestProductData(prev => ({ ...prev, sku: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Actions:</h4>
                  <button
                    onClick={createTestProduct}
                    disabled={loading.createProduct}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PlusIcon className="w-4 h-4" />
                    {loading.createProduct ? 'Creating...' : 'Create Test Product'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Products</h3>
              <button
                onClick={fetchShopifyProducts}
                disabled={loading.products}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <ShoppingBagIcon className="w-4 h-4" />
                {loading.products ? 'Loading...' : 'Fetch Products'}
              </button>
            </div>
            <div className="p-6">
              {renderDataTable(shopifyData.products, 'products')}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Orders</h3>
              <button
                onClick={fetchShopifyOrders}
                disabled={loading.orders}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <ChartBarIcon className="w-4 h-4" />
                {loading.orders ? 'Loading...' : 'Fetch Orders'}
              </button>
            </div>
            <div className="p-6">
              {renderDataTable(shopifyData.orders, 'orders')}
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Customers</h3>
              <button
                onClick={fetchShopifyCustomers}
                disabled={loading.customers}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <UserGroupIcon className="w-4 h-4" />
                {loading.customers ? 'Loading...' : 'Fetch Customers'}
              </button>
            </div>
            <div className="p-6">
              {renderDataTable(shopifyData.customers, 'customers')}
            </div>
          </div>
        )}

        {/* Collections Tab */}
        {activeTab === 'collections' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Collections</h3>
              <button
                onClick={fetchShopifyCollections}
                disabled={loading.collections}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <RectangleStackIcon className="w-4 h-4" />
                {loading.collections ? 'Loading...' : 'Fetch Collections'}
              </button>
            </div>
            <div className="p-6">
              {renderDataTable(shopifyData.collections, 'collections')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopifyExamplePage;