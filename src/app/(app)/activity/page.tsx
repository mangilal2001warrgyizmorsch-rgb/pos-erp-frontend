"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { ClipboardList } from "lucide-react";

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Logs"
        description="Track all system activity and user actions"
        icon={ClipboardList}
      />
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-2xl bg-muted/20">
        <ClipboardList className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-lg font-medium">Activity Logs</p>
        <p className="text-sm">Coming up in Batch 7</p>
      </div>
    </div>
  );
}
