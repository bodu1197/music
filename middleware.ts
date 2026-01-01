import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()

    // Create a Supabase client configured to use cookies
    const supabase = createMiddlewareClient({ req, res })

    // Refresh session if expired - required for Server Components
    const { data: { session } } = await supabase.auth.getSession()

    const requestUrl = new URL(req.url)

    // Auth Guard
    if (!session && !requestUrl.pathname.startsWith('/login') && !requestUrl.pathname.startsWith('/signup') && !requestUrl.pathname.startsWith('/auth')) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    // Redirect to home if logged in and trying to access auth pages
    if (session && (requestUrl.pathname.startsWith('/login') || requestUrl.pathname.startsWith('/signup'))) {
        return NextResponse.redirect(new URL('/', req.url))
    }

    return res
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
