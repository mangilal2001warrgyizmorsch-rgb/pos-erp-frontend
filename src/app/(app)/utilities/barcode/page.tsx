"use client";

import { useState, useRef } from "react";
import { Plus, Settings, ScanBarcode, Maximize2, Trash2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Barcode from "react-barcode";
import { useReactToPrint } from "react-to-print";

type BarcodeItem = {
  id: string;
  itemName: string;
  itemCode: string;
  noOfLabels: number;
  header: string;
  line1: string;
  line2: string;
  line3: string;
  line4: string;
  selected: boolean;
};

export default function BarcodeGeneratorPage() {
  const [form, setForm] = useState({
    itemName: "", itemCode: "", noOfLabels: "1", header: "",
    line1: "", line2: "", line3: "", line4: ""
  });
  
  const [addedItems, setAddedItems] = useState<BarcodeItem[]>([]);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const handleAdd = () => {
    if (!form.itemName || !form.itemCode) return;
    setAddedItems(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      ...form,
      noOfLabels: parseInt(form.noOfLabels) || 1,
      selected: true
    }]);
    setForm({ ...form, itemCode: "", noOfLabels: "1" }); // keep settings but reset code
  };

  const removeRow = (id: string) => {
    setAddedItems(prev => prev.filter(item => item.id !== id));
  };

  const toggleSelect = (id: string) => {
    setAddedItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const toggleSelectAll = (checked: boolean) => {
    setAddedItems(prev => prev.map(item => ({ ...item, selected: checked })));
  };

  const selectedCount = addedItems.filter(item => item.selected).length;
  const allSelected = addedItems.length > 0 && selectedCount === addedItems.length;

  // Flatten selected items by quantity for printing
  const itemsToPrint = addedItems
    .filter(item => item.selected)
    .flatMap(item => Array.from({ length: item.noOfLabels }, () => item));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Barcode Generator <span className="text-muted-foreground text-sm font-normal border rounded-full px-2">i</span>
          </h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Printer</span>
            <span className="font-medium">Label Printer</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Size</span>
            <span className="font-medium">50×25mm</span>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 bg-card shadow-sm border-0">
          <h2 className="text-base font-semibold mb-6">Enter item details to add for barcode</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Item Name<span className="text-red-500">*</span></Label>
                <Input placeholder="Enter Item Name" value={form.itemName} onChange={(e) => setForm({...form, itemName: e.target.value})} className="bg-transparent" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Item Code<span className="text-red-500">*</span></Label>
                <Input placeholder="Enter Item Code" value={form.itemCode} onChange={(e) => setForm({...form, itemCode: e.target.value})} className="bg-transparent" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">No of Labels<span className="text-red-500">*</span></Label>
                <Input type="number" min="1" placeholder="Labels" value={form.noOfLabels} onChange={(e) => setForm({...form, noOfLabels: e.target.value})} className="bg-transparent" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Header</Label>
                <Input placeholder="Header" value={form.header} onChange={(e) => setForm({...form, header: e.target.value})} className="bg-transparent" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Line 1</Label>
                <Input placeholder="Line 1" value={form.line1} onChange={(e) => setForm({...form, line1: e.target.value})} className="bg-transparent" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Line 2</Label>
                <Input placeholder="Line 2" value={form.line2} onChange={(e) => setForm({...form, line2: e.target.value})} className="bg-transparent" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Line 3</Label>
                <Input placeholder="Line 3" value={form.line3} onChange={(e) => setForm({...form, line3: e.target.value})} className="bg-transparent" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Line 4</Label>
                <Input placeholder="Line 4" value={form.line4} onChange={(e) => setForm({...form, line4: e.target.value})} className="bg-transparent" />
              </div>
            </div>
          </div>
        </Card>

        {/* Right Preview Area */}
        <Card className="p-6 bg-muted/20 border-0 shadow-sm flex flex-col items-center">
          <div className="w-full flex justify-center items-center gap-2 mb-6">
            <h2 className="text-sm font-semibold">Preview</h2>
          </div>

          <div className="bg-card border rounded-lg w-full max-w-[240px] aspect-[4/3] flex flex-col items-center justify-center p-2 shadow-sm relative overflow-hidden mb-8">
            <div className="text-[10px] font-bold mb-1">{form.header || "Header"}</div>
            
            {form.itemCode ? (
              <Barcode value={form.itemCode} format="CODE128" width={1.5} height={40} displayValue={true} fontSize={12} background="transparent" />
            ) : (
              <div className="w-full h-12 flex justify-center items-end gap-[2px] mb-1 opacity-20">
                {[...Array(30)].map((_, i) => (
                  <div key={i} className="bg-foreground h-full" style={{ width: `${Math.max(1, Math.random() * 4)}px` }}></div>
                ))}
              </div>
            )}
            
            <div className="text-[10px] mt-1 text-center font-medium">
              <div>{form.line1}</div>
              <div>{form.line2}</div>
              <div>{form.line3}</div>
              <div>{form.line4}</div>
            </div>
          </div>

          <Button 
            className="w-full bg-primary/20 text-primary hover:bg-primary/30 rounded-full font-medium" 
            disabled={!form.itemName || !form.itemCode}
            onClick={handleAdd}
          >
            Add for Barcode
          </Button>
        </Card>
      </div>

      {/* Item Details Table */}
      <Card className="border-0 shadow-sm bg-card overflow-hidden flex flex-col min-h-[300px]">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-sm">Item Details ({addedItems.length})</h3>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="p-4 w-12 text-center">
                  <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} disabled={addedItems.length === 0} />
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground">Item Name</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Labels</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Header</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Line 1</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Line 2</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {addedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-16">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <ScanBarcode className="h-16 w-16 opacity-20 mb-4" />
                      <p className="text-sm">Added items for Barcode generation will appear here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                addedItems.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-muted/30">
                    <td className="p-4 text-center">
                      <Checkbox checked={item.selected} onCheckedChange={() => toggleSelect(item.id)} />
                    </td>
                    <td className="p-4 font-medium">{item.itemName}</td>
                    <td className="p-4">{item.noOfLabels}</td>
                    <td className="p-4">{item.header}</td>
                    <td className="p-4">{item.line1}</td>
                    <td className="p-4">{item.line2}</td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => removeRow(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t bg-muted/10 flex justify-end gap-4">
          <Button 
            className="rounded-full px-8 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            disabled={selectedCount === 0}
            onClick={() => setPrintModalOpen(true)}
          >
            <Printer className="mr-2 h-4 w-4" /> Generate & Print ({selectedCount})
          </Button>
        </div>
      </Card>

      {/* Print Modal */}
      <Dialog open={printModalOpen} onOpenChange={setPrintModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Print Barcodes</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end mb-4">
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" /> Print Labels
            </Button>
          </div>
          <div className="bg-white text-black p-8 rounded-md" ref={printRef}>
            <div className="flex flex-wrap gap-4 justify-center">
              {itemsToPrint.map((item, idx) => (
                <div key={idx} className="border border-gray-300 w-[200px] h-[100px] flex flex-col items-center justify-center p-2 break-inside-avoid shadow-sm rounded-sm">
                  <div className="text-[10px] font-bold truncate w-full text-center">{item.header}</div>
                  <Barcode value={item.itemCode} format="CODE128" width={1.2} height={30} displayValue={true} fontSize={10} background="transparent" margin={2} />
                  <div className="text-[9px] font-medium leading-tight text-center truncate w-full">{item.line1}</div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
