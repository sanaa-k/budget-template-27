'use client'
import { useEffect, useRef, useState } from 'react'
import { supabaseBrowser } from '../lib/supabase'

export default function Home() {
  const [phase, setPhase] = useState('loading') // loading | signin | sent | noaccess | app | error
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [who, setWho] = useState('')
  const started = useRef(false)

  useEffect(() => {
    const sb = supabaseBrowser()
    async function start(session) {
      if (started.current) return
      if (!session) { setPhase('signin'); return }
      started.current = true
      const mail = session.user.email || ''
      setWho(mail)
      const ok = await sb.rpc('is_purchaser')
      if (ok.error) { setMsg(ok.error.message); setPhase('error'); started.current = false; return }
      if (!ok.data) { setPhase('noaccess'); return }
      const row = await sb.from('budgets').select('data').eq('user_id', session.user.id).maybeSingle()
      if (row.error && row.error.code !== 'PGRST116') { setMsg(row.error.message); setPhase('error'); started.current = false; return }

      let latest = null, timer = null
      const flush = async () => {
        if (!latest) return
        const data = latest; latest = null; clearTimeout(timer)
        const r = await sb.from('budgets').upsert({ user_id: session.user.id, data, updated_at: new Date().toISOString() })
        if (r.error) console.error('Save failed', r.error.message)
      }
      window.__BT_INITIAL = row.data ? row.data.data : null
      window.__BT_USER = mail
      window.__BT_SAVE = (s) => { latest = JSON.parse(JSON.stringify(s)); clearTimeout(timer); timer = setTimeout(flush, 500) }
      window.__BT_SIGNOUT = async () => { await flush(); await sb.auth.signOut(); window.location.reload() }
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush() })
      window.addEventListener('pagehide', flush)
      setPhase('app')
    }
    sb.auth.getSession().then(({ data }) => start(data.session))
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => { if (session) start(session) })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (phase !== 'app') return
    if (document.getElementById('bt-script')) return
    const s = document.createElement('script')
    s.id = 'bt-script'
    s.src = '/budget.js'
    document.body.appendChild(s)
  }, [phase])

  async function requestLink(e) {
    e.preventDefault()
    setBusy(true); setMsg('')
    try {
      const r = await fetch('/api/request-link', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) })
      if (!r.ok) throw new Error('Something went wrong. Try again in a minute.')
      setPhase('sent')
    } catch (err) { setMsg(err.message) }
    setBusy(false)
  }

  async function signOut() {
    await supabaseBrowser().auth.signOut()
    window.location.reload()
  }

  if (phase === 'app') return (<><div id="app"></div><div id="toast" className="toast" hidden></div></>)

  let body
  if (phase === 'loading') body = <p className="muted">Loading…</p>
  else if (phase === 'sent') body = (<>
    <h1>Check your inbox</h1>
    <p className="muted">If <b>{email}</b> has access, a sign-in link is on its way. It can take a minute. Check your spam folder if you don&apos;t see it.</p>
    <p style={{ marginTop: 12 }}><button className="linkbtn muted" onClick={() => setPhase('signin')}>Use a different email</button></p>
  </>)
  else if (phase === 'noaccess') body = (<>
    <h1>No access yet</h1>
    <p className="muted">{who} isn&apos;t on the access list. Sign in with the email you used to buy the template.</p>
    <button className="btn" style={{ width: '100%', marginTop: 16 }} onClick={signOut}>Sign out</button>
  </>)
  else if (phase === 'error') body = (<>
    <h1>Something went wrong</h1>
    <p className="muted">{msg}</p>
    <button className="btn" style={{ width: '100%', marginTop: 16 }} onClick={() => window.location.reload()}>Reload</button>
  </>)
  else body = (<>
    <h1>Budget Template</h1>
    <p className="muted">Sign in with the email you used to buy the template.</p>
    <form onSubmit={requestLink} style={{ marginTop: 18 }}>
      <label htmlFor="em">Email</label>
      <input id="em" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button className="btn" style={{ width: '100%', marginTop: 12 }} type="submit" disabled={busy}>{busy ? 'Sending…' : 'Email me a sign-in link'}</button>
    </form>
    {msg && <p className="hint" style={{ color: 'var(--bad)' }}>{msg}</p>}
  </>)

  return <div className="gate"><div className="card">{body}</div></div>
}
