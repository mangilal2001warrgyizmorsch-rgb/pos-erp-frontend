export interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "accountant" | "stock_manager" | "cashier";
  permissions?: string[];
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  _id: string;
  name: string;
  permissions: string[];
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
  productCount?: number;
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
  productCount?: number;
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
  openingStockPrice?: number;
  openingStockDate?: string;
  mrp?: number;
  stockByGodown?: { godownId: Godown | string; stock: number }[];
  isActive: boolean;
  isLowStock?: boolean;
  pricingStatus?: "active" | "inactive";
  source?: "manual" | "purchase" | "opening_stock" | "import";
  createdAt?: string;
  updatedAt?: string;
}

export interface Godown {
  _id: string;
  name: string;
  address?: string;
  manager?: User | string;
  isActive: boolean;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
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

export interface ProductPriceOption {
  batchId: string | null;
  batchNo?: string;
  label: string;
  isCurrent?: boolean;
  salePrice: number;
  salesPrice?: number;
  mrp?: number;
  availableQty: number;
  purchasePrice: number;
  taxPercent?: number;
  taxRate?: number;
  barcode?: string;
  sourceType?: string;
  createdAt?: string;
}

export interface ProductPriceOptionsResponse {
  product: Product;
  priceOptions: ProductPriceOption[];
  defaultPrice: ProductPriceOption;
  priceSelectionRequired: boolean;
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
  walletBalance: number;
  isActive: boolean;
  createdAt: string;

}

export interface SaleItem {
  product?: string | Product | null;
  productId?: string | null;
  batchId?: string | null;
  selectedPriceType?: string | null;
  salePrice?: number;
  mrp?: number;
  availableQtyAtSale?: number;
  itemType?: "inventory" | "non_stock_product" | "service";
  affectsInventory?: boolean;
  itemName?: string;
  description?: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number; // Sales Price
  rate?: number;
  purchasePrice: number; // Avg purchase price for this transaction
  profitAmount: number;
  taxRate?: number;
  gstRate?: number;
  taxableAmount?: number;
  taxAmount?: number;
  cgst?: number;
  cgstAmount?: number;
  sgst?: number;
  sgstAmount?: number;
  igst?: number;
  igstAmount?: number;
  discount?: number;
  total: number;
  totalAmount?: number;
  incomeLedger?: string | null;
}

export interface Sale {
  _id: string;
  invoiceNumber: string;
  customer?: Customer | string;
  customerName: string;
  godownId?: Godown | string;
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
  cashBankAccountId?: string;
  cashier: User | string;
  accountingVoucherId?: string | {
    _id: string;
    voucherNo: string;
    date?: string;
    status: "DRAFT" | "POSTED" | "CANCELLED" | "REVERSED";
    totalDebit?: number;
    totalCredit?: number;
  };
  accountingPosted?: boolean;
  accountingPostedAt?: string;
  accountingStatus?: "not_posted" | "posted" | "failed";
  accountingError?: string;
  irn?: string;
  qrCode?: string;
  eInvoiceStatus?: "pending" | "generated" | "failed" | "not_applicable";
  ewayBillNumber?: string;
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
  paymentBreakdown: { _id: string; count: number; total: number }[];
  accounting?: {
    totalCashBalance: number;
    totalBankBalance: number;
    recentTransactions: any[];
  };
  shift?: any | null;
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
  outstandingBalance: number;
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
  godownId?: Godown | string;
  items: PurchaseItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingCharges: number;
  stateOfSupply?: string;
  roundOff?: number;
  totalAmount: number;
  amountPaid: number;
  dueAmount: number;
  status: PurchaseStatus;
  paymentStatus: PurchasePaymentStatus;
  paymentMethod?: "cash" | "card" | "upi" | "bank_transfer" | "cheque";
  notes?: string;
  cashBankAccountId?: string;
  createdBy: User | string;
  accountingVoucherId?: string | {
    _id: string;
    voucherNo: string;
    date?: string;
    status: "DRAFT" | "POSTED" | "CANCELLED" | "REVERSED";
    totalDebit?: number;
    totalCredit?: number;
  };
  accountingPosted?: boolean;
  accountingPostedAt?: string;
  accountingStatus?: "not_posted" | "posted" | "failed";
  accountingError?: string;
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
  accountingVoucherId?: string | {
    _id: string;
    voucherNo: string;
    date?: string;
    status: "DRAFT" | "POSTED" | "CANCELLED" | "REVERSED";
  };
  accountingPosted?: boolean;
  accountingPostedAt?: string;
  accountingStatus?: "not_posted" | "posted" | "failed";
  accountingError?: string;
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
  entryType: 'expense' | 'income';
  nature: 'direct' | 'indirect';
  title: string;
  amount: number;
  category: ExpenseCategory | string;
  categoryName: string;
  ledgerId?: string;
  ledgerName?: string;
  date: string;
  description?: string;
  receiptImage?: string;
  paymentMethod: "cash" | "card" | "upi" | "bank_transfer";
  reference?: string;
  cashBankAccountId?: string;
  paymentAccountId?: string;
  gstApplicable: boolean;
  gstRate: number;
  gstType: 'cgst_sgst' | 'igst';
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
  status: 'active' | 'cancelled';
  createdBy: User | string;
  accountingVoucherId?: string | {
    _id: string;
    voucherNo: string;
    date?: string;
    status: "DRAFT" | "POSTED" | "CANCELLED" | "REVERSED";
  };
  accountingPosted?: boolean;
  accountingPostedAt?: string;
  accountingStatus?: "not_posted" | "posted" | "failed";
  accountingError?: string;
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
  clearanceAccountType?: "cash" | "bank";
  clearanceAccountId?: string;
  clearanceTransactionId?: string;
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
  stateCode?: string;
  pincode?: string;
  logo?: string;
  signature?: string;
  beginningDate?: string;
  logoText?: string;
}

// --- Sale Return / Credit Note ---
export interface SaleReturnItem {
  product?: string | Product | null;
  saleItemId?: string;
  itemType?: "inventory" | "non_stock_product" | "service";
  affectsInventory?: boolean;
  barcode?: string;
  itemName: string;
  soldQty: number;
  alreadyReturnedQty: number;
  returnQty: number;
  unit: string;
  pricePerUnit: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  returnAmount: number;
  reason: "Damaged" | "Wrong item" | "Expired" | "Customer cancelled" | "Exchange" | "Other";
  stockAction: "restore_stock" | "damaged_stock" | "no_stock";
}

export type SaleReturnRefundType = "refund_now" | "keep_as_credit" | "adjust_future_invoice";
export type SaleReturnStatus = "draft" | "issued" | "partially_refunded" | "refunded" | "adjusted" | "cancelled";

export interface SaleReturn {
  _id: string;
  creditNoteNo: string;
  returnNumber: string;
  sale: Sale | string;
  invoiceNumber: string;
  invoiceDate: string;
  customer: Customer | string;
  customerName: string;
  customerPhone?: string;
  customerGstNo?: string;
  billingAddress?: string;
  returnDate: string;
  stateOfSupply?: string;
  items: SaleReturnItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  roundOff?: number;
  grandTotal: number;
  refundMethod: string;
  refundType: SaleReturnRefundType;
  paymentMode?: "Cash" | "UPI" | "Bank" | "Card" | "Wallet" | "Credit";
  cashBankAccountId?: string;
  refundedAmount: number;
  creditBalance: number;
  referenceNo?: string;
  status: SaleReturnStatus;
  notes?: string;
  attachments?: string[];
  accountingVoucherId?: string | {
    _id: string;
    voucherNo: string;
    date?: string;
    status: "DRAFT" | "POSTED" | "CANCELLED" | "REVERSED";
  };
  accountingPosted?: boolean;
  accountingPostedAt?: string;
  accountingStatus?: "not_posted" | "posted" | "failed";
  accountingError?: string;
  cashier: User | string;
  createdAt: string;
  updatedAt: string;
}

// --- Purchase Return / Debit Note ---
export interface PurchaseReturnItem {
  product: string | Product;
  barcode?: string;
  itemName: string;
  purchasedQty: number;
  alreadyReturnedQty: number;
  returnQty: number;
  unit: string;
  purchasePrice: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  returnAmount: number;
  reason: "Damaged from supplier" | "Wrong item received" | "Extra quantity" | "Expired" | "Quality issue" | "Other";
}

export type PurchaseReturnRefundType = "refund_received" | "keep_as_debit" | "adjust_future_purchase";
export type PurchaseReturnStatus = "draft" | "issued" | "partially_refunded" | "refunded" | "adjusted" | "cancelled";

export interface PurchaseReturnModel {
  _id: string;
  debitNoteNo: string;
  returnNumber: string;
  purchase: Purchase | string;
  purchaseNumber: string;
  billDate: string;
  supplier: Supplier | string;
  supplierName: string;
  supplierPhone?: string;
  supplierGstNo?: string;
  address?: string;
  returnDate: string;
  stateOfSupply?: string;
  items: PurchaseReturnItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  roundOff?: number;
  grandTotal: number;
  refundMethod: string;
  refundType: PurchaseReturnRefundType;
  paymentMode?: "Cash" | "UPI" | "Bank" | "Card" | "Wallet" | "Credit";
  cashBankAccountId?: string;
  refundReceivedAmount: number;
  debitBalance: number;
  referenceNo?: string;
  status: PurchaseReturnStatus;
  notes?: string;
  attachments?: string[];
  accountingVoucherId?: string | {
    _id: string;
    voucherNo: string;
    date?: string;
    status: "DRAFT" | "POSTED" | "CANCELLED" | "REVERSED";
  };
  accountingPosted?: boolean;
  accountingPostedAt?: string;
  accountingStatus?: "not_posted" | "posted" | "failed";
  accountingError?: string;
  createdAt: string;
  updatedAt: string;
}

export * from './shortcuts';
