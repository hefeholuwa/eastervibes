import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Sparkles, User, ArrowRight } from "lucide-react";
import { joinRoom } from "../lib/board";

export default function JoinRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setError("");
    setIsJoining(true);

    try {
      await joinRoom(id, name.trim());
      navigate(`/board/${id}`);
    } catch (joinError) {
      setError(
        joinError instanceof Error
          ? joinError.message
          : "We couldn't join that board right now.",
      );
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-[100svh] bg-surface flex flex-col">
      <header className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 sm:px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" />
          Back to landing
        </Link>
      </header>

      <main className="flex-1 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
        <div className="mx-auto flex w-full max-w-md flex-col justify-center rounded-[2rem] border border-outline-variant/20 bg-surface-container-lowest p-6 text-center shadow-sm sm:p-8 md:p-12">
          <div className="w-20 h-20 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mx-auto mb-8">
            <Sparkles className="w-10 h-10" />
          </div>
          
          <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-surface mb-4">Join the gathering</h1>
          <p className="text-on-surface-variant text-base sm:text-lg mb-8 sm:mb-10">Enter your name to start sharing vibes on the board.</p>

          <form onSubmit={handleJoin} className="space-y-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-6 w-6 text-on-surface-variant/50" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your display name"
                className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl pl-12 pr-6 py-4 text-base sm:text-lg outline-none transition-colors placeholder:text-on-surface-variant/50"
                required
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-error/20 bg-error/10 px-4 py-3 text-left text-sm text-error">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isJoining}
              className="w-full bg-primary text-on-primary py-4 rounded-full font-bold text-base sm:text-lg hover:bg-primary-dim transition-colors shadow-md flex items-center justify-center gap-2"
            >
              {isJoining ? "Joining..." : "Join Board"} <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
