import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Footer } from "@/components/Footer";
import { FloatingAdminButton } from "@/components/FloatingAdminButton";
import Index from "./pages/Index";
import Archive from "./pages/Archive";
import Impressum from "./pages/Impressum";
import Datenschutz from "./pages/Datenschutz";
import Disclaimer from "./pages/Disclaimer";
import Nutzungsbedingungen from "./pages/Nutzungsbedingungen";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/archiv" element={<Archive />} />
                <Route path="/impressum" element={<Impressum />} />
                <Route path="/datenschutz" element={<Datenschutz />} />
                <Route path="/disclaimer" element={<Disclaimer />} />
                <Route path="/nutzungsbedingungen" element={<Nutzungsbedingungen />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/profile" element={<Profile />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>

              {/* Global footer on every route */}
              <Footer />

              {/* Floating Admin Button - visible for ANY logged-in user */}
              <FloatingAdminButton />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
