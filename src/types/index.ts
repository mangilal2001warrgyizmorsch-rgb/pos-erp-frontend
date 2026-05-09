export interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "cashier";
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  customId?: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Subcategory {
  _id: string;
  name: string;
  customId?: string;
  description?: string;
  image?: string;
  parentCategoryId: Category | string;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  _id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  category: Category | string;
  subcategoryId?: Subcategory | string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  lowStockThreshold: number;
  image?: string;
  images?: string[];
  hsnCode?: string;
  unit: "piece" | "kg" | "liter" | "meter" | "box" | "dozen";
  isActive: boolean;
  profitMargin?: number;
  isLowStock?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  totalPurchases: number;
  totalSpent: number;
  isActive: boolean;
  createdAt: string;
}

export interface SaleItem {
  product: string | Product;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  _id: string;
  invoiceNumber: string;
  customer?: Customer | string;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: "cash" | "card" | "upi";
  paymentStatus: "paid" | "pending" | "partial";
  amountPaid: number;
  changeAmount: number;
  status: "completed" | "cancelled" | "refunded";
  notes?: string;
  cashier: User | string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: Pagination;
}

export interface DashboardStats {
  today: { totalSales: number; totalRevenue: number };
  monthly: { totalSales: number; totalRevenue: number };
  totalCustomers: number;
  totalProducts: number;
  salesByMonth: Array<{
    _id: { year: number; month: number };
    totalSales: number;
    totalRevenue: number;
  }>;
  salesByDay: Array<{
    _id: string;
    totalSales: number;
    totalRevenue: number;
  }>;
  topProducts: Array<{
    _id: string;
    name: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  recentSales: Sale[];
  lowStockProducts: Product[];
  paymentBreakdown: Array<{
    _id: string;
    count: number;
    total: number;
  }>;
}
