import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  canonicalUrl?: string;
  type?: string;
  schemaData?: Record<string, any>;
}

const SEO: React.FC<SEOProps> = ({
  title = 'Mark Venaglia | Artist & Cultural Curator',
  description = 'Explore New York\'s art scene with renowned artist and cultural curator offering exclusive art tours and exhibitions.',
  image = 'https://images.unsplash.com/photo-1432937202807-b918d6a647ef?fm=jpg&q=80&w=1200&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  url = 'https://markvenaglia.com',
  canonicalUrl,
  type = 'website',
  schemaData
}) => {
  // Prepare JSON-LD schema data
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Mark Venaglia',
    url: 'https://markvenaglia.com',
    sameAs: [
      // Add social media profiles if available
    ],
    jobTitle: 'Artist & Cultural Curator',
    description: description
  };

  const schema = schemaData || baseSchema;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="image" content={image} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Schema */}
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

export default SEO;
