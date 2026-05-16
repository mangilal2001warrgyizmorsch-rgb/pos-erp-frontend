import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import { subcategoryService } from "@/services/subcategoryService";
import type { Product, Category, Subcategory } from "@/types";

interface SimpleProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (product: Product) => void;
  initialBarcode?: string;
  initialSku?: string;
}

export function SimpleProductModal({ open, onOpenChange, onSuccess, initialBarcode, initialSku }: SimpleProductModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", barcode: "", sku: "", category: "", subcategoryId: "",
    hsnCode: "", unit: "piece", stock: "0", lowStockThreshold: "10", images: [] as string[]
  });

  useEffect(() => {
    if (open) {
      categoryService.getAll().then((r) => setCategories(r)).catch(() => {});
      subcategoryService.getAll().then((r) => setSubcategories(r)).catch(() => {});
      setForm({
        name: "", description: "", 
        barcode: initialBarcode || "", 
        sku: initialSku || `SKU-${Date.now().toString().slice(-6)}`, 
        category: "", subcategoryId: "", hsnCode: "", unit: "piece", 
        stock: "0", lowStockThreshold: "10", images: []
      });
    }
  }, [open, initialBarcode, initialSku]);

  const handleSave = async () => {
    if (!form.name || !form.category || !form.sku) {
      toast.error("Please fill Name, Category, and SKU");
      return;
    }
    try {
      setSaving(true);
      const payload: Partial<Product> = {
        name: form.name,
        description: form.description,
        sku: form.sku,
        barcode: form.barcode,
        category: form.category,
        subcategoryId: form.subcategoryId || undefined,
        hsnCode: form.hsnCode,
        stock: Number(form.stock) || 0,
        lowStockThreshold: Number(form.lowStockThreshold) || 10,
        unit: form.unit as any,
        images: form.images,
        image: form.images.length > 0 ? form.images[0] : undefined,
      };
      const savedProduct = await productService.create(payload);
      toast.success("Product created successfully!");
      onSuccess(savedProduct);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto z-[110]">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>Fill in the product details to add to inventory.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label>Product Images</Label>
            <ImageUploader 
              multiple
              value={form.images} 
              onChange={(urls) => setForm({ ...form, images: urls as string[] })} 
              folder="products"
              maxFiles={10}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v, subcategoryId: "" })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent className="z-[120]">
                  {categories.map((cat) => (<SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subcategory</Label>
              <Select value={form.subcategoryId} onValueChange={(v) => setForm({ ...form, subcategoryId: v })} disabled={!form.category}>
                <SelectTrigger><SelectValue placeholder="Select subcategory" /></SelectTrigger>
                <SelectContent className="z-[120]">
                  {subcategories.filter(s => {
                    const pId = typeof s.parentCategoryId === 'string' ? s.parentCategoryId : (s.parentCategoryId as any)._id;
                    return pId === form.category;
                  }).map((sub) => (
                    <SelectItem key={sub._id} value={sub._id}>{sub.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>SKU *</Label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })} placeholder="SKU-001" />
            </div>
            <div className="space-y-2">
              <Label>HSN Code</Label>
              <Input value={form.hsnCode} onChange={(e) => setForm({ ...form, hsnCode: e.target.value })} placeholder="HSN" />
            </div>
            <div className="space-y-2">
              <Label>Barcode</Label>
              <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="Barcode" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Stock *</Label>
              <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Low Alert</Label>
              <Input type="number" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} placeholder="10" />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="z-[120]">
                  {["piece", "kg", "liter", "meter", "box", "dozen"].map((u) => (
                    <SelectItem key={u} value={u} className="capitalize">{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
