import { NextResponse } from 'next/server'
import { supabaseAdmin, supabaseAnonServer } from '../../../lib/supabase'

export const dynamic = 'force-dynamic'

// Sends a sign-in link only to emails on the purchasers list.
// The reply is the same either way, so the form can't be used to check who bought.
export async function POST(req) {
  let email = ''
  try { email = String((await req.json()).email || '').trim().toLowerCase() } catch {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: true })

  const { data, error } = await supabaseAdmin().from('purchasers').select('active').eq('email', email).maybeSingle()
  if (error) return NextResponse.json({ ok: false }, { status: 500 })

  if (data && data.active) {
    const site = process.env.NEXT_PUBLIC_SITE_URL || req.headers.get('origin') || new URL(req.url).origin
    const r = await supabaseAnonServer().auth.signInWithOtp({ email, options: { emailRedirectTo: site, shouldCreateUser: true } })
    if (r.error) return NextResponse.json({ ok: false, error: r.error.message }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
