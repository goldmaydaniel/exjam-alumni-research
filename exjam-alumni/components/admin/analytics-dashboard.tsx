"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, TrendingUp, Users, CreditCard, CheckCircle } from "lucide-react";

interface AnalyticsData {
  totalRegistrations: number;
  checkedInCount: number;
  paidCount: number;
  pendingPayments: number;
  revenueTotal: number;
  dailyRegistrations: Array<{ date: string; count: number }>;
  paymentMethodBreakdown: Array<{ method: string; count: number; amount: number }>;
  additionalMetrics: {
    todayRegistrations: number;
    weeklyRegistrations: number;
    conversionRate: number;
    checkInRate: number;
    averageAmount: number;
  };
  generatedAt: string;
}

export default function AnalyticsDashboard({ eventId }: { eventId?: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = eventId
        ? `/api/analytics/dashboard?eventId=${eventId}`
        : "/api/analytics/dashboard";

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [eventId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <RefreshCw className="h-5 w-5 animate-spin" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 animate-pulse rounded bg-gray-200"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Error loading analytics: {error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
        <div className="flex gap-2">
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalRegistrations}</div>
            <p className="text-xs text-muted-foreground">
              +{data.additionalMetrics.todayRegistrations} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Registrations</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.paidCount}</div>
            <div className="mt-1 flex items-center gap-2">
              <Progress value={data.additionalMetrics.conversionRate} className="flex-1" />
              <span className="text-xs text-muted-foreground">
                {data.additionalMetrics.conversionRate}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked In</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.checkedInCount}</div>
            <div className="mt-1 flex items-center gap-2">
              <Progress value={data.additionalMetrics.checkInRate} className="flex-1" />
              <span className="text-xs text-muted-foreground">
                {data.additionalMetrics.checkInRate}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.revenueTotal)}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(data.additionalMetrics.averageAmount)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Registration Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Paid</span>
                    <Badge variant="default">{data.paidCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pending Payment</span>
                    <Badge variant="secondary">{data.pendingPayments}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Checked In</span>
                    <Badge variant="outline">{data.checkedInCount}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Today</span>
                    <span className="font-medium">
                      +{data.additionalMetrics.todayRegistrations}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>This Week</span>
                    <span className="font-medium">
                      +{data.additionalMetrics.weeklyRegistrations}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Conversion Rate</span>
                    <span className="font-medium">{data.additionalMetrics.conversionRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.paymentMethodBreakdown.map((method) => (
                  <div key={method.method} className="flex items-center justify-between">
                    <div>
                      <span className="font-medium capitalize">{method.method}</span>
                      <p className="text-sm text-muted-foreground">{method.count} transactions</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold">{formatCurrency(method.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Registrations (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.dailyRegistrations.slice(-7).map((day) => (
                  <div key={day.date} className="flex items-center justify-between">
                    <span className="text-sm">{new Date(day.date).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-blue-600"
                          style={{
                            width: `${Math.min(100, (day.count / Math.max(...data.dailyRegistrations.map((d) => d.count))) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="w-8 text-right text-sm font-medium">{day.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-xs text-muted-foreground">
        Last updated: {new Date(data.generatedAt).toLocaleString()}
      </div>
    </div>
  );
}
