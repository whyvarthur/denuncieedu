import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const PREFIX = "enc:v1:";

function key(): Buffer {
  const raw = process.env["DENUNCIA_CRYPTO_KEY"];
  if (!raw) throw new Error("DENUNCIA_CRYPTO_KEY não configurada.");
  return createHash("sha256").update(raw, "utf8").digest();
}

export function encryptBuffer(plain: Buffer): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ct]);
}

export function decryptBuffer(stored: Buffer): Buffer {
  const iv = stored.subarray(0, 12);
  const tag = stored.subarray(12, 28);
  const ct = stored.subarray(28);
  const d = createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(ct), d.final()]);
}

export function encryptText(value: string): string {
  return PREFIX + encryptBuffer(Buffer.from(value, "utf8")).toString("base64");
}

export function decryptText(value: string | null): string {
  if (!value) return "";
  if (!value.startsWith(PREFIX)) return value;
  try {
    return decryptBuffer(Buffer.from(value.slice(PREFIX.length), "base64")).toString("utf8");
  } catch {
    return "[conteúdo ilegível]";
  }
}
