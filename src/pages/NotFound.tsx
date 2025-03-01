import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const NotFound = () => {
  return (
    <div className="bg-white min-h-screen flex items-center justify-center px-4">
      <SEO 
        title="Page Not Found | Mark Venaglia"
        description="The page you're looking for doesn't exist or has been moved."
        url="https://markvenaglia.com/404"
        type="website"
      />
      
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-serif font-bold text-gold mb-4">404</h1>
        <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link 
          to="/"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-gold hover:bg-gold/90 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
