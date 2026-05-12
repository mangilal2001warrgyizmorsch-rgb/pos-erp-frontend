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
  Database,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/themeStore";
import { Button } from "@/components/ui/button";

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

// ---------- Navigation Structure (matches workflow diagrams) ----------
const navEntries: NavEntry[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  // { label: "POS Billing", href: "/pos", icon: Zap },
  { label: "Sales", href: "/sales", icon: ShoppingCart },
  {
    label: "Masters",
    icon: Database,
    children: [
      { label: "Categories", href: "/categories", icon: Tags },
      { label: "Subcategories", href: "/subcategories", icon: Layers },
      { label: "Products", href: "/products", icon: Package },
      { label: "Suppliers", href: "/suppliers", icon: UserCheck },
      { label: "Customers", href: "/customers", icon: Users },
      { label: "Transporters", href: "/transporters", icon: Truck },
    ],
  },
  { label: "Purchase", href: "/purchases", icon: Receipt },
  { label: "Expenses", href: "/expenses", icon: IndianRupee },
  { label: "Current Stock", href: "/inventory", icon: Warehouse },
  { label: "Reports", href: "/reports", icon: BarChart3 },
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
  const [mastersOpen, setMastersOpen] = useState(() => {
    // Auto-open Masters if current route is inside it
    const masterPaths = ["/categories", "/subcategories", "/products", "/suppliers", "/customers", "/transporters"];
    return masterPaths.some((p) => pathname.startsWith(p));
  });

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
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
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

  // Renders a collapsible group (Masters)
  const renderGroup = (group: NavGroup) => {
    const isAnyChildActive = group.children.some((c) => isLinkActive(c.href));

    return (
      <div key={group.label}>
        <button
          onClick={() => {
            if (sidebarCollapsed) return;
            setMastersOpen((prev) => !prev);
          }}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 w-full group relative",
            isAnyChildActive
              ? "bg-primary/5 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <group.icon
            className={cn(
              "h-5 w-5 shrink-0 transition-colors",
              isAnyChildActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
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
                mastersOpen && "rotate-180"
              )}
            />
          )}
        </button>

        {/* Submenu items */}
        <AnimatePresence initial={false}>
          {(mastersOpen || sidebarCollapsed) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className={cn("space-y-0.5", !sidebarCollapsed && "mt-1 ml-2 border-l border-border/40 pl-1")}>
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
      <div className="flex h-16 items-center gap-3 px-4 border-b border-border/50">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
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

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
        {navEntries.map((entry) =>
          isGroup(entry) ? renderGroup(entry) : renderLink(entry)
        )}
      </nav>

      {/* Collapse toggle - desktop only */}
      <div className="hidden lg:block p-3 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={toggleSidebar}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform duration-300",
              sidebarCollapsed && "rotate-180"
            )}
          />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 256 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden lg:flex flex-col fixed left-0 top-0 h-screen border-r border-border/50 bg-card/80 backdrop-blur-xl z-30"
      >
        {sidebarContent}
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
