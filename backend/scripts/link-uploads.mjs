// Points <app>/public/uploads at the Railway persistent volume before Strapi boots.
//
// Strapi's local upload provider only ever reads and writes <app>/public/uploads.
// On Railway that path is on the container's ephemeral disk, so without this link
// every uploaded file disappears on the next deploy.
//
// The volume is split deliberately. media/ is what public/uploads points at, so
// it is served by strapi::public; db/ is a sibling, which keeps the SQLite file
// off the publicly served path.
//
// No-ops when RAILWAY_VOLUME_MOUNT_PATH is unset, so local development and
// `strapi start` on a machine without the volume behave exactly as before.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const volume = process.env.RAILWAY_VOLUME_MOUNT_PATH;

if (!volume || !fs.existsSync(volume)) {
  process.exit(0);
}

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(volume, 'media');
const link = path.join(appDir, 'public', 'uploads');

fs.mkdirSync(target, { recursive: true });
fs.mkdirSync(path.join(volume, 'db'), { recursive: true });

// public/uploads ships as a real directory, and `strapi transfer` deletes and
// recreates it as one too — which silently strips this link and puts the
// imported assets back on the ephemeral disk. So treat a real directory here
// as files that still need rescuing: copy them onto the volume before the
// link replaces it, rather than deleting them outright.
const existing = fs.lstatSync(link, { throwIfNoEntry: false });
if (existing?.isSymbolicLink()) {
  if (fs.realpathSync(link) === fs.realpathSync(target)) {
    process.exit(0);
  }
  fs.unlinkSync(link);
} else if (existing?.isDirectory()) {
  const rescued = fs.readdirSync(link).filter((f) => f !== '.gitkeep');
  if (rescued.length > 0) {
    fs.cpSync(link, target, { recursive: true, force: true });
    console.log(`[link-uploads] moved ${rescued.length} file(s) onto the volume`);
  }
  fs.rmSync(link, { recursive: true, force: true });
} else if (existing) {
  fs.rmSync(link, { recursive: true, force: true });
}

fs.symlinkSync(target, link, 'dir');
console.log(`[link-uploads] ${link} -> ${target}`);
