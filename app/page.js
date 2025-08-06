'use client';

import { useState, useEffect } from 'react';
import { 
  ShoppingBagIcon, 
  ShoppingCartIcon, 
  CurrencyDollarIcon, 
  ClockIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  TruckIcon,
  UserGroupIcon,
  TagIcon,
  ArrowTrendingUpIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/auth';

export default function AdminDashboard() {
  const  { user }  = useAuth();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [detailedOrders, setDetailedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard stats
      const dashboardResponse = await apiRequest('http://localhost:5009/api/admin/dashboard');
      
      if (dashboardResponse.ok) {
        const data = await dashboardResponse.json();
        setStats(data.stats);
        setRecentOrders(data.recentOrders);
        setLowStockProducts(data.lowStockProducts);
      }

      // Fetch detailed orders
      const ordersResponse = await apiRequest('http://localhost:5009/api/admin/orders');
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        if (ordersData.success && ordersData.data && ordersData.data.orders) {
          setDetailedOrders(ordersData.data.orders.slice(0, 10)); // Show latest 10 orders
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleImagePreview = (imageUrl, productName) => {
    setSelectedImage({ url: imageUrl, name: productName });
    setShowImagePreview(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-full overflow-hidden">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Dashboard Overview
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Welcome back, <span className="font-medium text-indigo-600">{user?.name || 'Admin'}</span>! 
              Here's what's happening in your store today.
            </p>
          </div>
          <div className="hidden lg:flex items-center text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
            <CalendarIcon className="h-4 w-4 mr-2" />
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Total Products</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalProducts || 0}</p>
              <div className="flex items-center mt-2 text-xs">
                <ArrowTrendingUpIcon className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-green-600">+12% from last month</span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
              <ShoppingBagIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
              <div className="flex items-center mt-2 text-xs">
                <ArrowTrendingUpIcon className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-green-600">+8% from last month</span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
              <ShoppingCartIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Pending Orders</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.pendingOrders || 0}</p>
              <div className="flex items-center mt-2 text-xs">
                <ClockIcon className="h-3 w-3 text-yellow-500 mr-1" />
                <span className="text-yellow-600">Need attention</span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(stats?.totalRevenue || 0)}
              </p>
              <div className="flex items-center mt-2 text-xs">
                <ArrowTrendingUpIcon className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-green-600">+15% from last month</span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
              <CurrencyDollarIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <a
            href="/products"
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
          >
            <ShoppingBagIcon className="h-8 w-8 text-gray-400 group-hover:text-indigo-600 mb-2" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">Add Product</span>
          </a>
          <a
            href="/categories"
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
          >
            <TagIcon className="h-8 w-8 text-gray-400 group-hover:text-indigo-600 mb-2" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">Manage Categories</span>
          </a>
          <a
            href="/orders"
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
          >
            <ShoppingCartIcon className="h-8 w-8 text-gray-400 group-hover:text-indigo-600 mb-2" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">View Orders</span>
          </a>
          <a
            href="/customers"
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
          >
            <UserGroupIcon className="h-8 w-8 text-gray-400 group-hover:text-indigo-600 mb-2" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">Customers</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          </div>
          <div className="p-6">
            {recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent orders</p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">{order.customer.name}</p>
                      <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(order.totalAmount)}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'Dispatched' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Low Stock Products</h2>
          </div>
          <div className="p-6">
            {lowStockProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">All products are in stock</p>
            ) : (
              <div className="space-y-4">
                {lowStockProducts.map((product) => (
                  <div key={product._id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(product.price)}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-1 text-blue-600 hover:text-blue-800">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-green-600 hover:text-green-800">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Products Detail Section */}
      <div className="card mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Order Products Details</h2>
          <p className="text-sm text-gray-600 mt-1">Detailed view of recent orders with product information</p>
        </div>
        <div className="p-6">
          {detailedOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No detailed orders available</p>
          ) : (
            <div className="space-y-6">
              {detailedOrders.map((order) => (
                <div key={order._id} className="border border-gray-200 rounded-lg p-4">
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium text-gray-900">Order #{order.orderNumber}</h3>
                        <p className="text-sm text-gray-600">
                          {order.customer?.name || 'Unknown Customer'} • {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'Dispatched' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(order.totalAmount)}</span>
                      <button 
                        onClick={() => handleViewOrderDetails(order)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              {item.product?.image ? (
                                <img 
                                  src={item.product.image} 
                                  alt={item.product.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <ShoppingBagIcon className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {item.product?.name || 'Unknown Product'}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {item.size && `Size: ${item.size}`}
                                {item.color && ` • Color: ${item.color}`}
                              </p>
                              <p className="text-sm text-gray-500">
                                Unit Price: {formatCurrency(item.price)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">Qty: {item.quantity}</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {formatCurrency(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-2">No items in this order</p>
                    )}
                  </div>

                  {/* Order Summary */}
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Total Items: {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Professional Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-60 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden transform transition-all duration-300 animate-slide-up">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <ShoppingCartIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Order Details</h3>
                    <p className="text-blue-100 text-sm">#{selectedOrder.orderNumber}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-blue-100 text-sm">Total Amount</p>
                    <p className="text-2xl font-bold">{formatCurrency(selectedOrder.totalAmount)}</p>
                  </div>
                  <button
                    onClick={() => setShowOrderDetails(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex flex-col lg:flex-row h-full overflow-hidden">
              {/* Left Panel - Order Information */}
              <div className="lg:w-1/3 bg-gray-50 border-r border-gray-200 p-6 overflow-y-auto modal-scroll">
                <div className="space-y-6">
                  {/* Order Status */}
                  <div className="bg-white rounded-xl p-4 shadow-card hover-lift">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
                      Order Status
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status</span>
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                          selectedOrder.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          selectedOrder.status === 'Dispatched' ? 'bg-blue-100 text-blue-800' :
                          selectedOrder.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {selectedOrder.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Order Date</span>
                        <span className="text-sm font-medium text-gray-900">{formatDate(selectedOrder.createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Items</span>
                        <span className="text-sm font-medium text-gray-900">{selectedOrder.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}</span>
                      </div>
                      {selectedOrder.trackingNumber && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Tracking</span>
                          <span className="text-sm font-medium text-blue-600">{selectedOrder.trackingNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-white rounded-xl p-4 shadow-card hover-lift">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="h-5 w-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Customer Details
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium text-gray-900">{selectedOrder.customer?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">{selectedOrder.customer?.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium text-gray-900">{selectedOrder.customer?.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Information */}
                  <div className="bg-white rounded-xl p-4 shadow-card hover-lift">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <TruckIcon className="h-5 w-5 text-gray-500 mr-2" />
                      Shipping Address
                    </h4>
                    <div className="text-sm text-gray-600">
                      {selectedOrder.shippingAddress ? (
                        <div className="space-y-1">
                          <p className="font-medium text-gray-900">{selectedOrder.shippingAddress.street}</p>
                          <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}</p>
                          <p>{selectedOrder.shippingAddress.country}</p>
                        </div>
                      ) : (
                        <p className="text-gray-500">No shipping address provided</p>
                      )}
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="bg-white rounded-xl p-4 shadow-card hover-lift">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <CurrencyDollarIcon className="h-5 w-5 text-gray-500 mr-2" />
                      Payment Details
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Subtotal</span>
                        <span className="text-sm font-medium">{formatCurrency(selectedOrder.totalAmount * 0.9)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Shipping</span>
                        <span className="text-sm font-medium">{formatCurrency(selectedOrder.totalAmount * 0.1)}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-900">Total</span>
                          <span className="font-bold text-lg text-gray-900">{formatCurrency(selectedOrder.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Order Items */}
              <div className="flex-1 p-6 overflow-y-auto modal-scroll">
                <div className="mb-6">
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Order Items</h4>
                  <p className="text-gray-600">Detailed view of all items in this order</p>
                </div>

                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <div className="space-y-4">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="bg-white rounded-2xl shadow-card border border-gray-200 overflow-hidden hover-lift">
                        <div className="flex items-center p-6">
                          {/* Product Image */}
                          <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center mr-6 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                            {item.product?.image ? (
                              <img 
                                src={item.product.image} 
                                alt={item.product.name}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                onClick={() => handleImagePreview(item.product.image, item.product.name)}
                              />
                            ) : (
                              <ShoppingBagIcon className="h-16 w-16 text-gray-400" />
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h5 className="text-lg font-semibold text-gray-900 mb-2">{item.product?.name || 'Unknown Product'}</h5>
                                <p className="text-sm text-gray-600 mb-2">{item.product?.description || 'No description available'}</p>
                                <div className="flex items-center space-x-4">
                                  {item.size && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      Size: {item.size}
                                    </span>
                                  )}
                                  {item.color && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Color: {item.color}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                                <p className="text-sm text-gray-600">Total</p>
                              </div>
                            </div>

                            {/* Pricing Breakdown */}
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="text-center">
                                  <p className="text-gray-600">Unit Price</p>
                                  <p className="font-semibold text-gray-900">{formatCurrency(item.price)}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-gray-600">Quantity</p>
                                  <p className="font-semibold text-gray-900">{item.quantity}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-gray-600">Subtotal</p>
                                  <p className="font-semibold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingBagIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No items in this order</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-8 py-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Order placed on {formatDate(selectedOrder.createdAt)} • Updated {formatDate(selectedOrder.updatedAt || selectedOrder.createdAt)}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowOrderDetails(false)}
                    className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowOrderDetails(false);
                      window.location.href = '/orders';
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
                  >
                    Manage Order
                  </button>
                  <button
                    onClick={() => {
                      // Print functionality
                      window.print();
                    }}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Print Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showImagePreview && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-premium overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{selectedImage.name}</h3>
              <button
                onClick={() => setShowImagePreview(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="p-4">
              <img 
                src={selectedImage.url} 
                alt={selectedImage.name}
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 