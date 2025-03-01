import React, { useState, useEffect } from 'react';

interface ImageOptimizerProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholder?: string;
  quality?: number;
}

const ImageOptimizer: React.FC<ImageOptimizerProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"%3E%3Crect width="300" height="200" fill="%23cccccc"%3E%3C/rect%3E%3C/svg%3E',
  quality = 75
}) => {
  const [imageSrc, setImageSrc] = useState<string>(placeholder);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    // Reset state when src changes
    setIsLoaded(false);
    setError(false);
    setImageSrc(placeholder);

    // Create a new Image object to preload
    const img = new Image();
    
    // Add query parameters for optimization if the image is from Supabase
    if (src.includes('supabase.co')) {
      // Parse the URL
      const url = new URL(src);
      
      // Add width, height, and quality parameters if they exist
      if (width) url.searchParams.append('width', width.toString());
      if (height) url.searchParams.append('height', height.toString());
      url.searchParams.append('quality', quality.toString());
      url.searchParams.append('format', 'webp'); // Use WebP format for better compression
      
      img.src = url.toString();
    } else {
      img.src = src;
    }

    img.onload = () => {
      setImageSrc(img.src);
      setIsLoaded(true);
    };

    img.onerror = () => {
      setError(true);
      console.error(`Failed to load image: ${src}`);
    };

    // Clean up
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, width, height, quality, placeholder]);

  return (
    <div className={`relative ${className}`}>
      {/* Placeholder or final image */}
      <img
        src={imageSrc}
        alt={alt}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
      />
      
      {/* Placeholder shown while loading */}
      {!isLoaded && !error && (
        <div 
          className={`absolute inset-0 bg-gray-200 animate-pulse ${className}`}
          aria-hidden="true"
        />
      )}
      
      {/* Error state */}
      {error && (
        <div className={`absolute inset-0 bg-gray-200 flex items-center justify-center ${className}`}>
          <span className="text-gray-500">Image failed to load</span>
        </div>
      )}
    </div>
  );
};

export default ImageOptimizer;
