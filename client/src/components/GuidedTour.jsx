import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const tourSteps = [
  {
    target: 'nav-dashboard',
    title: 'Dashboard',
    desc: 'Aqui voce ve todas as metricas: negocios ativos, valor do pipeline, vendas fechadas e atividades pendentes.',
    nav: '/app',
    position: 'right',
  },
  {
    target: 'nav-contacts',
    title: 'Contatos',
    desc: 'Gerencie todos os seus leads e clientes. Adicione tags, veja o score e filtre por status.',
    nav: '/app/contacts',
    position: 'right',
  },
  {
    target: 'nav-deals',
    title: 'Pipeline de Negocios',
    desc: 'Visualize seus negocios em formato Kanban. Arraste entre estagios para atualizar o status.',
    nav: '/app/deals',
    position: 'right',
  },
  {
    target: 'nav-activities',
    title: 'Atividades',
    desc: 'Registre ligacoes, emails, reunioes e tarefas. Marcando como concluido, o sistema atualiza automaticamente.',
    nav: '/app/activities',
    position: 'right',
  },
  {
    target: 'nav-tags',
    title: 'Tags',
    desc: 'Crie tags personalizadas para organizar seus contatos. Facilite buscas e filtragens.',
    nav: '/app/tags',
    position: 'right',
  },
  {
    target: 'nav-automations',
    title: 'Automacoes',
    desc: 'Crie regras inteligentes. Ex: ao ganhar negocio, criar follow-up em 3 dias. Trabalhe menos, venda mais.',
    nav: '/app/automations',
    position: 'right',
  },
  {
    target: 'nav-reports',
    title: 'Relatorios',
    desc: 'Analise sua performance: taxa de conversao, receita, motivos de perda e velocity do pipeline.',
    nav: '/app/reports',
    position: 'right',
  },
];

export default function GuidedTour({ onComplete }) {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const navigate = useNavigate();
  const tourRef = useRef(null);
  const step = tourSteps[current];

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  const handleNext = () => {
    if (current < tourSteps.length - 1) {
      setVisible(false);
      setTimeout(() => {
        navigate(step.nav);
        setTimeout(() => {
          setCurrent(current + 1);
          setVisible(true);
        }, 300);
      }, 200);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    setClosing(true);
    setTimeout(() => {
      localStorage.setItem('guided_tour_done', '1');
      if (onComplete) onComplete();
    }, 300);
  };

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 150,
        opacity: closing ? 0 : 1, transition: 'opacity 0.3s',
      }} onClick={handleFinish} />

      <div ref={tourRef} style={{
        position: 'fixed', top: '50%', right: 40, transform: `translateY(-50%) translateX(${visible ? 0 : 40}px)`,
        opacity: visible && !closing ? 1 : 0, transition: 'all 0.3s',
        background: 'white', borderRadius: 16, padding: 28, width: 320,
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)', zIndex: 151,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>Passo {current + 1} de {tourSteps.length}</span>
          <button onClick={handleFinish} style={{
            background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#94a3b8',
          }}>x</button>
        </div>

        <div style={{
          width: 48, height: 48, borderRadius: 12, background: '#ede9fe',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, marginBottom: 16, fontWeight: 700, color: '#4f46e5',
        }}>{current + 1}</div>

        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{step.title}</h3>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>{step.desc}</p>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleFinish} style={{
            flex: 1, padding: '10px 0', border: '1px solid #e2e8f0', borderRadius: 8,
            background: 'white', color: '#64748b', fontSize: 13, cursor: 'pointer',
          }}>Pular</button>
          <button onClick={handleNext} style={{
            flex: 1, padding: '10px 0', border: 'none', borderRadius: 8,
            background: '#4f46e5', color: 'white', fontSize: 13,
            fontWeight: 600, cursor: 'pointer',
          }}>{current === tourSteps.length - 1 ? 'Finalizar' : 'Proximo'}</button>
        </div>
      </div>
    </>
  );
}
