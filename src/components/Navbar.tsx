import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Function to close the menu
  const closeMenu = () => {
    setIsOpen(false);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Tours', path: '/tours' },
    { name: 'Portfolio', path: '/portfolio' },
    { name: 'Corporate Solutions', path: '/corporate-solutions' },
    { name: 'Meet Mark', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  // Style helpers
  const getNavbarPosition = () => isHomePage ? 'absolute' : 'relative';

  const getLinkColor = (isActive: boolean) => {
    const baseStyle = isHomePage 
      ? 'text-cream hover:text-gold' 
      : 'text-charcoal hover:text-gold';
    
    const underlineStyle = 'relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5';
    const activeUnderline = isActive ? 'after:bg-gold' : 'after:bg-transparent after:hover:bg-gold/50';
    
    return `${baseStyle} ${underlineStyle} ${activeUnderline}`;
  };

  const getMobileLinkColor = (isActive: boolean) => {
    if (isHomePage) {
      return isActive ? 'text-gold font-bold' : 'text-cream hover:text-gold';
    }
    return isActive ? 'text-gold font-bold' : 'text-charcoal hover:text-gold';
  };

  return (
    <nav className={`w-full z-50 ${getNavbarPosition()} top-0 left-0`}>
      {/* Main Navbar */}
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
              onClick={() => setIsOpen(true)}
              className={`inline-flex items-center justify-center p-2 rounded-md focus:outline-none ${
                isHomePage ? 'text-cream hover:text-gold' : 'text-charcoal hover:text-gold'
              }`}
              aria-label="Open menu"
              type="button"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50" style={{backgroundColor: isHomePage ? '#333333' : '#ffffff'}}>
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="flex justify-between items-start px-4 pt-4">
              <div className="flex-shrink-0 z-50" onClick={closeMenu}>
                <Logo />
              </div>
              {/* Close button with larger clickable area */}
              <div className="p-4 cursor-pointer mt-2 z-50" onClick={closeMenu}>
                <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                  isHomePage ? 'text-cream' : 'text-charcoal'
                } hover:text-gold`}>
                  <X className="h-8 w-8" />
                </div>
              </div>
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
                  onClick={closeMenu}
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