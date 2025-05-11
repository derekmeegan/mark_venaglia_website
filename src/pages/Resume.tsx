import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { supabase } from '../lib/supabase';
import { TabType, ArtistProfile, Award, Collector, Highlight, Speaking, Publication } from '../types/resume';



const Resume = () => {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isLoading, setIsLoading] = useState(true);
  
  // State for each data type
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [awards, setAwards] = useState<Award[]>([]);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [speaking, setSpeaking] = useState<Speaking[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);

  // Fetch all data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('artist_profile')
          .select('*')
          .limit(1)
          .single();
        
        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch awards
        const { data: awardsData, error: awardsError } = await supabase
          .from('awards')
          .select('*')
          .order('year', { ascending: false });
        
        if (awardsError) throw awardsError;
        setAwards(awardsData || []);

        // Fetch collectors
        const { data: collectorsData, error: collectorsError } = await supabase
          .from('collector_list')
          .select('*')
          .order('name');
        
        if (collectorsError) throw collectorsError;
        setCollectors(collectorsData || []);

        // Fetch highlights
        const { data: highlightsData, error: highlightsError } = await supabase
          .from('highlights')
          .select('*')
          .order('start_date', { ascending: false });
        
        if (highlightsError) throw highlightsError;
        setHighlights(highlightsData || []);

        // Fetch speaking engagements
        const { data: speakingData, error: speakingError } = await supabase
          .from('public_speaking')
          .select('*')
          .order('year', { ascending: false });
        
        if (speakingError) throw speakingError;
        setSpeaking(speakingData || []);

        // Fetch publications
        const { data: publicationsData, error: publicationsError } = await supabase
          .from('publications')
          .select('*')
          .order('year', { ascending: false });
        
        if (publicationsError) throw publicationsError;
        setPublications(publicationsData || []);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // Tab content components
  const ProfileTab = () => (
    <div className="space-y-8">
      {profile?.bio && (
        <div>
          <h3 className="text-2xl font-semibold mb-3">Biography</h3>
          <div className="space-y-4">
            {profile.bio.split('***').map((paragraph, index) => (
              <p key={index} className="text-lg text-gray-700 leading-relaxed">
                {paragraph.trim()}
              </p>
            ))}
          </div>
        </div>
      )}
      {profile?.artist_statement && (
        <div>
          <h3 className="text-2xl font-semibold mb-3">Artist Statement</h3>
          <blockquote className="border-l-4 border-gold pl-4 italic text-lg text-gray-700">
            <div className="space-y-4">
              {profile.artist_statement.split('***').map((paragraph, index) => (
                <p key={index}>
                  {paragraph.trim()}
                </p>
              ))}
            </div>
          </blockquote>
        </div>
      )}
      {!profile && !isLoading && (
        <div className="text-center text-gray-500">No profile information available.</div>
      )}
    </div>
  );

  const AwardsTab = () => {
    // Group awards by title
    const groupedAwards = awards.reduce((acc, award) => {
      if (!acc[award.title]) {
        acc[award.title] = [];
      }
      acc[award.title].push(award);
      return acc;
    }, {} as Record<string, Award[]>);

    return (
      <div className="space-y-8">
        <h3 className="text-2xl font-semibold mb-4">Awards & Recognition</h3>
        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold"></div>
          </div>
        ) : awards.length > 0 ? (
          Object.entries(groupedAwards).map(([title, awardsList], groupIndex) => (
            <div key={groupIndex} className="border-b border-gray-200 pb-6 mb-6 last:border-0">
              <h4 className="text-xl font-medium text-charcoal mb-4">{title}</h4>
              <div className="space-y-4 pl-4">
                {awardsList.map(award => (
                  <div key={award.id} className="border-l-2 border-gray-200 pl-4 py-1">
                    <div className="flex justify-between items-start">
                      {award.year && <span className="text-gray-600 font-medium">{award.year}</span>}
                    </div>
                    {award.organization && <p className="text-gold font-medium mt-1">{award.organization}</p>}
                    {award.description && <p className="text-gray-700 mt-2">{award.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500">No awards information available.</div>
        )}
      </div>
    );
  };

  const CollectorsTab = () => (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold mb-4">Collectors</h3>
      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold"></div>
        </div>
      ) : collectors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {collectors.map(collector => (
            <div key={collector.id} className="bg-gray-50 p-5 rounded-lg shadow-sm">
              <h4 className="text-xl font-medium text-charcoal">{collector.name}</h4>
              <p className="text-gold capitalize mt-1">{collector.type}</p>
              {collector.notes && (
                <p className="text-gray-700 mt-2">{collector.notes}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500">No collectors information available.</div>
      )}
    </div>
  );

  const HighlightsTab = () => (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold mb-4">Career Highlights</h3>
      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold"></div>
        </div>
      ) : highlights.length > 0 ? (
        highlights.map(highlight => (
          <div key={highlight.id} className="border-b border-gray-200 pb-5 mb-5 last:border-0">
            <div className="flex justify-between items-start flex-wrap">
              <h4 className="text-xl font-medium text-charcoal">{highlight.title}</h4>
              {highlight.start_date && (
                <span className="text-gray-600 text-sm">
                  {new Date(highlight.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })} - {
                    highlight.end_date ? new Date(highlight.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'Present'
                  }
                </span>
              )}
            </div>
            {(highlight.organization || highlight.role) && (
              <p className="text-gold font-medium mt-1">
                {highlight.organization}{highlight.organization && highlight.role ? ' • ' : ''}{highlight.role}
              </p>
            )}
            {(highlight.city || highlight.state || highlight.country) && (
              <p className="text-gray-600 text-sm mt-1">
                {[highlight.city, highlight.state, highlight.country].filter(Boolean).join(', ')}
              </p>
            )}
            {highlight.description && <p className="text-gray-700 mt-2">{highlight.description}</p>}
          </div>
        ))
      ) : (
        <div className="text-center text-gray-500">No career highlights available.</div>
      )}
    </div>
  );

  const SpeakingTab = () => (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold mb-4">Public Speaking</h3>
      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold"></div>
        </div>
      ) : speaking.length > 0 ? (
        speaking.map(item => (
          <div key={item.id} className="border-b border-gray-200 pb-4 mb-4 last:border-0">
            <div className="flex justify-between items-start">
              <h4 className="text-xl font-medium text-charcoal">{item.event_name}</h4>
              {item.year && <span className="text-gray-600">{item.year}</span>}
            </div>
            {item.location && <p className="text-gold font-medium mt-1">{item.location}</p>}
            {item.description && <p className="text-gray-700 mt-2">{item.description}</p>}
          </div>
        ))
      ) : (
        <div className="text-center text-gray-500">No public speaking information available.</div>
      )}
    </div>
  );

  const PublicationsTab = () => (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold mb-4">Publications</h3>
      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold"></div>
        </div>
      ) : publications.length > 0 ? (
        publications.map(pub => (
          <div key={pub.id} className="border-b border-gray-200 pb-4 mb-4 last:border-0">
            <div className="flex justify-between items-start">
              <h4 className="text-xl font-medium text-charcoal">{pub.title}</h4>
              {pub.year && <span className="text-gray-600">{pub.year}</span>}
            </div>
            {pub.publisher && <p className="text-gold font-medium mt-1">{pub.publisher}</p>}
            {pub.url && (
              <a 
                href={pub.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:underline mt-2 block"
              >
                View Publication
              </a>
            )}
          </div>
        ))
      ) : (
        <div className="text-center text-gray-500">No publications information available.</div>
      )}
    </div>
  );

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab />;
      case 'awards':
        return <AwardsTab />;
      case 'collectors':
        return <CollectorsTab />;
      case 'highlights':
        return <HighlightsTab />;
      case 'speaking':
        return <SpeakingTab />;
      case 'publications':
        return <PublicationsTab />;
      default:
        return <ProfileTab />;
    }
  };

  return (
    <div className="bg-white">
      <SEO 
        title="Mark Venaglia | Resume"
        description="Professional resume of Mark Venaglia, artist and cultural curator, featuring career highlights, awards, publications and more."
        url="https://markvenaglia.com/resume"
        type="profile"
      />

      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-20">
        {/* Resume Header */}
        <div className="mb-10 border-b border-gray-200 pb-5">
          <h1 className="text-4xl font-bold text-charcoal">Mark Venaglia</h1>
          <p className="text-xl text-gold mt-2">Artist & Cultural Curator</p>
        </div>

        {/* Main content with sidebar layout */}
        <div className="flex flex-col md:flex-row md:space-x-8">
          {/* Tab Navigation - Vertical on left */}
          <div className="w-full md:w-64 mb-8 md:mb-0 flex-shrink-0">
            <nav className="sticky top-8 pr-4 md:pr-8 space-y-2">
              <button
                onClick={() => handleTabChange('profile')}
                className={`w-full text-left py-3 px-4 rounded-l-md font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-gold/10 text-gold border-r-2 border-gold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => handleTabChange('highlights')}
                className={`w-full text-left py-3 px-4 rounded-l-md font-medium transition-colors ${
                  activeTab === 'highlights'
                    ? 'bg-gold/10 text-gold border-r-2 border-gold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Highlights
              </button>
              <button
                onClick={() => handleTabChange('awards')}
                className={`w-full text-left py-3 px-4 rounded-l-md font-medium transition-colors ${
                  activeTab === 'awards'
                    ? 'bg-gold/10 text-gold border-r-2 border-gold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Awards
              </button>
              <button
                onClick={() => handleTabChange('publications')}
                className={`w-full text-left py-3 px-4 rounded-l-md font-medium transition-colors ${
                  activeTab === 'publications'
                    ? 'bg-gold/10 text-gold border-r-2 border-gold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Publications
              </button>
              <button
                onClick={() => handleTabChange('speaking')}
                className={`w-full text-left py-3 px-4 rounded-l-md font-medium transition-colors ${
                  activeTab === 'speaking'
                    ? 'bg-gold/10 text-gold border-r-2 border-gold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Speaking
              </button>
              <button
                onClick={() => handleTabChange('collectors')}
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

          {/* Tab Content */}
          <div className="flex-1 py-4">
            {isLoading && activeTab === 'profile' ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
              </div>
            ) : (
              renderTabContent()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resume;
