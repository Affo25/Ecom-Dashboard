'use client';

import React, { useEffect, useState } from 'react';
import RiderModal from '../../components/RiderModal';
import toast from 'react-hot-toast';
import { API_ENDPOINTS, API_BASE_URL } from '../../config/api';
import { 
  EyeIcon,
  XMarkIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  TruckIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CameraIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const RidersPage = () => {
  // State management
  const [riders, setRiders] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedRider, setSelectedRider] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [showRiderDetails, setShowRiderDetails] = useState(false);
  const [selectedRiderForDetails, setSelectedRiderForDetails] = useState(null);
  
  // Pagination, Sorting, and Filtering States
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [sorting, setSorting] = useState({
    field: 'createdAt',
    direction: 'desc'
  });
  const [filters, setFilters] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    vehicleType: '',
    isAvailable: '',
    location: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Vehicle type options
  const vehicleTypes = [
    { value: '', label: 'All Vehicles' },
    { value: 'bike', label: 'Motorcycle/Bike' },
    { value: 'car', label: 'Car' },
    { value: 'van', label: 'Van' }
  ];

  // Availability options
  const availabilityOptions = [
    { value: '', label: 'All Status' },
    { value: 'true', label: 'Available' },
    { value: 'false', label: 'Not Available' }
  ];

  // Fetch riders from API with pagination, sorting, and filtering
  const fetchRiders = async (showLoader = false) => {
    if (showLoader) setFetchLoading(true);
    try {
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
      
      const res = await fetch(`${API_ENDPOINTS.riders}?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setRiders(data.data?.riders || []);
        setPagination(prev => ({
          ...prev,
          total: data.data?.pagination?.total || 0,
          totalPages: data.data?.pagination?.totalPages || 0
        }));
      } else {
        throw new Error(data.message || 'Failed to fetch riders');
      }
    } catch (err) {
      console.error("Failed to fetch riders:", err);
      setRiders([]);
      toast.error("Failed to fetch riders. Please try again.");
    } finally {
      if (showLoader) setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders(true); // Show loader on initial fetch
  }, [pagination.page, pagination.limit, sorting.field, sorting.direction, filters]);

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
      fullName: '',
      phone: '',
      email: '',
      address: '',
      vehicleType: '',
      isAvailable: '',
      location: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sorting.field !== field) return '↕️';
    return sorting.direction === 'asc' ? '↑' : '↓';
  };

  // Handle rider form submission (both add and edit)
  const handleRiderSubmit = async (formData, mode, riderId) => {
    setSubmitLoading(true);
    setIsLoading(true);
    
    try {
      const url = mode === 'edit' 
        ? `${API_ENDPOINTS.riders}/${riderId}`
        : API_ENDPOINTS.riders;
      
      const method = mode === 'edit' ? 'PUT' : 'POST';
      
      console.log('🚀 Submitting rider:', { url, method, mode });
      console.log('📊 API_ENDPOINTS.riders:', API_ENDPOINTS.riders);
      
      const loadingToast = toast.loading(`${mode === 'edit' ? 'Updating' : 'Creating'} rider...`);
      
      const response = await fetch(url, {
        method,
        body: formData,
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error response:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Server response:', result);
      toast.dismiss(loadingToast);

      if (result.success) {
        await fetchRiders();
        setModalOpen(false);
        setModalMode('add');
        setSelectedRider(null);
        toast.success(`Rider ${mode === 'edit' ? 'updated' : 'created'} successfully!`);
      } else {
        console.error('❌ Server returned error:', result);
        toast.error(`Failed to ${mode === 'edit' ? 'update' : 'create'} rider: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Full error:', error);
      toast.error(`Error ${mode === 'edit' ? 'updating' : 'creating'} rider: ${error.message}`);
    } finally {
      setSubmitLoading(false);
      setIsLoading(false);
    }
  };

  // Handle edit rider
  const handleEditRider = (rider) => {
    setSelectedRider(rider);
    setModalMode('edit');
    setModalOpen(true);
  };

  // Handle delete rider
  const handleDeleteRider = async (riderId, riderName) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${riderName}"? This action cannot be undone.`);
    
    if (!confirmDelete) return;

    setDeleteLoading(riderId);
    const loadingToast = toast.loading(`Deleting rider "${riderName}"...`);
    
    try {
      const response = await fetch(`${API_ENDPOINTS.riders}/${riderId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      toast.dismiss(loadingToast);

      if (result.success) {
        await fetchRiders();
        toast.success(`Rider "${riderName}" deleted successfully!`);
      } else {
        toast.error(`Failed to delete rider: ${result.message}`);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Error deleting rider. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Handle toggle availability
  const handleToggleAvailability = async (riderId, currentStatus) => {
    const loadingToast = toast.loading(`${currentStatus ? 'Making unavailable' : 'Making available'}...`);
    
    try {
      const response = await fetch(`${API_ENDPOINTS.riders}/${riderId}/availability`, {
        method: 'PATCH',
      });

      const result = await response.json();
      toast.dismiss(loadingToast);

      if (result.success) {
        await fetchRiders();
        toast.success(result.message);
      } else {
        toast.error(`Failed to update availability: ${result.message}`);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Error updating availability. Please try again.');
    }
  };

  // Handle add new rider
  const handleAddRider = () => {
    setSelectedRider(null);
    setModalMode('add');
    setModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalOpen(false);
    setModalMode('add');
    setSelectedRider(null);
  };

  // Handle view rider details
  const handleViewRider = (rider) => {
    setSelectedRiderForDetails(rider);
    setShowRiderDetails(true);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get vehicle icon
  const getVehicleIcon = (vehicleType) => {
    switch (vehicleType) {
      case 'bike': return '🏍️';
      case 'car': return '🚗';
      case 'van': return '🚐';
      default: return '🚚';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <UserIcon className="h-8 w-8 text-blue-600" />
              Delivery Riders
            </h1>
            <p className="text-gray-600 mt-1">Manage your delivery team and track their availability</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
              Total: {pagination.total} riders
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <button
              onClick={handleAddRider}
              disabled={isLoading || submitLoading || fetchLoading}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              {isLoading || submitLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Loading...
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4" />
                  Add Rider
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={filters.fullName}
                onChange={(e) => handleFilterChange('fullName', e.target.value)}
                placeholder="Search by name..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={filters.phone}
                onChange={(e) => handleFilterChange('phone', e.target.value)}
                placeholder="Search by phone..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input
                type="text"
                value={filters.email}
                onChange={(e) => handleFilterChange('email', e.target.value)}
                placeholder="Search by email..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={filters.address}
                onChange={(e) => handleFilterChange('address', e.target.value)}
                placeholder="Search by address..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle Type</label>
              <select
                value={filters.vehicleType}
                onChange={(e) => handleFilterChange('vehicleType', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {vehicleTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Availability</label>
              <select
                value={filters.isAvailable}
                onChange={(e) => handleFilterChange('isAvailable', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {availabilityOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-8 py-6">
        {/* Loading State */}
        {fetchLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading riders...</span>
          </div>
        ) : riders.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No riders found</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first delivery rider.</p>
            <button
              onClick={handleAddRider}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium flex items-center gap-2 mx-auto"
            >
              <PlusIcon className="h-5 w-5" />
              Add First Rider
            </button>
          </div>
        ) : (
          /* Riders Table */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Riders List</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Show:</span>
                    <select
                      value={pagination.limit}
                      onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <span>per page</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('fullName')}
                    >
                      <div className="flex items-center gap-1">
                        Rider Info {getSortIcon('fullName')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('phone')}
                    >
                      <div className="flex items-center gap-1">
                        Contact {getSortIcon('phone')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('address')}
                    >
                      <div className="flex items-center gap-1">
                        Address {getSortIcon('address')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('vehicleType')}
                    >
                      <div className="flex items-center gap-1">
                        Vehicle {getSortIcon('vehicleType')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('isAvailable')}
                    >
                      <div className="flex items-center gap-1">
                        Status {getSortIcon('isAvailable')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center gap-1">
                        Added {getSortIcon('createdAt')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {riders.map((rider) => (
                    <tr key={rider._id} className="hover:bg-gray-50 transition-colors">
                      {/* Rider Info */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {rider.image ? (
                              <img
                                className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                                src={rider.image}
                                alt={rider.fullName}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                                <UserIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {rider.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {rider._id.slice(-6)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center gap-1">
                          <PhoneIcon className="h-4 w-4 text-gray-400" />
                          {rider.phone}
                        </div>
                        {rider.email && (
                          <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                            {rider.email}
                          </div>
                        )}
                      </td>

                      {/* Address */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 flex items-start gap-1">
                          <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2 max-w-xs">
                            {rider.address || 'No address provided'}
                          </span>
                        </div>
                      </td>

                      {/* Vehicle */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getVehicleIcon(rider.vehicleType)}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900 capitalize">
                              {rider.vehicleType}
                            </div>
                            {rider.licenseNumber && (
                              <div className="text-xs text-gray-500">
                                License: {rider.licenseNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleAvailability(rider._id, rider.isAvailable)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                            rider.isAvailable
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {rider.isAvailable ? (
                            <>
                              <CheckCircleIcon className="h-3 w-3 mr-1" />
                              Available
                            </>
                          ) : (
                            <>
                              <XCircleIcon className="h-3 w-3 mr-1" />
                              Unavailable
                            </>
                          )}
                        </button>
                      </td>

                      {/* Orders */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {rider.assignedOrders?.length || 0} orders
                          </span>
                        </div>
                      </td>

                      {/* Added Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          {formatDate(rider.createdAt)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewRider(rider)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
                            title="View details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditRider(rider)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                            title="Edit rider"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRider(rider._id, rider.fullName)}
                            disabled={deleteLoading === rider._id}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Delete rider"
                          >
                            {deleteLoading === rider._id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                              <TrashIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} riders
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, pagination.page - 2) + i;
                        if (pageNum > pagination.totalPages) return null;
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium ${
                              pageNum === pagination.page
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      Next
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rider Details Modal */}
      {showRiderDetails && selectedRiderForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <UserIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Rider Details</h3>
                  <p className="text-blue-100 text-sm">View rider information and statistics</p>
                </div>
              </div>
              <button
                onClick={() => setShowRiderDetails(false)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              <div className="space-y-6">
                {/* Rider Profile */}
                <div className="flex items-center space-x-4">
                  {selectedRiderForDetails.image ? (
                    <img
                      src={selectedRiderForDetails.image}
                      alt={selectedRiderForDetails.fullName}
                      className="h-20 w-20 rounded-full object-cover border-4 border-gray-200"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-200">
                      <UserIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900">{selectedRiderForDetails.fullName}</h4>
                    <p className="text-gray-600">Rider ID: {selectedRiderForDetails._id}</p>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                      selectedRiderForDetails.isAvailable
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedRiderForDetails.isAvailable ? (
                        <>
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Available
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          Unavailable
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h5 className="font-semibold text-gray-900">Contact Information</h5>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <PhoneIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-900">{selectedRiderForDetails.phone}</span>
                      </div>
                      {selectedRiderForDetails.email && (
                        <div className="flex items-center space-x-3">
                          <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-900">{selectedRiderForDetails.email}</span>
                        </div>
                      )}
                      {selectedRiderForDetails.address && (
                        <div className="flex items-start space-x-3">
                          <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-gray-700">Address:</div>
                            <span className="text-gray-900">{selectedRiderForDetails.address}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="font-semibold text-gray-900">Vehicle Information</h5>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <TruckIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <span className="text-gray-900 capitalize">{selectedRiderForDetails.vehicleType}</span>
                          <span className="text-2xl ml-2">{getVehicleIcon(selectedRiderForDetails.vehicleType)}</span>
                        </div>
                      </div>
                      {selectedRiderForDetails.licenseNumber && (
                        <div className="flex items-center space-x-3">
                          {/* <DocumentTextIcon className="h-5 w-5 text-gray-400" /> */}
                          <span className="text-gray-900">License: {selectedRiderForDetails.licenseNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location */}
                {selectedRiderForDetails.location?.coordinates && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-3">Location</h5>
                    <div className="flex items-center space-x-3">
                      <MapPinIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">
                        {selectedRiderForDetails.location.coordinates[1]?.toFixed(6)}, {selectedRiderForDetails.location.coordinates[0]?.toFixed(6)}
                      </span>
                    </div>
                  </div>
                )}

                {/* CNIC Images */}
                {(selectedRiderForDetails.cnicFrontImage || selectedRiderForDetails.cnicBackImage) && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-3">CNIC Images</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedRiderForDetails.cnicFrontImage && (
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-2">Front Side</div>
                          <div className="border rounded-lg overflow-hidden">
                            <img 
                              src={selectedRiderForDetails.cnicFrontImage} 
                              alt="CNIC Front" 
                              className="w-full h-32 object-cover hover:scale-105 transition-transform cursor-pointer"
                              onClick={() => window.open(selectedRiderForDetails.cnicFrontImage, '_blank')}
                            />
                          </div>
                        </div>
                      )}
                      {selectedRiderForDetails.cnicBackImage && (
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-2">Back Side</div>
                          <div className="border rounded-lg overflow-hidden">
                            <img 
                              src={selectedRiderForDetails.cnicBackImage} 
                              alt="CNIC Back" 
                              className="w-full h-32 object-cover hover:scale-105 transition-transform cursor-pointer"
                              onClick={() => window.open(selectedRiderForDetails.cnicBackImage, '_blank')}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Vehicle Document */}
                {selectedRiderForDetails.bikeDocument && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-3">Vehicle Document</h5>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">Vehicle Registration Document</div>
                          <div className="text-xs text-gray-500">PDF Document</div>
                        </div>
                        <button
                          onClick={() => window.open(selectedRiderForDetails.bikeDocument, '_blank')}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          View PDF
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Statistics */}
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3">Order Statistics</h5>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Assigned Orders:</span>
                      <span className="font-semibold text-gray-900">
                        {selectedRiderForDetails.assignedOrders?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Joined:</span>
                    <div className="mt-1">{formatDate(selectedRiderForDetails.createdAt)}</div>
                  </div>
                  <div>
                    <span className="font-medium">Last Updated:</span>
                    <div className="mt-1">{formatDate(selectedRiderForDetails.updatedAt)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowRiderDetails(false);
                  handleEditRider(selectedRiderForDetails);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
              >
                <PencilIcon className="h-4 w-4" />
                Edit Rider
              </button>
              <button
                onClick={() => setShowRiderDetails(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rider Modal */}
      <RiderModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSubmit={handleRiderSubmit}
        rider={selectedRider}
        mode={modalMode}
        isLoading={submitLoading}
      />
    </div>
  );
};

export default RidersPage;