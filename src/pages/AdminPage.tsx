import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import TourManager from '../components/admin/TourManager';
import PortfolioManager from '../components/admin/PortfolioManager';
import ResumeManager from '../components/admin/ResumeManager';

import { PortfolioItem, NotificationModal, AdminTab } from '../types/admin';

const AdminPage = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('tours');
  const [error, setError] = useState('');
  // Use type from the types/admin.ts file
  const [tours, setTours] = useState<any[]>([]);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full border border-gray-100">
          <div className="flex justify-center mb-8">
            <div className="p-4 rounded-full bg-gray-100">
              <Lock className="h-7 w-7 text-gray-700" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
            Admin Access
          </h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 text-gray-700"
              />
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 md:p-12 lg:p-20">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Content Management
        </h1>

        {/* Tab Navigation */}
        <div className="flex flex-wrap space-x-2 mb-8 border-b border-gray-200 pb-2">
          <button
            onClick={() => setActiveTab('tours')}
            className={`px-4 py-3 rounded-t-lg font-medium transition-colors ${
              activeTab === 'tours'
                ? 'text-gray-800 border-b-2 border-gray-800'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Tours
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-4 py-3 rounded-t-lg font-medium transition-colors ${
              activeTab === 'portfolio'
                ? 'text-gray-800 border-b-2 border-gray-800'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Portfolio
          </button>
          <button
            onClick={() => setActiveTab('resume')}
            className={`px-4 py-3 rounded-t-lg font-medium transition-colors ${
              activeTab === 'resume'
                ? 'text-gray-800 border-b-2 border-gray-800'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Resume
          </button>
        </div>

        {/* Content Managers */}
        {activeTab === 'tours' && (
          <TourManager
            tours={tours}
            onTourAdded={fetchTours}
            onTourUpdated={fetchTours}
            onTourDeleted={fetchTours}
            showNotification={showNotification}
          />
        )}
        
        {activeTab === 'portfolio' && (
          <PortfolioManager
            portfolioItems={portfolioItems}
            onPortfolioItemAdded={fetchPortfolioItems}
            onPortfolioItemUpdated={fetchPortfolioItems}
            onPortfolioItemDeleted={fetchPortfolioItems}
            showNotification={showNotification}
          />
        )}
        
        {activeTab === 'resume' && (
          <ResumeManager
            showNotification={showNotification}
            onDataChanged={() => {}}
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
      </div>
  );
};

export default AdminPage;