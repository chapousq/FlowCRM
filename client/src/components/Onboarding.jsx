import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const steps = [
  {
    title: 'Bem-vindo ao FlowCRM!',
    desc: 'Seu CRM inteligente para fechar mais negócios B2B. Vou te mostrar como funciona em 1 minuto.',
    icon: '\uD83C\uDF1F',
    color: '#4f46e5',
  },
  {
    title: 'Passo 1: Adicione seus contatos',
    desc: 'Vá em "Contatos" e cadastre seus leads. Preencha nome, empresa, email e telefone. O sistema calcula o score automaticamente!',
    icon: '\uD83D\uDC65',
    color: '#10b981',
    nav: '/app/contacts',
  },
  {
    title: 'Passo 2: Crie negócios',
    desc: 'Para cada lead importante, crie um negócio no Pipeline. Arraste entre estágios conforme avança na venda.',
    icon: '\uD83D\uDD04',
    color: '#f59e0b',
    nav: '/app/deals',
  },
  {
    title: 'Passo 3: Registre atividades',
    desc: 'Ligou? Mandou email? Marcou reunião? Registre aqui para nunca perder o histórico de contato.',
    icon: '\uD83D\uDCC5',
    color: '#ec4899',
    nav: '/app/activities',
  },
  {
    title: 'Passo 4: Automatize tudo',
    desc: 'Crie regras como "quando ganhar negócio, criar follow-up em 3 dias". Assim nada passa batido.',
    icon: '\u26A1',
    color: '#8b5cf6',
    nav: '/app/automations',
  },
  {
    title: 'Pronto para vender!',
    desc: 'Acesse o Dashboard para ver suas métricas. Quanto mais dados inserir, mais inteligente o CRM fica!',
    icon: '\uD83D\uDCC8',
    color: '#06b6d4',
    nav: '/app',
  },
];

export default function Onboarding({ onComplete }) {
  const [current, setCurrent] = useState(0);
  const [closing, setClosing] = useState(false);
  const navigate = useNavigate();
  const step = steps[current];

  const handleNext = () => {
    if (current < steps.length - 1) {
      setCurrent(current + 1);
    } else {
      setClosing(true);
      setTimeout(() => {
        localStorage.setItem('onboarding_done', '1');
        if (onComplete) onComplete();
      }, 300);
    }
  };

  const handleSkip = () => {
    setClosing(true);
    setTimeout(() => {
      localStorage.setItem('onboarding_done', '1');
      if (onComplete) onComplete();
    }, 300);
  };

  const handleGo = () => {
    if (step.nav) navigate(step.nav);
    setClosing(true);
    setTimeout(() => {
      localStorage.setItem('onboarding_done', '1');
      if (onComplete) onComplete();
    }, 300);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: closing ? 0 : 1, transition: 'opacity 0.3s',
    }}>
      <div style={{
        background: 'white', borderRadius: 20, padding: 40, maxWidth: 480, width: '90%',
        textAlign: 'center', transform: closing ? 'scale(0.9)' : 'scale(1)', transition: 'transform 0.3s',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', background: step.color + '15',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, margin: '0 auto 20px',
        }}>{step.icon}</div>

        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>{step.title}</h2>
        <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6, marginBottom: 28 }}>{step.desc}</p>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: i === current ? 24 : 8, height: 8, borderRadius: 4,
              background: i === current ? step.color : '#e2e8f0',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={handleSkip} style={{
            padding: '10px 20px', border: '1px solid #e2e8f0', borderRadius: 8,
            background: 'white', color: '#64748b', fontSize: 14, cursor: 'pointer',
          }}>Pular Tutorial</button>

          {step.nav && (
            <button onClick={handleGo} style={{
              padding: '10px 20px', border: 'none', borderRadius: 8,
              background: step.color + '15', color: step.color, fontSize: 14,
              fontWeight: 600, cursor: 'pointer',
            }}>Ver Agora</button>
          )}

          <button onClick={handleNext} style={{
            padding: '10px 24px', border: 'none', borderRadius: 8,
            background: step.color, color: 'white', fontSize: 14,
            fontWeight: 600, cursor: 'pointer',
          }}>{current === steps.length - 1 ? 'Comecar!' : 'Proximo'}</button>
        </div>
      </div>
    </div>
  );
}
