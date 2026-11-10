import type { Machine } from "~/types";

import type { Principal } from "../web/auth";

export const MMOLD_APPROVERS = ["seuchong@gmail.com", "ffttyus@gmail.com", "mmold2005@gmail.com"];
export const MMOLD_ACCOUNTS = ["seuchong", "mmold2005", "ffttyus", "hubert2047", "yikaitang6"];
export function isApproverEmail(email?: string) {
  return !!email && MMOLD_APPROVERS.includes(email.trim().toLowerCase());
}
export function canApprove(principal: Principal) {
  return principal.kind === "oidc" && isApproverEmail(principal.profile.email);
}
export function deviceIdentity(node: Machine) {
  const tags = node.tags ?? [];
  if (tags.length) {
    if (tags.length !== 1) return undefined;
    for (const account of MMOLD_ACCOUNTS) {
      for (const role of ["maint", "factory", "disabled-factory"]) {
        if (account === "seuchong" && role !== "maint") continue;
        if (tags[0] === `tag:${role}-${account}`) return { email: `${account}@gmail.com`, role };
      }
    }
    return undefined;
  }
  const email = node.user?.email?.trim().toLowerCase();
  if (
    node.user?.provider !== "oidc" ||
    !MMOLD_ACCOUNTS.some((name) => email === `${name}@gmail.com`)
  )
    return undefined;
  return { email: email!, role: "pending" };
}
export function approvalTag(node: Machine, role: string, allowedUsers: string[]) {
  const identity = deviceIdentity(node);
  if (!identity || !allowedUsers.includes(identity.email))
    throw new Error("設備身分不明或帳號已停用");
  if (!["maintenance", "factory"].includes(role)) throw new Error("用途不正確");
  const name = identity.email.split("@")[0];
  if (name === "seuchong" && role === "factory") throw new Error("此帳號未配置工廠用途");
  return `tag:${role === "maintenance" ? "maint" : "factory"}-${name}`;
}

export function canOperateServices(principal: Principal) {
  return (
    principal.kind === "oidc" &&
    principal.profile.email?.trim().toLowerCase() === "seuchong@gmail.com"
  );
}
export function factoryDevice(identity: ReturnType<typeof deviceIdentity>) {
  return identity?.role === "factory" || identity?.role === "disabled-factory";
}
export function validateDeviceName(value: string) {
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(value))
    throw new Error("主機名稱須為 1～63 字元，僅限小寫英文字母、數字及中間的連字號");
  return value;
}
