import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

function useScrollAnimation() {
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    const el = ref.current;
    if (el) {
      const children = el.querySelectorAll('.animate-on-scroll');
      children.forEach((child) => observer.observe(child));
      if (el.classList.contains('animate-on-scroll')) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);
  return ref;
}

const features = [
  { icon: '\uD83D\uDCCA', title: 'Dashboard Inteligente', desc: 'Métricas em tempo real, pipeline visual e score de leads automático.', colorClass: 'lp-icon-contacts' },
  { icon: '\uD83D\uDD04', title: 'Pipeline Kanban', desc: 'Arraste e solte negócios entre estágios. Acompanhe cada etapa da venda.', colorClass: 'lp-icon-deals' },
  { icon: '\uD83D\uDC65', title: 'Gestão de Contatos', desc: 'Organize leads com tags, score e histórico completo de interações.', colorClass: 'lp-icon-automations' },
  { icon: '\u26A1', title: 'Automações', desc: 'Crie regras automáticas: follow-ups, movimentação de deals e tags.', colorClass: 'lp-icon-reports' },
  { icon: '\uD83D\uDCE8', title: 'Templates de Email', desc: 'Crie e reutilize templates para prospecção, follow-up e propostas.', colorClass: 'lp-icon-templates' },
  { icon: '\uD83D\uDCC8', title: 'Relatórios Avançados', desc: 'Taxa de conversão, receita mensal, motivos de perda e velocity do pipeline.', colorClass: 'lp-icon-tags' },
];

const plans = [
  {
    name: 'Starter', price: '0', period: '', desc: 'Para quem está começando',
    features: ['1 usuário', 'Até 50 contatos', 'Pipeline básico', '10 automações', 'Exportar CSV'],
    cta: 'Começar Grátis', featured: false,
  },
  {
    name: 'Pro', price: '49', period: '/mês', desc: 'Para times em crescimento',
    features: ['5 usuários', 'Contatos ilimitados', 'Automações ilimitadas', 'Templates de email', 'Relatórios avançados', 'Suporte prioritário', 'Importar CSV'],
    cta: 'Assinar Agora', featured: true,
  },
  {
    name: 'Enterprise', price: '149', period: '/mês', desc: 'Para empresas grandes',
    features: ['Usuários ilimitados', 'Tudo do Pro', 'API de integração', 'SSO / SAML', 'Auditoria de segurança', 'Gerente dedicado', 'SLA 99.9%'],
    cta: 'Falar com Vendas', featured: false,
  },
];

const faqs = [
  { q: 'Preciso de cartão de crédito?', a: 'Não! O plano Starter é 100% gratuito e não precisa de cartão.' },
  { q: 'Meus dados estão seguros?', a: 'Sim. Criptografia bcrypt, HTTPS, rate limiting e bloqueio de conta. Seus dados nunca são compartilhados.' },
  { q: 'Posso cancelar quando quiser?', a: 'Sim. Sem fidelidade. Cancele a qualquer momento pelo painel de configurações.' },
  { q: 'Funciona no celular?', a: 'Sim! O FlowCRM é responsivo e funciona em qualquer dispositivo.' },
  { q: 'Posso importar dados de outro CRM?', a: 'Sim! Importe contatos e negócios em formato CSV.' },
  { q: 'Como funcionam as automações?', a: 'Você cria regras do tipo "quando X acontecer, fazer Y". Ex: ao ganhar um negócio, criar follow-up em 3 dias.' },
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(null);
  const sectionRef = useScrollAnimation();
  const featuresRef = useScrollAnimation();
  const howRef = useScrollAnimation();
  const pricingRef = useScrollAnimation();
  const faqRef = useScrollAnimation();
  const ctaRef = useScrollAnimation();

  const steps = [
    { step: '1', title: 'Crie sua conta', desc: 'Cadastre-se grátis em 30 segundos. Sem cartão.' },
    { step: '2', title: 'Adicione seus leads', desc: 'Importe do CSV ou cadastre seus contatos.' },
    { step: '3', title: 'Configure automações', desc: 'Crie regras para follow-ups automáticos.' },
    { step: '4', title: 'Venda mais', desc: 'Acompanhe o pipeline e feche negócios.' },
  ];

  return (
    <div className="landing">
      <header className="lp-header">
        <div className="lp-container lp-header-inner">
          <div className="lp-logo">FlowCRM</div>
          <nav className="lp-nav">
            <a href="#features">Funcionalidades</a>
            <a href="#how">Como Funciona</a>
            <a href="#pricing">Planos</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="lp-header-actions">
            <Link to="/login" className="lp-btn lp-btn-ghost">Entrar</Link>
            <Link to="/register" className="lp-btn lp-btn-primary">Começar Gratis</Link>
          </div>
        </div>
      </header>

      <section className="lp-hero">
        <div className="lp-hero-glow"></div>
        <div className="lp-container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="lp-hero-badge">Novo: Automacoes inteligentes disponiveis</div>
          <h1 className="lp-hero-title">
            Feche mais negocios<br />
            <span className="lp-gradient-text">com menos esforco</span>
          </h1>
          <p className="lp-hero-sub">
            CRM feito para vendedores B2B brasileiros. Pipeline visual, automacoes, score de leads e relatorios que aumentam suas vendas.
          </p>
          <div className="lp-hero-cta">
            <Link to="/register" className="lp-btn lp-btn-primary lp-btn-lg">Comece Gratis Agora</Link>
            <a href="#features" className="lp-btn lp-btn-outline lp-btn-lg">Ver Funcionalidades</a>
          </div>
          <div className="lp-hero-proof">
            <div className="lp-avatars">
              <div className="lp-avatar lp-avatar-1">M</div>
              <div className="lp-avatar lp-avatar-2">A</div>
              <div className="lp-avatar lp-avatar-3">R</div>
              <div className="lp-avatar lp-avatar-4">+</div>
            </div>
            <span>Junte-se a <strong>2.500+ vendedores</strong> que ja aumentaram suas vendas</span>
          </div>
        </div>
      </section>

      <section className="lp-logos" ref={sectionRef}>
        <div className="lp-container">
          <p className="lp-logos-title animate-on-scroll">Empresas que confiam no FlowCRM</p>
          <div className="lp-logos-row">
            {['TechBR', 'SalesPro', 'VendaMax', 'B2B Hub', 'DealFlow', 'CRM+'].map((name, i) => (
              <span key={i} className={`lp-logo-item animate-on-scroll animate-delay-${i + 1}`}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="lp-features" ref={featuresRef}>
        <div className="lp-container">
          <div className="lp-section-header animate-on-scroll">
            <span className="lp-section-badge">Funcionalidades</span>
            <h2>Tudo que voce precisa para vender mais</h2>
            <p>Ferramentas poderosas e simples. Sem complicacao.</p>
          </div>
          <div className="lp-features-grid">
            {features.map((f, i) => (
              <div key={i} className={`lp-feature-card animate-on-scroll animate-delay-${i + 1}`}>
                <div className={`lp-feature-icon ${f.colorClass}`}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="lp-how" ref={howRef}>
        <div className="lp-container">
          <div className="lp-section-header animate-on-scroll">
            <span className="lp-section-badge">Como Funciona</span>
            <h2>4 passos para comecar a vender mais</h2>
            <p>Do cadastro ao primeiro negocio fechado em minutos.</p>
          </div>
          <div className="lp-steps">
            {steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div className={`lp-step animate-on-scroll animate-delay-${i + 1}`}>
                  <div className="lp-step-num">{s.step}</div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
                {i < 3 && <span className="lp-step-arrow">&rarr;</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="lp-pricing" ref={pricingRef}>
        <div className="lp-container">
          <div className="lp-section-header animate-on-scroll">
            <span className="lp-section-badge">Planos</span>
            <h2>Planos para cada fase</h2>
            <p>Comece gratis. Evolua quando precisar.</p>
          </div>
          <div className="lp-pricing-grid">
            {plans.map((p, i) => (
              <div key={i} className={`lp-price-card animate-on-scroll animate-delay-${i + 1} ${p.featured ? 'lp-price-card-featured' : ''}`}>
                {p.featured && <div className="lp-price-popular">Mais Popular</div>}
                <h3>{p.name}</h3>
                <div className="lp-price">
                  {p.price === '0' ? (
                    <span className="lp-price-value" style={{ fontSize: 40 }}>Gratis</span>
                  ) : (
                    <>
                      <span className="lp-price-currency">R$</span>
                      <span className="lp-price-value">{p.price}</span>
                      <span className="lp-price-period">{p.period}</span>
                    </>
                  )}
                </div>
                <p className="lp-price-desc">{p.desc}</p>
                <ul className="lp-price-features">
                  {p.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: p.featured ? '#4f46e5' : '#10b981', fontWeight: 700 }}>&#10003;</span> {f}
                    </li>
                  ))}
                </ul>
                <Link to={p.price === '0' ? '/register' : '/register'} className={`lp-btn lp-btn-block ${p.featured ? 'lp-btn-primary' : 'lp-btn-outline'}`}>{p.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="lp-pricing" ref={faqRef} style={{ background: 'var(--bg)' }}>
        <div className="lp-container">
          <div className="lp-section-header animate-on-scroll">
            <span className="lp-section-badge">FAQ</span>
            <h2>Perguntas Frequentes</h2>
          </div>
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            {faqs.map((f, i) => (
              <div key={i} className={`animate-on-scroll animate-delay-${i + 1}`} style={{ marginBottom: 8 }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', padding: '18px 20px', background: 'white', border: '1px solid #e2e8f0',
                    borderRadius: 10, textAlign: 'left', cursor: 'pointer', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center', fontSize: 15, fontWeight: 600,
                    color: '#1e293b', transition: 'all 0.2s',
                  }}
                >
                  {f.q}
                  <span style={{
                    fontSize: 20, transition: 'transform 0.3s', display: 'inline-block',
                    transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)', color: '#4f46e5',
                  }}>+</span>
                </button>
                <div style={{
                  maxHeight: openFaq === i ? 200 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease',
                  background: 'white', borderRadius: openFaq === i ? '0 0 10px 10px' : 0,
                  borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0',
                  borderBottom: openFaq === i ? '1px solid #e2e8f0' : 'none',
                }}>
                  <p style={{ padding: '16px 20px', fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{f.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-cta" ref={ctaRef}>
        <div className="lp-container">
          <div className="lp-cta-box animate-on-scroll">
            <h2>Pronto para vender mais?</h2>
            <p>Comece agora gratuitamente. Sem cartao, sem compromisso.</p>
            <Link to="/register" className="lp-btn lp-btn-primary lp-btn-lg">Criar Conta Gratis</Link>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-inner">
            <div className="lp-footer-brand">
              <div className="lp-logo" style={{ fontSize: 20 }}>FlowCRM</div>
              <p>CRM feito para vendedores B2B brasileiros. Aumente suas vendas com automacoes inteligentes.</p>
            </div>
            <div className="lp-footer-links">
              <div className="lp-footer-col">
                <h4>Produto</h4>
                <a href="#features">Funcionalidades</a>
                <a href="#pricing">Planos</a>
                <a href="#how">Como Funciona</a>
                <a href="#faq">FAQ</a>
              </div>
              <div className="lp-footer-col">
                <h4>Legal</h4>
                <a href="#">Privacidade</a>
                <a href="#">Termos de Uso</a>
                <a href="#">LGPD</a>
              </div>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <p>&copy; 2026 FlowCRM. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
