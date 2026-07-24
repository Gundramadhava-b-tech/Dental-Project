import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/Layout";
import { AuthProvider, useAuth } from "@/components/AuthContext";
import { NotificationProvider } from "@/components/NotificationContext";

// Pages
import LandingPage from "@/pages/LandingPage";
import SignUpPage from "@/pages/SignUpPage";
import SignInPage from "@/pages/SignInPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import Dashboard from "@/pages/Dashboard";
import Patients from "@/pages/Patients";
import PatientDetail from "@/pages/PatientDetail";
import UploadScan from "@/pages/UploadScan";
import Analyses from "@/pages/Analyses";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/** Wraps a component with the app Layout sidebar */
const WithLayout = (Component: any) => (props: any) => (
  <Layout>
    <Component {...props} />
  </Layout>
);

/** Redirects unauthenticated users to /sign-in */
function ProtectedRoute({ component: Component, ...rest }: { component: any; [key: string]: any }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-8 h-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    navigate("/sign-in");
    return null;
  }

  return <Component {...rest} />;
}

const ProtectedWithLayout = (Component: any) => (props: any) => (
  <ProtectedRoute component={WithLayout(Component)} {...props} />
);

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/sign-up" component={SignUpPage} />
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-up/verify-email" component={VerifyEmailPage} />

      <Route path="/dashboard" component={ProtectedWithLayout(Dashboard)} />
      <Route path="/patients" component={ProtectedWithLayout(Patients)} />
      <Route path="/patients/:id" component={ProtectedWithLayout(PatientDetail)} />
      <Route path="/upload" component={ProtectedWithLayout(UploadScan)} />
      <Route path="/analyses" component={ProtectedWithLayout(Analyses)} />
      <Route component={WithLayout(NotFound)} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <NotificationProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </NotificationProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
