import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, ChevronUp, ChevronDown, Mail, Send, Eye, ArrowLeft, Download, X } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Subscriber {
  id: number;
  email: string;
  createdAt: string;
}

type BlockType = "heading" | "text" | "image" | "button" | "divider" | "spacer";

interface Block {
  id: string;
  type: BlockType;
  text?: string;
  imageUrl?: string;
  imageAlt?: string;
  label?: string;
  url?: string;
  height?: number;
}

type CampaignStatus = "draft" | "sent";

interface Campaign {
  id: number;
  title: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  content: Block[];
  status: CampaignStatus;
  sentAt: string | null;
  recipientCount: number | null;
  createdAt: string;
  updatedAt: string;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Main Tab ──────────────────────────────────────────────────────────────────

export function NewsletterTab() {
  const [view, setView] = useState<"subscribers" | "campaigns" | "editor">("subscribers");
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  const handleOpenEditor = (c: Campaign | null) => {
    setEditingCampaign(c);
    setView("editor");
  };

  if (view === "editor") {
    return (
      <CampaignEditor
        campaign={editingCampaign}
        onBack={() => { setView("campaigns"); setEditingCampaign(null); }}
        onSaved={(c) => setEditingCampaign(c)}
      />
    );
  }

  return (
    <div>
      <div className="flex border-b border-border mb-8">
        {(["subscribers", "campaigns"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-3 text-xs tracking-widest uppercase border-b-2 transition-colors mr-2 -mb-px ${
              view === v ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      {view === "subscribers" && <SubscribersView />}
      {view === "campaigns" && <CampaignsView onEdit={handleOpenEditor} />}
    </div>
  );
}

// ─── Subscribers View ──────────────────────────────────────────────────────────

function SubscribersView() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const fetchSubscribers = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (q) params.set("search", q);
      const res = await fetch(`${BASE}/api/admin/newsletter/subscribers?${params}`, { credentials: "include" });
      const data = await res.json() as { subscribers: Subscriber[]; total: number };
      setSubscribers(data.subscribers);
      setTotal(data.total);
    } catch {
      toast({ title: "Failed to load subscribers", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void fetchSubscribers(""); }, [fetchSubscribers]);

  useEffect(() => {
    const t = setTimeout(() => { void fetchSubscribers(searchInput); }, 350);
    return () => clearTimeout(t);
  }, [searchInput, fetchSubscribers]);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === subscribers.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(subscribers.map((s) => s.id)));
    }
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Remove ${selected.size} subscriber(s)?`)) return;
    setDeleting(true);
    try {
      await Promise.all(
        [...selected].map((id) =>
          fetch(`${BASE}/api/admin/newsletter/subscribers/${id}`, { method: "DELETE", credentials: "include" })
        )
      );
      toast({ title: `Removed ${selected.size} subscriber(s)` });
      setSelected(new Set());
      void fetchSubscribers(searchInput);
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const exportCSV = () => {
    window.open(`${BASE}/api/admin/newsletter/subscribers/export`, "_blank");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-xl font-light">Subscribers</h2>
          <p className="text-xs text-muted-foreground mt-1">{total} total</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => { void deleteSelected(); }}
              disabled={deleting}
              className="text-xs tracking-widest uppercase"
            >
              {deleting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
              Remove {selected.size}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={exportCSV} className="text-xs tracking-widest uppercase">
            <Download className="h-3 w-3 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by email…"
          className="max-w-sm border-border"
        />
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : subscribers.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border">
          <Mail className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" strokeWidth={1} />
          <p className="text-xs tracking-widest uppercase text-muted-foreground">
            {searchInput ? "No results" : "No subscribers yet"}
          </p>
        </div>
      ) : (
        <div className="border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/30">
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === subscribers.length && subscribers.length > 0}
                    onChange={toggleAll}
                    className="accent-foreground"
                  />
                </th>
                <th className="px-4 py-3 text-left text-[10px] tracking-widest uppercase text-muted-foreground font-normal">Email</th>
                <th className="px-4 py-3 text-left text-[10px] tracking-widest uppercase text-muted-foreground font-normal">Subscribed</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subscribers.map((s) => (
                <tr key={s.id} className={`transition-colors ${selected.has(s.id) ? "bg-accent/20" : "hover:bg-accent/10"}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => toggleSelect(s.id)}
                      className="accent-foreground"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{s.email}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(s.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => { setSelected(new Set([s.id])); void deleteSelected(); }}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      title="Remove"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Campaigns View ────────────────────────────────────────────────────────────

function CampaignsView({ onEdit }: { onEdit: (c: Campaign | null) => void }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/admin/newsletter/campaigns`, { credentials: "include" });
      setCampaigns(await res.json() as Campaign[]);
    } catch {
      toast({ title: "Failed to load campaigns", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void fetchCampaigns(); }, [fetchCampaigns]);

  const createNew = async () => {
    setCreating(true);
    try {
      const res = await fetch(`${BASE}/api/admin/newsletter/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: "New Campaign", subject: "", senderName: "HOOK", senderEmail: "", content: [] }),
      });
      if (!res.ok) throw new Error();
      const c = await res.json() as Campaign;
      onEdit(c);
    } catch {
      toast({ title: "Failed to create campaign", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const deleteCampaign = async (id: number) => {
    if (!confirm("Delete this campaign?")) return;
    await fetch(`${BASE}/api/admin/newsletter/campaigns/${id}`, { method: "DELETE", credentials: "include" });
    void fetchCampaigns();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl font-light">Campaigns</h2>
        <Button
          onClick={() => { void createNew(); }}
          disabled={creating}
          className="text-xs tracking-widest uppercase font-medium"
        >
          {creating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
          New Campaign
        </Button>
      </div>

      {loading ? (
        <div className="py-16 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>
      ) : campaigns.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border">
          <Send className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" strokeWidth={1} />
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-6">No campaigns yet</p>
          <Button variant="outline" onClick={() => { void createNew(); }} className="text-xs tracking-widest uppercase">
            Create your first campaign
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="border border-border p-4 flex items-center gap-4 hover:border-foreground/30 transition-colors cursor-pointer group"
              onClick={() => onEdit(c)}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-1">{c.title}</p>
                {c.subject && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{c.subject}</p>}
              </div>
              <div className="shrink-0 flex items-center gap-3">
                {c.status === "sent" ? (
                  <span className="text-[9px] tracking-widest uppercase bg-foreground text-background px-2 py-0.5">
                    Sent · {c.recipientCount ?? 0}
                  </span>
                ) : (
                  <span className="text-[9px] tracking-widest uppercase border border-border px-2 py-0.5 text-muted-foreground">
                    Draft
                  </span>
                )}
                <p className="text-[10px] text-muted-foreground hidden sm:block">
                  {new Date(c.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); void deleteCampaign(c.id); }}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1 opacity-0 group-hover:opacity-100"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Campaign Editor ───────────────────────────────────────────────────────────

function CampaignEditor({
  campaign,
  onBack,
  onSaved,
}: {
  campaign: Campaign | null;
  onBack: () => void;
  onSaved: (c: Campaign) => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: campaign?.title ?? "New Campaign",
    subject: campaign?.subject ?? "",
    senderName: campaign?.senderName ?? "HOOK",
    senderEmail: campaign?.senderEmail ?? "",
  });
  const [blocks, setBlocks] = useState<Block[]>((campaign?.content as Block[]) ?? []);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  const id = campaign?.id;
  const isSent = campaign?.status === "sent";

  const saveDraft = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/api/admin/newsletter/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, content: blocks }),
      });
      if (!res.ok) throw new Error();
      const c = await res.json() as Campaign;
      onSaved(c);
      toast({ title: "Draft saved" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    if (!id || !testEmail) return;
    setSendingTest(true);
    try {
      await saveDraft();
      const res = await fetch(`${BASE}/api/admin/newsletter/campaigns/${id}/send-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ testEmail }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed");
      toast({ title: `Test sent to ${testEmail}` });
    } catch (e) {
      toast({ title: String(e instanceof Error ? e.message : e) || "Failed to send test", variant: "destructive" });
    } finally {
      setSendingTest(false);
    }
  };

  const sendToAll = async () => {
    if (!id) return;
    if (!confirm("Send this campaign to all subscribers? This cannot be undone.")) return;
    setSendingAll(true);
    try {
      await saveDraft();
      const res = await fetch(`${BASE}/api/admin/newsletter/campaigns/${id}/send`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json() as { ok?: boolean; error?: string; recipientCount?: number };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed");
      toast({ title: `Sent to ${data.recipientCount ?? 0} subscribers` });
      onBack();
    } catch (e) {
      toast({ title: String(e instanceof Error ? e.message : e) || "Failed to send", variant: "destructive" });
    } finally {
      setSendingAll(false);
    }
  };

  const addBlock = (type: BlockType) => {
    const block: Block = {
      id: generateId(),
      type,
      ...(type === "heading" ? { text: "New Heading" } : {}),
      ...(type === "text" ? { text: "Write your content here…" } : {}),
      ...(type === "image" ? { imageUrl: "", imageAlt: "" } : {}),
      ...(type === "button" ? { label: "Shop Now", url: "" } : {}),
      ...(type === "spacer" ? { height: 24 } : {}),
    };
    setBlocks((prev) => [...prev, block]);
    setEditingBlockId(block.id);
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const deleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (editingBlockId === id) setEditingBlockId(null);
  };

  const moveBlock = (id: string, dir: "up" | "down") => {
    setBlocks((prev) => {
      const i = prev.findIndex((b) => b.id === id);
      if (i === -1) return prev;
      if (dir === "up" && i === 0) return prev;
      if (dir === "down" && i === prev.length - 1) return prev;
      const next = [...prev];
      const j = dir === "up" ? i - 1 : i + 1;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="font-serif text-xl font-light bg-transparent border-none outline-none w-full placeholder:text-muted-foreground/40"
            placeholder="Campaign name"
            disabled={isSent}
          />
          {isSent && (
            <span className="text-[9px] tracking-widest uppercase bg-foreground text-background px-2 py-0.5">Sent</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setShowPreview((v) => !v)} className="text-xs tracking-widest uppercase">
            <Eye className="h-3 w-3 mr-1" />
            {showPreview ? "Edit" : "Preview"}
          </Button>
          {!isSent && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { void saveDraft(); }}
              disabled={saving}
              className="text-xs tracking-widest uppercase"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Save Draft
            </Button>
          )}
        </div>
      </div>

      {showPreview ? (
        <EmailPreview blocks={blocks} subject={form.subject} senderName={form.senderName} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Settings */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-[10px] tracking-widest uppercase text-muted-foreground">Campaign Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Subject Line</label>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="Your email subject…"
                    className="border-border"
                    disabled={isSent}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Sender Name</label>
                    <Input
                      value={form.senderName}
                      onChange={(e) => setForm((f) => ({ ...f, senderName: e.target.value }))}
                      placeholder="HOOK"
                      className="border-border"
                      disabled={isSent}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Sender Email</label>
                    <Input
                      value={form.senderEmail}
                      onChange={(e) => setForm((f) => ({ ...f, senderEmail: e.target.value }))}
                      placeholder="you@yourdomain.com"
                      type="email"
                      className="border-border"
                      disabled={isSent}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Send actions */}
            {!isSent && (
              <div className="border border-border p-4 space-y-4">
                <h3 className="text-[10px] tracking-widest uppercase text-muted-foreground">Send</h3>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground block">Test Email</label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="test@example.com"
                      className="border-border flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { void sendTest(); }}
                      disabled={sendingTest || !testEmail}
                      className="text-xs tracking-widest uppercase shrink-0"
                    >
                      {sendingTest ? <Loader2 className="h-3 w-3 animate-spin" /> : "Send Test"}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Requires <code className="bg-accent px-1">RESEND_API_KEY</code> environment variable.
                  </p>
                </div>
                <Button
                  className="w-full text-xs tracking-widest uppercase font-medium"
                  onClick={() => { void sendToAll(); }}
                  disabled={sendingAll || !form.subject}
                >
                  {sendingAll ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                  Send to All Subscribers
                </Button>
                {!form.subject && (
                  <p className="text-[10px] text-muted-foreground text-center">Add a subject line to enable sending</p>
                )}
              </div>
            )}
          </div>

          {/* Right: Block Editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] tracking-widest uppercase text-muted-foreground">Email Content</h3>
              <span className="text-[10px] text-muted-foreground">{blocks.length} block{blocks.length !== 1 ? "s" : ""}</span>
            </div>

            {blocks.length === 0 && (
              <div className="border border-dashed border-border py-10 text-center">
                <p className="text-xs text-muted-foreground tracking-widest uppercase">No blocks yet</p>
                <p className="text-[10px] text-muted-foreground mt-1">Add blocks below to build your email</p>
              </div>
            )}

            <div className="space-y-2">
              {blocks.map((block, i) => (
                <BlockEditor
                  key={block.id}
                  block={block}
                  isFirst={i === 0}
                  isLast={i === blocks.length - 1}
                  isEditing={editingBlockId === block.id}
                  onToggleEdit={() => setEditingBlockId((prev) => (prev === block.id ? null : block.id))}
                  onChange={(u) => updateBlock(block.id, u)}
                  onDelete={() => deleteBlock(block.id)}
                  onMoveUp={() => moveBlock(block.id, "up")}
                  onMoveDown={() => moveBlock(block.id, "down")}
                  disabled={isSent}
                />
              ))}
            </div>

            {!isSent && (
              <div className="flex flex-wrap gap-2 pt-2">
                {(["heading", "text", "image", "button", "divider", "spacer"] as BlockType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => addBlock(t)}
                    className="text-[10px] tracking-widest uppercase border border-border px-3 py-1.5 hover:bg-accent transition-colors flex items-center gap-1"
                  >
                    <Plus className="h-2.5 w-2.5" />
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Block Editor ──────────────────────────────────────────────────────────────

function BlockEditor({
  block,
  isFirst,
  isLast,
  isEditing,
  onToggleEdit,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  disabled,
}: {
  block: Block;
  isFirst: boolean;
  isLast: boolean;
  isEditing: boolean;
  onToggleEdit: () => void;
  onChange: (u: Partial<Block>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  disabled?: boolean;
}) {
  const btnClass = "w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30";

  const summary = (() => {
    switch (block.type) {
      case "heading": return block.text ?? "(empty)";
      case "text": return (block.text ?? "").slice(0, 60) || "(empty)";
      case "image": return block.imageUrl ? "Image" : "(no URL)";
      case "button": return block.label ?? "Button";
      case "divider": return "─────";
      case "spacer": return `${block.height ?? 24}px space`;
      default: return "";
    }
  })();

  return (
    <div className={`border transition-colors ${isEditing ? "border-foreground/40" : "border-border"}`}>
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent/10 transition-colors"
        onClick={!disabled ? onToggleEdit : undefined}
      >
        <span className="text-[9px] tracking-widest uppercase text-muted-foreground bg-accent px-1.5 py-0.5 shrink-0">
          {block.type}
        </span>
        <span className="text-xs text-muted-foreground flex-1 truncate">{summary}</span>
        {!disabled && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} disabled={isFirst} className={btnClass} title="Move up">
              <ChevronUp className="h-3 w-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} disabled={isLast} className={btnClass} title="Move down">
              <ChevronDown className="h-3 w-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className={`${btnClass} hover:text-destructive`} title="Delete">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="px-3 pb-3 pt-1 border-t border-border space-y-2">
          {(block.type === "heading" || block.type === "text") && (
            <Textarea
              value={block.text ?? ""}
              onChange={(e) => onChange({ text: e.target.value })}
              rows={block.type === "text" ? 4 : 2}
              className="border-border resize-none text-sm"
              placeholder={block.type === "heading" ? "Heading text…" : "Paragraph text…"}
            />
          )}
          {block.type === "image" && (
            <div className="space-y-2">
              <Input
                value={block.imageUrl ?? ""}
                onChange={(e) => onChange({ imageUrl: e.target.value })}
                placeholder="Image URL…"
                className="border-border text-sm"
              />
              <Input
                value={block.imageAlt ?? ""}
                onChange={(e) => onChange({ imageAlt: e.target.value })}
                placeholder="Alt text (optional)"
                className="border-border text-sm"
              />
              {block.imageUrl && (
                <img src={block.imageUrl} alt="" className="max-h-32 object-contain border border-border" />
              )}
            </div>
          )}
          {block.type === "button" && (
            <div className="space-y-2">
              <Input
                value={block.label ?? ""}
                onChange={(e) => onChange({ label: e.target.value })}
                placeholder="Button label"
                className="border-border text-sm"
              />
              <Input
                value={block.url ?? ""}
                onChange={(e) => onChange({ url: e.target.value })}
                placeholder="Link URL"
                className="border-border text-sm"
              />
            </div>
          )}
          {block.type === "spacer" && (
            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Height</label>
              <Input
                type="number"
                min={8}
                max={120}
                step={8}
                value={block.height ?? 24}
                onChange={(e) => onChange({ height: parseInt(e.target.value) || 24 })}
                className="border-border text-sm w-24"
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          )}
          {block.type === "divider" && (
            <p className="text-[10px] text-muted-foreground">A horizontal rule will appear in the email.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Email Preview ──────────────────────────────────────────────────────────────

function EmailPreview({ blocks, subject, senderName }: { blocks: Block[]; subject: string; senderName: string }) {
  return (
    <div className="border border-border max-w-2xl mx-auto">
      {/* Email header mock */}
      <div className="bg-accent/30 border-b border-border px-6 py-3 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">From: {senderName || "HOOK"}</p>
          <p className="text-sm font-medium">{subject || "(no subject)"}</p>
        </div>
      </div>

      {/* Email body */}
      <div className="px-10 py-8 space-y-0" style={{ fontFamily: "Georgia, serif" }}>
        {/* Brand header */}
        <div className="border-b-2 border-foreground pb-5 mb-8">
          <p className="text-2xl tracking-[0.15em] uppercase" style={{ fontFamily: "Georgia, serif" }}>HOOK</p>
        </div>

        {blocks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No content blocks yet.</p>
        ) : (
          blocks.map((block) => (
            <div key={block.id} className="mb-5">
              {block.type === "heading" && (
                <h2 className="text-2xl font-light mb-0" style={{ fontFamily: "Georgia, serif", letterSpacing: "0.02em" }}>
                  {block.text || "Heading"}
                </h2>
              )}
              {block.type === "text" && (
                <p className="text-sm leading-relaxed text-muted-foreground" style={{ fontFamily: "Helvetica Neue, Arial, sans-serif" }}>
                  {block.text || "(empty text)"}
                </p>
              )}
              {block.type === "image" && (
                block.imageUrl
                  ? <img src={block.imageUrl} alt={block.imageAlt ?? ""} className="w-full max-h-64 object-cover" />
                  : <div className="w-full h-32 bg-accent/40 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground tracking-widest uppercase">No image URL</span>
                    </div>
              )}
              {block.type === "button" && (
                <div className="text-center">
                  <span className="inline-block bg-foreground text-background text-xs tracking-[0.12em] uppercase px-9 py-3.5">
                    {block.label || "Button"}
                  </span>
                </div>
              )}
              {block.type === "divider" && <hr className="border-border" />}
              {block.type === "spacer" && <div style={{ height: `${block.height ?? 24}px` }} />}
            </div>
          ))
        )}

        {/* Footer */}
        <div className="border-t border-border pt-5 mt-8 text-center">
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "Helvetica Neue, Arial, sans-serif" }}>
            You received this email because you subscribed at HOOK.
          </p>
        </div>
      </div>
    </div>
  );
}
