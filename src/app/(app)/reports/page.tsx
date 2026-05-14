"use client";

import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, FileText, File, Sheet, Printer } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { InventoryAnalyticsDashboard } from "@/components/analytics/InventoryAnalyticsDashboard";
import { SalesAnalyticsDashboard } from "@/components/analytics/SalesAnalyticsDashboard";
import { PurchaseAnalyticsDashboard } from "@/components/analytics/PurchaseAnalyticsDashboard";
import { AnalyticsFilters, FilterBar } from "@/components/analytics/FilterBar";
import { analyticsService, ReportFilters } from "@/services/analyticsService";
import { exportToCSV, exportToExcel, exportToPDF, printReport } from "@/utils/exportUtils";

type Period = "daily" | "weekly" | "monthly" | "yearly" | "custom";
type ReportType = "inventory" | "sales" | "purchases";

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("monthly");
  const [reportType, setReportType] = useState<ReportType>("sales");
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [isExporting, setIsExporting] = useState(false);

  // Memoize to prevent re-creation every render
  const reportParams: ReportFilters = useMemo(
    () => ({
      ...filters,
      period: period === "custom" ? "monthly" : period,
    }),
    [filters, period]
  );

  const getCurrentReport = useCallback(async () => {
    if (reportType === "inventory") return analyticsService.getInventoryAnalytics(reportParams);
    if (reportType === "purchases") return analyticsService.getPurchaseAnalytics(reportParams);
    return analyticsService.getSalesAnalytics(reportParams);
  }, [reportType, reportParams]);

  const handleExport = useCallback(async (format: "csv" | "excel" | "pdf" | "print") => {
    try {
      setIsExporting(true);
      const timestamp = new Date().toLocaleDateString().replace(/\//g, "-");
      const filename = `${reportType}_report_${timestamp}`;
      const report = await getCurrentReport();
      // Filter out image columns from export data
      const rows = (report?.table || []).map((row: Record<string, unknown>) => {
        const cleaned = { ...row };
        delete cleaned.productImage;
        return cleaned;
      });

      if (format === "csv") exportToCSV(rows, filename);
      if (format === "excel") await exportToExcel(rows, filename, undefined, `${reportType} report`);
      if (format === "pdf") await exportToPDF(rows, filename, `${reportType.toUpperCase()} Report`);
      if (format === "print") {
        const html = document.querySelector("[data-report-dashboard]")?.innerHTML || "";
        printReport(`${reportType.toUpperCase()} Report`, html);
      }

      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Failed to export report: ${error}`);
    } finally {
      setIsExporting(false);
    }
  }, [getCurrentReport, reportType]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analytics & Reports"
        description="Enterprise-level business intelligence dashboard"
        icon={BarChart3}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex gap-2"
        >
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => handleExport("csv")}
            disabled={isExporting}
          >
            <File className="h-4 w-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => handleExport("excel")}
            disabled={isExporting}
          >
            <Sheet className="h-4 w-4" />
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => handleExport("pdf")}
            disabled={isExporting}
          >
            <FileText className="h-4 w-4" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => handleExport("print")}
            disabled={isExporting}
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </motion.div>
      </PageHeader>

      {/* Filter Bar — compact, collapsible */}
      <FilterBar
        period={period}
        onPeriodChange={setPeriod}
        filters={filters}
        onFiltersChange={setFilters}
        onDateRangeChange={(startDate, endDate) => setFilters((prev) => ({ ...prev, startDate, endDate }))}
        isLoading={false}
      />

      {/* Main Dashboard Tabs */}
      <Tabs value={reportType} onValueChange={(v) => setReportType(v as ReportType)} className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="inventory" className="gap-2">
              Inventory
            </TabsTrigger>
            <TabsTrigger value="sales" className="gap-2">
              Sales
            </TabsTrigger>
            <TabsTrigger value="purchases" className="gap-2">
              Purchases
            </TabsTrigger>
          </TabsList>
        </motion.div>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-5">
          <motion.div
            key="inventory"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div data-report-dashboard>
              <InventoryAnalyticsDashboard period={reportParams.period} filters={filters} />
            </div>
          </motion.div>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-5">
          <motion.div
            key="sales"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div data-report-dashboard>
              <SalesAnalyticsDashboard period={reportParams.period} filters={filters} />
            </div>
          </motion.div>
        </TabsContent>

        {/* Purchases Tab */}
        <TabsContent value="purchases" className="space-y-5">
          <motion.div
            key="purchases"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div data-report-dashboard>
              <PurchaseAnalyticsDashboard period={reportParams.period} filters={filters} />
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center text-xs text-muted-foreground"
      >
        <p>All data is automatically updated. Last refresh: just now</p>
      </motion.div>
    </div>
  );
}
