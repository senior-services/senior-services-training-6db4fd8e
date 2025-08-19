import { Header } from "@/components/Header";
import { TrainingCard, TrainingVideo } from "@/components/TrainingCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Clock, CheckCircle2 } from "lucide-react";

interface EmployeeDashboardProps {
  userName: string;
  userEmail: string;
  onLogout: () => void;
  onPlayVideo: (videoId: string) => void;
}

export const EmployeeDashboard = ({ userName, userEmail, onLogout, onPlayVideo }: EmployeeDashboardProps) => {
  // Mock data - will be replaced with real data from Supabase
  const requiredVideos: TrainingVideo[] = [
    {
      id: '1',
      title: 'Workplace Safety and Emergency Procedures',
      description: 'Essential safety protocols and emergency response procedures for all employees',
      thumbnail: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&h=300&fit=crop',
      duration: '15 min',
      progress: 65,
      isRequired: true,
      deadline: 'Dec 25',
      status: 'warning',
      hasQuiz: true
    },
    {
      id: '2',
      title: 'Senior Care Best Practices',
      description: 'Comprehensive guide to providing excellent care and service to senior clients',
      thumbnail: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
      duration: '22 min',
      progress: 100,
      isRequired: true,
      deadline: 'Dec 20',
      status: 'completed',
      hasQuiz: true
    },
    {
      id: '3',
      title: 'HIPAA Privacy and Confidentiality',
      description: 'Understanding privacy laws and maintaining confidentiality in healthcare settings',
      thumbnail: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop',
      duration: '18 min',
      progress: 0,
      isRequired: true,
      deadline: 'Jan 5',
      status: 'upcoming',
      hasQuiz: true
    }
  ];

  const optionalVideos: TrainingVideo[] = [
    {
      id: '4',
      title: 'Effective Communication with Families',
      description: 'Building strong relationships with clients and their families',
      thumbnail: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&h=300&fit=crop',
      duration: '12 min',
      progress: 30,
      hasQuiz: false
    },
    {
      id: '5',
      title: 'Technology Tools for Senior Services',
      description: 'Overview of digital tools and platforms used in senior care',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
      duration: '20 min',
      progress: 0,
      hasQuiz: false
    }
  ];

  const overallProgress = Math.round(
    (requiredVideos.reduce((sum, video) => sum + video.progress, 0) / requiredVideos.length)
  );

  const completedRequired = requiredVideos.filter(v => v.progress === 100).length;
  const totalRequired = requiredVideos.length;

  return (
    <div className="min-h-screen bg-muted/30">
      <Header 
        userRole="employee"
        userName={userName}
        userEmail={userEmail}
        overallProgress={overallProgress}
        onLogout={onLogout}
      />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {userName.split(' ')[0]}!
          </h2>
          <p className="text-muted-foreground">
            Continue your training journey and stay up to date with the latest best practices.
          </p>
        </div>


        {/* Training Content */}
        <Tabs defaultValue="required" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="required" className="flex items-center space-x-2">
              <span>Required Training</span>
              <Badge variant="secondary" className="ml-2">
                {totalRequired}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="optional" className="flex items-center space-x-2">
              <span>Optional Videos</span>
              <Badge variant="outline" className="ml-2">
                {optionalVideos.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="required" className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Required Training</h3>
              <p className="text-muted-foreground mb-6">
                Complete these essential training modules to meet your onboarding requirements.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {requiredVideos.map((video) => (
                  <TrainingCard
                    key={video.id}
                    video={video}
                    onPlay={onPlayVideo}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="optional" className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Optional Training Videos</h3>
              <p className="text-muted-foreground mb-6">
                Enhance your skills with these additional training resources.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {optionalVideos.map((video) => (
                  <TrainingCard
                    key={video.id}
                    video={video}
                    onPlay={onPlayVideo}
                  />
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};