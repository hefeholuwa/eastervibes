import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Hash,
  Image as ImageIcon,
  Link2,
  Lock,
  LogOut,
  MessageSquareText,
  Palette,
  Pin,
  PinOff,
  Plus,
  Settings,
  Trash2,
  Type,
  Unlock,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  addBoardImage,
  addBoardNote,
  clearAllBoardItems,
  clearPrompt,
  deleteBoardItem,
  endRoom,
  getParticipantId,
  getStoredDisplayName,
  leaveRoom,
  MOVE_MODE_LABELS,
  NOTE_COLORS,
  pinItem,
  REACTION_EMOJI,
  saveRecentBoard,
  setPrompt,
  storeDisplayName,
  subscribeToBoardItems,
  subscribeToParticipants,
  subscribeToRoom,
  toggleReaction,
  unpinItem,
  updateBoardItemPosition,
  updateRoomSettings,
  upsertParticipant,
  type BoardItem,
  type MoveMode,
  type NoteColor,
  type Participant,
  type ReactionType,
  type Room,
} from "../lib/board";
import { cn } from "../lib/utils";

export default function LiveBoard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 390,
    height: typeof window !== "undefined" ? window.innerHeight : 844,
  }));
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 640 : false,
  );
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [items, setItems] = useState<BoardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isHostMenuOpen, setIsHostMenuOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isHostPanelOpen, setIsHostPanelOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newItemType, setNewItemType] = useState<"note" | "image">("note");
  const [newContent, setNewContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState("");
  const [noteColor, setNoteColor] = useState<NoteColor>("yellow");
  const [selectedLane, setSelectedLane] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [viewScale, setViewScale] = useState(1);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const latestPositionRef = useRef<Record<string, { x: number; y: number }>>({});
  const boardRef = useRef<HTMLDivElement>(null);

  // Prompt editing
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [promptDraft, setPromptDraft] = useState("");

  // Lane filter
  const [activeLane, setActiveLane] = useState("");

  // Join toast
  const [joinToast, setJoinToast] = useState("");
  const prevParticipantCount = useRef(0);

  // Name prompt state
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [promptName, setPromptName] = useState("");

  const roomId = id ?? "";
  const storedName = useMemo(
    () => (roomId ? getStoredDisplayName(roomId) : ""),
    [roomId],
  );
  const [displayName, setDisplayName] = useState(storedName || "");

  const myParticipantId = useMemo(
    () => (roomId ? getParticipantId(roomId) : null),
    [roomId],
  );

  // Is the current user the host?
  const isHost = useMemo(() => {
    if (!room) return false;
    const stored = getStoredDisplayName(roomId);
    return stored === room.createdBy;
  }, [room, roomId]);

  // Show name prompt if no display name is stored
  useEffect(() => {
    if (roomId && !storedName) {
      setShowNamePrompt(true);
    }
  }, [roomId, storedName]);

  const handleNameSubmit = useCallback(async () => {
    const trimmed = promptName.trim();
    if (!trimmed || !roomId) return;

    storeDisplayName(roomId, trimmed);
    setDisplayName(trimmed);
    setShowNamePrompt(false);

    try {
      await upsertParticipant(roomId, trimmed, "guest");
    } catch {
      // Silently fail
    }
  }, [promptName, roomId]);

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      const nextIsMobile = window.innerWidth < 640;
      setIsMobile((current) => {
        if (current !== nextIsMobile) {
          setViewScale(1);
        }
        return nextIsMobile;
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!roomId) {
      setError("We couldn't find that board.");
      setIsLoading(false);
      return;
    }

    setError("");
    setIsLoading(true);

    const unsubRoom = subscribeToRoom(
      roomId,
      (nextRoom) => {
        setRoom(nextRoom);
        if (!nextRoom) {
          setError("That board doesn't exist yet.");
        }
      },
      (roomError) => setError(roomError.message),
    );

    const unsubItems = subscribeToBoardItems(
      roomId,
      (nextItems) => {
        setItems(nextItems.filter((item) => !item.hidden));
        setIsLoading(false);
      },
      (itemsError) => {
        setError(itemsError.message);
        setIsLoading(false);
      },
    );

    const unsubParticipants = subscribeToParticipants(
      roomId,
      (nextParticipants) => setParticipants(nextParticipants),
      (participantError) => setError(participantError.message),
    );

    const effectDisplayName = displayName || storedName || "Guest";
    void upsertParticipant(roomId, effectDisplayName, "guest").catch(() => undefined);

    return () => {
      unsubRoom();
      unsubItems();
      unsubParticipants();
    };
  }, [displayName, roomId, storedName]);

  // Join toast
  useEffect(() => {
    if (prevParticipantCount.current > 0 && participants.length > prevParticipantCount.current) {
      const newest = participants[participants.length - 1];
      if (newest) {
        setJoinToast(`${newest.name} just joined`);
        setTimeout(() => setJoinToast(""), 3000);
      }
    }
    prevParticipantCount.current = participants.length;
  }, [participants.length]);

  useEffect(() => {
    if (room?.id && room.name) {
      saveRecentBoard({ id: room.id, name: room.name, shortCode: room.shortCode });
    }
  }, [room]);

  // Image preview
  useEffect(() => {
    if (!selectedImage) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(selectedImage);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedImage]);

  const boardWidth = isMobile
    ? Math.max(320, viewport.width - 24)
    : Math.min(1280, Math.max(920, viewport.width - 96));
  const boardHeight = isMobile
    ? Math.max(560, viewport.height - 170)
    : Math.max(720, viewport.height - 170);
  const isCompactBoard = viewport.width < 1100;
  const minScale = isMobile ? 0.85 : 0.9;
  const maxScale = isMobile ? 1.1 : 1.2;
  const visibleParticipants = participants.slice(0, 5);
  const canPost = (room?.allowPosts ?? true) && !isHost ? true : true; // hosts can always post
  const isLocked = room?.lockedBoard ?? false;
  const effectName = displayName || storedName || "Guest";
  const getItemWidth = useCallback(
    (item: BoardItem) => {
      if (!isMobile) {
        if (isCompactBoard) {
          return item.type === "note" ? 200 : 248;
        }
        return item.type === "note" ? 256 : 320;
      }
      return item.type === "note" ? 156 : 188;
    },
    [isCompactBoard, isMobile],
  );

  const getItemHeight = useCallback(
    (item: BoardItem) => {
      if (item.type === "note") {
        const textLength = item.content?.length ?? 0;
        return isMobile
          ? Math.min(260, 120 + Math.ceil(textLength / 44) * 20)
          : isCompactBoard
            ? Math.min(250, 128 + Math.ceil(textLength / 54) * 20)
            : Math.min(320, 156 + Math.ceil(textLength / 56) * 24);
      }

      return isMobile ? 228 : isCompactBoard ? 236 : 300;
    },
    [isCompactBoard, isMobile],
  );

  const canMoveItem = useCallback((item: BoardItem) => {
    if (isLocked) return false;
    if (isHost) return true;

    const moveMode = room?.moveMode ?? "free";
    if (moveMode === "free") return true;
    if (moveMode === "host") return false;

    const participantMatches = Boolean(
      item.participantId && myParticipantId && item.participantId === myParticipantId,
    );
    const authorMatches =
      Boolean(item.author) &&
      item.author.trim().toLowerCase() === effectName.trim().toLowerCase();

    // Legacy items may not have participant ownership written yet.
    if (!item.participantId) {
      return authorMatches || true;
    }

    return participantMatches || authorMatches;
  }, [effectName, isHost, isLocked, myParticipantId, room?.moveMode]);

  // Filter items by lane
  const filteredItems = useMemo(() => {
    if (!activeLane) return items;
    return items.filter((item) => item.lane === activeLane);
  }, [items, activeLane]);

  const stageHeight = useMemo(() => {
    const furthestItemBottom = filteredItems.reduce((maxBottom, item) => {
      const itemBottom = item.y + getItemHeight(item);
      return Math.max(maxBottom, itemBottom);
    }, 0);

    return Math.max(boardHeight, furthestItemBottom + 32);
  }, [boardHeight, filteredItems, getItemHeight]);

  const clampItemPosition = useCallback(
    (item: BoardItem, position: { x: number; y: number }) => {
      const itemWidth = getItemWidth(item);
      const itemHeight = getItemHeight(item);
      const minX = 10;
      const minY = 10;
      const maxX = Math.max(minX, boardWidth - itemWidth - 10);
      const maxY = Math.max(minY, stageHeight - itemHeight - 10);

      return {
        x: Math.min(Math.max(position.x, minX), maxX),
        y: Math.min(Math.max(position.y, minY), maxY),
      };
    },
    [boardWidth, getItemHeight, getItemWidth, stageHeight],
  );

  // Find pinned item
  const pinnedItem = useMemo(() => {
    if (!room?.pinnedItemId) return null;
    return items.find((item) => item.id === room.pinnedItemId) ?? null;
  }, [items, room?.pinnedItemId]);

  // Smart placement — stay within the visible stage on mobile
  const getSmartPosition = useCallback(
    (type: "note" | "image") => {
      const sampleItem = {
        id: "sample",
        type,
        x: 0,
        y: 0,
        author: effectName,
        participantId: myParticipantId ?? "",
        hidden: false,
        status: "approved" as const,
        reactions: { heart: 0, amen: 0, clap: 0, fire: 0 },
        reactedBy: {},
      };

      const itemWidth = getItemWidth(sampleItem);
      const itemHeight = getItemHeight(sampleItem);
      const columns = isMobile ? 2 : Math.max(3, Math.floor(boardWidth / 280));
      const colWidth = Math.max(itemWidth + 14, Math.floor(boardWidth / columns));
      const rowHeight = itemHeight + (isMobile ? 18 : 28);
      const index = items.length;
      const col = index % columns;
      const row = Math.floor(index / columns);
      const rawPosition = {
        x: 16 + col * colWidth + Math.random() * 10,
        y: 18 + row * rowHeight + Math.random() * 10,
      };

      return clampItemPosition(sampleItem, rawPosition);
    },
    [boardWidth, clampItemPosition, effectName, getItemHeight, getItemWidth, isMobile, items.length, myParticipantId],
  );

  const handlePointerDown = (e: React.PointerEvent, itemId: string) => {
    if (isLocked) return; // Board is fully locked

    const item = items.find((entry) => entry.id === itemId);
    if (!item) return;
    if (!canMoveItem(item)) return;

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    setDraggingId(itemId);

    const boardEl = boardRef.current;
    if (!boardEl) return;
    const boardRect = boardEl.getBoundingClientRect();

    setDragOffset({
      x: (e.clientX - boardRect.left) / viewScale - item.x,
      y: (e.clientY - boardRect.top) / viewScale - item.y,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId) return;
    const boardEl = boardRef.current;
    if (!boardEl) return;
    const boardRect = boardEl.getBoundingClientRect();

    const rawPosition = {
      x: (e.clientX - boardRect.left) / viewScale - dragOffset.x,
      y: (e.clientY - boardRect.top) / viewScale - dragOffset.y,
    };
    const item = items.find((entry) => entry.id === draggingId);
    if (!item) return;
    const nextPosition = clampItemPosition(item, rawPosition);

    latestPositionRef.current[draggingId] = nextPosition;
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === draggingId ? { ...item, ...nextPosition } : item,
      ),
    );
  };

  const handlePointerUp = async (e: React.PointerEvent) => {
    if (!draggingId || !roomId) return;
    const target = e.currentTarget as HTMLElement;
    target.releasePointerCapture(e.pointerId);
    const position = latestPositionRef.current[draggingId];
    setDraggingId(null);
    if (!position) return;

    try {
      await updateBoardItemPosition(roomId, draggingId, position.x, position.y);
    } catch {
      setError("We couldn't save that move. Please try again.");
    }
  };

  const handleAddItem = async () => {
    if (!roomId || !room || !room.isOpen) return;
    if (!room.allowPosts && !isHost) return;

    const { x, y } = getSmartPosition(newItemType);
    const shouldQueue = room.requireApproval && !isHost;

    setIsPosting(true);
    setError("");

    try {
      if (newItemType === "note") {
        if (!newContent.trim()) throw new Error("Write something before posting your note.");
        await addBoardNote(
          { roomId, content: newContent.trim(), author: effectName, color: noteColor, lane: selectedLane, x, y },
          shouldQueue,
        );
      } else {
        if (!selectedImage) throw new Error("Choose an image before posting.");
        await addBoardImage(
          { roomId, file: selectedImage, caption: imageCaption.trim(), author: effectName, lane: selectedLane, x, y },
          shouldQueue,
        );
      }

      setNewContent("");
      setSelectedImage(null);
      setImageCaption("");
      setNoteColor("yellow");
      setSelectedLane("");
      setIsAddModalOpen(false);

      if (shouldQueue) {
        setError("✅ Your post has been submitted for review!");
        setTimeout(() => setError(""), 3000);
      }
    } catch (postError) {
      setError(postError instanceof Error ? postError.message : "We couldn't post right now.");
    } finally {
      setIsPosting(false);
    }
  };

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/join/${roomId}` : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeaveBoard = useCallback(async () => {
    if (!roomId) { navigate("/"); return; }
    try { await leaveRoom(roomId); } catch { /* still leave */ }
    navigate("/");
  }, [navigate, roomId]);

  const handleReaction = async (itemId: string, reaction: ReactionType) => {
    if (!roomId || !myParticipantId) return;
    try {
      await toggleReaction(roomId, itemId, myParticipantId, reaction);
    } catch { /* silent */ }
  };

  const handleSavePrompt = async () => {
    if (!roomId) return;
    const text = promptDraft.trim();
    if (text) {
      await setPrompt(roomId, text);
    } else {
      await clearPrompt(roomId);
    }
    setIsEditingPrompt(false);
  };

  const noteColorClass = (color?: NoteColor) => {
    const match = NOTE_COLORS.find((c) => c.id === color);
    return match?.bg ?? "bg-yellow-100";
  };

  return (
    <div className="h-[100svh] w-screen overflow-hidden bg-surface relative font-body">
      <header className="absolute top-0 left-0 right-0 z-20 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 pointer-events-none">
        <div className="mx-auto flex w-full max-w-7xl items-start justify-between gap-3">
          <div className="pointer-events-auto max-w-[calc(100%-4rem)] rounded-[1.4rem] sm:rounded-full border border-outline-variant/15 bg-surface-container-lowest/92 px-3 py-2 shadow-sm backdrop-blur-xl sm:max-w-none sm:px-6 sm:py-3">
            <p className="hidden sm:block text-[11px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
              Live Board
            </p>
            <div className="flex items-center gap-2 sm:mt-1 sm:gap-4">
              <button type="button" onClick={handleLeaveBoard} className="hidden sm:inline-flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant hover:bg-surface-variant transition-colors">
                <ArrowLeft className="w-4 h-4" /> Leave
              </button>
              <h1 className="font-headline font-bold text-[0.95rem] sm:text-xl text-on-surface leading-tight truncate max-w-[11.5rem] sm:max-w-none">
                {room?.name ?? "Loading board..."}
              </h1>
              <div className="hidden sm:block h-4 w-px bg-outline-variant/50" />
              {/* Presence */}
              <div className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant shrink-0">
                <div className="flex -space-x-1.5">
                  {visibleParticipants.map((p) => (
                    <div key={p.id} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary-container border-2 border-surface-container-lowest flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-on-primary-container" title={p.name}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
                <span>{participants.length}</span>
              </div>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2 self-start relative">
            {/* Share */}
            <button type="button" onClick={() => setIsShareOpen((v) => !v)} className="bg-surface-container-lowest/90 backdrop-blur-xl p-3 rounded-full shadow-sm border border-outline-variant/15 text-on-surface hover:bg-surface-variant transition-colors" title="Share invite link">
              <Link2 className="w-5 h-5" />
            </button>

            {isShareOpen ? (
              <div className="absolute top-full right-0 mt-2 w-80 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest/95 backdrop-blur-xl shadow-lg overflow-hidden z-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant mb-3">Invite Link</p>
                <div className="flex gap-2 mb-3">
                  <input type="text" readOnly value={shareUrl} className="flex-1 bg-surface-container-low rounded-xl px-3 py-2 text-sm text-on-surface outline-none truncate" />
                  <button onClick={handleCopyLink} className="bg-primary text-on-primary px-3 py-2 rounded-xl text-sm font-bold hover:bg-primary-dim transition-colors flex items-center gap-1.5 shrink-0">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                {room?.shortCode ? (
                  <div className="flex items-center gap-2 bg-surface-container-low rounded-xl px-3 py-2.5">
                    <Hash className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-on-surface-variant">Room Code:</span>
                    <span className="text-lg font-bold text-primary tracking-widest">{room.shortCode}</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Host controls */}
            {isHost ? (
              <>
                <button type="button" onClick={() => setIsHostPanelOpen((v) => !v)} className="bg-surface-container-lowest/90 backdrop-blur-xl p-3 rounded-full shadow-sm border border-outline-variant/15 text-on-surface hover:bg-surface-variant transition-colors" title="Host controls">
                  <Settings className="w-5 h-5" />
                </button>
                <Link to={`/summary/${roomId}`} className="hidden sm:inline-flex bg-primary text-on-primary px-6 py-3 rounded-full font-bold text-sm hover:bg-primary-dim transition-colors shadow-md">
                  End Event
                </Link>

                {isHostPanelOpen ? (
                  <div className="absolute top-full right-0 mt-2 w-72 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest/95 backdrop-blur-xl shadow-lg overflow-hidden z-50">
                    <div className="p-4 border-b border-outline-variant/15">
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">Host Controls</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <button onClick={() => { updateRoomSettings(roomId, { allowPosts: !room?.allowPosts }); }} className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface hover:bg-surface-variant transition-colors text-left">
                        {room?.allowPosts ? <Lock className="w-4 h-4 text-on-surface-variant" /> : <Unlock className="w-4 h-4 text-primary" />}
                        {room?.allowPosts ? "Disable posting" : "Enable posting"}
                      </button>
                      {/* Move mode selector */}
                      <div className="px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 mb-1.5">Post movement</p>
                        {(["free", "own", "host"] as MoveMode[]).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => updateRoomSettings(roomId, { moveMode: mode })}
                            className={cn(
                              "flex w-full items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors text-left mb-0.5",
                              room?.moveMode === mode
                                ? "bg-primary/10 text-primary"
                                : "text-on-surface-variant hover:bg-surface-variant",
                            )}
                          >
                            <span className={cn("w-2 h-2 rounded-full shrink-0", room?.moveMode === mode ? "bg-primary" : "bg-outline-variant/40")} />
                            {MOVE_MODE_LABELS[mode]}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => { updateRoomSettings(roomId, { lockedBoard: !room?.lockedBoard }); }} className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface hover:bg-surface-variant transition-colors text-left">
                        {room?.lockedBoard ? <Unlock className="w-4 h-4 text-primary" /> : <Lock className="w-4 h-4 text-on-surface-variant" />}
                        {room?.lockedBoard ? "Unlock board" : "Lock board (freeze all)"}                      </button>
                      <button onClick={() => { updateRoomSettings(roomId, { anonymousMode: !room?.anonymousMode }); }} className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface hover:bg-surface-variant transition-colors text-left">
                        <Type className="w-4 h-4 text-on-surface-variant" />
                        {room?.anonymousMode ? "Show names" : "Anonymous mode"}
                      </button>
                      <button onClick={() => { updateRoomSettings(roomId, { requireApproval: !room?.requireApproval }); }} className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface hover:bg-surface-variant transition-colors text-left">
                        <MessageSquareText className="w-4 h-4 text-on-surface-variant" />
                        {room?.requireApproval ? "Auto-approve posts" : "Require approval"}
                      </button>
                      <div className="h-px bg-outline-variant/20 my-1" />
                      <button onClick={() => { setIsEditingPrompt(true); setPromptDraft(room?.prompt ?? ""); setIsHostPanelOpen(false); }} className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface hover:bg-surface-variant transition-colors text-left">
                        <MessageSquareText className="w-4 h-4 text-primary" />
                        {room?.prompt ? "Edit prompt" : "Set a prompt"}
                      </button>
                      <Link to={`/board/${roomId}/moderation`} onClick={() => setIsHostPanelOpen(false)} className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface hover:bg-surface-variant transition-colors text-left">
                        <Settings className="w-4 h-4 text-on-surface-variant" />
                        Moderation panel
                      </Link>
                      <div className="h-px bg-outline-variant/20 my-1" />
                      <button onClick={() => { if (window.confirm("Clear ALL posts from the board? This cannot be undone.")) { clearAllBoardItems(roomId); } }} className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-error hover:bg-error/10 transition-colors text-left">
                        <Trash2 className="w-4 h-4" />
                        Clear board
                      </button>
                      <button onClick={async () => { if (window.confirm("End this room? It will be marked as closed.")) { await endRoom(roomId); navigate(`/summary/${roomId}`); } }} className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-error hover:bg-error/10 transition-colors text-left">
                        <LogOut className="w-4 h-4" />
                        End event
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <button type="button" onClick={handleLeaveBoard} className="hidden sm:inline-flex bg-surface-container-lowest/90 backdrop-blur-xl px-4 py-3 rounded-full shadow-sm border border-outline-variant/15 text-on-surface text-sm font-bold hover:bg-surface-variant transition-colors">
                Leave
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Prompt banner */}
      {room?.prompt && !isEditingPrompt ? (
        <div className="absolute top-[4.5rem] sm:top-[5.5rem] left-1/2 -translate-x-1/2 z-20 pointer-events-auto max-w-lg w-[calc(100%-2rem)]">
          <div className="bg-primary-container/90 backdrop-blur-xl text-on-primary-container px-5 py-3 rounded-2xl shadow-md border border-primary/20 text-center animate-[fadeIn_0.3s_ease-out]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-1 opacity-70">Prompt</p>
            <p className="font-medium text-sm sm:text-base">{room.prompt}</p>
          </div>
        </div>
      ) : null}

      {/* Prompt editor modal */}
      {isEditingPrompt ? (
        <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center z-[55] p-4">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-headline text-xl font-bold text-on-surface mb-4">Set a Prompt</h3>
            <textarea value={promptDraft} onChange={(e) => setPromptDraft(e.target.value)} placeholder="e.g. What are you thankful for?" className="w-full h-24 bg-surface-container-low border-2 border-transparent focus:border-primary rounded-xl p-4 text-base outline-none transition-colors resize-none placeholder:text-on-surface-variant/50" autoFocus />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setIsEditingPrompt(false)} className="px-5 py-2.5 rounded-full font-bold text-on-surface-variant hover:bg-surface-variant transition-colors">Cancel</button>
              {room?.prompt ? (
                <button onClick={async () => { await clearPrompt(roomId); setIsEditingPrompt(false); }} className="px-5 py-2.5 rounded-full font-bold text-error hover:bg-error/10 transition-colors">Clear</button>
              ) : null}
              <button onClick={handleSavePrompt} className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-bold hover:bg-primary-dim transition-colors">Save</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Lane filter tabs */}
      {room?.lanes && room.lanes.length > 0 ? (
        <div className="absolute top-[4.5rem] sm:top-[5.5rem] left-3 sm:left-6 z-15 pointer-events-auto">
          <div className="flex gap-1.5 bg-surface-container-lowest/90 backdrop-blur-xl rounded-full p-1 border border-outline-variant/15 shadow-sm">
            <button onClick={() => setActiveLane("")} className={cn("px-3 py-1.5 rounded-full text-xs font-bold transition-colors", !activeLane ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-variant")}>
              All
            </button>
            {room.lanes.map((lane) => (
              <button key={lane} onClick={() => setActiveLane(lane)} className={cn("px-3 py-1.5 rounded-full text-xs font-bold transition-colors capitalize", activeLane === lane ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-variant")}>
                {lane}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Join toast */}
      {joinToast ? (
        <div className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-surface-container-lowest/95 backdrop-blur-xl text-on-surface px-4 py-2.5 rounded-full shadow-md border border-outline-variant/15 text-sm font-medium">
            {joinToast} ✨
          </div>
        </div>
      ) : null}

      {/* Locked banner */}
      {isLocked && !isHost ? (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="bg-surface-container-lowest/90 backdrop-blur-xl text-on-surface-variant px-5 py-2.5 rounded-full shadow-sm border border-outline-variant/15 text-sm font-bold flex items-center gap-2">
            <Lock className="w-4 h-4" /> Board is locked
          </div>
        </div>
      ) : null}

      {/* Posts disabled banner */}
      {!room?.allowPosts && !isHost ? (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="bg-surface-container-lowest/90 backdrop-blur-xl text-on-surface-variant px-5 py-2.5 rounded-full shadow-sm border border-outline-variant/15 text-sm font-bold">
            Posting is currently paused
          </div>
        </div>
      ) : null}

      <main className="absolute inset-0 overflow-auto bg-surface-container-low px-3 pt-16 pb-28 sm:bg-[radial-gradient(#e8e2d2_1px,transparent_1px)] sm:[background-size:24px_24px] sm:px-0 sm:pt-28 sm:pb-32">
        {error ? (
          <div className={cn("mx-auto mt-20 max-w-xl rounded-[2rem] px-6 py-5 shadow-sm", error.startsWith("✅") ? "border border-green-500/20 bg-green-50 text-green-700" : "border border-error/20 bg-error/10 text-error")}>
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="mx-auto mt-20 max-w-xl rounded-[2rem] border border-outline-variant/20 bg-surface-container-lowest/90 px-6 py-5 text-on-surface-variant shadow-sm">
            Loading the live board...
          </div>
        ) : null}

        {/* Pinned item */}
        {pinnedItem ? (
          <div className="mx-auto mt-2 sm:mt-4 max-w-lg mb-4 pointer-events-auto">
            <div className="bg-primary-container/20 border-2 border-primary/30 rounded-2xl p-4 relative">
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider mb-2">
                <Pin className="w-3.5 h-3.5" /> Pinned
              </div>
              {pinnedItem.type === "note" ? (
                <p className="text-sm font-medium text-on-surface">{pinnedItem.content}</p>
              ) : (
                <>
                  <img src={pinnedItem.imageUrl} alt="Pinned" className="w-full h-32 object-cover rounded-xl" referrerPolicy="no-referrer" />
                  {pinnedItem.caption ? <p className="text-xs text-on-surface/80 mt-2">{pinnedItem.caption}</p> : null}
                </>
              )}
              <p className="text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-wider mt-2">
                {room?.anonymousMode ? "Anonymous" : pinnedItem.author}
              </p>
            </div>
          </div>
        ) : null}

        {!error ? (
          <div
            ref={boardRef}
            className="relative mx-auto origin-top overflow-hidden rounded-[2rem] border border-outline-variant/15 bg-[radial-gradient(#e8e2d2_1px,transparent_1px)] [background-size:24px_24px] shadow-[0_18px_50px_rgba(47,33,17,0.08)] transition-transform duration-200 sm:rounded-[2.4rem]"
            style={{ width: boardWidth, height: stageHeight, transform: `scale(${viewScale})` }}
          >
            {filteredItems.map((item) => {
              const isOwn = item.participantId === myParticipantId;
              const canDrag = canMoveItem(item);
              const myReaction = myParticipantId ? item.reactedBy[myParticipantId] : undefined;
              const displayPosition = clampItemPosition(item, { x: item.x, y: item.y });

              return (
                <div
                  key={item.id}
                  onPointerDown={(event) => handlePointerDown(event, item.id)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className={cn(
                    "group absolute shadow-md hover:shadow-lg transition-shadow select-none",
                    canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-default",
                    item.type === "note"
                      ? `w-40 sm:w-48 lg:w-64 p-3.5 sm:p-4 lg:p-6 rounded-2xl ${noteColorClass(item.color)}`
                      : "w-[11.75rem] sm:w-[15.5rem] lg:w-80 rounded-2xl overflow-hidden bg-surface-container-lowest p-2 sm:p-2.5 lg:p-3",
                    draggingId === item.id ? "z-50 shadow-xl scale-105" : "z-10",
                  )}
                  style={{ left: displayPosition.x, top: displayPosition.y, touchAction: "none" }}
                >
                  {/* Actions — own posts or host */}
                  {(isOwn || isHost) ? (
                    <div className="absolute z-20 top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isHost ? (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); room?.pinnedItemId === item.id ? unpinItem(roomId) : pinItem(roomId, item.id); }}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-full bg-inverse-surface/60 text-inverse-on-surface hover:bg-inverse-surface/80 backdrop-blur-sm"
                          title={room?.pinnedItemId === item.id ? "Unpin" : "Pin"}
                        >
                          {room?.pinnedItemId === item.id ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); if (window.confirm("Delete this post?")) { deleteBoardItem(roomId, item.id); } }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-full bg-red-500/80 text-white hover:bg-red-600 backdrop-blur-sm"
                        title="Delete post"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : null}

                  {item.type === "note" ? (
                    <>
                      <p className="text-[0.95rem] sm:text-base lg:text-lg font-medium text-on-surface mb-2.5 sm:mb-3 lg:mb-4 leading-relaxed">{item.content}</p>
                      {item.lane ? (<span className="inline-block text-[9px] font-bold uppercase tracking-wider bg-black/5 text-on-surface-variant/60 px-2 py-0.5 rounded-full mb-2">{item.lane}</span>) : null}
                      <div className="text-[10px] sm:text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider">
                        {room?.anonymousMode ? "Anonymous" : item.author}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="relative group/img">
                        <img src={item.imageUrl} alt={`${item.author}'s post`} className="w-full h-32 sm:h-36 lg:h-48 object-cover rounded-xl" referrerPolicy="no-referrer" />
                        <a href={item.imageUrl} download={`vibeboard-${item.author}-${item.id}.jpg`} onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} className="absolute top-2 right-2 p-2 rounded-full bg-inverse-surface/60 text-inverse-on-surface opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-inverse-surface/80 backdrop-blur-sm" title="Download image">
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                      <div className="mt-1.5 px-0.5 pb-1">
                        {item.caption ? <p className="text-xs sm:text-[0.82rem] lg:text-sm text-on-surface/80 leading-snug line-clamp-2 mb-1">{item.caption}</p> : null}
                        {item.lane ? (<span className="inline-block text-[9px] font-bold uppercase tracking-wider bg-black/5 text-on-surface-variant/60 px-2 py-0.5 rounded-full mb-1">{item.lane}</span>) : null}
                        <p className="text-[10px] sm:text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider">
                          {room?.anonymousMode ? "Anonymous" : item.author}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Reactions bar */}
                  <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-black/5 flex-wrap" onPointerDown={(e) => e.stopPropagation()}>
                    {(Object.entries(REACTION_EMOJI) as [ReactionType, string][]).map(([type, emoji]) => {
                      const count = item.reactions[type] ?? 0;
                      const isActive = myReaction === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleReaction(item.id, type); }}
                          className={cn(
                            "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-all hover:scale-110",
                            isActive ? "bg-primary/15 ring-1 ring-primary/30" : "hover:bg-black/5",
                            count === 0 && !isActive ? "opacity-40 group-hover:opacity-100" : "",
                          )}
                        >
                          <span className="text-sm">{emoji}</span>
                          {count > 0 ? <span className="text-[10px] font-bold tabular-nums">{count}</span> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </main>

      {/* Mobile zoom */}
      <div className="pointer-events-none absolute right-4 bottom-[max(5.75rem,calc(env(safe-area-inset-bottom)+5.25rem))] z-20 sm:hidden">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-outline-variant/15 bg-surface-container-lowest/95 px-1.5 py-1.5 shadow-md backdrop-blur-xl">
          <button type="button" onClick={() => setViewScale((s) => Math.max(minScale, Number((s - 0.08).toFixed(2))))} className="rounded-full p-2 text-on-surface hover:bg-surface-variant transition-colors"><ZoomOut className="h-4 w-4" /></button>
          <span className="min-w-10 text-center text-[10px] font-bold text-on-surface-variant tabular-nums">{Math.round(viewScale * 100)}%</span>
          <button type="button" onClick={() => setViewScale((s) => Math.min(maxScale, Number((s + 0.08).toFixed(2))))} className="rounded-full p-2 text-on-surface hover:bg-surface-variant transition-colors"><ZoomIn className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Desktop zoom */}
      <div className="pointer-events-none absolute left-1/2 top-[5.6rem] z-10 hidden -translate-x-1/2 sm:block">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-outline-variant/15 bg-surface-container-lowest/92 px-3 py-2 shadow-md backdrop-blur-xl">
          <button type="button" onClick={() => setViewScale((s) => Math.max(minScale, Number((s - 0.1).toFixed(2))))} className="rounded-full p-2 text-on-surface hover:bg-surface-variant transition-colors" title="Zoom out"><ZoomOut className="h-4 w-4" /></button>
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-on-surface-variant">{Math.round(viewScale * 100)}%</span>
          <button type="button" onClick={() => setViewScale((s) => Math.min(maxScale, Number((s + 0.1).toFixed(2))))} className="rounded-full p-2 text-on-surface hover:bg-surface-variant transition-colors" title="Zoom in"><ZoomIn className="h-4 w-4" /></button>
        </div>
      </div>

      {/* FAB */}
      {(room?.allowPosts || isHost) && room?.isOpen ? (
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 sm:right-8 w-14 h-14 sm:w-16 sm:h-16 bg-primary text-on-primary rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center z-30"
        >
          <Plus className="w-7 h-7 sm:w-8 sm:h-8" />
        </button>
      ) : null}

      <button type="button" onClick={handleLeaveBoard} className="sm:hidden absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-4 inline-flex items-center gap-2 rounded-full bg-surface-container-lowest/92 px-4 py-3 text-sm font-bold text-on-surface shadow-md backdrop-blur-xl border border-outline-variant/15 z-30">
        <ArrowLeft className="w-4 h-4" /> Leave
      </button>

      {/* Add item modal */}
      {isAddModalOpen ? (
        <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] shadow-xl overflow-hidden max-h-[92svh]">
            <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">Quick Post</p>
                <h2 className="font-headline text-2xl font-bold text-on-surface">Add to Board</h2>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-5 sm:p-8 overflow-y-auto">
              {/* Type selector */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <button onClick={() => setNewItemType("note")} className={cn("py-4 rounded-2xl border-2 font-bold text-base sm:text-lg flex flex-col items-center gap-2 transition-all cursor-pointer", newItemType === "note" ? "border-primary bg-primary-container/10 text-primary" : "border-outline-variant/30 text-on-surface-variant hover:border-outline-variant")}>
                  <Type className="w-6 h-6" /> Sticky Note
                </button>
                <button onClick={() => setNewItemType("image")} className={cn("py-4 rounded-2xl border-2 font-bold text-base sm:text-lg flex flex-col items-center gap-2 transition-all cursor-pointer", newItemType === "image" ? "border-primary bg-primary-container/10 text-primary" : "border-outline-variant/30 text-on-surface-variant hover:border-outline-variant")}>
                  <ImageIcon className="w-6 h-6" /> Image
                </button>
              </div>

              {newItemType === "note" ? (
                <>
                  <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="What's on your mind?" className="w-full h-36 bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl p-4 text-base sm:text-lg outline-none transition-colors resize-none placeholder:text-on-surface-variant/50" autoFocus />
                  {/* Color picker */}
                  <div className="flex items-center gap-2 mt-4">
                    <Palette className="w-4 h-4 text-on-surface-variant" />
                    <div className="flex gap-2">
                      {NOTE_COLORS.map((c) => (
                        <button key={c.id} type="button" onClick={() => setNoteColor(c.id)} className={cn("w-8 h-8 rounded-full border-2 transition-all", noteColor === c.id ? "border-primary scale-110 ring-2 ring-primary/20" : "border-transparent hover:scale-105")} style={{ backgroundColor: c.hex }} title={c.id} />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <label className="block border-2 border-dashed border-outline-variant/50 rounded-2xl p-6 text-center hover:border-primary hover:bg-primary-container/5 transition-colors cursor-pointer">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-xl mb-3" />
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-surface-variant text-on-surface-variant rounded-full flex items-center justify-center mx-auto mb-4"><Upload className="w-8 h-8" /></div>
                        <p className="font-bold text-on-surface mb-1">Choose an image to upload</p>
                        <p className="text-sm text-on-surface-variant">PNG, JPG, GIF, or WebP up to 5MB</p>
                      </>
                    )}
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => setSelectedImage(e.target.files?.[0] ?? null)} />
                    {selectedImage ? <p className="mt-2 text-sm font-medium text-primary">{selectedImage.name}</p> : null}
                  </label>
                  <input type="text" value={imageCaption} onChange={(e) => setImageCaption(e.target.value)} placeholder="Add a caption (optional)" maxLength={120} className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl px-4 py-3 text-base outline-none transition-colors placeholder:text-on-surface-variant/50" />
                </div>
              )}

              {/* Lane selector */}
              {room?.lanes && room.lanes.length > 0 ? (
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Category</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setSelectedLane("")} className={cn("px-3 py-1.5 rounded-full text-xs font-bold transition-colors", !selectedLane ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-variant")}>
                      None
                    </button>
                    {room.lanes.map((lane) => (
                      <button key={lane} type="button" onClick={() => setSelectedLane(lane)} className={cn("px-3 py-1.5 rounded-full text-xs font-bold transition-colors capitalize", selectedLane === lane ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-variant")}>
                        {lane}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="p-5 sm:p-6 bg-surface-container-low border-t border-outline-variant/20 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 rounded-full font-bold text-on-surface-variant hover:bg-surface-variant transition-colors">Cancel</button>
              <button onClick={handleAddItem} disabled={isPosting || (newItemType === "note" ? !newContent.trim() : !selectedImage)} className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold hover:bg-primary-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm">
                <Check className="w-5 h-5" />
                {isPosting ? "Posting..." : room?.requireApproval && !isHost ? "Submit for Review" : "Post to Board"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Name prompt modal */}
      {showNamePrompt ? (
        <div className="fixed inset-0 bg-inverse-surface/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-xl overflow-hidden">
            <div className="p-6 sm:p-8 text-center">
              <div className="w-16 h-16 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mx-auto mb-6"><Type className="w-8 h-8" /></div>
              <h2 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface mb-3">What's your name?</h2>
              <p className="text-on-surface-variant mb-6 sm:mb-8">This will show on your posts and to other participants.</p>
              <form onSubmit={(e) => { e.preventDefault(); handleNameSubmit(); }} className="space-y-4">
                <input type="text" value={promptName} onChange={(e) => setPromptName(e.target.value)} placeholder="Your display name" className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl px-5 py-4 text-base sm:text-lg outline-none transition-colors placeholder:text-on-surface-variant/50 text-center" autoFocus required />
                <button type="submit" className="w-full bg-primary text-on-primary py-4 rounded-full font-bold text-base sm:text-lg hover:bg-primary-dim transition-colors shadow-md">Join Board</button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
