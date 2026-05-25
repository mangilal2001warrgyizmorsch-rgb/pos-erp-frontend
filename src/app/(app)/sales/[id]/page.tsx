"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function SaleEditPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  useEffect(() => {
    // Redirect to POS page with sale ID as query parameter
    router.push(`/pos?editSale=${id}`);
  }, [id, router]);

  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading sale details...</p>
      </div>
    </div>
  );
}
