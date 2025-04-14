import { useEffect, useState, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import ReviewCarousel from '../components/ReviewCarousel';
import { getCalApi } from "@calcom/embed-react";
import ImageOptimizer from '../components/ImageOptimizer';
import SEO from '../components/SEO';

// Add Cal.com window interface
declare global {
  interface Window {
    Cal?: {
      showCalendar: () => void;
      ns?: {
        [key: string]: any;
      };
    };
  }
}

interface Tour {
  id: string;
  title: string;
  duration: string;
  price: string;
  image: string;
  url: string | null;
}

const Tours = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const calInitializedRef = useRef<Set<string>>(new Set());
  const navigate = useNavigate();

  // Preload images function
  const preloadImages = (imageUrls: string[]) => {
    imageUrls.forEach(url => {
      if (url) {
        const img = new Image();
        img.src = url;
      }
    });
  };

  // Initialize Cal.com for each unique namespace found in tours
  useEffect(() => {
    const initializeCalNamespaces = async () => {
      // Extract unique namespaces from tour URLs
      const namespaces = new Set<string>();
      
      tours.forEach(tour => {
        if (tour.url) {
          const match = tour.url.match(/cal\.com\/(.+?)$/);
          if (match) {
            const calLink = match[1];
            const namespace = calLink.split('/')[1]; // Get the second part after the slash
            if (namespace) {
              namespaces.add(namespace);
            }
          }
        }
      });
      
      // Initialize Cal for each namespace if not already initialized
      for (const namespace of namespaces) {
        if (!calInitializedRef.current.has(namespace)) {
          try {
            console.log(`Initializing Cal for namespace: ${namespace}`);
            const cal = await getCalApi({ namespace });
            cal("ui", {
              styles: { 
                branding: { brandColor: "#f4b305" }
              },
              hideEventTypeDetails: false,
              layout: "month_view"
            });
            
            // Force Cal to preload for this namespace
            cal("preload", { calLink: "" });
            
            calInitializedRef.current.add(namespace);
          } catch (error) {
            console.error(`Error initializing Cal for namespace ${namespace}:`, error);
          }
        }
      }
    };
    
    if (tours.length > 0) {
      initializeCalNamespaces();
    }
  }, [tours]);

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const { data, error } = await supabase
          .from('tours')
          .select('*')
          .eq('publish', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Preload tour images as soon as we get the data
        if (data && data.length > 0) {
          const imageUrls = data.map(tour => tour.image).filter(Boolean);
          preloadImages(imageUrls);
        }
        
        setTours(data || []);
      } catch (err) {
        console.error('Error fetching tours:', err);
        setError('Failed to load tours. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTours();
  }, []);

  // This function extracts namespace and link from a Cal.com URL
  const parseCalUrl = (url: string | null) => {
    if (!url) return { namespace: null, link: null };
    
    const match = url.match(/cal\.com\/(.+?)$/);
    if (!match) return { namespace: null, link: null };
    
    const calLink = match[1];
    const parts = calLink.split('/');
    
    if (parts.length >= 2) {
      return {
        namespace: parts[1],
        link: calLink
      };
    }
    
    return { namespace: null, link: null };
  };

  const handleTourClick = (tour: Tour) => {
    if (!tour.url) {
      navigate('/contact');
      return;
    }

    // Parse the Cal.com URL to get the namespace and link
    const { namespace, link } = parseCalUrl(tour.url);
    
    if (!namespace || !link) {
      navigate('/contact');
      return;
    }
    
    // Log that we're trying to open the calendar
    console.log(`Attempting to open calendar for namespace: ${namespace}, link: ${link}`);
    
    // Try to manually trigger the Cal API if it's available in the window object
    try {
      const calNamespace = (window as any).Cal?.ns?.[namespace];
      if (calNamespace) {
        console.log("Found Cal namespace, triggering modal");
        // Use modal instead of inline to prevent button size issues
        calNamespace("modal", {
          calLink: link,
          config: {
            layout: "month_view"
          }
        });
      } else {
        console.log("Cal namespace not found, falling back to direct URL");
        // Fallback to opening the URL directly
        window.open(`https://cal.com/${link}`, '_blank');
      }
    } catch (error) {
      console.error("Error manually triggering Cal:", error);
      // Fallback to opening the URL directly
      window.open(`https://cal.com/${link}`, '_blank');
    }
  };

  return (
    <div className="bg-white">
      <SEO 
        title="Art Tours | Mark Venaglia"
        description="Discover exclusive art tours in New York City with Mark Venaglia. Experience the city's vibrant art scene with personalized guided tours."
        image="https://dvytdwbpqaupkodiuyom.supabase.co/storage/v1/object/public/mark_images/ui/mark_tour_pic.png"
        url="https://markvenaglia.com/tours"
        type="website"
      />
      
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Desktop Layout - Experience and Highlights */}
        <div className="hidden lg:grid grid-cols-2 gap-12 mb-16">
          {/* Left Column - Stacked Content */}
          <div className="space-y-8">
            {/* Exclusive Art Experiences Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Exclusive Art Experiences</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Each tour is a carefully crafted journey through New York's rich cultural landscape, combining my decades of experience as both an artist and cultural curator. Whether you're interested in contemporary art, historical landmarks, or the city's hidden artistic gems, I'll create a personalized experience that matches your interests.
              </p>
            </div>

            {/* Tour Highlights Section */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Tour Highlights</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <ArrowRight className="h-6 w-6 text-gold mr-2 flex-shrink-0" />
                  <span>Private guided tours of major and boutique museums</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="h-6 w-6 text-gold mr-2 flex-shrink-0" />
                  <span>Customized art district explorations</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="h-6 w-6 text-gold mr-2 flex-shrink-0" />
                  <span>Optional wine and chocolate tastings and interactive art experiences</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="relative h-[475px] rounded-lg overflow-hidden shadow-lg">
            <ImageOptimizer
              src="https://dvytdwbpqaupkodiuyom.supabase.co/storage/v1/object/public/mark_images/ui/mark_tour_pic.png"
              alt="Art Gallery Experience"
              className="absolute inset-0 w-full h-full object-cover object-top"
              width={800}
              height={475}
              quality={85}
            />
          </div>
        </div>

        {/* Mobile Layout - Only Experiences Section */}
        <div className="lg:hidden mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Exclusive Art Experiences</h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            Each tour is a carefully crafted journey through New York's rich cultural landscape, combining my decades of experience as both an artist and cultural curator. Whether you're interested in contemporary art, historical landmarks, or the city's hidden artistic gems, I'll create a personalized experience that matches your interests.
          </p>
        </div>
        {/* Tours Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 mb-12">
          {isLoading ? (
            // Loading skeletons
            [...Array(4)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-gray-200" />
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-10 bg-gray-200 rounded" />
                </div>
              </div>
            ))
          ) : error ? (
            <div className="col-span-full text-center py-8">
              <p className="text-red-500">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-gold hover:bg-gold/90"
              >
                Try Again
              </button>
            </div>
          ) : tours.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">No tours available at the moment.</p>
            </div>
          ) : (
            tours.map((tour) => (
              <div 
                key={tour.id} 
                className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col cursor-pointer transform transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-gold hover:border-2 relative"
                onClick={() => handleTourClick(tour)}
              >
                <div className="absolute inset-0 bg-gold opacity-0 hover:opacity-10 transition-opacity duration-300 pointer-events-none"></div>
                <ImageOptimizer
                  src={tour.image}
                  alt={tour.title}
                  className="w-full h-36 object-cover"
                  width={400}
                  height={144}
                  quality={80}
                />
                <div className="p-4 pt-2 flex flex-col flex-1">
                  <h4 className="text-lg font-semibold mb-1">{tour.title}</h4>
                  <p className="text-gray-600 text-sm mb-1">
  {(() => {
    const hours = Number(tour.duration) / 60;
    return hours % 1 === 0 ? `${hours} hours` : `${hours.toFixed(1)} hours`;
  })()}
</p>
                  <p className="text-gray-700 font-medium">{tour.price}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Reviews Section */}
        <div className="border-t border-gray-200 pt-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Reflections From Mark's Tours</h2>
          </div>

          {/* Review Carousel */}
          <ReviewCarousel />

          {/* Call to Action */}
          <div className="text-center mt-12">
            <Link
              to="/contact"
              className="inline-flex items-center px-8 py-3 border border-transparent text-lg font-medium rounded-full text-white bg-gold hover:bg-gold/90 transition-colors"
            >
              Book A Custom Tour
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tours;