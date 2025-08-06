'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart 
} from 'recharts';
import { API_ENDPOINTS } from '../../config/api';
import toast from 'react-hot-toast';

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [orderStatusData, setOrderStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [period, setPeriod] = useState('daily');

  // Debounce the API calls to prevent too many requests
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAllData();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [timeRange, period]);

  // Initial load
  useEffect(() => {
    fetchAllData();
  }, []);

  // Combined function to fetch all data with better error handling
  const fetchAllData = async () => {
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    
    console.log('Analytics: Checking token...', token ? 'Token found' : 'No token');
    
    if (!token) {
      console.log('Analytics: No token found, redirecting to login');
      toast.error('Please login to view analytics');
      setLoading(false);
      // Redirect to login page
      window.location.href = '/login';
      return;
    }

    try {
      // Use Promise.allSettled to handle multiple requests safely
      const [analyticsResponse, orderStatusResponse] = await Promise.allSettled([
        fetch(`${API_ENDPOINTS.analytics}?days=${timeRange}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch(`${API_ENDPOINTS.analyticsOrders}?days=${timeRange}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      ]);

      // Handle analytics data
      if (analyticsResponse.status === 'fulfilled' && analyticsResponse.value.ok) {
        const data = await analyticsResponse.value.json();
        console.log('Analytics data received:', data);
        setAnalyticsData(data);
      } else if (analyticsResponse.status === 'fulfilled') {
        const status = analyticsResponse.value.status;
        if (status === 401) {
          toast.error('Authentication failed. Please login again.');
          localStorage.removeItem('adminToken');
          window.location.href = '/login';
          return;
        } else if (status === 429) {
          toast.error('Too many requests. Please wait a moment and try again.');
        } else {
          console.error('Analytics request failed:', status, analyticsResponse.value.statusText);
          toast.error(`Failed to fetch analytics data (${status})`);
        }
      } else {
        console.error('Analytics request failed:', analyticsResponse.reason);
        toast.error('Network error fetching analytics data');
      }

      // Handle order status data
      if (orderStatusResponse.status === 'fulfilled' && orderStatusResponse.value.ok) {
        const data = await orderStatusResponse.value.json();
        setOrderStatusData(data);
      } else if (orderStatusResponse.status === 'fulfilled') {
        const status = orderStatusResponse.value.status;
        if (status === 401) {
          // Authentication failed - already handled above
          return;
        } else if (status === 429) {
          console.warn('Rate limited on order status data');
        } else {
          console.error('Failed to fetch order status data:', status);
        }
      } else {
        console.error('Order status request failed:', orderStatusResponse.reason);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error fetching analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Individual fetch functions for manual refresh (if needed)
  const fetchAnalyticsData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_ENDPOINTS.analytics}?days=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Analytics data received:', data);
        setAnalyticsData(data);
      } else if (response.status === 429) {
        toast.error('Too many requests. Please wait a moment and try again.');
      } else {
        console.error('Failed to fetch analytics data:', response.status);
        toast.error('Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Error fetching analytics data');
    }
  };

  const fetchOrderStatusData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_ENDPOINTS.analyticsOrders}?days=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrderStatusData(data);
      } else if (response.status === 429) {
        console.warn('Rate limited on order status data');
      } else {
        console.error('Failed to fetch order status data:', response.status);
      }
    } catch (error) {
      console.error('Error fetching order status data:', error);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your business performance and insights</p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </>
            )}
          </button>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${analyticsData?.summary?.totalRevenue?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData?.summary?.totalOrders || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData?.summary?.newCustomers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ${analyticsData?.summary?.averageOrderValue?.toFixed(2) || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Chart */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Revenue Trend</h2>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData?.revenueData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders Chart */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Orders Trend</h2>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData?.ordersData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="orders" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Products */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top Selling Products</h2>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData?.topProducts || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Sales by Category</h2>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData?.categoryData || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(analyticsData?.categoryData || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Order Status Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Order Status Breakdown */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Order Status Breakdown</h2>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderStatusData?.data?.statusData || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {(orderStatusData?.data?.statusData || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Combined Revenue and Orders */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Revenue vs Orders</h2>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={(() => {
                const revenueData = analyticsData?.revenueData || [];
                const ordersData = analyticsData?.ordersData || [];
                
                // Combine revenue and orders data by date
                const combinedData = revenueData.map(revItem => {
                  const orderItem = ordersData.find(ordItem => ordItem.date === revItem.date);
                  return {
                    date: revItem.date,
                    revenue: revItem.revenue || 0,
                    orders: orderItem?.orders || 0
                  };
                });
                
                return combinedData;
              })()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" fill="#3B82F6" name="Revenue ($)" />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2} name="Orders" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Monthly Performance */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Monthly Performance</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current Month Revenue</span>
                <span className="text-lg font-semibold text-green-600">
                  ${analyticsData?.summary?.totalRevenue?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current Month Orders</span>
                <span className="text-lg font-semibold text-blue-600">
                  {analyticsData?.summary?.totalOrders || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Growth Rate</span>
                <span className="text-lg font-semibold text-purple-600">
                  +{((analyticsData?.summary?.totalOrders || 0) * 0.15).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Fulfillment */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Order Fulfillment</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {(orderStatusData?.data?.statusData || []).map((status, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{status.status}</span>
                  <div className="flex items-center">
                    <span className="text-lg font-semibold mr-2">{status.count}</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(status.count / (orderStatusData?.data?.statusData?.reduce((sum, s) => sum + s.count, 0) || 1)) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Key Metrics</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {((analyticsData?.summary?.totalRevenue || 0) / (analyticsData?.summary?.totalOrders || 1)).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Average Order Value</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analyticsData?.summary?.newCustomers || 0}
                </div>
                <div className="text-sm text-gray-600">New Customers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {((analyticsData?.summary?.totalOrders || 0) / parseInt(timeRange)).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Orders Per Day</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 