import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { lazy, Suspense } from "react";

// Loader component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="h-8 w-8 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
  </div>
);

// Lazy-loaded Pages
const Index = lazy(() => import("./pages/Index"));
const PomodoroPage = lazy(() => import("./pages/PomodoroPage"));
const TasksPage = lazy(() => import("./pages/TasksPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const FinancePage = lazy(() => import("./pages/FinancePage"));
const KanbanPage = lazy(() => import("./pages/KanbanPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Configure QueryClient with caching and retry policies
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection time)
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/pomodoro" element={<PomodoroPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/kanban" element={<KanbanPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
