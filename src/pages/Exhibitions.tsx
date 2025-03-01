import React from 'react';

const Exhibitions = () => {
  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-8">Exhibitions & Press</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">Current & Upcoming Exhibitions</h2>
            <div className="space-y-8">
              {[
                {
                  title: "Urban Perspectives",
                  date: "March 15 - April 30, 2024",
                  venue: "Metropolitan Gallery, New York",
                  image: "https://images.unsplash.com/photo-1577083552431-6e5fd75a9160?auto=format&fit=crop&q=80"
                },
                {
                  title: "City Dreams",
                  date: "May 10 - June 20, 2024",
                  venue: "Contemporary Arts Center, Manhattan",
                  image: "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?auto=format&fit=crop&q=80"
                }
              ].map((exhibition, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-6">
                  <img
                    src={exhibition.image}
                    alt={exhibition.title}
                    className="w-full md:w-64 h-48 object-cover rounded-lg shadow-md"
                  />
                  <div>
                    <h3 className="text-xl font-medium text-gray-900">{exhibition.title}</h3>
                    <p className="text-indigo-600 font-medium">{exhibition.date}</p>
                    <p className="text-gray-600">{exhibition.venue}</p>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-serif font-bold text-gray-900 mt-12 mb-6">Past Exhibitions</h2>
            <div className="space-y-4">
              {[
                {
                  year: "2023",
                  title: "Manhattan Nights",
                  venue: "New York Art Gallery"
                },
                {
                  year: "2023",
                  title: "Urban Life",
                  venue: "Modern Art Museum"
                },
                {
                  year: "2022",
                  title: "City Perspectives",
                  venue: "Downtown Gallery"
                }
              ].map((exhibition, index) => (
                <div key={index} className="border-b border-gray-200 pb-4">
                  <p className="text-gray-500">{exhibition.year}</p>
                  <h3 className="text-lg font-medium text-gray-900">{exhibition.title}</h3>
                  <p className="text-gray-600">{exhibition.venue}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">Press & Media</h2>
            <div className="space-y-6">
              {[
                {
                  source: "Art Weekly",
                  title: "Mark Venaglia: Redefining Urban Art",
                  date: "February 2024"
                },
                {
                  source: "NYC Culture",
                  title: "The Artist Behind Manhattan's Most Sought-After Tours",
                  date: "January 2024"
                },
                {
                  source: "Gallery Magazine",
                  title: "Urban Perspectives: A New Exhibition",
                  date: "December 2023"
                }
              ].map((press, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">{press.date}</p>
                  <h3 className="text-lg font-medium text-gray-900">{press.title}</h3>
                  <p className="text-indigo-600">{press.source}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Exhibitions;