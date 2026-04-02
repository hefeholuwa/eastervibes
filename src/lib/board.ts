import {
  get,
  onValue,
  orderByChild,
  push,
  query,
  ref as dbRef,
  remove,
  serverTimestamp,
  set,
  update,
  type DataSnapshot,
} from "firebase/database";
import { assertFirebaseConfigured, db } from "./firebase";

const MAX_IMAGE_SIZE = 800;
const JPEG_QUALITY = 0.65;
const MAX_BASE64_BYTES = 1_000_000; // ~1MB limit for RTDB writes

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read the image file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load the image."));
      img.onload = () => {
        let { width, height } = img;

        if (width > MAX_IMAGE_SIZE || height > MAX_IMAGE_SIZE) {
          const ratio = Math.min(MAX_IMAGE_SIZE / width, MAX_IMAGE_SIZE / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);

        if (dataUrl.length > MAX_BASE64_BYTES) {
          // Try with even lower quality
          const smallerUrl = canvas.toDataURL("image/jpeg", 0.4);
          if (smallerUrl.length > MAX_BASE64_BYTES) {
            reject(new Error("Image is too large even after compression. Try a smaller image."));
            return;
          }
          resolve(smallerUrl);
          return;
        }

        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type RoomVisibility = "public" | "private";

export type MoveMode = "free" | "own" | "host";

export const MOVE_MODE_LABELS: Record<MoveMode, string> = {
  free: "Everyone can move any post",
  own: "Users move their own posts",
  host: "Only host can move posts",
};

export type ReactionType = "heart" | "amen" | "clap" | "fire";

export const REACTION_EMOJI: Record<ReactionType, string> = {
  heart: "❤️",
  amen: "🙏",
  clap: "👏",
  fire: "🔥",
};

export const NOTE_COLORS = [
  { id: "yellow", bg: "bg-yellow-100", hex: "#fef9c3" },
  { id: "pink", bg: "bg-pink-100", hex: "#fce7f3" },
  { id: "blue", bg: "bg-blue-100", hex: "#dbeafe" },
  { id: "green", bg: "bg-green-100", hex: "#dcfce7" },
  { id: "purple", bg: "bg-purple-100", hex: "#f3e8ff" },
] as const;

export type NoteColor = (typeof NOTE_COLORS)[number]["id"];

export type Room = {
  id: string;
  name: string;
  visibility: RoomVisibility;
  theme: string;
  shortCode: string;
  allowPosts: boolean;
  requireApproval: boolean;
  isOpen: boolean;
  lockedBoard: boolean;
  moveMode: MoveMode;
  anonymousMode: boolean;
  prompt: string;
  lanes: string[];
  pinnedItemId: string;
  createdBy: string;
  createdAt?: number;
  updatedAt?: number;
};

export type BoardItem = {
  id: string;
  type: "note" | "image";
  content?: string;
  imageUrl?: string;
  caption?: string;
  color?: NoteColor;
  lane?: string;
  x: number;
  y: number;
  author: string;
  participantId: string;
  hidden: boolean;
  status: "approved" | "pending";
  reactions: Record<ReactionType, number>;
  reactedBy: Record<string, ReactionType>;
  createdAt?: number;
};

export type Participant = {
  id: string;
  name: string;
  role: "host" | "guest";
  joinedAt?: number;
  lastSeenAt?: number;
};

export type RecentBoard = {
  id: string;
  name: string;
  shortCode?: string;
  lastVisitedAt: number;
};

type CreateRoomInput = {
  name: string;
  theme: string;
  hostName: string;
  shortCode?: string;
};

type AddNoteInput = {
  roomId: string;
  content: string;
  author: string;
  color?: NoteColor;
  lane?: string;
  x: number;
  y: number;
};

type AddImageInput = {
  roomId: string;
  file: File;
  author: string;
  caption?: string;
  lane?: string;
  x: number;
  y: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PARTICIPANT_PREFIX = "eastervibes-participant";
const DISPLAY_NAME_PREFIX = "eastervibes-display-name";
const RECENT_BOARDS_KEY = "eastervibes-recent-boards";

// ─── Internal helpers ─────────────────────────────────────────────────────────

function ensureDb() {
  assertFirebaseConfigured();
  return db!;
}

function roomPath(roomId: string) {
  return `rooms/${roomId}`;
}

function itemsPath(roomId: string) {
  return `rooms/${roomId}/items`;
}

function pendingItemsPath(roomId: string) {
  return `rooms/${roomId}/pendingItems`;
}

function participantsPath(roomId: string) {
  return `rooms/${roomId}/participants`;
}

function roomRef(roomId: string) {
  return dbRef(ensureDb(), roomPath(roomId));
}

function itemsRef(roomId: string) {
  return dbRef(ensureDb(), itemsPath(roomId));
}

function pendingItemsRef(roomId: string) {
  return dbRef(ensureDb(), pendingItemsPath(roomId));
}

function participantsRef(roomId: string) {
  return dbRef(ensureDb(), participantsPath(roomId));
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

function parseRoom(id: string, value: Record<string, unknown> | null): Room | null {
  if (!value) return null;

  const rawLanes = value.lanes;
  let lanes: string[] = [];
  if (Array.isArray(rawLanes)) {
    lanes = rawLanes.filter((l): l is string => typeof l === "string");
  }

  return {
    id,
    name: String(value.name ?? "Untitled Room"),
    visibility: (value.visibility as RoomVisibility) ?? "public",
    theme: String(value.theme ?? "warm"),
    shortCode: String(value.shortCode ?? ""),
    allowPosts: Boolean(value.allowPosts ?? true),
    requireApproval: Boolean(value.requireApproval ?? false),
    isOpen: Boolean(value.isOpen ?? true),
    lockedBoard: Boolean(value.lockedBoard ?? false),
    moveMode: (["free", "own", "host"].includes(String(value.moveMode ?? "")) ? String(value.moveMode) : "free") as MoveMode,
    anonymousMode: Boolean(value.anonymousMode ?? false),
    prompt: typeof value.prompt === "string" ? value.prompt : "",
    lanes,
    pinnedItemId: typeof value.pinnedItemId === "string" ? value.pinnedItemId : "",
    createdBy: String(value.createdBy ?? "Host"),
    createdAt: typeof value.createdAt === "number" ? value.createdAt : undefined,
    updatedAt: typeof value.updatedAt === "number" ? value.updatedAt : undefined,
  };
}

function parseCollection<T>(
  snapshot: DataSnapshot,
  parser: (id: string, value: Record<string, unknown>) => T,
) {
  const value = snapshot.val() as Record<string, Record<string, unknown>> | null;
  if (!value) return [];

  return Object.entries(value).map(([id, entry]) => parser(id, entry));
}

function parseReactions(raw: unknown): Record<ReactionType, number> {
  const defaults: Record<ReactionType, number> = { heart: 0, amen: 0, clap: 0, fire: 0 };
  if (!raw || typeof raw !== "object") return defaults;
  const obj = raw as Record<string, unknown>;
  return {
    heart: typeof obj.heart === "number" ? obj.heart : 0,
    amen: typeof obj.amen === "number" ? obj.amen : 0,
    clap: typeof obj.clap === "number" ? obj.clap : 0,
    fire: typeof obj.fire === "number" ? obj.fire : 0,
  };
}

function parseReactedBy(raw: unknown): Record<string, ReactionType> {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  const result: Record<string, ReactionType> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === "string" && ["heart", "amen", "clap", "fire"].includes(val)) {
      result[key] = val as ReactionType;
    }
  }
  return result;
}

function parseItem(id: string, value: Record<string, unknown>): BoardItem {
  return {
    id,
    type: (value.type as "note" | "image") ?? "note",
    content: typeof value.content === "string" ? value.content : undefined,
    imageUrl: typeof value.imageUrl === "string" ? value.imageUrl : undefined,
    caption: typeof value.caption === "string" ? value.caption : undefined,
    color: typeof value.color === "string" ? (value.color as NoteColor) : undefined,
    lane: typeof value.lane === "string" ? value.lane : undefined,
    x: typeof value.x === "number" ? value.x : 120,
    y: typeof value.y === "number" ? value.y : 120,
    author: String(value.author ?? "Guest"),
    participantId: typeof value.participantId === "string" ? value.participantId : "",
    hidden: Boolean(value.hidden ?? false),
    status: (value.status as "approved" | "pending") ?? "approved",
    reactions: parseReactions(value.reactions),
    reactedBy: parseReactedBy(value.reactedBy),
    createdAt: typeof value.createdAt === "number" ? value.createdAt : undefined,
  };
}

function parseParticipant(id: string, value: Record<string, unknown>): Participant {
  return {
    id,
    name: String(value.name ?? "Guest"),
    role: (value.role as "host" | "guest") ?? "guest",
    joinedAt: typeof value.joinedAt === "number" ? value.joinedAt : undefined,
    lastSeenAt: typeof value.lastSeenAt === "number" ? value.lastSeenAt : undefined,
  };
}

// ─── ID generators ────────────────────────────────────────────────────────────

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 18);
}

function buildRoomId(name: string) {
  const base = slugify(name) || "room";
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

export function generateShortCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function normalizeShortCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

// ─── Local storage helpers ────────────────────────────────────────────────────

const GLOBAL_NAME_KEY = "vibe-global-name";

function displayNameKey(roomId: string) {
  return `${DISPLAY_NAME_PREFIX}:${roomId}`;
}

function participantKey(roomId: string) {
  return `${PARTICIPANT_PREFIX}:${roomId}`;
}

export function getStoredDisplayName(roomId: string) {
  if (typeof window === "undefined") return "";
  // Try room-specific first, then fall back to the global name
  return (
    window.localStorage.getItem(displayNameKey(roomId)) ||
    window.localStorage.getItem(GLOBAL_NAME_KEY) ||
    ""
  );
}

export function storeDisplayName(roomId: string, name: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(displayNameKey(roomId), name);
  // Also persist globally so it carries to new rooms
  window.localStorage.setItem(GLOBAL_NAME_KEY, name);
}

export function getStoredParticipantId(roomId: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(participantKey(roomId));
}

export function getParticipantId(roomId: string) {
  if (typeof window === "undefined") return crypto.randomUUID();

  const existing = getStoredParticipantId(roomId);
  if (existing) return existing;

  const next = crypto.randomUUID();
  window.localStorage.setItem(participantKey(roomId), next);
  return next;
}

export function clearRoomSession(roomId: string) {
  if (typeof window === "undefined") return;
  // Only clear the participant ID — keep display name for re-entry
  window.localStorage.removeItem(participantKey(roomId));
}

// ─── Recent boards ────────────────────────────────────────────────────────────

export function getRecentBoards(): RecentBoard[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(RECENT_BOARDS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as RecentBoard[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (entry) =>
          entry &&
          typeof entry.id === "string" &&
          typeof entry.name === "string" &&
          (typeof entry.shortCode === "string" || typeof entry.shortCode === "undefined") &&
          typeof entry.lastVisitedAt === "number",
      )
      .sort((left, right) => right.lastVisitedAt - left.lastVisitedAt);
  } catch {
    return [];
  }
}

export function saveRecentBoard(board: Pick<RecentBoard, "id" | "name" | "shortCode">) {
  if (typeof window === "undefined") return;

  const nextEntry: RecentBoard = {
    ...board,
    lastVisitedAt: Date.now(),
  };

  const nextBoards = [nextEntry, ...getRecentBoards().filter((entry) => entry.id !== board.id)].slice(0, 6);
  window.localStorage.setItem(RECENT_BOARDS_KEY, JSON.stringify(nextBoards));
}

// ─── Room CRUD ────────────────────────────────────────────────────────────────

export async function createRoom(input: CreateRoomInput) {
  const roomId = buildRoomId(input.name);
  const preferredCode = normalizeShortCode(input.shortCode ?? "");
  let shortCode = "";

  if (preferredCode) {
    if (preferredCode.length !== 6) {
      throw new Error("Room codes must be exactly 6 letters or numbers.");
    }

    const existingRoom = await findRoomByCode(preferredCode);
    if (existingRoom) {
      throw new Error("That room code is already taken. Try another one.");
    }

    shortCode = preferredCode;
  } else {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const candidate = generateShortCode();
      const existingRoom = await findRoomByCode(candidate);
      if (!existingRoom) {
        shortCode = candidate;
        break;
      }
    }

    if (!shortCode) {
      throw new Error("We couldn't generate a unique room code right now. Please try again.");
    }
  }

  await set(roomRef(roomId), {
    name: input.name,
    visibility: "public",
    theme: input.theme,
    shortCode,
    allowPosts: true,
    requireApproval: false,
    isOpen: true,
    lockedBoard: false,
    moveMode: "free",
    anonymousMode: false,
    prompt: "",
    lanes: [],
    pinnedItemId: "",
    createdBy: input.hostName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await upsertParticipant(roomId, input.hostName, "host");
  return roomId;
}

export async function getRoom(roomId: string) {
  const snapshot = await get(roomRef(roomId));
  const room = parseRoom(roomId, snapshot.val());

  if (!room) {
    throw new Error("That board doesn't exist yet.");
  }

  return room;
}

export async function findRoomByCode(code: string): Promise<Room | null> {
  const upperCode = code.trim().toUpperCase();
  if (upperCode.length !== 6) return null;

  // Query all rooms and find matching shortCode
  const roomsRef = dbRef(ensureDb(), "rooms");
  const snapshot = await get(query(roomsRef, orderByChild("shortCode")));
  const val = snapshot.val() as Record<string, Record<string, unknown>> | null;

  if (!val) return null;

  for (const [id, data] of Object.entries(val)) {
    if (String(data.shortCode ?? "").toUpperCase() === upperCode) {
      return parseRoom(id, data);
    }
  }

  return null;
}

export async function joinRoom(roomId: string, displayName: string) {
  const room = await getRoom(roomId);

  if (!room.isOpen) {
    throw new Error("This board has already been closed.");
  }

  await upsertParticipant(roomId, displayName, "guest");
  return room;
}

// ─── Participants ─────────────────────────────────────────────────────────────

export async function upsertParticipant(
  roomId: string,
  name: string,
  role: "host" | "guest" = "guest",
) {
  const participantId = getParticipantId(roomId);

  await update(dbRef(ensureDb(), `${participantsPath(roomId)}/${participantId}`), {
    name,
    role,
    joinedAt: serverTimestamp(),
    lastSeenAt: serverTimestamp(),
  });

  storeDisplayName(roomId, name);
  return participantId;
}

export async function removeParticipant(roomId: string, participantId: string) {
  await remove(dbRef(ensureDb(), `${participantsPath(roomId)}/${participantId}`));
}

export async function leaveRoom(roomId: string) {
  const participantId = getStoredParticipantId(roomId);

  if (participantId) {
    await removeParticipant(roomId, participantId);
  }

  clearRoomSession(roomId);
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export function subscribeToRoom(
  roomId: string,
  onNext: (room: Room | null) => void,
  onError?: (error: Error) => void,
) {
  try {
    return onValue(
      roomRef(roomId),
      (snapshot) => onNext(parseRoom(roomId, snapshot.val())),
      (error) => onError?.(error),
    );
  } catch (error) {
    onError?.(error as Error);
    return () => undefined;
  }
}

export function subscribeToBoardItems(
  roomId: string,
  onNext: (items: BoardItem[]) => void,
  onError?: (error: Error) => void,
) {
  try {
    return onValue(
      itemsRef(roomId),
      (snapshot) => {
        const items = parseCollection(snapshot, parseItem).sort(
          (left, right) => (left.createdAt ?? 0) - (right.createdAt ?? 0),
        );
        onNext(items);
      },
      (error) => onError?.(error),
    );
  } catch (error) {
    onError?.(error as Error);
    return () => undefined;
  }
}

export function subscribeToPendingItems(
  roomId: string,
  onNext: (items: BoardItem[]) => void,
  onError?: (error: Error) => void,
) {
  try {
    return onValue(
      pendingItemsRef(roomId),
      (snapshot) => {
        const items = parseCollection(snapshot, parseItem).sort(
          (left, right) => (left.createdAt ?? 0) - (right.createdAt ?? 0),
        );
        onNext(items);
      },
      (error) => onError?.(error),
    );
  } catch (error) {
    onError?.(error as Error);
    return () => undefined;
  }
}

export function subscribeToParticipants(
  roomId: string,
  onNext: (participants: Participant[]) => void,
  onError?: (error: Error) => void,
) {
  try {
    return onValue(
      participantsRef(roomId),
      (snapshot) => {
        const participants = parseCollection(snapshot, parseParticipant).sort(
          (left, right) => (left.joinedAt ?? 0) - (right.joinedAt ?? 0),
        );
        onNext(participants);
      },
      (error) => onError?.(error),
    );
  } catch (error) {
    onError?.(error as Error);
    return () => undefined;
  }
}

// ─── Board item CRUD ──────────────────────────────────────────────────────────

function buildItemPayload(
  type: "note" | "image",
  base: {
    author: string;
    roomId: string;
    x: number;
    y: number;
    content?: string;
    imageUrl?: string;
    caption?: string;
    color?: NoteColor;
    lane?: string;
    status?: "approved" | "pending";
  },
) {
  const participantId = getParticipantId(base.roomId);
  return {
    type,
    content: base.content ?? "",
    imageUrl: base.imageUrl ?? "",
    caption: base.caption ?? "",
    color: base.color ?? "",
    lane: base.lane ?? "",
    author: base.author,
    participantId,
    x: base.x,
    y: base.y,
    hidden: false,
    status: base.status ?? "approved",
    reactions: { heart: 0, amen: 0, clap: 0, fire: 0 },
    reactedBy: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export async function addBoardNote(input: AddNoteInput, requireApproval = false) {
  const target = requireApproval ? pendingItemsRef(input.roomId) : itemsRef(input.roomId);
  const newItemRef = push(target);

  await set(
    newItemRef,
    buildItemPayload("note", {
      ...input,
      status: requireApproval ? "pending" : "approved",
    }),
  );
}

export async function addBoardImage(input: AddImageInput, requireApproval = false) {
  const imageUrl = await compressImage(input.file);
  const target = requireApproval ? pendingItemsRef(input.roomId) : itemsRef(input.roomId);
  const newItemRef = push(target);

  await set(
    newItemRef,
    buildItemPayload("image", {
      ...input,
      imageUrl,
      status: requireApproval ? "pending" : "approved",
    }),
  );
}

export async function updateBoardItemPosition(
  roomId: string,
  itemId: string,
  x: number,
  y: number,
) {
  await update(dbRef(ensureDb(), `${itemsPath(roomId)}/${itemId}`), {
    x,
    y,
    updatedAt: serverTimestamp(),
  });
}

export async function updateBoardItemVisibility(
  roomId: string,
  itemId: string,
  hidden: boolean,
) {
  await update(dbRef(ensureDb(), `${itemsPath(roomId)}/${itemId}`), {
    hidden,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteBoardItem(roomId: string, itemId: string) {
  await remove(dbRef(ensureDb(), `${itemsPath(roomId)}/${itemId}`));
}

// ─── Approval queue ───────────────────────────────────────────────────────────

export async function approveItem(roomId: string, itemId: string) {
  // Read the pending item
  const snapshot = await get(dbRef(ensureDb(), `${pendingItemsPath(roomId)}/${itemId}`));
  const val = snapshot.val();
  if (!val) throw new Error("Pending item not found.");

  // Write to approved items
  const newItemRef = push(itemsRef(roomId));
  await set(newItemRef, { ...val, status: "approved" });

  // Remove from pending
  await remove(dbRef(ensureDb(), `${pendingItemsPath(roomId)}/${itemId}`));
}

export async function rejectItem(roomId: string, itemId: string) {
  await remove(dbRef(ensureDb(), `${pendingItemsPath(roomId)}/${itemId}`));
}

// ─── Reactions ────────────────────────────────────────────────────────────────

export async function toggleReaction(
  roomId: string,
  itemId: string,
  participantId: string,
  reaction: ReactionType,
) {
  const basePath = `${itemsPath(roomId)}/${itemId}`;
  const reactedByPath = `${basePath}/reactedBy/${participantId}`;
  const reactionsPath = `${basePath}/reactions`;

  // Read current state
  const snapshot = await get(dbRef(ensureDb(), reactedByPath));
  const currentReaction = snapshot.val() as string | null;

  if (currentReaction === reaction) {
    // Remove the reaction
    await remove(dbRef(ensureDb(), reactedByPath));
    const countRef = dbRef(ensureDb(), `${reactionsPath}/${reaction}`);
    const countSnap = await get(countRef);
    const current = (countSnap.val() as number) ?? 0;
    await set(countRef, Math.max(0, current - 1));
  } else {
    // If switching from another reaction, decrement old
    if (currentReaction && ["heart", "amen", "clap", "fire"].includes(currentReaction)) {
      const oldCountRef = dbRef(ensureDb(), `${reactionsPath}/${currentReaction}`);
      const oldSnap = await get(oldCountRef);
      const oldCount = (oldSnap.val() as number) ?? 0;
      await set(oldCountRef, Math.max(0, oldCount - 1));
    }

    // Set new reaction
    await set(dbRef(ensureDb(), reactedByPath), reaction);
    const newCountRef = dbRef(ensureDb(), `${reactionsPath}/${reaction}`);
    const newSnap = await get(newCountRef);
    const newCount = (newSnap.val() as number) ?? 0;
    await set(newCountRef, newCount + 1);
  }
}

// ─── Room settings / host controls ───────────────────────────────────────────

export async function updateRoomSettings(
  roomId: string,
  updates: Partial<Pick<Room, "allowPosts" | "requireApproval" | "isOpen" | "lockedBoard" | "moveMode" | "anonymousMode" | "lanes" | "pinnedItemId">>,
) {
  await update(roomRef(roomId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function setPrompt(roomId: string, text: string) {
  await update(roomRef(roomId), {
    prompt: text,
    updatedAt: serverTimestamp(),
  });
}

export async function clearPrompt(roomId: string) {
  await update(roomRef(roomId), {
    prompt: "",
    updatedAt: serverTimestamp(),
  });
}

export async function pinItem(roomId: string, itemId: string) {
  await update(roomRef(roomId), {
    pinnedItemId: itemId,
    updatedAt: serverTimestamp(),
  });
}

export async function unpinItem(roomId: string) {
  await update(roomRef(roomId), {
    pinnedItemId: "",
    updatedAt: serverTimestamp(),
  });
}

export async function clearAllBoardItems(roomId: string) {
  await remove(itemsRef(roomId));
}

export async function endRoom(roomId: string) {
  await update(roomRef(roomId), {
    isOpen: false,
    updatedAt: serverTimestamp(),
  });
}

// ─── Utility: total reaction count on an item ─────────────────────────────────

export function totalReactions(item: BoardItem): number {
  const r = item.reactions;
  return (r.heart ?? 0) + (r.amen ?? 0) + (r.clap ?? 0) + (r.fire ?? 0);
}
