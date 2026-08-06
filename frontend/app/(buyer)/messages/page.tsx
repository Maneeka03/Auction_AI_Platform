"use client";

import { MessageSquare, Plus, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CreateGroupModal } from "@/components/messaging/CreateGroupModal";
import { MessageView } from "@/components/messaging/MessageView";
import { NewDMModal } from "@/components/messaging/NewDMModal";
import {
  getDmThread,
  getGroupMessages,
  listDmThreads,
  listGroups,
  sendDm,
  sendGroupMessage,
} from "@/lib/api/messages";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import { listNotifications, markNotificationsRead } from "@/lib/api/notifications";
import type { ChatUser, DmMessage, DmThread, GroupChat, GroupMessage } from "@/types/messaging";

type Tab = "dms" | "groups";

type ActiveThread =
  | { kind: "dm"; user: DmThread | ChatUser }
  | { kind: "group"; group: GroupChat };

function initialsFromName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function BuyerMessagesPage() {
  const { session, accessToken } = useAuth();
  const [tab, setTab] = useState<Tab>("dms");
  const [dmThreads, setDmThreads] = useState<DmThread[]>([]);
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [active, setActive] = useState<ActiveThread | null>(null);
  const [dmMessages, setDmMessages] = useState<DmMessage[]>([]);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [showNewDM, setShowNewDM] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLists = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [dms, grps] = await Promise.all([listDmThreads(accessToken), listGroups(accessToken)]);
      setDmThreads(dms);
      setGroups(grps);
      setListError(null);
    } catch (err) {
      setListError(err instanceof ApiRequestError ? err.message : "Failed to load messages.");
    }
  }, [accessToken]);

  useEffect(() => {
    void fetchLists();
    pollRef.current = setInterval(() => void fetchLists(), 3_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchLists]);

  // Auto-clear new_message notification badges when the messages page is opened
  useEffect(() => {
    if (!accessToken) return;
    async function clearMessageNotifs() {
      try {
        const result = await listNotifications(accessToken!, { limit: 50 });
        const unreadMsgIds = result.items
          .filter((n) => n.kind === "new_message" && !n.read_at)
          .map((n) => n.id);
        if (unreadMsgIds.length > 0) {
          await markNotificationsRead(accessToken!, { ids: unreadMsgIds });
        }
      } catch {}
    }
    void clearMessageNotifs();
  }, [accessToken]);

  const fetchActiveMessages = useCallback(async () => {
    if (!accessToken || !active) return;
    try {
      if (active.kind === "dm") {
        const userId = "user_id" in active.user ? active.user.user_id : active.user.id;
        const msgs = await getDmThread(accessToken, userId);
        setDmMessages(msgs);
      } else {
        const msgs = await getGroupMessages(accessToken, active.group.id);
        setGroupMessages(msgs);
      }
    } catch {
      // silent — will retry on next poll
    }
  }, [accessToken, active]);

  useEffect(() => {
    if (!active) return;
    setLoadingMessages(true);
    void fetchActiveMessages().finally(() => setLoadingMessages(false));
    const poll = setInterval(() => void fetchActiveMessages(), 3_000);
    return () => clearInterval(poll);
  }, [active, fetchActiveMessages]);

  async function handleSendDm(body: string) {
    if (!accessToken || !active || active.kind !== "dm") return;
    const userId = "user_id" in active.user ? active.user.user_id : active.user.id;
    await sendDm(accessToken, userId, body);
    await fetchActiveMessages();
    void fetchLists();
  }

  async function handleSendGroup(body: string) {
    if (!accessToken || !active || active.kind !== "group") return;
    await sendGroupMessage(accessToken, active.group.id, body);
    await fetchActiveMessages();
    void fetchLists();
  }

  function openDmFromSearch(user: ChatUser) {
    setShowNewDM(false);
    setTab("dms");
    setActive({ kind: "dm", user });
  }

  function openNewGroup(group: GroupChat) {
    setShowNewGroup(false);
    setGroups((prev) => [group, ...prev]);
    setTab("groups");
    setActive({ kind: "group", group });
  }

  const activeTitle =
    active === null
      ? ""
      : active.kind === "dm"
        ? active.user.full_name
        : active.group.name;

  return (
    <>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Left panel */}
        <aside className={`flex w-full shrink-0 flex-col border-r border-neutral-200 bg-white md:w-72 ${active ? "hidden md:flex" : "flex"}`}>
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setTab("dms")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === "dms"
                    ? "bg-brand-50 text-brand-700"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                <MessageSquare size={14} /> DMs
              </button>
              <button
                type="button"
                onClick={() => setTab("groups")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === "groups"
                    ? "bg-brand-50 text-brand-700"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                <Users size={14} /> Groups
              </button>
            </div>
            <button
              type="button"
              onClick={() => (tab === "dms" ? setShowNewDM(true) : setShowNewGroup(true))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
              title={tab === "dms" ? "New DM" : "New Group"}
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {listError ? (
              <p className="p-4 text-sm text-red-600">{listError}</p>
            ) : tab === "dms" ? (
              dmThreads.length === 0 ? (
                <p className="p-4 text-sm text-neutral-400">No conversations yet.</p>
              ) : (
                dmThreads.map((t) => {
                  const isActive =
                    active?.kind === "dm" &&
                    ("user_id" in active.user
                      ? active.user.user_id === t.user_id
                      : active.user.id === t.user_id);
                  return (
                    <button
                      key={t.user_id}
                      type="button"
                      onClick={() => setActive({ kind: "dm", user: t })}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                        isActive ? "bg-brand-50" : "hover:bg-neutral-50"
                      }`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                        {initialsFromName(t.full_name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="truncate text-sm font-medium text-neutral-900">
                            {t.full_name}
                          </span>
                          <span className="ml-2 shrink-0 text-xs text-neutral-400">
                            {formatRelative(t.last_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="truncate text-xs text-neutral-500">{t.last_message}</span>
                          {t.unread > 0 ? (
                            <span className="ml-2 flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white">
                              {t.unread}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })
              )
            ) : groups.length === 0 ? (
              <p className="p-4 text-sm text-neutral-400">No group chats yet.</p>
            ) : (
              groups.map((g) => {
                const isActive = active?.kind === "group" && active.group.id === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setActive({ kind: "group", group: g })}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                      isActive ? "bg-brand-50" : "hover:bg-neutral-50"
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-sm font-semibold text-neutral-600">
                      <Users size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate text-sm font-medium text-neutral-900">{g.name}</span>
                        {g.last_at ? (
                          <span className="ml-2 shrink-0 text-xs text-neutral-400">
                            {formatRelative(g.last_at)}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="truncate text-xs text-neutral-500">
                          {g.last_message ?? "No messages yet"}
                        </span>
                        <span className="ml-2 shrink-0 text-xs text-neutral-400">
                          {g.member_count} members
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right panel */}
        <main className={`flex-1 flex-col bg-neutral-50 md:flex ${active ? "flex" : "hidden md:flex"}`}>
          {active === null ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <MessageSquare size={40} className="mx-auto mb-3 text-neutral-300" />
                <p className="text-sm text-neutral-500">Select a conversation to start messaging</p>
              </div>
            </div>
          ) : (
           <MessageView
            title={activeTitle}
            messages={active.kind === "dm" ? dmMessages : groupMessages}
            currentUserId={session?.id ?? ""}
            loading={loadingMessages}
            onSend={active.kind === "dm" ? handleSendDm : handleSendGroup}
          />
          )}
        </main>
      </div>

      {showNewDM ? (
        <NewDMModal onClose={() => setShowNewDM(false)} onSelect={openDmFromSearch} />
      ) : null}
      {showNewGroup ? (
        <CreateGroupModal onClose={() => setShowNewGroup(false)} onCreate={openNewGroup} />
      ) : null}
    </>
  );
}
