import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TeamProvider } from "./context/TeamContext";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Schedule from "./pages/Schedule";
import Roster from "./pages/Roster";
import TeamStats from "./pages/TeamStats";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TeamProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              
              {/* Schedule Branch */}
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/schedule/import" element={<Schedule />} />
              
              {/* Roster Branch */}
              <Route path="/roster" element={<Navigate to="/roster/players" replace />} />
              <Route path="/roster/players" element={<Roster />} />
              <Route path="/roster/coaches" element={<Roster />} />
              
              {/* Stats Branch */}
              <Route path="/stats/team" element={<TeamStats />} />
              <Route path="/stats/games" element={<TeamStats />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TeamProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
