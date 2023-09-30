import { webcrypto } from "node:crypto";

export function generateRandomHex(length: number) {
  const random = new Uint8Array(length);

  webcrypto.getRandomValues(random);
  return Array.from(random)
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
}
