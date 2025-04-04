import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';
import ImageOptimizer from '../components/ImageOptimizer';

interface TimelineItem {
  id: string;
  title: string;
  date: string;
  description: string;
  image: string;
  order: number;
}

interface PortfolioItem {
  id: string;
  title: string;
  year: string;
  category: string;
  description: string;
  image: string;
}

const timelineColors = [
  'bg-blue/10',
  'bg-gold/10',
  'bg-navy/10',
  'bg-indigo-100',
];

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

const CommissionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [portfolioItem, setPortfolioItem] = useState<PortfolioItem | null>(null);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchPortfolioData();
    }
  }, [id]);

  const fetchPortfolioData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch portfolio item
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolio')
        .select('*')
        .eq('id', id)
        .single();

      if (portfolioError) throw portfolioError;
      if (!portfolioData) throw new Error('Portfolio item not found');

      setPortfolioItem(portfolioData);

      // Fetch timeline items
      const { data: timelineData, error: timelineError } = await supabase
        .from('portfolio_timeline')
        .select('*')
        .eq('portfolio_id', id)
        .order('order', { ascending: true });

      if (timelineError) throw timelineError;
      setTimelineItems(timelineData || []);

    } catch (err) {
      console.error('Error fetching portfolio data:', err);
      setError('Failed to load portfolio details');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse space-y-8 w-full max-w-7xl px-4">
          <div className="h-96 bg-gray-200 rounded-lg" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !portfolioItem) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl  text-navy mb-4">
            {error || 'Portfolio item not found'}
          </h1>
          <Link 
            to="/portfolio" 
            className="inline-flex items-center text-navy hover:text-navy/80"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Return to Portfolio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {portfolioItem && (
        <SEO 
          title={`${portfolioItem.title} | Mark Venaglia`}
          description={portfolioItem.description || `View details about ${portfolioItem.title}, a ${portfolioItem.category} artwork by Mark Venaglia created in ${portfolioItem.year}.`}
          image={portfolioItem.image}
          url={`https://markvenaglia.com/portfolio/${id}`}
          type="article"
        />
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl font-bold text-navy mb-4">
              {portfolioItem.title}
            </h1>
            <div className="flex items-center gap-4 mb-6">
              <p className="text-navy/80">{portfolioItem.year}</p>
              <span className="text-gold">•</span>
              <p className="text-navy/80">{toTitleCase(portfolioItem.category)}</p>
            </div>
            <p className="text-lg text-charcoal/90">
              {portfolioItem.description}
            </p>
          </div>
          <div>
            <img
              src={portfolioItem.image}
              alt={portfolioItem.title}
              className="w-full h-auto object-cover rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      {timelineItems.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="relative">
            {/* The line now stops at the last timeline item */}
            <div 
              className="absolute left-1/2 transform -translate-x-1/2 w-0.5 bg-gold/30 hidden sm:block"
              style={{
                top: '24px',
                height: `calc(100% - ${48 + (timelineItems.length - 1) * 96}px)`
              }}
            />
            <div className="space-y-24">
              {timelineItems.map((stage, index) => (
                <div key={stage.id} className="relative">
                  <div className="absolute left-1/2 transform -translate-x-1/2 -mt-2">
                    <div className="w-4 h-4 rounded-full bg-gold border-4 border-white hidden sm:block" />
                  </div>
                  <div
                    className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${
                      index % 2 === 0 ? 'md:grid-flow-dense' : ''
                    }`}
                  >
                    <div className={`${index % 2 === 0 ? 'md:col-start-2' : ''}`}>
                      <div className="aspect-[4/3] rounded-lg shadow-lg overflow-hidden">
                        <img
                          src={stage.image}
                          alt={stage.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col justify-center">
                      <div className={`${timelineColors[index % timelineColors.length]} rounded-lg shadow-md p-8`}>
                        <span className="text-sm font-medium text-gold px-3 py-1 bg-gold/10 rounded-full inline-block mb-4">
                          {stage.date}
                        </span>
                        <h3 className="text-2xl font-bold text-navy mb-4">
                          {stage.title}
                        </h3>
                        <p className="text-lg text-charcoal/90 leading-relaxed">
                          {stage.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionDetail;