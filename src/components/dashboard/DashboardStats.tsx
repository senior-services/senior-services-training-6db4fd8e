/**
 * Dashboard Statistics Component
 * Displays key metrics and statistics for admin dashboard
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Video, BookOpen, TrendingUp } from "lucide-react";

interface DashboardStatsProps {
  /** Total number of videos in the system */
  totalVideos: number;
  /** Total number of employees */
  totalEmployees: number;
  /** Overall completion rate percentage */
  overallCompletionRate: number;
  /** Number of videos currently assigned */
  assignedVideos: number;
}

/**
 * DashboardStats displays key performance indicators and metrics
 * for the training portal in an accessible, visually appealing format
 */
export const DashboardStats = ({
  totalVideos,
  totalEmployees,
  overallCompletionRate,
  assignedVideos
}: DashboardStatsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-border/50 hover:border-border transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Videos
          </CardTitle>
          <Video 
            className="h-4 w-4 text-muted-foreground" 
            aria-hidden="true"
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{totalVideos}</div>
          <p className="text-xs text-muted-foreground">
            Training materials available
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/50 hover:border-border transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Employees
          </CardTitle>
          <Users 
            className="h-4 w-4 text-muted-foreground" 
            aria-hidden="true"
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{totalEmployees}</div>
          <p className="text-xs text-muted-foreground">
            Active team members
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/50 hover:border-border transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Completion Rate
          </CardTitle>
          <TrendingUp 
            className="h-4 w-4 text-muted-foreground" 
            aria-hidden="true"
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{overallCompletionRate}%</div>
          <Progress 
            value={overallCompletionRate} 
            className="mt-2"
            aria-label={`Overall completion rate: ${overallCompletionRate}%`}
          />
        </CardContent>
      </Card>

      <Card className="border-border/50 hover:border-border transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Active Assignments
          </CardTitle>
          <BookOpen 
            className="h-4 w-4 text-muted-foreground" 
            aria-hidden="true"
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{assignedVideos}</div>
          <p className="text-xs text-muted-foreground">
            Videos currently assigned
          </p>
        </CardContent>
      </Card>
    </div>
  );
};