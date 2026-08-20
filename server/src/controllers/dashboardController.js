const { query } = require('../database');

exports.get = async (req, res) => {
  try {
    const userId = req.userId;

    const totalContactsResult = await query('SELECT COUNT(*) as count FROM contacts WHERE user_id = $1', [userId]);
    const totalDealsResult = await query('SELECT COUNT(*) as count FROM deals WHERE user_id = $1', [userId]);
    const totalValueResult = await query('SELECT COALESCE(SUM(value), 0) as total FROM deals WHERE user_id = $1', [userId]);
    const wonValueResult = await query("SELECT COALESCE(SUM(value), 0) as total FROM deals WHERE user_id = $1 AND stage = 'won'", [userId]);
    const activeDealsResult = await query("SELECT COUNT(*) as count FROM deals WHERE user_id = $1 AND stage NOT IN ('won', 'lost')", [userId]);
    const pendingActivitiesResult = await query('SELECT COUNT(*) as count FROM activities WHERE user_id = $1 AND completed = false', [userId]);

    const dealsByStageResult = await query(`
      SELECT stage, COUNT(*) as count, COALESCE(SUM(value), 0) as value
      FROM deals WHERE user_id = $1
      GROUP BY stage
    `, [userId]);

    const recentDealsResult = await query(`
      SELECT d.*, c.name as contact_name
      FROM deals d
      LEFT JOIN contacts c ON d.contact_id = c.id
      WHERE d.user_id = $1
      ORDER BY d.created_at DESC
      LIMIT 5
    `, [userId]);

    const recentContactsResult = await query('SELECT * FROM contacts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5', [userId]);

    res.json({
      totalContacts: parseInt(totalContactsResult.rows[0].count),
      totalDeals: parseInt(totalDealsResult.rows[0].count),
      totalValue: parseFloat(totalValueResult.rows[0].total),
      wonValue: parseFloat(wonValueResult.rows[0].total),
      activeDeals: parseInt(activeDealsResult.rows[0].count),
      pendingActivities: parseInt(pendingActivitiesResult.rows[0].count),
      dealsByStage: dealsByStageResult.rows,
      recentDeals: recentDealsResult.rows,
      recentContacts: recentContactsResult.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
};
