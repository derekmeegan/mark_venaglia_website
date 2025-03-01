import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import TourManager from '../components/admin/TourManager';
import PortfolioManager from '../components/admin/PortfolioManager';

interface Tour {
  id: string;
  title: string;
  duration: string;
  image: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  year: string;
  category: string;
  description: string;
  image: string;
}

interface NotificationModal {
  show: boolean;
  title: string;
  message: string;
}

const AdminPage = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'tours' | 'portfolio'>('tours');
  const [error, setError] = useState('');
  const [tours, setTours] = useState<Tour[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [notification, setNotification] = useState<NotificationModal>({
    show: false,
    title: '',
    message: ''
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchTours();
      fetchPortfolioItems();
    }
  }, [isAuthenticated]);

  const fetchTours = async () => {
    try {
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTours(data || []);
    } catch (err) {
      console.error('Error fetching tours:', err);
      showNotification('Error', 'Failed to load tours');
    }
  };

  const fetchPortfolioItems = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPortfolioItems(data || []);
    } catch (err) {
      console.error('Error fetching portfolio items:', err);
      showNotification('Error', 'Failed to load portfolio items');
    }
  };

  const showNotification = (title: string, message: string) => {
    setNotification({
      show: true,
      title,
      message
    });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex justify-center mb-6">
            <div className="p-3 rounded-full bg-gold/10">
              <Lock className="h-6 w-6 text-gold" />
            </div>
          </div>
          <h2 className="text-2xl font-serif font-bold text-center text-charcoal mb-6">
            Admin Access
          </h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-gold focus:ring-gold"
              />
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-gold text-white py-2 rounded-md hover:bg-gold/90 transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-serif font-bold text-charcoal mb-6">
          Content Management
        </h1>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('tours')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'tours'
                ? 'bg-gold text-white'
                : 'bg-gray-100 text-charcoal hover:bg-gray-200'
            }`}
          >
            Tours
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'portfolio'
                ? 'bg-gold text-white'
                : 'bg-gray-100 text-charcoal hover:bg-gray-200'
            }`}
          >
            Portfolio
          </button>
        </div>

        {/* Content Managers */}
        {activeTab === 'tours' ? (
          <TourManager
            tours={tours}
            onTourAdded={fetchTours}
            onTourUpdated={fetchTours}
            onTourDeleted={fetchTours}
            showNotification={showNotification}
          />
        ) : (
          <PortfolioManager
            portfolioItems={portfolioItems}
            onPortfolioItemAdded={fetchPortfolioItems}
            onPortfolioItemUpdated={fetchPortfolioItems}
            onPortfolioItemDeleted={fetchPortfolioItems}
            showNotification={showNotification}
          />
        )}

        {/* Notification Modal */}
        <Modal
          isOpen={notification.show}
          onClose={() => setNotification({ ...notification, show: false })}
          title={notification.title}
        >
          <p className="text-gray-600 mb-6">{notification.message}</p>
          <button
            onClick={() => setNotification({ ...notification, show: false })}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-gold hover:bg-gold/90 transition-colors"
          >
            Close
          </button>
        </Modal>
      </div> </div>
  );
};

export default AdminPage;