"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Package, MapPin, CheckCircle, Boxes, Store } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { godownService } from "@/services/godownService";
import type { Godown } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface InventoryBatch {
  purchasePrice: number;
  salePrice: number;
  quantity: number;
}

interface GodownInventory {
  product: {
    _id: string;
    name: string;
    sku: string;
    image: string;
    unit: string;
  };
  totalQuantity: number;
  batches: InventoryBatch[];
}

export default function GodownDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const godownId = params.id as string;

  const [godown, setGodown] = useState<Godown | null>(null);
  const [inventory, setInventory] = useState<GodownInventory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (godownId) {
      fetchGodownDetails();
    }
  }, [godownId]);

  const fetchGodownDetails = async () => {
    try {
      setLoading(true);
      const [godownRes, inventoryRes] = await Promise.all([
        godownService.getGodownById(godownId),
        godownService.getGodownInventory(godownId)
      ]);
      setGodown(godownRes.data);
      setInventory(inventoryRes.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch godown details");
      router.push("/inventory/godowns");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!godown) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)]">
        <Store className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
        <h2 className="text-xl font-medium mb-2">Godown Not Found</h2>
        <Button variant="outline" onClick={() => router.push("/inventory/godowns")}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/inventory/godowns")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader title="Godown Inventory" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-primary/10 shadow-sm overflow-hidden">
          <div className="bg-muted/30 p-6 flex flex-col md:flex-row justify-between md:items-center gap-4 border-b">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{godown.name}</h2>
                {godown.isDefault && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Default Godown
                  </Badge>
                )}
                <Badge variant={godown.isActive ? "default" : "secondary"}>
                  {godown.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              {godown.address && (
                <div className="flex items-center text-muted-foreground text-sm gap-2 mt-2">
                  <MapPin className="h-4 w-4" />
                  {godown.address}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <div className="bg-background rounded-lg border p-3 flex flex-col items-center min-w-[120px]">
                <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Unique Items</span>
                <span className="text-2xl font-bold text-primary">{inventory.length}</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-primary/10 shadow-sm">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Boxes className="h-5 w-5 text-primary" />
              Inventory Breakdown
            </CardTitle>
            <CardDescription>
              Detailed view of all products stored in this godown, separated by their purchase and sale price batches.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 px-0">
            {inventory.length === 0 ? (
              <div className="text-center p-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                <p className="text-muted-foreground">This godown is currently empty.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-xs border-b">
                    <tr>
                      <th className="px-6 py-4 font-medium">Product</th>
                      <th className="px-6 py-4 font-medium text-right">Total Quantity</th>
                      <th className="px-6 py-4 font-medium">Batch Breakdown (Price & Stock)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {inventory.map((item) => (
                      <tr key={item.product._id} className="hover:bg-muted/10 transition-colors group">
                        <td className="px-6 py-4 align-top">
                          <div className="font-medium text-base">{item.product.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">SKU: {item.product.sku}</div>
                        </td>
                        <td className="px-6 py-4 align-top text-right">
                          <div className="font-bold text-lg">{item.totalQuantity} <span className="text-xs font-normal text-muted-foreground">{item.product.unit}</span></div>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex flex-col gap-2">
                            {item.batches.length === 0 ? (
                              <div className="text-sm text-muted-foreground italic bg-muted/20 px-3 py-2 rounded-md border border-dashed border-muted/50 inline-block w-max">
                                Out of Stock in this Godown
                              </div>
                            ) : (
                              item.batches.map((batch, index) => (
                                <div key={index} className="flex items-center gap-4 bg-background border rounded-md p-2 shadow-sm text-sm">
                                  <div className="flex flex-col flex-1">
                                    <span className="text-xs text-muted-foreground uppercase">Purchased At</span>
                                    <span className="font-medium">{formatCurrency(batch.purchasePrice)}</span>
                                  </div>
                                  <div className="w-px h-8 bg-border"></div>
                                  <div className="flex flex-col flex-1">
                                    <span className="text-xs text-muted-foreground uppercase">Selling At</span>
                                    <span className="font-medium">{formatCurrency(batch.salePrice)}</span>
                                  </div>
                                  <div className="w-px h-8 bg-border"></div>
                                  <div className="flex flex-col flex-1 items-end bg-primary/5 rounded-md px-3 py-1">
                                    <span className="text-xs text-primary uppercase font-semibold">Available</span>
                                    <span className="font-bold text-base text-primary">{batch.quantity}</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
