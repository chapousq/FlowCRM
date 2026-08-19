const db = require('../database');

exports.get = (req, res) => {
  const userId = req.userId;

  const totalContacts = db.prepare('SELECT COUNT(*) as count FROM contacts WHERE user_id = ?').get(userId).count;
  const totalDeals = db.prepare('SELECT COUNT(*) as count FROM deals WHERE user_id = ?').get(userId).count;
  const totalValue = db.prepare('SELECT COALESCE(SUM(value), 0) as total FROM deals WHERE user_id = ?').get(userId).total;
  const wonValue = db.prepare("SELECT COALESCE(SUM(value), 0) as total FROM deals WHERE user_id = ? AND stage = 'won'").get(userId).total;
  const activeDeals = db.prepare("SELECT COUNT(*) as count FROM deals WHERE user_id = ? AND stage NOT IN ('won', 'lost')").get(userId).count;
  const pendingActivities = db.prepare('SELECT COUNT(*) as count FROM activities WHERE user_id = ? AND completed = 0').get(userId).count;

  const dealsByStage = db.prepare(`
    SELECT stage, COUNT(*) as count, COALESCE(SUM(value), 0) as value
    FROM deals WHERE user_id = ?
    GROUP BY stage
  `).all(userId);

  const recentDeals = db.prepare(`
    SELECT d.*, c.name as contact_name
    FROM deals d
    LEFT JOIN contacts c ON d.contact_id = c.id
    WHERE d.user_id = ?
    ORDER BY d.created_at DESC
    LIMIT 5
  `).all(userId);

  const recentContacts = db.prepare('SELECT * FROM contacts WHERE user_id = ? ORDER BY created_at DESC LIMIT 5').all(userId);

  res.json({
    totalContacts,
    totalDeals,
    totalValue,
    wonValue,
    activeDeals,
    pendingActivities,
    dealsByStage,
    recentDeals,
    recentContacts,
  });
};
