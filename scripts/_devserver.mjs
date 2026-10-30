// In-process Vite dev server (one node process for server + driver). Usage: const s = await startDev(5191); ... await s.close();
import { createServer } from 'vite';
export async function startDev(port = 5191) {
  const s = await createServer({ server: { port, strictPort: true, host: '127.0.0.1' }, logLevel: 'error' });
  await s.listen();
  return s;
}
