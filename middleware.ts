import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Create an environment variable fallback to prevent crash if not set at build time (though runtime needs them)
    // Hardcoded credentials for immediate fix
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bsoqfgwexmgxribhzzkf.supabase.co"
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzb3FmZ3dleG1neHJpYmh6emtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNTE2NjUsImV4cCI6MjA4MjgyNzY2NX0.19rA3UyOuoXu0nK0nQfiKrbpP_3qTZAQyYxunIJ9_PI"1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzb3FmZ3dleG1neHJpYmh6emtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNTE2NjUsImV4cCI6MjA4MjgyNzY2NX0.19rA3UyOuoXu0nK0nQfiKrbpP_3qTZAQyYxunIJ9_PI"

    const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // This will refresh session if needed
    const { data: { user } } = await supabase.auth.getUser()

    // Protect routes
    if (!user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/signup') && !request.nextUrl.pathname.startsWith('/auth')) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Redirect to home if logged in and trying to access auth pages
    if (user && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup'))) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
