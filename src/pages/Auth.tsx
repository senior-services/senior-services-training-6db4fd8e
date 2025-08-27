import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogIn, Mail, Shield, User } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
export const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {
    signIn,
    signUp,
    signInWithGoogle
  } = useAuth();
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signIn(email, password);
    setIsLoading(false);
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signUp(email, password, fullName);
    setIsLoading(false);
  };
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signInWithGoogle();
    setIsLoading(false);
  };

  // Test login functions
  const handleTestAdminLogin = async () => {
    setEmail('admin@gmail.com');
    setPassword('admin123');
    setIsLoading(true);
    await signIn('admin@gmail.com', 'admin123');
    setIsLoading(false);
  };
  const handleTestEmployeeLogin = async () => {
    setEmail('jane.doe@southsoundseniors.org');
    setPassword('test123');
    setIsLoading(true);

    // Try to sign in, if fails, create the account first
    const result = await signIn('jane.doe@southsoundseniors.org', 'test123');
    if (!result || result.error) {
      // Account doesn't exist, create it
      await signUp('jane.doe@southsoundseniors.org', 'test123', 'Jane Doe');
      // Then sign in
      await signIn('jane.doe@southsoundseniors.org', 'test123');
    }
    setIsLoading(false);
  };
  const handleTestEmployee2Login = async () => {
    setEmail('john.doe@southsoundseniors.org');
    setPassword('test123');
    setIsLoading(true);

    // Try to sign in, if fails, create the account first
    const result = await signIn('john.doe@southsoundseniors.org', 'test123');
    if (!result || result.error) {
      // Account doesn't exist, create it
      await signUp('john.doe@southsoundseniors.org', 'test123', 'John Doe');
      // Then sign in
      await signIn('john.doe@southsoundseniors.org', 'test123');
    }
    setIsLoading(false);
  };
  return <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <img src="/lovable-uploads/f28cf692-0409-41a6-bb28-b62ca7589dcb.png" alt="Senior Services for South Sound" className="mx-auto h-16 w-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Training Portal</h1>
          
        </div>

        <Card>
          <CardHeader className="space-y-1">
            {/* Development Testing Section */}
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-center mb-3">
                <h3 className="font-semibold text-yellow-800 text-sm">Development Testing</h3>
                <p className="text-xs text-yellow-700">Quick login for testing purposes</p>
              </div>
              <div className="space-y-2">
                <Button onClick={handleTestAdminLogin} disabled={isLoading} variant="outline" size="sm" className="w-full border-red-200 text-red-700 hover:bg-red-50">
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Test
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={handleTestEmployeeLogin} disabled={isLoading} variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                    <User className="w-4 h-4 mr-1" />
                    Employee 1
                  </Button>
                  <Button onClick={handleTestEmployee2Login} disabled={isLoading} variant="outline" size="sm" className="border-green-200 text-green-700 hover:bg-green-50">
                    <User className="w-4 h-4 mr-1" />
                    Employee 2
                  </Button>
                </div>
              </div>
              <div className="mt-2 text-xs text-yellow-600 text-center">
                Admin: admin@gmail.com | Employee 1: jane.doe@southsoundseniors.org | Employee 2: john.doe@southsoundseniors.org
              </div>
            </div>

            <div className="flex justify-center mb-4">
              <Button onClick={handleGoogleSignIn} disabled={isLoading} size="lg" className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50">
                <LogIn className="w-5 h-5 mr-3" />
                Sign in with Google
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input id="signin-email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input id="signin-password" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    <Mail className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input id="signup-name" type="text" placeholder="Enter your full name" value={fullName} onChange={e => setFullName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" placeholder="Create a password" value={password} onChange={e => setPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    <Mail className="w-4 h-4 mr-2" />
                    Sign Up
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="mt-4 text-center text-sm text-muted-foreground">
              New employees will be automatically registered with employee access upon first login
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};