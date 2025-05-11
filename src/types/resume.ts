// Tab types based on database tables
export type TabType = 'profile' | 'awards' | 'collectors' | 'highlights' | 'speaking' | 'publications';

// Types for database data
export type ArtistProfile = {
  id: string;
  bio: string | null;
  artist_statement: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Award = {
  id: string;
  title: string;
  year: number | null;
  organization: string | null;
  description: string | null;
  created_at: string | null;
};

export type Collector = {
  id: string;
  name: string;
  type: string;
  notes: string | null;
  created_at: string | null;
};

export type Highlight = {
  id: string;
  title: string;
  organization: string | null;
  role: string | null;
  description: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
};

export type Speaking = {
  id: string;
  event_name: string;
  location: string | null;
  year: number | null;
  description: string | null;
  created_at: string | null;
};

export type Publication = {
  id: string;
  title: string;
  publisher: string | null;
  year: number | null;
  url: string | null;
  created_at: string | null;
};
