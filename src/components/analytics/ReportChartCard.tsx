"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ReactNode } from "react";

interface ReportChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  loading?: boolean;
}

export function ReportChartCard({
  title,
  description,
  children,
  loading = false,
}: ReportChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border border-border/40 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[300px] bg-muted/50 rounded-lg animate-pulse flex items-center justify-center">
              <div className="text-xs text-muted-foreground">Loading chart...</div>
            </div>
          ) : (
            children
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
