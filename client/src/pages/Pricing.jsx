import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'Gratis para sempre',
    color: '#64748b',
    features: [
      '5 contatos',
      '10 negocios',
      '1 usuario',
      'Dashboard basico',
      'Relatorios basicos',
    ],
    excluded: ['Automacoes', 'Templates de email', 'API access', 'Suporte prioritario'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49.90,
    period: '/mes',
    color: '#4f46e5',
    popular: true,
    features: [
      '500 contatos',
      'Negocios ilimitados',
      '3 usuarios',
      'Automacoes avancadas',
      'Templates de email',
      'Relatorios avancados',
      'Importar/exportar CSV',
      'Suporte por email',
    ],
    excluded: ['API access', 'Suporte prioritario'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199.90,
    period: '/mes',
    color: '#f59e0b',
    features: [
      'Contatos ilimitados',
      'Negocios ilimitados',
      'Usuarios ilimitados',
      'Automacoes avancadas',
      'Templates de email',
      'Relatorios avancados',
      'Importar/exportar CSV',
      'API access',
      'Suporte prioritario 24/7',
      'Personalizacao completa',
    ],
    excluded: [],
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSelect = (planId) => {
    if (planId === 'free') {
      if (user) navigate('/app');
      return;
    }
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/app/checkout?plan=${planId}`);
  };

  return (
    <div className="page">
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Escolha seu plano</h1>
        <p style={{ fontSize: 16, color: '#64748b', maxWidth: 500, margin: '0 auto' }}>
          Comece gratis e escale conforme seu negocio cresce. Sem taxas ocultas.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, maxWidth: 960, margin: '0 auto' }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="card"
            style={{
              position: 'relative',
              border: user?.plan === plan.id ? `2px solid ${plan.color}` : '2px solid transparent',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            {plan.popular && (
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: plan.color, color: 'white', padding: '4px 16px', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
                MAIS POPULAR
              </div>
            )}

            {user?.plan === plan.id && (
              <div style={{ position: 'absolute', top: -12, right: 16, background: '#10b981', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                SEU PLANO ATUAL
              </div>
            )}

            <div style={{ textAlign: 'center', marginBottom: 24, paddingTop: plan.popular ? 12 : 0 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: plan.color, marginBottom: 4 }}>{plan.name}</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
                {plan.price === 0 ? (
                  <span style={{ fontSize: 36, fontWeight: 800 }}>Gratis</span>
                ) : (
                  <>
                    <span style={{ fontSize: 14, color: '#64748b' }}>R$</span>
                    <span style={{ fontSize: 36, fontWeight: 800 }}>{plan.price.toFixed(2).replace('.', ',')}</span>
                    <span style={{ fontSize: 14, color: '#64748b' }}>{plan.period}</span>
                  </>
                )}
              </div>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0' }}>
              {plan.features.map((f, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 13, color: '#334155' }}>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>{'\u2713'}</span>
                  {f}
                </li>
              ))}
              {plan.excluded.map((f, i) => (
                <li key={`ex-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 13, color: '#94a3b8' }}>
                  <span>{'\u2717'}</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              className="btn"
              style={{
                width: '100%',
                background: user?.plan === plan.id ? '#e2e8f0' : plan.color,
                color: user?.plan === plan.id ? '#64748b' : 'white',
                fontWeight: 600,
                fontSize: 14,
                padding: '12px 0',
                cursor: user?.plan === plan.id ? 'default' : 'pointer',
              }}
              onClick={() => handleSelect(plan.id)}
              disabled={user?.plan === plan.id}
            >
              {user?.plan === plan.id ? 'Plano Atual' : plan.price === 0 ? 'Comecar Gratis' : 'Assinar Agora'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
