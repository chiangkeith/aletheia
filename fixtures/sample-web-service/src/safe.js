import { readFile } from "node:fs/promises";
import { join, normalize, relative } from "node:path";

const DATA_ROOT = "/var/app/data";

export const readAllowedFile = async (name) => {
  const resolved = normalize(join(DATA_ROOT, name));
  const relativePath = relative(DATA_ROOT, resolved);
  if (relativePath.startsWith("..") || relativePath.includes("..")) {
    throw new Error("path rejected");
  }
  return readFile(resolved, "utf8");
};

export const findUser = (db, name) => db.query("SELECT id FROM users WHERE name = ?", [name]);
