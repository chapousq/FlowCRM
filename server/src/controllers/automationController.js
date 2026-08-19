const db = require('../database');

exports.list = (req, res) => {
  const automations = db.prepare('SELECT * FROM automations WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
  res.json(automations);
};

exports.create = (req, res) => {
  const { name, trigger_type, trigger_value, action_type, action_value } = req.body;
  if (!name || !trigger_type || !action_type) {
    return res.status(400).json({ error: 'Nome, trigger e ação são obrigatórios' });
  }
  const result = db.prepare(
    'INSERT INTO automations (user_id, name, trigger_type, trigger_value, action_type, action_value) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.userId, name, trigger_type, trigger_value || '', action_type, action_value || '');
  const automation = db.prepare('SELECT * FROM automations WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(automation);
};

exports.toggle = (req, res) => {
  const existing = db.prepare('SELECT * FROM automations WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Automação não encontrada' });
  db.prepare('UPDATE automations SET enabled = ? WHERE id = ?').run(existing.enabled ? 0 : 1, req.params.id);
  res.json(db.prepare('SELECT * FROM automations WHERE id = ?').get(req.params.id));
};

exports.delete = (req, res) => {
  db.prepare('DELETE FROM automations WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ message: 'Automação removida' });
};

exports.executeTrigger = (triggerType, triggerValue, userId, context = {}) => {
  const automations = db.prepare(
    'SELECT * FROM automations WHERE user_id = ? AND trigger_type = ? AND enabled = 1'
  ).all(userId, triggerType);

  for (const auto of automations) {
    if (auto.action_type === 'create_followup') {
      const days = parseInt(auto.action_value) || 3;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + days);
      db.prepare(
        'INSERT INTO activities (user_id, contact_id, deal_id, type, title, due_date) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(
        userId,
        context.contact_id || null,
        context.deal_id || null,
        'task',
        `Follow-up automático: ${context.deal_title || context.contact_name || ''}`,
        dueDate.toISOString()
      );
    }
    if (auto.action_type === 'move_stage') {
      const newStage = auto.action_value;
      if (context.deal_id && newStage) {
        const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(context.deal_id);
        if (deal) {
          db.prepare('UPDATE deals SET stage = ? WHERE id = ?').run(newStage, context.deal_id);
          db.prepare('INSERT INTO deal_history (deal_id, old_stage, new_stage) VALUES (?, ?, ?)').run(context.deal_id, deal.stage, newStage);
        }
      }
    }
    if (auto.action_type === 'add_tag') {
      const tagName = auto.action_value;
      if (context.contact_id && tagName) {
        let tag = db.prepare('SELECT * FROM tags WHERE user_id = ? AND name = ?').get(userId, tagName);
        if (!tag) {
          const result = db.prepare('INSERT INTO tags (user_id, name) VALUES (?, ?)').run(userId, tagName);
          tag = { id: result.lastInsertRowid };
        }
        db.prepare('INSERT OR IGNORE INTO contact_tags (contact_id, tag_id) VALUES (?, ?)').run(context.contact_id, tag.id);
      }
    }
    if (auto.action_type === 'create_deal') {
      const stage = auto.action_value || 'lead';
      if (context.contact_id) {
        const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(context.contact_id);
        if (contact) {
          db.prepare(
            'INSERT INTO deals (user_id, contact_id, title, value, stage) VALUES (?, ?, ?, ?, ?)'
          ).run(userId, context.contact_id, `Negócio - ${contact.name}`, contact.value || 0, stage);
        }
      }
    }
  }
};
