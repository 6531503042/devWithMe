import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { lazy, Suspense } from "react";
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Loader component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="h-8 w-8 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
  </div>
);

// Lazy-loaded Pages
const Index = lazy(() => import("@/pages/Index"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const TasksPage = lazy(() => import("@/pages/TasksPage"));
const KanbanPage = lazy(() => import("@/pages/KanbanPage"));
const PomodoroPage = lazy(() => import("@/pages/PomodoroPage"));
const FinancePage = lazy(() => import("@/pages/FinancePage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const SpotifyCallback = lazy(() => import("@/pages/SpotifyCallback"));

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/spotify-callback" element={<SpotifyCallback />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
              <Route path="/kanban" element={<ProtectedRoute><KanbanPage /></ProtectedRoute>} />
              <Route path="/pomodoro" element={<ProtectedRoute><PomodoroPage /></ProtectedRoute>} />
              <Route path="/finance" element={<ProtectedRoute><FinancePage /></ProtectedRoute>} />
              
              {/* Not found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
      
      <Toaster />
      <Sonner position="top-right" />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
