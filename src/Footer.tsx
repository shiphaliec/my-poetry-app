import { useState, useEffect } from 'react'
import { db } from './firebase'
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  doc,
  deleteDoc,
} from 'firebase/firestore'

const COLORS = {
  ink:    '#1a1410',
  paper:  '#f5f0e8',
  aged:   '#e8dfc8',
  candle: '#c8a45a',
  dim:    '#7a6e5f',
  surface:'#1e1810',
} as const

// ── CHANGE THIS to your own secret password ────────────────────────────────
const OWNER_PASSWORD = 'versesinthedark'

const POEM_TITLES = [
  { id: 1, title: 'Few Lines pt-1' },
  { id: 2, title: 'The lost letter' },
  { id: 3, title: 'The last minute gift' },
  { id: 4, title: 'Message from tomorrow' },
  { id: 5, title: 'Teacher"s Day' },
  { id: 6, title: 'The Lock Story' },
  { id: 7, title: 'The Borrow' },
  { id:8, title: 'The packet of universe'},
]

interface Comment {
  id: string
  name: string
  message: string
  favourite: string
  createdAt: Timestamp
}

function useComments() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'comments'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment)))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const addComment = async (name: string, message: string, favourite: string) => {
    await addDoc(collection(db, 'comments'), {
      name: name.trim(), message: message.trim(),
      favourite, createdAt: Timestamp.now(),
    })
  }

  const deleteComment = async (id: string) => {
    await deleteDoc(doc(db, 'comments', id))
  }

  return { comments, loading, addComment, deleteComment }
}

function CommentForm({ onAdd }: { onAdd: (n: string, m: string, f: string) => Promise<void> }) {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [favourite, setFavourite] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim() || !message.trim()) return
    setSending(true)
    await onAdd(name, message, favourite)
    setName(''); setMessage(''); setFavourite('')
    setSending(false); setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(200,164,90,0.18)', color: COLORS.paper,
    fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem',
    padding: '0.75rem 1rem', outline: 'none', borderRadius: 0,
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Inconsolata', monospace", fontSize: '0.65rem',
    letterSpacing: '0.18em', textTransform: 'uppercase',
    color: COLORS.candle, opacity: 0.7, display: 'block', marginBottom: '0.4rem',
  }

  const disabled = sending || !name.trim() || !message.trim()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <div>
        <span style={labelStyle}>Your name</span>
        <input type="text" placeholder="Anonymous" value={name}
          onChange={e => setName(e.target.value)} style={inputStyle} />
      </div>
      <div>
        <span style={labelStyle}>Your words</span>
        <textarea placeholder="Leave a thought, a feeling, a line that stayed with you…"
          value={message} onChange={e => setMessage(e.target.value)}
          rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.8 }} />
      </div>
      <div>
        <span style={labelStyle}>
          Favourite poem
          <span style={{ color: COLORS.dim, marginLeft: '0.5rem', textTransform: 'none', letterSpacing: 0 }}>
            (optional)
          </span>
        </span>
        <select value={favourite} onChange={e => setFavourite(e.target.value)} style={{
          ...inputStyle, cursor: 'pointer', appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23c8a45a' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', paddingRight: '2.5rem',
        }}>
          <option value="" style={{ background: '#1a1410' }}>— Choose a poem —</option>
          {POEM_TITLES.map(p => (
            <option key={p.id} value={p.title} style={{ background: '#1a1410' }}>{p.title}</option>
          ))}
        </select>
      </div>
      <button onClick={handleSubmit} disabled={disabled} style={{
        alignSelf: 'flex-start', fontFamily: "'Inconsolata', monospace",
        fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase',
        color: disabled ? COLORS.dim : COLORS.candle, background: 'none',
        border: `1px solid ${disabled ? 'rgba(200,164,90,0.1)' : 'rgba(200,164,90,0.35)'}`,
        padding: '0.75rem 2rem', cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.3s',
      }}>
        {sending ? 'Sending…' : sent ? 'Sent ✓' : 'Leave a thought →'}
      </button>
      {sent && (
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '0.95rem', color: COLORS.candle, opacity: 0.8 }}>
          Your words have been received.
        </p>
      )}
    </div>
  )
}

function CommentList({ comments, loading, ownerMode, onDelete }: {
  comments: Comment[], loading: boolean, ownerMode: boolean, onDelete: (id: string) => void
}) {
  if (loading) return (
    <p style={{ fontFamily: "'Inconsolata', monospace", fontSize: '0.7rem', color: COLORS.dim, letterSpacing: '0.1em' }}>
      Loading…
    </p>
  )

  if (comments.length === 0) return (
    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '1rem', color: COLORS.dim }}>
      No thoughts yet. Be the first to leave one.
    </p>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {comments.map(c => (
        <div key={c.id} style={{ borderLeft: '2px solid rgba(200,164,90,0.2)', paddingLeft: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
            <span style={{ fontFamily: "'IM Fell English', serif", fontSize: '1rem', fontStyle: 'italic', color: COLORS.paper }}>
              {c.name || 'Anonymous'}
            </span>
            {c.favourite && (
              <span style={{ fontFamily: "'Inconsolata', monospace", fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.candle, opacity: 0.6 }}>
                ❧ {c.favourite}
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.85, color: COLORS.aged, fontStyle: 'italic' }}>
            "{c.message}"
          </p>
          <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <p style={{ fontFamily: "'Inconsolata', monospace", fontSize: '0.6rem', letterSpacing: '0.1em', color: 'rgba(122,110,95,0.4)' }}>
              {c.createdAt?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            {ownerMode && (
              <button
                onClick={() => { if (window.confirm(`Delete comment by "${c.name || 'Anonymous'}"?`)) onDelete(c.id) }}
                style={{
                  background: 'none', border: '1px solid rgba(200,100,100,0.3)', color: '#c87a7a',
                  fontFamily: "'Inconsolata', monospace", fontSize: '0.58rem', letterSpacing: '0.1em',
                  padding: '0.2rem 0.65rem', cursor: 'pointer', textTransform: 'uppercase',
                }}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Footer() {
  const { comments, loading, addComment, deleteComment } = useComments()
  const [ownerMode,  setOwnerMode]  = useState(false)
  const [clickCount, setClickCount] = useState(0)

  const handleTitleClick = () => {
    const next = clickCount + 1
    setClickCount(next)
    if (next >= 5) {
      const pass = prompt('Enter owner password:')
      if (pass === OWNER_PASSWORD) { setOwnerMode(true) }
      setClickCount(0)
    }
  }

  return (
    <footer style={{ borderTop: '1px solid rgba(200,164,90,0.12)', background: COLORS.surface, padding: '5rem 2rem 3rem' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 onClick={handleTitleClick} style={{
            fontFamily: "'IM Fell English', serif", fontSize: '2rem', fontStyle: 'italic',
            color: COLORS.paper, marginBottom: '0.4rem', cursor: 'default', userSelect: 'none',
          }}>
            Leave a Thought
            {ownerMode && (
              <span style={{ marginLeft: '0.8rem', fontFamily: "'Inconsolata', monospace", fontSize: '0.6rem', letterSpacing: '0.15em', color: '#c87a7a', opacity: 0.8, verticalAlign: 'middle' }}>
                [owner mode]
              </span>
            )}
          </h2>
          <p style={{ fontFamily: "'Inconsolata', monospace", fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: COLORS.dim }}>
            {ownerMode ? 'Click delete to remove a comment' : 'Your words are welcome here'}
          </p>
          {ownerMode && (
            <button onClick={() => setOwnerMode(false)} style={{
              marginTop: '0.8rem', background: 'none', border: '1px solid rgba(200,100,100,0.25)',
              color: '#c87a7a', fontFamily: "'Inconsolata', monospace", fontSize: '0.6rem',
              letterSpacing: '0.1em', padding: '0.3rem 0.8rem', cursor: 'pointer', textTransform: 'uppercase',
            }}>
              Exit owner mode
            </button>
          )}
        </div>

        {/* Form + Comments */}
        <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }}>
          <div>
            <p style={{ fontFamily: "'Inconsolata', monospace", fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: COLORS.candle, opacity: 0.6, marginBottom: '1.5rem' }}>
              Write something
            </p>
            <CommentForm onAdd={addComment} />
          </div>
          <div>
            <p style={{ fontFamily: "'Inconsolata', monospace", fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: COLORS.candle, opacity: 0.6, marginBottom: '1.5rem' }}>
              From readers · {comments.length} {comments.length === 1 ? 'thought' : 'thoughts'}
            </p>
            <CommentList comments={comments} loading={loading} ownerMode={ownerMode} onDelete={deleteComment} />
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ marginTop: '4rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(200,164,90,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <span style={{ fontFamily: "'IM Fell English', serif", fontSize: '1rem', fontStyle: 'italic', color: COLORS.candle, opacity: 0.6 }}>
            Verses in the Dark
          </span>
          <span style={{ fontFamily: "'Inconsolata', monospace", fontSize: '0.6rem', letterSpacing: '0.15em', color: 'rgba(122,110,95,0.35)', textTransform: 'uppercase' }}>
            © {new Date().getFullYear()} · All poems reserved
          </span>
        </div>
      </div>
    </footer>
  )
}
