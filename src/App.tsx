import { useState, useEffect } from "react";
import { ThemeProvider } from "@/hooks/useTheme";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { SplashScreen } from "@/components/pwa/SplashScreen";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Generator from "./pages/Generator";
import Analytics from "./pages/Analytics";
import AdminDashboard from "./pages/AdminDashboard";
import ModeratorDashboard from "./pages/ModeratorDashboard";
import OAuthCallback from "./pages/OAuthCallback";
import ScheduledPosts from "./pages/ScheduledPosts";
import Comments from "./pages/Comments";
import ContentLibrary from "./pages/ContentLibrary";
import AIAgent from "./pages/AIAgent";
import Accounts from "./pages/Accounts";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import Subscription from "./pages/Subscription";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    // Show splash only in standalone PWA mode
    return window.matchMedia("(display-mode: standalone)").matches;
  });

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AnimatePresence>
            {showSplash && (
              <SplashScreen onFinish={() => setShowSplash(false)} />
            )}
          </AnimatePresence>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/dashboard" element={<SubscriptionGate><Dashboard /></SubscriptionGate>} />
              <Route path="/calendar" element={<SubscriptionGate><Calendar /></SubscriptionGate>} />
              <Route path="/generator" element={<SubscriptionGate><Generator /></SubscriptionGate>} />
              <Route path="/analytics" element={<SubscriptionGate><Analytics /></SubscriptionGate>} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/moderator" element={<ModeratorDashboard />} />
              <Route path="/scheduled" element={<SubscriptionGate><ScheduledPosts /></SubscriptionGate>} />
              <Route path="/comments" element={<SubscriptionGate><Comments /></SubscriptionGate>} />
              <Route path="/library" element={<SubscriptionGate><ContentLibrary /></SubscriptionGate>} />
              <Route path="/agent" element={<SubscriptionGate><AIAgent /></SubscriptionGate>} />
              <Route path="/accounts" element={<SubscriptionGate><Accounts /></SubscriptionGate>} />
              <Route path="/settings" element={<SubscriptionGate><SettingsPage /></SubscriptionGate>} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/oauth/callback" element={<OAuthCallback />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
