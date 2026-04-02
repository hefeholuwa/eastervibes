import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Inbox,
  Settings,
  Shield,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  approveItem,
  deleteBoardItem,
  MOVE_MODE_LABELS,
  rejectItem,
  removeParticipant,
  subscribeToBoardItems,
  subscribeToPendingItems,
  subscribeToParticipants,
  subscribeToRoom,
  updateBoardItemVisibility,
  updateRoomSettings,
  type BoardItem,
  type MoveMode,
  type Participant,
  type Room,
} from "../lib/board";
import { cn } from "../lib/utils";

export default function Moderation() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<"settings" | "users" | "content" | "queue">("settings");
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [items, setItems] = useState<BoardItem[]>([]);
  const [pendingItems, setPendingItems] = useState<BoardItem[]>([]);
  const [error, setError] = useState("");

  const roomId = id ?? "";

  useEffect(() => {
    if (!roomId) return;

    const unsubRoom = subscribeToRoom(roomId, setRoom, (roomError) =>
      setError(roomError.message),
    );
    const unsubParticipants = subscribeToParticipants(roomId, setParticipants, (participantError) =>
      setError(participantError.message),
    );
    const unsubItems = subscribeToBoardItems(roomId, setItems, (itemsError) =>
      setError(itemsError.message),
    );
    const unsubPending = subscribeToPendingItems(roomId, setPendingItems, (pendingError) =>
      setError(pendingError.message),
    );

    return () => {
      unsubRoom();
      unsubParticipants();
      unsubItems();
      unsubPending();
    };
  }, [roomId]);

  return (
    <div className="min-h-[100svh] bg-surface flex flex-col md:flex-row font-body">
      <aside className="w-full md:w-80 bg-surface-container-lowest border-b md:border-b-0 md:border-r border-outline-variant/20 flex flex-col">
        <div className="px-4 sm:px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-5 border-b border-outline-variant/20">
          <Link
            to={`/board/${roomId}`}
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors font-bold mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Board
          </Link>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            Event Control
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {room?.name ?? "Loading board..."}
          </p>
        </div>

        <nav className="flex-1 p-3 sm:p-4">
          <div className="grid grid-cols-3 gap-2 md:grid-cols-1 md:gap-2">
            {[
              ["settings", "Room Settings", Settings],
              ["queue", `Queue (${pendingItems.length})`, Inbox],
              ["users", "Users", Users],
              ["content", "Content", Shield],
            ].map(([tabKey, label, Icon]) => (
              <button
                key={tabKey}
                onClick={() =>
                  setActiveTab(tabKey as "settings" | "users" | "content")
                }
                className={cn(
                  "w-full flex items-center justify-center md:justify-start gap-2 md:gap-3 px-3 md:px-4 py-3 rounded-xl font-bold transition-colors text-center md:text-left cursor-pointer",
                  activeTab === tabKey
                    ? "bg-primary-container/20 text-primary"
                    : "text-on-surface-variant hover:bg-surface-variant",
                )}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        </nav>
      </aside>

      <main className="flex-1 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 md:p-10 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {error ? (
            <div className="mb-6 rounded-2xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
              {error}
            </div>
          ) : null}

          {activeTab === "settings" ? (
            <div className="space-y-8">
              <h2 className="font-headline text-3xl font-bold text-on-surface mb-6">
                Room Settings
              </h2>
              <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-8 border border-outline-variant/20 shadow-sm space-y-6">
                <ToggleRow
                  label="Allow new posts"
                  description="Guests can add new sticky notes and images."
                  checked={room?.allowPosts ?? true}
                  onChange={(checked) => roomId && updateRoomSettings(roomId, { allowPosts: checked })}
                />
                <ToggleRow
                  label="Require approval"
                  description="Review posts before they appear on the board."
                  checked={room?.requireApproval ?? false}
                  onChange={(checked) => roomId && updateRoomSettings(roomId, { requireApproval: checked })}
                />
                <ToggleRow
                  label="Lock board"
                  description="Fully freeze all movement on the board."
                  checked={room?.lockedBoard ?? false}
                  onChange={(checked) => roomId && updateRoomSettings(roomId, { lockedBoard: checked })}
                />
                <div>
                  <h3 className="font-bold text-lg text-on-surface">Post movement mode</h3>
                  <p className="text-on-surface-variant text-sm mb-3">Who can drag and rearrange posts on the board.</p>
                  <div className="space-y-2">
                    {(["free", "own", "host"] as MoveMode[]).map((mode) => (
                      <label
                        key={mode}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors border-2",
                          room?.moveMode === mode
                            ? "border-primary bg-primary-container/10"
                            : "border-outline-variant/20 hover:border-outline-variant/40",
                        )}
                      >
                        <input
                          type="radio"
                          name="moveMode"
                          checked={room?.moveMode === mode}
                          onChange={() => roomId && updateRoomSettings(roomId, { moveMode: mode })}
                          className="accent-primary"
                        />
                        <span className="text-sm font-medium text-on-surface">{MOVE_MODE_LABELS[mode]}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <ToggleRow
                  label="Anonymous mode"
                  description="Hide author names on all posts."
                  checked={room?.anonymousMode ?? false}
                  onChange={(checked) => roomId && updateRoomSettings(roomId, { anonymousMode: checked })}
                />
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-error">Close Room</h3>
                    <p className="text-on-surface-variant text-sm">
                      End the event and generate a summary.
                    </p>
                  </div>
                  <Link
                    to={`/summary/${roomId}`}
                    onClick={() => roomId && updateRoomSettings(roomId, { isOpen: false })}
                    className="bg-error/10 text-error hover:bg-error/20 px-6 py-2.5 rounded-full font-bold transition-colors"
                  >
                    End Event
                  </Link>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "queue" ? (
            <div className="space-y-8">
              <h2 className="font-headline text-3xl font-bold text-on-surface mb-6">Approval Queue</h2>
              {pendingItems.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/20 shadow-sm text-center">
                  <Inbox className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
                  <p className="text-on-surface-variant font-medium">No pending posts</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {pendingItems.map((item) => (
                    <div key={item.id} className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 border border-outline-variant/20 shadow-sm flex flex-col">
                      <div className="flex-1 mb-4">
                        {item.type === "note" ? (
                          <div className="bg-yellow-100 p-6 rounded-2xl h-full">
                            <p className="text-lg font-medium text-on-surface">{item.content}</p>
                          </div>
                        ) : (
                          <>
                            <img src={item.imageUrl} alt={`${item.author}'s post`} className="w-full h-48 object-cover rounded-2xl" referrerPolicy="no-referrer" />
                            {item.caption ? <p className="text-sm text-on-surface-variant mt-2">{item.caption}</p> : null}
                          </>
                        )}
                      </div>
                      <div className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">By {item.author}</div>
                      <div className="flex gap-2">
                        <button onClick={() => approveItem(roomId, item.id)} className="flex-1 flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2.5 rounded-full font-bold transition-colors">
                          <Check className="w-4 h-4" /> Approve
                        </button>
                        <button onClick={() => rejectItem(roomId, item.id)} className="flex-1 flex items-center justify-center gap-2 bg-error/10 text-error hover:bg-error/20 px-4 py-2.5 rounded-full font-bold transition-colors">
                          <X className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {activeTab === "users" ? (
            <div className="space-y-8">
              <h2 className="font-headline text-3xl font-bold text-on-surface mb-6">
                Manage Users
              </h2>
              <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-sm overflow-hidden">
                <ul className="divide-y divide-outline-variant/20">
                  {participants.map((participant) => (
                    <li
                      key={participant.id}
                      className="p-4 sm:p-6 flex items-center justify-between gap-4 hover:bg-surface-container-low/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-lg">
                          {participant.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-on-surface truncate">
                            {participant.name}
                          </p>
                          <div className="text-sm text-on-surface-variant capitalize">
                            {participant.role}
                          </div>
                        </div>
                      </div>
                      {participant.role !== "host" ? (
                        <button
                          onClick={() => removeParticipant(roomId, participant.id)}
                          className="text-error hover:bg-error/10 p-2 rounded-full transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          {activeTab === "content" ? (
            <div className="space-y-8">
              <h2 className="font-headline text-3xl font-bold text-on-surface mb-6">
                Content Moderation
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 border border-outline-variant/20 shadow-sm flex flex-col"
                  >
                    <div className="flex-1 mb-6">
                      {item.type === "note" ? (
                        <div className="bg-yellow-100 p-6 rounded-2xl h-full">
                          <p className="text-lg font-medium text-on-surface">
                            {item.content}
                          </p>
                        </div>
                      ) : (
                        <img
                          src={item.imageUrl}
                          alt={`${item.author}'s post`}
                          className="w-full h-48 object-cover rounded-2xl"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-outline-variant/20">
                      <div className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">
                        By {item.author}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            updateBoardItemVisibility(roomId, item.id, !item.hidden)
                          }
                          className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors"
                          title={item.hidden ? "Show on board" : "Hide from board"}
                        >
                          {item.hidden ? (
                            <Eye className="w-5 h-5" />
                          ) : (
                            <EyeOff className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteBoardItem(roomId, item.id)}
                          className="p-2 text-error hover:bg-error/10 rounded-full transition-colors"
                          title="Delete post"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-bold text-lg text-on-surface">{label}</h3>
        <p className="text-on-surface-variant text-sm">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <div className="w-14 h-7 bg-surface-variant rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:border-outline-variant after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary" />
      </label>
    </div>
  );
}
