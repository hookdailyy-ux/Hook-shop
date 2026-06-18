/**
 * Single source of truth for HOOK's main product categories.
 *
 * This intentionally does NOT include:
 *  - "none" — an admin-only "no category assigned" placeholder, not a real
 *    shoppable category. It stays defined locally in AdminDashboard.tsx.
 *  - "look" / "setup" / "favorites" — standalone sections, not categories.
 *
 * Every value/label/path/key below was copied as-is from the previous
 * hardcoded copies in AdminDashboard.tsx, CategoryPage.tsx, App.tsx, and
 * ProductDetail.tsx. Nothing was renamed, added, or removed.
 */

export interface CategoryConfig {
  /** Matches the `category` value stored on products. */
  value: string;
  /** Short label used in admin UI (dropdowns, placement panel, site images tab). */
  label: string;
  /** Public route path for this category's CategoryPage. */
  path: string;
  /** i18n key for the CategoryPage hero title. */
  titleKey: string;
  /** i18n key for the CategoryPage hero description. */
  descKey: string;
  /** Whether the "Explore More via SHEIN" button can appear on this category. */
  showDiscoverMore: boolean;
  /**
   * i18n key for the nav/breadcrumb label. Only set where a translation
   * already existed (women/men/accessories/home/electronics) — "couples"
   * and "kids" never had one in ProductDetail.tsx, so they intentionally
   * have no navKey here. Consumers must reproduce that fallback exactly:
   * `navKey ? t(navKey) : capitalize(value)`.
   */
  navKey?: string;
}

export const CATEGORIES: CategoryConfig[] = [
  {
    value: "women",
    label: "Women",
    path: "/women",
    titleKey: "category.women.title",
    descKey: "category.women.description",
    showDiscoverMore: true,
    navKey: "nav.women",
  },
  {
    value: "men",
    label: "Men",
    path: "/men",
    titleKey: "category.men.title",
    descKey: "category.men.description",
    showDiscoverMore: true,
    navKey: "nav.men",
  },
  {
    value: "couples",
    label: "Couples",
    path: "/couples",
    titleKey: "category.couples.title",
    descKey: "category.couples.description",
    showDiscoverMore: true,
  },
  {
    value: "kids",
    label: "Kids",
    path: "/kids",
    titleKey: "category.kids.title",
    descKey: "category.kids.description",
    showDiscoverMore: true,
  },
  {
    value: "electronics",
    label: "Electronics",
    path: "/electronics",
    titleKey: "category.electronics.title",
    descKey: "category.electronics.description",
    showDiscoverMore: false,
    navKey: "nav.electronics",
  },
  {
    value: "home",
    label: "Home Essentials",
    path: "/home-essentials",
    titleKey: "category.homeEssentials.title",
    descKey: "category.homeEssentials.description",
    showDiscoverMore: true,
    navKey: "nav.homeEssentials",
  },
  {
    value: "accessories",
    label: "Accessories",
    path: "/accessories",
    titleKey: "category.accessories.title",
    descKey: "category.accessories.description",
    showDiscoverMore: true,
    navKey: "nav.accessories",
  },
];

/** Flat list of category values — e.g. for membership checks like `.includes(...)`. */
export const CATEGORY_VALUES = CATEGORIES.map((c) => c.value);

/** Look up a category's config by its value. Returns undefined for unknown values (e.g. "none"). */
export function getCategoryConfig(value: string): CategoryConfig | undefined {
  return CATEGORIES.find((c) => c.value === value);
}
