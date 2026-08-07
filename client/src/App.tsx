import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootLayout } from './components/layout/RootLayout';
import { LandingPage } from './pages/LandingPage';
import { CreateSharePage } from './pages/CreateSharePage';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useThemeStore } from './stores/themeStore';

const queryClient = new QueryClient();

import { ReceiverPage } from './pages/ReceiverPage';

import { DashboardPage } from './pages/DashboardPage';

// Placeholder pages
const NotFound = () => <div className="flex-1 flex items-center justify-center p-6"><h1 className="text-3xl font-bold text-error-500">404 - Not Found</h1></div>;

export const App: React.FC = () => {
  const initTheme = useThemeStore((state) => state.init);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="create" element={<CreateSharePage />} />
              <Route path="s/:token" element={<ReceiverPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

export default App;
