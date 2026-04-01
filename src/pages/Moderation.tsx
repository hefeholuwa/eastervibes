import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Settings, Users, Shield, Trash2, Eye, EyeOff, MessageSquare, Image as ImageIcon } from "lucide-react";
import { cn } from "../lib/utils";

export default function Moderation() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<"settings" | "users" | "content">("settings");

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row font-body">
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-surface-container-lowest border-r border-outline-variant/20 flex flex-col">
        <div className="p-6 border-b border-outline-variant/20">
          <Link to={`/board/${id}`} className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors font-bold mb-6">
            <ArrowLeft className="w-5 h-5" />
            Back to Board
          </Link>
          <h1 className="font-headline text-2xl font-bold text-on-surface">Event Control</h1>
          <p className="text-sm text-on-surface-variant mt-1">Summer Solstice Planning</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab("settings")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors text-left",
              activeTab === "settings" 
                ? "bg-primary-container/20 text-primary" 
                : "text-on-surface-variant hover:bg-surface-variant"
            )}
          >
            <Settings className="w-5 h-5" />
            Room Settings
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors text-left",
              activeTab === "users" 
                ? "bg-primary-container/20 text-primary" 
                : "text-on-surface-variant hover:bg-surface-variant"
            )}
          >
            <Users className="w-5 h-5" />
            Manage Users
            <span className="ml-auto bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded-full text-xs">15</span>
          </button>
          <button
            onClick={() => setActiveTab("content")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors text-left",
              activeTab === "content" 
                ? "bg-primary-container/20 text-primary" 
                : "text-on-surface-variant hover:bg-surface-variant"
            )}
          >
            <Shield className="w-5 h-5" />
            Content Moderation
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {activeTab === "settings" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div>
                <h2 className="font-headline text-3xl font-bold text-on-surface mb-6">Room Settings</h2>
                <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/20 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-on-surface">Allow new posts</h3>
                      <p className="text-on-surface-variant text-sm">Guests can add new sticky notes and images.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-14 h-7 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:border-outline-variant after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  
                  <hr className="border-outline-variant/20" />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-on-surface">Require approval</h3>
                      <p className="text-on-surface-variant text-sm">Review posts before they appear on the board.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-14 h-7 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:border-outline-variant after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <hr className="border-outline-variant/20" />

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-error">Close Room</h3>
                      <p className="text-on-surface-variant text-sm">End the event and generate a summary.</p>
                    </div>
                    <Link 
                      to={`/summary/${id}`}
                      className="bg-error/10 text-error hover:bg-error/20 px-6 py-2.5 rounded-full font-bold transition-colors"
                    >
                      End Event
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="font-headline text-3xl font-bold text-on-surface mb-6">Manage Users</h2>
              <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-sm overflow-hidden">
                <ul className="divide-y divide-outline-variant/20">
                  {[
                    { name: "Sarah Jenkins", role: "Host", status: "online" },
                    { name: "Mike T.", role: "Guest", status: "online" },
                    { name: "Alex R.", role: "Guest", status: "offline" },
                  ].map((user, i) => (
                    <li key={i} className="p-6 flex items-center justify-between hover:bg-surface-container-low/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-lg">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">{user.name}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <span className={cn("w-2 h-2 rounded-full", user.status === "online" ? "bg-green-500" : "bg-outline-variant")} />
                            <span className="text-on-surface-variant capitalize">{user.status} • {user.role}</span>
                          </div>
                        </div>
                      </div>
                      {user.role !== "Host" && (
                        <button className="text-error hover:bg-error/10 p-2 rounded-full transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === "content" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="font-headline text-3xl font-bold text-on-surface mb-6">Content Moderation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { type: "note", content: "So excited for the bonfire tonight! 🔥", author: "Sarah" },
                  { type: "image", url: "https://picsum.photos/seed/solstice/400/300", author: "Mike" },
                ].map((item, i) => (
                  <div key={i} className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/20 shadow-sm flex flex-col">
                    <div className="flex-1 mb-6">
                      {item.type === "note" ? (
                        <div className="bg-yellow-100 p-6 rounded-2xl h-full">
                          <p className="text-lg font-medium text-on-surface">{item.content}</p>
                        </div>
                      ) : (
                        <img src={item.url} alt="Post" className="w-full h-48 object-cover rounded-2xl" referrerPolicy="no-referrer" />
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-outline-variant/20">
                      <div className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">By {item.author}</div>
                      <div className="flex gap-2">
                        <button className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors" title="Hide from board">
                          <EyeOff className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-error hover:bg-error/10 rounded-full transition-colors" title="Delete post">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
