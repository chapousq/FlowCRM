const { query } = require('../database');

exports.list = async (req, res) => {
  try {
    const result = await query('SELECT * FROM automations WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar automações' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, trigger_type, trigger_value, action_type, action_value } = req.body;
    if (!name || !trigger_type || !action_type) {
      return res.status(400).json({ error: 'Nome, trigger e ação são obrigatórios' });
    }
    const result = await query(
      'INSERT INTO automations (user_id, name, trigger_type, trigger_value, action_type, action_value) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [req.userId, name, trigger_type, trigger_value || '', action_type, action_value || '']
    );
    const automation = await query('SELECT * FROM automations WHERE id = $1', [result.rows[0].id]);
    res.status(201).json(automation.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar automação' });
  }
};

exports.toggle = async (req, res) => {
  try {
    const existing = await query('SELECT * FROM automations WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Automação não encontrada' });
    await query('UPDATE automations SET enabled = $1 WHERE id = $2', [!existing.rows[0].enabled, req.params.id]);
    const updated = await query('SELECT * FROM automations WHERE id = $1', [req.params.id]);
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao alternar automação' });
  }
};

exports.delete = async (req, res) => {
  try {
    await query('DELETE FROM automations WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.json({ message: 'Automação removida' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar automação' });
  }
};

exports.executeTrigger = async (triggerType, triggerValue, userId, context = {}) => {
  try {
    const automationsResult = await query(
      'SELECT * FROM automations WHERE user_id = $1 AND trigger_type = $2 AND enabled = true',
      [userId, triggerType]
    );

    for (const auto of automationsResult.rows) {
      if (auto.action_type === 'create_followup') {
        const days = parseInt(auto.action_value) || 3;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + days);
        await query(
          'INSERT INTO activities (user_id, contact_id, deal_id, type, title, due_date) VALUES ($1, $2, $3, $4, $5, $6)',
          [
            userId,
            context.contact_id || null,
            context.deal_id || null,
            'task',
            `Follow-up automático: ${context.deal_title || context.contact_name || ''}`,
            dueDate.toISOString(),
          ]
        );
      }
      if (auto.action_type === 'move_stage') {
        const newStage = auto.action_value;
        if (context.deal_id && newStage) {
          const deal = await query('SELECT * FROM deals WHERE id = $1', [context.deal_id]);
          if (deal.rows[0]) {
            await query('UPDATE deals SET stage = $1 WHERE id = $2', [newStage, context.deal_id]);
            await query('INSERT INTO deal_history (deal_id, old_stage, new_stage) VALUES ($1, $2, $3)', [context.deal_id, deal.rows[0].stage, newStage]);
          }
        }
      }
      if (auto.action_type === 'add_tag') {
        const tagName = auto.action_value;
        if (context.contact_id && tagName) {
          let tagResult = await query('SELECT * FROM tags WHERE user_id = $1 AND name = $2', [userId, tagName]);
          let tagId;
          if (!tagResult.rows[0]) {
            const newTag = await query('INSERT INTO tags (user_id, name) VALUES ($1, $2) RETURNING id', [userId, tagName]);
            tagId = newTag.rows[0].id;
          } else {
            tagId = tagResult.rows[0].id;
          }
          await query('INSERT INTO contact_tags (contact_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [context.contact_id, tagId]);
        }
      }
      if (auto.action_type === 'create_deal') {
        const stage = auto.action_value || 'lead';
        if (context.contact_id) {
          const contact = await query('SELECT * FROM contacts WHERE id = $1', [context.contact_id]);
          if (contact.rows[0]) {
            await query(
              'INSERT INTO deals (user_id, contact_id, title, value, stage) VALUES ($1, $2, $3, $4, $5)',
              [userId, context.contact_id, `Negócio - ${contact.rows[0].name}`, contact.rows[0].value || 0, stage]
            );
          }
        }
      }
    }
  } catch (err) {
    console.error('Execute trigger error:', err.message);
  }
};
