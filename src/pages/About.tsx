import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';

const About = () => {
  return (
    <div>
      <SEO 
        title="About Mark Venaglia | Artist & Cultural Curator"
        description="Learn about Mark Venaglia, a renowned artist and cultural curator with over four decades of experience transforming how we experience New York City's art scene."
        image="/mark_meet_me.webp"
        url="https://markvenaglia.com/about"
        type="website"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto">
          
          <div className="float-right ml-8 mb-4 w-80">
            <picture>
              <img
                src="/mark_meet_me.webp"
                alt="Mark Venaglia giving a tour at the MET"
                className="w-full h-[600px] object-cover rounded-lg shadow-lg"
              />
            </picture>
          </div>
          <h2 className="text-4xl font-bold text-charcoal mb-8">Meet Mark Venaglia</h2>
          <p className="text-lg text-charcoal leading-relaxed mb-6">
            For over four decades, Mark Venaglia has been transforming the way we see and experience New York City through his unique lens as both an accomplished artist and cultural curator.
          </p>

          <p className="text-lg text-charcoal leading-relaxed mb-6">
            His journey began in 1986, when he first started leading museum tours and onsite art experiences. Since then, he has developed a distinctive approach that combines his artistic vision with an intimate knowledge of Manhattan's cultural landscape.
          </p>

          <p className="text-lg text-charcoal leading-relaxed mb-6">
            Mark's commissioned works can be found in prestigious collections worldwide, each piece reflecting his deep connection to urban environments and their cultural heritage. His artistic process is informed by years of exploring and sharing New York's hidden treasures through his curated tours.
          </p>

          <div className="border-l-4 border-gold pl-6 my-8">
            <p className="text-xl  text-charcoal italic">
              "My art and tours are two expressions of the same passion: revealing the soul of New York City through personal, transformative experiences."
            </p>
          </div>

          <p className="text-lg text-charcoal leading-relaxed mb-6">
            Today, Mark continues to create commissioned artworks while leading exclusive tours for clients ranging from individual art enthusiasts to major cultural institutions. His unique perspective on the city's artistic landscape has made him a sought-after guide for those seeking to discover New York's cultural essence.
          </p>

          <p className="text-lg text-charcoal leading-relaxed mb-6">
            Through his work, Mark strives to capture not just the visual elements of the city, but its spirit and energy. Each piece and every tour is an opportunity to share his deep appreciation for New York's artistic heritage and its continuing evolution as a cultural hub.
          </p>
          <Link
              to="/resume"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-gold hover:bg-gold/90 transition-colors"
            >
              View Mark's Resume
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
        </div>

        {/* Commission Section */}
        <div className="max-w-4xl mx-auto mt-12">
          <div>
            <div className="float-right ml-8 mb-4 w-80">
              <img
                src="/lady.webp"
                alt="Commission Example"
                className="w-full h-[400px] object-cover object-center rounded-lg shadow-lg"
              />
            </div>
            <h2 className="text-3xl font-bold text-charcoal mb-6">Commission Your Vision</h2>
            <p className="text-lg text-charcoal leading-relaxed mb-6">
              Each commissioned piece is a unique collaboration, bringing together your vision with Mark's distinctive artistic perspective. Whether it's capturing the essence of your favorite New York neighborhood or creating a statement piece for your space, Mark's process ensures a deeply personal and meaningful result.
            </p>
            <p className="text-lg text-charcoal leading-relaxed mb-8">
              From initial consultation to final installation, you'll be part of a journey that transforms your ideas into a lasting work of art. Mark's commissioned works often become focal points in private collections, corporate spaces, and public installations.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-gold hover:bg-gold/90 transition-colors"
            >
              Start Your Commission
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;