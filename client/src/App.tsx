import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/hooks/use-language";
import Home from "@/pages/home";
import Profile from "@/pages/profile";
import UploadPage from "@/pages/upload";
import Leaderboard from "@/pages/leaderboard";
import MemeDetail from "@/pages/meme-detail";
import Contests from "@/pages/contests";
import AboutPage from "@/pages/about";
import MemesPage from "@/pages/memes";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/profile" component={Profile} />
      <Route path="/profile/:userId" component={Profile} />
      <Route path="/upload" component={UploadPage} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/meme/:id" component={MemeDetail} />
      <Route path="/contests" component={Contests} />
      <Route path="/about" component={AboutPage} />
      <Route path="/memes" component={MemesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
