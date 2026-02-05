import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { logger } from '@/utils/logger';

export const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    logger.error('Page not found - redirecting to home', new Error(`404 - ${window.location.pathname}`));
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-4">Oops! Page not found</p>
        <Link to="/" className="text-primary hover:text-primary/80 underline">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
