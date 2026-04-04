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
} from 'firebase/firestore'
import { useAuth } from './useAuth'
import SignInPage from './SignInPage'

// ── Colors ─────────────────────────────────────────────────────────────────

const COLORS = {
  ink:    '#1a1410',
  paper:  '#f5f0e8',
  aged:   '#e8dfc8',
  candle: '#c8a45a',
  dim:    '#7a6e5f',
  surface:'#1e1810',
  card:   '#231c16',
  border: 'rgba(200,164,90,0.12)',
  borderHover: 'rgba(200,164,90,0.28)',
} as const

// ── Types ──────────────────────────────────────────────────────────────────

interface DiaryPoem {
  id:        string
  title:     string
  lines:     string[]
  isPublic:  boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ── useDiaryPoems hook ─────────────────────────────────────────────────────

function useDiaryPoems(userId: string) {
  const [poems,   setPoems]   = useState<DiaryPoem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    const q = query(
      collection(db, 'userPoems', userId, 'poems'),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, snap => {
      setPoems(snap.docs.map(d => ({ id: d.id, ...d.data() } as DiaryPoem)))
      setLoading(false)
    })
    return () => unsub()
  }, [userId])

  const addPoem = async (title: string, lines: string[]) => {
    await addDoc(collection(db, 'userPoems', userId, 'poems'), {
      title, lines, isPublic: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
  }

  const deletePoem = async (poemId: string) => {
    await deleteDoc(doc(db, 'userPoems', userId, 'poems', poemId))
  }

  const updatePoem = async (poemId: string, title: string, lines: string[]) => {
    await updateDoc(doc(db, 'userPoems', userId, 'poems', poemId), {
      title, lines, updatedAt: Timestamp.now(),
    })
  }

  const toggleVisibility = async (poem: DiaryPoem, penName: string) => {
    const newPublic = !poem.isPublic
    await updateDoc(doc(db, 'userPoems', userId, 'poems', poem.id), {
      isPublic: newPublic,
      penName,
      updatedAt: Timestamp.now(),
    })
  }

  return { poems, loading, addPoem, deletePoem, updatePoem, toggleVisibility }
}

// ── WriteForm ──────────────────────────────────────────────────────────────

function WriteForm({ onAdd }: { onAdd: (title: string, lines: string[]) => Promise<void> }) {
  const [title,   setTitle]   = useState('')
  const [text,    setText]    = useState('')
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [open,    setOpen]    = useState(false)

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    color: COLORS.paper,
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '1rem',
    padding: '0.75rem 1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  }

  const disabled = !title.trim() || !text.trim() || saving

  const handleSave = async () => {
    if (disabled) return
    setSaving(true)
    await onAdd(title, text.split('\n'))
    setTitle(''); setText('')
    setSaving(false); setSaved(true)
    setOpen(false)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div style={{
      background: COLORS.card,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 12,
      marginBottom: '2.5rem',
      overflow: 'hidden',
    }}>
      {/* Header toggle */}
      <button
        onClick={() => setOpen(prev => !prev)}
        style={{
          width: '100%', padding: '1rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer',
          color: COLORS.paper,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          <span style={{ fontSize: '1rem' }}>✍️</span>
          <span style={{
            fontFamily: "'Inconsolata', monospace",
            fontSize: '0.75rem', letterSpacing: '0.15em',
            textTransform: 'uppercase', color: COLORS.candle,
          }}>
            Write a new poem
          </span>
          {saved && (
            <span style={{
              fontFamily: "'Inconsolata', monospace",
              fontSize: '0.65rem', color: '#6db87a',
              letterSpacing: '0.1em',
            }}>
              · Saved ✓
            </span>
          )}
        </div>
        <span style={{ color: COLORS.dim, fontSize: '0.8rem' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div style={{
          padding: '0 1.5rem 1.5rem',
          display: 'flex', flexDirection: 'column', gap: '1rem',
          borderTop: `1px solid ${COLORS.border}`,
          paddingTop: '1.2rem',
        }}>
          <input
            type="text" placeholder="Poem title"
            value={title} onChange={e => setTitle(e.target.value)}
            style={inputStyle}
          />
          <textarea
            placeholder={'Write your poem here…\nEach line on a new line.\nLeave a blank line between stanzas.'}
            value={text} onChange={e => setText(e.target.value)}
            rows={10}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 2 }}
          />
          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button
              onClick={handleSave} disabled={disabled}
              style={{
                padding: '0.7rem 1.8rem', borderRadius: 8,
                background: disabled ? 'transparent' : COLORS.candle,
                border: `1px solid ${disabled ? 'rgba(200,164,90,0.15)' : COLORS.candle}`,
                color: disabled ? COLORS.dim : COLORS.ink,
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize: '0.8rem', fontWeight: 500,
                fontFamily: "'Inconsolata', monospace",
                letterSpacing: '0.1em', textTransform: 'uppercase',
                transition: 'all 0.25s',
              }}
            >
              {saving ? 'Saving…' : 'Save Poem'}
            </button>
            <button
              onClick={() => { setOpen(false); setTitle(''); setText('') }}
              style={{
                padding: '0.7rem 1.2rem', borderRadius: 8,
                background: 'none', border: `1px solid ${COLORS.border}`,
                color: COLORS.dim, cursor: 'pointer',
                fontSize: '0.8rem', fontFamily: "'Inconsolata', monospace",
                letterSpacing: '0.1em', textTransform: 'uppercase',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── EditModal ──────────────────────────────────────────────────────────────

function EditModal({
  poem,
  onSave,
  onClose,
}: {
  poem: DiaryPoem
  onSave: (id: string, title: string, lines: string[]) => Promise<void>
  onClose: () => void
}) {
  const [title,  setTitle]  = useState(poem.title)
  const [text,   setText]   = useState(poem.lines.join('\n'))
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave(poem.id, title, text.split('\n'))
    setSaving(false)
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    color: COLORS.paper,
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '1rem',
    padding: '0.75rem 1rem',
    outline: 'none',
  }

  return (
    <div
      className="modal-backdrop"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: COLORS.card,
        border: `1px solid rgba(200,164,90,0.2)`,
        borderRadius: 12, maxWidth: 540, width: '100%',
        padding: '2rem', position: 'relative',
        maxHeight: '85vh', overflowY: 'auto',
        animation: 'fadeUp 0.25s ease',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'none', border: 'none',
            color: COLORS.dim, fontSize: '1rem', cursor: 'pointer',
          }}
        >✕</button>

        <div style={{
          fontFamily: "'Inconsolata', monospace",
          fontSize: '0.68rem', letterSpacing: '0.15em',
          textTransform: 'uppercase', color: COLORS.candle,
          marginBottom: '1.5rem',
        }}>
          Edit Poem
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="text" value={title}
            onChange={e => setTitle(e.target.value)}
            style={inputStyle}
          />
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={12}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 2 }}
          />
          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button
              onClick={handleSave} disabled={saving}
              style={{
                padding: '0.7rem 1.8rem', borderRadius: 8,
                background: COLORS.candle,
                border: `1px solid ${COLORS.candle}`,
                color: COLORS.ink, cursor: 'pointer',
                fontSize: '0.8rem', fontWeight: 500,
                fontFamily: "'Inconsolata', monospace",
                letterSpacing: '0.1em', textTransform: 'uppercase',
              }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '0.7rem 1.2rem', borderRadius: 8,
                background: 'none', border: `1px solid ${COLORS.border}`,
                color: COLORS.dim, cursor: 'pointer',
                fontSize: '0.8rem', fontFamily: "'Inconsolata', monospace",
                letterSpacing: '0.1em', textTransform: 'uppercase',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── PoemCard ───────────────────────────────────────────────────────────────

function DiaryPoemCard({
  poem, penName, onEdit, onDelete, onToggleVisibility,
}: {
  poem: DiaryPoem
  penName: string
  onEdit: (poem: DiaryPoem) => void
  onDelete: (id: string) => void
  onToggleVisibility: (poem: DiaryPoem) => void
}) {
  const [hovered,   setHovered]   = useState(false)
  const [toggling,  setToggling]  = useState(false)
  const preview = poem.lines.filter(l => l.trim()).slice(0, 4)

  const handleToggle = async () => {
    setToggling(true)
    await onToggleVisibility(poem)
    setToggling(false)
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: COLORS.card,
        border: `1px solid ${hovered ? COLORS.borderHover : COLORS.border}`,
        borderRadius: 12, padding: '1.4rem',
        transition: 'all 0.25s',
        transform: hovered ? 'translateY(-2px)' : 'none',
        position: 'relative',
      }}
    >
      {/* Visibility badge */}
      <div style={{
        position: 'absolute', top: '1rem', right: '1rem',
        fontFamily: "'Inconsolata', monospace",
        fontSize: '0.6rem', letterSpacing: '0.1em',
        textTransform: 'uppercase',
        padding: '0.2rem 0.6rem', borderRadius: 4,
        background: poem.isPublic
          ? 'rgba(109,184,122,0.12)'
          : 'rgba(122,110,95,0.12)',
        color: poem.isPublic ? '#6db87a' : COLORS.dim,
        border: `1px solid ${poem.isPublic ? 'rgba(109,184,122,0.25)' : 'rgba(122,110,95,0.2)'}`,
      }}>
        {poem.isPublic ? '🌐 Public' : '🔒 Private'}
      </div>

      {/* Title */}
      <div style={{
        fontFamily: "'IM Fell English', serif",
        fontSize: '1.15rem', fontStyle: 'italic',
        color: COLORS.paper, marginBottom: '0.3rem',
        paddingRight: '5rem',
      }}>
        {poem.title}
      </div>

      {/*PenName*/ }

      <div
        style={{
          fontSize: '0.78rem',
          color: COLORS.dim,
          fontStyle: 'italic',
          marginBottom: '0.5rem',
          letterSpacing: '0.03em',
        }}
      >
  — {penName}
</div>

      {/* Date */}
      <div style={{
        fontFamily: "'Inconsolata', monospace",
        fontSize: '0.62rem', color: COLORS.dim,
        letterSpacing: '0.08em', marginBottom: '1rem',
      }}>
        {poem.createdAt?.toDate().toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric',
        })}
      </div>

      {/* Preview */}
      <div style={{
        fontSize: '0.88rem', lineHeight: 1.9,
        color: COLORS.dim, fontStyle: 'italic',
        marginBottom: '1.2rem',
        overflow: 'hidden', display: '-webkit-box',
        WebkitLineClamp: 4, WebkitBoxOrient: 'vertical',
      }}>
        {preview.join('\n')}
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex', gap: '0.6rem',
        paddingTop: '1rem',
        borderTop: `1px solid ${COLORS.border}`,
        flexWrap: 'wrap',
      }}>
        {/* Toggle public/private */}
        <button
          onClick={handleToggle} disabled={toggling}
          style={{
            flex: 1, padding: '0.5rem 0.8rem', borderRadius: 7,
            background: poem.isPublic
              ? 'rgba(122,110,95,0.1)'
              : 'rgba(109,184,122,0.08)',
            border: `1px solid ${poem.isPublic ? 'rgba(122,110,95,0.2)' : 'rgba(109,184,122,0.2)'}`,
            color: poem.isPublic ? COLORS.dim : '#6db87a',
            cursor: 'pointer', fontSize: '0.7rem',
            fontFamily: "'Inconsolata', monospace",
            letterSpacing: '0.08em', textTransform: 'uppercase',
            transition: 'all 0.2s',
          }}
        >
          {toggling ? '…' : poem.isPublic ? '🔒 Make Private' : '🌐 Make Public'}
        </button>

        {/* Edit */}
        <button
          onClick={() => onEdit(poem)}
          style={{
            padding: '0.5rem 0.9rem', borderRadius: 7,
            background: 'none',
            border: `1px solid ${COLORS.border}`,
            color: COLORS.candle, cursor: 'pointer',
            fontSize: '0.7rem',
            fontFamily: "'Inconsolata', monospace",
            letterSpacing: '0.08em', textTransform: 'uppercase',
            transition: 'all 0.2s',
          }}
        >
          Edit
        </button>

        {/* Delete */}
        <button
          onClick={() => {
            if (window.confirm('Delete this poem? This cannot be undone.')) {
              onDelete(poem.id)
            }
          }}
          style={{
            padding: '0.5rem 0.9rem', borderRadius: 7,
            background: 'none',
            border: '1px solid rgba(200,100,100,0.2)',
            color: '#c87a7a', cursor: 'pointer',
            fontSize: '0.7rem',
            fontFamily: "'Inconsolata', monospace",
            letterSpacing: '0.08em', textTransform: 'uppercase',
            transition: 'all 0.2s',
          }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

// ── EmptyState ─────────────────────────────────────────────────────────────

function EmptyState({ label, icon, message }: { label: string; icon: string; message: string }) {
  return (
    <div style={{
      border: `1px dashed ${COLORS.border}`,
      borderRadius: 12, padding: '2.5rem 1.5rem',
      textAlign: 'center', opacity: 0.6,
    }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '0.6rem' }}>{icon}</div>
      <div style={{
        fontFamily: "'Inconsolata', monospace",
        fontSize: '0.72rem', color: COLORS.dim,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        marginBottom: '0.4rem',
      }}>
        {label}
      </div>
      <p style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: '0.9rem', color: COLORS.dim,
        fontStyle: 'italic', lineHeight: 1.6,
      }}>
        {message}
      </p>
    </div>
  )
}

// ── PersonalDiary (default export) ────────────────────────────────────────

export default function PersonalDiary() {
  const {
    user, loading, needsPenName,
    signInWithGoogle, signOut, savePenName,
  } = useAuth()

  const {
    poems, loading: poemsLoading,
    addPoem, deletePoem, updatePoem, toggleVisibility,
  } = useDiaryPoems(user?.uid ?? '')

  const [editingPoem, setEditingPoem] = useState<DiaryPoem | null>(null)

  // Show sign in page if not logged in
  if (!user) {
    return (
      <SignInPage
        onSignIn={signInWithGoogle}
        onSavePenName={savePenName}
        needsPenName={needsPenName}
        loading={loading}
      />
    )
  }

  const privatePoems = poems.filter(p => !p.isPublic)
  const publicPoems  = poems.filter(p => p.isPublic)

  return (
    <section style={{
      minHeight: '100vh',
      padding: '8rem 2rem 5rem',
      maxWidth: 960, margin: '0 auto',
    }}>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', flexWrap: 'wrap',
        gap: '1rem', marginBottom: '2.5rem',
      }}>
        <div>
          <div style={{
            fontFamily: "'Inconsolata', monospace",
            fontSize: '0.65rem', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: COLORS.candle,
            opacity: 0.7, marginBottom: '0.4rem',
          }}>
            Personal Diary
          </div>
          <h2 style={{
            fontFamily: "'IM Fell English', serif",
            fontSize: '2rem', fontStyle: 'italic',
            color: COLORS.paper, marginBottom: '0.2rem',
          }}>
            {user.penName}
          </h2>
          <p style={{
            fontFamily: "'Inconsolata', monospace",
            fontSize: '0.65rem', color: COLORS.dim,
            letterSpacing: '0.08em',
          }}>
            {poems.length} {poems.length === 1 ? 'poem' : 'poems'} ·{' '}
            {publicPoems.length} public · {privatePoems.length} private
          </p>
        </div>

        {/* Sign out */}
        <button
          onClick={signOut}
          style={{
            fontFamily: "'Inconsolata', monospace",
            fontSize: '0.68rem', letterSpacing: '0.12em',
            textTransform: 'uppercase', color: COLORS.dim,
            background: 'none',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8, padding: '0.5rem 1rem',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          Sign out
        </button>
      </div>

      {/* Write form */}
      <WriteForm onAdd={addPoem} />

      {/* Two column layout */}
      <div className="diary-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem',
        alignItems: 'start',
      }}>

        {/* Private poems */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            marginBottom: '1.2rem',
          }}>
            <span style={{ fontSize: '0.9rem' }}>🔒</span>
            <span style={{
              fontFamily: "'Inconsolata', monospace",
              fontSize: '0.68rem', letterSpacing: '0.15em',
              textTransform: 'uppercase', color: COLORS.dim,
            }}>
              Private · {privatePoems.length}
            </span>
          </div>

          {poemsLoading ? (
            <p style={{ fontFamily: "'Inconsolata', monospace", fontSize: '0.7rem', color: COLORS.dim }}>
              Loading…
            </p>
          ) : privatePoems.length === 0 ? (
            <EmptyState
              label="No private poems"
              icon="🔒"
              message="Poems you write start as private. Only you can see them."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {privatePoems.map(poem => (
                <DiaryPoemCard
                  key={poem.id} poem={poem}
                  penName={user.penName}
                  onEdit={setEditingPoem}
                  onDelete={deletePoem}
                  onToggleVisibility={p => toggleVisibility(p, user.penName)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Public poems */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            marginBottom: '1.2rem',
          }}>
            <span style={{ fontSize: '0.9rem' }}>🌐</span>
            <span style={{
              fontFamily: "'Inconsolata', monospace",
              fontSize: '0.68rem', letterSpacing: '0.15em',
              textTransform: 'uppercase', color: '#6db87a',
            }}>
              Public · {publicPoems.length}
            </span>
          </div>

          {poemsLoading ? (
            <p style={{ fontFamily: "'Inconsolata', monospace", fontSize: '0.7rem', color: COLORS.dim }}>
              Loading…
            </p>
          ) : publicPoems.length === 0 ? (
            <EmptyState
              label="No public poems"
              icon="🌐"
              message="Toggle a poem to public and it will appear here and in the Community section."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {publicPoems.map(poem => (
                <DiaryPoemCard
                  key={poem.id} poem={poem}
                  penName={user.penName}
                  onEdit={setEditingPoem}
                  onDelete={deletePoem}
                  onToggleVisibility={p => toggleVisibility(p, user.penName)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editingPoem && (
        <EditModal
          poem={editingPoem}
          onSave={updatePoem}
          onClose={() => setEditingPoem(null)}
        />
      )}
    </section>
  )
}
