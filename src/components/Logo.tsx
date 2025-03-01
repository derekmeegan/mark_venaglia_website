import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Logo = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <Link to="/" className="flex-shrink-0">
      <img 
        src={isHomePage ? '/logo.png' : '/logoblack.png'} 
        alt="Mark Venaglia" 
        className="h-24 w-auto" 
      />
    </Link>
  );
};

export default Logo;