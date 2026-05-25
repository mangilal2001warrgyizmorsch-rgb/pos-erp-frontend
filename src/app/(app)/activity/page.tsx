"use client";

import { useEffect, useState, useCallback } from "react";
import { ClipboardList, Search, RefreshCw, Eye, Calendar, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { activityLogService } from "@/services/activityLogService";
import { formatDate } from "@/lib/utils";
import type { ActivityLog } from "@/types";

const MODULE_OPTIONS = [
  { value: "all", label: "All Modules" },
  { value: "Product", label: "Product" },
  { value: "Category", label: "Category" },
  { value: "Subcategory", label: "Subcategory" },
  { value: "Customer", label: "Customer" },
  { value: "Supplier", label: "Supplier" },
  { value: "Transporter", label: "Transporter" },
  { value: "Expense", label: "Expense" },
  { value: "Shift", label: "Shift" },
  { value: "Sale", label: "Sale" },
  { value: "Purchase", label: "Purchase" },
  { value: "Auth", label: "Auth" },
  { value: "Inventory", label: "Inventory" },
  { value: "CashBank", label: "CashBank" },
];

const ACTION_OPTIONS = [
  { value: "all", label: "All Actions" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "stock_adjust", label: "Stock Adjust" },
  { value: "sale", label: "Sale" },
  { value: "purchase", label: "Purchase" },
  { value: "cancel", label: "Cancel" },
];

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [searchUser, setSearchUser] = useState("");
  const [module, setModule] = useState("all");
  const [action, setAction] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Details Modal
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = {
        page,
        limit: 15,
      };

      if (searchUser) params.user = searchUser;
      if (module !== "all") params.module = module;
      if (action !== "all") params.action = action;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const result = await activityLogService.getAll(params);
      setLogs(result.data || []);
      setTotalPages(result.pagination?.pages || 1);
    } catch {
      toast.error("Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  }, [page, searchUser, module, action, startDate, endDate]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadLogs();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [loadLogs]);

  const handleResetFilters = () => {
    setSearchUser("");
    setModule("all");
    setAction("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const updateSearchUser = (value: string) => {
    setSearchUser(value);
    setPage(1);
  };

  const updateModule = (value: string) => {
    setModule(value);
    setPage(1);
  };

  const updateAction = (value: string) => {
    setAction(value);
    setPage(1);
  };

  const updateStartDate = (value: string) => {
    setStartDate(value);
    setPage(1);
  };

  const updateEndDate = (value: string) => {
    setEndDate(value);
    setPage(1);
  };

  const hasActiveFilters = Boolean(searchUser || module !== "all" || action !== "all" || startDate || endDate);

  const getActionBadge = (actionStr: string) => {
    switch (actionStr) {
      case "create":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/20 font-bold capitalize">Create</Badge>;
      case "update":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/10 border-blue-500/20 font-bold capitalize">Update</Badge>;
      case "delete":
      case "cancel":
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/10 border-rose-500/20 font-bold capitalize">{actionStr}</Badge>;
      case "login":
      case "logout":
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 hover:bg-purple-500/10 border-purple-500/20 font-bold capitalize">{actionStr}</Badge>;
      default:
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/10 border-amber-500/20 font-bold capitalize">{actionStr.replace("_", " ")}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Logs"
        description="Track all system activity, changes, and user sessions"
        icon={ClipboardList}
      />

      {/* Filter Toolbar */}
      <Card className="rounded-2xl border-border/60 p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Filter Activity</p>
            {hasActiveFilters && <Badge className="ml-1 rounded-full bg-primary/10 text-primary hover:bg-primary/10">Active</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleResetFilters} disabled={!hasActiveFilters} className="text-muted-foreground">
              Clear filters
            </Button>
            <Button variant="outline" size="icon-sm" onClick={loadLogs} title="Refresh logs" aria-label="Refresh logs">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
          <div className="relative xl:col-span-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search user..."
              value={searchUser}
              onChange={(e) => updateSearchUser(e.target.value)}
              className="h-11 pl-10"
            />
          </div>
          <div className="xl:col-span-2">
            <Select value={module} onValueChange={updateModule}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                {MODULE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="xl:col-span-2">
            <Select value={action} onValueChange={updateAction}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/20 p-1 xl:col-span-5">
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <Calendar className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => updateStartDate(e.target.value)}
                className="h-9 min-w-0 border-0 bg-transparent px-2 text-sm shadow-none focus-visible:ring-0"
                title="Start Date"
                aria-label="Start date"
              />
              <span className="text-xs font-medium text-muted-foreground">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => updateEndDate(e.target.value)}
                className="h-9 min-w-0 border-0 bg-transparent px-2 text-sm shadow-none focus-visible:ring-0"
                title="End Date"
                aria-label="End date"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Table & Data */}
      <Card className="overflow-hidden rounded-2xl border-border/60 shadow-sm">
        {loading ? (
          <div className="p-4"><TableSkeleton rows={8} /></div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">No activity logs found</p>
            <p className="text-sm">Try relaxing your search filters.</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold">Activity History</h2>
                <p className="text-xs text-muted-foreground">Latest system events and user sessions</p>
              </div>
              <Badge variant="outline" className="rounded-full px-3 text-muted-foreground">{logs.length} records</Badge>
            </div>
            <div className="overflow-x-auto">
            <Table className="min-w-[860px]">
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-48 pl-6">Timestamp</TableHead>
                  <TableHead className="w-44">User</TableHead>
                  <TableHead className="w-36">Module</TableHead>
                  <TableHead className="w-32">Action</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-20 pr-6 text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log._id} className="h-[72px] transition-colors hover:bg-muted/25">
                    <TableCell className="pl-6 text-xs font-mono whitespace-nowrap text-muted-foreground">
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-sm">{log.userName}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">{log.ipAddress || "No IP"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-full bg-muted/20 px-3 font-semibold">{log.module}</Badge>
                    </TableCell>
                    <TableCell>
                      {getActionBadge(log.action)}
                    </TableCell>
                    <TableCell className="max-w-md truncate text-sm text-foreground" title={log.description}>
                      {log.description}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setSelectedLog(log);
                          setDetailsOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t bg-muted/10 p-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Activity Log Details</DialogTitle>
            <DialogDescription>Full details of system event execution.</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 py-4 text-sm">
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">User</p>
                  <p className="font-medium text-foreground">{selectedLog.userName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">IP Address</p>
                  <p className="font-mono text-foreground text-xs">{selectedLog.ipAddress || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Module / Action</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline">{selectedLog.module}</Badge>
                    {getActionBadge(selectedLog.action)}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Timestamp</p>
                  <p className="text-foreground">{formatDate(selectedLog.createdAt)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground font-semibold">Description</p>
                <p className="text-foreground mt-1 bg-muted/40 p-3 rounded-lg border">{selectedLog.description}</p>
              </div>

              {selectedLog.details && (
                <div>
                  <p className="text-xs text-muted-foreground font-semibold mb-1">State Details (JSON)</p>
                  <pre className="bg-muted p-4 rounded-lg font-mono text-xs overflow-auto max-h-[250px] border">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
