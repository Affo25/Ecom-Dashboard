'use client';

import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  TruckIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ClockIcon,
  PrinterIcon,
  DocumentTextIcon,
  UserIcon,
  MapPinIcon,
  FunnelIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarDaysIcon,
  StarIcon,
  PhotoIcon,
  TagIcon,
  ChartBarIcon,
  ScaleIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../../config/api';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [dispatchData, setDispatchData] = useState({
    trackingNumber: '',
    carrier: '',
    estimatedDelivery: ''
  });
  const [cancelReason, setCancelReason] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  
  // Pagination, Sorting, and Filtering States
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [sorting, setSorting] = useState({
    field: 'created_at',
    direction: 'desc'
  });
  const [filters, setFilters] = useState({
    order_number: '',
    customer_name: '',
    customer_email: '',
    status: '',
    total_min: '',
    total_max: '',
    date_from: '',
    date_to: '',
    payment_method: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, pagination.limit, sorting.field, sorting.direction, filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      // Build query parameters
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sort: sorting.field,
        order: sorting.direction
      });
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.toString().trim()) {
          params.append(key, value.toString());
        }
      });
      
      const response = await fetch(`${API_ENDPOINTS.orders}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Orders API response:', data);
        
        // Handle API response format: { success: true, data: { orders: [...], pagination: {...} } }
        if (data.success && data.data && Array.isArray(data.data.orders)) {
          setOrders(data.data.orders);
          setPagination(prev => ({
            ...prev,
            total: data.data.pagination?.total || 0,
            totalPages: data.data.pagination?.totalPages || 0
          }));
          console.log('Orders loaded successfully:', data.data.orders.length);
        } else if (Array.isArray(data.orders)) {
          // Fallback for direct orders array
          setOrders(data.orders);
        } else if (Array.isArray(data)) {
          // Fallback for direct array response
          setOrders(data);
        } else {
          console.warn('Unexpected API response format:', data);
          setOrders([]);
        }
      } else {
        console.error('Failed to fetch orders:', response.status, response.statusText);
        if (response.status === 429) {
          toast.error('Too many requests. Please wait a moment and try again.');
        } else {
          toast.error('Failed to fetch orders');
        }
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Error fetching orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  };

  // Sorting handlers
  const handleSort = (field) => {
    setSorting(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Filter handlers
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({
      order_number: '',
      customer_name: '',
      customer_email: '',
      status: '',
      total_min: '',
      total_max: '',
      date_from: '',
      date_to: '',
      payment_method: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sorting.field !== field) return '↕️';
    return sorting.direction === 'asc' ? '↑' : '↓';
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_ENDPOINTS.orders}/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Status update response:', data);
        toast.success('Order status updated successfully!');
        fetchOrders();
      } else {
        const errorData = await response.json();
        console.error('Status update error:', errorData);
        if (response.status === 429) {
          toast.error('Too many requests. Please wait a moment and try again.');
        } else {
          toast.error(errorData.message || 'Error updating order status');
        }
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Network error');
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleDispatchOrder = (order) => {
    setSelectedOrder(order);
    setDispatchData({
      trackingNumber: '',
      carrier: '',
      estimatedDelivery: ''
    });
    setShowDispatchModal(true);
  };

  const handleCancelOrder = (order) => {
    setSelectedOrder(order);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleImagePreview = (imageUrl, productName) => {
    setSelectedImage({ url: imageUrl, name: productName });
    setShowImagePreview(true);
  };

  const submitDispatch = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_ENDPOINTS.orders}/${selectedOrder._id}/dispatch`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dispatchData),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Order dispatched successfully!');
        setShowDispatchModal(false);
        fetchOrders();
      } else {
        const errorData = await response.json();
        if (response.status === 429) {
          toast.error('Too many requests. Please wait a moment and try again.');
        } else {
          toast.error(errorData.message || 'Error dispatching order');
        }
      }
    } catch (error) {
      console.error('Error dispatching order:', error);
      toast.error('Network error');
    }
  };

  const submitCancel = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_ENDPOINTS.orders}/${selectedOrder._id}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: cancelReason }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Order cancelled successfully!');
        setShowCancelModal(false);
        fetchOrders();
      } else {
        const errorData = await response.json();
        if (response.status === 429) {
          toast.error('Too many requests. Please wait a moment and try again.');
        } else {
          toast.error(errorData.message || 'Error cancelling order');
        }
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Network error');
    }
  };

  // Remove filteredOrders logic as we're now using server-side filtering

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Dispatched':
        return 'bg-blue-100 text-blue-800';
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600 mt-1">Manage customer orders and track delivery status</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
              Total: {pagination.total} orders
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
            >
              <FunnelIcon className="h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order Number</label>
              <input
                type="text"
                value={filters.order_number}
                onChange={(e) => handleFilterChange('order_number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Search by order number..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
              <input
                type="text"
                value={filters.customer_name}
                onChange={(e) => handleFilterChange('customer_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Search by customer name..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Email</label>
              <input
                type="text"
                value={filters.customer_email}
                onChange={(e) => handleFilterChange('customer_email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Search by email..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Total</label>
              <input
                type="number"
                value={filters.total_min}
                onChange={(e) => handleFilterChange('total_min', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Total</label>
              <input
                type="number"
                value={filters.total_max}
                onChange={(e) => handleFilterChange('total_max', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="999999"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <select
                value={filters.payment_method}
                onChange={(e) => handleFilterChange('payment_method', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Methods</option>
                <option value="card">Card</option>
                <option value="paypal">PayPal</option>
                <option value="stripe">Stripe</option>
                <option value="cash">Cash on Delivery</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="card rounded-xl border-top">
        <div className="overflow-x-auto rounded-xl border-top">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 ">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('orderNumber')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Order</span>
                    <span className="text-gray-400">{getSortIcon('orderNumber')}</span>
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('customer.name')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Customer</span>
                    <span className="text-gray-400">{getSortIcon('customer.name')}</span>
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('items')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Items</span>
                    <span className="text-gray-400">{getSortIcon('items')}</span>
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('totalAmount')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Total</span>
                    <span className="text-gray-400">{getSortIcon('totalAmount')}</span>
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Status</span>
                    <span className="text-gray-400">{getSortIcon('status')}</span>
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('created_at')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  >
                    <span>Date</span>
                    <span className="text-gray-400">{getSortIcon('created_at')}</span>
                  </button>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    {loading ? 'Loading orders...' : 'No orders found'}
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.orderNumber || 'N/A'}</div>
                      <div className="text-sm text-gray-500">#{order._id ? order._id.slice(-6) : 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.customer?.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{order.customer?.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.items ? order.items.length : 0} items</div>
                      <div className="text-sm text-gray-500">
                        {order.items ? order.items.map(item => item.product?.name || 'Unknown').join(', ') : 'No items'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(order.totalAmount || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {order.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleDispatchOrder(order)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Dispatch Order"
                            >
                              <TruckIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleCancelOrder(order)}
                              className="text-red-600 hover:text-red-900"
                              title="Cancel Order"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {order.status === 'Dispatched' && (
                          <button
                            onClick={() => handleStatusUpdate(order._id, 'Delivered')}
                            className="text-green-600 hover:text-green-900"
                            title="Mark as Delivered"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Section */}
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center mb-4 sm:mb-0">
              <p className="text-sm text-gray-700 mr-4">
                Showing{' '}
                <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span>
                {' '}to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{pagination.total}</span>
                {' '}results
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Show:</span>
                <select
                  value={pagination.limit}
                  onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-700">per page</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1 || loading}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let page;
                  if (pagination.totalPages <= 5) {
                    page = i + 1;
                  } else if (pagination.page <= 3) {
                    page = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    page = pagination.totalPages - 4 + i;
                  } else {
                    page = pagination.page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      disabled={loading}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                        pagination.page === page
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages || loading}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-70 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-[95vw] max-h-[95vh] overflow-hidden transform transition-all duration-300 animate-slide-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                    <ShoppingCartIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">Order Management</h2>
                    <p className="text-indigo-100 text-lg">#{selectedOrder.orderNumber}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-indigo-100 text-sm">Total Amount</p>
                    <p className="text-3xl font-bold">{formatCurrency(selectedOrder.totalAmount || 0)}</p>
                  </div>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col xl:flex-row h-full">
              {/* Left Panel - Order Information */}
              <div className="xl:w-1/3 bg-gray-50 border-r border-gray-200 p-6 overflow-y-auto modal-scroll">
                <div className="space-y-6">
                  {/* Order Status Card */}
                  <div className="bg-white rounded-2xl p-6 shadow-card hover-lift">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <ClockIcon className="h-5 w-5 text-indigo-600 mr-2" />
                        Order Status
                      </h3>
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status || 'Unknown'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Order Date</p>
                        <p className="font-medium text-gray-900">{formatDate(selectedOrder.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total Items</p>
                        <p className="font-medium text-gray-900">{selectedOrder.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Order ID</p>
                        <p className="font-medium text-gray-900">#{selectedOrder._id?.slice(-8) || 'N/A'}</p>
                      </div>
                      {selectedOrder.trackingNumber && (
                        <div>
                          <p className="text-gray-500">Tracking</p>
                          <p className="font-medium text-blue-600">{selectedOrder.trackingNumber}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Information Card */}
                  <div className="bg-white rounded-2xl p-6 shadow-card hover-lift">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <UserIcon className="h-5 w-5 text-indigo-600 mr-2" />
                      Customer Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Customer Name</p>
                          <p className="font-medium text-gray-900">{selectedOrder.customer?.name || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email Address</p>
                          <p className="font-medium text-gray-900">{selectedOrder.customer?.email || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone Number</p>
                          <p className="font-medium text-gray-900">{selectedOrder.customer?.phone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address Card */}
                  <div className="bg-white rounded-2xl p-6 shadow-card hover-lift">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <MapPinIcon className="h-5 w-5 text-indigo-600 mr-2" />
                      Shipping Address
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      {selectedOrder.shippingAddress ? (
                        <div className="space-y-2 text-sm">
                          <p className="font-medium text-gray-900">{selectedOrder.shippingAddress.street}</p>
                          <p className="text-gray-600">{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}</p>
                          <p className="text-gray-600">{selectedOrder.shippingAddress.country}</p>
                        </div>
                      ) : (
                        <p className="text-gray-500">No shipping address provided</p>
                      )}
                    </div>
                  </div>

                  {/* Payment Summary Card */}
                  <div className="bg-white rounded-2xl p-6 shadow-card hover-lift">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <CurrencyDollarIcon className="h-5 w-5 text-indigo-600 mr-2" />
                      Payment Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="font-medium text-gray-900">{formatCurrency((selectedOrder.totalAmount || 0) * 0.9)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Shipping</span>
                        <span className="font-medium text-gray-900">{formatCurrency((selectedOrder.totalAmount || 0) * 0.1)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Tax</span>
                        <span className="font-medium text-gray-900">$0.00</span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-gray-900">Total</span>
                          <span className="text-2xl font-bold text-indigo-600">{formatCurrency(selectedOrder.totalAmount || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Order Items */}
              <div className="flex-1 p-6 overflow-y-auto modal-scroll">
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Order Items</h3>
                      <p className="text-gray-600 mt-1">Detailed view of all products in this order</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Items:</span>
                      <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                        {selectedOrder.items?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <div className="space-y-6">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="bg-white rounded-3xl shadow-card border border-gray-200 overflow-hidden hover-lift">
                        <div className="p-8">
                          <div className="flex items-start space-x-6">
                            {/* Product Image */}
                            <div className="w-40 h-40 bg-gray-100 rounded-2xl flex items-center justify-center cursor-pointer hover:shadow-xl transition-shadow overflow-hidden">
                              {item.product?.image ? (
                                <img 
                                  src={item.product.image} 
                                  alt={item.product.name}
                                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                                  onClick={() => handleImagePreview(item.product.image, item.product.name)}
                                />
                              ) : (
                                <div className="text-center">
                                  <ShoppingBagIcon className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                                  <p className="text-sm text-gray-500">No Image</p>
                                </div>
                              )}
                            </div>

                            {/* Product Information */}
                            <div className="flex-1 space-y-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="text-xl font-bold text-gray-900 mb-2">{item.product?.name || 'Unknown Product'}</h4>
                                  <p className="text-gray-600 text-sm mb-3">{item.product?.description || 'No description available'}</p>
                                  <div className="flex items-center space-x-3">
                                    {item.size && (
                                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                        Size: {item.size}
                                      </span>
                                    )}
                                    {item.color && (
                                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                        Color: {item.color}
                                      </span>
                                    )}
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                      SKU: {item.product?.sku || 'N/A'}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-3xl font-bold text-gray-900">{formatCurrency((item.price || 0) * (item.quantity || 0))}</p>
                                  <p className="text-sm text-gray-500">Item Total</p>
                                </div>
                              </div>

                              {/* Pricing Grid */}
                              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                  <div className="text-center">
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                      <p className="text-sm text-gray-500 mb-1">Unit Price</p>
                                      <p className="text-lg font-bold text-gray-900">{formatCurrency(item.price || 0)}</p>
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                      <p className="text-sm text-gray-500 mb-1">Quantity</p>
                                      <p className="text-lg font-bold text-indigo-600">{item.quantity || 0}</p>
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                      <p className="text-sm text-gray-500 mb-1">Subtotal</p>
                                      <p className="text-lg font-bold text-green-600">{formatCurrency((item.price || 0) * (item.quantity || 0))}</p>
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                      <p className="text-sm text-gray-500 mb-1">Weight</p>
                                      <p className="text-lg font-bold text-gray-900">{item.product?.weight || 'N/A'}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <ShoppingBagIcon className="h-20 w-20 text-gray-400 mx-auto mb-4" />
                    <p className="text-xl text-gray-500">No items in this order</p>
                    <p className="text-gray-400">This order appears to be empty</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-8 py-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Order placed on {formatDate(selectedOrder.createdAt)}</span>
                  <span>•</span>
                  <span>Last updated {formatDate(selectedOrder.updatedAt || selectedOrder.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    <XMarkIcon className="h-4 w-4 inline mr-2" />
                    Close
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium"
                  >
                    <PrinterIcon className="h-4 w-4 inline mr-2" />
                    Print Order
                  </button>
                  <button
                    onClick={() => handleDispatchOrder(selectedOrder)}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-medium"
                  >
                    <TruckIcon className="h-4 w-4 inline mr-2" />
                    Manage Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {showDispatchModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Dispatch Order</h3>
                <button
                  onClick={() => setShowDispatchModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Order #{selectedOrder.orderNumber}</h4>
                  <p className="text-sm text-gray-600">Customer: {selectedOrder.customer?.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking Number *
                  </label>
                  <input
                    type="text"
                    value={dispatchData.trackingNumber}
                    onChange={(e) => setDispatchData({...dispatchData, trackingNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter tracking number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Carrier *
                  </label>
                  <select
                    value={dispatchData.carrier}
                    onChange={(e) => setDispatchData({...dispatchData, carrier: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select carrier</option>
                    <option value="FedEx">FedEx</option>
                    <option value="UPS">UPS</option>
                    <option value="DHL">DHL</option>
                    <option value="USPS">USPS</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Delivery Date
                  </label>
                  <input
                    type="date"
                    value={dispatchData.estimatedDelivery}
                    onChange={(e) => setDispatchData({...dispatchData, estimatedDelivery: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowDispatchModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitDispatch}
                    disabled={!dispatchData.trackingNumber || !dispatchData.carrier}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Dispatch Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Cancel Order</h3>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Order #{selectedOrder.orderNumber}</h4>
                  <p className="text-sm text-gray-600">Customer: {selectedOrder.customer?.name}</p>
                  <p className="text-sm text-gray-600">Total: {formatCurrency(selectedOrder.totalAmount || 0)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cancellation Reason
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Please provide a reason for cancellation..."
                  />
                </div>

                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">
                    <strong>Warning:</strong> This action cannot be undone. The order will be marked as cancelled and the customer will be notified.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Keep Order
                  </button>
                  <button
                    onClick={submitCancel}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Cancel Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showImagePreview && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-[70] flex items-center justify-center p-4 animate-fade-in">
          <div className="relative max-w-5xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <h3 className="text-xl font-bold">{selectedImage.name}</h3>
              <button
                onClick={() => setShowImagePreview(false)}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="p-8 bg-gray-50">
              <div className="max-w-4xl mx-auto">
                <img 
                  src={selectedImage.url} 
                  alt={selectedImage.name}
                  className="w-full h-auto max-h-[70vh] object-contain rounded-2xl shadow-lg"
                />
              </div>
            </div>
            <div className="p-6 bg-white border-t border-gray-200 flex justify-center">
              <button
                onClick={() => setShowImagePreview(false)}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-medium"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 