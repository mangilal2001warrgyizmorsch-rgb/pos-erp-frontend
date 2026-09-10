"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Edit, Trash, Store, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Godown } from "@/types";
import { godownService } from "@/services/godownService";

export function GodownSettings() {
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
          <CardDescription>Manage warehouses and storage locations</CardDescription>
        </div>
        <Button onClick={() => handleOpen()} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Add Godown
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : godowns.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">No godowns found.</div>
        ) : (
          <div className="space-y-4">
            {godowns.map((g) => (
              <div key={g._id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-base">{g.name}</p>
                    {g.isDefault && <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20"><CheckCircle className="h-3 w-3 mr-1" /> Default</Badge>}
                    {!g.isActive && <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>}
                  </div>
                  {g.address && <p className="text-sm text-muted-foreground mt-1">{g.address}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpen(g)}>
                    <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" disabled={g.isDefault} onClick={() => handleDelete(g._id, g.isDefault)}>
                    <Trash className="h-4 w-4 text-destructive opacity-70 hover:opacity-100" />
                  </Button>
                </div>
              </div>
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
