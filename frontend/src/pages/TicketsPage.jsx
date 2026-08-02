import React, { useEffect, useState, useCallback, useRef } from "react";
import { ticketsApi, applicationsApi } from "../api/client";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  RefreshCw, Plus, X, Send, AlertCircle, MessageSquare,
  Clock, CheckCircle2, XCircle, RotateCcw, Search,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────

const STATUS_STYLE = {
  OPEN:        { cls: "bg-amber-100 text-amber-700",   icon: Clock },
  IN_PROGRESS: { cls: "bg-blue-100 text-blue-700",     icon: Clock },
  RESOLVED:    { cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  REOPENED:    { cls: "bg-orange-100 text-orange-700", icon: RotateCcw },
  CLOSED:      { cls: "bg-slate-100 text-slate-500",   icon: XCircle },
};

const PRIORITY_STYLE = {
  LOW:    "bg-slate-100 text-slate-500",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH:   "bg-red-100 text-red-700",
};

const ALL_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "REOPENED", "CLOSED"];

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ── Field helper ──────────────────────────────────────────────────────────

function Field({ label, required, children }) {
  return (
    <div className="relative">
      <label className={`absolute -top-2.5 left-3 bg-white px-1 text-xs font-medium text-slate-500 z-10 ${required ? "after:content-['*'] after:text-red-500 after:ml-0.5" : ""}`}>
        {label}
      </label>
      {children}
    </div>
  );
}
const inp = "w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none";

// ── Create Ticket Modal ───────────────────────────────────────────────────

function CreateTicketModal({ categories, applications, userId, onClose, onCreated }) {
  const [form, setForm] = useState({
    subject: "", description: "", categoryId: categories[0]?.id || "", priority: "MEDIUM", applicationId: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await ticketsApi.create({
        subject: form.subject,
        description: form.description,
        categoryId: form.categoryId,
        priority: form.priority,
        raisedByUserId: userId,
        applicationId: form.applicationId || null,
      });
      onCreated();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 py-10 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-lg font-bold text-slate-900">Raise New Ticket</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          <Field label="Subject" required>
            <input required value={form.subject} onChange={e => set("subject", e.target.value)}
              className={inp} placeholder="Brief description of the issue" />
          </Field>
          <Field label="Related Application (optional)">
            <select value={form.applicationId} onChange={e => set("applicationId", e.target.value)} className={inp}>
              <option value="">— General Query (not linked to an application) —</option>
              {applications.map(a => (
                <option key={a.id} value={a.id}>
                  {a.applicationNo || a.id.slice(0, 8).toUpperCase()} · {a.status}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category" required>
              <select required value={form.categoryId} onChange={e => set("categoryId", e.target.value)} className={inp}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select value={form.priority} onChange={e => set("priority", e.target.value)} className={inp}>
                {["LOW", "MEDIUM", "HIGH"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Description">
            <textarea rows={4} value={form.description} onChange={e => set("description", e.target.value)}
              className={`${inp} resize-none`} placeholder="Provide details about your issue…" />
          </Field>

          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Raising…" : "Raise Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Ticket Detail Panel ───────────────────────────────────────────────────

function TicketPanel({ ticket, userId, onClose, onUpdated }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [reply, setReply]       = useState("");
  const [sending, setSending]   = useState(false);
  const [status, setStatus]     = useState(ticket.status);
  const [error, setError]       = useState(null);
  const bottomRef               = useRef(null);

  const loadMessages = useCallback(async () => {
    try {
      setMessages(await ticketsApi.messages(ticket.id));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [ticket.id]);

  useEffect(() => { loadMessages(); }, [loadMessages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function sendReply(e) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await ticketsApi.addMessage(ticket.id, {
        senderUserId: userId,
        senderType: "OFFICER",
        message: reply.trim(),
        attachmentPath: null,
      });
      setReply("");
      await loadMessages();
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  async function handleStatusChange(newStatus) {
    try {
      await ticketsApi.changeStatus(ticket.id, newStatus, userId);
      setStatus(newStatus);
      onUpdated();
    } catch (e) {
      setError(e.message);
    }
  }

  const s = STATUS_STYLE[status] || STATUS_STYLE.OPEN;
  const SIcon = s.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/30">
      <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4 flex-shrink-0">
          <div className="min-w-0 mr-3">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{ticket.ticketNo}</div>
            <h2 className="text-base font-bold text-slate-800 mt-0.5 truncate">{ticket.subject}</h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.cls}`}>
                <SIcon size={11} /> {status.replace("_", " ")}
              </span>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLE[ticket.priority] || "bg-slate-100 text-slate-500"}`}>
                {ticket.priority}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 flex-shrink-0"><X size={18} /></button>
        </div>

        {/* Change status bar */}
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-6 py-2.5 flex-shrink-0 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mr-1">Status:</span>
          {ALL_STATUSES.map(st => (
            <button key={st} onClick={() => handleStatusChange(st)}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
                status === st
                  ? (STATUS_STYLE[st]?.cls || "bg-slate-100 text-slate-600") + " ring-2 ring-offset-1 ring-blue-400"
                  : "bg-white border border-slate-200 text-slate-500 hover:border-blue-300"
              }`}>
              {st.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Description */}
        {ticket.description && (
          <div className="border-b border-slate-100 bg-slate-50 px-6 py-3 flex-shrink-0">
            <div className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Description</div>
            <p className="text-sm text-slate-600">{ticket.description}</p>
          </div>
        )}

        {/* Messages thread */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          {loading ? (
            <div className="py-8 text-center text-sm text-slate-400">Loading messages…</div>
          ) : messages.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              <MessageSquare size={28} className="mx-auto mb-2 text-slate-300" />
              No messages yet — be the first to reply
            </div>
          ) : (
            messages.map(m => {
              const isOfficer = m.senderType === "OFFICER";
              return (
                <div key={m.id} className={`flex ${isOfficer ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    isOfficer
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-slate-100 text-slate-800 rounded-bl-sm"
                  }`}>
                    <div className={`text-[10px] font-semibold mb-1 ${isOfficer ? "text-blue-200" : "text-slate-400"}`}>
                      {isOfficer ? "Officer" : "Citizen"} · {fmtTime(m.createdAt)}
                    </div>
                    <p className="text-sm leading-relaxed">{m.message}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Reply box */}
        <form onSubmit={sendReply} className="flex items-end gap-2 border-t border-slate-100 px-4 py-3 flex-shrink-0">
          <textarea
            rows={2}
            value={reply}
            onChange={e => setReply(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(e); } }}
            placeholder="Type a reply… (Enter to send)"
            className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none"
          />
          <button type="submit" disabled={sending || !reply.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 flex-shrink-0">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function TicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets]         = useState([]);
  const [categories, setCategories]   = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showCreate, setShowCreate]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, c, apps] = await Promise.all([
        ticketsApi.list(),
        ticketsApi.categories(),
        applicationsApi.list(),
      ]);
      setTickets(t);
      setCategories(c);
      setApplications(apps || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = tickets.filter(t => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!(t.ticketNo || "").toLowerCase().includes(q) && !(t.subject || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const countByStatus = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = tickets.filter(t => t.status === s).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
          <p className="text-sm text-slate-500 mt-0.5">Citizen queries and helpdesk requests</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm disabled:opacity-50">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          {user && (
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm">
              <Plus size={15} /> New Ticket
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={15} className="flex-shrink-0" /> {error}
        </div>
      )}

      {/* Status summary chips */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setStatusFilter("")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${!statusFilter ? "bg-slate-800 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"}`}>
          All ({tickets.length})
        </button>
        {ALL_STATUSES.map(s => {
          const st = STATUS_STYLE[s] || STATUS_STYLE.OPEN;
          const SIcon = st.icon;
          const active = statusFilter === s;
          return (
            <button key={s} onClick={() => setStatusFilter(active ? "" : s)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                active ? st.cls + " ring-2 ring-offset-1 ring-blue-400" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
              }`}>
              <SIcon size={11} /> {s.replace("_", " ")} ({countByStatus[s] || 0})
            </button>
          );
        })}
      </div>

      {/* Search + Priority filter */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 focus-within:border-blue-400">
          <Search size={14} className="text-slate-400 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by ticket no or subject…"
            className="flex-1 text-sm text-slate-700 outline-none placeholder:text-slate-400" />
        </div>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none">
          <option value="">All Priorities</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Tickets table */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-700">Tickets</span>
          <span className="text-xs text-slate-400">{filtered.length} of {tickets.length}</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading tickets…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <MessageSquare size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-400">{tickets.length === 0 ? "No tickets raised yet" : "No tickets match filters"}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Ticket No", "Subject", "Priority", "Status", "Created", "Action"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(t => {
                const s  = STATUS_STYLE[t.status] || STATUS_STYLE.OPEN;
                const SI = s.icon;
                return (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-mono font-semibold text-slate-700">{t.ticketNo}</td>
                    <td className="px-5 py-3.5 max-w-[220px]">
                      <div className="text-sm font-medium text-slate-800 truncate">{t.subject}</div>
                      {t.description && (
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">{t.description}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLE[t.priority] || "bg-slate-100 text-slate-500"}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.cls}`}>
                        <SI size={10} /> {t.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{fmtDate(t.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => setSelectedTicket(t)}
                        className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">
                        <MessageSquare size={12} /> Open
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create modal */}
      {showCreate && user && (
        <CreateTicketModal
          categories={categories}
          applications={applications}
          userId={user.id}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}

      {/* Detail panel */}
      {selectedTicket && user && (
        <TicketPanel
          ticket={selectedTicket}
          userId={user.id}
          onClose={() => setSelectedTicket(null)}
          onUpdated={() => { load(); setSelectedTicket(t => t ? { ...t, status: t.status } : null); }}
        />
      )}
    </div>
  );
}
