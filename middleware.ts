import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Protect /admin/dashboard only
  if (path.startsWith('/admin/dashboard') && !user) {
    const url = new URL('/admin/login', request.url)
    url.searchParams.set('next', path)
    url.searchParams.set('reason', 'no-session')
    return NextResponse.redirect(url)
  }

  // If already logged in, don't show login/signup
  if ((path === '/admin/login' || path === '/admin/signup') && user) {
    // Only redirect if not already coming FROM the dashboard (avoid loops)
    const from = request.nextUrl.searchParams.get('from')
    if (from !== 'dashboard') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
