"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CloudUpload, Construction } from "lucide-react";

export default function BackupPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="page-icon-tile">
          <CloudUpload />
        </div>
        <div>
          <h1 className="page-title">Sync, Share & Backup</h1>
          <p className="page-description mt-1">
            Securely backup your ERP data to local storage or cloud.
          </p>
        </div>
      </div>
      
      <Card className="border-dashed border-2 bg-muted/30">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
            <Construction className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            The Backup and Restore module is under construction.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground pb-8">
          This module will support manual backups, automated daily sync, database export, and cloud drive integration.
        </CardContent>
      </Card>
    </div>
  );
}
