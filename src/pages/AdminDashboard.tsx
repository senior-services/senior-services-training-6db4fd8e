import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoManagement } from "@/components/dashboard/VideoManagement";
import { EmployeeManagement } from "@/components/dashboard/EmployeeManagement";
import { AdminManagement } from "@/components/dashboard/AdminManagement";
import { logger } from "@/utils/logger";

/**
 * Props interface for the AdminDashboard component
 */
interface AdminDashboardProps {
  /** The admin user's display name */
  userName: string;
  /** The admin user's email address */
  userEmail: string;
  /** Callback function to handle user logout */
  onLogout: () => void;
}

/**
 * AdminDashboard Component - Main administrative interface
 * 
 * Refactored for better separation of concerns and maintainability.
 * Each major feature area is handled by dedicated components.
 */
export const AdminDashboard = ({ userName, userEmail, onLogout }: AdminDashboardProps) => {
  // Log admin dashboard access
  useEffect(() => {
    logger.info('Admin dashboard accessed', { adminUser: userEmail });
  }, [userEmail]);

  return (
    <div className="min-h-screen bg-background">
      <Header
        userName={userName}
        userEmail={userEmail}
        userRole="admin"
        onLogout={onLogout}
      />
      
      <main className="container mx-auto px-4 pb-8">
        <div className="space-y-8">
          {/* Dashboard Tabs */}
          <Tabs defaultValue="videos" className="space-y-6">
            <TabsList className="flex w-full justify-start">
              <TabsTrigger value="videos">Videos</TabsTrigger>
              <TabsTrigger value="employees">Employees</TabsTrigger>
              <TabsTrigger value="admins">Admins</TabsTrigger>
            </TabsList>

            {/* Video Management */}
            <TabsContent value="videos" className="space-y-6">
              <VideoManagement
                userEmail={userEmail}
              />
            </TabsContent>

            {/* Employee Management */}
            <TabsContent value="employees" className="space-y-6">
              <EmployeeManagement />
            </TabsContent>

            {/* Admin Management */}
            <TabsContent value="admins" className="space-y-6">
              <AdminManagement />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};