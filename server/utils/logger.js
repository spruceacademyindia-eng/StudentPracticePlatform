const AdminLog = require('../models/AdminLog');

/**
 * Log an administrative action to AdminLog collection
 */
const logAdminAction = async ({ adminId, action, entity, entityId = null, metadata = {} }) => {
  try {
    await AdminLog.create({
      admin: adminId,
      action,
      entity,
      entityId: entityId ? String(entityId) : null,
      metadata,
    });
  } catch (err) {
    console.error('Failed to write admin log:', err.message);
  }
};

module.exports = { logAdminAction };

