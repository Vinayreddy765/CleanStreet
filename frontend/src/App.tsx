import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ReportForm } from './pages/ReportForm';
import { Reports } from './pages/Reports';
import { Hotspots } from './pages/Hotspots';
import { Impact } from './pages/Impact';

type Page = 'dashboard' | 'report' | 'reports' | 'hotspots' | 'impact';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');

  function navigate(p: Page) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderPage() {
    switch (page) {
      case 'dashboard':
        return <Dashboard onNavigate={navigate} />;
      case 'report':
        return <ReportForm onNavigate={navigate} />;
      case 'reports':
        return <Reports />;
      case 'hotspots':
        return <Hotspots />;
      case 'impact':
        return <Impact />;
    }
  }

  return (
    <Layout currentPage={page} onNavigate={navigate}>
      {renderPage()}
    </Layout>
  );
}
