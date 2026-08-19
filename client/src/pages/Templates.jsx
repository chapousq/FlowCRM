import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', subject: '', body: '', category: 'geral' });

  useEffect(() => { loadTemplates(); }, []);
  const loadTemplates = () => api.get('/templates').then(res => setTemplates(res.data));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await api.put(`/templates/${editing.id}`, form);
    } else {
      await api.post('/templates', form);
    }
    setShowModal(false);
    setEditing(null);
    setForm({ name: '', subject: '', body: '', category: 'geral' });
    loadTemplates();
  };

  const handleEdit = (t) => {
    setEditing(t);
    setForm({ name: t.name, subject: t.subject, body: t.body, category: t.category });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover este template?')) return;
    await api.delete(`/templates/${id}`);
    loadTemplates();
  };

  const copyToClipboard = (text) => navigator.clipboard.writeText(text);

  const categories = ['geral', 'prospecção', 'follow-up', 'proposta', 'agradecimento'];

  return (
    <div>
      <div className="page-header">
        <h1>Templates de Email</h1>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ name: '', subject: '', body: '', category: 'geral' }); setShowModal(true); }}>+ Novo Template</button>
      </div>

      {templates.length === 0 ? (
        <div className="card empty-state"><h3>Nenhum template criado</h3><p>Crie templates para agilizar seu atendimento</p></div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {templates.map(t => (
            <div key={t.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, marginBottom: 4 }}>{t.name}</h3>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg)', padding: '2px 8px', borderRadius: 4 }}>{t.category}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm btn-outline" onClick={() => copyToClipboard(t.body)}>Copiar</button>
                  <button className="btn btn-sm btn-outline" onClick={() => handleEdit(t)}>Editar</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t.id)}>Excluir</button>
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}><strong>Assunto:</strong> {t.subject}</div>
              <div style={{ fontSize: 13, background: 'var(--bg)', padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{t.body}</div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editing ? 'Editar Template' : 'Novo Template'}</h2>
            <form onSubmit={handleSubmit}>
              <input placeholder="Nome *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              <input placeholder="Assunto do email *" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
              <textarea placeholder="Corpo do email (use {{nome}} e {{empresa}} para personalizar)" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} required style={{ minHeight: 150 }} />
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Salvar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
