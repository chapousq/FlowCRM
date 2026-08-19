const db = require('../database');

exports.getSalesReport = (req, res) => {
  const userId = req.userId;

  const wonDeals = db.prepare("SELECT * FROM deals WHERE user_id = ? AND stage = 'won'").all(userId);
  const lostDeals = db.prepare("SELECT * FROM deals WHERE user_id = ? AND stage = 'lost'").all(userId);
  const totalWon = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const totalLost = lostDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const winRate = wonDeals.length + lostDeals.length > 0
    ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)
    : 0;

  const avgDealValue = wonDeals.length > 0 ? totalWon / wonDeals.length : 0;

  const lossReasons = db.prepare(
    "SELECT loss_reason, COUNT(*) as count FROM deals WHERE user_id = ? AND stage = 'lost' AND loss_reason != '' GROUP BY loss_reason ORDER BY count DESC"
  ).all(userId);

  const monthlyRevenue = db.prepare(`
    SELECT strftime('%Y-%m', closed_at) as month, SUM(value) as total, COUNT(*) as count
    FROM deals WHERE user_id = ? AND stage = 'won' AND closed_at IS NOT NULL
    GROUP BY month ORDER BY month DESC LIMIT 12
  `).all(userId);

  const contactsByStatus = db.prepare(`
    SELECT status, COUNT(*) as count FROM contacts WHERE user_id = ? GROUP BY status
  `).all(userId);

  const topContacts = db.prepare(`
    SELECT c.*, COUNT(d.id) as deal_count, COALESCE(SUM(d.value), 0) as total_value
    FROM contacts c
    LEFT JOIN deals d ON c.id = d.contact_id
    WHERE c.user_id = ?
    GROUP BY c.id
    ORDER BY total_value DESC
    LIMIT 10
  `).all(userId);

  const activitiesSummary = db.prepare(`
    SELECT type, COUNT(*) as total, SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as done
    FROM activities WHERE user_id = ?
    GROUP BY type
  `).all(userId);

  const pipelineVelocity = db.prepare(`
    SELECT stage, COUNT(*) as count, AVG(julianday('now') - julianday(created_at)) as avg_days
    FROM deals WHERE user_id = ? AND stage NOT IN ('won', 'lost')
    GROUP BY stage
  `).all(userId);

  res.json({
    totalWon,
    totalLost,
    winRate,
    avgDealValue,
    wonCount: wonDeals.length,
    lostCount: lostDeals.length,
    lossReasons,
    monthlyRevenue,
    contactsByStatus,
    topContacts,
    activitiesSummary,
    pipelineVelocity,
  });
};

exports.getExport = (req, res) => {
  const { type } = req.params;
  const userId = req.userId;

  if (type === 'contacts') {
    const contacts = db.prepare('SELECT * FROM contacts WHERE user_id = ?').all(userId);
    const header = 'Nome,Email,Telefone,Empresa,Cargo,Status,Valor,Score,Fonte\n';
    const csv = contacts.map(c =>
      `"${c.name}","${c.email}","${c.phone}","${c.company}","${c.role}","${c.status}",${c.value},${c.score},"${c.source}"`
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=contatos.csv');
    res.send(header + csv);
  } else if (type === 'deals') {
    const deals = db.prepare(`
      SELECT d.*, c.name as contact_name FROM deals d
      LEFT JOIN contacts c ON d.contact_id = c.id
      WHERE d.user_id = ?
    `).all(userId);
    const header = 'Título,Contato,Valor,Estágio,Probabilidade,Data Fechamento,Motivo Perda\n';
    const csv = deals.map(d =>
      `"${d.title}","${d.contact_name || ''}",${d.value},"${d.stage}",${d.probability},"${d.expected_close || ''}","${d.loss_reason || ''}"`
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=negocios.csv');
    res.send(header + csv);
  } else {
    res.status(400).json({ error: 'Tipo inválido' });
  }
};
