import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoManagement } from "@/components/dashboard/VideoManagement";
import { PeopleManagement } from "@/components/dashboard/PeopleManagement";
import { logger } from "@/utils/logger";

interface AdminDashboardProps {
  userName: string;
  userEmail: string;
  onLogout: () => void;
}

export const AdminDashboard = ({
  userName,
  userEmail,
  onLogout
}: AdminDashboardProps) => {
  useEffect(() => {
    logger.info('Admin dashboard accessed', {
      adminUser: userEmail
    });
  }, [userEmail]);

  return (
    <div className="min-h-screen bg-background">
      <Header userName={userName} userEmail={userEmail} userRole="admin" onLogout={onLogout} currentView="admin" />
      
      <main className="container mx-auto px-4 pb-8">
        <div className="space-y-8">
          <Tabs defaultValue="videos" className="space-y-6">
            <TabsList className="flex w-full justify-start">
              <TabsTrigger value="videos">Trainings</TabsTrigger>
              <TabsTrigger value="people">People</TabsTrigger>
            </TabsList>

            <TabsContent value="videos" className="space-y-6">
              <VideoManagement userEmail={userEmail} />
            </TabsContent>

            <TabsContent value="people" className="space-y-6">
              <PeopleManagement />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};
