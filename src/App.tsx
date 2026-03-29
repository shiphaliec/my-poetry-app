import { useState, useEffect, useRef } from 'react'
import Archive from './Archive'
import Footer from './Footer';
import poetImg from './assets/my-photo.jpeg';

// ── Types ──────────────────────────────────────────────────────────────────

type Page = 'hero' | 'archive' | 'about'

// ── Colors ─────────────────────────────────────────────────────────────────

const COLORS = {
  ink:    '#1a1410',
  paper:  '#f5f0e8',
  aged:   '#e8dfc8',
  candle: '#c8a45a',
  dim:    '#7a6e5f',
} as const

// ── Global CSS ─────────────────────────────────────────────────────────────

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Inconsolata:wght@300;400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #1a1410;
    color: #f5f0e8;
    font-family: 'Cormorant Garamond', serif;
    font-weight: 300;
    line-height: 1.8;
    overflow-x: hidden;
    overflow-y:auto;
    height:100%;
    min-height: 100vh;
    overscroll-behavior:none;
  }

  html {
  background: #1a1410;
  height: 100%;
  overflow:hidden;
  }

  body {
  background: #1a1410;
  min-height: 100vh;
  }

  #root { min-height: 100vh; }

  @keyframes flicker {
    0%   { transform: scaleX(1) skewX(0deg); opacity: 0.9; }
    30%  { transform: scaleX(0.9) skewX(-1deg); opacity: 1; }
    60%  { transform: scaleX(1.1) skewX(1deg); opacity: 0.85; }
    100% { transform: scaleX(0.95) skewX(0deg); opacity: 0.95; }
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .fade-up { animation: fadeUp 0.7s ease forwards; }
  .fade-in { animation: fadeIn 0.4s ease forwards; }

  .poem-card {
    border: 1px solid rgba(200,164,90,0.12);
    padding: 1.8rem 2rem;
    background: rgba(255,255,255,0.015);
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s, background 0.3s;
  }
  .poem-card:hover {
    border-color: rgba(200,164,90,0.35);
    background: rgba(255,255,255,0.035);
  }
  .poem-card:hover .card-bar { transform: scaleX(1); }

  .nav-btn {
    font-family: 'Inconsolata', monospace;
    font-size: 0.72rem;
    font-weight: 300;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #7a6e5f;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: color 0.3s;
  }
  .nav-btn:hover, .nav-btn.active { color: #c8a45a; }

  .enter-btn {
    margin-top: 3rem;
    font-family: 'Inconsolata', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #c8a45a;
    background: none;
    border: 1px solid rgba(200,164,90,0.25);
    padding: 0.8rem 2rem;
    cursor: pointer;
    transition: border-color 0.3s;
  }
  .enter-btn:hover { border-color: rgba(200,164,90,0.6); }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(10,8,6,0.92);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    animation: fadeIn 0.25s ease;
  }
  .modal-box {
    background: #1e1810;
    border: 1px solid rgba(200,164,90,0.2);
    max-width: 520px;
    width: 100%;
    padding: 3rem;
    position: relative;
    max-height: 85vh;
    overflow-y: auto;
    animation: fadeUp 0.3s ease;
  }
  .modal-close {
    position: absolute;
    top: 1rem; right: 1.2rem;
    background: none;
    border: none;
    color: #7a6e5f;
    font-size: 1.1rem;
    cursor: pointer;
    font-family: 'Inconsolata', monospace;
    padding: 0;
    transition: color 0.2s;
  }
  .modal-close:hover { color: #c8a45a; }

  @keyframes heartPop {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.45); }
    70%  { transform: scale(0.9); }
    100% { transform: scale(1); }
  }

  .like-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: 1px solid rgba(200,164,90,0.18);
    color: #7a6e5f;
    font-family: 'Inconsolata', monospace;
    font-size: 0.68rem;
    letter-spacing: 0.1em;
    padding: 0.4rem 0.85rem;
    cursor: pointer;
    transition: border-color 0.25s, color 0.25s;
  }
  .like-btn:hover { border-color: rgba(200,164,90,0.5); color: #c8a45a; }
  .like-btn.liked { border-color: rgba(200,100,100,0.45); color: #c87a7a; }
  .like-btn.pop svg { animation: heartPop 0.35s ease; }

  .about-grid {
    display: grid;
    grid-template-columns: 160px 1fr;
    gap: 3.5rem;
    align-items: start;
  }

  @media (max-width: 640px) {
    .about-grid { grid-template-columns: 1fr;
                  justify-items:center;
                  text-align: center; 
                }
    .nav-inner  { padding: 1rem 1.5rem !important; }
    .nav-links  { gap: 1.2rem !important; }
  }

  @media (max-width: 640px) {
  .about-grid { grid-template-columns: 1fr; }
  .archive-grid { grid-template-columns: 1fr; }  /* ← add this line */
  .footer-grid { grid-template-columns: 1fr !important; }  /* ← added */
  .nav-inner  { padding: 1rem 1.5rem !important; }
  .nav-links  { gap: 1.2rem !important; }
}
`

// ── Candle ─────────────────────────────────────────────────────────────────

function Candle() {
  return (
    <div style={{
      width: 2, height: 60,
      background: 'linear-gradient(to top, #c8a45a, rgba(200,164,90,0.3), transparent)',
      margin: '0 auto 2rem', borderRadius: '50%',
      animation: 'flicker 2.5s ease-in-out infinite alternate',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', bottom: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: 6, height: 6,
        background: '#c8a45a', borderRadius: '50%',
      }} />
    </div>
  )
}

// ── PoemLines ──────────────────────────────────────────────────────────────

function PoemLines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((line, i) =>
        line ? <p key={i}>{line}</p> : <br key={i} />
      )}
    </>
  )
}

// ── Navbar ─────────────────────────────────────────────────────────────────

function Navbar({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  const links: [Page, string][] = [['hero', 'Home'], ['archive', 'Archive'], ['about', 'About']]

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(26,20,16,0.93)',
      borderBottom: '1px solid rgba(200,164,90,0.15)',
    }}>
      <div className="nav-inner" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1.2rem 4rem', maxWidth: 1100, margin: '0 auto',
      }}>
        <button
          className="nav-btn active"
          onClick={() => setPage('hero')}
          style={{ fontFamily: "'IM Fell English', serif", fontSize: '1.05rem', letterSpacing: '0.08em', color: COLORS.candle, textTransform: 'none' }}
        >
          Verses in the Dark - I don't chase emotions—I reconstruct them.
        </button>
        <div className="nav-links" style={{ display: 'flex', gap: '2.5rem' }}>
          {links.map(([id, label]) => (
            <button
              key={id}
              className={`nav-btn${page === id ? ' active' : ''}`}
              onClick={() => setPage(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}

// ── Hero ───────────────────────────────────────────────────────────────────

const featuredLines = [
  'Aaj koi zara saath chale , aisi zarurat lag rahi hai',
  'akele chalte-chalte, safar lamba lag raha hai , ',
  'ki ,',
  'kisi ke kadmon ki awaaz peeche se aaye ,',
  'aur, mere aage aake ruk jaye ,',
  'woh aawaaz mujhse kahe ,',
  'ki - bahut chal liye akele aao saath chale ,',
  '' ,
  'Safar jo din ke sawere se - raat ke andhere tak beete ,',
  'phir, sath mein hum puuare pe baith ke beete waqt ko jeete , ',
  '',
  'Har ek kadam ishara kare, ki aage badhte rahen ,',
  'Yunhi manzil ki taalash mein, is khule aasmaan mein ,',
  'Zara paani ki pyaas mein, aur ek saathi ki aas mein ,',
  '',
  'Kal tak akele chalne ki aadat si thi ,',
  'par aaj kisi ki zarurat ho rahi ,',
  'kal haseen wadiyon se ki thi safar ki shuruaat ,',
  'aaj aaju-baju sirf khade hain chattaan ,',
  'kal paani se dabba bhara hua tha , ',
  'aaj man ka samundar hai viraan ,',
  'yeh chattaan kab ret ban jaye, iski toh khabar nahi ,',
  'magar, aaj halki si baarish ki zarurat hai ,',
  'Is viraan samundar ko bharne ke liye abhi ,',
  '',
  'Yeh mitti ka shareer jab bheeg jaye ,',
  'aur aankh se aansoo jab jhar-jhar aaye ,',
  'toh, shayad yeh man shaant ho paye ,',
  'aur, na kisi ke aane ki ummeed rakhaye ,',
  '',
  'Phir, tab maine apne paanv uthaye ,',
  'aur kadam aage ko badhaye ,',
  'tab bina aankh peeche ko mudhaye ,', 
  'bina kisi ke sath, akele apne pair chalaye ,',
  '',
  'Phir, jb pheeche se koi awaaz na aaye,',
  'aur, woh aage aake na ruk jaaye',
  'Tab mera bharam tute,',
  'ki, puri nahi hongi meri yeh zaruratein ,',
  'aur, main band kar doon yeh kehna ,',
  'ki zara, aaj koi mere sath chalna......'

]

function Hero({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <section style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      textAlign: 'center', padding: '8rem 2rem 4rem', position: 'relative',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 40%, rgba(139,58,58,0.08) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <Candle />

      <p className="fade-up" style={{
        fontFamily: "'Inconsolata', monospace", fontSize: '0.68rem',
        letterSpacing: '0.3em', textTransform: 'uppercase',
        color: COLORS.candle, marginBottom: '1.5rem', opacity: 0.8,
      }}>
        A collection of shadows &amp; soliloquies
      </p>

      <h1 className="fade-up" style={{
        fontFamily: "'IM Fell English', serif",
        fontSize: 'clamp(3rem, 8vw, 5.5rem)',
        lineHeight: 1.05, color: COLORS.paper,
        marginBottom: '1rem', animationDelay: '0.15s',
      }}>
        Where <em style={{ fontStyle: 'italic', color: COLORS.candle }}>words</em>
        <br />learn to grieve
      </h1>

      <p className="fade-up" style={{
        fontSize: '1.05rem', fontStyle: 'italic', color: COLORS.dim,
        maxWidth: 420, margin: '0 auto 1.2rem', lineHeight: 1.7, animationDelay: '0.3s',
      }}>
        Poetry born in the small hours, shaped by silence,
        and meant for those who read in the dark.
      </p>

       {/* Signature line */}

          <p style={{
            fontFamily: "'Inconsolata', monospace",
            fontSize: '0.68rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: COLORS.candle,
            opacity: 0.7,
            margin: '0 auto 2rem',
          }}>
          A Hindi voice, written in English letters
          </p>

      <div className="fade-up" style={{
        border: '1px solid rgba(200,164,90,0.2)',
        maxWidth: 540, width: '100%',
        padding: '2.5rem 3rem', textAlign: 'left',
        background: 'rgba(255,255,255,0.02)',
        position: 'relative', animationDelay: '0.45s',
      }}>
        <div style={{
          position: 'absolute', top: '-0.7rem', left: '50%',
          transform: 'translateX(-50%)',
          background: COLORS.ink, padding: '0 0.5rem',
          color: COLORS.candle, fontSize: '1rem',
        }}>❧</div>

        <span style={{
          fontFamily: "'Inconsolata', monospace", fontSize: '0.62rem',
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: COLORS.candle, opacity: 0.7, display: 'block', marginBottom: '1rem',
        }}>
          Favorite Poem
        </span>

        <div style={{
          fontFamily: "'IM Fell English', serif", fontSize: '1.5rem',
          fontStyle: 'italic', color: COLORS.paper, marginBottom: '1.2rem',
        }}>
          Karwaan - Ek Safar
        </div>

        <div style={{ fontSize: '0.98rem', lineHeight: 2, color: COLORS.aged }}>
          <PoemLines lines={featuredLines} />
        </div>

        <div style={{
          marginTop: '1.5rem', fontFamily: "'Inconsolata', monospace",
          fontSize: '0.68rem', letterSpacing: '0.15em',
          color: COLORS.dim, textAlign: 'right',
        }}>
          — @unpraisedwrites, Dec 16, 2025
        </div>
      </div>

      <button
        className="enter-btn fade-up"
        onClick={() => setPage('archive')}
        style={{ animationDelay: '0.6s' }}
      >
        Enter the Archive →
      </button>
    </section>
  )
}

// ── About ──────────────────────────────────────────────────────────────────

function About() {
  return (
    <section style={{ minHeight: '100vh', padding: '8rem 2rem 5rem', maxWidth: 720, margin: '0 auto' }}>
      <div className="fade-up" style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h2 style={{
          fontFamily: "'IM Fell English', serif", fontSize: '2.5rem',
          fontStyle: 'italic', color: COLORS.paper, marginBottom: '0.5rem',
        }}>
          About the Poet
        </h2>
        <p style={{
          fontFamily: "'Inconsolata', monospace", fontSize: '0.7rem',
          letterSpacing: '0.2em', textTransform: 'uppercase', color: COLORS.dim,
        }}>
          The hand behind the ink
        </p>
      </div>

      <div className="about-grid fade-up" style={{ animationDelay: '0.15s' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          
          {/* ✅ Aesthetic Image Added Here */}
          <div style={{
            width: 160,
            height: 200,
            aspectRatio: '3 / 4',
            border: '1px solid rgba(200,164,90,0.8)',
            display:'flex', alignItems:'center',
            background: 'rgba(255,255,255,0.02)',
            margin:'0 auto',
            overflow: 'hidden',
            
          }}>
            <img
              src={poetImg}   // 🔁 replace with your actual image path
              alt="Poet"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'grayscale(100%) contrast(1.1)',
              }}
            />
          </div>

          <div style={{
            position: 'absolute', bottom: -8, right: -8,
            width: '100%', height: '100%',
            border: '1px solid rgba(200,164,90,0.08)',
            pointerEvents: 'none',
          }} />
        </div>

        <div>
          <h2 style={{
            fontFamily: "'IM Fell English', serif", fontSize: '2rem',
            fontStyle: 'italic', color: COLORS.paper, marginBottom: '0.3rem',
          }}>
            unpraisedwrites
          </h2>
          <div style={{
            fontFamily: "'Inconsolata', monospace", fontSize: '0.68rem',
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: COLORS.candle, opacity: 0.7, marginBottom: '1.8rem',
          }}>
            Poet · Writer · Wanderer
          </div>
          <p style={{ fontSize: '1rem', lineHeight: 1.95, color: COLORS.aged, marginBottom: '1.2rem' }}>
            I write from the places most people would rather not visit—grief held too long,
            the 3am conversations with oneself, the particular loneliness of feeling unseen
            in a crowded room.
          </p>
          <p style={{ fontSize: '1rem', lineHeight: 1.95, color: COLORS.aged, marginBottom: '1.2rem' }}>
            These poems are not performances. They are confessions left in the margin
            of a book no one will finish.
          </p>
          <blockquote style={{
            borderLeft: `2px solid ${COLORS.candle}`,
            paddingLeft: '1.5rem', margin: '2rem 0',
            fontStyle: 'italic', color: COLORS.dim,
            fontSize: '1.05rem', lineHeight: 1.9, borderRadius: 0,
          }}>
            "I do not write to be understood.<br />
            I write so I do not disappear."
          </blockquote>
          <p style={{ fontSize: '1rem', lineHeight: 1.95, color: COLORS.aged }}>
            Based in a city that hums too loud. Reader of old letters, collector of silences.
          </p>
        </div>
      </div>
    </section>
  )
}

// ── App (root) ─────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>('hero')
  const topRef = useRef<HTMLDivElement>(null)   // ← add this

  const navigate = (p: Page) => {
    setPage(p)
  }

  useEffect(() => {
    topRef.current?.scrollIntoView()   // ← scrolls to the div
  }, [page])


  return (
    <>
      <style>{globalStyles}</style>
      <Navbar page={page} setPage={navigate} />
      <div  key = {page} ref={topRef}>
        {page === 'hero'    && <Hero    setPage={navigate} />}
        {page === 'archive' && <Archive />}
        {page === 'about'   && <About   />}
      </div>
      <Footer/>
    </>
  )
}
