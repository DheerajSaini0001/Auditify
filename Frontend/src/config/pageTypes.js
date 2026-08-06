import {
  Home, LayoutGrid, Car, Tag, Repeat, Key, CreditCard, Wrench, Info, Newspaper,
  MapPin, Megaphone, Building2, CalendarCheck, Receipt,
} from "lucide-react";

/**
 * The page types an audit can crawl.
 *
 * Shared by the home-page audit form and the dashboard's direct-audit bar. Kept in
 * one place because both surfaces send these keys to the same backend — the
 * `key` values must match discovery's `categories[].key`, and VALID_PAGE_SCOPES in
 * Backend/controllers/singleAuditController.js drops anything it does not
 * recognise. A second hand-copied list would silently start ignoring scopes.
 */

/** Dealership sites. */
export const PAGE_TYPES = [
  { key: 'home', label: 'Home Page', desc: 'Hero, brand, primary CTAs', Icon: Home },
  { key: 'srp', label: 'Inventory / SRP', desc: 'Search results page, filters', Icon: LayoutGrid },
  { key: 'vdp', label: 'Vehicle Detail / VDP', desc: 'Per-car detail + lead form', Icon: Car },
  { key: 'trade', label: 'Trade-In Tool', desc: 'KBB-style valuation, lead capture', Icon: Repeat },
  { key: 'lease', label: 'Lease Deals', desc: 'Lease offers + calculator', Icon: Key },
  { key: 'specials', label: 'Offers & Specials', desc: 'Deals, incentives, rebates', Icon: Tag },
  { key: 'finance', label: 'Financing', desc: 'Credit application, payment tools', Icon: CreditCard },
  { key: 'service', label: 'Service & Parts', desc: 'Service, repair, parts & accessories', Icon: Wrench },
  { key: 'about', label: 'About / Contact', desc: 'Hours, staff, directions', Icon: Info },
  { key: 'content', label: 'Content / Blog', desc: 'Blog, news, FAQ, how-to', Icon: Newspaper },
];

/** Corporate / OEM sites — shown once discovery reports siteType "corporate". */
export const CORPORATE_PAGE_TYPES = [
  { key: 'home', label: 'Home Page', desc: 'Hero, brand, primary CTAs', Icon: Home },
  { key: 'models', label: 'Models & Lineup', desc: 'Vehicle lineup, research, build & price', Icon: LayoutGrid },
  { key: 'locator', label: 'Dealer Locator', desc: 'Find a dealer near you', Icon: MapPin },
  { key: 'press', label: 'Press & News', desc: 'Newsroom, media, investor relations', Icon: Megaphone },
  { key: 'about', label: 'About / Corporate', desc: 'Company info, leadership, careers', Icon: Building2 },
  { key: 'content', label: 'Content / Blog', desc: 'Blog, guides, FAQ', Icon: Newspaper },
];

/**
 * Service centres and repair garages — shown once discovery reports siteType
 * "service" (sub-types "service" and "repair" share this catalog; they differ in
 * how parameters are weighted, not in which pages exist). No inventory pages:
 * these businesses sell labour, and offering SRP/VDP/trade/lease scopes for them
 * would only produce "not found" rows for pages they correctly do not have.
 */
export const SERVICE_PAGE_TYPES = [
  { key: 'home', label: 'Home Page', desc: 'Hero, services, primary CTAs', Icon: Home },
  { key: 'booking', label: 'Book / Appointment', desc: 'Online booking — the main funnel', Icon: CalendarCheck },
  { key: 'service', label: 'Services', desc: 'Service menu, repairs, parts & tyres', Icon: Wrench },
  { key: 'pricing', label: 'Pricing & Quotes', desc: 'Prices, labour rates, quote form', Icon: Receipt },
  { key: 'locations', label: 'Locations', desc: 'Branches, service areas, directions', Icon: MapPin },
  { key: 'about', label: 'About / Contact', desc: 'Team, accreditations, hours', Icon: Info },
  { key: 'content', label: 'Content / Blog', desc: 'Car-care tips, FAQ, guides', Icon: Newspaper },
];

/** The catalog for a given detected siteType. Falls back to the dealer set. */
export const pageTypesFor = (siteType) =>
  siteType === 'corporate' ? CORPORATE_PAGE_TYPES
    : siteType === 'service' ? SERVICE_PAGE_TYPES
      : PAGE_TYPES;

/**
 * The default scope for a new audit: just the URL the user typed.
 *
 * 'home' is the one key present in EVERY catalog, so it survives whichever site
 * type discovery comes back with — no cross-catalog union needed.
 */
export const DEFAULT_PAGE_SCOPES = ['home'];
