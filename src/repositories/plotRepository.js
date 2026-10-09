import { pool } from '../config/database.js';

export class PlotRepository {
  async findAll(filters = {}) {
    const conditions = ['1=1'];
    const params = [];

    const projectId = filters.projectId || filters.project_id;
    if (projectId) {
      conditions.push('p.project_id = ?');
      params.push(projectId);
    }

    if (filters.status && filters.status !== 'ALL') {
      conditions.push('p.status = ?');
      params.push(filters.status);
    }

    const block = filters.block || filters.block_name;
    if (block) {
      conditions.push('p.block_name = ?');
      params.push(block);
    }

    if (filters.min_price) {
      conditions.push('p.price >= ?');
      params.push(Number(filters.min_price));
    }

    if (filters.max_price) {
      conditions.push('p.price <= ?');
      params.push(Number(filters.max_price));
    }

    if (filters.search) {
      conditions.push('(p.plot_code LIKE ? OR p.block_name LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const sql = `
      SELECT 
        p.id,
        p.project_id,
        pr.name AS project_name,
        p.plot_code,
        p.plot_code AS code,
        p.block_name,
        p.block_name AS block,
        p.area_sqm,
        p.area_sqm AS area_m2,
        p.price,
        p.status,
        p.site_x,
        p.site_y,
        p.description,
        p.description AS notes,
        p.created_at,
        p.updated_at
      FROM plots p
      INNER JOIN projects pr ON p.project_id = pr.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY p.project_id ASC, p.plot_code ASC
    `;

    const [rows] = await pool.execute(sql, params);
    return rows.map((r) => ({
      ...r,
      price: Number(r.price),
      area_sqm: Number(r.area_sqm),
      area_m2: Number(r.area_sqm),
    }));
  }

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT 
        p.id,
        p.project_id,
        pr.name AS project_name,
        p.plot_code,
        p.plot_code AS code,
        p.block_name,
        p.block_name AS block,
        p.area_sqm,
        p.area_sqm AS area_m2,
        p.price,
        p.status,
        p.site_x,
        p.site_y,
        p.description,
        p.description AS notes,
        p.created_at,
        p.updated_at
      FROM plots p
      INNER JOIN projects pr ON p.project_id = pr.id
      WHERE p.id = ?
      LIMIT 1`,
      [id]
    );

    if (!rows[0]) return null;
    const r = rows[0];
    return {
      ...r,
      price: Number(r.price),
      area_sqm: Number(r.area_sqm),
      area_m2: Number(r.area_sqm),
    };
  }

  async findByProjectAndCode(projectId, plotCode) {
    const [rows] = await pool.execute(
      'SELECT id FROM plots WHERE project_id = ? AND plot_code = ? LIMIT 1',
      [projectId, plotCode]
    );
    return rows[0] || null;
  }

  async create(data) {
    const { project_id, plot_code, block_name, area_sqm, price, status, site_x, site_y, description } = data;
    const [result] = await pool.execute(
      `INSERT INTO plots (project_id, plot_code, block_name, area_sqm, price, status, site_x, site_y, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        project_id,
        plot_code,
        block_name || null,
        area_sqm,
        price,
        status || 'AVAILABLE',
        site_x ?? null,
        site_y ?? null,
        description || null,
      ]
    );
    return this.findById(result.insertId);
  }

  async update(id, data) {
    const fields = [];
    const values = [];

    const allowed = ['plot_code', 'block_name', 'area_sqm', 'price', 'status', 'site_x', 'site_y', 'description'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = NOW()');
    values.push(id);

    await pool.execute(`UPDATE plots SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }
}

export const plotRepository = new PlotRepository();
