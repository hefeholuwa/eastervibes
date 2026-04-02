import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[100svh] bg-surface flex flex-col items-center justify-center px-4 font-body">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mx-auto mb-8">
          <Sparkles className="w-10 h-10" />
        </div>
        <h1 className="font-headline text-5xl sm:text-6xl font-bold text-on-surface mb-4">
          404
        </h1>
        <p className="text-lg text-on-surface-variant mb-8 sm:mb-10">
          This page doesn't exist — but your next vibe board could.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="bg-primary text-on-primary px-8 py-4 rounded-full font-bold text-base hover:bg-primary-dim transition-colors shadow-md"
          >
            Back to Home
          </Link>
          <Link
            to="/create"
            className="bg-surface-container-high text-on-surface px-8 py-4 rounded-full font-bold text-base hover:bg-surface-variant transition-colors"
          >
            Create a Board
          </Link>
        </div>
      </div>
    </div>
  );
}
