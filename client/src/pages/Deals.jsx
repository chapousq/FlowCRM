import { useState, useEffect } from 'react';
import api from '../services/api';
import CurrencyInput, { formatDisplay } from '../components/CurrencyInput';

const STAGES = [
  { key: 'lead', label: 'Lead', color: '#3b82f6' },
  { key: 'prospect', label: 'Prospect', color: '#f59e0b' },
  { key: 'negotiation', label: 'Negociação', color: '#ec4899' },
  { key: 'won', label: 'Ganho', color: '#10b981' },
  { key: 'lost', label: 'Perdido', color: '#ef4444' },
];

export default function Deals() {
  const [deals, setDeals] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', contact_id: '', value: '', stage: 'lead', probability: 10, expected_close: '', notes: '', loss_reason: '' });

  useEffect(() => {
    api.get('/deals').then(res => setDeals(res.data));
    api.get('/contacts').then(res => setContacts(res.data));
  }, []);

  const loadDeals = () => api.get('/deals').then(res => setDeals(res.data));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, value: form.value ? parseFloat(form.value) : 0, probability: parseInt(form.probability), contact_id: form.contact_id || null };
    if (editing) {
      await api.put(`/deals/${editing.id}`, payload);
    } else {
      await api.post('/deals', payload);
    }
    setShowModal(false);
    setEditing(null);
    resetForm();
    loadDeals();
  };

  const resetForm = () => setForm({ title: '', contact_id: '', value: '', stage: 'lead', probability: 10, expected_close: '', notes: '', loss_reason: '' });

  const handleEdit = (deal) => {
    setEditing(deal);
    setForm({ title: deal.title, contact_id: deal.contact_id || '', value: deal.value || '', stage: deal.stage, probability: deal.probability, expected_close: deal.expected_close || '', notes: deal.notes || '', loss_reason: deal.loss_reason || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover este negócio?')) return;
    await api.delete(`/deals/${id}`);
    loadDeals();
  };

  const moveDeal = async (deal, newStage) => {
    const payload = { stage: newStage };
    if (newStage === 'lost') {
      const reason = prompt('Motivo da perda (opcional):');
      payload.loss_reason = reason || '';
    }
    await api.put(`/deals/${deal.id}`, payload);
    loadDeals();
  };

  const handleViewDetail = async (deal) => {
    const res = await api.get(`/deals/${deal.id}`);
    setShowDetail(res.data);
  };

  const openNew = () => { resetForm(); setEditing(null); setShowModal(true); };
  const formatCurrency = (v) => formatDisplay(v);

  const totalByStage = (stage) => deals.filter(d => d.stage === stage).reduce((s, d) => s + (d.value || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h1>Negócios</h1>
        <button className="btn btn-primary" onClick={openNew}>+ Novo Negócio</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {STAGES.map(s => (
          <div key={s.key} style={{ padding: '10px 16px', background: s.color + '15', borderRadius: 8, border: `1px solid ${s.color}30` }}>
            <div style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{formatCurrency(totalByStage(s.key))}</div>
          </div>
        ))}
      </div>

      <div className="kanban">
        {STAGES.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage.key);
          return (
            <div key={stage.key} className="kanban-column">
              <h3>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color, display: 'inline-block' }}></span>
                {stage.label}
                <span className="count">{stageDeals.length}</span>
              </h3>
              {stageDeals.map(deal => (
                <div key={deal.id} className="kanban-card">
                  <h4 style={{ cursor: 'pointer' }} onClick={() => handleViewDetail(deal)}>{deal.title}</h4>
                  <div className="deal-value">{formatCurrency(deal.value)}</div>
                  <div className="deal-info">
                    {deal.contact_name && <span>{deal.contact_name}</span>}
                    {deal.probability > 0 && <span> · {deal.probability}%</span>}
                    {deal.expected_close && <span> · {new Date(deal.expected_close).toLocaleDateString('pt-BR')}</span>}
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {STAGES.filter(s => s.key !== deal.stage).slice(0, 2).map(s => (
                      <button key={s.key} className="btn btn-sm btn-outline" onClick={() => moveDeal(deal, s.key)}>
                        {s.label}
                      </button>
                    ))}
                    <button className="btn btn-sm btn-outline" onClick={() => handleEdit(deal)}>Editar</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(deal.id)}>Excluir</button>
                  </div>
                </div>
              ))}
              {stageDeals.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                  Nenhum negócio
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editing ? 'Editar Negócio' : 'Novo Negócio'}</h2>
            <form onSubmit={handleSubmit}>
              <input placeholder="Título do negócio *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              <select value={form.contact_id} onChange={e => setForm({ ...form, contact_id: e.target.value })}>
                <option value="">Sem contato vinculado</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name} - {c.company || 'Sem empresa'}</option>)}
              </select>
              <CurrencyInput value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} />
              <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>
                {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <input type="number" placeholder="Probabilidade %" value={form.probability} onChange={e => setForm({ ...form, probability: e.target.value })} min={0} max={100} />
              <input type="date" value={form.expected_close} onChange={e => setForm({ ...form, expected_close: e.target.value })} />
              <textarea placeholder="Notas" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              {form.stage === 'lost' && <input placeholder="Motivo da perda" value={form.loss_reason} onChange={e => setForm({ ...form, loss_reason: e.target.value })} />}
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Salvar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{showDetail.title}</h2>
            <div style={{ display: 'grid', gap: 10, fontSize: 14, marginBottom: 20 }}>
              <div><strong>Contato:</strong> {showDetail.contact_name || '-'}</div>
              <div><strong>Empresa:</strong> {showDetail.contact_company || '-'}</div>
              <div><strong>Valor:</strong> {formatCurrency(showDetail.value)}</div>
              <div><strong>Estágio:</strong> <span className={`badge badge-${showDetail.stage}`}>{showDetail.stage}</span></div>
              <div><strong>Probabilidade:</strong> {showDetail.probability}%</div>
              <div><strong>Fechamento:</strong> {showDetail.expected_close ? new Date(showDetail.expected_close).toLocaleDateString('pt-BR') : '-'}</div>
              <div><strong>Notas:</strong> {showDetail.notes || '-'}</div>
              {showDetail.loss_reason && <div><strong>Motivo perda:</strong> {showDetail.loss_reason}</div>}
            </div>
            {(showDetail.history || []).length > 0 && (
              <div>
                <h3 style={{ fontSize: 14, marginBottom: 12 }}>Histórico de Estágios</h3>
                {showDetail.history.map((h, i) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{new Date(h.changed_at).toLocaleString('pt-BR')}</span>
                    {' → '}
                    <span style={{ fontWeight: 500 }}>{h.new_stage}</span>
                    {h.old_stage && <span style={{ color: 'var(--text-secondary)' }}> (era: {h.old_stage})</span>}
                  </div>
                ))}
              </div>
            )}
            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button className="btn btn-primary" onClick={() => setShowDetail(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
