export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500/api";

export const SIDEBAR_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "POS", href: "/pos", icon: "Monitor" },
  { label: "Products", href: "/products", icon: "Package" },
  { label: "Categories", href: "/categories", icon: "Tags" },
  { label: "Customers", href: "/customers", icon: "Users" },
  { label: "Sales", href: "/sales", icon: "ShoppingCart" },
  { label: "Reports", href: "/reports", icon: "BarChart3" },
  { label: "Settings", href: "/settings", icon: "Settings" },
] as const;

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash", icon: "Banknote" },
  { value: "card", label: "Card", icon: "CreditCard" },
  { value: "upi", label: "UPI", icon: "Smartphone" },
] as const;

export const TAX_RATE = 18; // GST percentage
