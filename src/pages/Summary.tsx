import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Heart,
  Image as ImageIcon,
  MessageSquare,
  Share2,
  Sparkles,
  Users,
} from "lucide-react";
import {
  subscribeToBoardItems,
  subscribeToParticipants,
  subscribeToRoom,
  type BoardItem,
  type Participant,
  type Room,
} from "../lib/board";

export default function Summary() {
  const { id } = useParams();
  const [room, setRoom] = useState<Room | null>(null);
  const [items, setItems] = useState<BoardItem[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);

  const roomId = id ?? "";

  useEffect(() => {
    if (!roomId) return;

    const unsubRoom = subscribeToRoom(roomId, setRoom);
    const unsubItems = subscribeToBoardItems(roomId, setItems);
    const unsubParticipants = subscribeToParticipants(roomId, setParticipants);

    return () => {
      unsubRoom();
      unsubItems();
      unsubParticipants();
    };
  }, [roomId]);

  const visibleItems = items.filter((item) => !item.hidden);
  const noteCount = visibleItems.filter((item) => item.type === "note").length;
  const imageItems = visibleItems.filter((item) => item.type === "image");
  const noteItems = visibleItems.filter((item) => item.type === "note");
  const highlightImages = imageItems.slice(0, 3);
  const highlightNotes = noteItems.slice(0, 2);
  const stats = useMemo(
    () => [
      { label: "Contributors", value: String(participants.length), icon: Users },
      { label: "Sticky Notes", value: String(noteCount), icon: MessageSquare },
      { label: "Photos Shared", value: String(imageItems.length), icon: ImageIcon },
      { label: "Live Posts", value: String(visibleItems.length), icon: Heart },
    ],
    [imageItems.length, noteCount, participants.length, visibleItems.length],
  );

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/join/${roomId}`
    : "";

  const handleShare = useCallback(async () => {
    const shareData = {
      title: `${room?.name ?? "VibeBoard"} — Event Summary`,
      text: `Check out the vibes from "${room?.name}"! ${visibleItems.length} posts shared by ${participants.length} people.`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled — that's okay
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard!");
      } catch {
        // Fallback
        prompt("Copy this link:", shareUrl);
      }
    }
  }, [room?.name, visibleItems.length, participants.length, shareUrl]);

  const handleExport = useCallback(() => {
    alert("PDF export coming soon! For now, try taking a screenshot.");
  }, []);

  return (
    <div className="min-h-[100svh] bg-surface flex flex-col font-body">
      <header className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 sm:px-6">
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors font-bold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleShare}
              className="bg-surface-container-lowest text-on-surface px-6 py-3 rounded-full font-bold text-sm hover:bg-surface-variant transition-colors shadow-sm border border-outline-variant/20 flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button
              onClick={handleExport}
              className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold text-sm hover:bg-primary-dim transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 pb-20 sm:pb-24 max-w-5xl mx-auto w-full">
        <div className="text-center mb-12 sm:mb-16 pt-8 sm:pt-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-container text-on-primary-container rounded-full mb-8">
            <Heart className="w-10 h-10" />
          </div>
          <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold text-on-surface mb-6">
            A Beautiful Moment Captured
          </h1>
          <p className="text-lg sm:text-xl text-on-surface-variant max-w-2xl mx-auto">
            The "{room?.name ?? "board"}" board is now closed. Here's a summary of
            the vibes your community shared.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-12 sm:mb-16">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 text-center shadow-sm"
            >
              <stat.icon className="w-8 h-8 mx-auto mb-4 text-primary" />
              <div className="font-headline text-4xl font-bold text-on-surface mb-1">
                {stat.value}
              </div>
              <div className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-surface-container-lowest rounded-[2rem] p-5 sm:p-8 md:p-12 border border-outline-variant/20 shadow-sm mb-14 sm:mb-16">
          <h2 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface mb-6 sm:mb-8 text-center">
            Board Highlights
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 auto-rows-[150px] sm:auto-rows-[200px]">
            {highlightImages[0] ? (
              <div className="col-span-2 row-span-2 rounded-3xl overflow-hidden relative group">
                <img
                  src={highlightImages[0].imageUrl}
                  alt={`${highlightImages[0].author}'s highlight`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                  <p className="text-white font-bold">Added by {highlightImages[0].author}</p>
                </div>
              </div>
            ) : null}

            {highlightNotes[0] ? (
              <div className="bg-yellow-100 rounded-3xl p-6 flex flex-col justify-center shadow-sm">
                <p className="text-lg font-medium text-on-surface mb-4 leading-relaxed">
                  "{highlightNotes[0].content}"
                </p>
                <div className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider mt-auto">
                  {highlightNotes[0].author}
                </div>
              </div>
            ) : null}

            {highlightImages[1] ? (
              <div className="rounded-3xl overflow-hidden relative group">
                <img
                  src={highlightImages[1].imageUrl}
                  alt={`${highlightImages[1].author}'s highlight`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : null}

            {highlightNotes[1] ? (
              <div className="bg-pink-100 rounded-3xl p-6 flex flex-col justify-center shadow-sm">
                <p className="text-lg font-medium text-on-surface mb-4 leading-relaxed">
                  "{highlightNotes[1].content}"
                </p>
                <div className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider mt-auto">
                  {highlightNotes[1].author}
                </div>
              </div>
            ) : null}

            {highlightImages[2] ? (
              <div className="col-span-2 rounded-3xl overflow-hidden relative group">
                <img
                  src={highlightImages[2].imageUrl}
                  alt={`${highlightImages[2].author}'s highlight`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="text-center">
          <Link
            to="/create"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 bg-primary text-on-primary px-8 py-4 rounded-full font-bold text-base sm:text-lg hover:bg-primary-dim transition-all shadow-md hover:shadow-lg"
          >
            Start a new board <Sparkles className="w-5 h-5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
