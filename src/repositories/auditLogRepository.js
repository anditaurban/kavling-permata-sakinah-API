import { pool } from '../config/database.js';

export class AuditLogRepository {
  /**
   * Record audit log within an existing transaction connection or general pool
   * @param {Object} data 
   * @param {Object} [connection] Optional active transaction connection
   */
  async log(data, connection = pool) {
    const { actor_user_id, action, entity_type, entity_id, summary, metadata_json, ip_address } = data;
    await connection.execute(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, summary, metadata_json, ip_address, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        actor_user_id || null,
        action,
        entity_type,
        entity_id || null,
        summary || null,
        metadata_json ? JSON.stringify(metadata_json) : null,
        ip_address || null,
      ]
    );
  }
}

export const auditLogRepository = new AuditLogRepository();
