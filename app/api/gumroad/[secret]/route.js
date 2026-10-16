import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'

export const dynamic = 'force-dynamic'

// Gumroad "Ping": set the URL in Gumroad > Settings > Advanced to
//   https://YOUR-SITE/api/gumroad/<GUMROAD_WEBHOOK_SECRET>
// Gumroad pings are not signed, so the secret in the path is what keeps strangers out.
export async function POST(req, { params }) {
  const { secret } = await params
  if (!process.env.GUMROAD_WEBHOOK_SECRET || secret !== process.env.GUMROAD_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 404 })
  }
  const form = await req.formData()
  const f = (k) => String(form.get(k) || '')
  const email = f('email').trim().toLowerCase()
  if (!email) return NextResponse.json({ ok: true, skipped: 'no email' })

  const only = process.env.GUMROAD_PRODUCT_ID
  if (only && ![f('product_id'), f('product_permalink')].includes(only)) {
    return NextResponse.json({ ok: true, skipped: 'other product' })
  }

  const revoked = f('refunded') === 'true' || f('chargebacked') === 'true' || f('disputed') === 'true'
  const { error } = await supabaseAdmin().from('purchasers').upsert(
    { email, active: !revoked, source: 'gumroad', sale_id: f('sale_id') || null, updated_at: new Date().toISOString() },
    { onConflict: 'email' }
  )
  if (error) return NextResponse.json({ ok: false }, { status: 500 })
  return NextResponse.json({ ok: true })
}
