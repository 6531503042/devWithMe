import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, Clock, ListChecks, BarChart } from 'lucide-react';

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
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.message,
        });
        return;
      }
      
      if (data?.session) {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        navigate('/tasks');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/auth',
          data: {
            email: email,
          }
        }
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Signup failed",
          description: error.message,
        });
        return;
      }
      
      if (data.session) {
        toast({
          title: "Signup successful",
          description: "You're now logged in!",
        });
        navigate('/tasks');
      } else {
        toast({
          title: "Signup successful",
          description: "Please check your email to verify your account.",
        });
        setTab('login');
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Hero section */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-primary/90 to-purple-700 text-white p-8 md:p-12 flex flex-col justify-center">
        <div className="max-w-xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Welcome to SparkHub</h1>
          <p className="text-lg md:text-xl mb-8 text-white/90">
            Your all-in-one productivity solution for managing tasks, tracking habits, and staying focused.
          </p>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                <h3 className="font-semibold">Task Management</h3>
              </div>
              <p className="text-sm text-white/80">Organize and track your tasks with ease</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-6 h-6" />
                <h3 className="font-semibold">Pomodoro Timer</h3>
              </div>
              <p className="text-sm text-white/80">Stay focused with timed work sessions</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ListChecks className="w-6 h-6" />
                <h3 className="font-semibold">Habit Tracking</h3>
              </div>
              <p className="text-sm text-white/80">Build better habits with daily tracking</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BarChart className="w-6 h-6" />
                <h3 className="font-semibold">Analytics</h3>
              </div>
              <p className="text-sm text-white/80">Visualize your productivity patterns</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Auth form */}
      <div className="w-full md:w-1/2 bg-background p-8 md:p-12 flex items-center justify-center">
        <Card className="w-full max-w-md border-none shadow-none">
          <Tabs value={tab} onValueChange={(value) => setTab(value as 'login' | 'signup')} className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-8">
              <TabsTrigger value="login" className="text-lg">Login</TabsTrigger>
              <TabsTrigger value="signup" className="text-lg">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-base">Email</Label>
                    <Input 
                      id="login-email" 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                      placeholder="name@example.com"
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-base">Password</Label>
                    <Input 
                      id="login-password" 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required
                      className="h-12 text-base"
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full h-12 text-base" size="lg" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-base">Email</Label>
                    <Input 
                      id="signup-email" 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                      placeholder="name@example.com"
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-base">Password</Label>
                    <Input 
                      id="signup-password" 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required
                      placeholder="Min. 6 characters"
                      className="h-12 text-base"
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full h-12 text-base" size="lg" disabled={loading}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
