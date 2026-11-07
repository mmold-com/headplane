import type { User } from "~/types/User";

export function getUserDisplayName(user: User): string {
  if (user.name === "tagged-devices") {
    return "由標籤管理";
  }

  return user.name || user.displayName || user.email || user.id;
}

export function sortUsersByDisplayName(users: User[]): User[] {
  return users.toSorted((a, b) => getUserDisplayName(a).localeCompare(getUserDisplayName(b)));
}

// Mirrors Headscale's `util.ValidateUsername` (hscontrol/util/dns.go): a name has
// to start with a letter and may only contain letters, numbers, `-`, `.`, `_` and
// at most one `@` (`\p{L}`/`\p{Nd}` match Go's `unicode.IsLetter`/`IsDigit`).
// The trailing `@` is ours: Headscale strips it when resolving a
// username in an ACL policy, so a user whose name ends in `@` is created fine but
// can never be matched by a rule.
export const USERNAME_PATTERN = String.raw`\p{L}[\p{L}\p{Nd}._\-]*(@[\p{L}\p{Nd}._\-]+)?`;

export const USERNAME_RULE =
  "使用者名稱至少需要 2 個字元，須以字母開頭，只能包含字母、數字、句點、連字號與底線；最多可有一個 @，且不得放在結尾。";

const usernameRegex = new RegExp(`^${USERNAME_PATTERN}$`, "u");

// Returns an error message when the username is not usable in Headscale.
export function validateUsername(name: string): string | undefined {
  if (name.length < 2 || !usernameRegex.test(name)) {
    return USERNAME_RULE;
  }
}
