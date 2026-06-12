import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

const BASKET_KEY = "hook_basket_v3";
const BASKET_GROUPS_KEY = "hook_basket_groups_v1";

export function inferStore(affiliateUrl: string): "SHEIN" | "Amazon" | "Other" {
  const url = (affiliateUrl ?? "").toLowerCase();
  if (url.includes("shein")) return "SHEIN";
  if (url.includes("amazon") || url.includes("amzn")) return "Amazon";
  return "Other";
}

export interface BasketItem {
  id: string;
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
  amazonUrl: string | null;
  amazonPrice: string | null;
  sourceMemberId: number;
  sourceMemberUsername: string;
  sourceMemberName: string;
  sourceContext: "store" | "collection" | "look";
  sourceToken: string | null;
  availableSizes?: string[] | null;
}

export interface BasketGroup {
  id: string;
  type: "look" | "setup";
  title: string;
  imageUrl: string | null;
  collectionId: number;
  items: BasketItem[];
}

export type AddItemInput = Omit<BasketItem, "id" | "key" | "numericPrice" | "quantity">;

export type AddGroupInput = {
  type: "look" | "setup";
  title: string;
  imageUrl: string | null;
  collectionId: number;
  items: AddItemInput[];
};

interface BasketContextType {
  items: BasketItem[];
  groups: BasketGroup[];
  isOpen: boolean;
  openBasket: () => void;
  closeBasket: () => void;
  addItem: (item: AddItemInput, qty?: number) => void;
  addGroup: (group: AddGroupInput) => void;
  removeItem: (key: string) => void;
  removeItems: (keys: string[]) => void;
  removeGroup: (groupId: string) => void;
  removeGroupItem: (groupId: string, itemKey: string) => void;
  updateQty: (key: string, qty: number) => void;
  updateItemFields: (key: string, fields: Partial<BasketItem>) => void;
  editItem: (id: string, size: string | null, color: string | null, qty: number) => void;
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

function buildItem(incoming: AddItemInput): BasketItem {
  const key = buildBasketKey(incoming.productId, incoming.size, incoming.color, incoming.productSource);
  return {
    ...incoming,
    id: newId(),
    key,
    numericPrice: parseNumericPrice(incoming.displayPrice),
    quantity: 1,
  };
}

function loadFromStorage(): BasketItem[] {
  try {
    const raw = localStorage.getItem(BASKET_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw) as BasketItem[];
    return items.map((i) => ({
      ...i,
      id: i.id ?? newId(),
      productSource: i.productSource ?? inferStore(i.affiliateUrl),
      amazonUrl: i.amazonUrl ?? null,
      amazonPrice: i.amazonPrice ?? null,
    }));
  } catch {
    return [];
  }
}

function saveToStorage(items: BasketItem[]) {
  localStorage.setItem(BASKET_KEY, JSON.stringify(items));
}

function loadGroupsFromStorage(): BasketGroup[] {
  try {
    const raw = localStorage.getItem(BASKET_GROUPS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as BasketGroup[];
  } catch {
    return [];
  }
}

function saveGroupsToStorage(groups: BasketGroup[]) {
  localStorage.setItem(BASKET_GROUPS_KEY, JSON.stringify(groups));
}

export function BasketProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BasketItem[]>(() => loadFromStorage());
  const [groups, setGroups] = useState<BasketGroup[]>(() => loadGroupsFromStorage());
  const [isOpen, setIsOpen] = useState(false);

  const currentMemberId = items[0]?.sourceMemberId ?? groups[0]?.items[0]?.sourceMemberId ?? null;
  const currentMemberUsername = items[0]?.sourceMemberUsername ?? groups[0]?.items[0]?.sourceMemberUsername ?? null;
  const currentMemberName = items[0]?.sourceMemberName ?? groups[0]?.items[0]?.sourceMemberName ?? null;

  const commitItems = useCallback((next: BasketItem[]) => {
    setItems(next);
    saveToStorage(next);
  }, []);

  const commitGroups = useCallback((next: BasketGroup[]) => {
    setGroups(next);
    saveGroupsToStorage(next);
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
        const key = buildBasketKey(incoming.productId, incoming.size, incoming.color, incoming.productSource);
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

  const addGroup = useCallback((input: AddGroupInput) => {
    const group: BasketGroup = {
      id: newId(),
      type: input.type,
      title: input.title,
      imageUrl: input.imageUrl,
      collectionId: input.collectionId,
      items: input.items.map(buildItem),
    };
    setGroups((prev) => {
      // Replace existing group for same collectionId + type if any
      const filtered = prev.filter(
        (g) => !(g.collectionId === input.collectionId && g.type === input.type)
      );
      const next = [...filtered, group];
      saveGroupsToStorage(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.key !== key);
      saveToStorage(next);
      return next;
    });
  }, []);

  const removeItems = useCallback((keys: string[]) => {
    const keySet = new Set(keys);
    setItems((prev) => {
      const next = prev.filter((i) => !keySet.has(i.key));
      saveToStorage(next);
      return next;
    });
  }, []);

  const removeGroup = useCallback((groupId: string) => {
    setGroups((prev) => {
      const next = prev.filter((g) => g.id !== groupId);
      saveGroupsToStorage(next);
      return next;
    });
  }, []);

  const removeGroupItem = useCallback((groupId: string, itemKey: string) => {
    setGroups((prev) => {
      const next = prev
        .map((g) =>
          g.id === groupId
            ? { ...g, items: g.items.filter((i) => i.key !== itemKey) }
            : g
        )
        .filter((g) => g.items.length > 0);
      saveGroupsToStorage(next);
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
      const next = prev.map((i) => (i.key === key ? { ...i, ...fields } : i));
      saveToStorage(next);
      return next;
    });
  }, []);

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
          i.id === id ? { ...i, key: newKey, size, color, quantity: qty } : i
        );
        saveToStorage(next);
        return next;
      });
    },
    []
  );

  const clearBasket = useCallback(() => {
    commitItems([]);
    commitGroups([]);
  }, [commitItems, commitGroups]);

  const loadItems = useCallback(
    (newItems: BasketItem[]) => {
      commitItems(newItems.map((i) => ({ ...i, id: i.id ?? newId() })));
    },
    [commitItems]
  );

  const openBasket = useCallback(() => setIsOpen(true), []);
  const closeBasket = useCallback(() => setIsOpen(false), []);

  const groupItemCount = groups.reduce((s, g) => s + g.items.length, 0);
  const totalItems = items.reduce((s, i) => s + i.quantity, 0) + groupItemCount;

  const allItems = [...items, ...groups.flatMap((g) => g.items)];
  const allHavePrice = allItems.length > 0 && allItems.every((i) => i.numericPrice !== null);
  const totalPrice = allHavePrice
    ? allItems.reduce((s, i) => s + (i.numericPrice ?? 0) * i.quantity, 0)
    : null;

  return (
    <BasketContext.Provider
      value={{
        items,
        groups,
        isOpen,
        openBasket,
        closeBasket,
        addItem,
        addGroup,
        removeItem,
        removeItems,
        removeGroup,
        removeGroupItem,
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
