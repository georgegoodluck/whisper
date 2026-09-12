export function generateInviteCode(length = 8): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789' // no ambiguous chars
  let out = ''
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length]
  return out
}

export function validateInviteCode(code: string): boolean {
  return /^[a-z0-9]{4,32}$/.test(code)
}
