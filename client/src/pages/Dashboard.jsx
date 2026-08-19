import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatDisplay } from '../components/CurrencyInput';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { api.get('/dashboard').then(res => setData(res.data)); }, []);

  if (!data) return <p>Carregando...</p>;

  const formatCurrency = (v) => formatDisplay(v);

  const stageColors = { lead: '#3b82f6', prospect: '#f59e0b', negotiation: '#ec4899', won: '#10b981', lost: '#ef4444' };
  const stageLabels = { lead: 'Lead', prospect: 'Prospect', negotiation: 'Negociação', won: 'Ganho', lost: 'Perdido' };

  const maxStageValue = Math.max(...(data.dealsByStage || []).map(s => s.value), 1);

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/contacts')} style={{ cursor: 'pointer' }}>
          <div className="label">Contatos</div>
          <div className="value">{data.totalContacts}</div>
        </div>
        <div className="stat-card" onClick={() => navigate('/deals')} style={{ cursor: 'pointer' }}>
          <div className="label">Negócios Ativos</div>
          <div className="value info">{data.activeDeals}</div>
        </div>
        <div className="stat-card">
          <div className="label">Pipeline Total</div>
          <div className="value">{formatCurrency(data.totalValue)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Vendas Fechadas</div>
          <div className="value success">{formatCurrency(data.wonValue)}</div>
        </div>
        <div className="stat-card" onClick={() => navigate('/activities')} style={{ cursor: 'pointer' }}>
          <div className="label">Atividades Pendentes</div>
          <div className="value warning">{data.pendingActivities}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ marginBottom: 20, fontSize: 16 }}>Pipeline por Estágio</h3>
          {(data.dealsByStage || []).length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Nenhum negócio ainda</p>
          ) : (
            (data.dealsByStage || []).map(s => (
              <div key={s.stage} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{stageLabels[s.stage] || s.stage}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.count} · {formatCurrency(s.value)}</span>
                </div>
                <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(s.value / maxStageValue) * 100}%`, background: stageColors[s.stage] || '#999', borderRadius: 4, transition: 'width 0.5s' }}></div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>Negócios Recentes</h3>
          {(data.recentDeals || []).length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Nenhum negócio ainda</p>
          ) : (
            data.recentDeals.map(d => (
              <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{d.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{d.contact_name || 'Sem contato'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>{formatCurrency(d.value)}</span>
                  <div><span className={`badge badge-${d.stage}`} style={{ fontSize: 10 }}>{stageLabels[d.stage]}</span></div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>Contatos Recentes</h3>
          {(data.recentContacts || []).length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Nenhum contato ainda</p>
          ) : (
            data.recentContacts.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.company || 'Sem empresa'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: c.score > 60 ? '#d1fae5' : c.score > 30 ? '#fef3c7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: c.score > 60 ? '#047857' : c.score > 30 ? '#d97706' : '#dc2626' }}>
                    {c.score}
                  </div>
                  <span className={`badge badge-${c.status}`}>{c.status}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>Score de Lead</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            O score é calculado automaticamente baseado em: dados cadastrais, negócios vinculados e atividades realizadas.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div style={{ textAlign: 'center', padding: 16, background: '#d1fae5', borderRadius: 8 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#047857' }}>
                {(data.recentContacts || []).filter(c => c.score > 60).length}
              </div>
              <div style={{ fontSize: 12, color: '#047857' }}>Quentes</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: '#fef3c7', borderRadius: 8 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#d97706' }}>
                {(data.recentContacts || []).filter(c => c.score > 30 && c.score <= 60).length}
              </div>
              <div style={{ fontSize: 12, color: '#d97706' }}>Mornos</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: '#fee2e2', borderRadius: 8 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#dc2626' }}>
                {(data.recentContacts || []).filter(c => c.score <= 30).length}
              </div>
              <div style={{ fontSize: 12, color: '#dc2626' }}>Frios</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
