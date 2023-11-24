function generateState() {
  return Math.random().toString(36).substring(7);
}

function generateCodeVerifier(): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const codeVerifier: string[] = [];
  const length = 128;

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    codeVerifier.push(charset.charAt(randomIndex));
  }

  return codeVerifier.join("");
}

async function generateCodeChallenge(codeVerifier: string) {
  if (!window || !window.crypto) return;
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const buffer = await window.crypto.subtle.digest("SHA-256", data);
  const codeChallenge = Array.from(new Uint8Array(buffer))
    .map((byte) => String.fromCharCode(byte))
    .join("");
  return base64UrlEncode(codeChallenge);
}

function base64UrlEncode(input: string): string {
  const base64 = btoa(input);
  return base64.replace("+", "-").replace("/", "_").replace(/=+$/, "");
}

async function generateCodeChallengePair(): Promise<{
  codeVerifier: string;
  codeChallenge: string;
}> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  if (!codeChallenge) {
    throw new Error("No se pudo generar el code challenge");
  }
  return { codeVerifier, codeChallenge };
}

export {
  base64UrlEncode,
  generateCodeChallenge,
  generateCodeChallengePair,
  generateCodeVerifier,
  generateState,
};
