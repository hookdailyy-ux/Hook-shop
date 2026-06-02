import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

const BASKET_KEY = "hook_basket_v3";

export function inferStore(affiliateUrl: string): "SHEIN" | "Amazon" | "Noon" | "Other" {
  const url = (affiliateUrl ?? "").toLowerCase();
  if (url.includes("shein")) return "SHEIN";
  if (url.includes("amazon") || url.includes("amzn")) return "Amazon";
  if (url.includes("noon")) return "Noon";
  return "Other";
}

export interface BasketItem {
  /** Stable identity — never changes after creation, even when size/color/key change */
  id: string;
  /** Composite lookup key — changes when size, color or productSource change */
  key: string;
  productId: number;
  productTitle: string;
  productImageUrl: string | null;
  displayPrice: string | null;
  numericPrice: number | null;
  affiliateUrl: string;
  brand: string | null;
  quantity: number;
  size: string | null;
  color: string | null;
  productSource: string;
  noonUrl: string | null;
  amazonUrl: string | null;
  noonPrice: string | null;
  amazonPrice: string | null;
  sourceMemberId: number;
  sourceMemberUsername: string;
  sourceMemberName: string;
  sourceContext: "store" | "collection" | "look";
  sourceToken: string | null;
}

export type AddItemInput = Omit<BasketItem, "id" | "key" | "numericPrice" | "quantity">;

interface BasketContextType {
  items: BasketItem[];
  isOpen: boolean;
  openBasket: () => void;
  closeBasket: () => void;
  addItem: (item: AddItemInput, qty?: number) => void;
  removeItem: (key: string) => void;
  updateQty: (key: string, qty: number) => void;
  updateItemFields: (key: string, fields: Partial<BasketItem>) => void;
  /** Edit an item by its stable id — safe even when key changes */
  editItem: (
    id: string,
    size: string | null,
    color: string | null,
    qty: number
  ) => void;
  clearBasket: () => void;
  loadItems: (items: BasketItem[]) => void;
  totalItems: number;
  totalPrice: number | null;
  currentMemberId: number | null;
  currentMemberUsername: string | null;
  currentMemberName: string | null;
}

const BasketContext = createContext<BasketContextType | null>(null);

export function useBasket() {
  const ctx = useContext(BasketContext);
  if (!ctx) throw new Error("useBasket must be used within BasketProvider");
  return ctx;
}

export function buildBasketKey(
  productId: number,
  size?: string | null,
  color?: string | null,
  productSource?: string | null
): string {
  return `${productId}-${size ?? ""}-${color ?? ""}-${productSource ?? ""}`;
}

function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseNumericPrice(displayPrice: string | null): number | null {
  if (!displayPrice) return null;
  const match = displayPrice.match(/[\d,.]+/);
  if (!match) return null;
  return parseFloat(match[0].replace(/,/g, ""));
}

function loadFromStorage(): BasketItem[] {
  try {
    const raw = localStorage.getItem(BASKET_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw) as BasketItem[];
    return items.map((i) => ({
      ...i,
      // Back-fill stable id for items saved before this field existed
      id: i.id ?? newId(),
      productSource: i.productSource ?? inferStore(i.affiliateUrl),
      noonUrl: i.noonUrl ?? null,
      amazonUrl: i.amazonUrl ?? null,
      noonPrice: i.noonPrice ?? null,
      amazonPrice: i.amazonPrice ?? null,
    }));
  } catch {
    return [];
  }
}

function saveToStorage(items: BasketItem[]) {
  localStorage.setItem(BASKET_KEY, JSON.stringify(items));
}

export function BasketProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BasketItem[]>(() => loadFromStorage());
  const [isOpen, setIsOpen] = useState(false);

  const currentMemberId = items[0]?.sourceMemberId ?? null;
  const currentMemberUsername = items[0]?.sourceMemberUsername ?? null;
  const currentMemberName = items[0]?.sourceMemberName ?? null;

  const commit = useCallback((next: BasketItem[]) => {
    setItems(next);
    saveToStorage(next);
  }, []);

  const addItem = useCallback(
    (incoming: AddItemInput, qty = 1) => {
      setItems((prev) => {
        const existingUsername = prev[0]?.sourceMemberUsername ?? "";
        const incomingUsername = incoming.sourceMemberUsername;
        const shouldClear =
          prev.length > 0 &&
          existingUsername !== "" &&
          incomingUsername !== "" &&
          existingUsername !== incomingUsername;

        const base = shouldClear ? [] : prev;
        const key = buildBasketKey(
          incoming.productId,
          incoming.size,
          incoming.color,
          incoming.productSource
        );
        const existing = base.find((i) => i.key === key);

        const next: BasketItem[] = existing
          ? base.map((i) =>
              i.key === key ? { ...i, quantity: i.quantity + qty } : i
            )
          : [
              ...base,
              {
                ...incoming,
                id: newId(),
                key,
                numericPrice: parseNumericPrice(incoming.displayPrice),
                quantity: qty,
              },
            ];

        saveToStorage(next);
        return next;
      });
    },
    []
  );

  const removeItem = useCallback((key: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.key !== key);
      saveToStorage(next);
      return next;
    });
  }, []);

  const updateQty = useCallback(
    (key: string, qty: number) => {
      if (qty <= 0) {
        removeItem(key);
        return;
      }
      setItems((prev) => {
        const next = prev.map((i) => (i.key === key ? { ...i, quantity: qty } : i));
        saveToStorage(next);
        return next;
      });
    },
    [removeItem]
  );

  const updateItemFields = useCallback((key: string, fields: Partial<BasketItem>) => {
    setItems((prev) => {
      const next = prev.map((i) =>
        i.key === key ? { ...i, ...fields } : i
      );
      saveToStorage(next);
      return next;
    });
  }, []);

  /**
   * Edit an item by its stable `id`.
   * Recomputes the key from the new size/color/productSource so the item moves
   * to the correct store group, but the item itself is never removed and re-added
   * — it is updated in place in a single atomic setItems call.
   */
  const editItem = useCallback(
    (id: string, size: string | null, color: string | null, qty: number) => {
      setItems((prev) => {
        const target = prev.find((i) => i.id === id);
        if (!target) return prev;

        if (qty <= 0) {
          const next = prev.filter((i) => i.id !== id);
          saveToStorage(next);
          return next;
        }

        const newKey = buildBasketKey(target.productId, size, color, target.productSource);

        const next = prev.map((i) =>
          i.id === id
            ? { ...i, key: newKey, size, color, quantity: qty }
            : i
        );
        saveToStorage(next);
        return next;
      });
    },
    []
  );

  const clearBasket = useCallback(() => {
    commit([]);
  }, [commit]);

  const loadItems = useCallback(
    (newItems: BasketItem[]) => {
      // Back-fill ids on externally-loaded items
      commit(newItems.map((i) => ({ ...i, id: i.id ?? newId() })));
    },
    [commit]
  );

  const openBasket = useCallback(() => setIsOpen(true), []);
  const closeBasket = useCallback(() => setIsOpen(false), []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const allHavePrice = items.length > 0 && items.every((i) => i.numericPrice !== null);
  const totalPrice = allHavePrice
    ? items.reduce((s, i) => s + (i.numericPrice ?? 0) * i.quantity, 0)
    : null;

  return (
    <BasketContext.Provider
      value={{
        items,
        isOpen,
        openBasket,
        closeBasket,
        addItem,
        removeItem,
        updateQty,
        updateItemFields,
        editItem,
        clearBasket,
        loadItems,
        totalItems,
        totalPrice,
        currentMemberId,
        currentMemberUsername,
        currentMemberName,
      }}
    >
      {children}
    </BasketContext.Provider>
  );
}
