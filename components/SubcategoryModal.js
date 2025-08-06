import React, { useState, useEffect } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

const initialState = {
  name: '',
  slug: '',
  description: '',
  parent_id: '',
  image: null,
  icon: '',
  color: '#6B7280',
  sort_order: 0,
  is_active: true,
  is_featured: false,
  meta_title: '',
  meta_description: '',
  meta_keywords: []
};

const inputClass = "bg-white border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-lg px-4 py-2.5 outline-none w-full transition-all duration-200";

const SubcategoryModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  subcategory = null, 
  mode = 'add', 
  isLoading = false,
  parentCategories = [] // Parent categories for selection 
}) => {
  const [form, setForm] = useState(initialState);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Reset form function
  const resetForm = () => {
    setForm(initialState);
    setImageFile(null);
    setImagePreview(null);
  };

  // Load subcategory data when in edit mode
  useEffect(() => {
    if (mode === 'edit' && subcategory) {
      setForm({
        name: subcategory.name || '',
        slug: subcategory.slug || '',
        description: subcategory.description || '',
        parent_id: subcategory.parent_id || '',
        image: subcategory.image || null,
        icon: subcategory.icon || '',
        color: subcategory.color || '#6B7280',
        sort_order: subcategory.sort_order || 0,
        is_active: subcategory.is_active !== undefined ? subcategory.is_active : true,
        is_featured: subcategory.is_featured || false,
        meta_title: subcategory.meta_title || '',
        meta_description: subcategory.meta_description || '',
        meta_keywords: subcategory.meta_keywords || []
      });
      
      // Set existing image preview
      if (subcategory.image) {
        const imageUrl = subcategory.image.startsWith('http') 
          ? subcategory.image 
          : `${API_BASE_URL}${subcategory.image}`;
        setImagePreview(imageUrl);
      }
    } else {
      resetForm();
    }
  }, [mode, subcategory, isOpen]);

  // Auto-generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Handle file input for image
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should be less than 5MB');
        return;
      }
      
      setImageFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'name') {
      setForm((prev) => ({
        ...prev,
        [name]: value,
        slug: generateSlug(value) // Auto-generate slug
      }));
    } else if (name === 'parent_id') {
      // When parent changes, inherit parent's color
      const parentCategory = parentCategories.find(cat => cat._id === value);
      setForm((prev) => ({
        ...prev,
        [name]: value,
        color: parentCategory?.color || '#6B7280'
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleArrayChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value.split(',').map((v) => v.trim()).filter(v => v !== ''),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!form.name.trim()) {
      alert('Subcategory name is required');
      return;
    }
    
    if (!form.slug.trim()) {
      alert('Subcategory slug is required');
      return;
    }

    if (!form.parent_id) {
      alert('Parent category is required for subcategories');
      return;
    }
    
    // Create FormData object
    const formData = new FormData();
    
    // Add all form fields to FormData
    Object.keys(form).forEach(key => {
      if (key === 'image') {
        // Skip image here, we'll handle it separately
        return;
      }
      
      const value = form[key];
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          // Handle arrays
          if (value.length > 0) {
            formData.append(key, JSON.stringify(value));
          }
        } else if (typeof value === 'boolean') {
          // Handle booleans
          formData.append(key, value.toString());
        } else {
          // Handle strings, numbers
          formData.append(key, value.toString());
        }
      }
    });
    
    // Add image file if selected
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    // Call onSubmit with FormData and mode
    onSubmit(formData, mode, subcategory?._id);
  };

  // Remove image function
  const removeImage = () => {
    setImageFile(null);
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setForm(prev => ({ ...prev, image: null }));
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  if (!isOpen) return null;

  const predefinedColors = [
    '#6B7280', '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#84CC16', '#22C55E', '#10B981', '#14B8A6', '#06B6D4',
    '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7',
    '#D946EF', '#EC4899', '#F43F5E'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl mx-auto my-6 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
          <h2 className="text-2xl font-bold text-gray-800">
            {mode === 'edit' ? 'Edit Subcategory' : 'Add New Subcategory'}
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

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Subcategory Name*</label>
                  <input 
                    name="name" 
                    value={form.name} 
                    onChange={handleChange} 
                    required 
                    className={inputClass} 
                    placeholder="Enter subcategory name"
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
                    placeholder="subcategory-url-slug"
                  />
                  <p className="text-sm text-gray-500 mt-1">Auto-generated from subcategory name</p>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-gray-700 font-medium mb-2">Description</label>
                <textarea 
                  name="description" 
                  value={form.description} 
                  onChange={handleChange} 
                  className={inputClass} 
                  rows={3}
                  placeholder="Subcategory description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Parent Category*</label>
                  <select 
                    name="parent_id" 
                    value={form.parent_id} 
                    onChange={handleChange} 
                    required
                    className={inputClass}
                  >
                    <option value="">Select Parent Category</option>
                    {parentCategories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Sort Order</label>
                  <input 
                    name="sort_order" 
                    type="number" 
                    value={form.sort_order} 
                    onChange={handleChange} 
                    className={inputClass} 
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Display & Media */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Display & Media</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Subcategory Image</label>
                  <div className="space-y-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                    
                    {imagePreview && (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Icon Class</label>
                  <input 
                    name="icon" 
                    value={form.icon} 
                    onChange={handleChange} 
                    className={inputClass} 
                    placeholder="fa-solid fa-tag"
                  />
                  <p className="text-sm text-gray-500 mt-1">FontAwesome or similar icon class</p>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-gray-700 font-medium mb-2">Subcategory Color</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {predefinedColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-lg border-2 transition-all ${
                        form.color === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <input 
                  name="color" 
                  type="color"
                  value={form.color} 
                  onChange={handleChange} 
                  className="w-20 h-10 rounded border border-gray-300"
                />
              </div>
            </div>

            {/* Settings & SEO */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings & SEO</h3>
              
              <div className="flex items-center space-x-6 mb-6">
                <div className="flex items-center">
                  <input 
                    id="is_active" 
                    name="is_active" 
                    type="checkbox" 
                    checked={form.is_active} 
                    onChange={handleChange} 
                    className="h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="is_active" className="ml-2 text-gray-700">Active</label>
                </div>
                <div className="flex items-center">
                  <input 
                    id="is_featured" 
                    name="is_featured" 
                    type="checkbox" 
                    checked={form.is_featured} 
                    onChange={handleChange} 
                    className="h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="is_featured" className="ml-2 text-gray-700">Featured</label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Meta Title</label>
                  <input 
                    name="meta_title" 
                    value={form.meta_title} 
                    onChange={handleChange} 
                    className={inputClass} 
                    placeholder="SEO title"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Meta Keywords</label>
                  <input 
                    name="meta_keywords" 
                    value={form.meta_keywords.join(', ')} 
                    onChange={handleArrayChange} 
                    className={inputClass} 
                    placeholder="keyword1, keyword2"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-gray-700 font-medium mb-2">Meta Description</label>
                <textarea 
                  name="meta_description" 
                  value={form.meta_description} 
                  onChange={handleChange} 
                  className={inputClass} 
                  rows={3}
                  placeholder="SEO description"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => { resetForm(); onClose(); }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl transition-all font-medium"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {mode === 'edit' ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {mode === 'edit' ? 'Update Subcategory' : 'Create Subcategory'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubcategoryModal;