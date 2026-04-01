import React, { useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { Plus, Settings, Users, Image as ImageIcon, Type, Sparkles, X, Check } from "lucide-react";
import { cn } from "../lib/utils";

// Mock data for the board
const INITIAL_ITEMS = [
  { id: 1, type: "note", content: "So excited for the bonfire tonight! 🔥", x: 100, y: 150, color: "bg-yellow-100", author: "Sarah" },
  { id: 2, type: "image", url: "https://picsum.photos/seed/solstice/400/300", x: 400, y: 100, author: "Mike" },
  { id: 3, type: "note", content: "Don't forget to bring marshmallows!", x: 250, y: 400, color: "bg-pink-100", author: "Alex" },
];

export default function LiveBoard() {
  const { id } = useParams();
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItemType, setNewItemType] = useState<"note" | "image">("note");
  const [newContent, setNewContent] = useState("");
  
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent, id: number) => {
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    setDraggingId(id);
    
    // Find item
    const item = items.find(i => i.id === id);
    if (item) {
      setDragOffset({
        x: e.clientX - item.x,
        y: e.clientY - item.y
      });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingId === null) return;
    
    setItems(items.map(item => {
      if (item.id === draggingId) {
        return {
          ...item,
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        };
      }
      return item;
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId !== null) {
      const target = e.currentTarget as HTMLElement;
      target.releasePointerCapture(e.pointerId);
      setDraggingId(null);
    }
  };

  const handleAddItem = () => {
    if (!newContent) return;
    
    const newItem = {
      id: Date.now(),
      type: newItemType,
      content: newItemType === "note" ? newContent : undefined,
      url: newItemType === "image" ? newContent : undefined, // For demo, assuming content is URL if image
      x: Math.random() * (window.innerWidth - 300) + 50,
      y: Math.random() * (window.innerHeight - 300) + 50,
      color: "bg-yellow-100",
      author: "You",
    };
    
    setItems([...items, newItem]);
    setIsAddModalOpen(false);
    setNewContent("");
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-surface relative font-body">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10 pointer-events-none">
        <div className="pointer-events-auto bg-surface-container-lowest/80 backdrop-blur-md px-6 py-3 rounded-full shadow-sm border border-outline-variant/20 flex items-center gap-4">
          <h1 className="font-headline font-bold text-xl text-on-surface">Summer Solstice Gathering</h1>
          <div className="h-4 w-px bg-outline-variant/50" />
          <div className="flex items-center gap-2 text-sm font-medium text-on-surface-variant">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-primary-container border-2 border-surface-container-lowest flex items-center justify-center text-[10px] font-bold text-on-primary-container">S</div>
              <div className="w-6 h-6 rounded-full bg-tertiary-container border-2 border-surface-container-lowest flex items-center justify-center text-[10px] font-bold text-on-tertiary-container">M</div>
              <div className="w-6 h-6 rounded-full bg-secondary-container border-2 border-surface-container-lowest flex items-center justify-center text-[10px] font-bold text-on-secondary-container">A</div>
            </div>
            <span>+12 online</span>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-3">
          <Link 
            to={`/board/${id}/moderation`}
            className="bg-surface-container-lowest/80 backdrop-blur-md p-3 rounded-full shadow-sm border border-outline-variant/20 text-on-surface hover:bg-surface-variant transition-colors"
          >
            <Settings className="w-5 h-5" />
          </Link>
          <Link 
            to={`/summary/${id}`}
            className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold text-sm hover:bg-primary-dim transition-colors shadow-md"
          >
            End Event
          </Link>
        </div>
      </header>

      {/* Canvas Area */}
      <main className="absolute inset-0 overflow-auto bg-[radial-gradient(#e8e2d2_1px,transparent_1px)] [background-size:24px_24px]">
        <div className="relative w-[200vw] h-[200vh]">
          {items.map((item) => (
            <div
              key={item.id}
              onPointerDown={(e) => handlePointerDown(e, item.id)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={cn(
                "absolute shadow-md hover:shadow-lg transition-shadow cursor-grab active:cursor-grabbing select-none",
                item.type === "note" ? "w-64 p-6 rounded-2xl" : "w-80 rounded-2xl overflow-hidden bg-surface-container-lowest p-3 pb-12",
                item.color || "bg-surface-container-lowest",
                draggingId === item.id ? "z-50 shadow-xl scale-105" : "z-10"
              )}
              style={{ left: item.x, top: item.y, touchAction: "none" }}
            >
              {item.type === "note" ? (
                <>
                  <p className="text-lg font-medium text-on-surface mb-4 leading-relaxed">{item.content}</p>
                  <div className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider">{item.author}</div>
                </>
              ) : (
                <>
                  <img src={item.url} alt="Board item" className="w-full h-48 object-cover rounded-xl mb-3" referrerPolicy="no-referrer" />
                  <div className="absolute bottom-4 left-4 text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider">{item.author}</div>
                </>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="absolute bottom-8 right-8 w-16 h-16 bg-primary text-on-primary rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center z-20"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-[2rem] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between">
              <h2 className="font-headline text-2xl font-bold text-on-surface">Add to Board</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8">
              <div className="flex gap-4 mb-8">
                <button
                  onClick={() => setNewItemType("note")}
                  className={cn(
                    "flex-1 py-4 rounded-2xl border-2 font-bold text-lg flex flex-col items-center gap-2 transition-all",
                    newItemType === "note" 
                      ? "border-primary bg-primary-container/10 text-primary" 
                      : "border-outline-variant/30 text-on-surface-variant hover:border-outline-variant"
                  )}
                >
                  <Type className="w-6 h-6" />
                  Sticky Note
                </button>
                <button
                  onClick={() => setNewItemType("image")}
                  className={cn(
                    "flex-1 py-4 rounded-2xl border-2 font-bold text-lg flex flex-col items-center gap-2 transition-all",
                    newItemType === "image" 
                      ? "border-primary bg-primary-container/10 text-primary" 
                      : "border-outline-variant/30 text-on-surface-variant hover:border-outline-variant"
                  )}
                >
                  <ImageIcon className="w-6 h-6" />
                  Image
                </button>
              </div>

              {newItemType === "note" ? (
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full h-32 bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl p-4 text-lg outline-none transition-colors resize-none placeholder:text-on-surface-variant/50"
                  autoFocus
                />
              ) : (
                <div className="border-2 border-dashed border-outline-variant/50 rounded-2xl p-8 text-center hover:border-primary hover:bg-primary-container/5 transition-colors cursor-pointer">
                  <div className="w-16 h-16 bg-surface-variant text-on-surface-variant rounded-full flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <p className="font-bold text-on-surface mb-1">Click to upload or drag and drop</p>
                  <p className="text-sm text-on-surface-variant">SVG, PNG, JPG or GIF (max. 5MB)</p>
                  {/* For demo purposes, we'll just use a text input for URL */}
                  <input 
                    type="text" 
                    placeholder="Or paste image URL here for demo" 
                    className="mt-4 w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-3 text-sm outline-none focus:border-primary"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
            </div>

            <div className="p-6 bg-surface-container-low border-t border-outline-variant/20 flex justify-end gap-3">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-6 py-3 rounded-full font-bold text-on-surface-variant hover:bg-surface-variant transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                disabled={!newContent}
                className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold hover:bg-primary-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
              >
                <Check className="w-5 h-5" /> Post to Board
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
