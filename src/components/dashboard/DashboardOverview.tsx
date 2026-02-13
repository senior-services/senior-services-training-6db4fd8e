/**
 * Dashboard Overview Component - Shows high-level statistics and metrics
 * Extracted from AdminDashboard for better separation of concerns
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Video, BookOpen, Settings } from 'lucide-react';

interface DashboardOverviewProps {
  videoCount: number;
  employeeCount: number;
  userEmail: string;
}

// Mock data for overview cards - will be replaced with real data
const mockOverviewData = {
  totalCompletions: 152,
  averageProgress: 78,
  activeEmployees: 45,
  monthlyGrowth: 12
};

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  videoCount,
  employeeCount,
  userEmail
}) => {
  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-body-sm font-medium">
              Training Videos
            </CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-h2 font-bold">{videoCount}</div>
            <p className="text-body-sm text-muted-foreground">
              Active training content
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-body-sm font-medium">
              Employees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-h2 font-bold">{employeeCount}</div>
            <p className="text-body-sm text-muted-foreground">
              Registered employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-body-sm font-medium">
              Completions
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-h2 font-bold">{mockOverviewData.totalCompletions}</div>
            <p className="text-body-sm text-muted-foreground">
              Total video completions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-body-sm font-medium">
              Avg Progress
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-h2 font-bold">{mockOverviewData.averageProgress}%</div>
            <p className="text-body-sm text-muted-foreground">
              Employee completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Training Progress Overview</CardTitle>
          <CardDescription>
            Overall training completion status across all employees
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-small font-medium">Overall Progress</span>
              <span className="text-small text-muted-foreground">
                {mockOverviewData.averageProgress}%
              </span>
            </div>
            <Progress value={mockOverviewData.averageProgress} className="w-full" />
          </div>
          
          <div className="flex gap-4 pt-4">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="w-3 h-3 p-0 rounded-full" />
              <span className="text-small">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="w-3 h-3 p-0 rounded-full" />
              <span className="text-small">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="hollow-primary" className="w-3 h-3 p-0 rounded-full" />
              <span className="text-small">Not Started</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};