import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn } from "lucide-react";


interface LandingProps {
  onGoogleLogin: () => void;
}

export const Landing = ({
  onGoogleLogin
}: LandingProps) => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <img src="/lovable-uploads/SS_2019_logo_Reversed.png" alt="Senior Services for South Sound" className="mx-auto h-32 w-auto mb-6" />
          <h1 className="font-bold text-white mb-4">Senior Services Training Portal</h1>
          <p className="text-h4 text-white/90 max-w-2xl mx-auto">
            Streamlined onboarding and continuous training for nonprofit employees
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-md mx-auto mb-12">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>
                Sign in with your Google account to access your training portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button onClick={() => window.location.href = '/auth'} size="lg" className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm">
                <LogIn className="w-5 h-5 mr-3" />
                Sign In / Sign Up
              </Button>
              
              <div className="text-center">
                <p className="text-small text-muted-foreground">
                  New employees will be automatically registered upon first login
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Bottom Section */}
        <div className="text-center text-white/80">
          <p className="text-small">
            For technical support, please contact your administrator or IT department
          </p>
        </div>
      </div>
    </div>
  );
};