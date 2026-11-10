import { createHash, randomBytes } from "node:crypto";
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const SERVICE_OWNER = "seuchong@gmail.com";
export interface ServiceToken {
  id: string;
  hash: string;
  owner: string;
  label: string;
  expiresAt: number;
  createdAt: number;
}
export function tokenPath(directory: string) {
  return join(directory, "mmold-service-tokens.json");
}
export function readTokens(directory: string): ServiceToken[] {
  const path = tokenPath(directory);
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : [];
}
function save(directory: string, records: ServiceToken[]) {
  const path = tokenPath(directory);
  const temporary = `${path}.${randomBytes(8).toString("hex")}`;
  writeFileSync(temporary, JSON.stringify(records), { mode: 0o600 });
  renameSync(temporary, path);
}
export function createServiceToken(directory: string, label: string, days: number) {
  if (!label.trim() || label.length > 80 || ![1, 7, 30].includes(days))
    throw new Error("請填寫 1～80 字元的名稱，並選擇 1、7 或 30 天");
  const records = readTokens(directory).filter((r) => r.expiresAt > Date.now());
  if (records.length >= 20) throw new Error("最多保留 20 把有效金鑰，請先撤銷舊金鑰");
  const token = `mmold_${randomBytes(32).toString("base64url")}`;
  const record: ServiceToken = {
    id: randomBytes(12).toString("hex"),
    hash: createHash("sha256").update(token).digest("hex"),
    owner: SERVICE_OWNER,
    label: label.trim(),
    createdAt: Date.now(),
    expiresAt: Date.now() + days * 86400000,
  };
  save(directory, [...records, record]);
  return { token, record };
}
export function revokeServiceToken(directory: string, id: string) {
  save(
    directory,
    readTokens(directory).filter((r) => r.id !== id),
  );
}
