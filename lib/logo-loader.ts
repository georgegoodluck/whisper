'use client'

// Cache so we only fetch once per session
let cachedLogo: string | null = null

export async function loadLogoAsDataUrl(path = '/logo.png'): Promise<string> {
  if (cachedLogo) return cachedLogo
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Logo fetch failed: ${res.status}`)
  const blob = await res.blob()
  cachedLogo = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
  return cachedLogo
}
