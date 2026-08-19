import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Onboarding from './Onboarding';
import GuidedTour from './GuidedTour';

export default function Layout() {
  const { user, logout } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (user && !localStorage.getItem('onboarding_done')) {
      setShowOnboarding(true);
    }
  }, [user]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const handleTourComplete = () => {
    setShowTour(false);
  };

  return (
    <div className="app-layout">
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      {showTour && <GuidedTour onComplete={handleTourComplete} />}

      <aside className="sidebar">
        <div className="logo">
          <h2>FlowCRM</h2>
          <span>Vendas B2B Inteligente</span>
        </div>
        <nav>
          <NavLink to="/app" end>Dashboard</NavLink>
          <NavLink to="/app/contacts">Contatos</NavLink>
          <NavLink to="/app/deals">Negocios</NavLink>
          <NavLink to="/app/activities">Atividades</NavLink>
          <NavLink to="/app/tags">Tags</NavLink>
          <NavLink to="/app/templates">Templates</NavLink>
          <NavLink to="/app/automations">Automacoes</NavLink>
          <NavLink to="/app/reports">Relatorios</NavLink>
          <NavLink to="/app/tutorial">Ajuda</NavLink>
          {user?.role === 'admin' && <NavLink to="/app/admin">Admin</NavLink>}
          {user?.plan === 'free' && <NavLink to="/app/pricing">Planos</NavLink>}
          <NavLink to="/app/settings">Configuracoes</NavLink>
        </nav>
        <div className="sidebar-footer">
          <div style={{ marginBottom: 4, fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
            {user?.name}
            {user?.role === 'admin' && (
              <span style={{ background: '#f59e0b', color: '#000', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>ADMIN</span>
            )}
          </div>
          <div style={{ marginBottom: 12, fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>
            Plano: {user?.plan}
          </div>
          <button onClick={logout}>Sair</button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
