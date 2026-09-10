"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Edit, Trash, Store, CheckCircle, ArrowRightLeft, Eye } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Godown, Product } from "@/types";
import { godownService } from "@/services/godownService";
import { productService } from "@/services/productService";
import { stockService } from "@/services/stockService";

export function GodownSettings() {
  const router = useRouter();
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Godown>>({
    name: "",
    address: "",
    isActive: true,
    isDefault: false,
  });

  useEffect(() => {
    fetchGodowns();
  }, []);

  const fetchGodowns = async () => {
    try {
      setLoading(true);
      const res = await godownService.getAllGodowns();
      setGodowns(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch godowns");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (godown?: Godown) => {
    if (godown) {
      setEditingId(godown._id);
      setFormData({
        name: godown.name,
        address: godown.address,
        isActive: godown.isActive,
        isDefault: godown.isDefault,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        address: "",
        isActive: true,
        isDefault: false,
      });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Godown Name is required");
      return;
    }
    try {
      setSaving(true);
      if (editingId) {
        await godownService.updateGodown(editingId, formData);
        toast.success("Godown updated");
      } else {
        await godownService.createGodown(formData);
        toast.success("Godown created");
      }
      setOpen(false);
      fetchGodowns();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save godown");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, isDefault: boolean) => {
    if (isDefault) {
      toast.error("Cannot delete the default godown");
      return;
    }
    if (confirm("Are you sure you want to delete this godown?")) {
      try {
        await godownService.deleteGodown(id);
        toast.success("Godown deleted");
        fetchGodowns();
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete godown");
      }
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Store className="h-5 w-5" /> Godowns</CardTitle>
          <CardDescription>Manage your store locations and inventory godowns.</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => router.push("/inventory/stock-transfer")}>
            <ArrowRightLeft className="h-4 w-4" />
            Stock Transfer
          </Button>
          <Button className="gap-2" onClick={() => handleOpen()}>
            <Plus className="h-4 w-4" />
            Add Godown
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : godowns.length === 0 ? (
          <div className="text-center p-8 border border-dashed rounded-lg">
            <Store className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <p className="text-muted-foreground mb-4">No godowns configured</p>
            <Button variant="outline" onClick={() => handleOpen()}>Create your first godown</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {godowns.map((godown) => (
              <Card key={godown._id} className={godown.isDefault ? "border-primary" : ""}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-lg flex items-center gap-2">
                      {godown.name}
                      {godown.isDefault && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpen(godown)} className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!godown.isDefault && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(godown._id, godown.isDefault)} className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3 min-h-[40px]">
                    {godown.address || "No address provided"}
                  </div>
                  <div className="flex items-center justify-between border-t pt-3 mt-2">
                    <Badge variant={godown.isActive ? "default" : "secondary"}>
                      {godown.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push(`/inventory/godowns/${godown._id}`)}>
                      <Eye className="h-4 w-4" />
                      View Inventory
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Godown" : "Add Godown"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update existing godown details." : "Create a new godown location."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Godown Name *</Label>
              <Input
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Main Store"
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Location details"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active Status</Label>
                <div className="text-sm text-muted-foreground">Can be used for new transactions</div>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(c) => setFormData({ ...formData, isActive: c })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Default Godown</Label>
                <div className="text-sm text-muted-foreground">Set as default for auto-selection</div>
              </div>
              <Switch
                checked={formData.isDefault}
                onCheckedChange={(c) => setFormData({ ...formData, isDefault: c })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
