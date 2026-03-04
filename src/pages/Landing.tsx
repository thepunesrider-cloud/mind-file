import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to a static landing page or dashboard
    // For now, redirect to dashboard since landing.html is a static file
    const timer = setTimeout(() => {
      // The landing page is served as a static file
      // We can navigate using window.location for static HTML
      window.location.href = '/landing.html';
    }, 100);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
        <p className="text-white text-lg">Loading Sortify...</p>
      </div>
    </div>
  );
};

export default Landing;

