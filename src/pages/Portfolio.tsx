import{ useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import SEO from '../components/SEO';

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

interface PortfolioItem {
  id: string;
  title: string;
  year: string;
  category: string;
  description: string;
  image: string;
  tags?: string[];
}

const Portfolio = () => {
  const [activeCategory, setActiveCategory] = useState<'commission' | 'inventory'>('inventory');
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Helper function to ensure tags are always an array
  const ensureTagsArray = (tags: any): string[] => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    try {
      // If tags is a JSON string, parse it
      const parsedTags = JSON.parse(tags);
      return Array.isArray(parsedTags) ? parsedTags : [];
    } catch (e) {
      // If parsing fails, return empty array
      return [];
    }
  };

  useEffect(() => {
    fetchPortfolioItems();
  }, [activeCategory, selectedTags]);

  const fetchPortfolioItems = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        .eq('category', activeCategory)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter out items with null or empty images
      let filteredData = data?.filter(item => item.image && item.image.trim() !== '') || [];
      
      // Extract all unique tags for the filter UI
      const tagSet = new Set<string>();
      filteredData.forEach(item => {
        const itemTags = ensureTagsArray(item.tags);
        itemTags.forEach(tag => tagSet.add(tag));
      });
      setAllTags(Array.from(tagSet).sort());
      
      // Apply tag filtering if any tags are selected
      if (selectedTags.length > 0) {
        filteredData = filteredData.filter(item => {
          const itemTags = ensureTagsArray(item.tags);
          return selectedTags.some(tag => itemTags.includes(tag));
        });
      }
      
      setPortfolioItems(filteredData);
    } catch (err) {
      console.error('Error fetching portfolio items:', err);
      setError('Failed to load portfolio items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const clearTagFilters = () => {
    setSelectedTags([]);
  };

  return (
    <div className="bg-white">
      <SEO 
        title="Portfolio | Mark Venaglia"
        description="Explore Mark Venaglia's portfolio of commissioned and inventory artwork. View his unique artistic style and creative vision."
        url="https://markvenaglia.com/portfolio"
        type="website"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Tabs */}
        <div className="grid grid-cols-2 border-b border-gray-200 mb-6">
        <button
            onClick={() => setActiveCategory('inventory')}
            className={`relative pb-2 text-lg font-medium transition-colors ${
              activeCategory === 'inventory' 
                ? 'text-gold' 
                : 'text-gray-500 hover:text-gold'
            }`}
          >
            <span className="block text-center">Available Inventory</span>
            <span 
              className={`absolute bottom-0 left-0 w-full h-0.5 transition-colors ${
                activeCategory === 'inventory' ? 'bg-gold' : 'bg-transparent'
              }`}
            />
          </button>
          <button
            onClick={() => setActiveCategory('commission')}
            className={`relative pb-2 text-lg font-medium transition-colors ${
              activeCategory === 'commission' 
                ? 'text-gold' 
                : 'text-gray-500 hover:text-gold'
            }`}
          >
            <span className="block text-center">Commissions</span>
            <span 
              className={`absolute bottom-0 left-0 w-full h-0.5 transition-colors ${
                activeCategory === 'commission' ? 'bg-gold' : 'bg-transparent'
              }`}
            />
          </button>
        </div>
        
        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-700">Filter by tags:</span>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-gold text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button
                  onClick={clearTagFilters}
                  className="px-3 py-1 rounded-full text-sm font-medium text-red-400 hover:text-red-800 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Portfolio Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="animate-pulse">
                <div className="bg-gray-200 h-96 rounded-lg mb-4" />
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchPortfolioItems}
              className="px-4 py-2 bg-gold text-white rounded-md hover:bg-gold/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : portfolioItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No {activeCategory} items available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {portfolioItems.map((work) => (
              <Link
                key={work.id}
                to={`/portfolio/${work.id}`}
                className="group relative overflow-hidden rounded-lg shadow-lg cursor-pointer"
              >
                <img
                  src={work.image}
                  alt={work.title}
                  className="w-full h-96 object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                <div 
                  className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent opacity-0 group-hover:opacity-95 transition-all duration-300"
                  style={{
                    background: `linear-gradient(to top, 
                      rgba(0,0,0,0.95) 0%,
                      rgba(0,0,0,0.8) 30%,
                      rgba(0,0,0,0.4) 60%,
                      rgba(0,0,0,0) 100%)`
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  <p className="text-sm text-gold mb-2">{toTitleCase(work.category)} • {work.year}</p>
                  <h3 className="text-xl font-medium text-cream mb-2">{work.title}</h3>
                  <p className="text-cream/90 line-clamp-3 text-sm leading-relaxed">{work.description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;