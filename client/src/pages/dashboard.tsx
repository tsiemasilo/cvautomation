import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import CVUpload from "@/components/cv-upload";
import JobPreferences from "@/components/job-preferences";
import ApplicationsTable from "@/components/applications-table";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Upload, Settings, RefreshCw, CheckCircle, Clock, Send, AlertCircle } from "lucide-react";
import { Link } from "wouter";

// Mock user - in production this would come from authentication
const mockUser = {
  id: "user-123",
  name: "John Smith",
  email: "john@example.com",
  plan: "professional",
};

export default function Dashboard() {
  // Fetch user statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/users", mockUser.id, "stats"],
  });

  // Fetch user applications
  const { data: applicationsData, isLoading: applicationsLoading } = useQuery({
    queryKey: ["/api/users", mockUser.id, "applications"],
  });

  // Auto-apply mutation
  const autoApplyMutation = useMutation({
    mutationFn: async (maxApplications: number) => {
      const response = await apiRequest("POST", "/api/jobs/auto-apply", {
        userId: mockUser.id,
        maxApplications,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Auto-apply completed",
        description: `Successfully applied to ${data.applications} jobs`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error) => {
      toast({
        title: "Auto-apply failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAutoApply = () => {
    const maxApplications = mockUser.plan === "free" ? 5 : 
                           mockUser.plan === "starter" ? 50 :
                           mockUser.plan === "professional" ? 100 : 500;
    autoApplyMutation.mutate(maxApplications);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" data-testid="link-home">
                <Button variant="ghost" size="sm" data-testid="button-back">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <i className="fas fa-rocket text-white text-sm"></i>
                </div>
                <span className="text-xl font-bold text-slate-900">JobFlow</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" data-testid="badge-plan">
                {mockUser.plan.charAt(0).toUpperCase() + mockUser.plan.slice(1)} Plan
              </Badge>
              <Button variant="outline" size="sm" data-testid="button-settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2" data-testid="text-welcome">
              Welcome back, {mockUser.name}
            </h1>
            <p className="text-slate-600">Here's your job search activity overview</p>
          </div>
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            <Button 
              onClick={handleAutoApply}
              disabled={autoApplyMutation.isPending}
              data-testid="button-auto-apply"
            >
              {autoApplyMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {autoApplyMutation.isPending ? "Applying..." : "Auto Apply"}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-applications">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Send className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="outline" className="text-green-600">
                  +12%
                </Badge>
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1" data-testid="text-total-applications">
                {statsLoading ? "..." : (stats as any)?.stats?.total || 0}
              </div>
              <div className="text-slate-600 text-sm">Applications Sent</div>
            </CardContent>
          </Card>

          <Card data-testid="card-pending">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-500" />
                </div>
                <Badge variant="outline" className="text-orange-500">
                  Processing
                </Badge>
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1" data-testid="text-pending-applications">
                {statsLoading ? "..." : (stats as any)?.stats?.pending || 0}
              </div>
              <div className="text-slate-600 text-sm">Pending Responses</div>
            </CardContent>
          </Card>

          <Card data-testid="card-responses">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <Badge variant="outline" className="text-green-600">
                  +5%
                </Badge>
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1" data-testid="text-responses">
                {statsLoading ? "..." : (stats as any)?.stats?.responded || 0}
              </div>
              <div className="text-slate-600 text-sm">Positive Responses</div>
            </CardContent>
          </Card>

          <Card data-testid="card-rate">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-percentage text-blue-600"></i>
                </div>
                <Badge variant="outline" className="text-green-600">
                  Above avg
                </Badge>
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1" data-testid="text-response-rate">
                {statsLoading ? "..." : 
                  (stats as any)?.stats?.total > 0 ? 
                    `${(((stats as any).stats.responded / (stats as any).stats.total) * 100).toFixed(1)}%` : 
                    "0%"
                }
              </div>
              <div className="text-slate-600 text-sm">Response Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* CV Upload and Job Preferences */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <CVUpload userId={mockUser.id} />
          <JobPreferences userId={mockUser.id} />
        </div>

        {/* Applications Table */}
        <ApplicationsTable 
          userId={mockUser.id}
          applications={(applicationsData as any)?.applications || []}
          isLoading={applicationsLoading}
        />
      </div>
    </div>
  );
}
