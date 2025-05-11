import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Tours = lazy(() => import('./pages/Tours'));
const CorporateSolutions = lazy(() => import('./pages/CorporateSolutions'));
const Contact = lazy(() => import('./pages/Contact'));
const CommissionDetail = lazy(() => import('./pages/CommissionDetail'));
const Resume = lazy(() => import('./pages/Resume'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
  </div>
);

function App() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isAdminPage = location.pathname === '/markspage';
  const isNotFoundPage = location.pathname === '/404';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {!isAdminPage && !isNotFoundPage && <Navbar />}
      <main className="flex-grow">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/portfolio/:id" element={<CommissionDetail />} />
            <Route path="/tours" element={<Tours />} />
            <Route path="/corporate-solutions" element={<CorporateSolutions />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/resume" element={<Resume />} />
            <Route path="/markspage" element={<AdminPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!isHomePage && !isAdminPage && !isNotFoundPage && <Footer />}
    </div>
  );
}

export default App;