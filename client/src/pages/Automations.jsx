import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Automations() {
  const [automations, setAutomations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', trigger_type: 'new_deal', trigger_value: '', action_type: 'create_followup', action_value: '' });

  useEffect(() => { loadAutomations(); }, []);
  const loadAutomations = () => api.get('/automations').then(res => setAutomations(res.data));

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/automations', form);
    setShowModal(false);
    setForm({ name: '', trigger_type: 'new_deal', trigger_value: '', action_type: 'create_followup', action_value: '' });
    loadAutomations();
  };

  const toggleAutomation = async (id) => {
    await api.put(`/automations/${id}/toggle`);
    loadAutomations();
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover esta automação?')) return;
    await api.delete(`/automations/${id}`);
    loadAutomations();
  };

  const triggers = [
    { value: 'new_deal', label: 'Novo negócio criado' },
    { value: 'new_contact', label: 'Novo contato adicionado' },
    { value: 'deal_won', label: 'Negócio ganho' },
    { value: 'deal_lost', label: 'Negócio perdido' },
    { value: 'stage_changed', label: 'Estágio alterado' },
  ];

  const actions = [
    { value: 'create_followup', label: 'Criar follow-up automático', needsValue: true, placeholder: 'Dias para follow-up (ex: 3)' },
    { value: 'move_stage', label: 'Mover para estágio', needsValue: true, placeholder: 'Estágio destino (ex: prospect)' },
    { value: 'add_tag', label: 'Adicionar tag ao contato', needsValue: true, placeholder: 'Nome da tag' },
    { value: 'create_deal', label: 'Criar novo negócio', needsValue: true, placeholder: 'Estágio inicial (ex: lead)' },
  ];

  const triggerLabels = Object.fromEntries(triggers.map(t => [t.value, t.label]));
  const actionLabels = Object.fromEntries(actions.map(a => [a.value, a.label]));

  return (
    <div>
      <div className="page-header">
        <h1>Automações</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nova Automação</button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>Como funciona?</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Automações executam ações automaticamente quando algo acontece no CRM. Exemplo: quando um negócio é ganho, criar um follow-up automático para 3 dias depois.
          </p>
        </div>
      </div>

      {automations.length === 0 ? (
        <div className="card empty-state"><h3>Nenhuma automação criada</h3><p>Crie automações para trabalhar menos</p></div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {automations.map(a => (
            <div key={a.id} className="card" style={{ opacity: a.enabled ? 1 : 0.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: 15, marginBottom: 4 }}>{a.name}</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--info)' }}>QUANDO:</span> {triggerLabels[a.trigger_type] || a.trigger_type}
                    {a.trigger_value && ` (${a.trigger_value})`}
                    {' → '}
                    <span style={{ color: 'var(--success)' }}>FAZER:</span> {actionLabels[a.action_type] || a.action_type}
                    {a.action_value && ` (${a.action_value})`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button className={`btn btn-sm ${a.enabled ? 'btn-primary' : 'btn-outline'}`} onClick={() => toggleAutomation(a.id)}>
                    {a.enabled ? 'Ativa' : 'Inativa'}
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(a.id)}>Excluir</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Nova Automação</h2>
            <form onSubmit={handleSubmit}>
              <input placeholder="Nome *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>QUANDO (Trigger)</label>
                <select value={form.trigger_type} onChange={e => setForm({ ...form, trigger_type: e.target.value })}>
                  {triggers.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                {form.trigger_type === 'stage_changed' && (
                  <input placeholder="Estágio (ex: negotiation)" value={form.trigger_value} onChange={e => setForm({ ...form, trigger_value: e.target.value })} />
                )}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>FAZER (Ação)</label>
                <select value={form.action_type} onChange={e => setForm({ ...form, action_type: e.target.value })}>
                  {actions.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
                {actions.find(a => a.value === form.action_type)?.needsValue && (
                  <input placeholder={actions.find(a => a.value === form.action_type).placeholder} value={form.action_value} onChange={e => setForm({ ...form, action_value: e.target.value })} />
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
