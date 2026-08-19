import { useState, useEffect } from 'react';
import api from '../services/api';

const TYPES = {
  call: { label: 'Ligação', icon: '\u260E' },
  email: { label: 'Email', icon: '\u2709' },
  meeting: { label: 'Reunião', icon: '\u2615' },
  task: { label: 'Tarefa', icon: '\u2611' },
};

export default function Activities() {
  const [activities, setActivities] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ type: 'call', title: '', description: '', contact_id: '', deal_id: '', due_date: '' });

  useEffect(() => {
    api.get('/activities').then(res => setActivities(res.data));
    api.get('/contacts').then(res => setContacts(res.data));
    api.get('/deals').then(res => setDeals(res.data));
  }, []);

  const loadActivities = () => api.get('/activities').then(res => setActivities(res.data));

  let filtered = filter === 'all' ? activities : activities.filter(a => a.completed === (filter === 'done' ? 1 : 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/activities', { ...form, contact_id: form.contact_id || null, deal_id: form.deal_id || null });
    setShowModal(false);
    setForm({ type: 'call', title: '', description: '', contact_id: '', deal_id: '', due_date: '' });
    loadActivities();
  };

  const toggleComplete = async (activity) => {
    await api.put(`/activities/${activity.id}`, { completed: !activity.completed });
    loadActivities();
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover esta atividade?')) return;
    await api.delete(`/activities/${id}`);
    loadActivities();
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '-';
  const isOverdue = (d) => d && new Date(d) < new Date() && !d.completed;

  return (
    <div>
      <div className="page-header">
        <h1>Atividades</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nova Atividade</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[{ k: 'all', l: 'Todas' }, { k: 'pending', l: 'Pendentes' }, { k: 'done', l: 'Concluídas' }].map(f => (
          <button key={f.k} className={`btn btn-sm ${filter === f.k ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(f.k)}>{f.l}</button>
        ))}
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state"><h3>Nenhuma atividade</h3><p>Registre suas ligações, emails e reuniões</p></div>
        ) : (
          filtered.map(a => (
            <div key={a.id} className="activity-item" style={a.completed ? { opacity: 0.6 } : {}}>
              <div className={`activity-icon ${a.type}`}>
                {TYPES[a.type]?.icon}
              </div>
              <div className="activity-content">
                <h4 style={a.completed ? { textDecoration: 'line-through' } : {}}>
                  {a.title}
                </h4>
                <p>
                  {TYPES[a.type]?.label}
                  {a.contact_name && <span> · {a.contact_name}</span>}
                  {a.due_date && <span style={isOverdue(a) ? { color: 'var(--danger)', fontWeight: 600 } : {}}> · {formatDate(a.due_date)}</span>}
                </p>
                {a.description && <p style={{ marginTop: 4, fontSize: 13 }}>{a.description}</p>}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label className="checkbox-label">
                  <input type="checkbox" checked={!!a.completed} onChange={() => toggleComplete(a)} />
                </label>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(a.id)}>Excluir</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Nova Atividade</h2>
            <form onSubmit={handleSubmit}>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {Object.entries(TYPES).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
              </select>
              <input placeholder="Título *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              <textarea placeholder="Descrição" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <select value={form.contact_id} onChange={e => setForm({ ...form, contact_id: e.target.value })}>
                <option value="">Sem contato vinculado</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={form.deal_id} onChange={e => setForm({ ...form, deal_id: e.target.value })}>
                <option value="">Sem negócio vinculado</option>
                {deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
              <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
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
