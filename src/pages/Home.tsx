import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import ImageOptimizer from '../components/ImageOptimizer';

import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

const Home = () => {
  // Dynamically preload images for Tours and Portfolio
  useEffect(() => {
    const preloadImages = (urls: string[]) => {
      urls.forEach(src => {
        if (src) {
          const img = new window.Image();
          img.src = src;
        }
      });
    };

    const fetchAndPreload = async () => {
      try {
        // Fetch published tours
        const { data: tours, error: toursError } = await supabase
          .from('tours')
          .select('image')
          .eq('publish', true)
          .order('created_at', { ascending: false });
        if (toursError) throw toursError;
        const tourImages = (tours || []).map(t => t.image).filter(Boolean);

        // Fetch portfolio items (all categories)
        const { data: portfolio, error: portfolioError } = await supabase
          .from('portfolio')
          .select('image')
          .order('created_at', { ascending: false });
        if (portfolioError) throw portfolioError;
        const portfolioImages = (portfolio || []).map(p => p.image).filter(Boolean);

        // Fetch all images in the 'ui' folder in the 'mark_images' bucket
        const { data: uiFiles, error: uiError } = await supabase.storage
          .from('mark_images')
          .list('ui', { limit: 100 });
        if (uiError) throw uiError;
        const uiImages = (uiFiles?.map(f =>
          f.name && f.name !== 'SOAR_Venaglia with Eve_interior-02-01.jpeg'
            ? `https://dvytdwbpqaupkodiuyom.supabase.co/storage/v1/object/public/mark_images/ui/${f.name}`
            : null
        ) || []).filter(Boolean);

        preloadImages([...tourImages, ...portfolioImages, ...uiImages]);
      } catch (err) {
        // Silent fail: don't block home page if preload fails
        console.error('Preload error:', err);
      }
    };

    fetchAndPreload();
  }, []);

  return (
    <div className="relative min-h-screen">
      <SEO 
        title="Mark Venaglia | Artist & Cultural Curator"
        description="Explore New York's art scene with renowned artist and cultural curator offering exclusive art tours and exhibitions."
        image = 'https://dvytdwbpqaupkodiuyom.supabase.co/storage/v1/object/public/mark_images/ui/SOAR_Venaglia%20with%20Eve_interior-02.jpeg'
        url="https://markvenaglia.com"
        type="website"
      />

      {/* Hero Section with Background */}
      <section className="relative min-h-screen">
        <div className="absolute inset-0">
          <ImageOptimizer
            src = 'https://dvytdwbpqaupkodiuyom.supabase.co/storage/v1/object/public/mark_images/ui/SOAR_Venaglia%20with%20Eve_interior-02-01.jpeg'
            alt="Statue of Liberty"
            className="w-full h-full object-cover object-top"
            width={1600}
            height={900}
          />
          <div className="absolute inset-0 bg-charcoal/50 mix-blend-multiply" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 min-h-screen flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-cream mb-6">
              Commission Your Private Manhattan
            </h1>
            <p className="text-xl md:text-2xl text-cream/80 mb-12 max-w-3xl md:max-w-4xl mx-auto">
              Where <span className="text-gold">artistry</span> meets urban exploration—experience{' '}
              <span className="text-gold">New York</span> through the eyes of an artist and cultural curator, <b>Mark Venaglia</b>.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-xs sm:max-w-none mx-auto">
              <Link
                to="/tours"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-gold hover:bg-gold/90 transition-colors"
              >
                Discover Tours
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/portfolio"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 border-2 border-cream text-base font-medium rounded-full text-cream hover:bg-cream/10 transition-colors"
              >
                Explore Portfolio
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;