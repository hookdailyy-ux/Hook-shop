import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetSetup,
  useListSetups,
  getGetSetupQueryKey,
  getListSetupsQueryKey,
} from "@workspace/api-client-react";
import type { Setup } from "@workspace/api-client-react";
import { SetupCard } from "@/components/SetupCard";
import { useBasket, inferStore } from "@/contexts/BasketContext";

import { ShoppingCart, Check, ArrowLeft, ShoppingBag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { resolveImageUrl } from "@/lib/apiBase";

// ── Compact mini-card for "You May Also Like" ─────────────────────────────────

function SetupMiniCard({ setup }: { setup: Setup }) {
  return (
    <Link
      href={`/shop-the-setup/${setup.id}`}
      className="group flex flex-col gap-3"
      data-testid={`setup-mini-card-${setup.id}`}
    >
      <div className="relative aspect-[3/4] bg-[#e8e0d4] overflow-hidden">
        {setup.imageUrl ? (
          <img
            src={resolveImageUrl(setup.imageUrl)}
            alt={setup.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingBag className="h-6 w-6 text-muted-foreground/20" strokeWidth={1} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 px-0.5">
        <p className="text-xs font-medium leading-snug line-clamp-2 group-hover:underline decoration-1 underline-offset-2">
          {setup.title}
        </p>
        {(setup.products?.length ?? 0) > 0 && (
          <p className="text-[10px] text-muted-foreground tracking-wide">
            {setup.products!.length} {setup.products!.length === 1 ? "item" : "items"}
          </p>
        )}
      </div>
    </Link>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function SetupDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { t } = useTranslation();
  const [addedAll, setAddedAll] = useState(false);
  const { addGroup, openBasket } = useBasket();

  const { data: setup, isLoading, isError } = useGetSetup(id, {
    query: { queryKey: getGetSetupQueryKey(id), enabled: !!id && !isNaN(id) },
  });

  const { data: allSetups } = useListSetups(
    {},
    { query: { queryKey: getListSetupsQueryKey() } },
  );
  const otherSetups = (allSetups ?? []).filter((s) => s.id !== id).slice(0, 8);

  const handleAddAll = () => {
    if (!setup?.products?.length) return;
    addGroup({
      type: "setup",
      title: setup.title,
      imageUrl: setup.imageUrl ?? null,
      collectionId: setup.id,
      items: setup.products.map((product) => ({
        productId: product.id,
        productTitle: product.title,
        productImageUrl: product.imageUrl ?? null,
        displayPrice: product.price ?? null,
        affiliateUrl: product.affiliateUrl,
        brand: product.brand ?? null,
        size: null,
        color: null,
        productSource: product.source ?? inferStore(product.affiliateUrl),
        amazonUrl: null,
        amazonPrice: null,
        sourceMemberId: 0,
        sourceMemberUsername: "",
        sourceMemberName: "",
        sourceContext: "look" as const,
        sourceToken: null,
      })),
    });
    setAddedAll(true);
    setTimeout(() => {
      setAddedAll(false);
      openBasket();
    }, 800);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse">
          <div className="w-full bg-accent/50" style={{ aspectRatio: "3/4", maxHeight: "80dvh" }} />
          <div className="mt-8 space-y-3 text-center">
            <div className="h-3 w-16 bg-accent/50 mx-auto" />
            <div className="h-8 w-64 bg-accent/50 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !setup) {
    return (
      <div className="py-32 text-center max-w-sm mx-auto px-4">
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Not Found</p>
        <h1 className="font-serif text-2xl font-light mb-4">Setup unavailable</h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          This setup may have been removed or doesn't exist.
        </p>
        <Link
          href="/shop-the-setup"
          className="text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          Browse all setups →
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 sm:px-6 pt-5 pb-2">
        <Link
          href="/shop-the-setup"
          className="inline-flex items-center gap-2 text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          All Setups
        </Link>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        {/* Setup card — gallery + products + QuickView */}
        <SetupCard setup={setup} />

        {/* Add All to Basket */}
        {(setup.products?.length ?? 0) > 0 && (
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleAddAll}
              className="flex items-center justify-center gap-2 px-10 py-4 bg-foreground text-background text-[11px] tracking-widest uppercase hover:opacity-90 transition-opacity"
              data-testid="button-add-all-setup"
            >
              {addedAll ? (
                <><Check className="h-3.5 w-3.5" />Added to basket!</>
              ) : (
                <><ShoppingCart className="h-3.5 w-3.5" />Add all {setup.products!.length} items to basket</>
              )}
            </button>
            <p className="text-[9px] tracking-wide text-muted-foreground text-center">
              You can remove individual items in the basket
            </p>
          </div>
        )}

        {/* You May Also Like — other setups */}
        {otherSetups.length > 0 && (
          <div className="mt-14 pt-10 border-t border-border">
            <h2 className="font-serif text-2xl font-light mb-6">
              {t("product.youMayAlsoLike")}
            </h2>
            <div className="no-scrollbar flex gap-4 overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6 pb-3">
              {otherSetups.map((s) => (
                <div key={s.id} className="shrink-0 w-[44vw] sm:w-48 max-w-[200px]">
                  <SetupMiniCard setup={s} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
