import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center max-w-lg">
        {/* Big 404 */}
        <h1 className="text-8xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-foreground mb-3">
          Page not found
        </h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          The page <code className="bg-muted px-2 py-0.5 rounded text-sm">{location.pathname}</code> doesn't exist or has been moved. Let's get you back on track.
        </p>

        {/* Navigation options */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <Button asChild variant="default" size="lg">
            <Link to="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/files">
              <FileText className="mr-2 h-4 w-4" />
              My Files
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/search">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Link>
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="text-muted-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go back
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
