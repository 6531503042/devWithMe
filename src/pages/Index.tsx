import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { CheckCircle, Clock, ListChecks, BarChart, Heart, Star, Coffee, Brain, ArrowRight, Github, Zap, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if user is logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // If user is already logged in, don't render the landing page
  if (user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">devWithMe</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#why" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Why devWithMe</a>
            <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">About Creator</a>
            <a href="#donate" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Support Us</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/auth?mode=login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button size="sm">Sign up free</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-20 pb-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 -z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(120,80,220,0.15),transparent_40%)] -z-10" />
          
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
              <div className="text-left">
                <Badge variant="outline" className="mb-4 px-3 py-1 bg-primary/10 text-primary border-primary/30">
                  Built by students, for everyone
                </Badge>
                <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Boost your productivity and focus
                </h1>
                <p className="text-lg text-muted-foreground mb-8">
                  An all-in-one productivity solution with task management, pomodoro timer, and habit tracking to help you achieve more while reducing stress.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Link to="/auth?mode=signup">
                    <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 transition-all">
                      Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <a href="#features">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Explore Features
                    </Button>
                  </a>
                </div>
              </div>
              
              <div className="relative">
                <div className="w-full rounded-lg overflow-hidden shadow-xl transform translate-y-0 hover:-translate-y-1 transition-all duration-300">
                  <img 
                    src="https://images.unsplash.com/photo-1586473219010-2ffc57b0d282?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" 
                    alt="Productivity Dashboard" 
                    className="w-full h-auto object-cover rounded-lg"
                  />
                  <div className="absolute bottom-4 right-4 bg-white rounded-md shadow-md px-3 py-2 text-sm font-medium border border-primary/20">
                    <span className="flex items-center gap-2">
                      <span className="text-primary">Clean Design</span>
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    </span>
                  </div>
                </div>
                
                <div className="absolute -bottom-6 -left-6 bg-white rounded-lg shadow-lg p-4 max-w-[220px] border border-gray-100 transform hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-green-100 text-green-600 rounded-full p-1.5">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-sm">Focus Mode</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Boost your concentration with our distraction-free workspace</div>
                  <div className="mt-3 flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                    <div className="h-1.5 w-1.5 rounded-full bg-green-300"></div>
                    <div className="h-1.5 w-1.5 rounded-full bg-green-300"></div>
                    <span className="text-[10px] text-green-600 ml-1 font-medium">75% Focus</span>
                  </div>
                </div>
                
                <div className="absolute -top-6 -right-6 bg-white rounded-lg shadow-lg p-4 max-w-[220px] border border-gray-100 transform hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-blue-100 text-blue-600 rounded-full p-1.5">
                      <Zap className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-sm">Track Progress</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Visualize your productivity with beautiful analytics and insights</div>
                  <div className="mt-3 flex items-center gap-1">
                    <div className="h-2 bg-blue-200 rounded-full w-full flex-1">
                      <div className="h-2 bg-blue-500 rounded-full w-[65%]"></div>
                    </div>
                    <span className="text-[10px] text-blue-600 ml-1 font-medium">65%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Improved design */}
        <section id="features" className="py-20 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 px-3 py-1">Features</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to stay productive</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                devWithMe combines all the essential tools for productivity in one beautiful interface.
              </p>
            </div>

            {/* Redesigned feature cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {/* Task Management card */}
              <div className="group relative flex flex-col bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="h-2 bg-green-500"></div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="rounded-lg bg-green-100 text-green-600 w-12 h-12 flex items-center justify-center mb-4">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-green-600 transition-colors">Task Management</h3>
                  <p className="text-muted-foreground text-sm flex-1">Create, organize and track your tasks with ease. Set due dates, priorities, and categories.</p>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Organize</span>
                      <span className="text-green-600 font-medium">Track Progress</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pomodoro Timer card */}
              <div className="group relative flex flex-col bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="h-2 bg-blue-500"></div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="rounded-lg bg-blue-100 text-blue-600 w-12 h-12 flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-blue-600 transition-colors">Pomodoro Timer</h3>
                  <p className="text-muted-foreground text-sm flex-1">Boost your productivity with the Pomodoro technique. Work in focused intervals with timed breaks.</p>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Focus Mode</span>
                      <span className="text-blue-600 font-medium">25:00</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Habit Tracking card */}
              <div className="group relative flex flex-col bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="h-2 bg-purple-500"></div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="rounded-lg bg-purple-100 text-purple-600 w-12 h-12 flex items-center justify-center mb-4">
                    <ListChecks className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-purple-600 transition-colors">Habit Tracking</h3>
                  <p className="text-muted-foreground text-sm flex-1">Build better habits with daily tracking, streaks, and progress visualization.</p>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Build Streaks</span>
                      <span className="text-purple-600 font-medium">🔥 7 Days</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics card */}
              <div className="group relative flex flex-col bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="h-2 bg-orange-500"></div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="rounded-lg bg-orange-100 text-orange-600 w-12 h-12 flex items-center justify-center mb-4">
                    <BarChart className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-orange-600 transition-colors">Insightful Analytics</h3>
                  <p className="text-muted-foreground text-sm flex-1">Understand your productivity patterns with detailed statistics and visualizations.</p>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Visualize</span>
                      <span className="text-orange-600 font-medium">Track Trends</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Section */}
        <section id="why" className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 px-3 py-1">Why Choose Us</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Made with passion and purpose</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                devWithMe was built to solve real productivity challenges faced by students and professionals alike.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all">
                <div className="rounded-full bg-green-100 w-12 h-12 flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold mb-2">Privacy-First Approach</h3>
                <p className="text-muted-foreground">Your data stays private. We don't sell your information or track your activities.</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all">
                <div className="rounded-full bg-blue-100 w-12 h-12 flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold mb-2">Beautiful User Experience</h3>
                <p className="text-muted-foreground">Designed with aesthetics and usability in mind for a delightful productivity experience.</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all">
                <div className="rounded-full bg-purple-100 w-12 h-12 flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold mb-2">Built by Students</h3>
                <p className="text-muted-foreground">Created from the ground up by students who understand the needs of productive people.</p>
              </div>
            </div>
          </div>
        </section>

        {/* About Creator Section */}
        <section id="about" className="py-20 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <Badge variant="outline" className="mb-4 px-3 py-1">About the Creator</Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet Bengi</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  The mind behind devWithMe
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 flex flex-col md:flex-row gap-8 items-center hover:shadow-lg transition-all">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 border-2 border-primary/20">
                  <img src="https://i.pinimg.com/236x/ee/4f/b1/ee4fb15c83d22e0a428fc37127191346.jpg" alt="Bengi" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Bengi</h3>
                  <p className="text-sm text-muted-foreground mb-3">3rd Year Software Engineering Student at Mae Fah Luang University</p>
                  <p className="mb-4">
                    As a passionate software engineering student, I created devWithMe to address the productivity challenges students face. I believe in creating tools that help people achieve more while maintaining balance and reducing stress.
                  </p>
                  <div className="flex gap-3">
                    <a href="https://github.com/6531503042" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <Github className="mr-2 h-4 w-4" />
                        GitHub
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Donation Section */}
        <section id="donate" className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="outline" className="mb-4 px-3 py-1 bg-amber-100 text-amber-700 border-amber-200">Support Us</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Help us keep devWithMe free for everyone</h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                devWithMe is a passion project built by students. Your support helps us maintain and improve the platform while keeping it free for all users.
              </p>

              <Card className="overflow-hidden border border-amber-200 bg-amber-50/50 shadow-md hover:shadow-lg transition-all">
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-col items-center">
                    <Coffee className="w-10 h-10 text-amber-600 mb-4" />
                    <h3 className="text-xl font-bold mb-2">Buy me a coffee</h3>
                    <p className="text-muted-foreground mb-6 max-w-lg">
                      Your support helps cover hosting costs and enables us to continue developing new features.
                    </p>
                    <a href="https://www.buymeacoffee.com/bengi" target="_blank" rel="noopener noreferrer" className="inline-block">
                      <Button className="bg-amber-600 hover:bg-amber-700 flex items-center gap-2">
                        <Coffee className="h-4 w-4" />
                        <span>Support the Project</span>
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-gradient-to-r from-primary to-purple-600">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Ready to boost your productivity?</h2>
              <p className="text-white/80 mb-8 max-w-2xl mx-auto">
                Join thousands of students and professionals who have transformed their productivity with devWithMe.
              </p>
              <Link to="/auth?mode=signup">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                  Get Started Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Streamlined Footer */}
      <footer className="bg-gray-50 py-8 border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Brain className="h-5 w-5 text-primary" />
              <span className="font-bold text-lg bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">devWithMe</span>
            </div>
            
            <div className="flex gap-6 mb-4 md:mb-0 flex-wrap justify-center">
              <a href="#features" className="text-sm text-muted-foreground hover:text-primary transition-colors">Features</a>
              <a href="#why" className="text-sm text-muted-foreground hover:text-primary transition-colors">Why devWithMe</a>
              <a href="#about" className="text-sm text-muted-foreground hover:text-primary transition-colors">About</a>
              <a href="#donate" className="text-sm text-muted-foreground hover:text-primary transition-colors">Support</a>
              <a href="https://github.com/6531503042" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                <Github className="h-3.5 w-3.5" /> GitHub
              </a>
            </div>
            
            <div className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} devWithMe by Bengi
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
