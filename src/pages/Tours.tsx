import React, { useEffect, useState, Suspense, useCallback, useMemo, useRef } from 'react';
import { ArrowRight, MapPin, X, ChevronDown, Search, Landmark, Footprints, Sparkles, LayoutGrid } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { getCalApi } from '@calcom/embed-react';
import ImageOptimizer from '../components/ImageOptimizer';
import SEO from '../components/SEO';

// Custom Dropdown Component
interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between gap-2 px-4 py-2.5 md:px-5
          border-2 rounded-full transition-all duration-200
          bg-white font-medium text-gray-700 shadow-sm
          min-w-[160px] md:min-w-[200px]
          ${isOpen
            ? 'border-gold ring-2 ring-gold/20'
            : 'border-gray-200 hover:border-gold/50'
          }
        `}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon && <span className="text-gold">{selectedOption.icon}</span>}
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
            {selectedOption?.label || placeholder}
          </span>
        </span>
        <ChevronDown
          className={`h-5 w-5 text-gold transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      <div
        className={`
          absolute z-50 mt-2 w-full min-w-[200px]
          bg-white rounded-2xl shadow-xl border border-gray-100
          overflow-hidden
          transition-all duration-200 origin-top
          ${isOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
          }
        `}
      >
        {options.map((option, index) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onChange(option.value);
              setIsOpen(false);
            }}
            className={`
              w-full flex items-center gap-3 px-4 py-3 text-left
              transition-colors duration-150
              ${value === option.value
                ? 'bg-gold/10 text-gold'
                : 'text-gray-700 hover:bg-gray-50'
              }
              ${index === 0 ? 'rounded-t-2xl' : ''}
              ${index === options.length - 1 ? 'rounded-b-2xl' : ''}
            `}
          >
            {option.icon && (
              <span className={value === option.value ? 'text-gold' : 'text-gray-400'}>
                {option.icon}
              </span>
            )}
            <span className="font-medium">{option.label}</span>
            {value === option.value && (
              <span className="ml-auto">
                <svg className="w-5 h-5 text-gold" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

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
  price?: number;
  description?: string;
  location?: string;
  category?: string;
  tags?: string[];
}

// Category labels for display
const CATEGORY_LABELS: Record<string, string> = {
  museum: 'Museum Tours',
  walking: 'Walking Tours',
  special: 'Experiences',
};

// Category options for dropdown
const CATEGORY_OPTIONS: DropdownOption[] = [
  { value: '', label: 'All Categories', icon: <LayoutGrid className="w-5 h-5" /> },
  { value: 'museum', label: 'Museum Tours', icon: <Landmark className="w-5 h-5" /> },
  { value: 'walking', label: 'Walking Tours', icon: <Footprints className="w-5 h-5" /> },
  { value: 'special', label: 'Experiences', icon: <Sparkles className="w-5 h-5" /> },
];

const Tours: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const navigate = useNavigate();

  // --- Fetch tours -------------------------------------------------------
  useEffect(() => {
    const fetchTours = async () => {
      try {
        const { data, error } = await supabase
          .from('tours')
          .select('id,title,duration,image,slug,price,description,address,location,category,tags')
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

  // --- Filtered tours ----------------------------------------------------
  const filteredTours = useMemo(() => {
    return tours.filter((tour) => {
      // Search filter
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        tour.title.toLowerCase().includes(query) ||
        (tour.description?.toLowerCase().includes(query) ?? false);

      // Category filter
      const matchesCategory = !categoryFilter || tour.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [tours, searchQuery, categoryFilter]);

  // --- Active filters for display ----------------------------------------
  const activeFilters = useMemo(() => {
    const filters: { type: string; label: string; clear: () => void }[] = [];

    if (searchQuery.trim()) {
      filters.push({
        type: 'search',
        label: `Search: "${searchQuery}"`,
        clear: () => setSearchQuery(''),
      });
    }
    if (categoryFilter) {
      filters.push({
        type: 'category',
        label: CATEGORY_LABELS[categoryFilter] || categoryFilter,
        clear: () => setCategoryFilter(''),
      });
    }

    return filters;
  }, [searchQuery, categoryFilter]);

  // --- Handlers ----------------------------------------------------------
  const handleTourClick = useCallback(
    (tour: Tour) => {
      if (!tour.slug) return navigate('/contact');
      const calSlug = `mark-venaglia/${tour.slug}`;
      openCal(calSlug);
    },
    [navigate]
  );

  // Format duration from minutes to hours
  const formatDuration = (duration: string) => {
    const hours = Number(duration) / 60;
    return hours % 1 === 0 ? `${hours} hrs` : `${hours.toFixed(1)} hrs`;
  };

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters and Search */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search tours..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 pl-11 border-2 border-gray-200 rounded-full focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all bg-white font-medium text-gray-700 hover:border-gold/50 shadow-sm placeholder:text-gray-400"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>

            {/* Category Filter - Custom Dropdown */}
            <CustomDropdown
              options={CATEGORY_OPTIONS}
              value={categoryFilter}
              onChange={setCategoryFilter}
              placeholder="All Categories"
            />
          </div>

          {/* Active Filters Display */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeFilters.map((filter) => (
                <div
                  key={filter.type}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 text-gold rounded-full text-sm"
                >
                  <span>{filter.label}</span>
                  <button
                    onClick={filter.clear}
                    className="hover:text-gold/70"
                    aria-label={`Clear ${filter.type} filter`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tours Grid - 3 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {isLoading ? (
            [...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden animate-pulse">
                <div className="w-full h-36 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded-full w-20" />
                    <div className="h-6 bg-gray-200 rounded-full w-16" />
                  </div>
                  <div className="h-12 bg-gray-200 rounded" />
                  <div className="h-10 bg-gray-200 rounded-full" />
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
          ) : filteredTours.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No tours found matching your criteria.</p>
            </div>
          ) : (
            filteredTours.map((tour) => (
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
                <div className="relative w-full h-36">
                  <ImageOptimizer
                    src={tour.image}
                    alt={tour.title}
                    className="w-full h-36 object-cover"
                    width={400}
                    height={144}
                    quality={80}
                  />
                  {/* Location Badge */}
                  {tour.location && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-700 backdrop-blur-sm">
                        <MapPin className="w-3 h-3 mr-1 text-gold" />
                        {tour.location}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 pt-2 flex flex-col flex-1">
                  <h4 className="text-lg font-semibold mb-2">{tour.title}</h4>
                  {/* Tags */}
                  {tour.tags && tour.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {tour.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gold/10 text-gold border border-gold"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Description */}
                  {tour.description && (
                    <p className="text-gray-500 text-xs leading-relaxed mb-2 flex-grow line-clamp-3">
                      {tour.description}
                    </p>
                  )}
                  <div className="mt-auto">
                    {/* Duration and Price */}
                    <p className="text-gold text-sm font-medium flex items-center justify-between mb-3">
                      <span>{formatDuration(tour.duration)}</span>
                      {tour.price && <span>${tour.price}</span>}
                    </p>
                    {/* Book Now Button */}
                    <button
                      className="w-full py-2 px-4 text-sm font-medium bg-gold text-white rounded-full hover:bg-gold/90 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTourClick(tour);
                      }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Reviews Section */}
        <div className="border-t border-gray-200 pt-8 mb-12">
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

        {/* Cancellation Policy Section */}
        <div className="border-t border-gray-200 pt-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Cancellation Policy</h2>
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancellation & Refund Policy</h3>
                <p className="text-gray-700 leading-relaxed">
                  All tours are priced at $650 regardless of group size. To receive a full refund, cancellations must be made at least 48 hours before the scheduled tour time. Cancellations made within 48 hours of the tour are non-refundable.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Rescheduling</h3>
                <p className="text-gray-700 leading-relaxed">
                  Tours may be rescheduled up to 24 hours before the scheduled time, subject to availability. Rescheduling requests made within 24 hours may incur additional fees.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Weather & Unforeseen Circumstances</h3>
                <p className="text-gray-700 leading-relaxed">
                  In the event of severe weather or other circumstances beyond our control that prevent the tour from taking place, you will be offered a full refund or the option to reschedule at no additional cost.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  For questions about cancellations or to request a refund, please contact us at{' '}
                  <a href="mailto:contact@markvenaglia.com" className="text-gold hover:underline">
                    contact@markvenaglia.com
                  </a>{' '}
                  or{' '}
                  <a href="tel:+19179957223" className="text-gold hover:underline">
                    (917) 995-7223
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tours;
