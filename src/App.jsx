import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import React from 'react';

import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Werknemers from './pages/Werknemers';
import Eindklanten from './pages/Eindklanten';
import Plaatsingen from './pages/Plaatsingen';
import Kalender from './pages/prestaties/Kalender';
import Kalenderoverzicht from './pages/prestaties/Kalenderoverzicht';
import Overzicht from './pages/prestaties/Overzicht';
import Codes from './pages/prestaties/Codes';
import PrestatieImport from './pages/prestaties/PrestatieImport.jsx';
import Records from './pages/prestaties/Records.jsx';
import Loonfiches from './pages/Loonfiches';
import Rapporten from './pages/Rapporten';
import Instellingen from './pages/Instellingen';
import AcertaKalender from './pages/acerta/Kalender';
import Workspace from './pages/Workspace';
import Finance from './pages/Finance';

const BaciChat = () => {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', bottom: '24px', right: '24px',
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)', zIndex: 9999,
          fontSize: '24px', border: 'none', cursor: 'pointer',
        }}
        title="Chat met Baci"
      >
        {open ? '✕' : '🤖'}
      </button>

      {open && (
        <div style={{
          position: 'fixed', bottom: '90px', right: '24px',
          width: '400px', height: '600px', borderRadius: '16px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.25)', zIndex: 9998,
          overflow: 'hidden', border: '1px solid #e2e8f0',
        }}>
          <iframe
            src="https://app.base44.com/superagent/69c34fe5b983c06caf295c3b"
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title="Baci Chat"
          />
        </div>
      )}
    </>
  );
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/werknemers" element={<Werknemers />} />
        <Route path="/eindklanten" element={<Eindklanten />} />
        <Route path="/plaatsingen" element={<Plaatsingen />} />
        <Route path="/prestaties/kalender" element={<Kalender />} />
        <Route path="/prestaties/kalenderoverzicht" element={<Kalenderoverzicht />} />
        <Route path="/prestaties/overzicht" element={<Overzicht />} />
        <Route path="/prestaties/codes" element={<Codes />} />
        <Route path="/prestaties/import" element={<PrestatieImport />} />
        <Route path="/prestaties/records" element={<Records />} />
        <Route path="/loonfiches" element={<Loonfiches />} />
        <Route path="/rapporten" element={<Rapporten />} />
        <Route path="/instellingen" element={<Instellingen />} />
        <Route path="/workspace" element={<Workspace />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/acerta/kalender" element={<AcertaKalender />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <BaciChat />
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App