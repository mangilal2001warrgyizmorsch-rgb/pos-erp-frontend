/**
 * Example: Complete POS Page with Keyboard Shortcuts
 * 
 * This is a working example showing how to integrate keyboard shortcuts
 * into your POS page. Copy this pattern to your actual POS page.
 */

'use client';

import { useRef, useCallback, useState } from 'react';
import { usePOSShortcuts } from '@/hooks/usePOSShortcuts';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { ShortcutBadge, ShortcutButton, DataTableKeyboardNavigation } from '@/components/shortcuts';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

/**
 * EXAMPLE POS PAGE WITH FULL SHORTCUT INTEGRATION
 * 
 * Features demonstrated:
 * - POS-specific keyboard shortcuts (F1-F12)
 * - Barcode scanner integration
 * - Shortcut buttons with badges
 * - Dynamic handler implementation
 */
export function ExamplePOSPageWithShortcuts() {
  // Refs for focusing elements
  const productSearchRef = useRef<HTMLInputElement>(null);
  const customerSearchRef = useRef<HTMLInputElement>(null);

  // State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  // ============================================
  // SHORTCUT HANDLERS
  // ============================================

  const handleFocusSearch = useCallback(() => {
    productSearchRef.current?.focus();
    toast.info('Product search focused (F1)');
  }, []);

  const handleFocusCustomer = useCallback(() => {
    customerSearchRef.current?.focus();
    toast.info('Customer search focused (F2)');
  }, []);

  const handleHoldSale = useCallback(() => {
    if (cart.length === 0) {
      toast.warning('Cart is empty');
      return;
    }
    // Implementation: Save current sale to held sales
    toast.success('Sale held successfully (F3)');
  }, [cart.length]);

  const handleOpenPayment = useCallback(() => {
    if (cart.length === 0) {
      toast.warning('Cart is empty');
      return;
    }
    setShowPayment(true);
    toast.info('Payment section opened (F4)');
  }, [cart.length]);

  const handleCompleteSale = useCallback(() => {
    if (cart.length === 0) {
      toast.warning('Cart is empty');
      return;
    }
    if (!selectedPayment) {
      toast.error('Please select a payment method');
      return;
    }
    // Implementation: Process sale
    toast.success(`Sale completed with ${selectedPayment} (F5)`);
    setCart([]);
    setShowPayment(false);
  }, [cart.length, selectedPayment]);

  const handleOpenCart = useCallback(() => {
    setCartOpen(!cartOpen);
    toast.info(cartOpen ? 'Cart closed (F6)' : 'Cart opened (F6)');
  }, [cartOpen]);

  const handleApplyDiscount = useCallback(() => {
    toast.info('Discount dialog opened (F7)');
  }, []);

  const handleSelectCash = useCallback(() => {
    setSelectedPayment('Cash');
    toast.success('Cash payment selected (F8)');
  }, []);

  const handleSelectCard = useCallback(() => {
    setSelectedPayment('Card');
    toast.success('Card payment selected (F9)');
  }, []);

  const handleSelectUPI = useCallback(() => {
    setSelectedPayment('UPI');
    toast.success('UPI payment selected (F10)');
  }, []);

  const handlePrintReceipt = useCallback(() => {
    toast.success('Receipt printed (F11)');
  }, []);

  const handleNewSale = useCallback(() => {
    setCart([]);
    setSelectedPayment(null);
    setShowPayment(false);
    toast.success('New sale started (F12)');
  }, []);

  const handleClearCart = useCallback(() => {
    setCart([]);
    toast.info('Cart cleared (Ctrl+Delete)');
  }, []);

  const handleAddProduct = useCallback(() => {
    if (selectedProduct) {
      const newItem: CartItem = {
        id: selectedProduct,
        name: 'Sample Product',
        price: 100,
        quantity: 1,
      };
      setCart([...cart, newItem]);
      toast.success('Product added to cart (Enter)');
    }
  }, [selectedProduct, cart]);

  const handleIncreaseQuantity = useCallback(() => {
    if (cart.length > 0) {
      const newCart = [...cart];
      newCart[0].quantity += 1;
      setCart(newCart);
      toast.success('Quantity increased (+)');
    }
  }, [cart]);

  const handleDecreaseQuantity = useCallback(() => {
    if (cart.length > 0) {
      const newCart = [...cart];
      if (newCart[0].quantity > 1) {
        newCart[0].quantity -= 1;
        setCart(newCart);
        toast.success('Quantity decreased (-)');
      }
    }
  }, [cart]);

  const handleRemoveItem = useCallback(() => {
    if (cart.length > 0) {
      const newCart = cart.slice(1);
      setCart(newCart);
      toast.info('Item removed (Delete)');
    }
  }, [cart]);

  // ============================================
  // SETUP POS SHORTCUTS
  // ============================================

  const posHandlers = usePOSShortcuts({
    onFocusSearch: handleFocusSearch,
    onFocusCustomer: handleFocusCustomer,
    onHoldSale: handleHoldSale,
    onOpenPayment: handleOpenPayment,
    onCompleteSale: handleCompleteSale,
    onOpenCart: handleOpenCart,
    onApplyDiscount: handleApplyDiscount,
    onSelectCash: handleSelectCash,
    onSelectCard: handleSelectCard,
    onSelectUPI: handleSelectUPI,
    onPrintReceipt: handlePrintReceipt,
    onNewSale: handleNewSale,
    onClearCart: handleClearCart,
    onAddProduct: handleAddProduct,
    onIncreaseQuantity: handleIncreaseQuantity,
    onDecreaseQuantity: handleDecreaseQuantity,
    onRemoveItem: handleRemoveItem,
  });

  // ============================================
  // BARCODE SCANNER
  // ============================================

  useBarcodeScanner({
    enabled: true,
    minLength: 4,
    scanTimeout: 150,
    onScan: async (barcode) => {
      // In real implementation, fetch product by barcode
      toast.success(`Barcode scanned: ${barcode}`);
      
      // Example product addition
      const product: CartItem = {
        id: barcode,
        name: 'Scanned Product',
        price: Math.random() * 1000,
        quantity: 1,
      };
      setCart([...cart, product]);
    },
    onError: (error) => {
      toast.error(`Barcode error: ${error}`);
    },
  });

  // ============================================
  // TABLE KEYBOARD NAVIGATION FOR CART
  // ============================================

  const handleCartRowSelect = (rowIndex: number) => {
    // Implement row selection highlighting
  };

  return (
    <div className="flex gap-4 min-h-screen bg-gray-50">
      {/* LEFT SIDE - PRODUCT SEARCH AND SELECTION */}
      <div className="flex-1 p-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">POS Billing</h2>

          {/* Product Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Product Search
              <ShortcutBadge keys={{ key: 'F1' }} className="ml-2" />
            </label>
            <input
              ref={productSearchRef}
              type="text"
              placeholder="Type product name or barcode (F1)..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setSelectedProduct(e.target.value || null)}
            />
          </div>

          {/* Customer Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Customer
              <ShortcutBadge keys={{ key: 'F2' }} className="ml-2" />
            </label>
            <input
              ref={customerSearchRef}
              type="text"
              placeholder="Search customer (F2)..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-4">
            <ShortcutButton
              shortcut={{ key: 'F3' }}
              onClick={handleHoldSale}
              variant="outline"
              size="sm"
            >
              Hold Sale
            </ShortcutButton>

            <ShortcutButton
              shortcut={{ key: 'F7' }}
              onClick={handleApplyDiscount}
              variant="outline"
              size="sm"
            >
              Discount
            </ShortcutButton>

            <ShortcutButton
              shortcut={{ key: 'F6' }}
              onClick={handleOpenCart}
              variant="outline"
              size="sm"
            >
              {cartOpen ? 'Close Cart' : 'Open Cart'}
            </ShortcutButton>

            <ShortcutButton
              shortcut={{ key: 'F12' }}
              onClick={handleNewSale}
              variant="outline"
              size="sm"
            >
              New Sale
            </ShortcutButton>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - CART AND PAYMENT */}
      <div className="w-96 bg-white shadow-lg p-6 space-y-4">
        <h3 className="text-xl font-bold">
          Shopping Cart
          <ShortcutBadge keys={{ key: 'F6' }} className="ml-2" />
        </h3>

        {/* Cart Items */}
        <div className="border rounded-lg p-4 space-y-2 max-h-96 overflow-y-auto">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Cart is empty</p>
          ) : (
            <>
              <DataTableKeyboardNavigation
                rowCount={cart.length}
                onRowSelect={handleCartRowSelect}
                enabled={true}
              />
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">₹{item.price}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={handleDecreaseQuantity}
                      className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded"
                    >
                      -
                    </button>
                    <span className="px-2">{item.quantity}</span>
                    <button
                      onClick={handleIncreaseQuantity}
                      className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Total */}
        {cart.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold">Total:</span>
              <span className="text-xl font-bold">
                ₹{(cart.reduce((sum, item) => sum + item.price * item.quantity, 0)).toFixed(2)}
              </span>
            </div>

            {/* Payment Section */}
            {showPayment ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <ShortcutButton
                    shortcut={{ key: 'F8' }}
                    onClick={handleSelectCash}
                    variant={selectedPayment === 'Cash' ? 'default' : 'outline'}
                    size="sm"
                  >
                    Cash
                  </ShortcutButton>
                  <ShortcutButton
                    shortcut={{ key: 'F9' }}
                    onClick={handleSelectCard}
                    variant={selectedPayment === 'Card' ? 'default' : 'outline'}
                    size="sm"
                  >
                    Card
                  </ShortcutButton>
                  <ShortcutButton
                    shortcut={{ key: 'F10' }}
                    onClick={handleSelectUPI}
                    variant={selectedPayment === 'UPI' ? 'default' : 'outline'}
                    size="sm"
                    className="col-span-2"
                  >
                    UPI
                  </ShortcutButton>
                </div>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="space-y-2 pt-4">
              <ShortcutButton
                shortcut={{ key: 'F4' }}
                onClick={handleOpenPayment}
                variant="outline"
                className="w-full"
              >
                Payment
              </ShortcutButton>

              <ShortcutButton
                shortcut={{ key: 'F5' }}
                onClick={handleCompleteSale}
                variant="default"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={cart.length === 0}
              >
                Complete Sale
              </ShortcutButton>

              <ShortcutButton
                shortcut={{ key: 'F11' }}
                onClick={handlePrintReceipt}
                variant="outline"
                className="w-full"
                disabled={cart.length === 0}
              >
                Print Receipt
              </ShortcutButton>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500 text-center pt-4 border-t">
          Press <kbd className="px-1 bg-gray-200 rounded">Ctrl+/</kbd> for all shortcuts
        </div>
      </div>
    </div>
  );
}

export default ExamplePOSPageWithShortcuts;
