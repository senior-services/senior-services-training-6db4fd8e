import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Video, BookOpen, Settings, Plus, Eye, Edit, Trash2 } from "lucide-react";

interface AdminDashboardProps {
  userName: string;
  userEmail: string;
  onLogout: () => void;
}

export const AdminDashboard = ({ userName, userEmail, onLogout }: AdminDashboardProps) => {
  // Mock data - will be replaced with real data from Supabase
  const employees = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@southsoundseniors.org',
      requiredProgress: 85,
      completedVideos: 3,
      totalVideos: 4,
      status: 'on-track'
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'michael.chen@southsoundseniors.org',
      requiredProgress: 60,
      completedVideos: 2,
      totalVideos: 4,
      status: 'behind'
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@southsoundseniors.org',
      requiredProgress: 100,
      completedVideos: 4,
      totalVideos: 4,
      status: 'completed'
    }
  ];

  const videos = [
    {
      id: '1',
      title: 'Workplace Safety and Emergency Procedures',
      type: 'Required',
      assignedTo: 15,
      completionRate: 73,
      hasQuiz: true
    },
    {
      id: '2',
      title: 'Senior Care Best Practices',
      type: 'Required',
      assignedTo: 15,
      completionRate: 87,
      hasQuiz: true
    },
    {
      id: '3',
      title: 'HIPAA Privacy and Confidentiality',
      type: 'Required',
      assignedTo: 15,
      completionRate: 45,
      hasQuiz: true
    },
    {
      id: '4',
      title: 'Effective Communication with Families',
      type: 'Optional',
      assignedTo: 0,
      completionRate: 32,
      hasQuiz: false
    }
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <Header 
        userRole="admin"
        userName={userName}
        userEmail={userEmail}
        onLogout={onLogout}
      />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Administrator Dashboard
          </h2>
          <p className="text-muted-foreground">
            Manage training content, track employee progress, and oversee the learning portal.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">15</div>
              <p className="text-xs text-muted-foreground">active users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Training Videos</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">12</div>
              <p className="text-xs text-muted-foreground">total videos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">78%</div>
              <p className="text-xs text-muted-foreground">average completion</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">3</div>
              <p className="text-xs text-muted-foreground">need attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="employees" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Employee Progress Overview</CardTitle>
                <CardDescription>
                  Track training completion and identify employees who need support
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {employees.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-foreground">{employee.name}</h4>
                            <p className="text-sm text-muted-foreground">{employee.email}</p>
                          </div>
                          <Badge 
                            variant={
                              employee.status === 'completed' ? 'default' :
                              employee.status === 'on-track' ? 'secondary' : 'destructive'
                            }
                          >
                            {employee.status === 'completed' ? 'Completed' :
                             employee.status === 'on-track' ? 'On Track' : 'Behind Schedule'}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{employee.requiredProgress}%</span>
                            </div>
                            <Progress value={employee.requiredProgress} className="h-2" />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {employee.completedVideos}/{employee.totalVideos} videos
                          </div>
                        </div>
                      </div>
                      <div className="ml-6 flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videos" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold">Training Videos</h3>
                <p className="text-muted-foreground">Manage your training content library</p>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Video
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="space-y-4 p-6">
                  {videos.map((video) => (
                    <div key={video.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-foreground">{video.title}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant={video.type === 'Required' ? 'default' : 'outline'}>
                              {video.type}
                            </Badge>
                            {video.hasQuiz && (
                              <Badge variant="secondary">Quiz</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                          <span>Assigned: {video.assignedTo} employees</span>
                          <span>Completion: {video.completionRate}%</span>
                        </div>
                      </div>
                      <div className="ml-6 flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure portal settings and manage user permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-12">
                  <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="font-medium text-foreground mb-2">Settings Panel</h4>
                  <p className="text-muted-foreground mb-4">
                    Advanced settings and user management features will be available here
                  </p>
                  <Button variant="outline">Coming Soon</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};