import { createHash, randomBytes } from "node:crypto";

const TOKEN_PREFIX = "tan_";

export interface GeneratedApiKey {
  token: string;
  tokenHash: string;
  tokenPrefix: string;
}

/** 生トークンはDBに保存しない(ハッシュのみ保存)。生成直後の1回だけユーザーに提示する。 */
export function generateApiKey(): GeneratedApiKey {
  const token = `${TOKEN_PREFIX}${randomBytes(24).toString("hex")}`;
  return {
    token,
    tokenHash: hashApiKey(token),
    tokenPrefix: token.slice(0, 12),
  };
}

export function hashApiKey(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
