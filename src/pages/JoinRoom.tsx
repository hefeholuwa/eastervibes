import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Sparkles, User, ArrowRight } from "lucide-react";

export default function JoinRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/board/${id}`);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="p-6">
        <Link to="/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" />
          Back to landing
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-[2rem] p-8 md:p-12 shadow-sm border border-outline-variant/20 text-center">
          <div className="w-20 h-20 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mx-auto mb-8">
            <Sparkles className="w-10 h-10" />
          </div>
          
          <h1 className="font-headline text-4xl font-bold text-on-surface mb-4">Join the gathering</h1>
          <p className="text-on-surface-variant text-lg mb-10">Enter your name to start sharing vibes on the board.</p>

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
                className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl pl-12 pr-6 py-4 text-lg outline-none transition-colors placeholder:text-on-surface-variant/50"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-on-primary py-4 rounded-full font-bold text-lg hover:bg-primary-dim transition-colors shadow-md flex items-center justify-center gap-2"
            >
              Join Board <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
