import bcrypt from 'bcryptjs';
import { pool } from '../src/config/database.js';

async function seedDevPasswords() {
  console.log('[Seeder] Hashing development password for demo accounts...');
  const devPassword = 'Password123!';
  const saltRounds = 10;
  const hash = await bcrypt.hash(devPassword, saltRounds);

  const [result] = await pool.execute(
    'UPDATE users SET password_hash = ? WHERE is_active = 1',
    [hash]
  );

  console.log(`[Seeder] Successfully updated ${result.affectedRows} users with dev password hash.`);
  console.log(`[Seeder] Dev credentials for testing:`);
  console.log(`         Password for all demo accounts: ${devPassword}`);
  console.log(`         - owner@permatasakinah.test (OWNER)`);
  console.log(`         - admin@permatasakinah.test (ADMIN)`);
  console.log(`         - staff1@permatasakinah.test (STAFF)`);
  console.log(`         - staff2@permatasakinah.test (STAFF)`);
  console.log(`         - budi.portal@example.test (CUSTOMER, id: 1)`);
  console.log(`         - ahmad.portal@example.test (CUSTOMER, id: 3)`);

  await pool.end();
}

seedDevPasswords().catch((err) => {
  console.error('[Seeder Error]', err.message);
  process.exit(1);
});
