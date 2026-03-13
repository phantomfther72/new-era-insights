import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import DataIngestion from "@/pages/DataIngestion";
import Audience from "@/pages/Audience";
import Distribution from "@/pages/Distribution";
import Forecasting from "@/pages/Forecasting";
import Insights from "@/pages/Insights";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/data-ingestion" element={<DataIngestion />} />
            <Route path="/audience" element={<Audience />} />
            <Route path="/distribution" element={<Distribution />} />
            <Route path="/forecasting" element={<Forecasting />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
