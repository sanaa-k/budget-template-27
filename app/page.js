'use client'
import { useEffect, useRef, useState } from 'react'
import { supabaseBrowser } from '../lib/supabase'
import * as vault from '../lib/vault'

export default function Home() {
  const [phase, setPhase] = useState('loading') // loading | signin | sent | noaccess | app | error | setpass | reckey | unlock | recover
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [who, setWho] = useState('')
  const started = useRef(false)
  const ctx = useRef(null)
  const [pass, setPass] = useState('')
  const [pass2, setPass2] = useState('')
  const [keep, setKeep] = useState(true)
  const [recovery, setRecovery] = useState('')
  const [ack, setAck] = useState(false)
  const [recInput, setRecInput] = useState('')

  // Hand the (decrypted) budget to the app. Every save is encrypted here before it leaves the browser.
  function enter(obj, dek, env) {
    const { sb, uid, mail } = ctx.current
    let latest = null, timer = null, chain = Promise.resolve()
    const flush = () => {
      if (!latest) return chain
      const data = latest; latest = null; clearTimeout(timer)
      chain = chain.then(async () => {
        const envelope = await vault.encrypt(dek, data, env)
        const r = await sb.from('budgets').upsert({ user_id: uid, data: envelope, updated_at: new Date().toISOString() })
        if (r.error) console.error('Save failed', r.error.message)
      }).catch((e) => console.error('Save failed', e && e.message))
      return chain
    }
    window.__BT_INITIAL = obj || null
    window.__BT_USER = mail
    window.__BT_SAVE = (st) => { latest = JSON.parse(JSON.stringify(st)); clearTimeout(timer); timer = setTimeout(flush, 500) }
    window.__BT_SIGNOUT = async () => { await flush(); await vault.forget(uid); await sb.auth.signOut(); window.location.reload() }
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush() })
    window.addEventListener('pagehide', flush)
    setPhase('app')
  }
  const writeEnvelope = async (envelope) => {
    const { sb, uid } = ctx.current
    const r = await sb.from('budgets').upsert({ user_id: uid, data: envelope, updated_at: new Date().toISOString() })
    if (r.error) throw new Error(r.error.message)
  }
  async function doSetup(e) {
    e.preventDefault(); setMsg('')
    if (pass.length < 10) { setMsg('Use at least 10 characters. A few random words works well.'); return }
    if (pass !== pass2) { setMsg('The two passphrases do not match.'); return }
    setBusy(true)
    try {
      const { stored } = ctx.current
      const made = await vault.create(pass, stored || null)
      await writeEnvelope(made.envelope)
      ctx.current.pending = { obj: stored || null, dek: made.dek, env: made.envelope }
      setRecovery(made.recovery); setAck(false); setPhase('reckey')
    } catch (err) { setMsg('Could not save. ' + (err.message || '')) }
    setBusy(false)
  }
  async function finishSetup() {
    const { pending, uid } = ctx.current
    if (keep) await vault.remember(uid, pending.dek)
    enter(pending.obj, pending.dek, pending.env)
  }
  async function doUnlock(e) {
    e.preventDefault(); setMsg(''); setBusy(true)
    try {
      const { stored, uid } = ctx.current
      const dek = await vault.unlockWithPass(stored, pass)
      const obj = await vault.decrypt(dek, stored)
      if (keep) await vault.remember(uid, dek)
      enter(obj, dek, stored)
    } catch (err) { setMsg('That passphrase did not work. Check it and try again.') }
    setBusy(false)
  }
  async function doRecover(e) {
    e.preventDefault(); setMsg('')
    if (pass.length < 10) { setMsg('Use at least 10 characters for the new passphrase.'); return }
    if (pass !== pass2) { setMsg('The two passphrases do not match.'); return }
    setBusy(true)
    try {
      const { stored, uid } = ctx.current
      let r
      try { r = await vault.recover(stored, recInput, pass) } catch (err) { setMsg('That recovery key did not work. Check it and try again.'); setBusy(false); return }
      await writeEnvelope(r.envelope)
      if (keep) await vault.remember(uid, r.dek)
      enter(r.obj, r.dek, r.envelope)
    } catch (err) { setMsg('Could not save. ' + (err.message || '')) }
    setBusy(false)
  }

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

      const stored = row.data ? row.data.data : null
      ctx.current = { sb, uid: session.user.id, mail, stored }
      if (vault.isVault(stored)) {
        const k = await vault.recall(session.user.id)
        if (k) { try { enter(await vault.decrypt(k, stored), k, stored); return } catch (e) {} }
        setPhase('unlock')
      } else setPhase('setpass')
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
    window.__BT_V = String(process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || Date.now())
    s.src = '/budget.js?v=' + (process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || Date.now())
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
    if (ctx.current) await vault.forget(ctx.current.uid)
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
  else if (phase === 'setpass') body = (<>
    <h1>Protect your budget</h1>
    <p className="muted">{ctx.current && ctx.current.stored ? 'Your existing budget will be locked with a passphrase now.' : 'Choose a passphrase to lock your budget.'} It is encrypted on your device before it is saved, so nobody else can read it, including the person who made this template.</p>
    <p className="muted" style={{ marginTop: 8 }}><b>Nobody can reset this passphrase.</b> On the next screen you will get a recovery key in case you forget it.</p>
    <form onSubmit={doSetup} style={{ marginTop: 14 }}>
      <label htmlFor="pp">Passphrase</label>
      <input id="pp" type="password" autoComplete="new-password" required value={pass} onChange={(e) => setPass(e.target.value)} />
      <label htmlFor="pp2" style={{ marginTop: 10, display: 'block' }}>Type it again</label>
      <input id="pp2" type="password" autoComplete="new-password" required value={pass2} onChange={(e) => setPass2(e.target.value)} />
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, fontWeight: 400 }}><input type="checkbox" style={{ width: 'auto' }} checked={keep} onChange={(e) => setKeep(e.target.checked)} /> Remember me on this device</label>
      <button className="btn" style={{ width: '100%', marginTop: 12 }} type="submit" disabled={busy}>{busy ? 'Locking…' : 'Lock my budget'}</button>
    </form>
    {msg && <p className="hint" style={{ color: 'var(--bad)' }}>{msg}</p>}
    <p style={{ marginTop: 12 }}><button className="linkbtn muted" onClick={signOut}>Sign out</button></p>
  </>)
  else if (phase === 'reckey') body = (<>
    <h1>Save your recovery key</h1>
    <p className="muted">If you forget your passphrase, this key is the only way back in. Store it somewhere safe, like a password manager. It is shown once.</p>
    <code style={{ display: 'block', margin: '14px 0', padding: 12, background: 'var(--surface2)', borderRadius: 8, wordBreak: 'break-all', fontSize: 15, letterSpacing: '.03em' }}>{recovery}</code>
    <div style={{ display: 'flex', gap: 8 }}>
      <button className="btn ghost" type="button" onClick={() => { try { navigator.clipboard.writeText(recovery) } catch (e) {} }}>Copy</button>
      <button className="btn ghost" type="button" onClick={() => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['Budget Template recovery key\n\n' + recovery + '\n\nKeep this private. Anyone with it and your account can open your budget.\n'], { type: 'text/plain' })); a.download = 'budget-recovery-key.txt'; a.click() }}>Download</button>
    </div>
    <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 14, fontWeight: 400 }}><input type="checkbox" style={{ width: 'auto' }} checked={ack} onChange={(e) => setAck(e.target.checked)} /> I have saved my recovery key</label>
    <button className="btn" style={{ width: '100%', marginTop: 12 }} disabled={!ack} onClick={finishSetup}>Continue to my budget</button>
  </>)
  else if (phase === 'unlock') body = (<>
    <h1>Unlock your budget</h1>
    <p className="muted">Enter your passphrase. It never leaves this device.</p>
    <form onSubmit={doUnlock} style={{ marginTop: 14 }}>
      <label htmlFor="pp">Passphrase</label>
      <input id="pp" type="password" autoComplete="current-password" required autoFocus value={pass} onChange={(e) => setPass(e.target.value)} />
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, fontWeight: 400 }}><input type="checkbox" style={{ width: 'auto' }} checked={keep} onChange={(e) => setKeep(e.target.checked)} /> Remember me on this device</label>
      <button className="btn" style={{ width: '100%', marginTop: 12 }} type="submit" disabled={busy}>{busy ? 'Unlocking…' : 'Unlock'}</button>
    </form>
    {msg && <p className="hint" style={{ color: 'var(--bad)' }}>{msg}</p>}
    <p style={{ marginTop: 12 }}><button className="linkbtn muted" onClick={() => { setMsg(''); setPass(''); setPass2(''); setPhase('recover') }}>I forgot my passphrase</button> &nbsp; <button className="linkbtn muted" onClick={signOut}>Sign out</button></p>
  </>)
  else if (phase === 'recover') body = (<>
    <h1>Use your recovery key</h1>
    <p className="muted">Enter the recovery key you saved, then choose a new passphrase.</p>
    <form onSubmit={doRecover} style={{ marginTop: 14 }}>
      <label htmlFor="rk">Recovery key</label>
      <input id="rk" type="text" autoComplete="off" required value={recInput} onChange={(e) => setRecInput(e.target.value)} />
      <label htmlFor="pp" style={{ marginTop: 10, display: 'block' }}>New passphrase</label>
      <input id="pp" type="password" autoComplete="new-password" required value={pass} onChange={(e) => setPass(e.target.value)} />
      <label htmlFor="pp2" style={{ marginTop: 10, display: 'block' }}>Type it again</label>
      <input id="pp2" type="password" autoComplete="new-password" required value={pass2} onChange={(e) => setPass2(e.target.value)} />
      <button className="btn" style={{ width: '100%', marginTop: 12 }} type="submit" disabled={busy}>{busy ? 'Working…' : 'Unlock with recovery key'}</button>
    </form>
    {msg && <p className="hint" style={{ color: 'var(--bad)' }}>{msg}</p>}
    <p style={{ marginTop: 12 }}><button className="linkbtn muted" onClick={() => { setMsg(''); setPhase('unlock') }}>Back</button></p>
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
