import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import ReviewCarousel from '../components/ReviewCarousel';
import { getCalApi } from "@calcom/embed-react";

interface Tour {
  id: string;
  title: string;
  duration: string;
  price: string;
  image: string;
  url: string | null;
}

const Tours = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNamespace, setSelectedNamespace] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
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
        setError('Failed to load tours. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTours();
  }, []);

  useEffect(() => {
    if (selectedNamespace) {
      (async function () {
        const cal = await getCalApi({ namespace: selectedNamespace });
        cal("ui", {
          styles: { 
            branding: { brandColor: "#f4b305" }
          },
          hideEventTypeDetails: false,
          layout: "month_view"
        });
      })();
    }
  }, [selectedNamespace]);

  const handleBooking = (url: string | null) => {
    if (!url) {
      navigate('/contact');
      return;
    }

    // Parse the Cal.com URL to get the namespace and link
    const match = url.match(/cal\.com\/(.+?)$/);
    if (!match) {
      navigate('/contact');
      return;
    }

    const calLink = match[1];
    const namespace = calLink.split('/')[1]; // Get the second part after the slash
    setSelectedNamespace(namespace);
  };

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Desktop Layout - Experience and Highlights */}
        <div className="hidden lg:grid grid-cols-2 gap-12 mb-16">
          {/* Left Column - Stacked Content */}
          <div className="space-y-8">
            {/* Exclusive Art Experiences Section */}
            <div>
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4">Exclusive Art Experiences</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Each tour is a carefully crafted journey through New York's rich cultural landscape, combining my decades of experience as both an artist and cultural curator. Whether you're interested in contemporary art, historical landmarks, or the city's hidden artistic gems, I'll create a personalized experience that matches your interests.
              </p>
            </div>

            {/* Tour Highlights Section */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Tour Highlights</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <ArrowRight className="h-6 w-6 text-gold mr-2 flex-shrink-0" />
                  <span>Private guided tours of major museums (The Met, MoMA, Guggenheim)</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="h-6 w-6 text-gold mr-2 flex-shrink-0" />
                  <span>Behind-the-scenes access to galleries and artist studios</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="h-6 w-6 text-gold mr-2 flex-shrink-0" />
                  <span>Customized art district explorations</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="h-6 w-6 text-gold mr-2 flex-shrink-0" />
                  <span>Optional wine tastings and interactive art experiences</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="relative h-[475px] rounded-lg overflow-hidden shadow-lg">
            <img
              src="https://dvytdwbpqaupkodiuyom.supabase.co/storage/v1/object/public/mark_images/ui/mark_tour_pic.png"
              alt="Art Gallery Experience"
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
          </div>
        </div>

        {/* Mobile Layout - Only Experiences Section */}
        <div className="lg:hidden mb-12">
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4">Exclusive Art Experiences</h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            Each tour is a carefully crafted journey through New York's rich cultural landscape, combining my decades of experience as both an artist and cultural curator. Whether you're interested in contemporary art, historical landmarks, or the city's hidden artistic gems, I'll create a personalized experience that matches your interests.
          </p>
        </div>
        {/* Tours Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 mb-12">
          {isLoading ? (
            // Loading skeletons
            [...Array(4)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-gray-200" />
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-10 bg-gray-200 rounded" />
                </div>
              </div>
            ))
          ) : error ? (
            <div className="col-span-full text-center py-8">
              <p className="text-red-500">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-gold hover:bg-gold/90"
              >
                Try Again
              </button>
            </div>
          ) : tours.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">No tours available at the moment.</p>
            </div>
          ) : (
            tours.map((tour) => (
              <div key={tour.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                <img
                  src={tour.image}
                  alt={tour.title}
                  className="w-full h-36 object-cover"
                />
                <div className="p-4 pt-2 flex flex-col flex-1">
                  <h4 className="text-lg font-semibold mb-1">{tour.title}</h4>
                  <p className="text-gray-600 text-sm mb-3">{tour.duration}</p>
                  <div className="mt-auto">
                    {tour.url ? (
                      <button
                        data-cal-namespace={tour.url.split('/')[4]}
                        data-cal-link={tour.url.split('cal.com/')[1]}
                        data-cal-config='{"layout":"month_view"}'
                        onClick={() => handleBooking(tour.url)}
                        className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm rounded-md text-white bg-gold hover:bg-gold/90 font-bold"
                      >
                        Book
                        <ArrowRight className="ml-1 h-4 w-4 stroke-[3]" />
                      </button>
                    ) : (
                      <Link
                        to="/contact"
                        className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm rounded-md text-white bg-gold hover:bg-gold/90 font-bold"
                      >
                        Contact
                        <ArrowRight className="ml-1 h-4 w-4 stroke-[3]" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Reviews Section */}
        <div className="border-t border-gray-200 pt-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">Reflections From Mark's Tours</h2>
          </div>

          {/* Review Carousel */}
          <ReviewCarousel />

          {/* Call to Action */}
          <div className="text-center mt-12">
            <Link
              to="/contact"
              className="inline-flex items-center px-8 py-3 border border-transparent text-lg font-medium rounded-full text-white bg-gold hover:bg-gold/90 transition-colors"
            >
              Book A Custom Tour
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tours;