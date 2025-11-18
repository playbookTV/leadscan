import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';

import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Leads } from './pages/Leads';
import { LeadDetail } from './pages/LeadDetail';
import { Analytics } from './pages/Analytics';
import { Keywords } from './pages/Keywords';
import { Settings } from './pages/Settings';
import { useRealtime } from './hooks/useRealtime';
import { initializeNotifications } from './utils/notifications';
import { ThemeProvider } from './contexts/ThemeContext';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30 * 1000, // 30 seconds
    },
  },
});

// Component that uses hooks (must be inside QueryClientProvider)
function AppContent() {
  // Enable real-time updates
  useRealtime();

  // Initialize browser notifications
  useEffect(() => {
    initializeNotifications().then(() => {
      // Notifications initialized
    });
  }, []);

  return (
    <>
      <Toaster
        position="top-right"
        expand={true}
        richColors
        closeButton
        toastOptions={{
          duration: 5000,
          style: {
            background: 'var(--heroui-colors-background)',
            color: 'var(--heroui-colors-foreground)',
            border: '1px solid var(--heroui-colors-border)',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="leads" element={<Leads />} />
          <Route path="leads/:id" element={<LeadDetail />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="keywords" element={<Keywords />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;