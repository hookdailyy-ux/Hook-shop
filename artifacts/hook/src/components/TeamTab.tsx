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
  RotateCcw,
  Trash2,
  Wifi,
  WifiOff,
  User,
  Check,
  X,
  ChevronLeft,
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

type SubView = "members" | "add";

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
        {(["members", "add"] as SubView[]).map((v) => (
          <button
            key={v}
            onClick={() => setSubView(v)}
            className={`px-5 py-3 text-xs tracking-widest uppercase border-b-2 transition-colors ${
              subView === v
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {v === "members" ? "Team Members" : "Add Member"}
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
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs tracking-widest uppercase text-muted-foreground">
          {members.length} member{members.length !== 1 ? "s" : ""}
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
              {members.map((m) => (
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
                    <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onView(m.id)}
                        className="p-1.5 hover:bg-accent transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onEdit(m)}
                        className="p-1.5 hover:bg-accent transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onToggleStatus(m)}
                        className="p-1.5 hover:bg-accent transition-colors"
                        title={m.status === "active" ? "Disable" : "Enable"}
                      >
                        {m.status === "active" ? (
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        )}
                      </button>
                      <button
                        onClick={() => onResetPassword(m)}
                        className="p-1.5 hover:bg-accent transition-colors"
                        title="Reset Password"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
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

function ResetPasswordForm({
  member,
  onSuccess,
}: {
  member: TeamMember;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
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
      onSuccess();
    } catch {
      toast({ title: "Failed to reset password", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <p className="text-xs text-muted-foreground">
        Resetting password for <strong className="font-medium text-foreground">{member.fullName}</strong>{" "}
        (@{member.username}). They will be required to change it on next login.
      </p>

      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
          New Password <span className="text-destructive">*</span>
        </label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 6 characters"
          required
          className="border-border"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Confirm Password <span className="text-destructive">*</span>
        </label>
        <Input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat password"
          required
          className="border-border"
        />
      </div>

      <div className="pt-1">
        <Button type="submit" disabled={loading} className="text-xs tracking-widest uppercase">
          {loading ? "Resetting..." : "Reset Password"}
        </Button>
      </div>
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
