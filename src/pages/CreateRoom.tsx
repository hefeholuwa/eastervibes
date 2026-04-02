import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, User, Hash } from "lucide-react";
import { createRoom, storeDisplayName } from "../lib/board";

export default function CreateRoom() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [hostName, setHostName] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [theme, setTheme] = useState("warm");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const displayName = hostName.trim() || "Host";
      const roomId = await createRoom({
        name,
        theme,
        hostName: displayName,
        shortCode,
      });
      storeDisplayName(roomId, displayName);

      navigate(`/board/${roomId}`);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "We couldn't create the board right now.",
      );
    } finally {
      setIsSaving(false);
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
        <div className="mx-auto w-full max-w-xl rounded-[2rem] border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm sm:p-8 md:p-12">
          <div className="mb-8 text-center sm:mb-10">
            <div className="w-16 h-16 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-surface mb-3">Set the scene.</h1>
            <p className="text-on-surface-variant text-base sm:text-lg">Create a new space for your community to gather and share.</p>
          </div>

          <form onSubmit={handleCreate} className="space-y-7 sm:space-y-8">
            <div className="space-y-3">
              <label htmlFor="hostName" className="block text-sm font-bold text-on-surface uppercase tracking-wider">
                Your Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-on-surface-variant/50" />
                </div>
                <input
                  id="hostName"
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="e.g. Pastor Mike"
                  className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl pl-12 pr-5 py-4 text-base sm:text-lg outline-none transition-colors placeholder:text-on-surface-variant/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="name" className="block text-sm font-bold text-on-surface uppercase tracking-wider">
                Event Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Summer Solstice Gathering"
                className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl px-5 py-4 text-base sm:text-lg outline-none transition-colors placeholder:text-on-surface-variant/50"
                required
              />
            </div>

            <div className="space-y-3">
              <label htmlFor="shortCode" className="block text-sm font-bold text-on-surface uppercase tracking-wider">
                Room Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Hash className="h-5 w-5 text-on-surface-variant/50" />
                </div>
                <input
                  id="shortCode"
                  type="text"
                  value={shortCode}
                  onChange={(e) =>
                    setShortCode(
                      e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6),
                    )
                  }
                  placeholder="AUTO"
                  maxLength={6}
                  className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl pl-12 pr-5 py-4 text-base sm:text-lg font-bold tracking-[0.24em] uppercase outline-none transition-colors placeholder:text-on-surface-variant/40"
                />
              </div>
              <p className="text-sm text-on-surface-variant">
                Optional. Leave it blank and we will generate a 6-character code for you.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-on-surface uppercase tracking-wider">
                Vibe Selection
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                {[
                  { id: "warm", name: "Warm", color: "bg-[#fef9ef]" },
                  { id: "cool", name: "Cool", color: "bg-[#f0f4f8]" },
                  { id: "dark", name: "Night", color: "bg-[#1a1a1a]" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={`relative rounded-2xl p-4 border-2 text-left transition-all cursor-pointer min-h-20 ${
                      theme === t.id 
                        ? "border-primary bg-primary-container/10" 
                        : "border-outline-variant/30 hover:border-outline-variant"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full mb-3 shadow-sm border border-black/5 ${t.color}`} />
                    <span className="font-medium block">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
                {error}
              </div>
            ) : null}

            <div className="sticky bottom-[max(1rem,env(safe-area-inset-bottom))] pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-primary text-on-primary py-4 rounded-full font-bold text-base sm:text-lg hover:bg-primary-dim transition-colors shadow-md flex items-center justify-center gap-2"
              >
                {isSaving ? "Creating Board..." : "Create Vibe Board"} <Sparkles className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
