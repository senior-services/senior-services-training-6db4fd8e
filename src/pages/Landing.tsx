import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, BookOpen, Users, Shield } from "lucide-react";
import logoImage from "@/assets/senior-services-logo.png";

interface LandingProps {
  onGoogleLogin: () => void;
}

export const Landing = ({ onGoogleLogin }: LandingProps) => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <img 
            src={logoImage} 
            alt="Senior Services for South Sound" 
            className="mx-auto h-16 w-auto mb-6"
          />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Training Portal
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Streamlined onboarding and continuous training for nonprofit employees
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
            {/* Left Column - Features */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Centralized Learning
                  </h3>
                  <p className="text-white/80">
                    Access all training videos in one intuitive platform with personalized progress tracking
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Role-Based Access
                  </h3>
                  <p className="text-white/80">
                    Employees see their assigned training while administrators manage content and track progress
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Secure & Simple
                  </h3>
                  <p className="text-white/80">
                    Google authentication ensures secure access without the need for additional passwords
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Login Card */}
            <Card className="shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Welcome Back</CardTitle>
                <CardDescription>
                  Sign in with your Google account to access your training portal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Button 
                  onClick={onGoogleLogin}
                  size="lg"
                  className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm"
                >
                  <LogIn className="w-5 h-5 mr-3" />
                  Sign in with Google
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    New employees will be automatically registered upon first login
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Section */}
          <div className="text-center text-white/80">
            <p className="text-sm">
              For technical support, please contact your administrator or IT department
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};