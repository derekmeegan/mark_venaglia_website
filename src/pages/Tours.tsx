import React, { useEffect, useState, Suspense, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { getCalApi } from '@calcom/embed-react';
import ImageOptimizer from '../components/ImageOptimizer';
import SEO from '../components/SEO';

// Lazy‑load heavy components so they do not block first paint
const ReviewCarousel = Suspense
  ? React.lazy(() => import('../components/ReviewCarousel'))
  : null;

// ------ Cal.com helper --------------------------------------------------

// Cache per‑namespace Cal instances so the script is requested only once
const calCache: Record<string, Promise<ReturnType<typeof getCalApi>>> = {};

const openCal = async (slug: string) => {
  // slug format: "mark-venaglia/<event>"
  const [namespace] = slug.split('/');

  if (!calCache[namespace]) {
    calCache[namespace] = getCalApi({ namespace }).then((cal) => {
      cal('ui', {
        styles: { branding: { brandColor: '#f4b305' } },
        hideEventTypeDetails: false,
        layout: 'month_view',
      });
      return cal;
    });
  }

  try {
    (await calCache[namespace])('modal', {
      calLink: slug,
      config: { layout: 'month_view' },
    });
  } catch (err) {
    // If the embed fails, fallback to Cal.com in a new tab
    window.open(`https://cal.com/${slug}`, '_blank');
  }
};

// ------------------------------------------------------------------------

interface Tour {
  id: string;
  title: string;
  duration: string;
  image: string;
  slug: string | null;
  price?: string; // still available from DB if needed later
}

const Tours: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // --- Fetch tours -------------------------------------------------------
  useEffect(() => {
    const fetchTours = async () => {
      try {
        const { data, error } = await supabase
          .from('tours')
          .select('id,title,duration,image,slug,price') // fetch only what the UI needs
          .eq('publish', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTours(data ?? []);
      } catch (err) {
        console.error('Error fetching tours:', err);
        setError('Failed to load tours. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTours();
  }, []);

  // --- Handlers ----------------------------------------------------------
  const handleTourClick = useCallback(
    (tour: Tour) => {
      if (!tour.slug) return navigate('/contact');
      const calSlug = `mark-venaglia/${tour.slug}`;
      openCal(calSlug);
    },
    [navigate]
  );

  // ----------------------------------------------------------------------

  return (
    <div className="bg-white">
      <SEO
        title="Art Tours | Mark Venaglia"
        description="Discover exclusive art tours in New York City with Mark Venaglia. Experience the city's vibrant art scene with personalized guided tours."
        image="/mark_tour_pic.webp"
        url="https://markvenaglia.com/tours"
        type="website"
      />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Desktop Layout - Experience and Highlights */}
        <div className="hidden lg:grid grid-cols-2 gap-12 mb-16">
          {/* Left Column */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Exclusive Art Experiences</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Each tour is a carefully crafted journey through New York's rich cultural landscape, combining my decades of experience as both an artist and cultural curator. Whether you're interested in contemporary art, historical landmarks, or the city's hidden artistic gems, I'll create a personalized experience that matches your interests.
              </p>
            </div>

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

          {/* Right Column Image */}
          <div className="relative h-[475px] rounded-lg overflow-hidden shadow-lg">
            <img
              src="/mark_tour_pic.webp"
              alt="Art Gallery Experience"
              className="absolute inset-0 w-full h-full object-cover object-top"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Exclusive Art Experiences</h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            Each tour is a carefully crafted journey through New York's rich cultural landscape, combining my decades of experience as both an artist and cultural curator. Whether you're interested in contemporary art, historical landmarks, or the city's hidden artistic gems, I'll create a personalized experience that matches your interests.
          </p>
        </div>

        {/* Tours Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 mb-12">
          {isLoading ? (
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
                onTouchStart={() => {}}
                role="button"
                tabIndex={0}
                aria-label={`Book ${tour.title} tour`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleTourClick(tour);
                  }
                }}
              >
                <div className="absolute inset-0 bg-gold opacity-0 hover:opacity-10 transition-opacity duration-300 pointer-events-none" />
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

          {ReviewCarousel && (
            <Suspense fallback={<div className="h-52" />}>
              <ReviewCarousel />
            </Suspense>
          )}

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
