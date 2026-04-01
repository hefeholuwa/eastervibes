import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, Share2, Heart, Sparkles, Image as ImageIcon, MessageSquare, Users } from "lucide-react";

export default function Summary() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-surface flex flex-col font-body">
      <header className="p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link to="/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors font-bold">
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>
        <div className="flex gap-3">
          <button className="bg-surface-container-lowest text-on-surface px-6 py-2.5 rounded-full font-bold text-sm hover:bg-surface-variant transition-colors shadow-sm border border-outline-variant/20 flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-bold text-sm hover:bg-primary-dim transition-colors shadow-sm flex items-center gap-2">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 pb-24 max-w-5xl mx-auto w-full">
        <div className="text-center mb-16 pt-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-container text-on-primary-container rounded-full mb-8">
            <Heart className="w-10 h-10" />
          </div>
          <h1 className="font-headline text-5xl md:text-6xl font-bold text-on-surface mb-6">A Beautiful Moment Captured</h1>
          <p className="text-xl text-on-surface-variant max-w-2xl mx-auto">
            The "Summer Solstice Gathering" board is now closed. Here's a summary of the vibes your community shared.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { label: "Contributors", value: "24", icon: Users },
            { label: "Sticky Notes", value: "56", icon: MessageSquare },
            { label: "Photos Shared", value: "18", icon: ImageIcon },
            { label: "Reactions", value: "142", icon: Heart },
          ].map((stat, i) => (
            <div key={i} className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 text-center shadow-sm">
              <stat.icon className="w-8 h-8 mx-auto mb-4 text-primary" />
              <div className="font-headline text-4xl font-bold text-on-surface mb-1">{stat.value}</div>
              <div className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Mosaic Preview */}
        <div className="bg-surface-container-lowest rounded-[2rem] p-8 md:p-12 border border-outline-variant/20 shadow-sm mb-16">
          <h2 className="font-headline text-3xl font-bold text-on-surface mb-8 text-center">Board Highlights</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[200px]">
            <div className="col-span-2 row-span-2 rounded-3xl overflow-hidden relative group">
              <img src="https://picsum.photos/seed/solstice1/800/600" alt="Highlight" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <p className="text-white font-bold">Added by Sarah</p>
              </div>
            </div>
            <div className="bg-yellow-100 rounded-3xl p-6 flex flex-col justify-center shadow-sm">
              <p className="text-xl font-medium text-on-surface mb-4 leading-relaxed">"The sunset was absolutely magical tonight! ✨"</p>
              <div className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider mt-auto">Alex</div>
            </div>
            <div className="rounded-3xl overflow-hidden relative group">
              <img src="https://picsum.photos/seed/solstice2/400/400" alt="Highlight" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
            </div>
            <div className="bg-pink-100 rounded-3xl p-6 flex flex-col justify-center shadow-sm">
              <p className="text-xl font-medium text-on-surface mb-4 leading-relaxed">"Can't wait for next year's gathering!"</p>
              <div className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider mt-auto">Mike</div>
            </div>
            <div className="col-span-2 rounded-3xl overflow-hidden relative group">
              <img src="https://picsum.photos/seed/solstice3/800/400" alt="Highlight" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link 
            to="/create" 
            className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-8 py-4 rounded-full font-bold text-lg hover:bg-primary-dim transition-all shadow-md hover:shadow-lg"
          >
            Start a new board <Sparkles className="w-5 h-5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
