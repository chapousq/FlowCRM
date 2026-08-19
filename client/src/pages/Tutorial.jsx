import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GuidedTour from '../components/GuidedTour';

const guides = [
  {
    id: 'dashboard',
    icon: '\uD83D\uDCCA',
    title: 'Dashboard',
    color: '#4f46e5',
    steps: [
      { title: 'O que e o Dashboard?', text: 'O Dashboard e sua tela principal. Aqui voce ve todas as metricas importantes do seu negocio em tempo real.' },
      { title: 'Cards de Metricas', text: 'No topo, voce ve: total de contatos, negocios ativos, valor do pipeline, vendas fechadas e atividades pendentes. Clique em qualquer card para ir direto para aquela secao.' },
      { title: 'Pipeline por Estagio', text: 'Ve a barra de progresso de cada estagio do funil. Quanto maior a barra, mais negocios naquela fase.' },
      { title: 'Negocios e Contatos Recentes', text: 'Logo abaixo, ve os ultimos negocios e contatos adicionados. Tambem ve o score de leads quentes, mornos e frios.' },
      { title: 'Dica PRO', text: 'Acesse o Dashboard todos os dias pela manha. E o primeiro passo para uma rotina de vendas produtiva!' },
    ],
    nav: '/app',
  },
  {
    id: 'contacts',
    icon: '\uD83D\uDC65',
    title: 'Contatos',
    color: '#10b981',
    steps: [
      { title: 'Adicionar Contato', text: 'Clique em "+ Novo Contato". Preencha nome (obrigatorio), email, telefone, empresa, cargo e valor estimado.' },
      { title: 'Score Automatico', text: 'O sistema calcula um score de 0 a 100 automaticamente. Quanto mais dados voce preencher, maior o score. Contatos com score alto sao "quentes" e devem ser priorizados.' },
      { title: 'Filtros e Busca', text: 'Use a barra de busca para encontrar por nome, empresa ou email. Filtre por status (Lead, Prospect, Negociacao, Ganho, Perdido). Ordene por score, valor ou nome.' },
      { title: 'Tags', text: 'Crie tags para organizar seus contatos. Ex: "VIP", "Urgente", "Retorno". Clique no "+" ao lado das tags para adicionar.' },
      { title: 'Importar e Exportar', text: 'Importe contatos de outro sistema via CSV. Exporte sua lista a qualquer momento. Formato: Nome, Email, Telefone, Empresa, Cargo, Status, Valor.' },
      { title: 'Detalhe do Contato', text: 'Clique no nome de qualquer contato para ver todos os dados, negocios vinculados e historico de atividades.' },
      { title: 'Dica PRO', text: 'Preencha TODOS os campos. Quanto mais informacao, maior o score e melhor sua taxa de conversao!' },
    ],
    nav: '/app/contacts',
  },
  {
    id: 'deals',
    icon: '\uD83D\uDD04',
    title: 'Pipeline de Negocios',
    color: '#f59e0b',
    steps: [
      { title: 'Visao Kanban', text: 'Seus negocios aparecem em colunas: Lead, Prospect, Negociacao, Ganho, Perdido. E como um quadro Trello para vendas.' },
      { title: 'Criar Negocio', text: 'Clique em "+ Novo Negocio". De um titulo, vincule a um contato, defina valor, estagio e data esperada de fechamento.' },
      { title: 'Mover Negocios', text: 'Para avancar um negocio, clique no botao do proximo estagio. Ex: de Lead para Prospect. O sistema salva o historico de mudancas.' },
      { title: 'Fechar Ganho ou Perdido', text: 'Quando fechar, marque como "Ganho" ou "Perdido". Se perder, o sistema vai pedir o motivo (preco, concorrencia, etc). Isso gera dados para os relatorios.' },
      { title: 'Detalhe e Historico', text: 'Clique no titulo de qualquer negocio para ver detalhes completos, incluindo historico de mudancas de estagio com data e hora.' },
      { title: 'Dica PRO', text: 'Mova negocios regularmente. Um negocio parado ha mais de 14 dias provavelmente precisa de uma acao urgente!' },
    ],
    nav: '/app/deals',
  },
  {
    id: 'activities',
    icon: '\uD83D\uDCC5',
    title: 'Atividades',
    color: '#ec4899',
    steps: [
      { title: 'Tipos de Atividade', text: 'Registre 4 tipos: Ligacao, Email, Reuniao e Tarefa. Cada tipo tem sua cor e icone para identificacao rapida.' },
      { title: 'Criar Atividade', text: 'Clique em "+ Nova Atividade". Escolha o tipo, de um titulo, vincule a um contato e/ou negocio, e defina a data.' },
      { title: 'Concluir Atividades', text: 'Marque a checkbox ao lado para concluir. Atividades atrasadas aparecem destacadas em vermelho. Nunca deixe nada passar!' },
      { title: 'Vincular a Negocios', text: 'Quando vincular uma atividade a um negocio, o historico fica organizado. Veja todas as acoes feitas naquele negocio.' },
      { title: 'Filtros', text: 'Filtre entre "Todas", "Pendentes" e "Concluidas". Focar nas pendentes e a chave para nao perder follow-ups.' },
      { title: 'Dica PRO', text: 'Registre TODA interacao. Quando fechar um negocio, voce tera o historico completo. Isso gera confianca e ajuda a repetir o que funciona.' },
    ],
    nav: '/app/activities',
  },
  {
    id: 'automations',
    icon: '\u26A1',
    title: 'Automacoes',
    color: '#8b5cf6',
    steps: [
      { title: 'O que sao Automacoes', text: 'Automacoes sao regras que executam sozinhas quando algo acontece. Exemplo: "Quando ganhar negocio, criar follow-up em 3 dias".' },
      { title: 'Triggers (Quando)', text: 'Escolha o gatilho: Novo contato, Novo negocio, Negocio ganho, Negocio perdido, ou Mudanca de estagio.' },
      { title: 'Acoes (Fazer)', text: 'Escolha a acao: Criar follow-up, Mover estagio, Adicionar tag, ou Criar novo negocio. Configure os detalhes.' },
      { title: 'Ativar e Desativar', text: 'Clique no botao "Ativa/Inativa" para ligar ou desligar qualquer automacao sem apagar.' },
      { title: 'Exemplos Reais', text: '1) Novo contato -> Adicionar tag "Novo Lead"\n2) Negocio ganho -> Criar follow-up em 7 dias\n3) Estagio Negotiation -> Criar tarefa "Preparar proposta"' },
      { title: 'Dica PRO', text: 'Comece com 2-3 automacoes simples. Depois va adicionando conforme identificar gargalos na sua rotina de vendas.' },
    ],
    nav: '/app/automations',
  },
  {
    id: 'reports',
    icon: '\uD83D\uDCC8',
    title: 'Relatorios',
    color: '#06b6d4',
    steps: [
      { title: 'Visao Geral', text: 'Ve sua taxa de conversao, total de negocios ganhos/perdidos, ticket medio e valor total.' },
      { title: 'Receita Mensal', text: 'Acompanhe a receita mes a mes. Ve quantos negocios foram fechados e o valor total de cada mes.' },
      { title: 'Motivos de Perda', text: 'Analise por que negocios sao perdidos: preco, concorrencia, timing, etc. Use isso para melhorar sua abordagem.' },
      { title: 'Top Contatos', text: 'Ve quais contatos geram mais valor. Priorize-os nas suas vendas.' },
      { title: 'Atividades por Tipo', text: 'Analise quantas ligacoes, emails e reunioes voce faz. Compare com a taxa de conversao para otimizar.' },
      { title: 'Velocidade do Pipeline', text: 'Ve quantos dias em media cada contato fica em cada estagio. Identifique onde estao os gargalos.' },
      { title: 'Exportar', text: 'Exporte contatos ou negocios em CSV para analisar no Excel ou importar em outro sistema.' },
      { title: 'Dica PRO', text: 'Revise os relatorios toda sexta-feira. Identifique padroes e ajuste sua estrategia para a proxima semana.' },
    ],
    nav: '/app/reports',
  },
  {
    id: 'getting-clients',
    icon: '\uD83D\uDCBC',
    title: 'Como Conseguir Clientes',
    color: '#4f46e5',
    steps: [
      { title: '1. Defina seu Publico', text: 'Identifique quem sao seus clientes ideais: empresa, porte, cargo do decisor. Foque em nichos onde voce tem mais credibilidade.' },
      { title: '2. Use o Score de Leads', text: 'Comece pelos contatos com score mais alto. Sao os que ja tem mais dados e interacoes. E mais facil converter leads "quentes".' },
      { title: '3. Sequencia de Contato', text: 'Crie uma rotina:\nDia 1: Ligacao de apresentacao\nDia 3: Email com proposta\nDia 7: Follow-up\nDia 14: Ultima tentativa' },
      { title: '4. Automatize o Follow-up', text: 'Crie uma automacao: "Novo contato -> Criar atividade de ligacao em 1 dia". Assim voce nunca esquece de ligar.' },
      { title: '5. Use Templates', text: 'Crie templates de email para cada etapa: apresentacao, proposta, follow-up, agradecimento. Economize tempo e seja consistente.' },
      { title: '6. Analise e Repita', text: 'Veja nos relatorios o que funciona: qual tipo de atividade gera mais vendas? Qual estagio tem mais perda? Ajuste e repita.' },
      { title: '7. Indicacao e Networking', text: 'Peca indicacoes a clientes satisfeitos. Registre os indicadores como novos contatos com fonte "Indicacao". Taxa de conversao de indicacao e 3x maior!' },
      { title: 'Dica FINAL', text: 'Consistencia vence talento. Contate 5 novos leads por dia, registre todas as atividades, e revise seus relatorios toda semana. Em 90 dias voce vera resultados reais.' },
    ],
    nav: '/app/contacts',
  },
];

export default function Tutorial() {
  const [selected, setSelected] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStartGuide = (guide) => {
    setSelected(guide);
    setStepIndex(0);
  };

  const handleNextStep = () => {
    if (stepIndex < selected.steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      navigate(selected.nav);
      setSelected(null);
    }
  };

  const handlePrevStep = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const shouldShowOnboarding = user && !localStorage.getItem('onboarding_done');

  return (
    <div>
      {shouldShowOnboarding && (
        <OnboardingWrapper onComplete={() => {}} />
      )}

      {showTour && <GuidedTour onComplete={() => setShowTour(false)} />}

      <div className="page-header">
        <h1>Central de Ajuda</h1>
        <button className="btn btn-primary" onClick={() => setShowTour(true)}>
          Iniciar Tour Guiado
        </button>
      </div>

      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 40 }}>{'\uD83D\uDCDA'}</div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Aprenda a usar o FlowCRM</h2>
            <p style={{ fontSize: 14, opacity: 0.85, lineHeight: 1.6 }}>
              Siga os guias abaixo passo a passo. Cada um ensina uma funcionalidade completa com dicas profissionais para vender mais.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {guides.map((g) => (
          <div key={g.id} className="card" style={{ cursor: 'pointer', transition: 'all 0.2s', borderLeft: `4px solid ${g.color}` }}
            onClick={() => handleStartGuide(g)}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 28 }}>{g.icon}</div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{g.title}</h3>
                <span style={{ fontSize: 12, color: '#64748b' }}>{g.steps.length} passos</span>
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{g.steps[0].text.slice(0, 80)}...</p>
            <div style={{ marginTop: 12, display: 'flex', gap: 4 }}>
              {g.steps.map((_, i) => (
                <div key={i} style={{ width: 16, height: 3, borderRadius: 2, background: '#e2e8f0' }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 28 }}>{selected.icon}</div>
                <div>
                  <h2 style={{ fontSize: 18, marginBottom: 0 }}>{selected.title}</h2>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Passo {stepIndex + 1} de {selected.steps.length}</span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>x</button>
            </div>

            <div style={{ display: 'flex', gap: 4, margin: '16px 0' }}>
              {selected.steps.map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 4, borderRadius: 2,
                  background: i <= stepIndex ? selected.color : '#e2e8f0',
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 20, marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{selected.steps[stepIndex].title}</h3>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                {selected.steps[stepIndex].text}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline" onClick={handlePrevStep} disabled={stepIndex === 0} style={{ opacity: stepIndex === 0 ? 0.5 : 1 }}>
                Anterior
              </button>
              <button className="btn btn-primary" style={{ flex: 1, background: selected.color }} onClick={handleNextStep}>
                {stepIndex === selected.steps.length - 1 ? 'Ir para ' + selected.title : 'Proximo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OnboardingWrapper({ onComplete }) {
  const [show, setShow] = useState(true);
  if (!show) return null;
  return <Onboarding onComplete={() => { setShow(false); onComplete(); }} />;
}
