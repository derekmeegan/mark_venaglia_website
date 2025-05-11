import { useState, lazy, Suspense } from 'react';
import { AdminComponentProps } from '../../types/admin';
import { TabType } from '../../types/resume';

// Lazy load resume components to avoid TypeScript errors during development
const ProfileManager = lazy(() => import('./resume/ProfileManager'));
const AwardsManager = lazy(() => import('./resume/AwardsManager'));
const CollectorsManager = lazy(() => import('./resume/CollectorsManager'));
const HighlightsManager = lazy(() => import('./resume/HighlightsManager'));
const SpeakingManager = lazy(() => import('./resume/SpeakingManager'));
const PublicationsManager = lazy(() => import('./resume/PublicationsManager'));

interface ResumeManagerProps extends AdminComponentProps {
  onDataChanged?: () => void;
}

const ResumeManager: React.FC<ResumeManagerProps> = ({ 
  showNotification, 
  onDataChanged 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  return (
    <div>
      {/* Tab Navigation - Vertical on left */}
      <div className="flex flex-col md:flex-row md:space-x-8 mb-8">
        <div className="w-full md:w-64 mb-8 md:mb-0 flex-shrink-0">
          <nav className="sticky top-8 pr-4 md:pr-8 space-y-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left py-3 px-4 rounded-l-md font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'bg-gold/10 text-gold border-r-2 border-gold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('highlights')}
              className={`w-full text-left py-3 px-4 rounded-l-md font-medium transition-colors ${
                activeTab === 'highlights'
                  ? 'bg-gold/10 text-gold border-r-2 border-gold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Highlights
            </button>
            <button
              onClick={() => setActiveTab('awards')}
              className={`w-full text-left py-3 px-4 rounded-l-md font-medium transition-colors ${
                activeTab === 'awards'
                  ? 'bg-gold/10 text-gold border-r-2 border-gold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Awards
            </button>
            <button
              onClick={() => setActiveTab('publications')}
              className={`w-full text-left py-3 px-4 rounded-l-md font-medium transition-colors ${
                activeTab === 'publications'
                  ? 'bg-gold/10 text-gold border-r-2 border-gold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Publications
            </button>
            <button
              onClick={() => setActiveTab('speaking')}
              className={`w-full text-left py-3 px-4 rounded-l-md font-medium transition-colors ${
                activeTab === 'speaking'
                  ? 'bg-gold/10 text-gold border-r-2 border-gold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Speaking
            </button>
            <button
              onClick={() => setActiveTab('collectors')}
              className={`w-full text-left py-3 px-4 rounded-l-md font-medium transition-colors ${
                activeTab === 'collectors'
                  ? 'bg-gold/10 text-gold border-r-2 border-gold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Collectors
            </button>
          </nav>
        </div>
        
        {/* Content Managers */}
        <div className="flex-1">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <Suspense fallback={<div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div></div>}>
              {activeTab === 'profile' && (
                <ProfileManager 
                  showNotification={showNotification} 
                  onDataChanged={onDataChanged}
                />
              )}
              {activeTab === 'awards' && (
                <AwardsManager 
                  showNotification={showNotification} 
                  onDataChanged={onDataChanged}
                />
              )}
              {activeTab === 'collectors' && (
                <CollectorsManager 
                  showNotification={showNotification} 
                  onDataChanged={onDataChanged}
                />
              )}
              {activeTab === 'highlights' && (
                <HighlightsManager 
                  showNotification={showNotification} 
                  onDataChanged={onDataChanged}
                />
              )}
              {activeTab === 'speaking' && (
                <SpeakingManager 
                  showNotification={showNotification} 
                  onDataChanged={onDataChanged}
                />
              )}
              {activeTab === 'publications' && (
                <PublicationsManager 
                  showNotification={showNotification} 
                  onDataChanged={onDataChanged}
                />
              )}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeManager;
