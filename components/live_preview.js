// components/WebsitePreview.js
import React from 'react';

const WebsitePreview = ({ url, deviceType = 'mobile', className = '' }) => {
  // Add error handling for undefined or invalid URL
  if (!url || typeof url !== 'string' || url.length === 0) {
    return (
      <div style={{ 
        width: '100%', 
        height: '70vh', 
        border: '1px solid #ccc', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        color: '#666'
      }}>
        <p>No URL provided for preview</p>
      </div>
    );
  }

  // Get responsive dimensions based on device type
  const getDeviceDimensions = () => {
    switch (deviceType) {
      case 'desktop':
        return {
          width: '100%',
          height: '100%',
          scale: 1,
          containerWidth: '100%',
          containerHeight: '100%',
          maxWidth: 'none'
        };
      case 'tablet':
        return {
          width: '768px',
          height: '1024px',
          scale: 0.65,
          containerWidth: '100%',
          containerHeight: '100%',
          maxWidth: '768px'
        };
      case 'mobile':
      default:
        return {
          width: '375px',
          height: '667px',
          scale: 1,
          containerWidth: '100%',
          containerHeight: '100%',
          maxWidth: '375px'
        };
    }
  };

  const dimensions = getDeviceDimensions();

  return (
    <div 
      className={`overflow-hidden transition-all duration-500 ease-in-out ${className}`}
      style={{ 
        width: dimensions.containerWidth, 
        height: dimensions.containerHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: deviceType === 'desktop' ? 'transparent' : '#f5f5f5'
      }}
    >
      {deviceType === 'desktop' ? (
        // Desktop: Full-screen iframe with no frame
        <iframe
          src={url}
          style={{ 
            width: '100%', 
            height: '100%', 
            border: 'none'
          }}
          title="Website Live Preview - Desktop"
        />
      ) : (
        // Mobile/Tablet: Framed view with device styling
        <div
          style={{
            width: dimensions.width,
            height: dimensions.height,
            transform: `scale(${dimensions.scale})`,
            transformOrigin: 'center',
            border: '1px solid #ddd',
            borderRadius: deviceType === 'mobile' ? '20px' : '12px',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            backgroundColor: 'white',
            maxWidth: dimensions.maxWidth,
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <iframe
            src={url}
            style={{ 
              width: '100%', 
              height: '100%', 
              border: 'none',
              borderRadius: deviceType === 'mobile' ? '20px' : '12px'
            }}
            title={`Website Live Preview - ${deviceType}`}
          />
        </div>
      )}
    </div>
  );
};

export default WebsitePreview;