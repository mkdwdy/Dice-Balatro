import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import GameScreen from "@/pages/GameScreen";
import ShopPage from "@/pages/ShopPage";
import StageSelectPage from "@/pages/StageSelectPage";

function Router() {
  return (
    <Switch>
      {/* Add pages below */}
      <Route path="/" component={HomePage}/>
      <Route path="/game/:id" component={GameScreen}/>
      <Route path="/shop/:id" component={ShopPage}/>
      <Route path="/stage-select/:id" component={StageSelectPage}/>
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
