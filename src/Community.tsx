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
  updateDoc,
  increment,
  getDoc,
  setDoc,
} from 'firebase/firestore'

// ── Design tokens — modern & clean ─────────────────────────────────────────

const C = {
  bg:       '#0f0f0f',
  surface:  '#181818',
  card:     '#1f1f1f',
  border:   'rgba(255,255,255,0.07)',
  borderHover: 'rgba(255,255,255,0.14)',
  text:     '#f0f0f0',
  muted:    '#888',
  faint:    '#444',
  accent:   '#c8a45a',
  accentDim:'rgba(200,164,90,0.15)',
  danger:   '#c87a7a',
  dangerDim:'rgba(200,100,100,0.15)',
} as const

// ── Owner password ─────────────────────────────────────────────────────────
const OWNER_PASSWORD = 'versesinthedark'

// ── localStorage helpers ───────────────────────────────────────────────────

const DELETE_KEYS_KEY = 'community:delete-keys'
const LIKED_KEY       = 'community:liked'

function loadDeleteKeys(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(DELETE_KEYS_KEY) ?? '{}') } catch { return {} }
}
function saveDeleteKeys(k: Record<string, string>) {
  localStorage.setItem(DELETE_KEYS_KEY, JSON.stringify(k))
}
function loadLiked(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(LIKED_KEY) ?? '[]')) } catch { return new Set() }
}
function saveLiked(s: Set<string>) {
  localStorage.setItem(LIKED_KEY, JSON.stringify([...s]))
}
function generateKey(): string {
  return Math.random().toString(36).slice(2, 12).toUpperCase()
}

// ── Types ──────────────────────────────────────────────────────────────────

interface CommunityPoem {
  id:        string
  title:     string
  name:      string
  lines:     string[]
  createdAt: Timestamp
  deleteKey: string
  likes:     number
}

type Tab = 'read' | 'post'

// ── useCommunityPoems ──────────────────────────────────────────────────────

function useCommunityPoems() {
  const [poems,      setPoems]      = useState<CommunityPoem[]>([])
  const [loading,    setLoading]    = useState(true)
  const [deleteKeys, setDeleteKeys] = useState<Record<string, string>>(loadDeleteKeys)
  const [liked,      setLiked]      = useState<Set<string>>(loadLiked)

  useEffect(() => {
    const q = query(collection(db, 'communityPoems'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setPoems(snap.docs.map(d => ({ id: d.id, likes: 0, ...d.data() } as CommunityPoem)))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const postPoem = async (title: string, name: string, lines: string[]): Promise<string> => {
    const key = generateKey()
    const ref = await addDoc(collection(db, 'communityPoems'), {
      title, name: name.trim(), lines,
      createdAt: Timestamp.now(), deleteKey: key, likes: 0,
    })
    const updated = { ...deleteKeys, [ref.id]: key }
    setDeleteKeys(updated); saveDeleteKeys(updated)
    return key
  }

  const deletePoem = async (id: string) => {
    await deleteDoc(doc(db, 'communityPoems', id))
    const updated = { ...deleteKeys }
    delete updated[id]
    setDeleteKeys(updated); saveDeleteKeys(updated)
  }

  const toggleLike = async (id: string) => {
    const isLiked = liked.has(id)
    const ref = doc(db, 'communityPoems', id)
    const snap = await getDoc(ref)
    if (!snap.exists()) return
    if (snap.data().likes === undefined) await setDoc(ref, { likes: 0 }, { merge: true })
    await updateDoc(ref, { likes: increment(isLiked ? -1 : 1) })
    setLiked(prev => {
      const next = new Set(prev)
      isLiked ? next.delete(id) : next.add(id)
      saveLiked(next); return next
    })
  }

  const canDelete = (id: string, poemKey: string) => deleteKeys[id] === poemKey

  return { poems, loading, postPoem, deletePoem, toggleLike, liked, canDelete }
}

// ── HeartIcon ──────────────────────────────────────────────────────────────

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0 }}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

// ── RulesModal ─────────────────────────────────────────────────────────────

function RulesModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const [checked, setChecked] = useState(false)

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 12, maxWidth: 480, width: '100%',
        padding: '2rem', maxHeight: '90vh', overflowY: 'auto',
        animation: 'fadeUp 0.25s ease',
      }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 500, color: C.text, marginBottom: '0.3rem' }}>
          Before You Post
        </div>
        <div style={{ fontSize: '0.75rem', color: C.muted, marginBottom: '1.5rem', letterSpacing: '0.05em' }}>
          Please read carefully
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.8rem' }}>
          {[
            'Your poem will be visible to all visitors of this site.',
            'After posting you will receive a secret delete key. Save it — it is the only way to delete your poem later.',
            'If you lose your delete key, your poem can only be removed by the site owner.',
            'Do not post content that is offensive, plagiarised, or does not belong to you.',
            'The site owner reserves the right to remove any poem at any time without notice.',
          ].map((rule, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.8rem' }}>
              <span style={{ fontSize: '0.7rem', color: C.accent, fontFamily: 'monospace', flexShrink: 0, marginTop: '0.1rem' }}>
                {i + 1}.
              </span>
              <p style={{ fontSize: '0.88rem', color: C.muted, lineHeight: 1.7 }}>{rule}</p>
            </div>
          ))}
        </div>

        {/* Checkbox */}
        <label style={{
          display: 'flex', alignItems: 'flex-start', gap: '0.7rem',
          cursor: 'pointer', marginBottom: '1.5rem',
          padding: '0.9rem', background: C.accentDim,
          borderRadius: 8, border: `1px solid rgba(200,164,90,0.2)`,
        }}>
          <input
            type="checkbox" checked={checked}
            onChange={e => setChecked(e.target.checked)}
            style={{ marginTop: '0.15rem', accentColor: C.accent, cursor: 'pointer', flexShrink: 0 }}
          />
          <span style={{ fontSize: '0.88rem', color: C.text, lineHeight: 1.6 }}>
            I have read and understood the rules above
          </span>
        </label>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '0.7rem', background: 'none',
            border: `1px solid ${C.border}`, borderRadius: 8,
            color: C.muted, cursor: 'pointer', fontSize: '0.8rem',
            fontFamily: 'inherit', transition: 'border-color 0.2s',
          }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={!checked} style={{
            flex: 1, padding: '0.7rem',
            background: checked ? C.accent : 'transparent',
            border: `1px solid ${checked ? C.accent : C.faint}`,
            borderRadius: 8,
            color: checked ? '#1a1410' : C.faint,
            cursor: checked ? 'pointer' : 'not-allowed',
            fontSize: '0.8rem', fontWeight: 500,
            fontFamily: 'inherit', transition: 'all 0.25s',
          }}>
            Post my poem →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── KeyModal ───────────────────────────────────────────────────────────────

function KeyModal({ deleteKey, onDone }: { deleteKey: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(deleteKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 12, maxWidth: 400, width: '100%',
        padding: '2rem', textAlign: 'center',
        animation: 'fadeUp 0.25s ease',
      }}>
        {/* Success icon */}
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: C.accentDim, border: `1px solid rgba(200,164,90,0.3)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.2rem', fontSize: '1.1rem',
        }}>
          ✓
        </div>

        <div style={{ fontSize: '1.1rem', fontWeight: 500, color: C.text, marginBottom: '0.4rem' }}>
          Poem posted!
        </div>
        <p style={{ fontSize: '0.82rem', color: C.muted, marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Save your secret delete key. It will not be shown again.
        </p>

        {/* Key box */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 8, padding: '1rem',
          fontFamily: 'monospace', fontSize: '1.2rem',
          letterSpacing: '0.2em', color: C.accent,
          marginBottom: '0.8rem',
        }}>
          {deleteKey}
        </div>

        <p style={{ fontSize: '0.75rem', color: C.faint, marginBottom: '1.5rem' }}>
          Losing this key means you cannot delete your poem
        </p>

        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <button onClick={handleCopy} style={{
            flex: 1, padding: '0.7rem',
            background: copied ? C.accentDim : 'none',
            border: `1px solid ${copied ? C.accent : C.border}`,
            borderRadius: 8, color: copied ? C.accent : C.muted,
            cursor: 'pointer', fontSize: '0.8rem',
            fontFamily: 'inherit', transition: 'all 0.2s',
          }}>
            {copied ? 'Copied ✓' : 'Copy key'}
          </button>
          <button onClick={onDone} style={{
            flex: 1, padding: '0.7rem',
            background: C.accent, border: `1px solid ${C.accent}`,
            borderRadius: 8, color: '#1a1410',
            cursor: 'pointer', fontSize: '0.8rem',
            fontWeight: 500, fontFamily: 'inherit',
          }}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

// ── PoemViewModal ──────────────────────────────────────────────────────────

function PoemViewModal({
  poem, isLiked, canDel,
  onLike, onDelete, onClose,
}: {
  poem: CommunityPoem
  isLiked: boolean
  canDel: boolean
  onLike: (id: string) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div
      className="modal-backdrop"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 12, maxWidth: 520, width: '100%',
        padding: '2rem', position: 'relative',
        maxHeight: '85vh', overflowY: 'auto',
        animation: 'fadeUp 0.25s ease',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '1rem', right: '1rem',
          background: 'none', border: 'none', color: C.muted,
          fontSize: '1rem', cursor: 'pointer', lineHeight: 1,
        }}>✕</button>

        {/* Tag */}
        <div style={{
          display: 'inline-block', fontSize: '0.7rem', color: C.accent,
          background: C.accentDim, borderRadius: 4,
          padding: '0.2rem 0.6rem', marginBottom: '1rem',
          fontFamily: 'monospace', letterSpacing: '0.08em',
        }}>
          Community
        </div>

        <div style={{ fontSize: '1.5rem', fontWeight: 500, color: C.text, marginBottom: '0.3rem' }}>
          {poem.title}
        </div>
        <div style={{ fontSize: '0.78rem', color: C.muted, marginBottom: '1.5rem', letterSpacing: '0.05em' }}>
          by {poem.name || 'Anonymous'} ·{' '}
          {poem.createdAt?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>

        <div style={{ fontSize: '0.95rem', lineHeight: 2, color: '#ccc' }}>
          {poem.lines.map((line, i) =>
            line ? <p key={i}>{line}</p> : <br key={i} />
          )}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '1.5rem', paddingTop: '1rem',
          borderTop: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <button onClick={() => onLike(poem.id)} style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: isLiked ? C.danger : C.muted, fontSize: '0.78rem',
            fontFamily: 'inherit', transition: 'color 0.2s', padding: 0,
          }}>
            <HeartIcon filled={isLiked} />
            {poem.likes > 0 && <span>{poem.likes}</span>}
            <span style={{ marginLeft: 2 }}>{isLiked ? 'Liked' : 'Like'}</span>
          </button>

          {canDel && (
            <button
              onClick={() => {
                if (window.confirm('Delete this poem? This cannot be undone.')) {
                  onDelete(poem.id); onClose()
                }
              }}
              style={{
                background: C.dangerDim, border: `1px solid rgba(200,100,100,0.3)`,
                borderRadius: 6, color: C.danger, fontSize: '0.75rem',
                padding: '0.35rem 0.9rem', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── PostForm ───────────────────────────────────────────────────────────────

function PostForm({ onPost, onSuccess }: {
  onPost: (title: string, name: string, lines: string[]) => Promise<string>
  onSuccess: () => void
}) {
  const [title,        setTitle]        = useState('')
  const [name,         setName]         = useState('')
  const [text,         setText]         = useState('')
  const [showRules,    setShowRules]    = useState(false)
  const [showKey,      setShowKey]      = useState(false)
  const [generatedKey, setGeneratedKey] = useState('')
  const [posting,      setPosting]      = useState(false)

  const inputStyle: React.CSSProperties = {
    width: '100%', background: C.card,
    border: `1px solid ${C.border}`, borderRadius: 8,
    color: C.text, fontFamily: 'inherit', fontSize: '0.92rem',
    padding: '0.75rem 1rem', outline: 'none',
    transition: 'border-color 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '0.72rem', color: C.muted,
    display: 'block', marginBottom: '0.4rem',
    letterSpacing: '0.04em',
  }

  const disabled = !title.trim() || !name.trim() || !text.trim() || posting

  const handleConfirm = async () => {
    setShowRules(false)
    setPosting(true)
    const lines = text.split('\n')
    const key = await onPost(title, name, lines)
    setGeneratedKey(key)
    setTitle(''); setName(''); setText('')
    setPosting(false)
    setShowKey(true)
  }

  return (
    <>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: '2rem',
        display: 'flex', flexDirection: 'column', gap: '1.2rem',
        maxWidth: 560,
      }}>
        <div style={{ fontSize: '1rem', fontWeight: 500, color: C.text, marginBottom: '0.2rem' }}>
          Share your poem
        </div>
        <p style={{ fontSize: '0.82rem', color: C.muted, lineHeight: 1.6, marginTop: '-0.5rem' }}>
          Your poem will be visible to all visitors. 
        </p>

        <div>
          <label style={labelStyle}>Poem title</label>
          <input type="text" placeholder="Title of your poem"
            value={title} onChange={e => setTitle(e.target.value)}
            style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Your name or pen name</label>
          <input type="text" placeholder="How you'd like to be known"
            value={name} onChange={e => setName(e.target.value)}
            style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Your poem</label>
          <textarea
            placeholder={'Write your poem here…\nEach line on a new line.\nLeave a blank line between stanzas.'}
            value={text} onChange={e => setText(e.target.value)}
            rows={10}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 2 }}
          />
          <p style={{ fontSize: '0.7rem', color: C.faint, marginTop: '0.4rem' }}>
            Each line = one line of your poem · Blank line = stanza break
          </p>
        </div>

        <button
          onClick={() => !disabled && setShowRules(true)}
          disabled={disabled}
          style={{
            padding: '0.8rem 2rem', borderRadius: 8,
            background: disabled ? 'transparent' : C.accent,
            border: `1px solid ${disabled ? C.faint : C.accent}`,
            color: disabled ? C.faint : '#1a1410',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '0.85rem', fontWeight: 500,
            fontFamily: 'inherit', transition: 'all 0.25s',
            alignSelf: 'flex-start',
          }}
        >
          {posting ? 'Posting…' : 'Submit poem →'}
        </button>
      </div>

      {showRules && (
        <RulesModal onCancel={() => setShowRules(false)} onConfirm={handleConfirm} />
      )}
      {showKey && (
        <KeyModal deleteKey={generatedKey} onDone={() => { setShowKey(false); onSuccess() }} />
      )}
    </>
  )
}

// ── MasonryGrid ────────────────────────────────────────────────────────────

function MasonryGrid({ children }: { children: React.ReactNode[] }) {
  return (
    <div style={{
      columns: '2 280px',
      columnGap: '1rem',
    }}>
      {children.map((child, i) => (
        <div key={i} style={{ breakInside: 'avoid', marginBottom: '1rem' }}>
          {child}
        </div>
      ))}
    </div>
  )
}

// ── PoemCard ───────────────────────────────────────────────────────────────

function PoemCard({
  poem, isLiked, canDel,
  onLike, onDelete, onClick,
}: {
  poem: CommunityPoem
  isLiked: boolean
  canDel: boolean
  onLike: (id: string) => void
  onDelete: (id: string) => void
  onClick: (poem: CommunityPoem) => void
}) {
  const [hovered, setHovered] = useState(false)
  const preview = poem.lines.filter(l => l.trim()).slice(0, 5)

  return (
    <div
      onClick={() => onClick(poem)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.card,
        border: `1px solid ${hovered ? C.borderHover : C.border}`,
        borderRadius: 10, padding: '1.4rem',
        cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      {/* Title */}
      <div style={{
        fontSize: '1rem', fontWeight: 500,
        color: C.text, marginBottom: '0.25rem',
        lineHeight: 1.3,
      }}>
        {poem.title}
      </div>

      {/* Author */}
      <div style={{
        fontSize: '0.72rem', color: C.accent,
        marginBottom: '0.9rem', letterSpacing: '0.04em',
      }}>
        {poem.name || 'Anonymous'}
      </div>

      {/* Preview lines */}
      <div style={{ fontSize: '0.85rem', lineHeight: 1.85, color: '#999' }}>
        {preview.map((line, i) => <p key={i}>{line}</p>)}
        {poem.lines.filter(l => l.trim()).length > 5 && (
          <p style={{ color: C.faint, marginTop: '0.3rem', fontSize: '0.75rem' }}>
            read more…
          </p>
        )}
      </div>

      {/* Bottom row */}
      <div style={{
        marginTop: '1.2rem', paddingTop: '0.9rem',
        borderTop: `1px solid ${C.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: '0.7rem', color: C.faint }}>
          {poem.createdAt?.toDate().toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Like */}
          <button
            onClick={e => { e.stopPropagation(); onLike(poem.id) }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: isLiked ? C.danger : C.faint,
              fontSize: '0.72rem', fontFamily: 'inherit',
              padding: 0, transition: 'color 0.2s',
            }}
          >
            <HeartIcon filled={isLiked} />
            {poem.likes > 0 && <span>{poem.likes}</span>}
          </button>

          {/* Delete */}
          {canDel && (
            <button
              onClick={e => {
                e.stopPropagation()
                if (window.confirm('Delete this poem?')) onDelete(poem.id)
              }}
              style={{
                background: 'none', border: `1px solid rgba(200,100,100,0.25)`,
                borderRadius: 4, color: C.danger, fontSize: '0.65rem',
                padding: '0.15rem 0.5rem', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Community (default export) ─────────────────────────────────────────────

export default function Community() {
  const { poems, loading, postPoem, deletePoem, toggleLike, liked, canDelete } = useCommunityPoems()
  const [tab,        setTab]        = useState<Tab>('read')
  const [selected,   setSelected]   = useState<CommunityPoem | null>(null)
  const [ownerMode,  setOwnerMode]  = useState(false)

  // Owner mode via Ctrl + Shift + O
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'O') {
        const pass = prompt('Enter owner password:')
        if (pass === OWNER_PASSWORD) setOwnerMode(true)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  return (
    <section style={{
      minHeight: '100vh',
      padding: '7rem 2rem 5rem',
      maxWidth: 960, margin: '0 auto',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>

      {/* Page header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 600, color: C.text, marginBottom: '0.3rem' }}>
              Community Poems
            </h2>
            <p style={{ fontSize: '0.82rem', color: C.muted }}>
              {poems.length} {poems.length === 1 ? 'poem' : 'poems'} shared by readers
            </p>
          </div>
          {ownerMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '0.72rem', color: C.danger, fontFamily: 'monospace' }}>
                owner mode
              </span>
              <button onClick={() => setOwnerMode(false)} style={{
                background: C.dangerDim, border: `1px solid rgba(200,100,100,0.25)`,
                borderRadius: 6, color: C.danger, fontSize: '0.72rem',
                padding: '0.25rem 0.7rem', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Exit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '0.3rem',
        background: C.card, borderRadius: 10,
        padding: '0.3rem', marginBottom: '2.5rem',
        width: 'fit-content',
        border: `1px solid ${C.border}`,
      }}>
        {(['read', 'post'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '0.55rem 1.4rem', borderRadius: 7,
              background: tab === t ? C.accent : 'transparent',
              border: 'none',
              color: tab === t ? '#1a1410' : C.muted,
              cursor: 'pointer', fontSize: '0.82rem',
              fontWeight: tab === t ? 500 : 400,
              fontFamily: 'inherit', transition: 'all 0.2s',
              textTransform: 'capitalize',
            }}
          >
            {t === 'read' ? `Read Poems` : 'Post a Poem'}
          </button>
        ))}
      </div>

      {/* Read tab */}
      {tab === 'read' && (
        <>
          {loading ? (
            <p style={{ fontSize: '0.85rem', color: C.muted }}>Loading poems…</p>
          ) : poems.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '4rem 2rem',
              border: `1px dashed ${C.border}`, borderRadius: 12,
            }}>
              <p style={{ fontSize: '1rem', color: C.muted, marginBottom: '0.5rem' }}>
                No poems yet
              </p>
              <p style={{ fontSize: '0.82rem', color: C.faint }}>
                Be the first to share one —{' '}
                <span
                  onClick={() => setTab('post')}
                  style={{ color: C.accent, cursor: 'pointer' }}
                >
                  post a poem
                </span>
              </p>
            </div>
          ) : (
            <MasonryGrid>
              {poems.map(poem => (
                <PoemCard
                  key={poem.id}
                  poem={poem}
                  isLiked={liked.has(poem.id)}
                  canDel={ownerMode || canDelete(poem.id, poem.deleteKey)}
                  onLike={toggleLike}
                  onDelete={deletePoem}
                  onClick={setSelected}
                />
              ))}
            </MasonryGrid>
          )}
        </>
      )}

      {/* Post tab */}
      {tab === 'post' && (
        <PostForm
          onPost={postPoem}
          onSuccess={() => setTab('read')}
        />
      )}

      {/* Full poem modal */}
      {selected && (
        <PoemViewModal
          poem={selected}
          isLiked={liked.has(selected.id)}
          canDel={ownerMode || canDelete(selected.id, selected.deleteKey)}
          onLike={toggleLike}
          onDelete={deletePoem}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  )
}
