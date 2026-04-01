import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Lock, Globe, Palette } from "lucide-react";

export default function CreateRoom() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [theme, setTheme] = useState("warm");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we'd save this to a backend and get an ID
    const id = Math.random().toString(36).substring(7);
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
        <div className="w-full max-w-xl bg-surface-container-lowest rounded-[2rem] p-8 md:p-12 shadow-sm border border-outline-variant/20">
          <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="font-headline text-4xl font-bold text-on-surface mb-3">Set the scene.</h1>
            <p className="text-on-surface-variant text-lg">Create a new space for your community to gather and share.</p>
          </div>

          <form onSubmit={handleCreate} className="space-y-8">
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
                className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl px-6 py-4 text-lg outline-none transition-colors placeholder:text-on-surface-variant/50"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-on-surface uppercase tracking-wider">
                Vibe Selection
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: "warm", name: "Warm", color: "bg-[#fef9ef]" },
                  { id: "cool", name: "Cool", color: "bg-[#f0f4f8]" },
                  { id: "dark", name: "Night", color: "bg-[#1a1a1a]" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={`relative rounded-2xl p-4 border-2 text-left transition-all ${
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

            <div className="space-y-3">
              <label className="block text-sm font-bold text-on-surface uppercase tracking-wider">
                Room Visibility
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setVisibility("public")}
                  className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all ${
                    visibility === "public"
                      ? "border-primary bg-primary-container/10"
                      : "border-outline-variant/30 hover:border-outline-variant"
                  }`}
                >
                  <Globe className={`w-6 h-6 shrink-0 ${visibility === "public" ? "text-primary" : "text-on-surface-variant"}`} />
                  <div className="text-left">
                    <span className="font-bold block mb-1">Public</span>
                    <span className="text-sm text-on-surface-variant">Anyone with the link can join and post.</span>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setVisibility("private")}
                  className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all ${
                    visibility === "private"
                      ? "border-primary bg-primary-container/10"
                      : "border-outline-variant/30 hover:border-outline-variant"
                  }`}
                >
                  <Lock className={`w-6 h-6 shrink-0 ${visibility === "private" ? "text-primary" : "text-on-surface-variant"}`} />
                  <div className="text-left">
                    <span className="font-bold block mb-1">Private</span>
                    <span className="text-sm text-on-surface-variant">Only approved guests can join.</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-primary text-on-primary py-4 rounded-full font-bold text-lg hover:bg-primary-dim transition-colors shadow-md flex items-center justify-center gap-2"
              >
                Create Vibe Board <Sparkles className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
