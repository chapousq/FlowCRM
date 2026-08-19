import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterBanned, setFilterBanned] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterRole) params.append('role', filterRole);
      if (filterBanned !== '') params.append('banned', filterBanned);
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.users);
      setStats(data.stats);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [search, filterRole, filterBanned]);

  const handleAction = async (action, id, body = {}) => {
    try {
      const endpoints = {
        ban: `/admin/users/${id}/ban`,
        unban: `/admin/users/${id}/unban`,
        promote: `/admin/users/${id}/promote`,
        demote: `/admin/users/${id}/demote`,
        delete: `/admin/users/${id}`,
        plan: `/admin/users/${id}/plan`,
      };
      if (action === 'delete') {
        await api.delete(endpoints[action]);
      } else {
        await api.put(endpoints[action], body);
      }
      setConfirmAction(null);
      setSuccess('Acao executada com sucesso');
      setTimeout(() => setSuccess(''), 3000);
      fetchUsers();
      if (selectedUser?.id === id) setSelectedUser(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao executar acao');
      setTimeout(() => setError(''), 3000);
    }
  };

  const openUserDetail = async (id) => {
    try {
      const { data } = await api.get(`/admin/users/${id}`);
      setSelectedUser(data);
    } catch (err) {
      setError('Erro ao carregar detalhes');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="page">
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{'\uD83D\uDEAB'}</div>
          <h2>Acesso Negado</h2>
          <p style={{ color: '#64748b' }}>Apenas administradores podem acessar esta pagina.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="page-header">
        <h1>Painel Administrativo</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Usuarios', value: stats.total || 0, icon: '\uD83D\uDC65', color: '#4f46e5' },
          { label: 'Administradores', value: stats.admins || 0, icon: '\uD83D\uDD11', color: '#f59e0b' },
          { label: 'Banidos', value: stats.banned || 0, icon: '\uD83D\uDEAB', color: '#ef4444' },
          { label: 'Ativos Hoje', value: stats.activeToday || 0, icon: '\uD83D\uDCC8', color: '#10b981' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }}
          />
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }}>
            <option value="">Todos os cargos</option>
            <option value="user">Usuarios</option>
            <option value="admin">Admins</option>
          </select>
          <select value={filterBanned} onChange={e => setFilterBanned(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }}>
            <option value="">Todos</option>
            <option value="0">Ativos</option>
            <option value="1">Banidos</option>
          </select>
        </div>
      </div>

      {confirmAction && (
        <div className="modal-overlay" onClick={() => setConfirmAction(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>
              {confirmAction.type === 'delete' ? 'Deletar usuario?' :
               confirmAction.type === 'ban' ? 'Banir usuario?' :
               confirmAction.type === 'promote' ? 'Promover a admin?' : 'Confirmar acao?'}
            </h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>
              {confirmAction.type === 'delete'
                ? `Tem certeza que deseja deletar "${confirmAction.name}"? Todos os dados serao apagados permanentemente.`
                : confirmAction.type === 'ban'
                ? `Deseja banir "${confirmAction.name}"? Ele nao podera mais acessar o sistema.`
                : confirmAction.type === 'promote'
                ? `Deseja promover "${confirmAction.name}" a administrador?`
                : `Deseja desbanir "${confirmAction.name}"?`}
            </p>
            {confirmAction.type === 'ban' && (
              <input
                type="text"
                placeholder="Motivo do ban (opcional)"
                id="ban-reason"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, marginBottom: 12 }}
              />
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setConfirmAction(null)}>Cancelar</button>
              <button
                className="btn"
                style={{ background: confirmAction.type === 'delete' || confirmAction.type === 'ban' ? '#ef4444' : '#4f46e5', color: 'white' }}
                onClick={() => {
                  if (confirmAction.type === 'ban') {
                    const reason = document.getElementById('ban-reason')?.value || '';
                    handleAction('ban', confirmAction.id, { reason });
                  } else {
                    handleAction(confirmAction.type, confirmAction.id);
                  }
                }}
              >
                {confirmAction.type === 'delete' ? 'Deletar' : confirmAction.type === 'ban' ? 'Banir' : confirmAction.type === 'promote' ? 'Promover' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18 }}>Detalhes do Usuario</h2>
              <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>x</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Nome</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedUser.name}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Email</div>
                <div style={{ fontSize: 14 }}>{selectedUser.email}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Cargo</div>
                <div style={{ fontSize: 14 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 4, background: selectedUser.role === 'admin' ? '#fef3c7' : '#f1f5f9', color: selectedUser.role === 'admin' ? '#92400e' : '#475569', fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>
                    {selectedUser.role}
                  </span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Plano</div>
                <div style={{ fontSize: 14, textTransform: 'capitalize' }}>{selectedUser.plan}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Status</div>
                <div>
                  <span style={{ padding: '2px 8px', borderRadius: 4, background: selectedUser.banned ? '#fef2f2' : '#f0fdf4', color: selectedUser.banned ? '#991b1b' : '#166534', fontSize: 12, fontWeight: 600 }}>
                    {selectedUser.banned ? 'BANIDO' : 'ATIVO'}
                  </span>
                  {selectedUser.banned && selectedUser.banned_reason && (
                    <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>{selectedUser.banned_reason}</span>
                  )}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Cadastro</div>
                <div style={{ fontSize: 13 }}>{new Date(selectedUser.created_at).toLocaleDateString('pt-BR')}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Ultimo login</div>
                <div style={{ fontSize: 13 }}>{selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString('pt-BR') : 'Nunca'}</div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Dados do CRM</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#4f46e5' }}>{selectedUser.contacts}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Contatos</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>{selectedUser.deals}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Negocios</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>{selectedUser.activities}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Atividades</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {selectedUser.id !== user.id && (
                <>
                  {!selectedUser.banned ? (
                    <button className="btn" style={{ background: '#ef4444', color: 'white', fontSize: 13 }}
                      onClick={() => setConfirmAction({ type: 'ban', id: selectedUser.id, name: selectedUser.name })}>
                      Banir
                    </button>
                  ) : (
                    <button className="btn" style={{ background: '#10b981', color: 'white', fontSize: 13 }}
                      onClick={() => handleAction('unban', selectedUser.id)}>
                      Desbanir
                    </button>
                  )}
                  {selectedUser.role === 'user' ? (
                    <button className="btn" style={{ background: '#f59e0b', color: 'white', fontSize: 13 }}
                      onClick={() => setConfirmAction({ type: 'promote', id: selectedUser.id, name: selectedUser.name })}>
                      Promover a Admin
                    </button>
                  ) : (
                    <button className="btn" style={{ background: '#6b7280', color: 'white', fontSize: 13 }}
                      onClick={() => handleAction('demote', selectedUser.id)}>
                      Rebaixar
                    </button>
                  )}
                  <select
                    value={selectedUser.plan}
                    onChange={e => handleAction('plan', selectedUser.id, { plan: e.target.value })}
                    style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13 }}>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                  <button className="btn" style={{ background: '#991b1b', color: 'white', fontSize: 13, marginLeft: 'auto' }}
                    onClick={() => setConfirmAction({ type: 'delete', id: selectedUser.id, name: selectedUser.name })}>
                    Deletar Conta
                  </button>
                </>
              )}
              {selectedUser.id === user.id && (
                <span style={{ fontSize: 13, color: '#94a3b8' }}>Este e voce - sem acoes disponiveis</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Carregando...</div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Nenhum usuario encontrado</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: 12 }}>USUARIO</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: 12 }}>CARGO</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: 12 }}>PLANO</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: 12 }}>STATUS</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: 12 }}>CADASTRO</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: 12 }}>ACOES</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => openUserDetail(u.id)}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: u.banned ? '#fee2e2' : '#e0e7ff', color: u.banned ? '#991b1b' : '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: u.banned ? '#94a3b8' : '#0f172a' }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 4, background: u.role === 'admin' ? '#fef3c7' : '#f1f5f9', color: u.role === 'admin' ? '#92400e' : '#475569', fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textTransform: 'capitalize', color: '#475569' }}>{u.plan}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 4, background: u.banned ? '#fef2f2' : '#f0fdf4', color: u.banned ? '#991b1b' : '#166534', fontSize: 12, fontWeight: 600 }}>
                        {u.banned ? 'BANIDO' : 'ATIVO'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 13 }}>{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => openUserDetail(u.id)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 12, color: '#475569' }}>
                        Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
