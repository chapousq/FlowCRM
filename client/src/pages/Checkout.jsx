import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const planDetails = {
  pro: { name: 'Pro', price: 49.90, color: '#4f46e5' },
  enterprise: { name: 'Enterprise', price: 199.90, color: '#f59e0b' },
};

function formatCardNumber(value) {
  const v = value.replace(/\D/g, '').slice(0, 16);
  return v.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(value) {
  const v = value.replace(/\D/g, '').slice(0, 4);
  if (v.length >= 3) return v.slice(0, 2) + '/' + v.slice(2);
  return v;
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan') || 'pro';
  const plan = planDetails[planId];
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    card_name: '',
    card_number: '',
    card_expiry: '',
    card_cvv: '',
    billing_email: user?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!plan) {
    return (
      <div className="page" style={{ textAlign: 'center', padding: 60 }}>
        <h2>Plano nao encontrado</h2>
        <button className="btn btn-primary" onClick={() => navigate('/app/pricing')}>Ver Planos</button>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'card_number') {
      setForm({ ...form, [name]: formatCardNumber(value) });
    } else if (name === 'card_expiry') {
      setForm({ ...form, [name]: formatExpiry(value) });
    } else if (name === 'card_cvv') {
      setForm({ ...form, [name]: value.replace(/\D/g, '').slice(0, 4) });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/payments/checkout', {
        plan: planId,
        ...form,
      });
      setSuccess(true);
      setTimeout(() => navigate('/app/settings'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="page" style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{'\u2705'}</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Pagamento Aprovado!</h1>
        <p style={{ color: '#64748b', marginBottom: 24 }}>Seu plano {plan.name} foi ativado. Redirecionando...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 14, marginBottom: 20 }}>
          {'\u2190'} Voltar
        </button>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Finalizar Assinatura</h1>
          <p style={{ color: '#64748b' }}>Plano <strong style={{ color: plan.color }}>{plan.name}</strong> - R$ {plan.price.toFixed(2).replace('.', ',')}/mes</p>
        </div>

        <div className="card" style={{ marginBottom: 24, background: `${plan.color}10`, border: `1px solid ${plan.color}30` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: plan.color }}>Plano {plan.name}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Cobrado mensalmente</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>R$ {plan.price.toFixed(2).replace('.', ',')}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Dados do Cartao</h3>

            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

            <div className="form-group">
              <label>Nome no Cartao</label>
              <input type="text" name="card_name" value={form.card_name} onChange={handleChange} placeholder="Como aparece no cartao" required />
            </div>

            <div className="form-group">
              <label>Numero do Cartao</label>
              <input type="text" name="card_number" value={form.card_number} onChange={handleChange} placeholder="0000 0000 0000 0000" required maxLength={19} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Validade</label>
                <input type="text" name="card_expiry" value={form.card_expiry} onChange={handleChange} placeholder="MM/AA" required maxLength={5} />
              </div>
              <div className="form-group">
                <label>CVV</label>
                <input type="text" name="card_cvv" value={form.card_cvv} onChange={handleChange} placeholder="123" required maxLength={4} />
              </div>
            </div>

            <div className="form-group">
              <label>Email de Cobranca</label>
              <input type="email" name="billing_email" value={form.billing_email} onChange={handleChange} placeholder="seu@email.com" required />
            </div>
          </div>

          <button type="submit" className="btn" disabled={loading}
            style={{ width: '100%', background: plan.color, color: 'white', fontWeight: 700, fontSize: 16, padding: '14px 0' }}>
            {loading ? 'Processando...' : `Pagar R$ ${plan.price.toFixed(2).replace('.', ',')}`}
          </button>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#94a3b8' }}>
            Pagamento seguro. Cancele a qualquer momento.
          </div>
        </form>
      </div>
    </div>
  );
}
