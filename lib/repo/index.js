import { randomBytes, scryptSync } from 'node:crypto';
import { createMemoryRepo } from './memory.js';
import { createMssqlRepo } from './mssql.js';

export const hashPassword = (password, salt) => scryptSync(password, salt, 64).toString('hex');

async function create() {
  // 'memory' forces the in-memory store even when .env configures SQL Server (used by tests).
  const connectionString = process.env.MSSQL_CONNECTION_STRING === 'memory' ? '' : process.env.MSSQL_CONNECTION_STRING;
  const repo = connectionString ? await createMssqlRepo(connectionString) : createMemoryRepo();
  if (!connectionString) console.warn('MSSQL_CONNECTION_STRING chưa được đặt: dùng bộ nhớ tạm, dữ liệu mất khi dừng máy chủ.');
  if (!(await repo.countUsers())) {
    const password = process.env.ADMIN_PASSWORD || randomBytes(12).toString('base64url');
    if (password.length < 10) throw new Error('ADMIN_PASSWORD phải dài ít nhất 10 ký tự.');
    const salt = randomBytes(16).toString('hex');
    await repo.createUser('admin', salt, hashPassword(password, salt));
    if (!process.env.ADMIN_PASSWORD) console.log(`Tài khoản quản trị: admin / ${password} (lưu lại mật khẩu này)`);
  }
  return repo;
}

// Next.js bundles each route separately, so the store lives on globalThis to be shared.
export function getRepo() {
  globalThis.__inklineRepo ??= create().catch(error => { globalThis.__inklineRepo = undefined; throw error; });
  return globalThis.__inklineRepo;
}
