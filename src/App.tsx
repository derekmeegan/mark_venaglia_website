import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Portfolio from './pages/Portfolio';
import Tours from './pages/Tours';
import CorporateSolutions from './pages/CorporateSolutions';
import Exhibitions from './pages/Exhibitions';
import Contact from './pages/Contact';
import CommissionDetail from './pages/CommissionDetail';
import AdminPage from './pages/AdminPage';
import Footer from './components/Footer';

function App() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isAdminPage = location.pathname === '/markspage';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {!isAdminPage && <Navbar />}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/portfolio/:id" element={<CommissionDetail />} />
          <Route path="/tours" element={<Tours />} />
          <Route path="/corporate-solutions" element={<CorporateSolutions />} />
          <Route path="/exhibitions" element={<Exhibitions />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/markspage" element={<AdminPage />} />
        </Routes>
      </main>
      {!isHomePage && !isAdminPage && <Footer />}
    </div>
  );
}

export default App;