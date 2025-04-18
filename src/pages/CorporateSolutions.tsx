import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Building2, Gem } from 'lucide-react';
import SEO from '../components/SEO';
import ImageOptimizer from '../components/ImageOptimizer';

const nonprofit_organizations = [
  'Legal Services New York City',
  "St. Luke's in the Field, Teen Shelter Vulnerability",
  'CallenLorde Community Health Center',
  'Coalition for Rainforest Nations, NYC Headquarters',
  'Junior League of New York City',
  'Junior League of Los Angeles',
  'The J. Paul Getty Community Interface Foundation',
  'The Joyful Child Foundation',
  'Friends of the River Foundation',
  'Outward Bound Adventures',
  'Human Rights Campaign',
  'Gay and Lesbian Alliance Against Defamation',
  'Los Angeles LGBT Cultural Center',
  'Los Angeles Museum of Art',
  'All Saints Church',
  "Children's Museum of Los Angeles"
];

const corporate_organizations = [
  "JP Morgan Chase",
  "Morgan Stanley Wealth Management",
  "Mastercard, Inc.",
  "Jane Street Capital",
  "Andrew W. Mellon Foundation",
  "Citi Global",
  "Grant Thornton",
  "BNY Mellon",
  "Dreyfus",
  "Pennsylvania Financial Group",
  "Greenstone",
  "Alpharma",
  "Novartis"
];

const CorporateSolutions = () => {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [animationPaused, setAnimationPaused] = useState(false);

  useEffect(() => {
    const marquee = marqueeRef.current;
    if (!marquee) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = marquee;
      if (scrollLeft === 0) {
        // When we reach the start, jump to the middle set
        marquee.scrollLeft = scrollWidth / 2;
      } else if (scrollLeft + clientWidth >= scrollWidth) {
        // When we reach the end, jump to the first set
        marquee.scrollLeft = 0;
      }
    };

    marquee.addEventListener('scroll', handleScroll);
    return () => marquee.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - marqueeRef.current!.offsetLeft);
    setScrollLeft(marqueeRef.current!.scrollLeft);
    setAnimationPaused(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setAnimationPaused(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - marqueeRef.current!.offsetLeft;
    const walk = (x - startX) * 2;
    marqueeRef.current!.scrollLeft = scrollLeft - walk;
  };

  return (
    <div className="bg-white">
      <SEO 
        title="Corporate Solutions | Mark Venaglia"
        description="Discover how Mark Venaglia's artistic expertise can enhance your corporate environment through custom art installations, team-building workshops, and cultural experiences."
        url="https://markvenaglia.com/corporate-solutions"
        type="website"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Corporate Tours Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-charcoal">Corporate Tours</h2>
            <div className="prose prose-lg text-gray-600">
              <p>
                Transform team building and client entertainment with exclusive, curator-led art experiences. Our corporate tours offer unique perspectives on creativity, innovation, and cultural leadership.
              </p>
              <ul className="space-y-4 list-none pl-0 mt-6">
                <li className="flex items-start">
                  <Users className="h-6 w-6 text-gold mr-3 flex-shrink-0" />
                  <span>Customized team-building experiences through art exploration</span>
                </li>
                <li className="flex items-start mt-2">
                  <Building2 className="h-6 w-6 text-gold mr-3 flex-shrink-0" />
                  <span>Rich architectural and art tours highlighting New York’s cultural landmarks</span>
                </li>
                <li className="flex items-start mt-2">
                  <Gem className="h-6 w-6 text-gold mr-3 flex-shrink-0" />
                  <span>Expert insights into art market trends and collecting</span>
                </li>
              </ul>
            </div>
            <div className="pt-6">
              <Link
                to="https://cal.com/mark-venaglia/corporate-consultation"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-gold hover:bg-gold/90 transition-colors"
              >
                Schedule a Consultation
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
          <div className="relative h-[500px] rounded-lg overflow-hidden shadow-lg">
            <img
              src="https://dvytdwbpqaupkodiuyom.supabase.co/storage/v1/object/public/mark_images/ui/11tour29.jpg"
              alt="Corporate art tour"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>
        {/* Corporate Organizations Ticker Section */}
        <div className="mt-12 bg-gray-50 py-16 px-4 rounded-lg">
        <div className="max-w-4xl mx-auto text-center mb-8">
          <h3 className="text-2xl font-bold text-charcoal mb-4">
            Reward Your Teams with Unforgettable Cultural Experiences
          </h3>
          <p className="text-lg text-gray-600">
            Mr. Venaglia crafts exclusive cultural programs designed to inspire and reward top talent and senior leadership—enhancing connection, recognition, and retention across organizations such as:
          </p>
        </div>

          {/* Ticker Container */}
          <div 
            ref={marqueeRef}
            className={`relative overflow-x-scroll hide-scrollbar select-none cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
          >
            <div 
              className={`inline-flex whitespace-nowrap transition-transform ${
                !animationPaused ? 'animate-marquee' : ''
              }`}
            >
              {/* Three sets of organizations for seamless looping */}
              {[...corporate_organizations, ...corporate_organizations, ...corporate_organizations].map((org, index) => (
                <div
                  key={index}
                  className="mx-4 py-2 inline-block"
                >
                  <span className="text-lg font-medium text-charcoal/80 transition-colors">
                    {org}
                  </span>
                  <span className="mx-8 text-gold">•</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Donor Cultivation Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-20">
          <div className="order-2 lg:order-1 relative h-[500px] rounded-lg overflow-hidden shadow-lg">
            <img
              src="https://dvytdwbpqaupkodiuyom.supabase.co/storage/v1/object/public/mark_images/ui/BCG_HighRez%20Tour.jpg"
              alt="Donor cultivation event"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          <div className="order-1 lg:order-2 space-y-6">
            <h2 className="text-3xl font-bold text-charcoal">Donor Cultivation</h2>
            <div className="prose prose-lg text-gray-600">
              <p>
                Deepen donor relationships and fuel institutional growth with exclusive art experiences led solely by Mr. Venaglia, aka Manhattan Mark. This proven approach significantly increases donations, as experienced by Manhattan organizations.
                <br /> <br />
                Move beyond traditional fundraising. References and financial testimonies available upon request.
              </p>
              <ul className="space-y-4 list-none pl-0 mt-6">
                <li className="flex items-start">
                  <Users className="h-6 w-6 text-gold mr-3 flex-shrink-0" />
                  <span>Specially curated corporate art experiences</span>
                </li>
                <li className="flex items-start mt-2">
                  <Building2 className="h-6 w-6 text-gold mr-3 flex-shrink-0" />
                  <span>Intimate gatherings with artists and curators</span>
                </li>
                <li className="flex items-start mt-2">
                  <Gem className="h-6 w-6 text-gold mr-3 flex-shrink-0" />
                  <span>Personalized art acquisition guidance</span>
                </li>
              </ul>
            </div>
            <div className="pt-6">
              <Link
                to="https://cal.com/mark-venaglia/corporate-consultation"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-gold hover:bg-gold/90 transition-colors"
              >
                Schedule a Consultation
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Nonprofit Organizations Ticker Section */}
        <div className="mt-12 bg-gray-50 py-16 px-4 rounded-lg">
          <div className="max-w-4xl mx-auto text-center mb-8">
            <h3 className="text-2xl font-bold text-charcoal mb-4">
              Proven Impact Through Cultural Events
            </h3>
            <p className="text-lg text-gray-600">
              Through personalized cultural events, exclusively conceptualized and delivered for donors and major benefactors, Mr. Venaglia has effectively increased donations and funding for the following:
            </p>
          </div>

          {/* Ticker Container */}
          <div 
            ref={marqueeRef}
            className={`relative overflow-x-scroll hide-scrollbar select-none cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
          >
            <div 
              className={`inline-flex whitespace-nowrap transition-transform ${
                !animationPaused ? 'animate-marquee' : ''
              }`}
            >
              {/* Three sets of organizations for seamless looping */}
              {[...nonprofit_organizations, ...nonprofit_organizations, ...nonprofit_organizations].map((org, index) => (
                <div
                  key={index}
                  className="mx-4 py-2 inline-block"
                >
                  <span className="text-lg font-medium text-charcoal/80 transition-colors">
                    {org}
                  </span>
                  <span className="mx-8 text-gold">•</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorporateSolutions;