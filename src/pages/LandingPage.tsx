import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Users, Image as ImageIcon, MessageSquare } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Nav */}
      <header className="flex items-center justify-between p-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <span className="font-headline font-bold text-xl tracking-tight">VibeBoard</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 font-medium text-sm">
          <a href="#features" className="text-on-surface-variant hover:text-primary transition-colors">Features</a>
          <a href="#how-it-works" className="text-on-surface-variant hover:text-primary transition-colors">How it Works</a>
          <a href="#examples" className="text-on-surface-variant hover:text-primary transition-colors">Examples</a>
        </nav>
        <Link 
          to="/create" 
          className="bg-primary text-on-primary px-5 py-2.5 rounded-full font-medium text-sm hover:bg-primary-dim transition-colors shadow-sm"
        >
          Create a Board
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center text-center px-6 pt-20 pb-32 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-variant text-on-surface-variant text-sm font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Now with real-time collaboration
        </div>
        
        <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tight text-on-surface mb-6 leading-tight">
          Your Community's <br className="hidden md:block" />
          <span className="text-primary italic">Shared Voice</span>
        </h1>
        
        <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mb-10 leading-relaxed">
          Create beautiful, interactive boards for events, workshops, and gatherings. 
          Let everyone contribute their thoughts, photos, and vibes in real-time.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link 
            to="/create" 
            className="w-full sm:w-auto bg-primary text-on-primary px-8 py-4 rounded-full font-medium text-lg hover:bg-primary-dim transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            Start a new board <ArrowRight className="w-5 h-5" />
          </Link>
          <Link 
            to="/join/demo" 
            className="w-full sm:w-auto bg-surface-container-high text-on-surface px-8 py-4 rounded-full font-medium text-lg hover:bg-surface-variant transition-colors flex items-center justify-center"
          >
            Try Demo Board
          </Link>
        </div>

        {/* Features Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full max-w-5xl text-left">
          <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/30">
            <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-2xl flex items-center justify-center mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-headline text-2xl font-bold mb-3">Real-time Sync</h3>
            <p className="text-on-surface-variant leading-relaxed">Watch ideas appear instantly as your community adds them. No refreshing needed.</p>
          </div>
          
          <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/30">
            <div className="w-12 h-12 bg-tertiary-container text-on-tertiary-container rounded-2xl flex items-center justify-center mb-6">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="font-headline text-2xl font-bold mb-3">Rich Media</h3>
            <p className="text-on-surface-variant leading-relaxed">Upload photos, add sticky notes, and react to others' contributions seamlessly.</p>
          </div>

          <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/30">
            <div className="w-12 h-12 bg-secondary-container text-on-secondary-container rounded-2xl flex items-center justify-center mb-6">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-headline text-2xl font-bold mb-3">Host Controls</h3>
            <p className="text-on-surface-variant leading-relaxed">Keep the vibes right with powerful moderation tools and board settings.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
