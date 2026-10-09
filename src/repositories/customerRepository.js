import { pool } from '../config/database.js';

export class CustomerRepository {
  async findAll(filters = {}) {
    const conditions = ['1=1'];
    const params = [];

    if (filters.lead_status) {
      conditions.push('lead_status = ?');
      params.push(filters.lead_status);
    }

    if (filters.search) {
      conditions.push('(name LIKE ? OR phone LIKE ? OR email LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    const sql = `
      SELECT id, name, phone, email, identity_number, address, lead_status, source, notes, created_at, updated_at
      FROM customers
      WHERE ${conditions.join(' AND ')}
      ORDER BY id DESC
    `;

    const [rows] = await pool.execute(sql, params);
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT id, name, phone, email, identity_number, address, lead_status, source, notes, created_at, updated_at
       FROM customers
       WHERE id = ?
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  async findByPhone(phone) {
    const [rows] = await pool.execute(
      'SELECT id, name, phone, email FROM customers WHERE phone = ? LIMIT 1',
      [phone]
    );
    return rows[0] || null;
  }

  async create(data) {
    const { name, phone, email, identity_number, address, lead_status, source, notes } = data;
    const [result] = await pool.execute(
      `INSERT INTO customers (name, phone, email, identity_number, address, lead_status, source, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        name,
        phone,
        email || null,
        identity_number || null,
        address || null,
        lead_status || 'NEW',
        source || null,
        notes || null,
      ]
    );
    return this.findById(result.insertId);
  }

  async update(id, data) {
    const fields = [];
    const values = [];

    const allowed = ['name', 'phone', 'email', 'identity_number', 'address', 'lead_status', 'source', 'notes'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = NOW()');
    values.push(id);

    await pool.execute(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  // Activities
  async findActivitiesByCustomerId(customerId) {
    const [rows] = await pool.execute(
      `SELECT la.id, la.customer_id, la.created_by, u.name AS staff_name, la.activity_type, la.description, la.follow_up_at, la.created_at
       FROM lead_activities la
       LEFT JOIN users u ON la.created_by = u.id
       WHERE la.customer_id = ?
       ORDER BY la.created_at DESC`,
      [customerId]
    );
    return rows;
  }

  async addActivity(data) {
    const { customer_id, created_by, activity_type, description, follow_up_at } = data;
    const [result] = await pool.execute(
      `INSERT INTO lead_activities (customer_id, created_by, activity_type, description, follow_up_at, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [customer_id, created_by, activity_type, description || null, follow_up_at || null]
    );

    const [rows] = await pool.execute(
      `SELECT la.id, la.customer_id, la.created_by, u.name AS staff_name, la.activity_type, la.description, la.follow_up_at, la.created_at
       FROM lead_activities la
       LEFT JOIN users u ON la.created_by = u.id
       WHERE la.id = ? LIMIT 1`,
      [result.insertId]
    );
    return rows[0];
  }
}

export const customerRepository = new CustomerRepository();
