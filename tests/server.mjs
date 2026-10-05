// Starts the built Next.js app (`npm run build` first) on a free port for tests.
// Never touches the database in .env: uses memory, or TEST_MSSQL_CONNECTION_STRING (a disposable database).
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const freePort = () => new Promise(resolve => { const s = createServer().listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); }); });

export async function startServer(env = {}) {
  if (!existsSync(path.join(root, '.next', 'BUILD_ID'))) throw new Error('Chưa có bản build. Chạy "npm run build" trước khi test.');
  const port = await freePort();
  const child = spawn(process.execPath, [path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next'), 'start', '-p', String(port), '-H', '127.0.0.1'], { cwd: root, env: { ...process.env, MSSQL_CONNECTION_STRING: process.env.TEST_MSSQL_CONNECTION_STRING || 'memory', ...env }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let logs = '';
  child.stdout.on('data', c => logs += c);
  child.stderr.on('data', c => logs += c);
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 150; i++) {
    if (child.exitCode !== null) throw new Error('Server exited: ' + logs);
    try { await fetch(base + '/api/session'); break; } catch { await new Promise(r => setTimeout(r, 100)); }
    if (i === 149) throw new Error('Server timeout: ' + logs);
  }
  return {
    base,
    logs: () => logs,
    async stop() {
      if (child.exitCode !== null || child.signalCode !== null) return;
      const done = new Promise(resolve => child.once('exit', resolve));
      child.kill();
      await Promise.race([done, new Promise(r => setTimeout(r, 3000))]);
    }
  };
}
