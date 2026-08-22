export class AuthPolicyError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "AuthPolicyError";
  }
}
