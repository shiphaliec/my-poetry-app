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
  updateDoc,
  increment,
  getDoc,
  setDoc,
} from 'firebase/firestore'

// ── Colors ─────────────────────────────────────────────────────────────────

const COLORS = {
  ink:    '#1a1410',
  paper:  '#f5f0e8',
  aged:   '#e8dfc8',
  candle: '#c8a45a',
  dim:    '#7a6e5f',
  surface:'#1e1810',
} as const

// ── localStorage key — tracks which comments this visitor liked ────────────

const COMMENT_LIKED_KEY = 'poetry-site:comment-liked'

function loadCommentLiked(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(COMMENT_LIKED_KEY) ?? '[]')) } catch { return new Set() }
}

function saveCommentLiked(liked: Set<string>) {
  localStorage.setItem(COMMENT_LIKED_KEY, JSON.stringify([...liked]))
}

// ── Poem titles ─────────────────────────────────────────────────────────────

const POEM_TITLES = [
  { id: 1, title: 'Few Lines pt-1' },
  { id: 2, title: 'The lost letter' },
  { id: 3, title: 'The last minute gift' },
  { id: 4, title: 'Message from tomorrow' },
  { id: 5, title: 'Teacher"s Day' },
  { id: 6, title: 'The Lock Story' },
  { id: 7, title: 'The Borrow' },
  { id:8, title: 'The packet of universe'},
  { id:9, title: 'The locked door'},
]

// ── Types ──────────────────────────────────────────────────────────────────

interface Comment {
  id: string
  name: string
  message: string
  favourite: string
  createdAt: Timestamp
  likes: number
}

// ── useComments hook ───────────────────────────────────────────────────────

function useComments() {
  const [comments,     setComments]     = useState<Comment[]>([])
  const [loading,      setLoading]      = useState(true)
  const [commentLiked, setCommentLiked] = useState<Set<string>>(loadCommentLiked)

  useEffect(() => {
    const q = query(collection(db, 'comments'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map(d => ({
        id: d.id,
        likes: 0,
        ...d.data(),
      } as Comment)))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const addComment = async (name: string, message: string, favourite: string) => {
    await addDoc(collection(db, 'comments'), {
      name:      name.trim(),
      message:   message.trim(),
      favourite: favourite,
      createdAt: Timestamp.now(),
      likes:     0,
    })
  }

  const toggleCommentLike = async (commentId: string) => {
    const isLiked = commentLiked.has(commentId)
    const ref = doc(db, 'comments', commentId)

    // Make sure document has a likes field
    const snap = await getDoc(ref)
    if (!snap.exists()) return
    if (snap.data().likes === undefined) {
      await setDoc(ref, { likes: 0 }, { merge: true })
    }

    // Update Firestore
    await updateDoc(ref, { likes: increment(isLiked ? -1 : 1) })

    // Update local liked set
    setCommentLiked(prev => {
      const next = new Set(prev)
      isLiked ? next.delete(commentId) : next.add(commentId)
      saveCommentLiked(next)
      return next
    })
  }

  return { comments, loading, addComment, commentLiked, toggleCommentLike }
}

// ── HeartIcon ──────────────────────────────────────────────────────────────

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="11" height="11" viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

// ── CommentLikeButton ──────────────────────────────────────────────────────

function CommentLikeButton({
  commentId,
  count,
  isLiked,
  onToggle,
}: {
  commentId: string
  count: number
  isLiked: boolean
  onToggle: (id: string) => void
}) {
  const [popping, setPopping] = useState(false)

  const handleClick = () => {
    if (!isLiked) {
      setPopping(true)
      setTimeout(() => setPopping(false), 350)
    }
    onToggle(commentId)
  }

  return (
    <button
      onClick={handleClick}
      title={isLiked ? 'Unlike' : 'Like this thought'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '0.2rem 0.4rem',
        color: isLiked ? '#c87a7a' : COLORS.dim,
        fontFamily: "'Inconsolata', monospace",
        fontSize: '0.6rem',
        letterSpacing: '0.08em',
        transition: 'color 0.2s  transform 0.15s ease',
        transform: popping ? 'scale(1.3)' : 'scale(1)',
        
      }}
    >
      <HeartIcon filled={isLiked} />
      {count > 0 && <span>{count}</span>}
    </button>
  )
}

// ── CommentForm ────────────────────────────────────────────────────────────

function CommentForm({
  onAdd,
}: {
  onAdd: (name: string, message: string, favourite: string) => Promise<void>
}) {
  const [name,      setName]      = useState('')
  const [message,   setMessage]   = useState('')
  const [favourite, setFavourite] = useState('')
  const [sending,   setSending]   = useState(false)
  const [sent,      setSent]      = useState(false)

  const handleSubmit = async () => {
    if (!name.trim() || !message.trim()) return
    setSending(true)
    await onAdd(name, message, favourite)
    setName(''); setMessage(''); setFavourite('')
    setSending(false); setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(200,164,90,0.18)',
    color: COLORS.paper,
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '1rem',
    padding: '0.75rem 1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    borderRadius: 0,
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Inconsolata', monospace",
    fontSize: '0.65rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: COLORS.candle,
    opacity: 0.7,
    display: 'block',
    marginBottom: '0.4rem',
  }

  const disabled = sending || !name.trim() || !message.trim()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

      <div>
        <span style={labelStyle}>Your name</span>
        <input
          type="text"
          placeholder="Anonymous"
          value={name}
          onChange={e => setName(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div>
        <span style={labelStyle}>Your words</span>
        <textarea
          placeholder="Leave a thought, a feeling, a line that stayed with you…"
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={4}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.8 }}
        />
      </div>

      <div>
        <span style={labelStyle}>
          Favourite poem
          <span style={{ color: COLORS.dim, marginLeft: '0.5rem', textTransform: 'none', letterSpacing: 0 }}>
            (optional)
          </span>
        </span>
        <select
          value={favourite}
          onChange={e => setFavourite(e.target.value)}
          style={{
            ...inputStyle,
            cursor: 'pointer',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23c8a45a' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 1rem center',
            paddingRight: '2.5rem',
          }}
        >
          <option value="" style={{ background: '#1a1410' }}>— Choose a poem —</option>
          {POEM_TITLES.map(p => (
            <option key={p.id} value={p.title} style={{ background: '#1a1410' }}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSubmit}
        disabled={disabled}
        style={{
          alignSelf: 'flex-start',
          fontFamily: "'Inconsolata', monospace",
          fontSize: '0.7rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: disabled ? COLORS.dim : COLORS.candle,
          background: 'none',
          border: `1px solid ${disabled ? 'rgba(200,164,90,0.1)' : 'rgba(200,164,90,0.35)'}`,
          padding: '0.75rem 2rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s',
        }}
      >
        {sending ? 'Sending…' : sent ? 'Sent ✓' : 'Leave a thought →'}
      </button>

      {sent && (
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: 'italic',
          fontSize: '0.95rem',
          color: COLORS.candle,
          opacity: 0.8,
        }}>
          Your words have been received.
        </p>
      )}
    </div>
  )
}

// ── CommentList ────────────────────────────────────────────────────────────

function CommentList({
  comments,
  loading,
  commentLiked,
  onToggleLike,
}: {
  comments: Comment[]
  loading: boolean
  commentLiked: Set<string>
  onToggleLike: (id: string) => void
}) {
  if (loading) {
    return (
      <p style={{
        fontFamily: "'Inconsolata', monospace",
        fontSize: '0.7rem',
        color: COLORS.dim,
        letterSpacing: '0.1em',
      }}>
        Loading…
      </p>
    )
  }

  if (comments.length === 0) {
    return (
      <p style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontStyle: 'italic',
        fontSize: '1rem',
        color: COLORS.dim,
      }}>
        No thoughts yet. Be the first to leave one.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {comments.map(c => (
        <div key={c.id} style={{
          borderLeft: '2px solid rgba(200,164,90,0.2)',
          paddingLeft: '1.2rem',
        }}>

          {/* Name + favourite */}
          <div style={{
            display: 'flex', alignItems: 'baseline',
            gap: '0.8rem', flexWrap: 'wrap', marginBottom: '0.4rem',
          }}>
            <span style={{
              fontFamily: "'IM Fell English', serif",
              fontSize: '1rem', fontStyle: 'italic', color: COLORS.paper,
            }}>
              {c.name || 'Anonymous'}
            </span>
            {c.favourite && (
              <span style={{
                fontFamily: "'Inconsolata', monospace",
                fontSize: '0.6rem', letterSpacing: '0.12em',
                textTransform: 'uppercase', color: COLORS.candle, opacity: 0.6,
              }}>
                ❧ {c.favourite}
              </span>
            )}
          </div>

          {/* Message */}
          <p style={{
            fontSize: '0.95rem', lineHeight: 1.85,
            color: COLORS.aged, fontStyle: 'italic',
          }}>
            "{c.message}"
          </p>

          {/* Date + Like button row */}
          <div style={{
            marginTop: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <p style={{
              fontFamily: "'Inconsolata', monospace",
              fontSize: '0.6rem', letterSpacing: '0.1em',
              color: 'rgba(122,110,95,0.4)',
            }}>
              {c.createdAt?.toDate().toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </p>

            {/* Like button */}
            <CommentLikeButton
              commentId={c.id}
              count={c.likes ?? 0}
              isLiked={commentLiked.has(c.id)}
              onToggle={onToggleLike}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Footer (default export) ────────────────────────────────────────────────

export default function Footer() {
  const { comments, loading, addComment, commentLiked, toggleCommentLike } = useComments()

  return (
    <footer style={{
      borderTop: '1px solid rgba(200,164,90,0.12)',
      background: COLORS.surface,
      padding: '5rem 2rem 3rem',
    }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Section heading */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 style={{
            fontFamily: "'IM Fell English', serif",
            fontSize: '2rem',
            fontStyle: 'italic',
            color: COLORS.paper,
            marginBottom: '0.4rem',
          }}>
            Leave a Thought
          </h2>
          <p style={{
            fontFamily: "'Inconsolata', monospace",
            fontSize: '0.68rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: COLORS.dim,
          }}>
            Your words are welcome here
          </p>
        </div>

        {/* Form + Comments grid */}
        <div
          className="footer-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '3rem',
            alignItems: 'start',
          }}
        >
          {/* Comment form */}
          <div>
            <p style={{
              fontFamily: "'Inconsolata', monospace",
              fontSize: '0.65rem', letterSpacing: '0.15em',
              textTransform: 'uppercase', color: COLORS.candle,
              opacity: 0.6, marginBottom: '1.5rem',
            }}>
              Write something
            </p>
            <CommentForm onAdd={addComment} />
          </div>

          {/* Comments list */}
          <div>
            <p style={{
              fontFamily: "'Inconsolata', monospace",
              fontSize: '0.65rem', letterSpacing: '0.15em',
              textTransform: 'uppercase', color: COLORS.candle,
              opacity: 0.6, marginBottom: '1.5rem',
            }}>
              From readers · {comments.length} {comments.length === 1 ? 'thought' : 'thoughts'}
            </p>
            <CommentList
              comments={comments}
              loading={loading}
              commentLiked={commentLiked}
              onToggleLike={toggleCommentLike}
            />
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          marginTop: '4rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(200,164,90,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <span style={{
            fontFamily: "'IM Fell English', serif",
            fontSize: '1rem', fontStyle: 'italic',
            color: COLORS.candle, opacity: 0.6,
          }}>
            Verses in the Dark
          </span>
          <span style={{
            fontFamily: "'Inconsolata', monospace",
            fontSize: '0.6rem', letterSpacing: '0.15em',
            color: 'rgba(122,110,95,0.35)', textTransform: 'uppercase',
          }}>
            © {new Date().getFullYear()} · All poems reserved
          </span>
        </div>

      </div>
    </footer>
  )
}
