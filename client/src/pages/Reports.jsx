import { useState, useEffect } from 'react';
import api from '../services/api';
import { formatDisplay } from '../components/CurrencyInput';

export default function Reports() {
  const [data, setData] = useState(null);

  useEffect(() => { api.get('/reports/sales').then(res => setData(res.data)); }, []);

  if (!data) return <p>Carregando...</p>;

  const formatCurrency = (v) => formatDisplay(v);

  const handleExport = (type) => {
    const token = localStorage.getItem('token');
    fetch(`/api/reports/export/${type}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${type}.csv`; a.click();
        URL.revokeObjectURL(url);
      });
  };

  const maxRevenue = Math.max(...(data.monthlyRevenue || []).map(m => m.total), 1);

  return (
    <div>
      <div className="page-header">
        <h1>Relatórios</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => handleExport('contacts')}>Exportar Contatos</button>
          <button className="btn btn-outline" onClick={() => handleExport('deals')}>Exportar Negócios</button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="label">Taxa de Conversão</div>
          <div className="value success">{data.winRate}%</div>
        </div>
        <div className="stat-card">
          <div className="label">Negócios Ganhos</div>
          <div className="value">{data.wonCount}</div>
        </div>
        <div className="stat-card">
          <div className="label">Negócios Perdidos</div>
          <div className="value" style={{ color: 'var(--danger)' }}>{data.lostCount}</div>
        </div>
        <div className="stat-card">
          <div className="label">Ticket Médio</div>
          <div className="value info">{formatCurrency(data.avgDealValue)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>Receita Mensal</h3>
          {(data.monthlyRevenue || []).length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Nenhuma venda fechada ainda</p>
          ) : (
            data.monthlyRevenue.map(m => (
              <div key={m.month} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13 }}>{m.month}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(m.total)} ({m.count})</span>
                </div>
                <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(m.total / maxRevenue) * 100}%`, background: 'var(--success)', borderRadius: 4 }}></div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>Motivos de Perda</h3>
          {(data.lossReasons || []).length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Nenhum motivo registrado</p>
          ) : (
            data.lossReasons.map((l, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 14 }}>{l.loss_reason}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--danger)' }}>{l.count}x</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>Top Contatos por Valor</h3>
          {(data.topContacts || []).length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Nenhum contato ainda</p>
          ) : (
            data.topContacts.slice(0, 5).map((c, i) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-secondary)', width: 24 }}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.company || '-'} · {c.deal_count} negócios</div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>{formatCurrency(c.total_value)}</span>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>Atividades por Tipo</h3>
          {(data.activitiesSummary || []).length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Nenhuma atividade ainda</p>
          ) : (
            data.activitiesSummary.map(a => (
              <div key={a.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 14, textTransform: 'capitalize' }}>{a.type}</span>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{a.done}/{a.total}</span>
                  <div style={{ width: 60, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${a.total > 0 ? (a.done / a.total) * 100 : 0}%`, background: 'var(--success)', borderRadius: 3 }}></div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {(data.pipelineVelocity || []).length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>Velocidade do Pipeline</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Tempo médio (em dias) de cada contato no estágio</p>
          <div style={{ display: 'flex', gap: 16 }}>
            {data.pipelineVelocity.map(p => (
              <div key={p.stage} style={{ flex: 1, textAlign: 'center', padding: 16, background: 'var(--bg)', borderRadius: 8 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>{Math.round(p.avg_days || 0)}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{p.stage} ({p.count})</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
