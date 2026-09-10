"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownUp,
  ArrowLeftRight,
  AlertTriangle,
  BarChart3,
  BookOpen,
  Building,
  ChevronDown,
  ChevronLeft,
  Clock,
  Cloud,
  CloudLightning,
  FileText,
  HeartPulse,
  History,
  IndianRupee,
  Landmark,
  LayoutDashboard,
  Layers,
  ListCollapse,
  Package,
  Receipt,
  Scale,
  ShieldCheck,
  ScanBarcode,
  Settings,
  ShoppingCart,
  Tags,
  Truck,
  UserCheck,
  Users,
  Wallet,
  Warehouse,
  Wrench,
  X,
  Zap,
  Boxes,
  Plug,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useAccountingPreferenceStore } from "@/store/accountingPreferenceStore";
import { useBusinessStore } from "@/store/businessStore";
import { useThemeStore } from "@/store/themeStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

interface NavLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: NavLink[];
}

type NavEntry = NavLink | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

const navEntries: NavEntry[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Parties",
    icon: Users,
    children: [
      { label: "Customers", href: "/customers", icon: Users },
      { label: "Suppliers", href: "/suppliers", icon: UserCheck },
      { label: "Transporters", href: "/transporters", icon: Truck },
    ],
  },
  {
    label: "Digital Khaata",
    icon: BookOpen,
    href: "/khaata",
  },
  {
    label: "Inventory Master",
    icon: Package,
    children: [
      { label: "Products", href: "/products", icon: Package },
      { label: "Categories", href: "/categories", icon: Tags },
      { label: "Subcategories", href: "/subcategories", icon: Layers },
      { label: "Opening Stock", href: "/inventory/opening-stock", icon: Boxes },
      { label: "Inventory Manager", href: "/inventory", icon: Warehouse },
      { label: "Stores / Godowns", href: "/inventory/godowns", icon: Building },
    ],
  },
  {
    label: "Sale",
    icon: ShoppingCart,
    children: [
      { label: "Sale Invoices", href: "/sales", icon: FileText },
      { label: "POS Billing", href: "/pos", icon: Zap },
      { label: "Payment-In", href: "/sales/payment-in", icon: Wallet },
      { label: "Sale Return / Credit Note", href: "/sales/return", icon: ArrowLeftRight },
    ],
  },
  {
    label: "Purchase",
    icon: Receipt,
    children: [
      { label: "Purchase Bills", href: "/purchases", icon: FileText },
      { label: "Payment-Out", href: "/purchases/payment-out", icon: Wallet },
      // { label: "Expenses", href: "/expenses", icon: IndianRupee },
      { label: "Purchase Return / Debit Note", href: "/purchases/return", icon: Receipt },
    ],
  },
  // {
  //   label: "Inventory",
  //   icon: Warehouse,
  //   children: [
  //     { label: "Inventory Manager", href: "/inventory", icon: Warehouse },
  //     { label: "Opening Stock", href: "/inventory/opening-stock", icon: Boxes },
  //   ],
  // },
  {
    label: "Cash & Bank",
    icon: Wallet,
    children: [
      { label: "Transaction History", href: "/cash-bank/transaction-history", icon: History },
      { label: "Bank Accounts", href: "/bank", icon: Building },
      { label: "Cash", href: "/cash", icon: IndianRupee },
      { label: "Cheques", href: "/cheques", icon: Receipt },
      { label: "Loan Accounts", href: "/loans", icon: Building },
    ],
  },
  {
    label: "Expenses / Income",
    icon: ArrowDownUp,
    children: [
      { label: "Expenses", href: "/expenses", icon: IndianRupee },
      { label: "Income", href: "/expenses/income", icon: Wallet },
    ],
  },
  {
    label: "Accounting",
    icon: Landmark,
    children: [
      { label: "Dashboard", href: "/accounting", icon: Landmark },
      { label: "Chart of Accounts", href: "/accounting/chart-of-accounts", icon: Layers },
      { label: "Ledgers", href: "/accounting/ledgers", icon: ListCollapse },
      { label: "Vouchers", href: "/accounting/vouchers", icon: FileText },
      { label: "Create Journal", href: "/accounting/journal/create", icon: FileText },
      { label: "Day Book", href: "/accounting/day-book", icon: BookOpen },
      { label: "Trial Balance", href: "/accounting/trial-balance", icon: BarChart3 },
      { label: "Reports", href: "/accounting/reports", icon: BarChart3 },
      { label: "Profit & Loss", href: "/accounting/reports/profit-loss", icon: IndianRupee },
      { label: "Balance Sheet", href: "/accounting/reports/balance-sheet", icon: Scale },
      { label: "Cash Book", href: "/accounting/reports/cash-book", icon: Wallet },
      { label: "Bank Book", href: "/accounting/reports/bank-book", icon: Building },
      { label: "Receivables", href: "/accounting/reports/receivables", icon: Users },
      { label: "Payables", href: "/accounting/reports/payables", icon: UserCheck },
      { label: "GST Reports", href: "/accounting/gst", icon: Receipt },
      { label: "GST Summary", href: "/accounting/gst/summary", icon: IndianRupee },
      { label: "Output GST", href: "/accounting/gst/output", icon: FileText },
      { label: "GSTR-2 (Inward)", href: "/accounting/gst/input", icon: FileText },
      { label: "HSN Summary", href: "/accounting/gst/hsn-summary", icon: Tags },
      { label: "GSTR-1 Style", href: "/accounting/gst/gstr1", icon: BookOpen },
      { label: "GSTR-3B Summary", href: "/accounting/gst/gstr3b", icon: BookOpen },
      { label: "GST Exceptions", href: "/accounting/gst/exceptions", icon: AlertTriangle },
      { label: "Health Check", href: "/accounting/health", icon: HeartPulse },
      { label: "Reconciliation", href: "/accounting/reconciliation", icon: ShieldCheck },
      { label: "Bank Statement Import", href: "/accounting/bank-statement-import", icon: ArrowDownUp },
      { label: "Mapping Rules", href: "/accounting/mapping-rules", icon: Settings },
      { label: "Bank Import Settings", href: "/accounting/bank-import-settings", icon: Settings },
      { label: "Audit Logs", href: "/accounting/audit-logs", icon: History },
      { label: "Settings", href: "/accounting/settings", icon: Settings },
    ],
  },
  {
    label: "Reports",
    icon: BarChart3,
    href: "/reports",
  },
  {
    label: "Shifts",
    icon: Clock,
    href: "/shifts",
  },
  {
    label: "Activity Logs",
    icon: History,
    href: "/activity",
  },
  {
    label: "Sync & Backup",
    icon: Cloud,
    children: [{ label: "Backup & Restore", href: "/backup", icon: CloudLightning }],
  },
  {
    label: "Utilities",
    icon: Wrench,
    children: [
      { label: "Barcode Generator", href: "/utilities/barcode", icon: ScanBarcode },
      { label: "Import/Export", href: "/utilities/import-export", icon: ArrowDownUp },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
  {
    label: "Marketing",
    icon: Megaphone,
    href: "/marketing",
  },
  {
    label: "Integrations",
    icon: Plug,
    href: "/integrations",
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useThemeStore();
  const { user } = useAuthStore();
  const { profile, fetchProfile } = useBusinessStore();
  const { accountingEnabled, fetchAccountingPreference } = useAccountingPreferenceStore();
  const [manualOpenGroups, setManualOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!profile) fetchProfile();
  }, [fetchProfile, profile]);

  useEffect(() => {
    void fetchAccountingPreference();
  }, [fetchAccountingPreference]);

  const visibleNavEntries = useMemo(
    () => {
      const role = user?.role;
      const permissions = user?.permissions || [];
      const hasPerm = (p: string) => role === "admin" || permissions.includes(p);
      
      if (!role) return [];

      const filterLink = (link: NavLink) => {
        const href = link.href;
        if (href === "/dashboard") return hasPerm("dashboard");
        if (href.startsWith("/customers")) return hasPerm("customers");
        if (href.startsWith("/suppliers")) return hasPerm("suppliers");
        if (href.startsWith("/transporters")) return hasPerm("transporters");
        if (href.startsWith("/products")) return hasPerm("products");
        if (href.startsWith("/categories")) return hasPerm("categories");
        if (href.startsWith("/subcategories")) return hasPerm("subcategories");
        if (href.startsWith("/inventory")) return hasPerm("inventory");
        if (href === "/pos") return hasPerm("pos");
        if (href.startsWith("/sales")) return hasPerm("sales");
        if (href.startsWith("/purchases")) return hasPerm("purchases");
        if (href === "/bank") return hasPerm("bank");
        if (href === "/cash") return hasPerm("cash");
        if (href.startsWith("/cash-bank")) return hasPerm("cash-bank");
        if (href.startsWith("/cheques")) return hasPerm("cheques");
        if (href.startsWith("/loans")) return hasPerm("loans");
        if (href.startsWith("/expenses")) return hasPerm("expenses");
        if (href.startsWith("/accounting")) return accountingEnabled !== false && hasPerm("accounting");
        if (href.startsWith("/reports")) return hasPerm("reports");
        if (href.startsWith("/shifts")) return hasPerm("shifts");
        if (href.startsWith("/activity")) return hasPerm("activity");
        if (href.startsWith("/backup")) return hasPerm("backup");
        if (href.startsWith("/utilities")) return hasPerm("utilities");
        if (href.startsWith("/settings")) return hasPerm("settings");
        return true;
      };

      const filterEntry = (entry: NavEntry): NavEntry | null => {
        if (isGroup(entry)) {
          // Special case: if Accounting module is disabled globally, hide its group entirely
          if (entry.label === "Accounting" && accountingEnabled === false) return null;
          
          const filteredChildren = entry.children.filter(filterLink);
          if (filteredChildren.length > 0) {
            return { ...entry, children: filteredChildren };
          }
          return null;
        } else {
          return filterLink(entry) ? entry : null;
        }
      };

      return navEntries.map(filterEntry).filter(Boolean) as NavEntry[];
    },
    [accountingEnabled, user?.role, user?.permissions],
  );

  const flatNavLinks = useMemo(
    () => visibleNavEntries.flatMap((entry) => (isGroup(entry) ? entry.children : [entry])),
    [visibleNavEntries],
  );

  const activeLinkHref = useMemo(() => {
    const matches = flatNavLinks.filter((item) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`),
    );

    if (matches.length === 0) return null;
    return matches.reduce((best, next) =>
      best.href.length >= next.href.length ? best : next,
    ).href;
  }, [flatNavLinks, pathname]);

  const openGroups = useMemo(() => {
    const state: Record<string, boolean> = {};
    visibleNavEntries.forEach((entry) => {
      if (isGroup(entry)) {
        const isPathActive = entry.children.some((child) => child.href === activeLinkHref);
        state[entry.label] = Boolean(manualOpenGroups[entry.label] || isPathActive);
      }
    });
    return state;
  }, [manualOpenGroups, activeLinkHref, visibleNavEntries]);

  const isLinkActive = (href: string) => href === activeLinkHref;

  const toggleGroup = (label: string) => {
    if (sidebarCollapsed) return;
    setManualOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const businessName = profile?.businessName || "Business Profile";
  const businessDetail = profile?.phone
    ? profile.phone
    : profile?.gstin
      ? `GSTIN: ${profile.gstin.toUpperCase()}`
      : profile?.tagline || "Manage business profile";

  const renderLink = (item: NavLink, nested = false) => {
    const isActive = isLinkActive(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onMobileClose}
        className={cn(
          "group relative flex h-11 items-center gap-3 rounded-lg text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:bg-primary-soft focus-visible:text-primary focus-visible:ring-2 focus-visible:ring-primary/25",
          sidebarCollapsed ? "justify-center px-0" : "px-3.5",
          nested && !sidebarCollapsed && "ml-8 mr-1 h-11 px-4",
          isActive
            ? "bg-primary-soft text-primary dark:bg-primary dark:text-primary-foreground"
            : "",
        )}
      >
        {isActive && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}

        <item.icon className="h-[18px] w-[18px] shrink-0 transition-colors" />

        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    );
  };

  const renderGroup = (group: NavGroup) => {
    const isAnyChildActive = group.children.some((child) => isLinkActive(child.href));
    const isOpen = openGroups[group.label] || false;

    return (
      <div key={group.label}>
        <button
          type="button"
          onClick={() => toggleGroup(group.label)}
          className={cn(
            "group relative flex h-11 w-full items-center gap-3 rounded-lg text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:bg-primary-soft focus-visible:text-primary focus-visible:ring-2 focus-visible:ring-primary/25",
            sidebarCollapsed ? "justify-center px-0" : "px-3.5",
            isOpen && !isAnyChildActive
              ? "bg-primary-soft text-primary dark:bg-primary dark:text-primary-foreground"
              : "",
          )}
        >
          <group.icon className="h-[18px] w-[18px] shrink-0 transition-colors" />

          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-1 overflow-hidden whitespace-nowrap text-left"
              >
                {group.label}
              </motion.span>
            )}
          </AnimatePresence>

          {!sidebarCollapsed && (
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-200",
                isOpen ? "text-primary dark:text-primary-foreground" : "text-muted-foreground",
                isOpen && "rotate-180",
              )}
            />
          )}
        </button>

        <AnimatePresence initial={false}>
          {isOpen && !sidebarCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div
                className="space-y-1 relative my-2 ml-6 border-l border-primary/20 py-1 pl-0.5"
              >
                {group.children.map((child) => renderLink(child, true))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-card">
      <div className="flex h-[88px] items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft ring-1 ring-primary/15">
            <Zap className="h-5 w-5 text-primary" />
          </div>

          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <h1 className="whitespace-nowrap text-[17px] font-semibold tracking-tight text-foreground">
                  POS ERP
                </h1>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Modern Point of Sale
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!sidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setManualOpenGroups({})}
              title="Collapse all submenus"
              className="h-9 w-9 shrink-0 rounded-lg text-muted-foreground hover:bg-primary-soft hover:text-primary focus-visible:ring-primary/25"
            >
            <ListCollapse className="h-4 w-4" />
          </Button>
        )}
      </div>

      
      <nav className="no-scrollbar flex-1 space-y-2 overflow-y-auto border-t border-border/55 px-4 py-6">
        {visibleNavEntries.map((entry) => (isGroup(entry) ? renderGroup(entry) : renderLink(entry)))}
      </nav>

      <div className="border-t border-border/70 bg-card px-4 pb-4 pt-4 space-y-3">
        {!sidebarCollapsed && <InstallPrompt />}
        <Link
          href="/settings/profile"
          className={cn(
            "block w-full rounded-lg border border-border bg-secondary/55 transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:bg-primary-soft focus-visible:ring-2 focus-visible:ring-primary/25",
            sidebarCollapsed ? "px-2 py-3" : "p-3",
          )}
        >
          <div className={cn(
            "flex w-full items-center",
            sidebarCollapsed ? "justify-center gap-0" : "gap-3",
          )}
          >
            <Avatar className={cn("h-11 w-11 shrink-0 rounded-full", sidebarCollapsed && "mx-auto")}>
              {profile?.logo ? <AvatarImage src={profile.logo} /> : null}
              <AvatarFallback className="rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {businessName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex min-w-0 flex-col"
                >
                  <span className="truncate text-[15px] font-semibold text-foreground">
                    {businessName}
                  </span>
                  <span className="truncate text-sm text-muted-foreground">
                    {businessDetail}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 272 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="group/sidebar fixed left-0 top-0 z-30 hidden h-screen flex-col border-r border-border bg-card lg:flex"
      >
        {sidebarContent}

        <button
          onClick={toggleSidebar}
          className="absolute -right-4 bottom-3 z-50 flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card shadow-sm opacity-0 transition-all duration-200 hover:border-primary/30 hover:bg-primary-soft hover:text-primary group-hover/sidebar:opacity-100"
        >
          <ChevronLeft
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform duration-300",
              sidebarCollapsed && "rotate-180",
            )}
          />
        </button>
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            />

            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed left-0 top-0 z-50 h-screen w-[288px] border-r border-border bg-card lg:hidden"
            >
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute right-3 top-4 z-10"
                onClick={onMobileClose}
              >
                <X className="h-4 w-4" />
              </Button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
