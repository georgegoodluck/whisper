import { createHash } from 'crypto'

export function hashIp(ip: string) {
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY!.slice(0, 16)
  return createHash('sha256').update(ip + salt).digest('hex')
}

export function getIp(req: Request) {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? '0.0.0.0'
}
