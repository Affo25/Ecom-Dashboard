import React, { useState } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

const initialState = {
  name: '',
  slug: '',
  description: '',
  short_description: '',
  sku: '',
  brand_id: '',
  categories: [],
  tags: [],
  price: '',
  sale_price: '',
  currency: 'USD',
  quantity_in_stock: '',
  stock_status: 'in_stock',
  weight: '',
  dimensions: { length: '', width: '', height: '' },
  shipping_class: '',
  images: [],
  videos: [],
  attributes: [{ attribute_name: '', attribute_value: '' }],
  variants: [],
  meta_title: '',
  meta_description: '',
  meta_keywords: [],
  featured: false,
  is_active: true,
};

const inputClass =
  "bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg px-4 py-2.5 outline-none w-full transition-all duration-200";

const ProductModal = ({ isOpen, onClose, onSubmit, product = null, mode = 'add', isLoading = false }) => {
  const [form, setForm] = useState(initialState);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [activeTab, setActiveTab] = useState('general');
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Reset form function
  const resetForm = () => {
    setForm(initialState);
    setImageFiles([]);
    setImagePreviews([]);
    setActiveTab('general');
  };

  // Fetch categories for dropdown
  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.categories}/all`);
      const data = await res.json();
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Load categories when modal opens
  React.useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Load product data when in edit mode
  React.useEffect(() => {
    if (mode === 'edit' && product) {
      setForm({
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        short_description: product.short_description || '',
        sku: product.sku || '',
        brand_id: product.brand_id || '',
        categories: product.categories || [],
        tags: product.tags || [],
        price: product.price || '',
        sale_price: product.sale_price || '',
        currency: product.currency || 'USD',
        quantity_in_stock: product.quantity_in_stock || '',
        stock_status: product.stock_status || 'in_stock',
        weight: product.weight || '',
        dimensions: product.dimensions || { length: '', width: '', height: '' },
        shipping_class: product.shipping_class || '',
        images: product.images || [],
        videos: product.videos || [],
        attributes: product.attributes || [{ attribute_name: '', attribute_value: '' }],
        variants: product.variants || [],
        meta_title: product.meta_title || '',
        meta_description: product.meta_description || '',
        meta_keywords: product.meta_keywords || [],
        featured: product.featured || false,
        is_active: product.is_active !== undefined ? product.is_active : true,
      });
      
      // Set existing image previews
      if (product.images && product.images.length > 0) {
        const existingPreviews = product.images.map(img => 
          img.startsWith('http') ? img : `${API_BASE_URL}${img}`
        );
        setImagePreviews(existingPreviews);
      }
    } else {
      resetForm();
    }
  }, [mode, product, isOpen]);

  // Auto-generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Handle file input for images
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imageFiles.length > 10) {
      alert('Maximum 10 images allowed');
      return;
    }
    
    setImageFiles(prev => [...prev, ...files]);
    
    // Create preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'name') {
      setForm((prev) => ({
        ...prev,
        [name]: value,
        slug: generateSlug(value) // Auto-generate slug
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleDimensionChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      dimensions: { ...prev.dimensions, [name]: value },
    }));
  };

  const handleArrayChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value.split(',').map((v) => v.trim()).filter(v => v !== ''),
    }));
  };

  const handleCategoryChange = (categoryId) => {
    setForm((prev) => {
      const isSelected = prev.categories.includes(categoryId);
      const newCategories = isSelected
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId];
      
      return { ...prev, categories: newCategories };
    });
  };

  const handleAttributeChange = (idx, field, value) => {
    const updated = [...form.attributes];
    updated[idx][field] = value;
    setForm((prev) => ({ ...prev, attributes: updated }));
  };

  const addAttribute = () => {
    setForm((prev) => ({
      ...prev,
      attributes: [...prev.attributes, { attribute_name: '', attribute_value: '' }],
    }));
  };

  const removeAttribute = (idx) => {
    if (form.attributes.length > 1) {
      const updated = [...form.attributes];
      updated.splice(idx, 1);
      setForm((prev) => ({ ...prev, attributes: updated }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!form.name.trim()) {
      alert('Product name is required');
      return;
    }
    
    if (!form.slug.trim()) {
      alert('Product slug is required');
      return;
    }
    
    if (!form.price || parseFloat(form.price) <= 0) {
      alert('Valid price is required');
      return;
    }
    
    // Create FormData object
    const formData = new FormData();
    
    // Add all form fields to FormData
    Object.keys(form).forEach(key => {
      if (key === 'images') {
        // Skip images here, we'll handle them separately
        return;
      }
      
      const value = form[key];
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          // Handle arrays
          if (value.length > 0) {
            formData.append(key, JSON.stringify(value));
          }
        } else if (typeof value === 'object') {
          // Handle objects like dimensions
          formData.append(key, JSON.stringify(value));
        } else if (typeof value === 'boolean') {
          // Handle booleans
          formData.append(key, value.toString());
        } else {
          // Handle strings, numbers
          formData.append(key, value.toString());
        }
      }
    });
    
    // Add image files
    imageFiles.forEach((file) => {
      formData.append('images', file);
    });
    
    // Call onSubmit with FormData and mode
    onSubmit(formData, mode, product?._id);
  };

  // Remove image function
  const removeImage = (idx) => {
    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];
    
    // Clean up object URLs to prevent memory leaks
    if (newPreviews[idx] && newPreviews[idx].startsWith('blob:')) {
      URL.revokeObjectURL(newPreviews[idx]);
    }
    
    newFiles.splice(idx, 1);
    newPreviews.splice(idx, 1);
    
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  // Clean up object URLs on unmount
  React.useEffect(() => {
    return () => {
      imagePreviews.forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [imagePreviews]);

  if (!isOpen) return null;

  // Define tabs for navigation
  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'pricing', label: 'Pricing & Inventory' },
    { id: 'media', label: 'Media' },
    { id: 'attributes', label: 'Attributes' },
    { id: 'seo', label: 'SEO' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-7xl mx-auto my-6 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <h2 className="text-2xl font-bold text-gray-800">
            {mode === 'edit' ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={() => { resetForm(); onClose(); }}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 border-b border-gray-200 overflow-x-auto">
          <div className="flex space-x-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Product Name*</label>
                    <input 
                      name="name" 
                      value={form.name} 
                      onChange={handleChange} 
                      required 
                      className={inputClass} 
                      placeholder="Enter product name"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Slug*</label>
                    <input 
                      name="slug" 
                      value={form.slug} 
                      onChange={handleChange} 
                      required 
                      className={inputClass} 
                      placeholder="product-url-slug"
                    />
                    <p className="text-sm text-gray-500 mt-1">Auto-generated from product name</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">SKU</label>
                    <input 
                      name="sku" 
                      value={form.sku} 
                      onChange={handleChange} 
                      className={inputClass} 
                      placeholder="Stock Keeping Unit"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Brand ID</label>
                    <input 
                      name="brand_id" 
                      value={form.brand_id} 
                      onChange={handleChange} 
                      className={inputClass} 
                      placeholder="Brand identifier"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Status</label>
                    <div className="flex items-center space-x-6 mt-2">
                      <div className="flex items-center">
                        <input 
                          id="is_active" 
                          name="is_active" 
                          type="checkbox" 
                          checked={form.is_active} 
                          onChange={handleChange} 
                          className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="is_active" className="ml-2 text-gray-700">Active</label>
                      </div>
                      <div className="flex items-center">
                        <input 
                          id="featured" 
                          name="featured" 
                          type="checkbox" 
                          checked={form.featured} 
                          onChange={handleChange} 
                          className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="featured" className="ml-2 text-gray-700">Featured</label>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Short Description</label>
                  <textarea 
                    name="short_description" 
                    value={form.short_description} 
                    onChange={handleChange} 
                    className={inputClass + " min-h-[80px]"} 
                    placeholder="Brief product description (displayed in listings)"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Full Description</label>
                  <textarea 
                    name="description" 
                    value={form.description} 
                    onChange={handleChange} 
                    className={inputClass + " min-h-[150px]"} 
                    placeholder="Detailed product description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Categories</label>
                    {loadingCategories ? (
                      <div className="flex items-center justify-center py-4 border border-gray-300 rounded-lg">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-500">Loading categories...</span>
                      </div>
                    ) : (
                      <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                        {categories.length === 0 ? (
                          <p className="text-gray-500 text-sm">No categories available</p>
                        ) : (
                          <div className="space-y-2">
                            {categories.map(category => (
                              <label key={category._id} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={form.categories.includes(category._id)}
                                  onChange={() => handleCategoryChange(category._id)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                                />
                                <span className="text-sm text-gray-900">{category.name}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Selected: {form.categories.length > 0 
                        ? form.categories.map(id => categories.find(cat => cat._id === id)?.name || 'Unknown').join(', ')
                        : 'None'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Tags (comma separated)</label>
                    <input 
                      name="tags" 
                      value={form.tags.join(', ')} 
                      onChange={handleArrayChange} 
                      className={inputClass} 
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Pricing & Inventory Tab */}
            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Price*</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <input 
                        name="price" 
                        type="number" 
                        value={form.price} 
                        onChange={handleChange} 
                        required 
                        className={inputClass + " pl-8"} 
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Sale Price</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <input 
                        name="sale_price" 
                        type="number" 
                        value={form.sale_price} 
                        onChange={handleChange} 
                        className={inputClass + " pl-8"} 
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Currency</label>
                    <select 
                      name="currency" 
                      value={form.currency} 
                      onChange={handleChange} 
                      className={inputClass}
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                      <option value="AUD">AUD - Australian Dollar</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Quantity In Stock</label>
                    <input 
                      name="quantity_in_stock" 
                      type="number" 
                      value={form.quantity_in_stock} 
                      onChange={handleChange} 
                      className={inputClass} 
                      placeholder="Available quantity"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Stock Status</label>
                    <select 
                      name="stock_status" 
                      value={form.stock_status} 
                      onChange={handleChange} 
                      className={inputClass}
                    >
                      <option value="in_stock">In Stock</option>
                      <option value="out_of_stock">Out of Stock</option>
                      <option value="preorder">Preorder</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Weight (kg)</label>
                    <input 
                      name="weight" 
                      type="number" 
                      value={form.weight} 
                      onChange={handleChange} 
                      className={inputClass} 
                      placeholder="Product weight"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Shipping Class</label>
                    <input 
                      name="shipping_class" 
                      value={form.shipping_class} 
                      onChange={handleChange} 
                      className={inputClass} 
                      placeholder="Shipping classification"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Dimensions (L × W × H) cm</label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <input 
                        name="length" 
                        type="number" 
                        value={form.dimensions.length} 
                        onChange={handleDimensionChange} 
                        placeholder="Length" 
                        className={inputClass} 
                        step="0.1"
                        min="0"
                      />
                    </div>
                    <div>
                      <input 
                        name="width" 
                        type="number" 
                        value={form.dimensions.width} 
                        onChange={handleDimensionChange} 
                        placeholder="Width" 
                        className={inputClass} 
                        step="0.1"
                        min="0"
                      />
                    </div>
                    <div>
                      <input 
                        name="height" 
                        type="number" 
                        value={form.dimensions.height} 
                        onChange={handleDimensionChange} 
                        placeholder="Height" 
                        className={inputClass} 
                        step="0.1"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Media Tab */}
            {activeTab === 'media' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Product Images (Max 10)</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                          <span>Upload images</span>
                          <input 
                            id="file-upload" 
                            name="file-upload" 
                            type="file" 
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            className="sr-only" 
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB each</p>
                      <p className="text-xs text-blue-600 font-medium">Images will be uploaded to Cloudinary</p>
                    </div>
                  </div>
                </div>

                {imagePreviews.length > 0 && (
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Image Preview ({imagePreviews.length}/10)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-2">
                      {imagePreviews.map((src, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="aspect-w-1 aspect-h-1 w-full h-24">
                            <img
                              src={src}
                              alt={`Preview ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error(`Failed to load image: ${src}`);
                                e.target.src = `${API_BASE_URL}/api/placeholder/150/150`;
                              }}
                              onLoad={() => {
                                console.log(`Successfully loaded image: ${src}`);
                              }}
                            />
                          </div>
                          <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                              title="Remove image"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                          {src.includes('cloudinary.com') && (
                            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                              CDN
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Videos (comma separated URLs)</label>
                  <input 
                    name="videos" 
                    value={form.videos.join(', ')} 
                    onChange={handleArrayChange} 
                    className={inputClass} 
                    placeholder="https://youtube.com/watch?v=example, https://vimeo.com/example"
                  />
                  <p className="mt-1 text-sm text-gray-500">Enter YouTube or Vimeo URLs separated by commas</p>
                </div>
              </div>
            )}

            {/* Attributes Tab */}
            {activeTab === 'attributes' && (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-gray-700 font-medium">Product Attributes</label>
                    <button 
                      type="button" 
                      onClick={addAttribute} 
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add Attribute
                    </button>
                  </div>
                  
                  {form.attributes.map((attr, idx) => (
                    <div key={idx} className="flex items-center gap-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Attribute Name</label>
                        <input
                          placeholder="e.g., Color, Size, Material"
                          value={attr.attribute_name}
                          onChange={e => handleAttributeChange(idx, 'attribute_name', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Attribute Value</label>
                        <input
                          placeholder="e.g., Red, XL, Cotton"
                          value={attr.attribute_value}
                          onChange={e => handleAttributeChange(idx, 'attribute_value', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div className="flex items-end">
                        <button 
                          type="button" 
                          onClick={() => removeAttribute(idx)}
                          className="p-2 text-gray-400 hover:text-red-500 focus:outline-none disabled:opacity-50"
                          disabled={form.attributes.length <= 1}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SEO Tab */}
            {activeTab === 'seo' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Meta Title</label>
                  <input 
                    name="meta_title" 
                    value={form.meta_title} 
                    onChange={handleChange} 
                    className={inputClass} 
                    placeholder="SEO optimized title (appears in search results)"
                    maxLength="60"
                  />
                  <p className="mt-1 text-sm text-gray-500">Keep it under 60 characters</p>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Meta Description</label>
                  <textarea 
                    name="meta_description" 
                    value={form.meta_description} 
                    onChange={handleChange} 
                    className={inputClass + " min-h-[100px]"} 
                    placeholder="Brief description for search engines"
                    maxLength="160"
                  />
                  <p className="mt-1 text-sm text-gray-500">Keep it under 160 characters</p>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Meta Keywords (comma separated)</label>
                  <input 
                    name="meta_keywords" 
                    value={form.meta_keywords.join(', ')} 
                    onChange={handleArrayChange} 
                    className={inputClass} 
                    placeholder="keyword1, keyword2, keyword3"
                  />
                  <p className="mt-1 text-sm text-gray-500">Enter relevant keywords separated by commas</p>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button 
                type="button" 
                onClick={() => { resetForm(); onClose(); }} 
                className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {mode === 'edit' ? 'Updating...' : 'Saving...'}
                  </span>
                ) : (
                  mode === 'edit' ? 'Update Product' : 'Save Product'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;