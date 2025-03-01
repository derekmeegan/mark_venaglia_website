import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const Home = () => {
  return (
    <div className="relative min-h-screen">

      {/* Hero Section with Background */}
      <section className="relative min-h-screen">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1432937202807-b918d6a647ef?fm=jpg&amp;q=60&amp;w=3000&amp;ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Statue of Liberty"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-charcoal/50 mix-blend-multiply" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 min-h-screen flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-cream mb-6">
              Commission Your Private Manhattan
            </h1>
            <p className="text-xl md:text-2xl text-cream/80 mb-12 max-w-3xl mx-auto">
              Where <span className="text-gold">artistry</span> meets urban exploration—experience{' '}
              <span className="text-gold">New York</span> through the eyes of an artist and cultural curator.
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