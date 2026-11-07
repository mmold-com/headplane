import type { OidcIdentity } from "./provider";

// Empty owner preserves upstream behavior. The MMold deployment always sets it.
export function isMmoldOwner(identity: OidcIdentity, owner: string | undefined): boolean {
  if (!owner) return true;
  return (
    identity.issuer === "https://accounts.google.com" &&
    identity.emailVerified === true &&
    identity.email?.trim().toLowerCase() === owner.trim().toLowerCase()
  );
}
