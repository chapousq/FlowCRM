const { query } = require('../database');
const automationController = require('./automationController');

exports.list = async (req, res) => {
  try {
    const deals = (await query(`
      SELECT d.*, c.name as contact_name, c.company as contact_company
      FROM deals d
      LEFT JOIN contacts c ON d.contact_id = c.id
      WHERE d.user_id = $1
      ORDER BY d.created_at DESC
    `, [req.userId])).rows;
    res.json(deals);
  } catch (err) {
    console.error('List deals error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.get = async (req, res) => {
  try {
    const deal = (await query(`
      SELECT d.*, c.name as contact_name, c.company as contact_company
      FROM deals d
      LEFT JOIN contacts c ON d.contact_id = c.id
      WHERE d.id = $1 AND d.user_id = $2
    `, [req.params.id, req.userId])).rows[0];
    if (!deal) return res.status(404).json({ error: 'Negócio não encontrado' });
    const history = (await query('SELECT * FROM deal_history WHERE deal_id = $1 ORDER BY changed_at DESC', [req.params.id])).rows;
    res.json({ ...deal, history });
  } catch (err) {
    console.error('Get deal error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, contact_id, value, stage, probability, expected_close, notes } = req.body;
    if (!title) return res.status(400).json({ error: 'Título é obrigatório' });

    const result = (await query(
      'INSERT INTO deals (user_id, contact_id, title, value, stage, probability, expected_close, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
      [req.userId, contact_id || null, title, value || 0, stage || 'lead', probability || 10, expected_close || null, notes || '']
    ));

    const dealId = result.rows[0].id;

    await query('INSERT INTO deal_history (deal_id, new_stage) VALUES ($1, $2)', [dealId, stage || 'lead']);

    automationController.executeTrigger('new_deal', '', req.userId, {
      deal_id: dealId,
      deal_title: title,
      contact_id: contact_id || null,
    });

    const deal = (await query('SELECT * FROM deals WHERE id = $1', [dealId])).rows[0];
    res.status(201).json(deal);
  } catch (err) {
    console.error('Create deal error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.update = async (req, res) => {
  try {
    const existing = (await query('SELECT * FROM deals WHERE id = $1 AND user_id = $2', [req.params.id, req.userId])).rows[0];
    if (!existing) return res.status(404).json({ error: 'Negócio não encontrado' });

    const { title, contact_id, value, stage, probability, expected_close, notes, loss_reason } = req.body;

    const newStage = stage || existing.stage;
    const stageChanged = newStage !== existing.stage;

    await query(
      "UPDATE deals SET title=$1, contact_id=$2, value=$3, stage=$4, probability=$5, expected_close=$6, notes=$7, loss_reason=$8, closed_at=CASE WHEN $9 IN ('won','lost') THEN NOW() ELSE closed_at END WHERE id=$10",
      [
        title || existing.title,
        contact_id !== undefined ? contact_id : existing.contact_id,
        value ?? existing.value,
        newStage,
        probability ?? existing.probability,
        expected_close || existing.expected_close,
        notes !== undefined ? notes : existing.notes,
        loss_reason || existing.loss_reason,
        newStage,
        req.params.id
      ]
    );

    if (stageChanged) {
      await query('INSERT INTO deal_history (deal_id, old_stage, new_stage) VALUES ($1, $2, $3)', [req.params.id, existing.stage, newStage]);

      automationController.executeTrigger('stage_changed', newStage, req.userId, {
        deal_id: parseInt(req.params.id),
        deal_title: title || existing.title,
        contact_id: existing.contact_id,
      });

      if (newStage === 'won') {
        automationController.executeTrigger('deal_won', '', req.userId, {
          deal_id: parseInt(req.params.id),
          deal_title: title || existing.title,
          contact_id: existing.contact_id,
        });
      }
      if (newStage === 'lost') {
        automationController.executeTrigger('deal_lost', '', req.userId, {
          deal_id: parseInt(req.params.id),
          deal_title: title || existing.title,
          contact_id: existing.contact_id,
        });
      }
    }

    const deal = (await query('SELECT * FROM deals WHERE id = $1', [req.params.id])).rows[0];
    res.json(deal);
  } catch (err) {
    console.error('Update deal error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.delete = async (req, res) => {
  try {
    const existing = (await query('SELECT * FROM deals WHERE id = $1 AND user_id = $2', [req.params.id, req.userId])).rows[0];
    if (!existing) return res.status(404).json({ error: 'Negócio não encontrado' });

    await query('DELETE FROM deal_history WHERE deal_id = $1', [req.params.id]);
    await query('DELETE FROM deals WHERE id = $1', [req.params.id]);
    res.json({ message: 'Negócio removido' });
  } catch (err) {
    console.error('Delete deal error:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
