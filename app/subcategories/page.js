'use client';

import React, { useEffect, useState } from 'react';
import SubcategoryModal from '../../components/SubcategoryModal';
import toast from 'react-hot-toast';
import { API_ENDPOINTS, API_BASE_URL } from '../../config/api';
import { 
  EyeIcon,
  XMarkIcon,
  TagIcon,
  FolderIcon,
  PhotoIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SwatchIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const SubcategoriesPage = () => {
  const [subcategories, setSubcategories] = useState([]);
  const [parentCategories, setParentCategories] = useState([]); // For modal and filtering
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [selectedSubcategoryForDetails, setSelectedSubcategoryForDetails] = useState(null);
  const [showSubcategoryDetails, setShowSubcategoryDetails] = useState(false);
  
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
    name: '',
    is_active: '',
    is_featured: '',
    parent_id: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch subcategories from API with pagination, sorting, and filtering
  const fetchSubcategories = async (showLoader = false) => {
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
      
      const res = await fetch(`${API_ENDPOINTS.subcategories}?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setSubcategories(data.data?.subcategories || []);
        setPagination(prev => ({
          ...prev,
          total: data.data?.pagination?.total || 0,
          totalPages: data.data?.pagination?.totalPages || 0
        }));
      } else {
        throw new Error(data.message || 'Failed to fetch subcategories');
      }
    } catch (err) {
      console.error("Failed to fetch subcategories:", err);
      setSubcategories([]);
      toast.error("Failed to fetch subcategories. Please try again.");
    } finally {
      if (showLoader) setFetchLoading(false);
    }
  };

  // Fetch parent categories for modal and filtering
  const fetchParentCategories = async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS.categories}/all`);
      const data = await res.json();
      
      if (data.success) {
        // Filter to get only root categories (categories without parent_id)
        const rootCategories = (data.data || []).filter(cat => !cat.parent_id);
        setParentCategories(rootCategories);
      }
    } catch (err) {
      console.error("Failed to fetch parent categories:", err);
    }
  };

  useEffect(() => {
    fetchSubcategories(true); // Show loader on initial fetch
    fetchParentCategories();
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
      name: '',
      is_active: '',
      is_featured: '',
      parent_id: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sorting.field !== field) return '↕️';
    return sorting.direction === 'asc' ? '↑' : '↓';
  };

  // Handle subcategory form submission (both add and edit)
  const handleSubcategorySubmit = async (formData, mode, subcategoryId) => {
    setSubmitLoading(true);
    setIsLoading(true);
    console.log(formData);
    try {
      const url = mode === 'edit' 
        ? `${API_ENDPOINTS.subcategories}/${subcategoryId}`
        : API_ENDPOINTS.subcategories;
      
      const method = mode === 'edit' ? 'PUT' : 'POST';
      
      // Show loading toast
      const loadingToast = toast.loading(`${mode === 'edit' ? 'Updating' : 'Creating'} subcategory...`);
      
      const response = await fetch(url, {
        method,
        body: formData, // FormData is already prepared in SubcategoryModal
      });

      const result = await response.json();

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (result.success) {
        console.log(`Subcategory ${mode === 'edit' ? 'updated' : 'created'} successfully:`, result.data);
        // Refresh the subcategory list
        await fetchSubcategories();
        // Close the modal
        setModalOpen(false);
        // Reset modal state
        setModalMode('add');
        setSelectedSubcategory(null);
        // Show success message
        toast.success(`Subcategory ${mode === 'edit' ? 'updated' : 'created'} successfully!`);
      } else {
        console.error(`Failed to ${mode === 'edit' ? 'update' : 'create'} subcategory:`, result.message);
        toast.error(`Failed to ${mode === 'edit' ? 'update' : 'create'} subcategory: ${result.message}`);
      }
    } catch (error) {
      console.error(`Error ${mode === 'edit' ? 'updating' : 'creating'} subcategory:`, error);
      toast.error(`Error ${mode === 'edit' ? 'updating' : 'creating'} subcategory. Please try again.`);
    } finally {
      setSubmitLoading(false);
      setIsLoading(false);
    }
  };

  // Handle edit subcategory
  const handleEditSubcategory = (subcategory) => {
    setSelectedSubcategory(subcategory);
    setModalMode('edit');
    setModalOpen(true);
  };

  // Handle delete subcategory
  const handleDeleteSubcategory = async (subcategoryId, subcategoryName) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${subcategoryName}"? This action cannot be undone.`);
    
    if (!confirmDelete) return;

    setDeleteLoading(subcategoryId);
    
    // Show loading toast
    const loadingToast = toast.loading(`Deleting subcategory "${subcategoryName}"...`);
    
    try {
      const response = await fetch(`${API_ENDPOINTS.subcategories}/${subcategoryId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (result.success) {
        console.log('Subcategory deleted successfully:', result.data);
        // Refresh the subcategory list
        await fetchSubcategories();
        // Show success message
        toast.success(`Subcategory "${subcategoryName}" deleted successfully!`);
      } else {
        console.error('Failed to delete subcategory:', result.message);
        toast.error(`Failed to delete subcategory: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      toast.dismiss(loadingToast);
      toast.error('Error deleting subcategory. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Handle add new subcategory
  const handleAddSubcategory = () => {
    setSelectedSubcategory(null);
    setModalMode('add');
    setModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalOpen(false);
    setModalMode('add');
    setSelectedSubcategory(null);
  };

  // Handle view subcategory details
  const handleViewSubcategory = (subcategory) => {
    setSelectedSubcategoryForDetails(subcategory);
    setShowSubcategoryDetails(true);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get parent category name
  const getParentName = (subcategory) => {
    if (!subcategory.parent_id) return 'No Parent';
    // If populated, use the populated data
    if (subcategory.parent_id && typeof subcategory.parent_id === 'object') {
      return subcategory.parent_id.name || 'Unknown';
    }
    // Otherwise find from parentCategories
    const parent = parentCategories.find(cat => cat._id === subcategory.parent_id);
    return parent?.name || 'Unknown';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Subcategories</h1>
            <p className="text-gray-600 mt-1">Manage product subcategories under parent categories</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
              Total: {pagination.total} subcategories
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
            >
              <FunnelIcon className="h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <button
              onClick={handleAddSubcategory}
              disabled={isLoading || submitLoading || fetchLoading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl transition-all font-medium"
            >
              {isLoading || submitLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Loading...
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4" />
                  Add Subcategory
                </>
              )}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory Name</label>
              <input
                type="text"
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Search by name..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.is_active}
                onChange={(e) => handleFilterChange('is_active', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Featured</label>
              <select
                value={filters.is_featured}
                onChange={(e) => handleFilterChange('is_featured', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Subcategories</option>
                <option value="true">Featured Only</option>
                <option value="false">Non-Featured</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Parent Category</label>
              <select
                value={filters.parent_id}
                onChange={(e) => handleFilterChange('parent_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Parents</option>
                {parentCategories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {fetchLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <>
          {/* Subcategories Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Name {getSortIcon('name')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parent Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('sort_order')}
                    >
                      <div className="flex items-center gap-1">
                        Sort Order {getSortIcon('sort_order')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-1">
                        Created {getSortIcon('created_at')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subcategories.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        <FolderIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-1">No subcategories found</p>
                        <p className="text-gray-500">Create your first subcategory to get started.</p>
                      </td>
                    </tr>
                  ) : (
                    subcategories.map((subcategory) => (
                      <tr key={subcategory._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div 
                              className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                              style={{ backgroundColor: subcategory.color }}
                            ></div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{subcategory.name}</div>
                              <div className="text-sm text-gray-500">{subcategory.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {subcategory.parent_id && (
                              <div 
                                className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                                style={{ backgroundColor: (typeof subcategory.parent_id === 'object' ? subcategory.parent_id.color : null) || '#6B7280' }}
                              ></div>
                            )}
                            <span className="text-sm text-gray-900">
                              {getParentName(subcategory)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {subcategory.image ? (
                            <img
                              src={subcategory.image.startsWith('http') ? subcategory.image : `${API_BASE_URL}${subcategory.image}`}
                              alt={subcategory.name}
                              className="h-12 w-12 rounded-lg object-cover border border-gray-300"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-300">
                              <PhotoIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subcategory.sort_order}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {subcategory.is_active ? (
                              <CheckCircleIcon className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircleIcon className="h-5 w-5 text-red-500" />
                            )}
                            {subcategory.is_featured && (
                              <StarIcon className="h-5 w-5 text-yellow-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(subcategory.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewSubcategory(subcategory)}
                              className="text-purple-600 hover:text-purple-900 transition-colors p-1 rounded hover:bg-purple-50"
                              title="View Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditSubcategory(subcategory)}
                              disabled={deleteLoading === subcategory._id || isLoading}
                              className="text-yellow-600 hover:text-yellow-900 transition-colors p-1 rounded hover:bg-yellow-50 disabled:opacity-50"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubcategory(subcategory._id, subcategory.name)}
                              disabled={deleteLoading === subcategory._id || isLoading}
                              className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50 disabled:opacity-50"
                              title="Delete"
                            >
                              {deleteLoading === subcategory._id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              ) : (
                                <TrashIcon className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">
                        {(pagination.page - 1) * pagination.limit + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium">{pagination.total}</span>{' '}
                      results
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700">Show:</label>
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
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px ml-4">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={!pagination.hasPrev}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pagination.page === pageNum
                                ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={!pagination.hasNext}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Subcategory Modal */}
      {modalOpen && (
        <SubcategoryModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          onSubmit={handleSubcategorySubmit}
          subcategory={selectedSubcategory}
          mode={modalMode}
          isLoading={submitLoading}
          parentCategories={parentCategories}
        />
      )}

      {/* Subcategory Details Modal */}
      {showSubcategoryDetails && selectedSubcategoryForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Subcategory Details</h2>
              <button
                onClick={() => setShowSubcategoryDetails(false)}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Name:</span>
                      <p className="text-gray-900">{selectedSubcategoryForDetails.name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Slug:</span>
                      <p className="text-gray-900">{selectedSubcategoryForDetails.slug}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Description:</span>
                      <p className="text-gray-900">{selectedSubcategoryForDetails.description || 'No description'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Parent Category:</span>
                      <p className="text-gray-900">{selectedSubcategoryForDetails.parent?.name || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Display & Settings</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Color:</span>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: selectedSubcategoryForDetails.color }}
                        ></div>
                        <span className="text-gray-900">{selectedSubcategoryForDetails.color}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Sort Order:</span>
                      <p className="text-gray-900">{selectedSubcategoryForDetails.sort_order}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Status:</span>
                      <div className="flex items-center gap-2">
                        {selectedSubcategoryForDetails.is_active ? (
                          <>
                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                            <span className="text-green-700">Active</span>
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="h-5 w-5 text-red-500" />
                            <span className="text-red-700">Inactive</span>
                          </>
                        )}
                        {selectedSubcategoryForDetails.is_featured && (
                          <>
                            <StarIcon className="h-5 w-5 text-yellow-500 ml-2" />
                            <span className="text-yellow-700">Featured</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Created:</span>
                      <p className="text-gray-900">{formatDate(selectedSubcategoryForDetails.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedSubcategoryForDetails.image && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Subcategory Image</h3>
                  <img
                    src={selectedSubcategoryForDetails.image.startsWith('http') 
                      ? selectedSubcategoryForDetails.image 
                      : `${API_BASE_URL}${selectedSubcategoryForDetails.image}`
                    }
                    alt={selectedSubcategoryForDetails.name}
                    className="w-32 h-32 rounded-lg object-cover border border-gray-300"
                  />
                </div>
              )}

              {(selectedSubcategoryForDetails.meta_title || selectedSubcategoryForDetails.meta_description) && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Information</h3>
                  <div className="space-y-3">
                    {selectedSubcategoryForDetails.meta_title && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Meta Title:</span>
                        <p className="text-gray-900">{selectedSubcategoryForDetails.meta_title}</p>
                      </div>
                    )}
                    {selectedSubcategoryForDetails.meta_description && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Meta Description:</span>
                        <p className="text-gray-900">{selectedSubcategoryForDetails.meta_description}</p>
                      </div>
                    )}
                    {selectedSubcategoryForDetails.meta_keywords?.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Meta Keywords:</span>
                        <p className="text-gray-900">{selectedSubcategoryForDetails.meta_keywords.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubcategoriesPage;