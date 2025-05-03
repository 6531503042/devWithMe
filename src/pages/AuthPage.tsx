import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, Clock, ListChecks, BarChart, Mail, Lock, ArrowRight } from 'lucide-react';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/tasks');
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Please provide both email and password.",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Provide more user-friendly error messages
        let errorMessage = error.message;
        if (error.message?.includes('Invalid login credentials')) {
          errorMessage = "Invalid email or password. Please try again.";
        }
        
        toast({
          variant: "destructive",
          title: "Login failed",
          description: errorMessage,
        });
        return;
      }
      
      if (data?.session) {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        navigate('/tasks');
      } else {
        // This should rarely happen
        toast({
          variant: "destructive",
          title: "Login issue",
          description: "Successfully authenticated but no session was created. Please try again.",
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error?.message || "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: "Please provide both email and password.",
      });
      return;
    }
    
    // Password validation
    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: "Password must be at least 6 characters long.",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // First, try the standard signup approach
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        // Check if it's an "Email already registered" error
        if (error.message?.includes('already registered')) {
          // If the user already exists, try to sign them in directly
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (signInError) {
            toast({
              variant: "destructive",
              title: "Login failed",
              description: signInError.message || "This email is already registered. Please log in instead.",
            });
            setTab('login');
            return;
          }
          
          // Successfully signed in
          if (signInData?.session) {
            toast({
              title: "Login successful",
              description: "Welcome back!",
            });
            navigate('/tasks');
            return;
          }
        }
        
        // Other errors
        toast({
          variant: "destructive",
          title: "Signup failed",
          description: error.message,
        });
        return;
      }
      
      // Successful signup
      if (data.session) {
        toast({
          title: "Signup successful",
          description: "You're now logged in!",
        });
        navigate('/tasks');
      } 
      // If signup worked but no session was created, try to sign in manually
      else if (data.user) {
        // Attempt to sign in with the credentials
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) {
          toast({
            variant: "destructive",
            title: "Account created",
            description: "Your account was created but we couldn't log you in automatically. Please sign in manually.",
          });
          setTab('login');
        } else if (signInData?.session) {
          toast({
            title: "Signup successful",
            description: "You're now logged in!",
          });
          navigate('/tasks');
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error?.message || "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Hero Header */}
      <header className="container mx-auto pt-10 pb-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          SparkHub
        </h1>
        <p className="text-lg mt-2 text-muted-foreground max-w-xl mx-auto">
          Your all-in-one productivity solution for getting more done
        </p>
      </header>
      
      <div className="container mx-auto px-4 flex flex-col-reverse lg:flex-row gap-12 lg:gap-20 items-center py-8">
        {/* Left side - Hero features */}
        <div className="w-full lg:w-3/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-border/50">
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Task Management</h3>
              <p className="text-muted-foreground">Organize, prioritize, and track all your tasks in one place. Stay on top of deadlines and never miss important work.</p>
            </div>
            
            <div className="bg-card rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-border/50">
              <div className="rounded-full bg-indigo-500/10 w-12 h-12 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-indigo-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Pomodoro Timer</h3>
              <p className="text-muted-foreground">Boost productivity using the proven Pomodoro technique with customizable work and break intervals.</p>
            </div>
            
            <div className="bg-card rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-border/50">
              <div className="rounded-full bg-amber-500/10 w-12 h-12 flex items-center justify-center mb-4">
                <ListChecks className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Habit Tracking</h3>
              <p className="text-muted-foreground">Build lasting habits with daily tracking, streaks, and visual progress indicators that keep you motivated.</p>
            </div>
            
            <div className="bg-card rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-border/50">
              <div className="rounded-full bg-green-500/10 w-12 h-12 flex items-center justify-center mb-4">
                <BarChart className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Analytics</h3>
              <p className="text-muted-foreground">Gain insights into your productivity with beautiful charts and metrics that help optimize your workflow.</p>
            </div>
          </div>
        </div>
        
        {/* Right side - Auth form */}
        <div className="w-full lg:w-2/5">
          <Card className="backdrop-blur-sm bg-card/90 border border-border/50 shadow-xl rounded-xl p-1">
            <CardContent className="p-6">
              <Tabs defaultValue={tab} onValueChange={(value) => setTab(value as 'login' | 'signup')} className="w-full">
                <TabsList className="grid grid-cols-2 w-full mb-8 rounded-md p-1 h-auto">
                  <TabsTrigger value="login" className="text-sm md:text-base py-2.5 rounded-l-md">Login</TabsTrigger>
                  <TabsTrigger value="signup" className="text-sm md:text-base py-2.5 rounded-r-md">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email-login" className="text-sm font-medium">Email address</Label>
                        <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
                      <Input
                        id="email-login"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 h-11 rounded-md border border-input bg-background/80 text-sm focus:border-primary focus-visible:ring-1 focus-visible:ring-primary transition-all"
                      />
                    </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password-login" className="text-sm font-medium">Password</Label>
                          <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
                        </div>
                        <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
                        <Input
                          id="password-login"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="pl-10 h-11 rounded-md border border-input bg-background/80 text-sm focus:border-primary focus-visible:ring-1 focus-visible:ring-primary transition-all"
                        />
                      </div>
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base font-medium rounded-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-300 shadow-md hover:shadow-lg" 
                      disabled={loading}
                    >
                      {loading ? "Logging in..." : "Login to Your Account"}
                      {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email-signup" className="text-sm font-medium">Email address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
                          <Input 
                            id="email-signup"
                            type="email" 
                            placeholder="you@example.com"
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                            className="pl-10 h-11 rounded-md border border-input bg-background/80 text-sm focus:border-primary focus-visible:ring-1 focus-visible:ring-primary transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password-signup" className="text-sm font-medium">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
                          <Input 
                            id="password-signup"
                            type="password" 
                            placeholder="Min. 6 characters"
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required
                            className="pl-10 h-11 rounded-md border border-input bg-background/80 text-sm focus:border-primary focus-visible:ring-1 focus-visible:ring-primary transition-all"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Password must be at least 6 characters long</p>
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base font-medium rounded-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-300 shadow-md hover:shadow-lg" 
                      disabled={loading}
                    >
                      {loading ? "Creating Account..." : "Create Free Account"}
                      {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
                    </Button>
                    
                    <p className="text-center text-xs text-muted-foreground mt-4">
                      By creating an account, you agree to our
                      <br />
                      <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      
    </div>
  );
};

export default AuthPage;