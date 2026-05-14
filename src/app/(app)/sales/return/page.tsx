"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function SaleReturnPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sale Returns</h1>
        <p className="text-muted-foreground mt-2">
          Manage customer returns and generate credit notes.
        </p>
      </div>
      
      <Card className="border-dashed border-2 bg-muted/30">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
            <Construction className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            The Sale Return and Credit Note module is under construction.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground pb-8">
          This module will support scanning returned items, restoring inventory, and calculating wallet credit/refunds.
        </CardContent>
      </Card>
    </div>
  );
}
