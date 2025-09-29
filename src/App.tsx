import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthCheck } from "@/components/auth/AuthCheck";
import { AuthForm } from "@/components/auth/AuthForm";
import { MainApp } from "@/pages/MainApp";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthCheck fallback={<AuthForm />}>
          <Routes>
            <Route path="/*" element={<MainApp />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthCheck>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
