import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Deals from './pages/Deals';
import Activities from './pages/Activities';
import Tags from './pages/Tags';
import Templates from './pages/Templates';
import Automations from './pages/Automations';
import Reports from './pages/Reports';
import Tutorial from './pages/Tutorial';
import Admin from './pages/Admin';
import Pricing from './pages/Pricing';
import Checkout from './pages/Checkout';
import Settings from './pages/Settings';
import Layout from './components/Layout';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Carregando...</div>;
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Carregando...</div>;
  return user ? <Navigate to="/app" /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="deals" element={<Deals />} />
            <Route path="activities" element={<Activities />} />
            <Route path="tags" element={<Tags />} />
            <Route path="templates" element={<Templates />} />
            <Route path="automations" element={<Automations />} />
            <Route path="reports" element={<Reports />} />
            <Route path="tutorial" element={<Tutorial />} />
            <Route path="admin" element={<Admin />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
