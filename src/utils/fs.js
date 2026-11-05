import { mkdir, readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const isDirectory = async (path) => {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
};

const listEntries = (dir) =>
  readdir(dir, { withFileTypes: true }).then((entries) =>
    entries.map((entry) => ({
      name: entry.name,
      path: join(dir, entry.name),
      isDirectory: entry.isDirectory(),
      isFile: entry.isFile(),
    })),
  );

export const walkFiles = async (root, { skipDir = () => false } = {}) => {
  const visit = async (current) => {
    const entries = await listEntries(current);
    const nested = await Promise.all(
      entries
        .filter((entry) => entry.isDirectory && !skipDir(entry.path))
        .map((entry) => visit(entry.path)),
    );
    return [
      ...entries.filter((entry) => entry.isFile).map((entry) => entry.path),
      ...nested.flat(),
    ];
  };

  return (await isDirectory(root)) ? visit(root) : [root];
};

export const readText = (path) => readFile(path, "utf8");

export const fileSize = async (path) => (await stat(path)).size;

export const ensureDir = (dirPath) => mkdir(dirPath, { recursive: true });

export const fileExists = async (path) => {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};
