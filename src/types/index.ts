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
  stock: number;
  lowStockThreshold: number;
  image?: string;
  images?: string[];
  hsnCode?: string;
  unit: "piece" | "kg" | "liter" | "meter" | "box" | "dozen";
  salesPrice: number;
  purchasePrice: number;
  taxRate: number;
  salesTaxType?: "inclusive" | "exclusive" | "without";
  purchaseTaxType?: "inclusive" | "exclusive" | "without";
  openingStockPrice: number;
  openingStockDate: string;
  isActive: boolean;
  isLowStock?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SalesPrice {
  _id: string;
  productId: string | Product;
  purchaseId?: string;
  purchaseItemId?: string;
  batchId?: string;
  barcode: string;
  purchasePrice: number;
  taxPercent: number;
  taxAmount: number;
  discountPercent: number;
  discountAmount: number;
  extraCharges: number;
  extraChargePerProduct: number;
  calculatedSalePrice: number;
  availableQty: number;
  pricingStatus: "active" | "inactive";
  effectiveFrom: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  shippingAddress?: string;
  gstNumber?: string;
  gstType?: "Unregistered/Consumer" | "Registered/Regular" | "Composition";
  stateCode?: string;
  openingBalance?: number;
  openingBalanceType?: "Payable" | "Receivable";
  openingBalanceDate?: string;
  creditLimit?: number;
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
  unitPrice: number; // Sales Price
  purchasePrice: number; // Avg purchase price for this transaction
  profitAmount: number;
  taxRate?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
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
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
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
  purchasePrice: number;
  taxRate: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  total: number;
  batchNo?: string;
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

// ============================================
// PHASE 2 — Advanced Module Types
// ============================================

// --- Supplier ---
export interface Supplier {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  gstNumber?: string;
  gstType?: "Unregistered/Consumer" | "Registered/Regular" | "Composition";
  address?: string;
  shippingAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  openingBalance?: number;
  openingBalanceType?: "Payable" | "Receivable";
  openingBalanceDate?: string;
  creditLimit?: number;
  stateCode?: string;
  totalPurchases: number;
  totalAmount: number;
  outstandingAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- Transporter ---
export interface Transporter {
  _id: string;
  name: string;
  vehicleNumber?: string;
  phone: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- Purchase ---
export interface PurchaseItem {
  product: string | Product;
  name: string;
  sku: string;
  quantity: number;
  purchasePrice: number;
  taxRate: number;
  taxAmount: number;
  salesPrice: number; // Added
  total: number;
}

export type PurchaseStatus = "draft" | "confirmed" | "received" | "cancelled" | "returned";
export type PurchasePaymentStatus = "paid" | "pending" | "partial";

export interface Purchase {
  _id: string;
  purchaseNumber: string;
  supplier: Supplier | string;
  supplierName: string;
  transporter?: Transporter | string;
  transporterName?: string;
  invoiceNumber?: string;
  purchaseDate: string;
  items: PurchaseItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingCharges: number;
  totalAmount: number;
  amountPaid: number;
  dueAmount: number;
  status: PurchaseStatus;
  paymentStatus: PurchasePaymentStatus;
  paymentMethod?: "cash" | "card" | "upi" | "bank_transfer" | "cheque";
  notes?: string;
  createdBy: User | string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseReturn {
  _id: string;
  returnNumber: string;
  purchase: Purchase | string;
  purchaseNumber: string;
  supplier: Supplier | string;
  supplierName: string;
  items: PurchaseItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  reason: string;
  status: "pending" | "approved" | "completed";
  createdBy: User | string;
  createdAt: string;
  updatedAt: string;
}

// --- Expense ---
export interface ExpenseCategory {
  _id: string;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Expense {
  _id: string;
  title: string;
  amount: number;
  category: ExpenseCategory | string;
  categoryName: string;
  date: string;
  description?: string;
  receiptImage?: string;
  paymentMethod: "cash" | "card" | "upi" | "bank_transfer";
  reference?: string;
  createdBy: User | string;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- Stock / Inventory ---
export type StockMovementType = "purchase" | "sale" | "return" | "adjustment" | "transfer";

export interface StockMovement {
  _id: string;
  product: Product | string;
  productName: string;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reference?: string;
  referenceId?: string;
  notes?: string;
  createdBy: User | string;
  createdAt: string;
}

export interface StockAdjustment {
  _id: string;
  adjustmentNumber: string;
  product: Product | string;
  productName: string;
  previousStock: number;
  adjustedStock: number;
  difference: number;
  reason: string;
  notes?: string;
  createdBy: User | string;
  createdAt: string;
}

// --- Notifications ---
export type NotificationType = "low_stock" | "sale" | "purchase" | "expense" | "system" | "alert";

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// --- Activity Logs ---
export type ActivityAction = "create" | "update" | "delete" | "login" | "logout" | "stock_adjust" | "sale" | "purchase";

export interface ActivityLog {
  _id: string;
  user: User | string;
  userName: string;
  action: ActivityAction;
  module: string;
  description: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

// --- Supplier Ledger ---
export interface SupplierLedgerEntry {
  _id: string;
  type: "purchase" | "payment" | "return" | "adjustment";
  reference: string;
  referenceId: string;
  debit: number;
  credit: number;
  balance: number;
  date: string;
  notes?: string;
}

// --- Bank, Cash & Loans ---
export interface BankAccount {
  _id: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  openingBalance: number;
  currentBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Loan {
  _id: string;
  loanName: string;
  lenderName: string;
  totalAmount: number;
  interestRate: number;
  currentBalance: number;
  status: "Active" | "Closed";
  createdAt: string;
  updatedAt: string;
}

export interface Cheque {
  _id: string;
  type: "received" | "issued";
  chequeNumber: string;
  amount: number;
  date: string;
  partyName: string;
  bankName: string;
  status: "Pending" | "Cleared" | "Bounced";
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  _id: string;
  ledgerType: "Cash" | "Bank" | "Loan" | "Other";
  accountId?: string | BankAccount | Loan;
  accountModel?: "BankAccount" | "Loan";
  transactionType: "Credit" | "Debit";
  amount: number;
  date: string;
  remarks?: string;
  referenceId?: string;
  referenceModel?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Business Profile ---
export interface BusinessProfile {
  _id?: string;
  businessName: string;
  tagline?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  address?: string;
  businessType?: string;
  category?: string;
  state?: string;
  pincode?: string;
  logo?: string;
  signature?: string;
  beginningDate?: string;
  logoText?: string;
}

export * from './shortcuts';

