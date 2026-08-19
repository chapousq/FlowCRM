import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const planNames = { free: 'Free', pro: 'Pro', enterprise: 'Enterprise' };
const planColors = { free: '#64748b', pro: '#4f46e5', enterprise: '#f59e0b' };
const planPrices = { free: 'Gratis', pro: 'R$ 49,90/mes', enterprise: 'R$ 199,90/mes' };

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/payments/my-payments').then(({ data }) => {
      setPayments(data);
    }).finally(() => setLoading(false));
  }, []);

  const handleCancel = async () => {
    setCanceling(true);
    try {
      await api.post('/payments/cancel');
      setMsg('Assinatura cancelada com sucesso');
      setConfirmCancel(false);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Erro ao cancelar');
    } finally {
      setCanceling(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Configuracoes</h1>
      </div>

      {msg && <div className="alert alert-success" style={{ marginBottom: 16 }}>{msg}</div>}

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Meu Plano</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                padding: '4px 12px', borderRadius: 6,
                background: `${planColors[user?.plan || 'free']}15`,
                color: planColors[user?.plan || 'free'],
                fontWeight: 700, fontSize: 14,
              }}>
                {planNames[user?.plan || 'free']}
              </span>
              <span style={{ fontSize: 16, fontWeight: 600 }}>{planPrices[user?.plan || 'free']}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {user?.plan === 'free' ? (
              <button className="btn btn-primary" onClick={() => navigate('/app/pricing')}>
                Ver Planos
              </button>
            ) : (
              <>
                <button className="btn btn-outline" onClick={() => navigate('/app/pricing')}>
                  Trocar Plano
                </button>
                <button className="btn" style={{ background: '#ef4444', color: 'white' }}
                  onClick={() => setConfirmCancel(true)}>
                  Cancelar Assinatura
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {confirmCancel && (
        <div className="modal-overlay" onClick={() => setConfirmCancel(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>Cancelar assinatura?</h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 8, lineHeight: 1.6 }}>
              Sua assinatura sera cancelada e seu plano sera rebaixado para <strong>Free</strong>.
              Seus dados serao mantidos, mas funcionalidades premium serao desativadas.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setConfirmCancel(false)}>Manter Plano</button>
              <button className="btn" style={{ background: '#ef4444', color: 'white' }} onClick={handleCancel} disabled={canceling}>
                {canceling ? 'Cancelando...' : 'Sim, Cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Historico de Pagamentos</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>Carregando...</div>
        ) : payments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>
            Nenhum pagamento registrado
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: 600, fontSize: 12 }}>DATA</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: 600, fontSize: 12 }}>PLANO</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: 600, fontSize: 12 }}>VALOR</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: 600, fontSize: 12 }}>CARTAO</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: 600, fontSize: 12 }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 13 }}>{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 4, background: `${planColors[p.plan]}15`, color: planColors[p.plan], fontSize: 12, fontWeight: 600 }}>
                        {planNames[p.plan]}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>R$ {p.amount.toFixed(2).replace('.', ',')}</td>
                    <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 13 }}>**** {p.card_last4}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                        background: p.status === 'completed' ? '#f0fdf4' : p.status === 'cancelled' ? '#fef2f2' : '#fef3c7',
                        color: p.status === 'completed' ? '#166534' : p.status === 'cancelled' ? '#991b1b' : '#92400e',
                      }}>
                        {p.status === 'completed' ? 'Pago' : p.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
