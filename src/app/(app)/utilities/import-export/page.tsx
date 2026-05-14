"use client";

import { useState, useRef } from "react";
import { PackageOpen, FileSpreadsheet, Database, ChevronLeft, Upload, CheckCircle2, ScanBarcode, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import { toast } from "sonner";

// Mock Global Library Items
const GLOBAL_LIBRARY = [
  { id: "1", barcode: "8901493000000", name: "Parle-G Original Gluco Biscuits", category: "Snacks", price: 10 },
  { id: "2", barcode: "8901058862217", name: "Maggi 2-Minute Noodles", category: "Food", price: 14 },
  { id: "3", barcode: "8901030310008", name: "Coca-Cola 750ml", category: "Beverages", price: 40 },
  { id: "4", barcode: "8901262150172", name: "Amul Butter 100g", category: "Dairy", price: 54 },
  { id: "5", barcode: "8901138210332", name: "Dabur Honey 250g", category: "Grocery", price: 99 },
];

export default function ImportExportPage() {
  const [selectedMethod, setSelectedMethod] = useState("barcode");
  
  // Excel State
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Barcode State
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [scannedResult, setScannedResult] = useState<any>(null);

  // Library State
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");
  const [selectedLibraryItems, setSelectedLibraryItems] = useState<string[]>([]);

  const handleContinue = () => {
    if (selectedMethod === "excel") {
      fileInputRef.current?.click();
    } else if (selectedMethod === "barcode") {
      setIsBarcodeOpen(true);
      setScannedBarcode("");
      setScannedResult(null);
    } else if (selectedMethod === "library") {
      setIsLibraryOpen(true);
      setLibrarySearch("");
      setSelectedLibraryItems([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        if (json.length === 0) {
          toast.error("The uploaded file is empty.");
          return;
        }

        setParsedData(json);
        setIsPreviewOpen(true);
      } catch (err) {
        toast.error("Failed to parse the excel file.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleImportToDatabase = async () => {
    setIsImporting(true);
    setTimeout(() => {
      setIsImporting(false);
      setIsPreviewOpen(false);
      toast.success(`Successfully imported ${parsedData.length} items to your database!`);
      setParsedData([]);
    }, 1500);
  };

  const handleBarcodeSearch = () => {
    if (!scannedBarcode) return;
    setIsImporting(true);
    setTimeout(() => {
      setIsImporting(false);
      const found = GLOBAL_LIBRARY.find(item => item.barcode === scannedBarcode);
      if (found) {
        setScannedResult(found);
      } else {
        toast.error("Item not found in the global library.");
        setScannedResult(null);
      }
    }, 800);
  };

  const handleSaveBarcodeItem = () => {
    toast.success(`${scannedResult.name} imported successfully!`);
    setIsBarcodeOpen(false);
  };

  const handleImportLibraryItems = () => {
    setIsImporting(true);
    setTimeout(() => {
      setIsImporting(false);
      setIsLibraryOpen(false);
      toast.success(`Successfully imported ${selectedLibraryItems.length} items from the library!`);
    }, 1000);
  };

  const filteredLibrary = GLOBAL_LIBRARY.filter(i => 
    i.name.toLowerCase().includes(librarySearch.toLowerCase()) || 
    i.barcode.includes(librarySearch)
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Hidden File Input */}
      <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />

      {/* Header */}
      <div className="flex items-center gap-4 border-b pb-4 mb-8">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground bg-muted/50 rounded-md">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Import Items</h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          <h2 className="text-xl font-bold text-center mb-8">Select Import Method</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Option 1: Barcode */}
            <Card 
              className={cn("p-8 relative cursor-pointer transition-all border-2", selectedMethod === "barcode" ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/50 bg-card")}
              onClick={() => setSelectedMethod("barcode")}
            >
              <div className="absolute top-4 right-4">
                <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center", selectedMethod === "barcode" ? "border-primary" : "border-muted-foreground/30")}>
                  {selectedMethod === "barcode" && <div className="h-2.5 w-2.5 bg-primary rounded-full" />}
                </div>
              </div>
              <div className="absolute top-4 right-12">
                <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-0 text-[10px] tracking-wider uppercase">Recommended</Badge>
              </div>

              <div className="flex flex-col items-center text-center mt-2">
                <div className="h-24 w-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6 relative">
                  <PackageOpen className="h-10 w-10 text-blue-500 dark:text-blue-400" />
                  <div className="absolute -bottom-2 -right-2 bg-card p-1 rounded-md shadow-sm border">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => <div key={i} className="w-0.5 h-3 bg-foreground" />)}
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-3">Import From Barcode</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Import item details by scanning barcodes. The system uses a library of 100 Mn+ standard barcodes to fetch all details of your items in seconds.
                </p>
              </div>
            </Card>

            {/* Option 2: Excel */}
            <Card 
              className={cn("p-8 relative cursor-pointer transition-all border-2", selectedMethod === "excel" ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/50 bg-card")}
              onClick={() => setSelectedMethod("excel")}
            >
              <div className="absolute top-4 right-4">
                <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center", selectedMethod === "excel" ? "border-primary" : "border-muted-foreground/30")}>
                  {selectedMethod === "excel" && <div className="h-2.5 w-2.5 bg-primary rounded-full" />}
                </div>
              </div>

              <div className="flex flex-col items-center text-center mt-2">
                <div className="h-24 w-24 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-6 relative">
                  <FileSpreadsheet className="h-10 w-10 text-indigo-500 dark:text-indigo-400" />
                  <div className="absolute top-6 left-6 bg-blue-500 rounded-sm w-4 h-4 flex items-center justify-center text-[10px] text-white font-bold">X</div>
                </div>
                <h3 className="text-lg font-bold mb-3">Import From Excel</h3>
                <p className="text-sm text-muted-foreground leading-relaxed px-4">
                  Import item data from excel files in your system
                </p>
              </div>
            </Card>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="h-px bg-border flex-1" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">OR</span>
            <div className="h-px bg-border flex-1" />
          </div>

          {/* Option 3: Library */}
          <Card 
            className={cn("p-6 relative cursor-pointer transition-all border-2", selectedMethod === "library" ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/50 bg-card")}
            onClick={() => setSelectedMethod("library")}
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <Database className="h-6 w-6 text-slate-500 dark:text-slate-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold mb-1">Import From Global Library</h3>
                <p className="text-sm text-muted-foreground">
                  Import items from the verified global database
                </p>
              </div>
              <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0", selectedMethod === "library" ? "border-primary" : "border-muted-foreground/30")}>
                {selectedMethod === "library" && <div className="h-2.5 w-2.5 bg-primary rounded-full" />}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer fixed action */}
      <div className="flex justify-end pt-4 mt-auto">
        <Button 
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-10 py-6 text-base font-medium shadow-md w-full sm:w-auto"
          onClick={handleContinue}
        >
          {selectedMethod === "excel" ? "Upload Excel File" : "Continue"}
        </Button>
      </div>

      {/* Excel Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Excel Data Parsed Successfully
            </DialogTitle>
            <DialogDescription>We found {parsedData.length} items in your file. Review the data below before importing to the database.</DialogDescription>
          </DialogHeader>
          <div className="overflow-auto border rounded-md my-4 flex-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b sticky top-0">
                  <th className="p-3 text-left font-semibold w-12">#</th>
                  {parsedData.length > 0 && Object.keys(parsedData[0]).map((key, i) => <th key={i} className="p-3 text-left font-semibold whitespace-nowrap">{key}</th>)}
                </tr>
              </thead>
              <tbody>
                {parsedData.slice(0, 50).map((row, idx) => (
                  <tr key={idx} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="p-3 text-muted-foreground">{idx + 1}</td>
                    {Object.values(row).map((val: any, i) => <td key={i} className="p-3 truncate max-w-[200px]">{String(val)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)} disabled={isImporting}>Cancel</Button>
            <Button onClick={handleImportToDatabase} disabled={isImporting} className="gap-2"><Upload className="h-4 w-4" /> {isImporting ? "Importing..." : `Import ${parsedData.length} Items`}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner Dialog */}
      <Dialog open={isBarcodeOpen} onOpenChange={setIsBarcodeOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ScanBarcode className="h-5 w-5 text-primary" /> Scan Barcode</DialogTitle>
            <DialogDescription>Scan a barcode or enter it manually to fetch product details from the global library.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex gap-2">
              <Input placeholder="Enter barcode (e.g., 8901058862217)" value={scannedBarcode} onChange={(e) => setScannedBarcode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleBarcodeSearch()} />
              <Button onClick={handleBarcodeSearch} disabled={isImporting || !scannedBarcode}>{isImporting ? "..." : "Search"}</Button>
            </div>
            
            {scannedResult && (
              <Card className="p-4 bg-muted/30 mt-2">
                <h3 className="font-semibold">{scannedResult.name}</h3>
                <div className="text-sm text-muted-foreground mt-2 grid grid-cols-2 gap-2">
                  <div><span className="font-medium text-foreground">Category:</span> {scannedResult.category}</div>
                  <div><span className="font-medium text-foreground">Est. Price:</span> ₹{scannedResult.price}</div>
                  <div className="col-span-2"><span className="font-medium text-foreground">Barcode:</span> {scannedResult.barcode}</div>
                </div>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBarcodeOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveBarcodeItem} disabled={!scannedResult}>Import Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Global Library Dialog */}
      <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-primary" /> Global Product Library</DialogTitle>
            <DialogDescription>Select standard items to import directly into your database.</DialogDescription>
          </DialogHeader>
          
          <div className="relative my-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or barcode..." className="pl-10" value={librarySearch} onChange={(e) => setLibrarySearch(e.target.value)} />
          </div>

          <div className="overflow-auto border rounded-md flex-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b sticky top-0">
                  <th className="p-3 text-left w-12">
                    <input type="checkbox" onChange={(e) => setSelectedLibraryItems(e.target.checked ? filteredLibrary.map(i => i.id) : [])} checked={selectedLibraryItems.length === filteredLibrary.length && filteredLibrary.length > 0} className="rounded border-border text-primary focus:ring-primary" />
                  </th>
                  <th className="p-3 text-left font-semibold">Product Name</th>
                  <th className="p-3 text-left font-semibold">Barcode</th>
                  <th className="p-3 text-left font-semibold">Category</th>
                  <th className="p-3 text-right font-semibold">Est. Price</th>
                </tr>
              </thead>
              <tbody>
                {filteredLibrary.length === 0 ? (
                  <tr><td colSpan={5} className="text-center p-8 text-muted-foreground">No items found matching your search.</td></tr>
                ) : (
                  filteredLibrary.map((item) => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20 cursor-pointer" onClick={() => {
                      if (selectedLibraryItems.includes(item.id)) setSelectedLibraryItems(selectedLibraryItems.filter(id => id !== item.id));
                      else setSelectedLibraryItems([...selectedLibraryItems, item.id]);
                    }}>
                      <td className="p-3">
                        <input type="checkbox" checked={selectedLibraryItems.includes(item.id)} readOnly className="rounded border-border text-primary focus:ring-primary" />
                      </td>
                      <td className="p-3 font-medium">{item.name}</td>
                      <td className="p-3 text-muted-foreground">{item.barcode}</td>
                      <td className="p-3 text-muted-foreground"><Badge variant="secondary" className="font-normal">{item.category}</Badge></td>
                      <td className="p-3 text-right font-medium">₹{item.price}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsLibraryOpen(false)} disabled={isImporting}>Cancel</Button>
            <Button onClick={handleImportLibraryItems} disabled={isImporting || selectedLibraryItems.length === 0} className="gap-2">
              <Upload className="h-4 w-4" /> {isImporting ? "Importing..." : `Import ${selectedLibraryItems.length} Selected Items`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
