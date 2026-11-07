import { describe, expect, it } from "vitest";

import { isMmoldOwner } from "../../../app/server/oidc/mmold-owner";
import type { OidcIdentity } from "../../../app/server/oidc/provider";

const owner = "seuchong@gmail.com";
const identity: OidcIdentity = {
  issuer: "https://accounts.google.com",
  subject: "123",
  name: "Owner",
  username: "owner",
  email: owner,
  emailVerified: true,
};

describe("MMold management login", () => {
  it("accepts the verified Google owner", () => {
    expect(isMmoldOwner(identity, owner)).toBe(true);
  });
  it.each([
    { email: "other@gmail.com" },
    { email: undefined },
    { emailVerified: false },
    { emailVerified: undefined },
    { issuer: "https://example.com" },
  ])("rejects an unauthorized identity %o before account creation", (change) => {
    expect(isMmoldOwner({ ...identity, ...change }, owner)).toBe(false);
  });
});
