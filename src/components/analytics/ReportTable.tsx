"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useMemo } from "react";

interface Column<T> {
  key: keyof T;
  label: string;
  format?: (value: any, row: T) => string;
  className?: string;
}

interface ReportTableProps<T> {
  title: string;
  data: T[];
  columns: Column<T>[];
  maxRows?: number;
  searchKey?: keyof T;
  loading?: boolean;
}

export function ReportTable<T extends { _id?: string | number; [key: string]: any }>({
  title,
  data,
  columns,
  maxRows = 10,
  searchKey,
  loading = false,
}: ReportTableProps<T>) {
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    if (!search || !searchKey) return data;
    return data.filter((item) =>
      String(item[searchKey])
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [data, search, searchKey]);

  const displayData = filteredData.slice(0, maxRows);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border border-border/40 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{title}</CardTitle>
            {searchKey && (
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 bg-muted rounded-lg animate-pulse" />
          ) : displayData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No data available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40">
                    {columns.map((col, colIndex) => (
                      <th
                        key={`${String(col.key)}-${colIndex}`}
                        className="text-left py-3 px-4 font-medium text-muted-foreground"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayData.map((row, idx) => (
                    <motion.tr
                      key={row._id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-border/20 hover:bg-muted/50 transition-colors"
                    >
                      {columns.map((col, colIndex) => (
                        <td
                          key={`${String(col.key)}-${colIndex}`}
                          className={`py-3 px-4 ${col.className || ""}`}
                        >
                          {col.format
                            ? col.format(row[col.key], row)
                            : String(row[col.key] || "-")}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {filteredData.length > maxRows && (
            <div className="mt-4 text-center text-xs text-muted-foreground">
              Showing {displayData.length} of {filteredData.length} entries
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
