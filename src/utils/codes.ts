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

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);

  const hashArray = Array.from(new Uint8Array(digest));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return hex;
}

async function generateCodeChallengePair(): Promise<{
  codeVerifier: string;
  codeChallenge: string;
}> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  return { codeVerifier, codeChallenge };
}

export {
  generateCodeChallenge,
  generateCodeChallengePair,
  generateCodeVerifier,
  generateState,
};
