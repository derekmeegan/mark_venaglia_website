import React, { useEffect } from 'react';
import { ArrowRight, Instagram, Facebook, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLinkedin, faTiktok } from '@fortawesome/free-brands-svg-icons';
import SEO from '../components/SEO';
import { supabase } from '../lib/supabase';

const preloadImage = (src: string): void => {
  if (!src) return;
  if (document.querySelector(`link[rel="preload"][href="${src}"]`)) return; // already added

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
};

const Home: React.FC = () => {
  useEffect(() => {
    let isMounted = true;

    const fetchAndPreload = async (): Promise<void> => {
      try {
        // Fetch tours & portfolio images in parallel
        const [{ data: tours, error: toursError }, { data: portfolio, error: portfolioError }] =
          await Promise.all([
            supabase.from('tours').select('image').eq('publish', true),
            supabase.from('portfolio').select('image'),
          ]);

        if (toursError) throw toursError;
        if (portfolioError) throw portfolioError;

        const tourImgs = (tours ?? []).map((t) => t.image).filter(Boolean) as string[];
        const portfolioImgs = (portfolio ?? []).map((p) => p.image).filter(Boolean) as string[];

        if (!isMounted) return;
        [...tourImgs, ...portfolioImgs].forEach(preloadImage);
      } catch (err) {
        // Silent fail – don't block the home page
        console.error('Image‑preload error:', err);
      }
    };

    fetchAndPreload();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="relative min-h-screen">
      <SEO
        title="Mark Venaglia | Artist & Cultural Curator"
        description="Explore New York's art scene with renowned artist and cultural curator offering exclusive art tours and exhibitions."
        image="/hero.png"
        url="https://markvenaglia.com"
        type="website"
      />

      {/* Hero Section with Background */}
      <section className="relative min-h-screen">
        <div className="absolute inset-0">
          <img
            src="/hero.png"
            alt="SOAR Venaglia with Eve interior"
            className="w-full h-full object-cover object-top"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-charcoal/50 mix-blend-multiply" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 min-h-screen flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-cream mb-6">Commission Your Private Manhattan</h1>
            <p className="text-xl md:text-2xl text-cream/80 mb-12 max-w-3xl md:max-w-4xl mx-auto">
              Where <span className="text-gold">artistry</span> meets urban exploration—experience <span className="text-gold">New York</span> through the eyes of an artist and cultural curator, <b>Mark Venaglia</b>.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-xs sm:max-w-none mx-auto">
              <Link
                to="/tours"
                prefetch="intent"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-gold hover:bg-gold/90 transition-colors"
              >
                Discover Tours
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/portfolio"
                prefetch="intent"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 border-2 border-cream text-base font-medium rounded-full text-cream hover:bg-cream/10 transition-colors"
              >
                Explore Portfolio
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
            
            {/* Social Media Links */}
            <div className="flex items-center justify-center gap-6 mt-8">
              <a
                href="https://www.facebook.com/mark.venaglia/"
                className="text-cream hover:text-gold transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-7 w-7" />
              </a>
              <a
                href="https://www.instagram.com/markvenaglia/?hl=en"
                className="text-cream hover:text-gold transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-7 w-7" />
              </a>
              <a
                href="https://www.tiktok.com/@markvenaglia"
                className="text-cream hover:text-gold transition-colors"
                aria-label="Tiktok"
              >
                <FontAwesomeIcon icon={faTiktok} className="h-7 w-7" />
              </a>
              <a
                href="https://www.linkedin.com/in/markvenaglia/"
                className="text-cream hover:text-gold transition-colors"
                aria-label="LinkedIn"
              >
                <FontAwesomeIcon icon={faLinkedin} className="h-7 w-7" />
              </a>
              <a
                href="mailto:contact@markvenaglia.com"
                className="text-cream hover:text-gold transition-colors"
                aria-label="Email"
              >
                <Mail className="h-7 w-7" />
              </a>
              <a
                href="tel:+19179957223"
                className="text-cream hover:text-gold transition-colors"
                aria-label="Phone"
              >
                <Phone className="h-7 w-7" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;