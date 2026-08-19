import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Tags() {
  const [tags, setTags] = useState([]);
  const [form, setForm] = useState({ name: '', color: '#4f46e5' });

  useEffect(() => { loadTags(); }, []);
  const loadTags = () => api.get('/tags').then(res => setTags(res.data));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    await api.post('/tags', form);
    setForm({ name: '', color: '#4f46e5' });
    loadTags();
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover esta tag?')) return;
    await api.delete(`/tags/${id}`);
    loadTags();
  };

  const colors = ['#4f46e5', '#ef4444', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#06b6d4'];

  return (
    <div>
      <div className="page-header">
        <h1>Tags</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>Criar Tag</h3>
          <form onSubmit={handleCreate}>
            <input placeholder="Nome da tag" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Cor</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {colors.map(c => (
                  <div key={c} onClick={() => setForm({ ...form, color: c })}
                    style={{ width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer', border: form.color === c ? '3px solid var(--text)' : '3px solid transparent' }} />
                ))}
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Criar Tag</button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>Tags Existentes ({tags.length})</h3>
          {tags.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Nenhuma tag criada ainda</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {tags.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: t.color + '15', border: `1px solid ${t.color}30`, borderRadius: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.color }}></div>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{t.name}</span>
                  <span style={{ cursor: 'pointer', color: 'var(--danger)', fontSize: 16 }} onClick={() => handleDelete(t.id)}>x</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
