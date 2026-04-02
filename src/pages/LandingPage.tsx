import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Clock3, Hash, Sparkles, Users, Image as ImageIcon, MessageSquare } from "lucide-react";
import { createRoom, findRoomByCode, getRecentBoards, storeDisplayName, type RecentBoard } from "../lib/board";

export default function LandingPage() {
  const navigate = useNavigate();
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);
  const [recentBoards, setRecentBoards] = useState<RecentBoard[]>([]);
  const [roomCode, setRoomCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    setRecentBoards(getRecentBoards());
  }, []);

  const handleJoinByCode = async () => {
    const code = roomCode.trim().toUpperCase();
    if (code.length !== 6) {
      setCodeError("Enter a 6-character room code.");
      return;
    }
    setCodeError("");
    setIsJoining(true);
    try {
      const room = await findRoomByCode(code);
      if (!room) {
        setCodeError("No board found with that code. Double-check and try again.");
        return;
      }
      navigate(`/join/${room.id}`);
    } catch {
      setCodeError("Something went wrong. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleTryDemo = async () => {
    if (isCreatingDemo) return;
    setIsCreatingDemo(true);

    try {
      const roomId = await createRoom({
        name: "Demo Board",
        visibility: "public",
        theme: "warm",
        hostName: "Demo Host",
      });
      storeDisplayName(roomId, "Demo Host");
      navigate(`/board/${roomId}`);
    } catch {
      navigate("/create");
    } finally {
      setIsCreatingDemo(false);
    }
  };

  return (
    <div className="min-h-[100svh] flex flex-col overflow-x-clip bg-[radial-gradient(circle_at_top,_rgba(255,173,145,0.22),_transparent_34%),linear-gradient(180deg,_rgba(255,255,255,0.55)_0%,_rgba(254,249,239,1)_34%,_rgba(243,237,224,0.75)_100%)]">
      {/* Top Nav */}
      <header className="sticky top-0 z-20 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 sm:px-6">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 rounded-full border border-outline-variant/25 bg-surface-container-lowest/85 px-4 py-3 shadow-sm backdrop-blur-md sm:px-6">
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
          className="bg-primary text-on-primary px-4 py-3 rounded-full font-medium text-sm hover:bg-primary-dim transition-colors shadow-sm whitespace-nowrap"
        >
          Create a Board
        </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 px-4 pb-20 pt-8 sm:px-6 sm:pt-14 sm:pb-28">
        <section className="mx-auto flex w-full max-w-6xl flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-low text-on-surface-variant text-xs sm:text-sm font-medium mb-6 sm:mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Now with real-time collaboration
        </div>
        
        <h1 className="font-headline text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-on-surface mb-5 sm:mb-6 leading-[0.95]">
          Your Community's <br className="hidden sm:block" />
          <span className="text-primary italic">Shared Voice</span>
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl text-on-surface-variant max-w-2xl mb-8 sm:mb-10 leading-relaxed px-2 sm:px-0">
          Create beautiful, interactive boards for events, workshops, and gatherings. 
          Let everyone contribute their thoughts, photos, and vibes in real-time.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto max-w-sm sm:max-w-none">
          <Link 
            to="/create" 
            className="w-full sm:w-auto bg-primary text-on-primary px-7 py-4 rounded-full font-medium text-base sm:text-lg hover:bg-primary-dim transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            Start a new board <ArrowRight className="w-5 h-5" />
          </Link>
          <button
            onClick={handleTryDemo}
            disabled={isCreatingDemo}
            className="w-full sm:w-auto bg-surface-container-high text-on-surface px-7 py-4 rounded-full font-medium text-base sm:text-lg hover:bg-surface-variant transition-colors flex items-center justify-center disabled:opacity-60"
          >
            {isCreatingDemo ? "Creating demo..." : "Try Demo Board"}
          </button>
        </div>

        {/* Join by Code */}
        <div className="mt-8 sm:mt-10 w-full max-w-md">
          <div className="bg-surface-container-lowest/85 border border-outline-variant/25 rounded-2xl p-4 sm:p-5 shadow-sm backdrop-blur-sm">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant mb-3 flex items-center gap-2">
              <Hash className="w-4 h-4 text-primary" /> Have a room code?
            </p>
            <form onSubmit={(e) => { e.preventDefault(); handleJoinByCode(); }} className="flex gap-3">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => { setRoomCode(e.target.value.toUpperCase().slice(0, 6)); setCodeError(""); }}
                placeholder="ABC123"
                maxLength={6}
                className="flex-1 bg-surface-container-low border-2 border-transparent focus:border-primary rounded-xl px-4 py-3 text-base font-bold tracking-[0.3em] text-center uppercase outline-none transition-colors placeholder:text-on-surface-variant/40 placeholder:tracking-[0.3em]"
              />
              <button
                type="submit"
                disabled={isJoining || roomCode.length < 6}
                className="bg-primary text-on-primary px-5 py-3 rounded-xl font-bold text-sm hover:bg-primary-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {isJoining ? "..." : "Join"}
              </button>
            </form>
            {codeError ? <p className="text-sm text-error mt-2">{codeError}</p> : null}
          </div>
        </div>

        <div className="mt-10 grid w-full max-w-4xl grid-cols-1 gap-4 rounded-[2rem] border border-outline-variant/20 bg-surface-container-lowest/75 p-4 text-left shadow-sm backdrop-blur-sm sm:mt-14 sm:grid-cols-[1.35fr_0.95fr] sm:gap-6 sm:p-6">
          <div className="rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(255,173,145,0.16),rgba(255,255,255,0.45))] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">Live Board</p>
                <h2 className="mt-1 font-headline text-2xl sm:text-3xl font-bold text-on-surface">Youth Praise Night</h2>
              </div>
              <div className="rounded-full bg-surface-container-lowest px-3 py-2 text-xs font-bold text-primary shadow-sm">18 online</div>
            </div>
            <div className="relative h-64 overflow-hidden rounded-[1.5rem] border border-outline-variant/20 bg-[radial-gradient(#e8e2d2_1px,transparent_1px)] [background-size:22px_22px] sm:h-72">
              <div className="absolute left-[8%] top-[14%] w-36 rounded-[1.35rem] bg-[#fff5b8] p-4 shadow-md">
                <p className="text-sm font-medium leading-relaxed text-on-surface">Tonight felt so peaceful. I really needed this.</p>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.24em] text-on-surface-variant/80">Ada</p>
              </div>
              <div className="absolute right-[7%] top-[18%] w-32 overflow-hidden rounded-[1.35rem] bg-surface-container-lowest p-2 shadow-md">
                <div className="h-24 rounded-xl bg-[linear-gradient(135deg,#ffad91,#f9f2ca,#ff9dab)]" />
                <p className="px-2 pt-2 text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant/80">Mike</p>
              </div>
              <div className="absolute bottom-[10%] left-[20%] w-40 rounded-[1.35rem] bg-[#ffd7df] p-4 shadow-md">
                <p className="text-sm font-medium leading-relaxed text-on-surface">Love seeing everyone drop prayers and memories in one place.</p>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.24em] text-on-surface-variant/80">Tobi</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 rounded-[1.5rem] bg-surface-container-low p-4 sm:p-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">Made For Phones</p>
              <h3 className="mt-2 font-headline text-2xl sm:text-3xl font-bold text-on-surface">Join fast. Post fast. Feel present.</h3>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl bg-surface-container-lowest px-4 py-4 shadow-sm">
                <p className="text-sm font-bold text-on-surface">One tap to add a note</p>
                <p className="mt-1 text-sm text-on-surface-variant">Big buttons, bottom sheet actions, and clear touch targets.</p>
              </div>
              <div className="rounded-2xl bg-surface-container-lowest px-4 py-4 shadow-sm">
                <p className="text-sm font-bold text-on-surface">Built for live events</p>
                <p className="mt-1 text-sm text-on-surface-variant">Participants join from a link and start contributing in seconds.</p>
              </div>
            </div>
          </div>
        </div>

        {recentBoards.length > 0 ? (
          <div className="mt-8 w-full max-w-4xl rounded-[2rem] border border-outline-variant/20 bg-surface-container-lowest/85 p-4 shadow-sm sm:mt-10 sm:p-6">
            <div className="flex items-center gap-2 text-on-surface mb-4">
              <Clock3 className="w-5 h-5 text-primary" />
              <h3 className="font-headline text-2xl font-bold">Recent Boards</h3>
            </div>
            <div className="grid gap-3">
              {recentBoards.map((board) => (
                <div
                  key={board.id}
                  className="flex flex-col gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-bold text-on-surface">{board.name}</p>
                    <p className="text-sm text-on-surface-variant">Board code: {board.id}</p>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      to={`/join/${board.id}`}
                      className="rounded-full bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface hover:bg-surface-variant transition-colors"
                    >
                      Join
                    </Link>
                    <Link
                      to={`/board/${board.id}`}
                      className="rounded-full bg-primary px-4 py-3 text-sm font-bold text-on-primary hover:bg-primary-dim transition-colors"
                    >
                      Return to Board
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Features Bento Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-16 sm:mt-24 w-full max-w-5xl text-left">
          <div className="bg-surface-container-low p-6 sm:p-8 rounded-3xl border border-outline-variant/30">
            <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-2xl flex items-center justify-center mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-headline text-2xl font-bold mb-3">Real-time Sync</h3>
            <p className="text-on-surface-variant leading-relaxed">Watch ideas appear instantly as your community adds them. No refreshing needed.</p>
          </div>
          
          <div className="bg-surface-container-low p-6 sm:p-8 rounded-3xl border border-outline-variant/30">
            <div className="w-12 h-12 bg-tertiary-container text-on-tertiary-container rounded-2xl flex items-center justify-center mb-6">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="font-headline text-2xl font-bold mb-3">Rich Media</h3>
            <p className="text-on-surface-variant leading-relaxed">Upload photos, add sticky notes, and react to others' contributions seamlessly.</p>
          </div>

          <div className="bg-surface-container-low p-6 sm:p-8 rounded-3xl border border-outline-variant/30">
            <div className="w-12 h-12 bg-secondary-container text-on-secondary-container rounded-2xl flex items-center justify-center mb-6">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-headline text-2xl font-bold mb-3">Host Controls</h3>
            <p className="text-on-surface-variant leading-relaxed">Keep the vibes right with powerful moderation tools and board settings.</p>
          </div>
        </div>
        </section>
      </main>
    </div>
  );
}
