import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Mail, ArrowRight } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-charcoal text-cream py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-cream/80">
            Where artistry meets urban exploration.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <div className="flex items-center gap-4">
              <Link
                to="/contact"
                className="inline-flex items-center px-4 py-2 rounded-full border border-cream/20 text-sm font-medium text-cream hover:bg-cream/10 transition-colors"
              >
                Contact
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                to="/tours"
                className="inline-flex items-center px-4 py-2 rounded-full bg-gold text-sm font-medium text-white hover:bg-gold/90 transition-colors"
              >
                Book a Tour
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="https://www.instagram.com/markvenaglia/?hl=en"
                className="text-cream/60 hover:text-gold transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="mailto:contact@markvenaglia.com"
                className="text-cream/60 hover:text-gold transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer