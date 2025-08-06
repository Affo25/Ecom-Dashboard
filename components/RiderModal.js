'use client';

import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  UserIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon, 
  TruckIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  PhotoIcon,
  CameraIcon
} from '@heroicons/react/24/outline';

const RiderModal = ({ isOpen, onClose, onSubmit, mode = 'add', rider = null, isLoading = false }) => {
  // State for form data
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    vehicleType: '',
    licenseNumber: '',
    isAvailable: true,
    longitude: '',
    latitude: '',
    image: null,
    cnicFrontImage: null,
    cnicBackImage: null,
    bikeDocument: null
  });

  // State for image previews
  const [previews, setPreviews] = useState({
    image: null,
    cnicFrontImage: null,
    cnicBackImage: null,
    bikeDocument: null
  });
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Vehicle type options
  const vehicleTypes = [
    { value: '', label: 'Select Vehicle Type', icon: '🚚' },
    { value: 'bike', label: 'Motorcycle/Bike', icon: '🏍️' },
    { value: 'car', label: 'Car', icon: '🚗' },
    { value: 'van', label: 'Van', icon: '🚐' }
  ];

  // Reset form when modal opens/closes or rider changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && rider) {
        setFormData({
          fullName: rider.fullName || '',
          phone: rider.phone || '',
          email: rider.email || '',
          address: rider.address || '',
          vehicleType: rider.vehicleType || '',
          licenseNumber: rider.licenseNumber || '',
          isAvailable: rider.isAvailable ?? true,
          longitude: rider.location?.coordinates?.[0] || '',
          latitude: rider.location?.coordinates?.[1] || '',
          image: null,
          cnicFrontImage: null,
          cnicBackImage: null,
          bikeDocument: null
        });
        setPreviews({
          image: rider.image ? `/uploads/profiles/${rider.image}` : null,
          cnicFrontImage: rider.cnicFrontImage ? `/uploads/cnic/${rider.cnicFrontImage}` : null,
          cnicBackImage: rider.cnicBackImage ? `/uploads/cnic/${rider.cnicBackImage}` : null,
          bikeDocument: rider.bikeDocument ? rider.bikeDocument : null
        });
      } else {
        setFormData({
          fullName: '',
          phone: '',
          email: '',
          address: '',
          vehicleType: '',
          licenseNumber: '',
          isAvailable: true,
          longitude: '',
          latitude: '',
          image: null,
          cnicFrontImage: null,
          cnicBackImage: null,
          bikeDocument: null
        });
        setPreviews({
          image: null,
          cnicFrontImage: null,
          cnicBackImage: null,
          bikeDocument: null
        });
      }
      setErrors({});
      setIsDirty(false);
      setActiveTab('basic'); // Reset to first tab
    }
  }, [isOpen, mode, rider]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    setIsDirty(true);
  };

  // Handle file changes
  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (fieldName === 'bikeDocument') {
      if (file.type !== 'application/pdf') {
        setErrors(prev => ({ ...prev, [fieldName]: 'Only PDF files are allowed for vehicle documents' }));
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB
        setErrors(prev => ({ ...prev, [fieldName]: 'File size must be less than 10MB' }));
        return;
      }
    } else {
      // Image validation
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, [fieldName]: 'Only image files are allowed' }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setErrors(prev => ({ ...prev, [fieldName]: 'Image size must be less than 5MB' }));
        return;
      }
    }

    // Clear any existing error
    setErrors(prev => ({ ...prev, [fieldName]: '' }));
    
    // Update form data
    setFormData(prev => ({ ...prev, [fieldName]: file }));
    
    // Create preview
    if (fieldName === 'bikeDocument') {
      setPreviews(prev => ({ ...prev, [fieldName]: file.name }));
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => ({ ...prev, [fieldName]: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
    
    setIsDirty(true);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.vehicleType) {
      newErrors.vehicleType = 'Vehicle type is required';
    }

    // Validate coordinates if provided
    if (formData.longitude && (isNaN(formData.longitude) || formData.longitude < -180 || formData.longitude > 180)) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }

    if (formData.latitude && (isNaN(formData.latitude) || formData.latitude < -90 || formData.latitude > 90)) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Tab configuration
  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: '👤' },
    { id: 'location', name: 'Location', icon: '📍' },
    { id: 'documents', name: 'Documents', icon: '📄' },
    { id: 'profile', name: 'Profile Photo', icon: '📸' }
  ];

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = new FormData();
    
    // Add text fields
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== '' && !['image', 'cnicFrontImage', 'cnicBackImage', 'bikeDocument'].includes(key)) {
        if (key === 'isAvailable') {
          submitData.append(key, formData[key].toString());
        } else {
          submitData.append(key, formData[key]);
        }
      }
    });

    // Add file fields
    ['image', 'cnicFrontImage', 'cnicBackImage', 'bikeDocument'].forEach(key => {
      if (formData[key] instanceof File) {
        submitData.append(key, formData[key]);
      }
    });

    await onSubmit(submitData, mode, rider?._id);
  };

  // Handle close
  const handleClose = () => {
    if (isDirty) {
      const confirmClose = window.confirm("You have unsaved changes. Are you sure you want to close?");
      if (!confirmClose) return;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />
        
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <UserIcon className="h-6 w-6" />
                {mode === 'edit' ? 'Edit Rider' : 'Add New Rider'}
              </h2>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors disabled:opacity-50"
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 bg-gray-50">
              <nav className="flex space-x-8 px-6 py-3">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Basic Information Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <UserIcon className="h-4 w-4 inline mr-1" />
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Enter rider's full name"
                        disabled={isLoading}
                      />
                      {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <PhoneIcon className="h-4 w-4 inline mr-1" />
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="+92 300 1234567"
                        disabled={isLoading}
                      />
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="rider@example.com"
                        disabled={isLoading}
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <TruckIcon className="h-4 w-4 inline mr-1" />
                        Vehicle Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.vehicleType ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        disabled={isLoading}
                      >
                        {vehicleTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.icon} {type.label}
                          </option>
                        ))}
                      </select>
                      {errors.vehicleType && <p className="text-red-500 text-xs mt-1">{errors.vehicleType}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                        License Number
                      </label>
                      <input
                        type="text"
                        name="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.licenseNumber ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="DL-12345678"
                        disabled={isLoading}
                      />
                      {errors.licenseNumber && <p className="text-red-500 text-xs mt-1">{errors.licenseNumber}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPinIcon className="h-4 w-4 inline mr-1" />
                      Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="address"
                      rows={4}
                      value={formData.address}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.address ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter complete address with area, city, and postal code"
                      disabled={isLoading}
                    />
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                  </div>

                  {/* Availability */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isAvailable"
                        checked={formData.isAvailable}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        disabled={isLoading}
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        {formData.isAvailable ? (
                          <>
                            <CheckCircleIcon className="h-4 w-4 inline mr-1 text-green-600" />
                            Available for delivery
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="h-4 w-4 inline mr-1 text-red-600" />
                            Not available
                          </>
                        )}
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Location Tab */}
              {activeTab === 'location' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <MapPinIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Location Coordinates</h3>
                    <p className="text-sm text-gray-500 mb-6">Add GPS coordinates for precise location tracking (Optional)</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Longitude
                      </label>
                      <input
                        type="number"
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleInputChange}
                        step="any"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.longitude ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="e.g., 67.0011"
                        disabled={isLoading}
                      />
                      {errors.longitude && <p className="text-red-500 text-xs mt-1">{errors.longitude}</p>}
                      <p className="text-xs text-gray-500 mt-1">Range: -180 to 180</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Latitude
                      </label>
                      <input
                        type="number"
                        name="latitude"
                        value={formData.latitude}
                        onChange={handleInputChange}
                        step="any"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.latitude ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="e.g., 24.8607"
                        disabled={isLoading}
                      />
                      {errors.latitude && <p className="text-red-500 text-xs mt-1">{errors.latitude}</p>}
                      <p className="text-xs text-gray-500 mt-1">Range: -90 to 90</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">How to get coordinates</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>You can find GPS coordinates using:</p>
                          <ul className="list-disc pl-5 mt-1">
                            <li>Google Maps (right-click and select coordinates)</li>
                            <li>Mobile GPS apps</li>
                            <li>Phone's current location</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents Tab */}
              {activeTab === 'documents' && (
                <div className="space-y-8">
                  <div className="text-center mb-6">
                    <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Identity & Vehicle Documents</h3>
                    <p className="text-sm text-gray-500">Upload CNIC and vehicle registration documents (Optional)</p>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-md font-semibold text-gray-900">CNIC Images</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* CNIC Front Image */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CNIC Front Image
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                          {previews.cnicFrontImage ? (
                            <div className="space-y-2">
                              <img src={previews.cnicFrontImage} alt="CNIC Front" className="h-40 mx-auto rounded" />
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviews(prev => ({ ...prev, cnicFrontImage: null }));
                                  setFormData(prev => ({ ...prev, cnicFrontImage: null }));
                                  setIsDirty(true);
                                }}
                                className="text-sm text-red-600 hover:text-red-800"
                                disabled={isLoading}
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <>
                              <CameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <div className="text-sm text-gray-600">
                                <label htmlFor="cnic-front-upload" className="cursor-pointer font-medium text-blue-600 hover:text-blue-500">
                                  Upload CNIC Front
                                </label>
                                <input
                                  id="cnic-front-upload"
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleFileChange(e, 'cnicFrontImage')}
                                  disabled={isLoading}
                                />
                              </div>
                              <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 5MB</p>
                            </>
                          )}
                        </div>
                        {errors.cnicFrontImage && <p className="text-red-500 text-xs mt-1">{errors.cnicFrontImage}</p>}
                      </div>

                      {/* CNIC Back Image */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CNIC Back Image
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                          {previews.cnicBackImage ? (
                            <div className="space-y-2">
                              <img src={previews.cnicBackImage} alt="CNIC Back" className="h-40 mx-auto rounded" />
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviews(prev => ({ ...prev, cnicBackImage: null }));
                                  setFormData(prev => ({ ...prev, cnicBackImage: null }));
                                  setIsDirty(true);
                                }}
                                className="text-sm text-red-600 hover:text-red-800"
                                disabled={isLoading}
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <>
                              <CameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <div className="text-sm text-gray-600">
                                <label htmlFor="cnic-back-upload" className="cursor-pointer font-medium text-blue-600 hover:text-blue-500">
                                  Upload CNIC Back
                                </label>
                                <input
                                  id="cnic-back-upload"
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleFileChange(e, 'cnicBackImage')}
                                  disabled={isLoading}
                                />
                              </div>
                              <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 5MB</p>
                            </>
                          )}
                        </div>
                        {errors.cnicBackImage && <p className="text-red-500 text-xs mt-1">{errors.cnicBackImage}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Document */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-900">Vehicle Document</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bike/Vehicle Registration Document (PDF)
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                        {previews.bikeDocument ? (
                          <div className="space-y-3">
                            <DocumentTextIcon className="h-16 w-16 text-blue-600 mx-auto" />
                            <div className="text-sm font-medium text-gray-900">{previews.bikeDocument}</div>
                            <button
                              type="button"
                              onClick={() => {
                                setPreviews(prev => ({ ...prev, bikeDocument: null }));
                                setFormData(prev => ({ ...prev, bikeDocument: null }));
                                setIsDirty(true);
                              }}
                              className="text-sm text-red-600 hover:text-red-800"
                              disabled={isLoading}
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <>
                            <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <div className="text-sm text-gray-600">
                              <label htmlFor="bike-document-upload" className="cursor-pointer font-medium text-blue-600 hover:text-blue-500">
                                Upload Vehicle Document
                              </label>
                              <input
                                id="bike-document-upload"
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={(e) => handleFileChange(e, 'bikeDocument')}
                                disabled={isLoading}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">PDF up to 10MB</p>
                          </>
                        )}
                      </div>
                      {errors.bikeDocument && <p className="text-red-500 text-xs mt-1">{errors.bikeDocument}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Photo Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Photo</h3>
                    <p className="text-sm text-gray-500 mb-6">Upload a clear photo of the rider (Optional)</p>
                  </div>

                  <div className="max-w-md mx-auto">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="flex-shrink-0">
                        {previews.image ? (
                          <img
                            src={previews.image}
                            alt="Rider preview"
                            className="h-32 w-32 rounded-full object-cover border-4 border-gray-200"
                          />
                        ) : (
                          <div className="h-32 w-32 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-200">
                            <UserIcon className="h-16 w-16 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="cursor-pointer bg-blue-600 text-white rounded-lg px-6 py-3 text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors block text-center">
                          <PhotoIcon className="h-5 w-5 inline mr-2" />
                          {previews.image ? 'Change Photo' : 'Choose Photo'}
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'image')}
                            disabled={isLoading}
                          />
                        </label>

                        {previews.image && (
                          <button
                            type="button"
                            onClick={() => {
                              setPreviews(prev => ({ ...prev, image: null }));
                              setFormData(prev => ({ ...prev, image: null }));
                              setIsDirty(true);
                            }}
                            className="w-full text-red-600 hover:text-red-800 text-sm py-2 px-4 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                            disabled={isLoading}
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>

                      {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image}</p>}
                      <p className="text-xs text-gray-500">JPG, PNG, GIF up to 5MB</p>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">Photo Tips</h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <ul className="list-disc pl-5">
                                <li>Use a clear, well-lit photo</li>
                                <li>Face should be clearly visible</li>
                                <li>Avoid sunglasses or hats</li>
                                <li>Professional appearance preferred</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              {/* Tab Navigation Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                    if (currentIndex > 0) {
                      setActiveTab(tabs[currentIndex - 1].id);
                    }
                  }}
                  disabled={isLoading || tabs.findIndex(tab => tab.id === activeTab) === 0}
                  className="px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                    if (currentIndex < tabs.length - 1) {
                      setActiveTab(tabs[currentIndex + 1].id);
                    }
                  }}
                  disabled={isLoading || tabs.findIndex(tab => tab.id === activeTab) === tabs.length - 1}
                  className="px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{mode === 'edit' ? 'Updating...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <span>{mode === 'edit' ? 'Update Rider' : 'Create Rider'}</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RiderModal;