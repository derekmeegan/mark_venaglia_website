import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import SEO from '../components/SEO';

const Subscribe = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          'api-key': import.meta.env.VITE_BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          listIds: [4],
          updateEnabled: true,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to subscribe');
      }

      setEmail('');
      setShowSuccessModal(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-[calc(100vh-160px)] flex items-center">
      <SEO
        title="Stay Connected | Mark Venaglia"
        description="Join Mark Venaglia's mailing list for updates on art tours, new commissions, exhibitions, and more."
        url="https://markvenaglia.com/subscribe"
        type="website"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-charcoal mb-4">
            Stay Connected
          </h1>
          <p className="text-gray-600 mb-8 font-sans">
            Join our mailing list to receive updates on upcoming tours, new artwork, exhibitions, and exclusive offers.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter your email address"
                className={`block w-full rounded-md border-cream bg-cream/50 px-4 py-3 text-charcoal shadow-sm focus:border-gold focus:ring-gold text-center ${
                  error ? 'border-red-500' : ''
                }`}
              />
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full inline-flex justify-center py-3 px-6 border border-transparent text-base font-medium rounded-full text-white bg-gold hover:bg-gold/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold transition-colors ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>

          <p className="mt-4 text-xs text-gray-400">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 relative animate-fade-in">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-charcoal mb-4">You're In!</h2>
              <p className="text-gray-600 mb-6">
                Thanks for subscribing! You'll be the first to know about upcoming tours, new artwork, and more.
              </p>
              <Link
                to="/tours"
                onClick={() => setShowSuccessModal(false)}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-gold hover:bg-gold/90 transition-colors"
              >
                Explore Tours
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscribe;
