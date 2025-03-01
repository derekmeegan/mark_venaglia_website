import React, { useEffect } from 'react';

const TripadvisorWidget: React.FC = () => {
  useEffect(() => {
    // Avoid adding the script more than once.
    if (!document.getElementById('tripadvisor-script')) {
      const script = document.createElement('script');
      script.id = 'tripadvisor-script';
      script.src =
        'https://www.jscache.com/wejs?wtype=reviews&uniq=123&locationId=YOUR_LOCATION_ID&lang=en_US&border=true';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div>
      {/* Container div as specified by TripAdvisor's widget code */}
      <div id="TA_reviews123" className="TA_reviews"></div>
    </div>
  );
};

export default TripadvisorWidget;
