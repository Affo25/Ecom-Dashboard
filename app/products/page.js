'use client';

import React, { useEffect, useState } from 'react';
import ProductModal from '../../components/ProductModal';
import toast from 'react-hot-toast';
import { API_ENDPOINTS, API_BASE_URL } from '../../config/api';
import { 
  EyeIcon,
  XMarkIcon,
  ShoppingBagIcon,
  TagIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  PhotoIcon,
  StarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PrinterIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  TruckIcon,
  ScaleIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';


const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null); // Track which product is being deleted
  const [submitLoading, setSubmitLoading] = useState(false); // Track form submission loading
  const [fetchLoading, setFetchLoading] = useState(false); // Track initial fetch loading
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState(null);
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
    name: '',
    sku: '',
    price_min: '',
    price_max: '',
    stock_min: '',
    stock_max: '',
    status: '',
    featured: '',
    category: ''
  });
  const [showFilters, setShowFilters] = useState(false);


  // Fetch products from API with pagination, sorting, and filtering
  const fetchProducts = async (showLoader = false) => {
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
      
      const res = await fetch(`${API_ENDPOINTS.products}?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setProducts(data.data?.products || []);
        setPagination(prev => ({
          ...prev,
          total: data.data?.pagination?.total || 0,
          totalPages: data.data?.pagination?.totalPages || 0
        }));
      } else {
        throw new Error(data.message || 'Failed to fetch products');
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setProducts([]);
      toast.error("Failed to fetch products. Please try again.");
    } finally {
      if (showLoader) setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(true); // Show loader on initial fetch
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
      sku: '',
      price_min: '',
      price_max: '',
      stock_min: '',
      stock_max: '',
      status: '',
      featured: '',
      category: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sorting.field !== field) return '↕️';
    return sorting.direction === 'asc' ? '↑' : '↓';
  };

  // Handle product form submission (both add and edit)
  const handleProductSubmit = async (formData, mode, productId) => {
    setSubmitLoading(true);
    setIsLoading(true);
    
    try {
      const url = mode === 'edit' 
        ? `${API_ENDPOINTS.products}/${productId}`
        : API_ENDPOINTS.products;
      
      const method = mode === 'edit' ? 'PUT' : 'POST';
      
      // Show loading toast
      const loadingToast = toast.loading(`${mode === 'edit' ? 'Updating' : 'Saving'} product...`);
      
      const response = await fetch(url, {
        method,
        body: formData, // FormData is already prepared in ProductModal
      });

      const result = await response.json();

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (result.success) {
        console.log(`Product ${mode === 'edit' ? 'updated' : 'saved'} successfully:`, result.data);
        // Refresh the product list
        await fetchProducts();
        // Close the modal
        setModalOpen(false);
        // Reset modal state
        setModalMode('add');
        setSelectedProduct(null);
        // Show success message
        toast.success(`Product ${mode === 'edit' ? 'updated' : 'saved'} successfully!`);
      } else {
        console.error(`Failed to ${mode === 'edit' ? 'update' : 'save'} product:`, result.message);
        toast.error(`Failed to ${mode === 'edit' ? 'update' : 'save'} product: ${result.message}`);
      }
    } catch (error) {
      console.error(`Error ${mode === 'edit' ? 'updating' : 'saving'} product:`, error);
      toast.error(`Error ${mode === 'edit' ? 'updating' : 'saving'} product. Please try again.`);
    } finally {
      setSubmitLoading(false);
      setIsLoading(false);
    }
  };

  // Handle edit product
  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setModalMode('edit');
    setModalOpen(true);
  };

  // Handle delete product
  const handleDeleteProduct = async (productId, productName) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`);
    
    if (!confirmDelete) return;

    setDeleteLoading(productId);
    
    // Show loading toast
    const loadingToast = toast.loading(`Deleting product "${productName}"...`);
    
    try {
      const response = await fetch(`${API_ENDPOINTS.products}/${productId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (result.success) {
        console.log('Product deleted successfully:', result.data);
        // Refresh the product list
        await fetchProducts();
        // Show success message
        toast.success(`Product "${productName}" deleted successfully!`);
      } else {
        console.error('Failed to delete product:', result.message);
        toast.error(`Failed to delete product: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.dismiss(loadingToast);
      toast.error('Error deleting product. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Handle add new product
  const handleAddProduct = () => {
    setSelectedProduct(null);
    setModalMode('add');
    setModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalOpen(false);
    setModalMode('add');
    setSelectedProduct(null);
  };

  // Handle view product details
  const handleViewProduct = (product) => {
    setSelectedProductForDetails(product);
    setShowProductDetails(true);
  };

  // Handle image preview
  const handleImagePreview = (imageUrl, productName) => {
    setSelectedImage({ url: imageUrl, name: productName });
    setShowImagePreview(true);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // ... existing code ...

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600 mt-1">Manage your product catalog and inventory</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
              Total: {pagination.total} products
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
              </svg>
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <button
              onClick={handleAddProduct}
              disabled={isLoading || submitLoading || fetchLoading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl transition-all font-medium"
            >
              {isLoading || submitLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Loading...
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4" />
                  Add Product
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
              <input
                type="text"
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Search by name..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
              <input
                type="text"
                value={filters.sku}
                onChange={(e) => handleFilterChange('sku', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Search by SKU..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Price</label>
              <input
                type="number"
                value={filters.price_min}
                onChange={(e) => handleFilterChange('price_min', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
              <input
                type="number"
                value={filters.price_max}
                onChange={(e) => handleFilterChange('price_max', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="999999"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Stock</label>
              <input
                type="number"
                value={filters.stock_min}
                onChange={(e) => handleFilterChange('stock_min', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Stock</label>
              <input
                type="number"
                value={filters.stock_max}
                onChange={(e) => handleFilterChange('stock_max', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="999999"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Featured</label>
              <select
                value={filters.featured}
                onChange={(e) => handleFilterChange('featured', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Products</option>
                <option value="true">Featured</option>
                <option value="false">Not Featured</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <input
                type="text"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Search by category..."
              />
            </div>
          </div>
        </div>
      )}

      <ProductModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSubmit={handleProductSubmit}
        product={selectedProduct}
        mode={modalMode}
        isLoading={submitLoading}
      />
      
      {fetchLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Loading products...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBagIcon className="h-20 w-20 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-500 mb-2">No products found</p>
          <p className="text-gray-400">Add your first product to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                    >
                      <span>Product</span>
                      <span className="text-gray-400">{getSortIcon('name')}</span>
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('price')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                    >
                      <span>Price</span>
                      <span className="text-gray-400">{getSortIcon('price')}</span>
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('quantity_in_stock')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                    >
                      <span>Stock</span>
                      <span className="text-gray-400">{getSortIcon('quantity_in_stock')}</span>
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('is_active')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                    >
                      <span>Status</span>
                      <span className="text-gray-400">{getSortIcon('is_active')}</span>
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('created_at')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                    >
                      <span>Created</span>
                      <span className="text-gray-400">{getSortIcon('created_at')}</span>
                    </button>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product, index) => (
                  <tr key={product._id || index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img 
                              src={product.images[0].startsWith('http') ? product.images[0] : `${API_BASE_URL}${product.images[0]}`}
                              alt={product.name}
                              className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-200"
                              onClick={() => handleImagePreview(product.images[0].startsWith('http') ? product.images[0] : `${API_BASE_URL}${product.images[0]}`, product.name)}
                            />
                          ) : (
                            <ShoppingBagIcon className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {product.name || 'Unnamed Product'}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            SKU: {product.sku || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {product.short_description || product.description || 'No description'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(product.price || 0)}
                      </div>
                      {product.sale_price && product.sale_price !== product.price && (
                        <div className="text-xs text-red-600 line-through">
                          {formatCurrency(product.sale_price)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.quantity_in_stock || 0} units
                      </div>
                      <div className={`text-xs ${product.quantity_in_stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {product.quantity_in_stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {product.featured && (
                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Featured
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(product.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewProduct(product)}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditProduct(product)}
                          disabled={isLoading || submitLoading || deleteLoading === product._id || fetchLoading}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Edit Product"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product._id, product.name)}
                          disabled={isLoading || submitLoading || deleteLoading === product._id || fetchLoading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Delete Product"
                        >
                          {deleteLoading === product._id ? (
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
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  disabled={pagination.page === 1 || fetchLoading}
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
                        disabled={fetchLoading}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                          pagination.page === page
                            ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
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
                  disabled={pagination.page === pagination.totalPages || fetchLoading}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Professional Product Details Modal */}
      {showProductDetails && selectedProductForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-70 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-[95vw] max-h-[95vh] overflow-hidden transform transition-all duration-300 animate-slide-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                    <ShoppingBagIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">Product Details</h2>
                    <p className="text-purple-100 text-lg">{selectedProductForDetails.name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-purple-100 text-sm">Price</p>
                    <p className="text-3xl font-bold">{formatCurrency(selectedProductForDetails.price || 0)}</p>
                  </div>
                  <button
                    onClick={() => setShowProductDetails(false)}
                    className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col xl:flex-row h-full">
              {/* Left Panel - Product Information */}
              <div className="xl:w-1/3 bg-gray-50 border-r border-gray-200 p-6 overflow-y-auto modal-scroll">
                <div className="space-y-6">
                  {/* Product Status Card */}
                  <div className="bg-white rounded-2xl p-6 shadow-card hover-lift">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <TagIcon className="h-5 w-5 text-purple-600 mr-2" />
                        Product Status
                      </h3>
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                        selectedProductForDetails.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedProductForDetails.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">SKU</p>
                        <p className="font-medium text-gray-900">{selectedProductForDetails.sku || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Stock</p>
                        <p className="font-medium text-gray-900">{selectedProductForDetails.quantity_in_stock || 0} units</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Weight</p>
                        <p className="font-medium text-gray-900">{selectedProductForDetails.weight || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Featured</p>
                        <p className="font-medium text-gray-900">{selectedProductForDetails.featured ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Information Card */}
                  <div className="bg-white rounded-2xl p-6 shadow-card hover-lift">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <CurrencyDollarIcon className="h-5 w-5 text-purple-600 mr-2" />
                      Pricing Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Regular Price</span>
                        <span className="font-medium text-gray-900">{formatCurrency(selectedProductForDetails.price || 0)}</span>
                      </div>
                      {selectedProductForDetails.sale_price && selectedProductForDetails.sale_price !== selectedProductForDetails.price && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Sale Price</span>
                          <span className="font-medium text-red-600">{formatCurrency(selectedProductForDetails.sale_price)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Currency</span>
                        <span className="font-medium text-gray-900">{selectedProductForDetails.currency || 'USD'}</span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-gray-900">Total Value</span>
                          <span className="text-2xl font-bold text-purple-600">
                            {formatCurrency((selectedProductForDetails.price || 0) * (selectedProductForDetails.quantity_in_stock || 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category & Brand Card */}
                  <div className="bg-white rounded-2xl p-6 shadow-card hover-lift">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <BuildingStorefrontIcon className="h-5 w-5 text-purple-600 mr-2" />
                      Category & Brand
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Categories</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedProductForDetails.categories && selectedProductForDetails.categories.length > 0 ? (
                            selectedProductForDetails.categories.map((category, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {category}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400">No categories assigned</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Brand ID</p>
                        <p className="font-medium text-gray-900">{selectedProductForDetails.brand_id || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Shipping Class</p>
                        <p className="font-medium text-gray-900">{selectedProductForDetails.shipping_class || 'Standard'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Ratings & Reviews Card */}
                  <div className="bg-white rounded-2xl p-6 shadow-card hover-lift">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <StarIcon className="h-5 w-5 text-purple-600 mr-2" />
                      Ratings & Reviews
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon
                              key={star}
                              className={`h-4 w-4 ${
                                star <= (selectedProductForDetails.rating_average || 0) ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {selectedProductForDetails.rating_average || 0} ({selectedProductForDetails.rating_count || 0} reviews)
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Average rating based on customer reviews
                      </div>
                    </div>
                  </div>

                  {/* Timestamps Card */}
                  <div className="bg-white rounded-2xl p-6 shadow-card hover-lift">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <CalendarDaysIcon className="h-5 w-5 text-purple-600 mr-2" />
                      Timestamps
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Created</span>
                        <span className="font-medium text-gray-900">{formatDate(selectedProductForDetails.created_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Updated</span>
                        <span className="font-medium text-gray-900">{formatDate(selectedProductForDetails.updated_at || selectedProductForDetails.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Product Images & Details */}
              <div className="flex-1 p-6 overflow-y-auto modal-scroll">
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Product Gallery & Details</h3>
                      <p className="text-gray-600 mt-1">Images, descriptions, and detailed information</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Images:</span>
                      <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                        {selectedProductForDetails.images?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Product Images Gallery */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h4>
                  {selectedProductForDetails.images && selectedProductForDetails.images.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedProductForDetails.images.map((image, index) => {
                        const imageUrl = image.startsWith('http') ? image : `${API_BASE_URL}${image}`;
                        return (
                          <div key={index} className="bg-white rounded-2xl shadow-card border border-gray-200 overflow-hidden hover-lift">
                            <div className="aspect-square bg-gray-100 flex items-center justify-center cursor-pointer hover:shadow-xl transition-shadow overflow-hidden">
                              <img 
                                src={imageUrl}
                                alt={`${selectedProductForDetails.name} - Image ${index + 1}`}
                                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                                onClick={() => handleImagePreview(imageUrl, `${selectedProductForDetails.name} - Image ${index + 1}`)}
                              />
                            </div>
                            <div className="p-4 text-center">
                              <p className="text-sm text-gray-600">Image {index + 1}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl">
                      <PhotoIcon className="h-20 w-20 text-gray-400 mx-auto mb-4" />
                      <p className="text-xl text-gray-500">No images available</p>
                      <p className="text-gray-400">Add product images to showcase your product</p>
                    </div>
                  )}
                </div>

                {/* Product Description */}
                <div className="bg-white rounded-2xl shadow-card border border-gray-200 p-6 mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <DocumentTextIcon className="h-5 w-5 text-purple-600 mr-2" />
                    Product Description
                  </h4>
                  <div className="prose max-w-none">
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-900 mb-2">Short Description</h5>
                      <p className="text-gray-700 leading-relaxed">
                        {selectedProductForDetails.short_description || 'No short description available'}
                      </p>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Full Description</h5>
                      <p className="text-gray-700 leading-relaxed">
                        {selectedProductForDetails.description || 'No detailed description available'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Product Specifications */}
                <div className="bg-white rounded-2xl shadow-card border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ChartBarIcon className="h-5 w-5 text-purple-600 mr-2" />
                    Product Specifications
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Basic Information</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Product ID</span>
                          <span className="font-medium text-gray-900">{selectedProductForDetails._id?.slice(-8) || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Slug</span>
                          <span className="font-medium text-gray-900">{selectedProductForDetails.slug || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Stock Status</span>
                          <span className={`font-medium ${selectedProductForDetails.quantity_in_stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedProductForDetails.stock_status || (selectedProductForDetails.quantity_in_stock > 0 ? 'In Stock' : 'Out of Stock')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Inventory & Shipping</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Quantity in Stock</span>
                          <span className="font-medium text-gray-900">{selectedProductForDetails.quantity_in_stock || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Weight</span>
                          <span className="font-medium text-gray-900">{selectedProductForDetails.weight || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Shipping Class</span>
                          <span className="font-medium text-gray-900">{selectedProductForDetails.shipping_class || 'Standard'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-8 py-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Created on {formatDate(selectedProductForDetails.created_at)}</span>
                  <span>•</span>
                  <span>Last updated {formatDate(selectedProductForDetails.updated_at || selectedProductForDetails.created_at)}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowProductDetails(false)}
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
                    Print Product
                  </button>
                  <button
                    onClick={() => {
                      setShowProductDetails(false);
                      handleEditProduct(selectedProductForDetails);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-medium"
                  >
                    <PencilIcon className="h-4 w-4 inline mr-2" />
                    Edit Product
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
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
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
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-medium"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;