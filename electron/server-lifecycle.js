import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { app } from 'electron';

const DEFAULT_PORT = 3001;
const HEALTH_PATH = '/health';
const STARTUP_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 250;

function tryPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(null));
    server.once('listening', () => {
      server.close(() => resolve(port));
    });
    server.listen(port, '127.0.0.1');
  });
}

export async function findAvailablePort(preferred = DEFAULT_PORT) {
  const preferredPort = await tryPort(preferred);
  if (preferredPort) {
    return preferredPort;
  }

  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.once('listening', () => {
      const address = server.address();
      const freePort = typeof address === 'object' && address ? address.port : DEFAULT_PORT;
      server.close(() => resolve(freePort));
    });
    server.listen(0, '127.0.0.1');
  });
}

export function getServerScriptPath() {
  return path.join(app.getAppPath(), 'dist-server', 'server', 'index.js');
}

export function startServer(port) {
  const serverScript = getServerScriptPath();

  const child = spawn(process.execPath, [serverScript], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      ORCA_DESKTOP: '1',
      HOST: '127.0.0.1',
      SERVER_PORT: String(port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout?.on('data', (chunk) => {
    console.log(`[orca-server] ${chunk.toString().trim()}`);
  });

  child.stderr?.on('data', (chunk) => {
    console.error(`[orca-server] ${chunk.toString().trim()}`);
  });

  return child;
}

export async function waitForServer(port, timeoutMs = STARTUP_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  const url = `http://127.0.0.1:${port}${HEALTH_PATH}`;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const body = await response.json();
        if (body?.status === 'ok') {
          return;
        }
      }
    } catch {
      // Server not ready yet.
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(`Orca server did not become ready on port ${port} within ${timeoutMs}ms`);
}

export function stopServer(child) {
  if (!child || child.killed) {
    return;
  }

  child.kill('SIGTERM');

  setTimeout(() => {
    if (!child.killed) {
      child.kill('SIGKILL');
    }
  }, 5000);
}
