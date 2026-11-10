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
      for (const role of ["maint", "factory"]) {
        if (account === "seuchong" && role === "factory") continue;
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
