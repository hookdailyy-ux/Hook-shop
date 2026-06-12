import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@workspace/object-storage-web";
import { Camera, MessageCircle, User, Check, ExternalLink, Loader2, X } from "lucide-react";
import type { TeamMemberInfo } from "@/contexts/TeamAuthContext";

const BASE = ((import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL) as string).replace(/\/+$/, "");

function toServingUrl(objectPath: string): string {
  return `${BASE}/api/storage${objectPath}`;
}

interface ProfileForm {
  displayName: string;
  bio: string;
  whyShopWithMe: string;
  profilePhotoUrl: string;
  coverImageUrl: string;
  whatsapp: string;
}

function InlineImageUpload({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (url: string | undefined) => void;
  children: (props: {
    isUploading: boolean;
    progress: number;
    onClick: () => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
  }) => React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const { uploadFile, isUploading, progress } = useUpload({
    basePath: `${BASE}/api/storage`,
    onSuccess: (res) => onChange(toServingUrl(res.objectPath)),
  });

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      await uploadFile(file);
    },
    [uploadFile]
  );

  return (
    <>
      {children({
        isUploading,
        progress,
        onClick: () => !isUploading && inputRef.current?.click(),
        inputRef,
      })}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
    </>
  );
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
    whyShopWithMe: member.whyShopWithMe ?? "",
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
      whyShopWithMe: member.whyShopWithMe ?? "",
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
          whyShopWithMe: form.whyShopWithMe.trim() || null,
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
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-light mb-1">My Store Profile</h2>
          <p className="text-sm text-muted-foreground">
            Set up your profile in under a minute.
          </p>
        </div>
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase px-4 py-2 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors shrink-0"
        >
          <ExternalLink className="h-3 w-3" />
          Preview
        </a>
      </div>

      <div className="space-y-7">

        {/* ── 1. Cover / Banner Image ─────────────────────────────────── */}
        <section>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Cover / Banner Image
          </p>
          <InlineImageUpload
            value={form.coverImageUrl}
            onChange={(url) => set("coverImageUrl", url ?? "")}
          >
            {({ isUploading, progress, onClick }) => (
              <div className="relative overflow-hidden border border-border bg-accent/10">
                <div
                  className={`aspect-[21/9] cursor-pointer group ${isUploading ? "pointer-events-none" : ""}`}
                  onClick={onClick}
                >
                  {form.coverImageUrl ? (
                    <>
                      <img
                        src={form.coverImageUrl}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2 text-white">
                          <Camera className="h-6 w-6" strokeWidth={1.5} />
                          <p className="text-[10px] tracking-widest uppercase">Change Photo</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 group-hover:bg-accent/30 transition-colors">
                      {isUploading ? (
                        <>
                          <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                          <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
                            Uploading {progress}%
                          </p>
                        </>
                      ) : (
                        <>
                          <Camera className="h-6 w-6 text-muted-foreground/40" strokeWidth={1.5} />
                          <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
                            Click to upload cover photo
                          </p>
                          <p className="text-[9px] text-muted-foreground/50">
                            Recommended: wide format (21:9)
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Uploading overlay on existing image */}
                  {isUploading && form.coverImageUrl && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                      <p className="text-[10px] tracking-widest uppercase text-white">
                        Uploading {progress}%
                      </p>
                    </div>
                  )}
                </div>

                {/* Remove button */}
                {form.coverImageUrl && !isUploading && (
                  <button
                    onClick={(e) => { e.stopPropagation(); set("coverImageUrl", ""); }}
                    className="absolute top-2 right-2 bg-background/90 border border-border/50 text-muted-foreground hover:text-foreground p-1.5 transition-colors"
                    title="Remove cover"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </InlineImageUpload>
        </section>

        {/* ── 2. Profile Picture ──────────────────────────────────────── */}
        <section>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            Profile Picture
          </p>
          <InlineImageUpload
            value={form.profilePhotoUrl}
            onChange={(url) => set("profilePhotoUrl", url ?? "")}
          >
            {({ isUploading, progress, onClick }) => (
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={onClick}
                  disabled={isUploading}
                  className="relative h-24 w-24 shrink-0 rounded-full overflow-hidden border border-border bg-accent/30 flex items-center justify-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                  title="Click to upload profile picture"
                >
                  {form.profilePhotoUrl ? (
                    <img
                      src={form.profilePhotoUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-muted-foreground/30" strokeWidth={1} />
                  )}

                  {/* Hover overlay */}
                  {!isUploading && (
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="h-5 w-5 text-white" strokeWidth={1.5} />
                    </div>
                  )}

                  {/* Uploading state */}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center gap-1">
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                      <span className="text-[8px] text-white tracking-widest">{progress}%</span>
                    </div>
                  )}

                  {/* Camera badge */}
                  {!isUploading && (
                    <span className="absolute bottom-0 right-0 w-7 h-7 bg-foreground rounded-full flex items-center justify-center border-2 border-background">
                      <Camera className="h-3 w-3 text-background" strokeWidth={2} />
                    </span>
                  )}
                </button>

                <div>
                  <p className="text-sm font-medium">{member.displayName ?? member.fullName}</p>
                  <p className="text-[10px] tracking-widest uppercase text-muted-foreground mt-1">
                    @{member.username}
                  </p>
                  {form.profilePhotoUrl && (
                    <button
                      type="button"
                      onClick={() => set("profilePhotoUrl", "")}
                      className="text-[10px] tracking-widest uppercase text-muted-foreground hover:text-destructive transition-colors mt-2"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>
            )}
          </InlineImageUpload>
        </section>

        {/* ── 3. Display Name ─────────────────────────────────────────── */}
        <section className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground block">
            Display Name
            <span className="ml-2 normal-case tracking-normal text-muted-foreground/50">shown publicly</span>
          </label>
          <Input
            value={form.displayName}
            onChange={(e) => set("displayName", e.target.value)}
            placeholder={member.fullName}
            maxLength={80}
          />
        </section>

        {/* ── 4. About Me ─────────────────────────────────────────────── */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">About Me</label>
            <span className="text-[10px] text-muted-foreground/40">{form.bio.length}/500</span>
          </div>
          <Textarea
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
            placeholder="Tell your audience about yourself — your style, passions, and what you curate…"
            rows={3}
            maxLength={500}
            className="resize-none"
          />
        </section>

        {/* ── 5. Why Shop With Me ─────────────────────────────────────── */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Why Shop With Me</label>
            <span className="text-[10px] text-muted-foreground/40">{form.whyShopWithMe.length}/500</span>
          </div>
          <Textarea
            value={form.whyShopWithMe}
            onChange={(e) => set("whyShopWithMe", e.target.value)}
            placeholder="Explain why your followers should shop through your store — exclusive picks, personal curation, style tips…"
            rows={3}
            maxLength={500}
            className="resize-none"
          />
        </section>

        {/* ── 6. WhatsApp ─────────────────────────────────────────────── */}
        <section className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <MessageCircle className="h-3 w-3" />
            WhatsApp Number
          </label>
          <Input
            value={form.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value)}
            placeholder="+60123456789"
            maxLength={30}
          />
          <p className="text-[10px] text-muted-foreground/50">Include country code. A WhatsApp button will appear on your store.</p>
        </section>

        {/* ── Store URL ───────────────────────────────────────────────── */}
        <div className="border border-border bg-accent/10 px-4 py-4">
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1.5">Your Store URL</p>
          <p className="text-sm font-mono text-foreground break-all">{storeUrl}</p>
        </div>

        {/* ── Save ────────────────────────────────────────────────────── */}
        <div className="pt-1 pb-8">
          <Button
            onClick={() => void handleSave()}
            disabled={loading}
            className="w-full sm:w-auto text-xs tracking-widest uppercase gap-2"
          >
            {saved ? (
              <><Check className="h-3.5 w-3.5" />Saved</>
            ) : loading ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…</>
            ) : (
              "Save Profile"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
