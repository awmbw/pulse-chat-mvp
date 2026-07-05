import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-7xl text-foreground">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          That conversation doesn't exist — or it's been quietly encrypted away.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Back to Pulse</Link>
        </Button>
      </div>
    </div>
  );
}
