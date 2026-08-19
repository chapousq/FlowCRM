import { useState, useEffect } from 'react';
import api from '../services/api';
import CurrencyInput, { formatDisplay } from '../components/CurrencyInput';

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', role: '', status: 'lead', value: '', source: '', notes: '' });
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('created_desc');
  const [importing, setImporting] = useState(false);

  useEffect(() => { loadContacts(); loadTags(); }, []);

  const loadContacts = () => api.get('/contacts').then(res => setContacts(res.data));
  const loadTags = () => api.get('/tags').then(res => setAllTags(res.data));

  let filtered = filter === 'all' ? contacts : contacts.filter(c => c.status === filter);
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(c => c.name.toLowerCase().includes(s) || c.company?.toLowerCase().includes(s) || c.email?.toLowerCase().includes(s));
  }
  if (sort === 'score_desc') filtered.sort((a, b) => b.score - a.score);
  else if (sort === 'value_desc') filtered.sort((a, b) => (b.value || 0) - (a.value || 0));
  else if (sort === 'name_asc') filtered.sort((a, b) => a.name.localeCompare(b.name));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, value: form.value ? parseFloat(form.value) : 0 };
    if (editing) {
      await api.put(`/contacts/${editing.id}`, payload);
    } else {
      await api.post('/contacts', payload);
    }
    setShowModal(false);
    setEditing(null);
    resetForm();
    loadContacts();
  };

  const resetForm = () => setForm({ name: '', email: '', phone: '', company: '', role: '', status: 'lead', value: '', source: '', notes: '' });

  const handleEdit = (contact) => {
    setEditing(contact);
    setForm({ name: contact.name, email: contact.email, phone: contact.phone, company: contact.company, role: contact.role, status: contact.status, value: contact.value || '', source: contact.source || '', notes: contact.notes || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover este contato?')) return;
    await api.delete(`/contacts/${id}`);
    loadContacts();
  };

  const handleView = (contact) => setSelectedContact(contact);

  const handleAddTag = async (contactId, tagId) => {
    await api.post('/tags/contact', { contact_id: contactId, tag_id: tagId });
    loadContacts();
  };

  const handleRemoveTag = async (contactId, tagId) => {
    await api.delete(`/tags/contact/${contactId}/${tagId}`);
    loadContacts();
  };

  const handleExport = () => {
    const token = localStorage.getItem('token');
    fetch('/api/reports/export/contacts', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'contatos.csv'; a.click();
        URL.revokeObjectURL(url);
      });
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const lines = ev.target.result.split('\n').filter(l => l.trim());
      const rows = lines.slice(1).map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
      try {
        const res = await api.post('/contacts/import', { rows });
        alert(`${res.data.imported} contatos importados!`);
        loadContacts();
      } catch { alert('Erro ao importar'); }
      setImporting(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const formatCurrency = (v) => formatDisplay(v);

  return (
    <div>
      <div className="page-header">
        <h1>Contatos</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
            {importing ? 'Importando...' : 'Importar CSV'}
            <input type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} disabled={importing} />
          </label>
          <button className="btn btn-outline" onClick={handleExport}>Exportar CSV</button>
          <button className="btn btn-primary" onClick={() => { resetForm(); setEditing(null); setShowModal(true); }}>+ Novo Contato</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <input placeholder="Buscar por nome, empresa ou email..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, minWidth: 250 }} />
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }}>
          <option value="created_desc">Mais recentes</option>
          <option value="score_desc">Maior score</option>
          <option value="value_desc">Maior valor</option>
          <option value="name_asc">Nome A-Z</option>
        </select>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {[{k:'all',l:'Todos'},{k:'lead',l:'Lead'},{k:'prospect',l:'Prospect'},{k:'negotiation',l:'Negociação'},{k:'won',l:'Ganho'},{k:'lost',l:'Perdido'}].map(s => (
            <button key={s.k} className={`btn btn-sm ${filter === s.k ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(s.k)}>{s.l}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-state"><h3>Nenhum contato encontrado</h3><p>Comece adicionando seu primeiro contato</p></div>
      ) : (
        <div className="card table-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Empresa</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>Status</th>
                <th>Score</th>
                <th>Tags</th>
                <th>Valor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500, cursor: 'pointer' }} onClick={() => handleView(c)}>{c.name}</td>
                  <td>{c.company || '-'}</td>
                  <td>{c.email || '-'}</td>
                  <td>{c.phone || '-'}</td>
                  <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', fontSize: 12, fontWeight: 700, background: c.score > 60 ? '#d1fae5' : c.score > 30 ? '#fef3c7' : '#fee2e2', color: c.score > 60 ? '#047857' : c.score > 30 ? '#d97706' : '#dc2626' }}>
                      {c.score}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {(c.tags || []).map(t => (
                        <span key={t.id} style={{ background: t.color + '20', color: t.color, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                          {t.name} <span style={{ cursor: 'pointer' }} onClick={() => handleRemoveTag(c.id, t.id)}>x</span>
                        </span>
                      ))}
                      <button className="btn btn-sm btn-outline" onClick={() => { setSelectedContact(c); setShowTagModal(true); }} style={{ padding: '2px 6px', fontSize: 11 }}>+</button>
                    </div>
                  </td>
                  <td>{formatCurrency(c.value)}</td>
                  <td>
                    <button className="btn btn-sm btn-outline" onClick={() => handleEdit(c)} style={{ marginRight: 4 }}>Editar</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editing ? 'Editar Contato' : 'Novo Contato'}</h2>
            <form onSubmit={handleSubmit}>
              <input placeholder="Nome *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <input placeholder="Telefone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <input placeholder="Empresa" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
              <input placeholder="Cargo" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="lead">Lead</option>
                <option value="prospect">Prospect</option>
                <option value="negotiation">Negociação</option>
                <option value="won">Ganho</option>
                <option value="lost">Perdido</option>
              </select>
              <CurrencyInput value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} />
              <input placeholder="Fonte (ex: site, indicação, evento)" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} />
              <textarea placeholder="Notas" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Salvar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTagModal && selectedContact && (
        <div className="modal-overlay" onClick={() => setShowTagModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Tags - {selectedContact.name}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {allTags.map(tag => {
                const has = (selectedContact.tags || []).some(t => t.id === tag.id);
                return (
                  <button key={tag.id} className={`btn btn-sm ${has ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => has ? handleRemoveTag(selectedContact.id, tag.id) : handleAddTag(selectedContact.id, tag.id)}>
                    {tag.name} {has ? 'x' : '+'}
                  </button>
                );
              })}
            </div>
            {allTags.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Crie tags na página de Tags primeiro</p>}
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => setShowTagModal(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {selectedContact && !showTagModal && !showModal && (
        <div className="modal-overlay" onClick={() => setSelectedContact(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{selectedContact.name}</h2>
            <div style={{ display: 'grid', gap: 10, fontSize: 14 }}>
              <div><strong>Email:</strong> {selectedContact.email || '-'}</div>
              <div><strong>Telefone:</strong> {selectedContact.phone || '-'}</div>
              <div><strong>Empresa:</strong> {selectedContact.company || '-'}</div>
              <div><strong>Cargo:</strong> {selectedContact.role || '-'}</div>
              <div><strong>Status:</strong> <span className={`badge badge-${selectedContact.status}`}>{selectedContact.status}</span></div>
              <div><strong>Score:</strong> {selectedContact.score}/100</div>
              <div><strong>Valor:</strong> {formatCurrency(selectedContact.value)}</div>
              <div><strong>Fonte:</strong> {selectedContact.source || '-'}</div>
              <div><strong>Notas:</strong> {selectedContact.notes || '-'}</div>
            </div>
            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button className="btn btn-outline" onClick={() => { setSelectedContact(null); handleEdit(selectedContact); }}>Editar</button>
              <button className="btn btn-primary" onClick={() => setSelectedContact(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
