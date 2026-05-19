"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Tags,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronDown,
  Zap,
  X,
  Truck,
  Receipt,
  Warehouse,
  IndianRupee,
  UserCheck,
  Layers,
  FileText,
  ArrowLeftRight,
  Wallet,
  Building,
  Cloud,
  CloudLightning,
  Wrench,
  ScanBarcode,
  ArrowDownUp,
  History,
  ListCollapse,
  Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/themeStore";
import { useBusinessStore } from "@/store/businessStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect } from "react";

// ---------- Types ----------
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

// ---------- Navigation Structure ----------
const navEntries: NavEntry[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
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
    label: "Sync & Backup",
    icon: Cloud,
    children: [
      { label: "Backup & Restore", href: "/backup", icon: CloudLightning },
    ],
  },
  {
    label: "Utilities",
    icon: Wrench,
    children: [
      {
        label: "Barcode Generator",
        href: "/utilities/barcode",
        icon: ScanBarcode,
      },
      {
        label: "Import/Export",
        href: "/utilities/import-export",
        icon: ArrowDownUp,
      },
    ],
  },
  { label: "Settings", href: "/settings", icon: Settings },
];

// ---------- Component ----------
interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useThemeStore();
  const { profile, fetchProfile } = useBusinessStore();

  useEffect(() => {
    if (!profile) {
      fetchProfile();
    }
  }, []);

  // Track open state for multiple groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    navEntries.forEach((entry) => {
      if (isGroup(entry)) {
        initialState[entry.label] = entry.children.some(
          (child) => pathname.startsWith(child.href) && child.href !== "/",
        );
      }
    });
    return initialState;
  });

  const toggleGroup = (label: string) => {
    if (sidebarCollapsed) return;
    setOpenGroups((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const isLinkActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  // Renders a single nav link
  const renderLink = (item: NavLink, nested = false) => {
    const isActive = isLinkActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onMobileClose}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative",
          nested && !sidebarCollapsed && "pl-10",
          isActive
            ? "bg-primary/10 text-primary shadow-sm"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        {isActive && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <item.icon
          className={cn(
            "h-5 w-5 shrink-0 transition-colors",
            isActive
              ? "text-primary"
              : "text-muted-foreground group-hover:text-foreground",
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

  // Renders a collapsible group
  const renderGroup = (group: NavGroup) => {
    const isAnyChildActive = group.children.some((c) => isLinkActive(c.href));
    const isOpen = openGroups[group.label] || false;

    return (
      <div key={group.label}>
        <button
          onClick={() => toggleGroup(group.label)}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 w-full group relative",
            isAnyChildActive
              ? "bg-primary/5 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <group.icon
            className={cn(
              "h-5 w-5 shrink-0 transition-colors",
              isAnyChildActive
                ? "text-primary"
                : "text-muted-foreground group-hover:text-foreground",
            )}
          />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap flex-1 text-left"
              >
                {group.label}
              </motion.span>
            )}
          </AnimatePresence>
          {!sidebarCollapsed && (
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180",
              )}
            />
          )}
        </button>

        {/* Submenu items */}
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
                  "space-y-0.5",
                  !sidebarCollapsed &&
                    "mt-1 ml-2 border-l border-border/40 pl-1",
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
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 shrink-0">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <h1 className="text-lg font-bold whitespace-nowrap gradient-text">
                  POS ERP
                </h1>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse All Options Button */}
        {!sidebarCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpenGroups({})}
            title="Collapse all submenus"
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
          >
            <ListCollapse className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
        {navEntries.map((entry) =>
          isGroup(entry) ? renderGroup(entry) : renderLink(entry),
        )}
      </nav>



      {/* Business Profile Footer */}
      <Link 
        href="/settings/profile"
        className="p-3 border-t border-border/50 bg-muted/20 block hover:bg-muted/40 transition-colors duration-200"
      >
        <div className={cn(
          "flex items-center gap-3 px-2 py-2 rounded-xl transition-all duration-200",
          !sidebarCollapsed && "hover:bg-background/50"
        )}>
          <Avatar className="h-9 w-9 rounded-full border border-primary/20 shadow-sm ring-2 ring-primary/5 shrink-0">
            {profile?.logo ? (
              <AvatarImage src={profile.logo} />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs">
              {profile?.businessName?.charAt(0) || "P"}
            </AvatarFallback>
          </Avatar>
          
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col min-w-0"
              >
                <span className="text-xs font-bold truncate">
                  {profile?.businessName || "My Business"}
                </span>
                <span className="text-[10px] text-muted-foreground truncate opacity-70">
                  Business Admin
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Link>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 256 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden lg:flex flex-col fixed left-0 top-0 h-screen border-r border-border/50 bg-card/80 backdrop-blur-xl z-30 group/sidebar"
      >
        {sidebarContent}
        
        {/* Floating Collapse Toggle */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-5 bottom-2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-[20%] border border-border bg-background shadow-sm opacity-0 group-hover/sidebar:opacity-100 transition-all duration-200 z-50 hover:bg-muted"
        >
          <ChevronLeft
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform duration-300",
              sidebarCollapsed && "rotate-180",
            )}
          />
        </button>
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed left-0 top-0 h-screen w-[280px] border-r border-border/50 bg-card z-50 lg:hidden"
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
