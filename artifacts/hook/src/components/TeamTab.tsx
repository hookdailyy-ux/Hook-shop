import { useState, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Wifi,
  WifiOff,
  User,
  Check,
  X,
  ChevronLeft,
  FolderOpen,
  Link2,
  Search,
  KeyRound,
  Copy,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface TeamMember {
  id: number;
  fullName: string;
  username: string;
  whatsapp: string;
  notes: string;
  status: string;
  forcePasswordChange: boolean;
  isOnline: boolean;
  lastActiveAt: string | null;
  createdAt: string;
  totalCollections: number;
  totalLooks: number;
  monthOrdersValue: number;
  estimatedRewards: number;
}

interface ActivityItem {
  id: number;
  action: string;
  details: string;
  createdAt: string;
}

interface TeamMemberDetail extends TeamMember {
  activity: ActivityItem[];
}

type SubView = "members" | "add" | "collections";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function actionLabel(action: string): string {
  switch (action) {
    case "login": return "Logged in";
    case "logout": return "Logged out";
    case "collection_created": return "Collection created";
    case "look_created": return "Look created";
    default: return action;
  }
}

export function TeamTab() {
  const [subView, setSubView] = useState<SubView>("members");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMember, setViewMember] = useState<TeamMemberDetail | null>(null);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [resetMember, setResetMember] = useState<TeamMember | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const { toast } = useToast();

  const loadMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE}/api/team`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      setMembers((await res.json()) as TeamMember[]);
    } catch {
      toast({ title: "Failed to load team members", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadMembers(); }, []);

  const openView = async (id: number) => {
    try {
      const res = await fetch(`${BASE}/api/team/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      setViewMember((await res.json()) as TeamMemberDetail);
      setViewOpen(true);
    } catch {
      toast({ title: "Failed to load member details", variant: "destructive" });
    }
  };

  const toggleStatus = async (m: TeamMember) => {
    const newStatus = m.status === "active" ? "disabled" : "active";
    try {
      const res = await fetch(`${BASE}/api/team/${m.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: `Member ${newStatus === "active" ? "enabled" : "disabled"}` });
      void loadMembers();
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const deleteMember = async (m: TeamMember) => {
    if (!confirm(`Delete ${m.fullName}? This cannot be undone.`)) return;
    try {
      await fetch(`${BASE}/api/team/${m.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      toast({ title: "Member deleted" });
      void loadMembers();
    } catch {
      toast({ title: "Failed to delete member", variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="flex gap-0 border-b border-border mb-6">
        {(["members", "add", "collections"] as SubView[]).map((v) => (
          <button
            key={v}
            onClick={() => setSubView(v)}
            className={`px-5 py-3 text-xs tracking-widest uppercase border-b-2 transition-colors ${
              subView === v
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {v === "members" ? "Team Members" : v === "add" ? "Add Member" : "Collections"}
          </button>
        ))}
      </div>

      {subView === "members" && (
        <MembersView
          members={members}
          loading={loading}
          onView={openView}
          onEdit={(m) => { setEditMember(m); setEditOpen(true); }}
          onResetPassword={(m) => { setResetMember(m); setResetOpen(true); }}
          onToggleStatus={toggleStatus}
          onDelete={deleteMember}
          onAddClick={() => setSubView("add")}
        />
      )}

      {subView === "add" && (
        <div>
          <button
            onClick={() => setSubView("members")}
            className="flex items-center gap-1.5 text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ChevronLeft className="h-3 w-3" />
            Back to Members
          </button>
          <AddMemberForm
            onSuccess={() => { setSubView("members"); void loadMembers(); }}
          />
        </div>
      )}

      {subView === "collections" && <CollectionsAdminView />}

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-light">Member Details</DialogTitle>
          </DialogHeader>
          {viewMember && <MemberDetailContent member={viewMember} />}
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-light">Edit Member</DialogTitle>
          </DialogHeader>
          {editMember && (
            <EditMemberForm
              member={editMember}
              onSuccess={() => { setEditOpen(false); void loadMembers(); }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-light">Reset Password</DialogTitle>
          </DialogHeader>
          {resetMember && (
            <ResetPasswordForm
              member={resetMember}
              onSuccess={() => {
                setResetOpen(false);
                toast({ title: "Password reset. Member must change it on next login." });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MembersView({
  members,
  loading,
  onView,
  onEdit,
  onResetPassword,
  onToggleStatus,
  onDelete,
  onAddClick,
}: {
  members: TeamMember[];
  loading: boolean;
  onView: (id: number) => void;
  onEdit: (m: TeamMember) => void;
  onResetPassword: (m: TeamMember) => void;
  onToggleStatus: (m: TeamMember) => void;
  onDelete: (m: TeamMember) => void;
  onAddClick: () => void;
}) {
  const [search, setSearch] = useState("");

  const q = search.toLowerCase().trim();
  const sorted = [...members].sort(
    (a, b) =>
      b.monthOrdersValue - a.monthOrdersValue ||
      b.totalCollections - a.totalCollections
  );
  const filtered = q
    ? sorted.filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.username.toLowerCase().includes(q) ||
          m.whatsapp.toLowerCase().includes(q) ||
          m.status.toLowerCase().includes(q)
      )
    : sorted;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, username, WhatsApp or status..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-border bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors"
          />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            {q
              ? `${filtered.length} of ${members.length}`
              : `${members.length} member${members.length !== 1 ? "s" : ""}`}
          </p>
          <Button
            onClick={onAddClick}
            size="sm"
            className="text-xs tracking-widest uppercase gap-2"
          >
            <Plus className="h-3 w-3" />
            Add Member
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <p className="text-xs tracking-widest uppercase text-muted-foreground animate-pulse">
            Loading...
          </p>
        </div>
      ) : members.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-border">
          <User className="h-7 w-7 mx-auto mb-3 text-muted-foreground/30" strokeWidth={1.5} />
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-5">
            No team members yet
          </p>
          <Button
            onClick={onAddClick}
            variant="outline"
            size="sm"
            className="text-xs tracking-widest uppercase gap-2"
          >
            <Plus className="h-3 w-3" />
            Add First Member
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[1020px]">
            <thead>
              <tr className="border-b border-border">
                {[
                  "Full Name",
                  "Username",
                  "WhatsApp",
                  "Status",
                  "Online",
                  "Collections",
                  "Looks",
                  "Month Orders",
                  "Rewards",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="pb-3 pr-4 text-[10px] tracking-widest uppercase text-muted-foreground font-normal whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-xs text-muted-foreground">
                    No members match "{search}"
                  </td>
                </tr>
              )}
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-accent/20 transition-colors group">
                  <td className="py-3.5 pr-4 font-medium text-sm">{m.fullName}</td>
                  <td className="py-3.5 pr-4 font-mono text-xs text-muted-foreground">
                    @{m.username}
                  </td>
                  <td className="py-3.5 pr-4 text-xs text-muted-foreground">
                    {m.whatsapp || "—"}
                  </td>
                  <td className="py-3.5 pr-4">
                    <span
                      className={`text-[10px] tracking-widest uppercase px-2 py-0.5 ${
                        m.status === "active"
                          ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                          : "bg-accent text-muted-foreground"
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4">
                    {m.isOnline ? (
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-green-600">
                        <Wifi className="h-3 w-3" />
                        Online
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                        <WifiOff className="h-3 w-3" />
                        Offline
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 pr-4 text-center text-muted-foreground text-sm">
                    {m.totalCollections}
                  </td>
                  <td className="py-3.5 pr-4 text-center text-muted-foreground text-sm">
                    {m.totalLooks}
                  </td>
                  <td className="py-3.5 pr-4 text-muted-foreground text-sm">
                    ${m.monthOrdersValue}
                  </td>
                  <td className="py-3.5 pr-4 text-muted-foreground text-sm">
                    ${m.estimatedRewards}
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => onView(m.id)}
                        className="p-1.5 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                        title="View Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onEdit(m)}
                        className="p-1.5 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onToggleStatus(m)}
                        className="p-1.5 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                        title={m.status === "active" ? "Disable" : "Enable"}
                      >
                        {m.status === "active" ? (
                          <X className="h-3.5 w-3.5" />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        )}
                      </button>
                      <button
                        onClick={() => onResetPassword(m)}
                        className="p-1.5 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                        title="Reset Password"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(m)}
                        className="p-1.5 hover:bg-accent transition-colors text-muted-foreground hover:text-destructive"
                        title="Delete Member"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-border">
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Permissions</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
          <div className="bg-accent/30 border border-border p-3">
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Members Can</p>
            {["Create Collections", "Create Looks", "Share Collection Links", "Share Look Links"].map((p) => (
              <div key={p} className="flex items-center gap-2 py-0.5">
                <Check className="h-3 w-3 text-green-600 shrink-0" />
                <span className="text-xs text-foreground">{p}</span>
              </div>
            ))}
          </div>
          <div className="bg-accent/30 border border-border p-3">
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Members Cannot</p>
            {["Add Products", "Edit Products", "Delete Products"].map((p) => (
              <div key={p} className="flex items-center gap-2 py-0.5">
                <X className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddMemberForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    password: "",
    whatsapp: "",
    notes: "",
    status: "active",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/team`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast({ title: body.error ?? "Failed to create member", variant: "destructive" });
        return;
      }
      toast({ title: "Team member created successfully" });
      onSuccess();
    } catch {
      toast({ title: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
      <div className="p-4 border border-border bg-accent/20 text-xs tracking-wide text-muted-foreground leading-relaxed">
        Team members cannot register themselves. Only Admin can create accounts.
        On first login, members will be prompted to change their password.
      </div>

      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Full Name <span className="text-destructive">*</span>
        </label>
        <Input
          value={form.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          placeholder="Jane Smith"
          required
          className="border-border"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Username <span className="text-destructive">*</span>
        </label>
        <Input
          value={form.username}
          onChange={(e) => set("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
          placeholder="jane_smith"
          required
          className="border-border font-mono"
        />
        <p className="text-[9px] text-muted-foreground/70">Lowercase letters, numbers and underscores only.</p>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Temporary Password <span className="text-destructive">*</span>
        </label>
        <Input
          type="password"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          placeholder="Min. 6 characters"
          required
          className="border-border"
        />
        <p className="text-[9px] text-muted-foreground/70">Member will be asked to change this on first login.</p>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
          WhatsApp Number
        </label>
        <Input
          value={form.whatsapp}
          onChange={(e) => set("whatsapp", e.target.value)}
          placeholder="+1 234 567 8900"
          className="border-border"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</label>
        <Select value={form.status} onValueChange={(v) => set("status", v)}>
          <SelectTrigger className="border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Notes</label>
        <Textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Internal notes about this member..."
          rows={3}
          className="border-border resize-none"
        />
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={loading} className="text-xs tracking-widest uppercase">
          {loading ? "Creating..." : "Create Team Member"}
        </Button>
      </div>
    </form>
  );
}

function EditMemberForm({
  member,
  onSuccess,
}: {
  member: TeamMember;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    fullName: member.fullName,
    whatsapp: member.whatsapp,
    notes: member.notes,
    status: member.status,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/team/${member.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Member updated" });
      onSuccess();
    } catch {
      toast({ title: "Failed to update member", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Username</label>
        <Input value={`@${member.username}`} disabled className="border-border font-mono opacity-50" />
        <p className="text-[9px] text-muted-foreground/60">Username cannot be changed.</p>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Full Name <span className="text-destructive">*</span>
        </label>
        <Input
          value={form.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          required
          className="border-border"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">WhatsApp Number</label>
        <Input
          value={form.whatsapp}
          onChange={(e) => set("whatsapp", e.target.value)}
          placeholder="+1 234 567 8900"
          className="border-border"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</label>
        <Select value={form.status} onValueChange={(v) => set("status", v)}>
          <SelectTrigger className="border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Notes</label>
        <Textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          className="border-border resize-none"
        />
      </div>

      <div className="pt-1">
        <Button type="submit" disabled={loading} className="text-xs tracking-widest uppercase">
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 10 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

function ResetPasswordForm({
  member,
  onSuccess,
}: {
  member: TeamMember;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState(() => generateTempPassword());
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.trim().length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/team/${member.id}/password`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: password }),
      });
      if (!res.ok) throw new Error("Failed");
      setCopiedPassword(password);
      setConfirmed(true);
    } catch {
      toast({ title: "Failed to reset password", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(copiedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (confirmed) {
    return (
      <div className="pt-2 space-y-5">
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200">
          <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-green-800">Password reset successfully</p>
            <p className="text-xs text-green-700 mt-0.5">
              {member.fullName} must change their password on next login.
            </p>
          </div>
        </div>

        <div>
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
            Temporary Password — share this with the member
          </p>
          <div className="flex border border-border">
            <code className="flex-1 px-4 py-3.5 font-mono text-lg tracking-[0.2em] select-all bg-accent/30">
              {copiedPassword}
            </code>
            <button
              onClick={handleCopy}
              className="px-4 border-l border-border hover:bg-accent transition-colors"
              title={copied ? "Copied!" : "Copy password"}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Send this via WhatsApp or your preferred channel. It expires after first use.
          </p>
        </div>

        <Button
          onClick={onSuccess}
          variant="outline"
          className="w-full text-xs tracking-widest uppercase"
        >
          Done
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pt-2">
      <div className="flex items-start gap-3 p-4 bg-accent/40 border border-border">
        <KeyRound className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Resetting password for{" "}
          <strong className="font-medium text-foreground">{member.fullName}</strong>{" "}
          (@{member.username}). They will be required to change it on next login.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Temporary Password <span className="text-destructive">*</span>
        </label>
        <div className="flex border border-border">
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="off"
            spellCheck={false}
            className="flex-1 px-3 py-2 text-sm font-mono bg-background focus:outline-none tracking-wider"
          />
          <button
            type="button"
            onClick={() => setPassword(generateTempPassword())}
            className="px-3 py-2 border-l border-border text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground hover:bg-accent transition-colors whitespace-nowrap"
          >
            Generate
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Min. 6 characters. Type your own or click Generate for a random password.
        </p>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="text-xs tracking-widest uppercase"
      >
        {loading ? "Resetting..." : "Reset Password"}
      </Button>
    </form>
  );
}

function MemberDetailContent({ member }: { member: TeamMemberDetail }) {
  return (
    <div className="space-y-6 pt-2">
      <div>
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-3">Profile</p>
        <div className="space-y-2.5">
          {[
            { label: "Full Name", value: member.fullName },
            { label: "Username", value: `@${member.username}`, mono: true },
            { label: "WhatsApp", value: member.whatsapp || "—" },
            {
              label: "Status",
              value: member.status,
              badge: true,
              active: member.status === "active",
            },
            {
              label: "Created",
              value: formatDate(member.createdAt),
            },
            {
              label: "Password",
              value: member.forcePasswordChange ? "Must change on next login" : "Set",
            },
          ].map(({ label, value, mono, badge, active }) => (
            <div key={label} className="flex items-start gap-4">
              <span className="text-[10px] tracking-widest uppercase text-muted-foreground w-24 shrink-0 pt-0.5">
                {label}
              </span>
              {badge ? (
                <span
                  className={`text-[10px] tracking-widest uppercase px-2 py-0.5 ${
                    active
                      ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                      : "bg-accent text-muted-foreground"
                  }`}
                >
                  {value}
                </span>
              ) : (
                <span className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-3">Performance</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Collections", value: member.totalCollections },
            { label: "Looks", value: member.totalLooks },
            { label: "Month Orders", value: `$${member.monthOrdersValue}` },
            { label: "Est. Rewards", value: `$${member.estimatedRewards}` },
          ].map(({ label, value }) => (
            <div key={label} className="border border-border p-3">
              <p className="text-[9px] tracking-widest uppercase text-muted-foreground mb-1">{label}</p>
              <p className="text-lg font-light">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-3">
          Activity Log
        </p>
        {member.activity.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 py-4 text-center border border-dashed border-border">
            No activity recorded yet.
          </p>
        ) : (
          <div className="space-y-0 border border-border divide-y divide-border">
            {member.activity.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-3 py-2.5">
                <div>
                  <p className="text-xs">{actionLabel(a.action)}</p>
                  {a.details && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{a.details}</p>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 ml-4">
                  {formatDateTime(a.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Collections Admin View ───────────────────────────────────────────────────

interface MemberSummary {
  memberId: number;
  fullName: string;
  username: string;
  totalCollections: number;
  totalViews: number;
  totalLooks: number;
  totalLookViews: number;
}

interface CollectionDetailItem {
  id: number;
  title: string;
  coverImageUrl: string | null;
  status: string;
  views: number;
  shareToken: string;
  productCount: number;
  createdAt: string;
}

interface MemberDetail {
  member: { id: number; fullName: string; username: string };
  collections: CollectionDetailItem[];
}

type SortKey = "views" | "collections" | "looks" | "ordered" | "newest";

function memberInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .join("")
    .slice(0, 2);
}

function fmtNum(n: number): string {
  return n.toLocaleString();
}

function CollectionsAdminView() {
  const [subView, setSubView] = useState<"summary" | "detail">("summary");
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [memberDetail, setMemberDetail] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("views");
  const [copied, setCopied] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${BASE}/api/admin/collections/members`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed");
        setMembers((await res.json()) as MemberSummary[]);
      } catch {
        toast({ title: "Failed to load collections overview", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openMember = async (memberId: number) => {
    setSubView("detail");
    setDetailLoading(true);
    setMemberDetail(null);
    try {
      const res = await fetch(`${BASE}/api/admin/collections/member/${memberId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      setMemberDetail((await res.json()) as MemberDetail);
    } catch {
      toast({ title: "Failed to load member collections", variant: "destructive" });
      setSubView("summary");
    } finally {
      setDetailLoading(false);
    }
  };

  const copyLink = async (shareToken: string, id: number) => {
    const url = `${window.location.origin}${BASE}/c/${shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(id);
    toast({ title: "Share link copied" });
    setTimeout(() => setCopied(null), 2000);
  };

  if (subView === "detail") {
    return (
      <MemberDetailView
        detail={memberDetail}
        loading={detailLoading}
        copied={copied}
        onBack={() => { setSubView("summary"); setMemberDetail(null); }}
        onCopyLink={copyLink}
      />
    );
  }

  return (
    <MemberSummaryView
      members={members}
      loading={loading}
      search={search}
      sort={sort}
      onSearch={setSearch}
      onSort={setSort}
      onSelectMember={openMember}
    />
  );
}

function MemberSummaryView({
  members,
  loading,
  search,
  sort,
  onSearch,
  onSort,
  onSelectMember,
}: {
  members: MemberSummary[];
  loading: boolean;
  search: string;
  sort: SortKey;
  onSearch: (s: string) => void;
  onSort: (s: SortKey) => void;
  onSelectMember: (id: number) => void;
}) {
  const rankedByViews = [...members].sort((a, b) => b.totalViews - a.totalViews);

  const filtered = members.filter(
    (m) =>
      m.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.username.toLowerCase().includes(search.toLowerCase())
  );
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "views") return b.totalViews - a.totalViews;
    if (sort === "collections") return b.totalCollections - a.totalCollections;
    if (sort === "looks") return b.totalLooks - a.totalLooks;
    return 0;
  });

  const top3 = rankedByViews.slice(0, 3);
  const medals = ["🥇", "🥈", "🥉"];

  if (loading) {
    return (
      <div className="py-24 text-center">
        <p className="text-xs tracking-widest uppercase text-muted-foreground animate-pulse">
          Loading...
        </p>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="py-20 text-center border border-dashed border-border">
        <FolderOpen className="h-8 w-8 mx-auto mb-4 text-muted-foreground/25" strokeWidth={1.5} />
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">
          No Collections Yet
        </p>
        <p className="text-xs text-muted-foreground">
          Team members haven't created any collections yet.
        </p>
      </div>
    );
  }

  const totalCollections = members.reduce((s, m) => s + m.totalCollections, 0);
  const totalViews = members.reduce((s, m) => s + m.totalViews, 0);

  return (
    <div>
      {/* Platform stats bar */}
      <div className="flex gap-8 mb-6 pb-6 border-b border-border">
        <div>
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground">Members</p>
          <p className="text-2xl font-serif font-light mt-0.5">{members.length}</p>
        </div>
        <div>
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground">Collections</p>
          <p className="text-2xl font-serif font-light mt-0.5">{fmtNum(totalCollections)}</p>
        </div>
        <div>
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground">Total Views</p>
          <p className="text-2xl font-serif font-light mt-0.5">{fmtNum(totalViews)}</p>
        </div>
      </div>

      {/* Top performers ranking */}
      {top3.length > 0 && (
        <div className="mb-7">
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-3">
            Top Performers · Ranked by Views
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {top3.map((m, i) => (
              <button
                key={m.memberId}
                onClick={() => onSelectMember(m.memberId)}
                className="text-left border border-border hover:border-foreground/40 p-4 transition-colors group"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-xl leading-none">{medals[i]}</span>
                  <span className="text-xs font-medium line-clamp-1">{m.fullName}</span>
                </div>
                <div className="flex gap-4 text-[10px] text-muted-foreground">
                  <span>
                    <span className="text-foreground font-medium">{fmtNum(m.totalViews)}</span>{" "}
                    Views
                  </span>
                  <span>
                    <span className="text-foreground font-medium">{m.totalCollections}</span>{" "}
                    Collections
                  </span>
                </div>
              </button>
            ))}
            {top3.length < 3 &&
              Array.from({ length: 3 - top3.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="border border-dashed border-border p-4 flex items-center justify-center"
                >
                  <p className="text-[10px] text-muted-foreground/40 tracking-widest uppercase">
                    {medals[top3.length + i]} —
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Sort + Search row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex gap-0 border border-border shrink-0 flex-wrap">
          {(
            [
              { key: "views",       label: "Most Views",       live: true  },
              { key: "collections", label: "Most Collections", live: true  },
              { key: "looks",       label: "Most Looks",       live: true  },
              { key: "ordered",     label: "Most Ordered",     live: false },
              { key: "newest",      label: "Newest",           live: false },
            ] as { key: SortKey; label: string; live: boolean }[]
          ).map(({ key, label, live }) =>
            live ? (
              <button
                key={key}
                onClick={() => onSort(key)}
                className={`px-3 py-2 text-[10px] tracking-widest uppercase transition-colors whitespace-nowrap ${
                  sort === key
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                }`}
              >
                {label}
              </button>
            ) : (
              <div
                key={key}
                className="relative px-3 py-2 text-[10px] tracking-widest uppercase whitespace-nowrap text-muted-foreground/35 select-none cursor-default"
                title="Coming soon"
              >
                {label}
                <span className="ml-1.5 text-[8px] tracking-widest uppercase text-muted-foreground/40">
                  Soon
                </span>
              </div>
            )
          )}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search team member..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-border bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors"
          />
        </div>
      </div>

      {/* Member list */}
      {sorted.length === 0 ? (
        <div className="py-10 text-center text-xs text-muted-foreground border border-dashed border-border">
          No members match "{search}"
        </div>
      ) : (
        <div className="border border-border divide-y divide-border">
          {sorted.map((m) => (
            <button
              key={m.memberId}
              onClick={() => onSelectMember(m.memberId)}
              className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-accent/20 transition-colors text-left group"
            >
              <div className="shrink-0 h-9 w-9 border border-border bg-accent/40 flex items-center justify-center">
                <span className="text-[11px] tracking-wide font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {memberInitials(m.fullName)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium line-clamp-1">{m.fullName}</p>
                <p className="text-[10px] text-muted-foreground">@{m.username}</p>
              </div>
              <div className="flex gap-5 shrink-0">
                <div className="text-right">
                  <p className="text-xs font-medium">{m.totalCollections}</p>
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground">
                    Collections
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium">{m.totalLooks}</p>
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Looks</p>
                </div>
                <div className="text-right min-w-[56px]">
                  <p className="text-xs font-medium">{fmtNum(m.totalViews)}</p>
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Views</p>
                </div>
              </div>
              <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground rotate-180 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MemberDetailView({
  detail,
  loading,
  copied,
  onBack,
  onCopyLink,
}: {
  detail: MemberDetail | null;
  loading: boolean;
  copied: number | null;
  onBack: () => void;
  onCopyLink: (shareToken: string, id: number) => Promise<void>;
}) {
  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="h-3 w-3" />
        Back to Overview
      </button>

      {loading || !detail ? (
        <div className="py-24 text-center">
          <p className="text-xs tracking-widest uppercase text-muted-foreground animate-pulse">
            Loading...
          </p>
        </div>
      ) : (
        <CollectionDetailContent
          detail={detail}
          copied={copied}
          onCopyLink={onCopyLink}
        />
      )}
    </div>
  );
}

function CollectionDetailContent({
  detail,
  copied,
  onCopyLink,
}: {
  detail: MemberDetail;
  copied: number | null;
  onCopyLink: (shareToken: string, id: number) => Promise<void>;
}) {
  const { member, collections } = detail;
  const totalViews = collections.reduce((s, c) => s + c.views, 0);

  return (
    <div>
      {/* Member header */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
        <div className="h-12 w-12 border border-border bg-accent/40 flex items-center justify-center shrink-0">
          <span className="text-sm font-medium text-muted-foreground">
            {memberInitials(member.fullName)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-xl font-light">
            {member.fullName}'s Collections
          </h3>
          <p className="text-xs text-muted-foreground">@{member.username}</p>
        </div>
        <div className="flex gap-6 text-right shrink-0">
          <div>
            <p className="text-xl font-serif font-light">{collections.length}</p>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Collections</p>
          </div>
          <div>
            <p className="text-xl font-serif font-light">{fmtNum(totalViews)}</p>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Total Views</p>
          </div>
        </div>
      </div>

      {collections.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border">
          <FolderOpen className="h-7 w-7 mx-auto mb-3 text-muted-foreground/25" strokeWidth={1.5} />
          <p className="text-xs text-muted-foreground">This member has no collections yet.</p>
        </div>
      ) : (
        <div className="border border-border divide-y divide-border">
          <div className="grid grid-cols-[36px_1fr_72px_64px_72px_36px] gap-3 px-4 py-2.5 bg-accent/30">
            <div />
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground">Collection</p>
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground text-right">
              Products
            </p>
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground text-right">
              Views
            </p>
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground">Status</p>
            <div />
          </div>

          {collections.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-[36px_1fr_72px_64px_72px_36px] gap-3 items-center px-4 py-3 hover:bg-accent/20 transition-colors"
            >
              <div className="h-9 w-9 overflow-hidden bg-accent/40 border border-border">
                {c.coverImageUrl ? (
                  <img
                    src={c.coverImageUrl}
                    alt={c.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FolderOpen className="h-3.5 w-3.5 text-muted-foreground/30" strokeWidth={1.5} />
                  </div>
                )}
              </div>

              <p className="text-xs font-medium line-clamp-1">{c.title}</p>

              <p className="text-xs text-muted-foreground text-right">{c.productCount}</p>

              <p className="text-xs font-medium text-right">{fmtNum(c.views)}</p>

              <span
                className={`text-[9px] tracking-widest uppercase px-1.5 py-0.5 w-fit ${
                  c.status === "active"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-accent text-muted-foreground border border-border"
                }`}
              >
                {c.status}
              </span>

              <button
                onClick={() => void onCopyLink(c.shareToken, c.id)}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors justify-self-end"
                title="Copy share link"
              >
                {copied === c.id ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Link2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
