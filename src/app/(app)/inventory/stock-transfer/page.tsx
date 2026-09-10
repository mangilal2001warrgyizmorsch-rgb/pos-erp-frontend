"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2, ArrowRightLeft, Store, Package } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { stockService } from "@/services/stockService";
import { godownService } from "@/services/godownService";
import { productService } from "@/services/productService";
import type { Godown, Product } from "@/types";

interface TransferItem {
  id: string;
  productId: string;
  quantity: number;
}

export default function StockTransferPage() {
  const router = useRouter();
  
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [sourceGodownId, setSourceGodownId] = useState("");
  const [destinationGodownId, setDestinationGodownId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<TransferItem[]>([
    { id: crypto.randomUUID(), productId: "", quantity: 1 }
  ]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [godownsRes, productsRes] = await Promise.all([
        godownService.getAllGodowns(),
        productService.getAll({ limit: 1000 })
      ]);
      setGodowns(godownsRes.data.filter(g => g.isActive));
      setProducts(productsRes.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load necessary data");
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), productId: "", quantity: 1 }]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof TransferItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const getAvailableStock = (productId: string) => {
    if (!sourceGodownId || !productId) return 0;
    const product = products.find(p => p._id === productId);
    if (!product || !product.stockByGodown) return 0;
    const godownStock = product.stockByGodown.find(g => g.godownId === sourceGodownId);
    return godownStock ? godownStock.stock : 0;
  };

  const handleSubmit = async () => {
    if (!sourceGodownId) return toast.error("Please select a Source Godown");
    if (!destinationGodownId) return toast.error("Please select a Destination Godown");
    if (sourceGodownId === destinationGodownId) return toast.error("Source and Destination godowns cannot be the same");

    const validItems = items.filter(item => item.productId && item.quantity > 0);
    if (validItems.length === 0) return toast.error("Please add at least one valid item to transfer");

    // Validate available stock
    for (const item of validItems) {
      const available = getAvailableStock(item.productId);
      if (item.quantity > available) {
        const product = products.find(p => p._id === item.productId);
        return toast.error(`Insufficient stock for ${product?.name}. Available: ${available}`);
      }
    }

    try {
      setSubmitting(true);
      await stockService.transferStock({
        items: validItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
        sourceGodownId,
        destinationGodownId,
        notes
      });
      
      toast.success("Stock transferred successfully!");
      router.push("/inventory/godowns");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || error.message || "Failed to transfer stock");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader title="Bulk Stock Transfer" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-primary/10 shadow-sm">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Transfer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Source Godown *</Label>
              <Select value={sourceGodownId} onValueChange={setSourceGodownId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Godown (Transfer From)" />
                </SelectTrigger>
                <SelectContent>
                  {godowns.map(g => (
                    <SelectItem key={g._id} value={g._id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Destination Godown *</Label>
              <Select value={destinationGodownId} onValueChange={setDestinationGodownId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Godown (Transfer To)" />
                </SelectTrigger>
                <SelectContent>
                  {godowns.map(g => (
                    <SelectItem key={g._id} value={g._id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes / Reference (Optional)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for transfer..."
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-primary/10 shadow-sm">
          <CardHeader className="pb-4 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Items to Transfer
            </CardTitle>
            <Button onClick={addItem} size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add Row
            </Button>
          </CardHeader>
          <CardContent className="pt-0 px-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 font-medium w-12 text-center">#</th>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium w-48 text-center">Available Stock</th>
                    <th className="px-4 py-3 font-medium w-48 text-center">Transfer Quantity</th>
                    <th className="px-4 py-3 font-medium w-16 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-4 py-3 text-center text-muted-foreground">{index + 1}</td>
                      <td className="px-4 py-2">
                        <Select
                          value={item.productId}
                          onValueChange={(val) => updateItem(item.id, "productId", val)}
                        >
                          <SelectTrigger className="h-9 border-input bg-transparent text-sm w-[250px]">
                            <SelectValue placeholder="Select Product..." />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(p => (
                              <SelectItem key={p._id} value={p._id}>
                                {p.name} {p.sku ? `(${p.sku})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-medium text-base">
                            {item.productId ? getAvailableStock(item.productId) : '-'}
                          </span>
                          {item.productId && !sourceGodownId && (
                            <span className="text-[10px] text-destructive">Select Source Godown</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          min="1"
                          className="h-9 w-full bg-transparent text-center font-bold text-base"
                          value={item.quantity || ""}
                          onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="h-8 w-8 text-destructive opacity-50 hover:opacity-100 disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t bg-muted/20 flex justify-end">
              <Button onClick={handleSubmit} disabled={submitting} className="min-w-[150px]">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="mr-2 h-4 w-4" /> Execute Transfer
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
