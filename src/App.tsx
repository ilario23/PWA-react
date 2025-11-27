import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Dashboard } from "@/pages/Dashboard";
import { AuthPage } from "@/pages/AuthPage";
import { useAuth } from "@/hooks/useAuth";
import { useOnlineSync } from "@/hooks/useOnlineSync";
import { useAutoGenerate } from "@/hooks/useAutoGenerate";
import { useBudgetNotifications } from "@/hooks/useBudgetNotifications";
import { Toaster } from "@/components/ui/sonner";
import { PWAUpdateNotification } from "@/components/PWAUpdateNotification";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import { TransactionsPage } from "@/pages/Transactions";
import { RecurringTransactionsPage } from "@/pages/RecurringTransactions";
import { CategoriesPage } from "@/pages/Categories";
import { ContextsPage } from "@/pages/Contexts";
import { GroupsPage } from "@/pages/Groups";
import { GroupDetailPage } from "@/pages/GroupDetail";

import { StatisticsPage } from "@/pages/Statistics";

import { SettingsPage } from "@/pages/Settings";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  useOnlineSync(); // Auto-sync when coming online
  useAutoGenerate(); // Generate recurring transactions on app load
  useBudgetNotifications(); // Monitor budget and show warnings

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return <>{children}</>;
}

import { useSettings } from "@/hooks/useSettings";
import { useEffect } from "react";

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();

  useEffect(() => {
    if (settings?.theme) {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");

      if (settings.theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light";
        root.classList.add(systemTheme);
      } else {
        root.classList.add(settings.theme);
      }
    }
  }, [settings?.theme]);

  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary section="App">
      <Router>
        <ThemeProvider>
          <Toaster />
          <PWAUpdateNotification />
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Routes>
                      <Route
                        path="/"
                        element={
                          <ErrorBoundary section="Dashboard" minimal>
                            <Dashboard />
                          </ErrorBoundary>
                        }
                      />
                      <Route
                        path="/transactions"
                        element={
                          <ErrorBoundary section="Transazioni" minimal>
                            <TransactionsPage />
                          </ErrorBoundary>
                        }
                      />
                      <Route
                        path="/recurring"
                        element={
                          <ErrorBoundary section="Transazioni Ricorrenti" minimal>
                            <RecurringTransactionsPage />
                          </ErrorBoundary>
                        }
                      />
                      <Route
                        path="/categories"
                        element={
                          <ErrorBoundary section="Categorie" minimal>
                            <CategoriesPage />
                          </ErrorBoundary>
                        }
                      />
                      <Route
                        path="/contexts"
                        element={
                          <ErrorBoundary section="Contesti" minimal>
                            <ContextsPage />
                          </ErrorBoundary>
                        }
                      />
                      <Route
                        path="/groups"
                        element={
                          <ErrorBoundary section="Gruppi" minimal>
                            <GroupsPage />
                          </ErrorBoundary>
                        }
                      />
                      <Route
                        path="/groups/:groupId"
                        element={
                          <ErrorBoundary section="Dettaglio Gruppo" minimal>
                            <GroupDetailPage />
                          </ErrorBoundary>
                        }
                      />
                      <Route
                        path="/statistics"
                        element={
                          <ErrorBoundary section="Statistiche" minimal>
                            <StatisticsPage />
                          </ErrorBoundary>
                        }
                      />
                      <Route
                        path="/settings"
                        element={
                          <ErrorBoundary section="Impostazioni" minimal>
                            <SettingsPage />
                          </ErrorBoundary>
                        }
                      />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </AppShell>
                </ProtectedRoute>
              }
            />
          </Routes>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
