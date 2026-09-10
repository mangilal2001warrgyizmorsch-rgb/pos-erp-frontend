"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { marketingService, type Campaign, type CampaignLog } from "@/services/marketingService";
import { format } from "date-fns";

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [logs, setLogs] = useState<CampaignLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCampaignDetails();
    }
  }, [id]);

  const fetchCampaignDetails = async () => {
    try {
      const resCampaigns = await marketingService.getCampaigns();
      const currentCampaign = resCampaigns.data.find(c => c._id === id);
      if (currentCampaign) setCampaign(currentCampaign);

      const resLogs = await marketingService.getCampaignLogs(id);
      setLogs(resLogs.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
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

  const getLogStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered': return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Delivered</Badge>;
      case 'sent': return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Sent</Badge>;
      case 'pending': return <Badge variant="outline">Pending</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      case 'read': return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Read</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading campaign details...</div>;
  }

  if (!campaign) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold">Campaign not found</h2>
        <Button onClick={() => router.back()} variant="outline">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {campaign.name}
            {getStatusBadge(campaign.status)}
          </h1>
          <p className="text-sm text-muted-foreground">
            Created on {format(new Date(campaign.createdAt), "dd MMM yyyy, hh:mm a")}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Message Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-semibold mb-2">Message Template</p>
              <div className="bg-muted/50 p-4 rounded-md text-sm whitespace-pre-wrap">
                {campaign.messageTemplate}
              </div>
            </div>
            {campaign.mediaUrl && (
              <div>
                <p className="text-sm font-semibold mb-2">Media URL</p>
                <a href={campaign.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
                  {campaign.mediaUrl}
                </a>
              </div>
            )}
            <div>
              <p className="text-sm font-semibold mb-2">Target Audience</p>
              <div className="text-sm capitalize text-muted-foreground">
                {campaign.targetAudience.replace("_", " ")}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Total Recipients</span>
              </div>
              <span className="font-bold">{campaign.totalRecipients}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Delivered</span>
              </div>
              <span className="font-bold text-green-600">{campaign.successfulDeliveries || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4 text-red-500" />
                <span>Failed</span>
              </div>
              <span className="font-bold text-red-600">{campaign.failedDeliveries || 0}</span>
            </div>
            {(campaign.status === 'processing' || campaign.status === 'draft') && (
              <div className="flex items-center justify-between border-t pt-4 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>Pending</span>
                </div>
                <span className="font-bold text-blue-600">
                  {campaign.totalRecipients - ((campaign.successfulDeliveries || 0) + (campaign.failedDeliveries || 0))}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No logs available for this campaign.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left font-semibold p-3">Customer</th>
                    <th className="text-left font-semibold p-3">Phone</th>
                    <th className="text-left font-semibold p-3">Status</th>
                    <th className="text-left font-semibold p-3">Time</th>
                    <th className="text-left font-semibold p-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id} className="border-b last:border-0">
                      <td className="p-3">{log.customerId?.name || 'Unknown'}</td>
                      <td className="p-3">{log.phone}</td>
                      <td className="p-3">{getLogStatusBadge(log.status)}</td>
                      <td className="p-3 whitespace-nowrap text-muted-foreground text-xs">
                        {format(new Date(log.createdAt), "dd MMM yyyy, hh:mm a")}
                      </td>
                      <td className="p-3 text-destructive text-xs">
                        {log.errorMessage || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
