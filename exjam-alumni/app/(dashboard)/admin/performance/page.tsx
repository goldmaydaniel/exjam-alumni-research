"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Zap, Clock, TrendingUp } from "lucide-react";

export default function PerformancePage() {
  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Performance Dashboard</h1>
        <p className="text-muted-foreground">Monitor and optimize your application performance</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Load Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2s</div>
            <p className="text-xs text-muted-foreground">+0.1s from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Core Web Vitals</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98%</div>
            <p className="text-xs text-muted-foreground">Excellent performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bundle Size</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245KB</div>
            <p className="text-xs text-muted-foreground">Optimized for production</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Performance Status</CardTitle>
            <CardDescription>
              Your application is running with excellent performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-green-50 p-4">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="font-medium">All systems operational</span>
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Performance monitoring is currently in maintenance mode.</p>
                <p>Advanced metrics and real-time monitoring will be available soon.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
