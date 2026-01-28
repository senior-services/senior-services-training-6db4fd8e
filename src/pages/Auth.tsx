import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Banner } from "@/components/ui/banner";
import { LogIn, Mail, User, Info } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { APP_CONFIG } from '@/constants';
export const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const {
    signIn,
    signUp,
    signInWithGoogle
  } = useAuth();

  // Client-side email domain validation (UX only, not security)
  const validateEmailDomain = (email: string) => {
    if (!email) {
      setEmailError('');
      return true;
    }
    
    if (!email.includes('@')) {
      setEmailError('');
      return true; // Let browser handle basic email validation
    }
    
    const domain = email.split('@')[1];
    if (domain && !domain.toLowerCase().includes('southsoundseniors.org')) {
      setEmailError('Only @southsoundseniors.org email addresses are allowed');
      return false;
    }
    
    setEmailError('');
    return true;
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    validateEmailDomain(value);
  };
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

  // Test login functions - removed admin@gmail.com test as it bypasses company email requirement
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

  const handleTestAdminLogin = async () => {
    setEmail('admin@southsoundseniors.org');
    setPassword('admin123');
    setIsLoading(true);

    // Try to sign in, if fails, create the account first
    const result = await signIn('admin@southsoundseniors.org', 'admin123');
    if (!result || result.error) {
      // Account doesn't exist, create it
      await signUp('admin@southsoundseniors.org', 'admin123', 'Test Admin');
      // Then sign in
      await signIn('admin@southsoundseniors.org', 'admin123');
    }
    setIsLoading(false);
  };
  return <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <img src="/lovable-uploads/SS_2019_logo_Reversed.png" alt="Senior Services for South Sound" className="mx-auto h-32 w-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Training Portal</h1>
          
        </div>

        {/* Company Email Notice */}
        <div className="mb-4" role="region" aria-label="Company email requirement">
          <Banner 
            variant="info"
            title="Company Email Required"
            description={`Only @southsoundseniors.org employees can access this portal. Need access? Contact ${APP_CONFIG.supportEmail}`}
            icon={Info}
            showIcon={true}
            className="text-left"
          />
        </div>

        <Card>
          <CardHeader className="space-y-1">
            {/* ARIA live region for error announcements */}
            <div 
              aria-live="polite" 
              aria-atomic="true" 
              className="sr-only"
              id="auth-errors"
            >
              {emailError && `Email validation error: ${emailError}`}
            </div>
            {/* Development Testing Section */}
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-center mb-3">
                <h3 className="font-semibold text-yellow-800 text-sm">Development Testing</h3>
                <p className="text-xs text-yellow-700">Quick login for testing (@southsoundseniors.org only)</p>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <Button onClick={handleTestEmployeeLogin} disabled={isLoading} variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                    <User className="w-4 h-4 mr-1" />
                    Jane
                  </Button>
                  <Button onClick={handleTestEmployee2Login} disabled={isLoading} variant="outline" size="sm" className="border-green-200 text-green-700 hover:bg-green-50">
                    <User className="w-4 h-4 mr-1" />
                    Employee 2
                  </Button>
                  <Button onClick={handleTestAdminLogin} disabled={isLoading} variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50">
                    <User className="w-4 h-4 mr-1" />
                    Test Admin
                  </Button>
                </div>
              </div>
              <div className="mt-2 text-xs text-yellow-600 text-center">
                Employee 1: jane.doe | Employee 2: john.doe | Admin: admin@southsoundseniors.org
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
                    <Label htmlFor="signin-email">
                      Email
                      <span className="text-xs text-muted-foreground ml-2">(@southsoundseniors.org required)</span>
                    </Label>
                    <Input 
                      id="signin-email" 
                      type="email" 
                      placeholder="Enter your @southsoundseniors.org email" 
                      value={email} 
                      onChange={e => handleEmailChange(e.target.value)} 
                      required 
                      aria-describedby={emailError ? "email-error" : "email-hint"}
                      aria-invalid={emailError ? "true" : "false"}
                    />
                    {emailError && (
                      <div 
                        id="email-error" 
                        className="text-sm text-destructive" 
                        role="alert"
                        aria-live="polite"
                      >
                        {emailError}
                      </div>
                    )}
                    {!emailError && (
                      <div 
                        id="email-hint" 
                        className="text-xs text-muted-foreground"
                      >
                        Use your company email address to access the training portal
                      </div>
                    )}
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
                    <Label htmlFor="signup-email">
                      Email
                      <span className="text-xs text-muted-foreground ml-2">(@southsoundseniors.org required)</span>
                    </Label>
                    <Input 
                      id="signup-email" 
                      type="email" 
                      placeholder="Enter your @southsoundseniors.org email" 
                      value={email} 
                      onChange={e => handleEmailChange(e.target.value)} 
                      required 
                      aria-describedby={emailError ? "signup-email-error" : "signup-email-hint"}
                      aria-invalid={emailError ? "true" : "false"}
                    />
                    {emailError && (
                      <div 
                        id="signup-email-error" 
                        className="text-sm text-destructive" 
                        role="alert"
                        aria-live="polite"
                      >
                        {emailError}
                      </div>
                    )}
                    {!emailError && (
                      <div 
                        id="signup-email-hint" 
                        className="text-xs text-muted-foreground"
                      >
                        Use your company email address to create your training account
                      </div>
                    )}
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