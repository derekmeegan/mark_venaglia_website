export interface Tour {
  id: string;
  title: string;
  duration: string;
  image: string;
  publish?: boolean;
  address?: string;
  description?: string;
  price?: string;
  event_id?: string;
  slug?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  year: string;
  category: string;
  description: string;
  image: string;
}

export interface NotificationModal {
  show: boolean;
  title: string;
  message: string;
}

export type AdminTab = 'tours' | 'portfolio' | 'resume';

export interface AdminComponentProps {
  showNotification: (title: string, message: string) => void;
}
