'use client';

/**
 * CMS Page - Database-First Content Management System
 * 
 * Features:
 * - getDbCmsData(): Get CMS data from database only (no fallback)
 * - saveCMSConfig(): Save/update CMS data to database only
 * - Database-first approach with clean initialization for new configs
 * - Automatic database save after file uploads
 * - Smart UI: Shows relevant buttons based on data source (DB vs New)
 */

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { API_ENDPOINTS, API_BASE_URL } from '../../config/api';
import WebsitePreview from '../../components/live_preview';
import { getAuthToken } from '../../utils/auth';
import { 
  EyeIcon,
  XMarkIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  PaintBrushIcon,
  Bars3Icon,
  Squares2X2Icon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';

const CmsPage = () => {
  // Tab management
  const [activeTab, setActiveTab] = useState('banner');
  
  // CMS Data State Management
  const [cmsData, setCmsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isUsingDatabaseData, setIsUsingDatabaseData] = useState(false);
  
  // UI State
  const [showPreview, setShowPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('mobile');
  
  // Upload states
  const [uploadLoading, setUploadLoading] = useState(false);

  // Tab configuration
  const tabs = [
    { id: 'banner', label: 'Banner', icon: PhotoIcon },
    { id: 'logo', label: 'Logo & Branding', icon: PaintBrushIcon },
    { id: 'text', label: 'Text Content', icon: DocumentTextIcon },
    { id: 'menus', label: 'Menus', icon: Bars3Icon },
    { id: 'footer', label: 'Footer', icon: Squares2X2Icon },
    { id: 'seo', label: 'SEO', icon: GlobeAltIcon }
  ];

  // ==========================================
  // CRUD OPERATIONS FOR CMS CONTENT
  // ==========================================
  
  // ✅ GET DB DATA - Get CMS data from database only
  const getDbCmsData = async () => {
    const endpoints = [
      { name: 'adminConfig', url: API_ENDPOINTS.cms.adminConfig },
      { name: 'config', url: API_ENDPOINTS.cms.config }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const token = getAuthToken();
        console.log(`🔄 Trying ${endpoint.name} endpoint: ${endpoint.url}`);
        console.log(`🔐 Auth token available: ${token ? 'Yes' : 'No'} (length: ${token?.length || 0})`);
        
        const response = await fetch(endpoint.url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`📡 ${endpoint.name} response status:`, response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log(`📦 ${endpoint.name} raw response:`, result);
          
          // Check for different possible response structures
          let cmsData = null;
          
          // Structure 1: { success: true, data: {...} }
          if (result && result.success && result.data) {
            cmsData = result.data;
          }
          // Structure 2: { data: {...} }
          else if (result && result.data) {
            cmsData = result.data;
          }
          // Structure 3: Direct data object
          else if (result && typeof result === 'object' && !result.error && !result.message) {
            cmsData = result;
          }
          
          // Validate the CMS data
          if (cmsData && typeof cmsData === 'object' && cmsData !== null) {
            // Check if it has basic CMS structure
            const hasBasicStructure = cmsData.theme_name || 
                                    cmsData.banner || 
                                    cmsData.logo || 
                                    cmsData.textContent ||
                                    cmsData.seo ||
                                    Object.keys(cmsData).length > 0;
            
            if (hasBasicStructure) {
              console.log(`✅ Database CMS data retrieved from ${endpoint.name}:`, cmsData);
              return cmsData;
            }
          }
          
          console.log(`📝 ${endpoint.name} has no valid CMS data, trying next endpoint...`);
        } else {
          const errorText = await response.text();
          console.log(`❌ ${endpoint.name} failed. Status:`, response.status, 'Error:', errorText);
        }
      } catch (error) {
        console.error(`❌ Error with ${endpoint.name}:`, error);
      }
    }
    
    console.log('📝 No valid CMS data found in any endpoint');
    return null;
  };
  
  // ✅ LOAD - Load CMS configuration from database or initialize new
  const loadCMSConfig = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading CMS configuration from database...');
      
      // Try to get database data first
      const dbData = await getDbCmsData();
      
      if (dbData) {
        console.log('✅ Using database CMS configuration:', {
          theme_name: dbData.theme_name,
          has_banner: !!dbData.banner,
          has_logo: !!dbData.logo,
          has_textContent: !!dbData.textContent,
          has_menus: !!dbData.menus,
          has_footer: !!dbData.footer,
          has_seo: !!dbData.seo,
          banner_images_count: dbData.banner?.images?.length || 0,
          logo_url: !!dbData.logo?.logoUrl,
          keys: Object.keys(dbData)
        });
        
        // Ensure database data has complete structure by merging with template
        const template = initializeNewCMSData();
        const mergedData = {
          ...template,
          ...dbData,
          banner: { ...template.banner, ...dbData.banner },
          logo: { 
            ...template.logo, 
            ...dbData.logo,
            brandColors: { ...template.logo.brandColors, ...dbData.logo?.brandColors }
          },
          textContent: { ...template.textContent, ...dbData.textContent },
          menus: { ...template.menus, ...dbData.menus },
          footer: { 
            ...template.footer, 
            ...dbData.footer,
            contactInfo: { ...template.footer.contactInfo, ...dbData.footer?.contactInfo },
            newsletter: { ...template.footer.newsletter, ...dbData.footer?.newsletter }
          },
          seo: { ...template.seo, ...dbData.seo }
        };
        
        setCmsData(mergedData);
        setHasChanges(false);
        setIsUsingDatabaseData(true);
        toast.success('CMS configuration loaded from database!');
      } else {
        console.log('📝 No database data found, initializing new configuration');
        const newConfig = initializeNewCMSData();
        console.log('🆕 New config structure:', {
          theme_name: newConfig.theme_name,
          sections: Object.keys(newConfig)
        });
        
        setCmsData(newConfig);
        setHasChanges(false);
        setIsUsingDatabaseData(false);
        toast.info('No existing configuration found. Create and save your CMS configuration.');
      }
    } catch (error) {
      console.error('❌ Error loading CMS config:', error);
      console.log('📝 Initializing new configuration due to error');
      
      const newConfig = initializeNewCMSData();
      setCmsData(newConfig);
      setHasChanges(false);
      setIsUsingDatabaseData(false);
      toast.error('Error loading configuration. Starting with new configuration.');
    } finally {
      setLoading(false);
    }
  };


  
  // ✅ SAVE TO DATABASE - Save CMS configuration to database only
  const saveCMSConfig = async (configData = cmsData) => {
    if (!configData) {
      toast.error('No data to save');
      return null;
    }

    try {
      setSaving(true);
      console.log('💾 Saving CMS configuration to database...');
      
      // Clean the data before sending - remove MongoDB fields
      const cleanData = { ...configData };
      delete cleanData._id;
      delete cleanData._isNew;
      delete cleanData.created_at;
      delete cleanData.updated_at;
      delete cleanData.__v;
      
      const response = await fetch(API_ENDPOINTS.cms.adminConfig, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(cleanData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ CMS data saved to database successfully!');
        setCmsData(result.data);
        setHasChanges(false);
        setIsUsingDatabaseData(true);
        toast.success('CMS configuration saved to database!');
        return result.data;
      } else {
        const error = await response.json();
        console.error('❌ Failed to save to database:', error);
        toast.error(error.message || 'Failed to save to database');
        return null;
      }
    } catch (error) {
      console.error('❌ Database save error:', error);
      toast.error('Error saving to database');
      return null;
    } finally {
      setSaving(false);
    }
  };
  
  // ✅ UTILITY - Reset to default
  const resetToDefault = async () => {
    if (!confirm('Are you sure you want to reset to default configuration? This will deactivate all existing configurations.')) {
      return false;
    }
    
    try {
      const response = await fetch(API_ENDPOINTS.cms.reset, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success('Configuration reset to default successfully');
        setCmsData(result.data);
        setHasChanges(false);
        // Check if reset returned database data or if we should use static config
        setIsUsingDatabaseData(result.data && Object.keys(result.data).length > 0);
        return result.data;
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to reset configuration');
        return null;
      }
    } catch (error) {
      console.error('Error resetting config:', error);
      toast.error('Error resetting configuration');
      return null;
    }
  };
  
  // Load data on component mount
  useEffect(() => {
    loadCMSConfig();
  }, []);

  // Debug function - accessible from browser console
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.debugCMS = {
        getCmsData: () => cmsData,
        reloadConfig: () => loadCMSConfig(),
        getDbData: () => getDbCmsData(),
        isUsingDb: isUsingDatabaseData,
        hasChanges: hasChanges,
        loading: loading,
        authToken: () => getAuthToken(),
        testEndpoints: async () => {
          console.log('🧪 Testing all CMS endpoints...');
          const results = {};
          
          const endpoints = [
            { name: 'adminConfig', url: API_ENDPOINTS.cms.adminConfig },
            { name: 'config', url: API_ENDPOINTS.cms.config }
          ];
          
          for (const endpoint of endpoints) {
            try {
              const response = await fetch(endpoint.url, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${getAuthToken()}`,
                  'Content-Type': 'application/json'
                }
              });
              
              results[endpoint.name] = {
                status: response.status,
                ok: response.ok,
                data: response.ok ? await response.json() : await response.text()
              };
            } catch (error) {
              results[endpoint.name] = {
                error: error.message
              };
            }
          }
          
          console.log('🧪 Endpoint test results:', results);
          return results;
        }
      };
    }
  }, [cmsData, isUsingDatabaseData, hasChanges, loading]);
  
  // Track changes
  const handleDataChange = (newData) => {
    console.log('📝 Data changed:', newData);
    setCmsData(newData);
    setHasChanges(true);
  };

  // ✅ INITIALIZE - Create new CMS data structure for database
  const initializeNewCMSData = () => {
    console.log('🆕 Initializing new CMS data structure');
    return {
      theme_name: 'theme2',
      banner: {
        images: [],
        headline: '',
        subheadline: '',
        ctaText: '',
        ctaLink: ''
      },
      logo: {
        logoUrl: '',
        logoAlt: '',
        faviconUrl: '',
        brandColors: {
          primary: '#7c3aed',
          secondary: '#6366f1',
          accent: '#f59e0b'
        }
      },
      textContent: {
        companyName: '',
        tagline: '',
        aboutUs: '',
        mission: '',
        vision: '',
        values: []
      },
      menus: {
        headerMenu: [],
        footerMenu: []
      },
      footer: {
        copyright: '',
        contactInfo: {
          address: '',
          phone: '',
          email: '',
          workingHours: ''
        },
        socialLinks: {},
        newsletter: {
          enabled: true,
          title: '',
          description: ''
        }
      },
      seo: {
        title: '',
        description: '',
        keywords: '',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
        ogType: 'website',
        twitterCard: 'summary_large_image',
        twitterSite: '',
        twitterCreator: '',
        canonicalUrl: '',
        robots: 'index, follow'
      },
      isActive: true
    };
  };

  // Website content management functions with local upload support
  const handleFileUpload = async (file, type, section) => {
    if (!file) return null;
    
    console.log(`📤 Starting upload for ${section}:`, file.name);
    
    // Create immediate preview using blob URL
    const previewUrl = URL.createObjectURL(file);
    
    // Update preview immediately for instant feedback
    if (section === 'banner') {
      const newImage = {
        id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
        url: previewUrl,
        alt: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
        title: file.name.replace(/\.[^/.]+$/, ""),
        order: (cmsData?.banner?.images || []).length,
        isUploading: true
      };
      
      const updatedData = {
        ...cmsData,
        banner: {
          ...cmsData?.banner,
          images: [...(cmsData?.banner?.images || []), newImage]
        }
      };
      handleDataChange(updatedData);
    } else if (section === 'logo') {
      updateCMSContent('logo', 'logoUrl', previewUrl);
    } else if (section === 'favicon') {
      updateCMSContent('logo', 'faviconUrl', previewUrl);
    } else if (section === 'seo') {
      updateCMSContent('seo', 'ogImage', previewUrl);
    }
    
    setUploadLoading(true);
    try {
      const formData = new FormData();
      
      // Determine which endpoint and field name to use based on section
      let uploadEndpoint;
      let fieldName;
      
      if (section === 'banner') {
        uploadEndpoint = API_ENDPOINTS.cms.uploadBanner;
        fieldName = 'banner'; // Use 'banner' field name for banner uploads
        console.log('📤 Uploading banner to local storage...');
      } else if (section === 'logo' || section === 'favicon') {
        uploadEndpoint = API_ENDPOINTS.cms.uploadLogo;
        fieldName = 'logo'; // Use 'logo' field name for logo uploads
        console.log('📤 Uploading logo to local storage...');
      } else {
        // For other sections, use logo endpoint as fallback since all uploads are local now
        uploadEndpoint = API_ENDPOINTS.cms.uploadLogo;
        fieldName = 'logo';
        console.log('📤 Uploading to local storage...');
      }
      
      // Append file with correct field name
      formData.append(fieldName, file);
      
      // Upload to appropriate endpoint
      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📤 Upload response:', result);
      
      if (!result.success) {
        throw new Error(result.message || 'Upload failed');
      }
      
      const uploadedUrl = result.data.url;
      console.log('🖼️ Uploaded URL:', uploadedUrl);
      
      // Update with final uploaded URL and save to database
      let updatedData;
      if (section === 'banner') {
        // Use the complete server response data for banner
        const newBannerImage = {
          id: result.data.id,
          url: result.data.url,
          alt: result.data.alt,
          title: result.data.title,
          order: (cmsData?.banner?.images || []).length,
          filename: result.data.filename,
          originalName: result.data.originalName
        };
        
        // Remove any uploading image and add the new one
        const existingImages = (cmsData?.banner?.images || []).filter(img => !img.isUploading);
        
        updatedData = {
          ...cmsData,
          banner: {
            ...cmsData?.banner,
            images: [...existingImages, newBannerImage]
          }
        };
        handleDataChange(updatedData);
      } else if (section === 'logo') {
        updatedData = {
          ...cmsData,
          logo: {
            ...cmsData?.logo,
            logoUrl: uploadedUrl
          }
        };
        handleDataChange(updatedData);
      } else if (section === 'favicon') {
        updatedData = {
          ...cmsData,
          logo: {
            ...cmsData?.logo,
            faviconUrl: uploadedUrl
          }
        };
        handleDataChange(updatedData);
      } else if (section === 'seo') {
        updatedData = {
          ...cmsData,
          seo: {
            ...cmsData?.seo,
            ogImage: uploadedUrl
          }
        };
        handleDataChange(updatedData);
      }
      
      // Auto-save the configuration after successful upload
      if (updatedData) {
        console.log('💾 Auto-saving CMS config after upload...');
        const saveResult = await saveCMSConfig(updatedData);
        if (saveResult) {
          console.log('✅ Save result:', saveResult);
        }
      }
      
      toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} uploaded and saved successfully!`);
      return uploadedUrl;
      
    } catch (error) {
      console.error('❌ Upload error:', error);
      toast.error(`Failed to upload ${section}: ${error.message}`);
      
      // Revert preview on error
      if (section === 'banner') {
        const revertedData = {
          ...cmsData,
          banner: {
            ...cmsData?.banner,
            images: (cmsData?.banner?.images || []).filter(img => img.url !== previewUrl)
          }
        };
        handleDataChange(revertedData);
      }
      
      return null;
    } finally {
      setUploadLoading(false);
      // Clean up blob URL
      URL.revokeObjectURL(previewUrl);
    }
  };

  // Update CMS content utility function
  const updateCMSContent = (section, field, value) => {
    if (!cmsData) return;
    
    const updatedData = {
      ...cmsData,
      [section]: {
        ...cmsData?.[section],
        [field]: value
      }
    };
    
    handleDataChange(updatedData);
  };

  // Remove banner image
  const removeBannerImage = async (imageId) => {
    if (!cmsData?.banner?.images) return;
    
    const updatedData = {
      ...cmsData,
      banner: {
        ...cmsData?.banner,
        images: cmsData?.banner?.images?.filter(img => img.id !== imageId) || []
      }
    };
    
    handleDataChange(updatedData);
    
    // Auto-save after removal
    try {
      await saveCMSConfig(updatedData);
      toast.success('Banner image removed and saved successfully!');
    } catch (error) {
      console.error('Error saving after image removal:', error);
      toast.error('Image removed but failed to save changes');
    }
  };

  // Update banner image details
  const updateBannerImage = (imageId, updates) => {
    if (!cmsData?.banner?.images) return;
    
    const updatedData = {
      ...cmsData,
      banner: {
        ...cmsData?.banner,
        images: cmsData?.banner?.images?.map(img => 
          img.id === imageId ? { ...img, ...updates } : img
        ) || []
      }
    };
    
    handleDataChange(updatedData);
  };

  // Handle loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CMS configuration...</p>
        </div>
      </div>
    );
  }

  // Initialize CMS data if null
  if (!cmsData) {
    console.log('⚠️ CMS data is null, initializing...');
    const initialData = initializeNewCMSData();
    setCmsData(initialData);
    setIsUsingDatabaseData(false);
    return null; // Prevent rendering until data is set
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <GlobeAltIcon className="h-8 w-8 text-purple-600" />
              Website CMS
            </h1>
            <div className="mt-1">
              <p className="text-gray-600">
                Manage your website content and appearance
              </p>
              {cmsData && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">
                    Theme: <span className="font-medium">{cmsData?.theme_name || 'theme1'}</span>
                  </span>
                  
                  {/* Configuration Source Indicator */}
                  {isUsingDatabaseData ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                      💾 Database Config
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full font-medium">
                      📝 Static Config
                    </span>
                  )}
                  
                  {/* Changes Indicator */}
                  {hasChanges && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full font-medium">
                      ⚠️ Unsaved Changes
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            
            {/* Save Button */}
            <button
              onClick={() => saveCMSConfig()}
              disabled={saving || !hasChanges || !cmsData || loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="h-4 w-4" />
                  Save Changes
                  {hasChanges && <span className="bg-green-700 px-1.5 py-0.5 rounded-full text-xs ml-1">•</span>}
                </>
              )}
            </button>
            
            {/* Create New Config Button - Only show when no database data */}
            {!isUsingDatabaseData && (
              <button
                onClick={() => {
                  const newConfig = initializeNewCMSData();
                  setCmsData(newConfig);
                  setHasChanges(true);
                  setIsUsingDatabaseData(false);
                  toast.success('New CMS configuration created! Configure and save to database.');
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
                title="Create new CMS configuration"
              >
                <PlusIcon className="h-4 w-4" />
                Create New Config
              </button>
            )}

            {/* Reset Button - Only show when using database data */}
            {isUsingDatabaseData && (
              <button
                onClick={resetToDefault}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium flex items-center gap-2"
              >
                <TrashIcon className="h-4 w-4" />
                Reset Default
              </button>
            )}
            
            {/* Loading indicator */}
            {loading && (
              <div className="px-4 py-2 bg-gray-100 rounded-lg flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                <span className="text-sm text-gray-600">Loading...</span>
              </div>
            )}
          </div>
        </div>
      </div>

    

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar - Tabs */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Sections</h2>
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-purple-100 text-purple-700 border-purple-200'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          <div className="p-8">
            {/* Banner Section */}
            {activeTab === 'banner' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Banner Management</h2>
                  <div className="flex items-center gap-3">
                    <label className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer flex items-center gap-2">
                      <PlusIcon className="h-4 w-4" />
                      Add Banner Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            await handleFileUpload(file, 'image', 'banner');
                            e.target.value = ''; // Reset input
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Banner Images Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(cmsData?.banner?.images || []).map((image, index) => (
                    <div key={image.id || index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      <div className="relative">
                        <img
                          src={image.url}
                          alt={image.alt || 'Banner image'}
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="hidden absolute inset-0 bg-gray-200 items-center justify-center">
                          <PhotoIcon className="h-12 w-12 text-gray-400" />
                        </div>
                        {image.isUploading && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <div className="text-white text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                              <p className="text-sm">Uploading...</p>
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() => removeBannerImage(image.id)}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text</label>
                          <input
                            type="text"
                            value={image.alt || ''}
                            onChange={(e) => updateBannerImage(image.id, { alt: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Image description"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            value={image.title || ''}
                            onChange={(e) => updateBannerImage(image.id, { title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Image title"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Banner Content */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Banner Content</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Headline</label>
                      <input
                        type="text"
                        value={cmsData?.banner?.headline || ''}
                        onChange={(e) => updateCMSContent('banner', 'headline', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Main banner headline"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subheadline</label>
                      <input
                        type="text"
                        value={cmsData?.banner?.subheadline || ''}
                        onChange={(e) => updateCMSContent('banner', 'subheadline', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Banner subheadline"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CTA Text</label>
                      <input
                        type="text"
                        value={cmsData?.banner?.ctaText || ''}
                        onChange={(e) => updateCMSContent('banner', 'ctaText', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Call to action text"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CTA Link</label>
                      <input
                        type="text"
                        value={cmsData?.banner?.ctaLink || ''}
                        onChange={(e) => updateCMSContent('banner', 'ctaLink', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="/products or https://example.com"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Logo & Branding Section */}
            {activeTab === 'logo' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Logo & Branding</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Logo Upload */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Company Logo</h3>
                    
                    {cmsData?.logo?.logoUrl ? (
                      <div className="space-y-4">
                        <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                          <img 
                            src={cmsData?.logo?.logoUrl} 
                            alt="Logo" 
                            className="max-h-20 object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                        <button
                          onClick={() => updateCMSContent('logo', 'logoUrl', '')}
                          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Remove Logo
                        </button>
                      </div>
                    ) : (
                      <label className="block w-full p-8 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-purple-500 cursor-pointer transition-colors">
                        <PlusIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <span className="text-gray-600">Upload Company Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const url = await handleFileUpload(file, 'image', 'logo');
                              if (url) updateCMSContent('logo', 'logoUrl', url);
                            }
                          }}
                        />
                      </label>
                    )}

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Logo Alt Text</label>
                      <input
                        type="text"
                        value={cmsData?.logo?.logoAlt || ''}
                        onChange={(e) => updateCMSContent('logo', 'logoAlt', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Company Logo"
                      />
                    </div>
                  </div>

                  {/* Favicon Upload */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Favicon</h3>
                    
                    {cmsData?.logo?.faviconUrl ? (
                      <div className="space-y-4">
                        <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                          <img 
                            src={cmsData?.logo?.faviconUrl} 
                            alt="Favicon" 
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                        <button
                          onClick={() => updateCMSContent('logo', 'faviconUrl', '')}
                          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Remove Favicon
                        </button>
                      </div>
                    ) : (
                      <label className="block w-full p-8 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-purple-500 cursor-pointer transition-colors">
                        <PlusIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <span className="text-gray-600">Upload Favicon (16x16 or 32x32)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const url = await handleFileUpload(file, 'image', 'favicon');
                              if (url) updateCMSContent('logo', 'faviconUrl', url);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Brand Colors */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Brand Colors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={cmsData?.logo?.brandColors?.primary || '#7c3aed'}
                          onChange={(e) => updateCMSContent('logo', 'brandColors', {
                            ...cmsData?.logo?.brandColors,
                            primary: e.target.value
                          })}
                          className="w-12 h-10 border border-gray-300 rounded"
                        />
                        <input
                          type="text"
                          value={cmsData?.logo?.brandColors?.primary || '#7c3aed'}
                          onChange={(e) => updateCMSContent('logo', 'brandColors', {
                            ...cmsData?.logo?.brandColors,
                            primary: e.target.value
                          })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={cmsData?.logo?.brandColors?.secondary || '#6366f1'}
                          onChange={(e) => updateCMSContent('logo', 'brandColors', {
                            ...cmsData?.logo?.brandColors,
                            secondary: e.target.value
                          })}
                          className="w-12 h-10 border border-gray-300 rounded"
                        />
                        <input
                          type="text"
                          value={cmsData?.logo?.brandColors?.secondary || '#6366f1'}
                          onChange={(e) => updateCMSContent('logo', 'brandColors', {
                            ...cmsData?.logo?.brandColors,
                            secondary: e.target.value
                          })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={cmsData?.logo?.brandColors?.accent || '#f59e0b'}
                          onChange={(e) => updateCMSContent('logo', 'brandColors', {
                            ...cmsData?.logo?.brandColors,
                            accent: e.target.value
                          })}
                          className="w-12 h-10 border border-gray-300 rounded"
                        />
                        <input
                          type="text"
                          value={cmsData?.logo?.brandColors?.accent || '#f59e0b'}
                          onChange={(e) => updateCMSContent('logo', 'brandColors', {
                            ...cmsData?.logo?.brandColors,
                            accent: e.target.value
                          })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Text Content Section */}
            {activeTab === 'text' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Text Content</h2>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
                  {/* Company Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                    <input
                      type="text"
                      value={cmsData?.textContent?.companyName || ''}
                      onChange={(e) => updateCMSContent('textContent', 'companyName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Your Company Name"
                    />
                  </div>

                  {/* Tagline */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tagline</label>
                    <input
                      type="text"
                      value={cmsData?.textContent?.tagline || ''}
                      onChange={(e) => updateCMSContent('textContent', 'tagline', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Your company tagline"
                    />
                  </div>

                  {/* About Us */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">About Us</label>
                    <textarea
                      rows={4}
                      value={cmsData?.textContent?.aboutUs || ''}
                      onChange={(e) => updateCMSContent('textContent', 'aboutUs', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Tell visitors about your company..."
                    />
                  </div>

                  {/* Mission */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mission</label>
                    <textarea
                      rows={3}
                      value={cmsData?.textContent?.mission || ''}
                      onChange={(e) => updateCMSContent('textContent', 'mission', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Your company mission..."
                    />
                  </div>

                  {/* Vision */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vision</label>
                    <textarea
                      rows={3}
                      value={cmsData?.textContent?.vision || ''}
                      onChange={(e) => updateCMSContent('textContent', 'vision', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Your company vision..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Menus Section */}
            {activeTab === 'menus' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Navigation Menus</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Header Menu */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Header Menu</h3>
                    <div className="space-y-4">
                      {(cmsData?.menus?.headerMenu || []).map((item, index) => (
                        <div key={item.id || index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <input
                            type="text"
                            value={item.label || ''}
                            onChange={(e) => {
                              const newMenu = [...(cmsData?.menus?.headerMenu || [])];
                              newMenu[index] = { ...newMenu[index], label: e.target.value };
                              updateCMSContent('menus', 'headerMenu', newMenu);
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Menu Label"
                          />
                          <input
                            type="text"
                            value={item.url || ''}
                            onChange={(e) => {
                              const newMenu = [...(cmsData?.menus?.headerMenu || [])];
                              newMenu[index] = { ...newMenu[index], url: e.target.value };
                              updateCMSContent('menus', 'headerMenu', newMenu);
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="URL"
                          />
                          <button
                            onClick={() => {
                              const newMenu = (cmsData?.menus?.headerMenu || []).filter((_, i) => i !== index);
                              updateCMSContent('menus', 'headerMenu', newMenu);
                            }}
                            className="p-2 text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newMenu = [...(cmsData?.menus?.headerMenu || [])];
                          newMenu.push({
                            id: `menu-${Date.now()}`,
                            label: 'New Menu Item',
                            url: '/',
                            order: newMenu.length
                          });
                          updateCMSContent('menus', 'headerMenu', newMenu);
                        }}
                        className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-500 hover:text-purple-600 transition-colors"
                      >
                        <PlusIcon className="h-4 w-4 inline mr-2" />
                        Add Menu Item
                      </button>
                    </div>
                  </div>

                  {/* Footer Menu */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Footer Menu</h3>
                    <div className="space-y-4">
                      {(cmsData?.menus?.footerMenu || []).map((item, index) => (
                        <div key={item.id || index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <input
                            type="text"
                            value={item.label || ''}
                            onChange={(e) => {
                              const newMenu = [...(cmsData?.menus?.footerMenu || [])];
                              newMenu[index] = { ...newMenu[index], label: e.target.value };
                              updateCMSContent('menus', 'footerMenu', newMenu);
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Menu Label"
                          />
                          <input
                            type="text"
                            value={item.url || ''}
                            onChange={(e) => {
                              const newMenu = [...(cmsData?.menus?.footerMenu || [])];
                              newMenu[index] = { ...newMenu[index], url: e.target.value };
                              updateCMSContent('menus', 'footerMenu', newMenu);
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="URL"
                          />
                          <button
                            onClick={() => {
                              const newMenu = (cmsData?.menus?.footerMenu || []).filter((_, i) => i !== index);
                              updateCMSContent('menus', 'footerMenu', newMenu);
                            }}
                            className="p-2 text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newMenu = [...(cmsData?.menus?.footerMenu || [])];
                          newMenu.push({
                            id: `menu-${Date.now()}`,
                            label: 'New Menu Item',
                            url: '/',
                            order: newMenu.length
                          });
                          updateCMSContent('menus', 'footerMenu', newMenu);
                        }}
                        className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-500 hover:text-purple-600 transition-colors"
                      >
                        <PlusIcon className="h-4 w-4 inline mr-2" />
                        Add Menu Item
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Section */}
            {activeTab === 'footer' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Footer Settings</h2>
                </div>

                <div className="space-y-6">
                  {/* Copyright */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Copyright Text</h3>
                    <input
                      type="text"
                      value={cmsData?.footer?.copyright || ''}
                      onChange={(e) => updateCMSContent('footer', 'copyright', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="© 2024 Your Company Name. All rights reserved."
                    />
                  </div>

                  {/* Contact Info */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                        <textarea
                          rows={3}
                          value={cmsData?.footer?.contactInfo?.address || ''}
                          onChange={(e) => updateCMSContent('footer', 'contactInfo', {
                            ...cmsData?.footer?.contactInfo,
                            address: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="123 Street Name, City, State 12345"
                        />
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                          <input
                            type="text"
                            value={cmsData?.footer?.contactInfo?.phone || ''}
                            onChange={(e) => updateCMSContent('footer', 'contactInfo', {
                              ...cmsData?.footer?.contactInfo,
                              phone: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                          <input
                            type="email"
                            value={cmsData?.footer?.contactInfo?.email || ''}
                            onChange={(e) => updateCMSContent('footer', 'contactInfo', {
                              ...cmsData?.footer?.contactInfo,
                              email: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="hello@yourcompany.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours</label>
                          <input
                            type="text"
                            value={cmsData?.footer?.contactInfo?.workingHours || ''}
                            onChange={(e) => updateCMSContent('footer', 'contactInfo', {
                              ...cmsData?.footer?.contactInfo,
                              workingHours: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Monday - Friday: 9:00 AM - 6:00 PM"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Social Media Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(cmsData?.footer?.socialLinks || {}).map(([platform, url]) => (
                        <div key={platform}>
                          <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">{platform}</label>
                          <input
                            type="url"
                            value={url || ''}
                            onChange={(e) => updateCMSContent('footer', 'socialLinks', {
                              ...cmsData?.footer?.socialLinks,
                              [platform]: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder={`https://${platform}.com/yourcompany`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Newsletter */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Newsletter Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={cmsData?.footer?.newsletter?.enabled || false}
                          onChange={(e) => updateCMSContent('footer', 'newsletter', {
                            ...cmsData?.footer?.newsletter,
                            enabled: e.target.checked
                          })}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <label className="text-sm font-medium text-gray-700">Enable Newsletter Signup</label>
                      </div>
                      {cmsData?.footer?.newsletter?.enabled && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Newsletter Title</label>
                            <input
                              type="text"
                              value={cmsData?.footer?.newsletter?.title || ''}
                              onChange={(e) => updateCMSContent('footer', 'newsletter', {
                                ...cmsData?.footer?.newsletter,
                                title: e.target.value
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Stay Updated with Our Latest Offers"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Newsletter Description</label>
                            <textarea
                              rows={2}
                              value={cmsData?.footer?.newsletter?.description || ''}
                              onChange={(e) => updateCMSContent('footer', 'newsletter', {
                                ...cmsData?.footer?.newsletter,
                                description: e.target.value
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Subscribe to get exclusive deals..."
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SEO Section */}
            {activeTab === 'seo' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">SEO Settings</h2>
                </div>

                <div className="space-y-6">
                  {/* Basic SEO */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Basic SEO</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Page Title <span className="text-gray-500">(60 characters max)</span>
                        </label>
                        <input
                          type="text"
                          value={cmsData?.seo?.title || ''}
                          onChange={(e) => updateCMSContent('seo', 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Your Company - Best Products Online"
                          maxLength={60}
                        />
                        <p className="text-sm text-gray-500 mt-1">{(cmsData?.seo?.title || '').length}/60 characters</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Meta Description <span className="text-gray-500">(160 characters max)</span>
                        </label>
                        <textarea
                          rows={3}
                          value={cmsData?.seo?.description || ''}
                          onChange={(e) => updateCMSContent('seo', 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Discover amazing products at great prices..."
                          maxLength={160}
                        />
                        <p className="text-sm text-gray-500 mt-1">{(cmsData?.seo?.description || '').length}/160 characters</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
                        <input
                          type="text"
                          value={cmsData?.seo?.keywords || ''}
                          onChange={(e) => updateCMSContent('seo', 'keywords', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="ecommerce, online shopping, products, deals"
                        />
                        <p className="text-sm text-gray-500 mt-1">Separate keywords with commas</p>
                      </div>
                    </div>
                  </div>

                  {/* Open Graph */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Social Media Preview (Open Graph)</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">OG Title</label>
                        <input
                          type="text"
                          value={cmsData?.seo?.ogTitle || ''}
                          onChange={(e) => updateCMSContent('seo', 'ogTitle', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Title for social media sharing"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">OG Description</label>
                        <textarea
                          rows={2}
                          value={cmsData?.seo?.ogDescription || ''}
                          onChange={(e) => updateCMSContent('seo', 'ogDescription', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Description for social media sharing"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">OG Image</label>
                        {cmsData?.seo?.ogImage ? (
                          <div className="space-y-4">
                            <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                              <img 
                                src={cmsData?.seo?.ogImage} 
                                alt="OG Image" 
                                className="max-h-32 object-contain rounded"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            </div>
                            <button
                              onClick={() => updateCMSContent('seo', 'ogImage', '')}
                              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              Remove Image
                            </button>
                          </div>
                        ) : (
                          <label className="block w-full p-8 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-purple-500 cursor-pointer transition-colors">
                            <PlusIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <span className="text-gray-600">Upload OG Image (1200x630 recommended)</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const url = await handleFileUpload(file, 'image', 'seo');
                                  if (url) updateCMSContent('seo', 'ogImage', url);
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Technical SEO */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Technical SEO</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Canonical URL</label>
                        <input
                          type="url"
                          value={cmsData?.seo?.canonicalUrl || ''}
                          onChange={(e) => updateCMSContent('seo', 'canonicalUrl', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Robots</label>
                        <select
                          value={cmsData?.seo?.robots || 'index, follow'}
                          onChange={(e) => updateCMSContent('seo', 'robots', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="index, follow">Index, Follow</option>
                          <option value="noindex, follow">No Index, Follow</option>
                          <option value="index, nofollow">Index, No Follow</option>
                          <option value="noindex, nofollow">No Index, No Follow</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Google Site Verification</label>
                        <input
                          type="text"
                          value={cmsData?.seo?.googleSiteVerification || ''}
                          onChange={(e) => updateCMSContent('seo', 'googleSiteVerification', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Google verification code"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">Website Preview</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-2 rounded ${previewDevice === 'mobile' ? 'bg-purple-100 text-purple-700' : 'text-gray-600'}`}
                  >
                    <DevicePhoneMobileIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-2 rounded ${previewDevice === 'desktop' ? 'bg-purple-100 text-purple-700' : 'text-gray-600'}`}
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              <WebsitePreview 
                cmsData={cmsData} 
                device={previewDevice}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CmsPage;