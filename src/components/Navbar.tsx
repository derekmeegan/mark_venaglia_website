import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Tours', path: '/tours' },
    { name: 'Portfolio', path: '/portfolio' },
    { name: 'Corporate Solutions', path: '/corporate-solutions' },
    { name: 'Meet Mark', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const getNavbarPosition = () => {
    return isHomePage ? 'absolute' : 'relative';
  };

  const getLinkColor = (isActive: boolean) => {
    if (isHomePage) {
      return 'text-cream hover:text-gold relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 ' + 
        (isActive ? 'after:bg-gold' : 'after:bg-transparent after:hover:bg-gold/50');
    }
    return 'text-charcoal hover:text-gold relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 ' + 
      (isActive ? 'after:bg-gold' : 'after:bg-transparent after:hover:bg-gold/50');
  };

  const getMobileLinkColor = (isActive: boolean) => {
    if (isHomePage) {
      return isActive
        ? 'text-gold relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-gold'
        : 'text-cream hover:text-gold relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-transparent after:hover:bg-gold/50';
    }
    return isActive
      ? 'text-gold relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-gold'
      : 'text-charcoal hover:text-gold relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-transparent after:hover:bg-gold/50';
  };

  return (
    <nav className={`w-full z-50 ${getNavbarPosition()} top-0 left-0`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className='mt-12'>
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <div className={`hidden md:flex items-center space-x-8 ${!isHomePage ? 'ml-auto' : ''}`}>
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${getLinkColor(
                  location.pathname === link.path
                )}`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-md focus:outline-none ${
                isHomePage ? 'text-cream hover:text-gold' : 'text-charcoal hover:text-gold'
              }`}
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className={`fixed inset-0 z-50 ${isHomePage ? 'bg-charcoal' : 'bg-white'}`}>
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="flex justify-between items-start px-4 pt-4">
              <div className="flex-shrink-0">
                <Logo />
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-2 ${isHomePage ? 'text-cream' : 'text-charcoal'} hover:text-gold mt-4`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Mobile Links */}
            <div className="flex-grow flex flex-col items-center justify-center space-y-8 -mt-20">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-lg font-medium ${getMobileLinkColor(
                    location.pathname === link.path
                  )}`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;