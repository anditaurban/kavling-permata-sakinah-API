import { pool } from '../config/database.js';

export class ProjectRepository {
  async findAll() {
    const [rows] = await pool.execute(`
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p.location_text,
        p.address,
        p.status,
        p.cover_image_url,
        p.created_at,
        p.updated_at,
        COUNT(pl.id) AS total_plots,
        COUNT(CASE WHEN pl.status = 'AVAILABLE' THEN 1 END) AS available_plots
      FROM projects p
      LEFT JOIN plots pl ON p.id = pl.project_id
      GROUP BY p.id
      ORDER BY p.id ASC
    `);

    // Fetch images for all projects
    const [images] = await pool.execute(`
      SELECT id, project_id, image_url, caption, is_primary, sort_order
      FROM project_images
      ORDER BY sort_order ASC
    `);

    return rows.map((project) => ({
      ...project,
      total_plots: Number(project.total_plots),
      available_plots: Number(project.available_plots),
      images: images.filter((img) => img.project_id === project.id),
    }));
  }

  async findByIdOrSlug(identifier) {
    const isNumeric = !isNaN(identifier);
    const sql = isNumeric
      ? 'SELECT * FROM projects WHERE id = ? LIMIT 1'
      : 'SELECT * FROM projects WHERE slug = ? LIMIT 1';

    const [rows] = await pool.execute(sql, [identifier]);
    if (!rows[0]) return null;

    const project = rows[0];

    // Get aggregated plots counts
    const [counts] = await pool.execute(
      `SELECT 
        COUNT(id) AS total_plots,
        COUNT(CASE WHEN status = 'AVAILABLE' THEN 1 END) AS available_plots
       FROM plots WHERE project_id = ?`,
      [project.id]
    );

    // Get project images
    const [images] = await pool.execute(
      `SELECT id, project_id, image_url, caption, is_primary, sort_order
       FROM project_images
       WHERE project_id = ?
       ORDER BY sort_order ASC`,
      [project.id]
    );

    return {
      ...project,
      total_plots: Number(counts[0]?.total_plots || 0),
      available_plots: Number(counts[0]?.available_plots || 0),
      images,
    };
  }

  async create(data) {
    const { name, slug, description, location_text, address, status, cover_image_url } = data;
    const [result] = await pool.execute(
      `INSERT INTO projects (name, slug, description, location_text, address, status, cover_image_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [name, slug, description || null, location_text || null, address || null, status || 'ACTIVE', cover_image_url || null]
    );
    return this.findByIdOrSlug(result.insertId);
  }

  async update(id, data) {
    const fields = [];
    const values = [];

    const allowed = ['name', 'slug', 'description', 'location_text', 'address', 'status', 'cover_image_url'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) return this.findByIdOrSlug(id);

    fields.push('updated_at = NOW()');
    values.push(id);

    await pool.execute(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findByIdOrSlug(id);
  }

  async hasPlots(id) {
    const [rows] = await pool.execute('SELECT COUNT(*) AS count FROM plots WHERE project_id = ?', [id]);
    return Number(rows[0]?.count || 0) > 0;
  }

  async delete(id) {
    await pool.execute('DELETE FROM projects WHERE id = ?', [id]);
    return true;
  }
}

export const projectRepository = new ProjectRepository();
