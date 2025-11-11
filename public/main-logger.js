import { app } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';

function isoTs() {
  return new Date().toISOString();
}

function logFilePath() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const logsDir = path.join(app.getPath('userData'), 'logs');
  const file = path.join(logsDir, `app-${yyyy}-${mm}-${dd}.log`);
  return { logsDir, file };
}

const MAX_BYTES = 5 * 1024 * 1024; // 5MB rotation threshold

function tsSuffix() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}${mi}${ss}`;
}

async function rotateIfNeeded(file) {
  try {
    const stat = await fs.stat(file);
    if (stat.size >= MAX_BYTES) {
      const ext = path.extname(file); // .log
      const base = file.slice(0, -ext.length);
      const rotated = `${base}-${tsSuffix()}${ext}`;
      await fs.rename(file, rotated);
    }
  } catch (e) {
    // if file doesn't exist yet, stat will fail; ignore
  }
}

async function append(line) {
  try {
    const { logsDir, file } = logFilePath();
    await fs.mkdir(logsDir, { recursive: true });
    // rotate by size before appending
    await rotateIfNeeded(file);
    await fs.appendFile(file, line + '\n', 'utf8');
  } catch {
    // ignore file write errors to avoid crashing app logging
  }
}

function format(level, args) {
  const parts = args.map((a) => {
    if (typeof a === 'string') return a;
    try {
      return JSON.stringify(a);
    } catch {
      try { return String(a); } catch { return '[Unserializable]'; }
    }
  });
  return `${isoTs()} [${level.toUpperCase()}] ${parts.join(' ')}`;
}

const toConsole = {
  debug: (...args) => (console.debug || console.log)(...args),
  info: (...args) => (console.info || console.log)(...args),
  warn: (...args) => (console.warn || console.log)(...args),
  error: (...args) => (console.error || console.log)(...args),
};

export const mainLogger = {
  debug: (...args) => {
    const line = format('debug', args);
    toConsole.debug(line);
    if (app.isPackaged) void append(line);
  },
  info: (...args) => {
    const line = format('info', args);
    toConsole.info(line);
    if (app.isPackaged) void append(line);
  },
  warn: (...args) => {
    const line = format('warn', args);
    toConsole.warn(line);
    if (app.isPackaged) void append(line);
  },
  error: (...args) => {
    const line = format('error', args);
    toConsole.error(line);
    if (app.isPackaged) void append(line);
  },
};

export default mainLogger;
