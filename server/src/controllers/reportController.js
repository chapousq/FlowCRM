const { query } = require('../database');

exports.getSalesReport = async (req, res) => {
  try {
    const userId = req.userId;

    const wonDealsResult = await query("SELECT * FROM deals WHERE user_id = $1 AND stage = 'won'", [userId]);
    const lostDealsResult = await query("SELECT * FROM deals WHERE user_id = $1 AND stage = 'lost'", [userId]);
    const wonDeals = wonDealsResult.rows;
    const lostDeals = lostDealsResult.rows;
    const totalWon = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    const totalLost = lostDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    const winRate = wonDeals.length + lostDeals.length > 0
      ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)
      : 0;

    const avgDealValue = wonDeals.length > 0 ? totalWon / wonDeals.length : 0;

    const lossReasonsResult = await query(
      "SELECT loss_reason, COUNT(*) as count FROM deals WHERE user_id = $1 AND stage = 'lost' AND loss_reason != '' GROUP BY loss_reason ORDER BY count DESC",
      [userId]
    );

    const monthlyRevenueResult = await query(`
      SELECT TO_CHAR(closed_at, 'YYYY-MM') as month, SUM(value) as total, COUNT(*) as count
      FROM deals WHERE user_id = $1 AND stage = 'won' AND closed_at IS NOT NULL
      GROUP BY month ORDER BY month DESC LIMIT 12
    `, [userId]);

    const contactsByStatusResult = await query(`
      SELECT status, COUNT(*) as count FROM contacts WHERE user_id = $1 GROUP BY status
    `, [userId]);

    const topContactsResult = await query(`
      SELECT c.*, COUNT(d.id) as deal_count, COALESCE(SUM(d.value), 0) as total_value
      FROM contacts c
      LEFT JOIN deals d ON c.id = d.contact_id
      WHERE c.user_id = $1
      GROUP BY c.id
      ORDER BY total_value DESC
      LIMIT 10
    `, [userId]);

    const activitiesSummaryResult = await query(`
      SELECT type, COUNT(*) as total, SUM(CASE WHEN completed = true THEN 1 ELSE 0 END) as done
      FROM activities WHERE user_id = $1
      GROUP BY type
    `, [userId]);

    const pipelineVelocityResult = await query(`
      SELECT stage, COUNT(*) as count, AVG(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400) as avg_days
      FROM deals WHERE user_id = $1 AND stage NOT IN ('won', 'lost')
      GROUP BY stage
    `, [userId]);

    res.json({
      totalWon,
      totalLost,
      winRate,
      avgDealValue,
      wonCount: wonDeals.length,
      lostCount: lostDeals.length,
      lossReasons: lossReasonsResult.rows,
      monthlyRevenue: monthlyRevenueResult.rows,
      contactsByStatus: contactsByStatusResult.rows,
      topContacts: topContactsResult.rows,
      activitiesSummary: activitiesSummaryResult.rows,
      pipelineVelocity: pipelineVelocityResult.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
};

exports.getExport = async (req, res) => {
  try {
    const { type } = req.params;
    const userId = req.userId;

    if (type === 'contacts') {
      const result = await query('SELECT * FROM contacts WHERE user_id = $1', [userId]);
      const contacts = result.rows;
      const header = 'Nome,Email,Telefone,Empresa,Cargo,Status,Valor,Score,Fonte\n';
      const csv = contacts.map(c =>
        `"${c.name}","${c.email}","${c.phone}","${c.company}","${c.role}","${c.status}",${c.value},${c.score},"${c.source}"`
      ).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=contatos.csv');
      res.send(header + csv);
    } else if (type === 'deals') {
      const result = await query(`
        SELECT d.*, c.name as contact_name FROM deals d
        LEFT JOIN contacts c ON d.contact_id = c.id
        WHERE d.user_id = $1
      `, [userId]);
      const deals = result.rows;
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
  } catch (err) {
    res.status(500).json({ error: 'Erro ao exportar dados' });
  }
};
