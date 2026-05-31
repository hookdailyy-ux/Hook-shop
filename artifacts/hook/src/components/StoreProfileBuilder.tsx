import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SingleImageUpload } from "@/components/ImageUploadField";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, MessageCircle, User, Check } from "lucide-react";
import type { TeamMemberInfo } from "@/contexts/TeamAuthContext";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface ProfileForm {
  displayName: string;
  bio: string;
  profilePhotoUrl: string;
  coverImageUrl: string;
  whatsapp: string;
}

export function StoreProfileBuilder({
  member,
  onSaved,
}: {
  member: TeamMemberInfo;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<ProfileForm>({
    displayName: member.displayName ?? "",
    bio: member.bio ?? "",
    profilePhotoUrl: member.profilePhotoUrl ?? "",
    coverImageUrl: member.coverImageUrl ?? "",
    whatsapp: member.whatsapp ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm({
      displayName: member.displayName ?? "",
      bio: member.bio ?? "",
      profilePhotoUrl: member.profilePhotoUrl ?? "",
      coverImageUrl: member.coverImageUrl ?? "",
      whatsapp: member.whatsapp ?? "",
    });
  }, [member]);

  const set = (k: keyof ProfileForm, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/team/profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName.trim() || null,
          bio: form.bio.trim() || null,
          profilePhotoUrl: form.profilePhotoUrl || null,
          coverImageUrl: form.coverImageUrl || null,
          whatsapp: form.whatsapp.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast({ title: "Profile saved" });
      onSaved();
    } catch {
      toast({ title: "Failed to save profile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const storeUrl = `${window.location.origin}${BASE}/store/${member.username}`;

  return (
    <div className="max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-light mb-1">My Profile</h2>
          <p className="text-sm text-muted-foreground">
            Build your public store profile.
          </p>
        </div>
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase px-4 py-2 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          Preview Store
        </a>
      </div>

      <div className="space-y-8">
        {/* Cover Image */}
        <div className="space-y-3">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground block">
            Cover / Banner Image
          </label>
          <div className="border border-border overflow-hidden">
            {form.coverImageUrl ? (
              <div className="relative">
                <div className="aspect-[4/1] overflow-hidden">
                  <img
                    src={form.coverImageUrl}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => set("coverImageUrl", "")}
                    className="bg-background/90 text-foreground text-[10px] tracking-widest uppercase px-4 py-2 border border-border"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="aspect-[4/1] bg-accent/30 flex items-center justify-center">
                <p className="text-[10px] tracking-widest uppercase text-muted-foreground/50">
                  No cover image
                </p>
              </div>
            )}
          </div>
          <SingleImageUpload
            value={form.coverImageUrl}
            onChange={(url) => set("coverImageUrl", url ?? "")}
          />
        </div>

        {/* Profile Photo */}
        <div className="space-y-3">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground block">
            Profile Photo
          </label>
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 shrink-0 overflow-hidden border border-border bg-accent/30 flex items-center justify-center">
              {form.profilePhotoUrl ? (
                <img
                  src={form.profilePhotoUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-6 w-6 text-muted-foreground/30" strokeWidth={1} />
              )}
            </div>
            <div className="flex-1">
              <SingleImageUpload
                value={form.profilePhotoUrl}
                onChange={(url) => set("profilePhotoUrl", url ?? "")}
              />
            </div>
          </div>
        </div>

        {/* Read-only info */}
        <div className="border border-border divide-y divide-border">
          <div className="flex items-center px-4 py-3 gap-6">
            <span className="text-[10px] tracking-widest uppercase text-muted-foreground w-28 shrink-0">
              Full Name
            </span>
            <span className="text-sm text-muted-foreground">{member.fullName}</span>
          </div>
          <div className="flex items-center px-4 py-3 gap-6">
            <span className="text-[10px] tracking-widest uppercase text-muted-foreground w-28 shrink-0">
              Username
            </span>
            <span className="text-sm font-mono text-muted-foreground">@{member.username}</span>
          </div>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground block">
            Display Name
            <span className="ml-2 normal-case tracking-normal text-muted-foreground/50">
              shown publicly instead of full name
            </span>
          </label>
          <Input
            value={form.displayName}
            onChange={(e) => set("displayName", e.target.value)}
            placeholder={member.fullName}
            maxLength={80}
          />
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Bio / About Me
            </label>
            <span className="text-[10px] text-muted-foreground/50">
              {form.bio.length}/500
            </span>
          </div>
          <Textarea
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
            placeholder="Tell your audience about yourself…"
            rows={4}
            maxLength={500}
            className="resize-none"
          />
        </div>

        {/* WhatsApp */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <MessageCircle className="h-3 w-3" />
            WhatsApp Number
          </label>
          <Input
            value={form.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value)}
            placeholder="+60123456789"
            maxLength={30}
          />
          <p className="text-[10px] text-muted-foreground/60">
            Include country code. Customers can contact you directly.
          </p>
        </div>

        {/* Store link preview */}
        <div className="border border-border bg-accent/10 px-4 py-4">
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
            Your Store URL
          </p>
          <p className="text-sm font-mono text-foreground break-all">{storeUrl}</p>
        </div>

        {/* Save */}
        <div className="flex items-center gap-4 pt-2">
          <Button
            onClick={() => void handleSave()}
            disabled={loading}
            className="text-xs tracking-widest uppercase gap-2"
          >
            {saved ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Saved
              </>
            ) : loading ? (
              "Saving…"
            ) : (
              "Save Profile"
            )}
          </Button>

          {/* Change password link */}
          <button
            onClick={() => {
              /* trigger change password — handled by parent */
            }}
            className="text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
}
