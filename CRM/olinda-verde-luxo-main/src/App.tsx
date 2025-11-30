import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { ThemeProvider } from "next-themes";
import { lazy, Suspense, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { initializeCapacitor } from "@/services/capacitor";

// Lazy load pages for code splitting and better performance
const Index = lazy(() => import("./pages/Index"));
const Casamentos = lazy(() => import("./pages/Casamentos"));
const Corporativo = lazy(() => import("./pages/Corporativo"));
const Hospedagem = lazy(() => import("./pages/Hospedagem"));
import Galeria from "./pages/Galeria";
const Gastronomia = lazy(() => import("./pages/Gastronomia"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Login = lazy(() => import("./pages/Login"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Leads = lazy(() => import("./pages/admin/Leads"));
const Distribution = lazy(() => import("./pages/admin/Distribution"));
const Appointments = lazy(() => import("./pages/admin/Appointments"));
const Automations = lazy(() => import("./pages/admin/Automations"));
const Workflows = lazy(() => import("./pages/admin/Workflows"));
const Performance = lazy(() => import("./pages/admin/Performance"));
const Proposals = lazy(() => import("./pages/admin/Proposals"));
const ProposalDetails = lazy(() => import("./pages/admin/ProposalDetails"));
const ProposalEditor = lazy(() => import("./pages/admin/ProposalEditor"));
const Users = lazy(() => import("./pages/admin/Users"));
const AuditLogs = lazy(() => import("./pages/admin/AuditLogs"));
const Integrations = lazy(() => import("./pages/admin/Integrations"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const EventBlocks = lazy(() => import("./pages/admin/EventBlocks"));
const ConfirmedEvents = lazy(() => import("./pages/admin/ConfirmedEvents"));
const FinancialDashboard = lazy(() => import("./pages/admin/FinancialDashboard"));
const Calculator = lazy(() => import("./pages/admin/Calculator"));
const EmailTemplates = lazy(() => import("./pages/admin/EmailTemplates"));
const LogoProcessor = lazy(() => import("./pages/admin/LogoProcessor"));
const WhatsApp = lazy(() => import("./pages/admin/WhatsApp"));
const AIInsights = lazy(() => import("./pages/admin/AIInsights"));
const Agendamento = lazy(() => import("./pages/Agendamento"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

const App = () => {
  useEffect(() => {
    // Initialize Capacitor for mobile app features
    initializeCapacitor();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <TooltipProvider>
          <WhatsAppFloat />
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/casamentos" element={<Casamentos />} />
              <Route path="/corporativo" element={<Corporativo />} />
              <Route path="/hospedagem" element={<Hospedagem />} />
              <Route path="/gastronomia" element={<Gastronomia />} />
              <Route path="/galeria" element={<Galeria />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/agendamento" element={<Agendamento />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/leads"
                element={
                  <ProtectedRoute>
                    <Leads />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/distribution"
                element={
                  <ProtectedRoute>
                    <Distribution />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/appointments"
                element={
                  <ProtectedRoute>
                    <Appointments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/automations"
                element={
                  <ProtectedRoute>
                    <Automations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/workflows"
                element={
                  <ProtectedRoute>
                    <Workflows />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/performance"
                element={
                  <ProtectedRoute>
                    <Performance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/proposals"
                element={
                  <ProtectedRoute>
                    <Proposals />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/proposals/:id"
                element={
                  <ProtectedRoute>
                    <ProposalDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/proposals/editor"
                element={
                  <ProtectedRoute>
                    <ProposalEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit-logs"
                element={
                  <ProtectedRoute>
                    <AuditLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/integrations"
                element={
                  <ProtectedRoute>
                    <Integrations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/event-blocks"
                element={
                  <ProtectedRoute>
                    <EventBlocks />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/confirmed-events"
                element={
                  <ProtectedRoute>
                    <ConfirmedEvents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/financial"
                element={
                  <ProtectedRoute>
                    <FinancialDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/calculadora"
                element={
                  <ProtectedRoute>
                    <Calculator />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/templates"
                element={
                  <ProtectedRoute>
                    <EmailTemplates />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/logo-processor"
                element={
                  <ProtectedRoute>
                    <LogoProcessor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/whatsapp"
                element={
                  <ProtectedRoute>
                    <WhatsApp />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/ai-insights"
                element={
                  <ProtectedRoute>
                    <AIInsights />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;
