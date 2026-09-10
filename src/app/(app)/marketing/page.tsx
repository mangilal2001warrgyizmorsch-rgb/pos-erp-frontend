"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Megaphone, Users, CheckCircle2, XCircle, Clock, MoreVertical, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { marketingService, type Campaign } from "@/services/marketingService";
import { format } from "date-fns";
import { toast } from "sonner";

export default function MarketingDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await marketingService.getCampaigns();
      setCampaigns(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) return;
    try {
      const res = await marketingService.deleteCampaign(id);
      if (res.success) {
        toast.success("Campaign deleted");
        setCampaigns(campaigns.filter(c => c._id !== id));
      } else {
        toast.error("Failed to delete campaign");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case 'processing': return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Processing...</Badge>;
      case 'draft': return <Badge variant="outline">Draft</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing & Promotions</h1>
          <p className="text-muted-foreground">Manage your bulk WhatsApp campaigns and engage with customers.</p>
        </div>
        <Link href="/marketing/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <p>Loading campaigns...</p>
        ) : campaigns.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <Megaphone className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">No campaigns yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Start reaching out to your customers with special offers.</p>
            <Link href="/marketing/create"><Button variant="outline">Create your first campaign</Button></Link>
          </Card>
        ) : (
          campaigns.map((c) => (
            <Card key={c._id}>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    {c.name}
                    {getStatusBadge(c.status)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Created on {format(new Date(c.createdAt), "dd MMM yyyy, hh:mm a")}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/marketing/${c._id}`} className="flex items-center cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" />
                        <span>View Details</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(c._id)}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 p-4 rounded-md text-sm mb-4">
                  {c.messageTemplate}
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{c.totalRecipients}</span> Recipients
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-green-600">{c.successfulDeliveries || 0}</span> Delivered
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="font-medium text-red-600">{c.failedDeliveries || 0}</span> Failed
                  </div>
                  {(c.status === 'processing' || c.status === 'draft') && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-blue-600">
                        {c.totalRecipients - ((c.successfulDeliveries || 0) + (c.failedDeliveries || 0))}
                      </span> Pending
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
