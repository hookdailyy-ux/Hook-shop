import { useState } from "react";
import { useSubscribeNewsletter } from "@workspace/api-client-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const subscribe = useSubscribeNewsletter();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    subscribe.mutate(
      { data: { email } },
      {
        onSuccess: () => {
          toast({
            title: t("newsletter.successTitle"),
            description: t("newsletter.successDesc"),
          });
          setEmail("");
        },
        onError: () => {
          toast({
            title: t("newsletter.errorTitle"),
            description: t("newsletter.errorDesc"),
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md w-full mx-auto flex-col sm:flex-row gap-4">
      <Input
        type="email"
        placeholder={t("newsletter.emailPlaceholder")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="rounded-none border-b border-0 border-border bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground uppercase text-xs tracking-widest h-12"
      />
      <Button
        type="submit"
        disabled={subscribe.isPending}
        className="rounded-none uppercase tracking-widest text-xs h-12 px-8"
      >
        {subscribe.isPending ? t("newsletter.subscribing") : t("newsletter.subscribe")}
      </Button>
    </form>
  );
}
