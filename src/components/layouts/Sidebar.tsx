"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownUp,
  ArrowLeftRight,
  BarChart3,
  Building,
  ChevronDown,
  ChevronLeft,
  Clock,
  Cloud,
  CloudLightning,
  FileText,
  History,
  IndianRupee,
  LayoutDashboard,
  Layers,
  ListCollapse,
  Package,
  Receipt,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBusinessStore } from "@/store/businessStore";
import { useThemeStore } from "@/store/themeStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    label: "Items",
    icon: Package,
    children: [
      { label: "Products", href: "/products", icon: Package },
      { label: "Categories", href: "/categories", icon: Tags },
      { label: "Subcategories", href: "/subcategories", icon: Layers },
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
    label: "Purchase & Expense",
    icon: Receipt,
    children: [
      { label: "Purchase Bills", href: "/purchases", icon: FileText },
      { label: "Payment-Out", href: "/purchases/payment-out", icon: Wallet },
      { label: "Expenses", href: "/expenses", icon: IndianRupee },
      { label: "Purchase Return / Debit Note", href: "/purchases/return", icon: Receipt },
    ],
  },
  {
    label: "Inventory",
    icon: Warehouse,
    children: [
      { label: "Inventory Manager", href: "/inventory", icon: Warehouse },
      { label: "Opening Stock", href: "/inventory/opening-stock", icon: Boxes },
    ],
  },
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
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useThemeStore();
  const { profile, fetchProfile } = useBusinessStore();
  const [manualOpenGroups, setManualOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!profile) fetchProfile();
  }, [fetchProfile, profile]);

  const openGroups = useMemo(() => {
    const state: Record<string, boolean> = {};
    navEntries.forEach((entry) => {
      if (isGroup(entry)) {
        const isPathActive = entry.children.some((child) => pathname.startsWith(child.href));
        state[entry.label] = Boolean(manualOpenGroups[entry.label] || isPathActive);
      }
    });
    return state;
  }, [manualOpenGroups, pathname]);

  const isLinkActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

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
          "group relative flex h-12 items-center gap-3.5 rounded-full px-4 text-[15px] font-medium text-foreground/78 transition-colors duration-150 hover:bg-primary/[0.10] hover:text-primary focus-visible:outline-none focus-visible:bg-primary/[0.10] focus-visible:text-primary focus-visible:ring-2 focus-visible:ring-primary/20",
          nested && !sidebarCollapsed && "ml-8 mr-1 h-11 px-4",
          isActive
            ? "bg-primary/[0.10] text-primary"
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

        <item.icon
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition-colors",
            isActive
              ? "text-primary"
              : "text-muted-foreground group-hover:text-primary",
          )}
        />

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
            "group relative flex h-12 w-full items-center gap-3.5 rounded-full px-4 text-[15px] font-medium text-foreground/78 transition-colors duration-150 hover:bg-primary/[0.10] hover:text-primary focus-visible:outline-none focus-visible:bg-primary/[0.10] focus-visible:text-primary focus-visible:ring-2 focus-visible:ring-primary/20",
            isOpen
              ? "bg-primary/[0.10] text-primary"
              : "",
          )}
        >
          <group.icon
            className={cn(
              "h-[18px] w-[18px] shrink-0 transition-colors",
              isOpen
                ? "text-primary"
                : isAnyChildActive
                  ? "text-primary"
                  : "text-muted-foreground group-hover:text-primary",
            )}
          />

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
                isOpen ? "text-primary" : "text-muted-foreground",
                isOpen && "rotate-180",
              )}
            />
          )}
        </button>

        <AnimatePresence initial={false}>
          {(isOpen || sidebarCollapsed) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div
                className={cn(
                  "space-y-1",
                  !sidebarCollapsed && "relative my-2 ml-6 border-l border-primary/20 py-1 pl-0.5",
                )}
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
    <div className="flex h-full flex-col bg-[#f6f7fb] dark:bg-card">
      <div className="flex h-[88px] items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/[0.08]">
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
              className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:bg-primary/[0.10] hover:text-primary focus-visible:ring-primary/20"
            >
            <ListCollapse className="h-4 w-4" />
          </Button>
        )}
      </div>

      
      <nav className="no-scrollbar flex-1 space-y-2 overflow-y-auto border-t border-border/55 px-4 py-6">
        {navEntries.map((entry) => (isGroup(entry) ? renderGroup(entry) : renderLink(entry)))}
      </nav>

      <div className="border-t border-border/55 bg-[#f6f7fb] px-4 pb-4 pt-4 dark:bg-card">
        <Link
          href="/settings/profile"
          className="block rounded-[22px] bg-background p-3 transition-colors hover:bg-primary/[0.10] focus-visible:outline-none focus-visible:bg-primary/[0.10] focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          <div className={cn("flex items-center gap-3", sidebarCollapsed && "justify-center")}>
            <Avatar className="h-11 w-11 shrink-0 rounded-xl">
              {profile?.logo ? <AvatarImage src={profile.logo} /> : null}
              <AvatarFallback className="rounded-xl bg-primary/10 text-sm font-semibold text-primary">
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
        className="group/sidebar fixed left-0 top-0 z-30 hidden h-screen flex-col border-r border-border/55 bg-[#f6f7fb] lg:flex dark:bg-card"
      >
        {sidebarContent}

        <button
          onClick={toggleSidebar}
          className="absolute -right-4 bottom-3 z-50 flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background shadow-sm opacity-0 transition-all duration-200 hover:border-primary/20 hover:bg-primary/[0.10] hover:text-primary group-hover/sidebar:opacity-100"
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
              className="fixed left-0 top-0 z-50 h-screen w-[288px] border-r border-border/55 bg-[#f6f7fb] lg:hidden dark:bg-card"
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
