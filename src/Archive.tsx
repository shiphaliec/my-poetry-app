import { useState, useEffect } from 'react'
import { db } from './firebase'
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore'

// ── Types ──────────────────────────────────────────────────────────────────

interface Poem {
  id: number
  num: string
  title: string
  date: string
  excerpt: string
  lines: string[]
}

type LikesMap = Record<number, number>

// ── Colors ─────────────────────────────────────────────────────────────────

const COLORS = {
  ink:    '#1a1410',
  paper:  '#f5f0e8',
  aged:   '#e8dfc8',
  candle: '#c8a45a',
  dim:    '#7a6e5f',
} as const

// ── Poem data ──────────────────────────────────────────────────────────────

const poems: Poem[] = [
  {
    id: 10,
    num: '010',
    title: 'The secret of spines',
    date: 'Sept 12, 2025',
    excerpt: 'Badhi uljhanein hain mere khayalon mein....',
    lines: [
      'Badhi uljhanein hai mere khayalon mein ,','dhundta hoon jawab apne hi sawalon mein ,',
      'Jeena seekha maine tere khatir in beete saalon mein ,', 'bhatakta hoon raaston par, khoya main apni hi manzil ki raahon mein', 'jaaga hoon raat ke saahil par , soya hoon  sawere ki baahon mein ,',
      'main chahta raha tumko soch kar apni yaadon mein ,', 
      'tab bhulna mushkil tha mera tumhe,', 'kyunki, rakha tha sir tumne mere sirahon mein ,',
      'jab aaine pe bindi tumhari dikhti mujhe,', 'tab dekhta main tumhe un kinaron mein ,',
      'kambal se dhakta main khudko,', 'magar chupaya maine tumhe un minaaron mein ,',
      'saath hmesha diya tumne mera ,','tabhi paaya maine tumhe apne saharon mein ,',
      'tumhare jaane ke baad bhi tum basti meri saanson mein ,',
      'mehsus kiya maine tumhe apne aas-paas ki hawaaon mein ,',
      'mit gaya main, mita diya khudko,','magar sajaya maine tumhe in khokhli deewaron mein ,',
      'deewaron se chupkar, band karta hoon aankh apni ,', 'milta hoon roz tumhe apne khwaabon mein ,',
      'maanta hoon ki tum paas nahi mere,','par saath rehti ho tum aaj bhi mere har haalaton mein ,',
      'yeh toh sach hai ki badi uljhanein hain mere khayalon mein ,',
      'magar dhundta hoon main jawaab apne hi sawalon mein........',
    ],
  },
  {
    id: 9,
    num: '009',
    title: 'The locked door',
    date: 'Sept 11, 2025',
    excerpt: 'Mere man ka woh band darwaza.....',
    lines: [
      'Mere man ka woh band darwaaza,','Jahaan zakham gehre hai aur ghaav taaza,','',
      'Pehre par khada koi , jazbaaton se lada koi','zakham nihare kisine , toh marham bana koi ,','',
      'Samay ki zarurat aur, waqt ki nazakat samajh na paaya koi ,','haari hui baazi , bana har koi kaazi ,',
      'jab chin gayi chaabhi , toh jeet na paaya koi ,','',
      'Taale pe jangh , aur khud se khud ki jung ,','Samay ne kiya jo tang, zindagi se udd gaye saare rang ,',
      'Jeevan hua bedhang, magar maine koshishon se banai ek surang ,','',
      'Surang mein mile purane gam ,', 'aaj bhi hain woh mere hum-dum , ','',
      'Tod diya mujhko , main rok na paaya khudko ,', 'Nikal gayi jb cheekh , maangi maine apne jaan ki bheekh ,',
      'Rukhsat hua mera har dard , phir chala gaya woh humdard ,', 'Wahaan se, jahaan tha -',
      'Mere man ka woh band darwaaza ,', 'Jahaan zakham gehre the aur ghaav taaza....',
    ],
  },
  {
    id: 8,
    num: '008',
    title: 'The pocket of Universe',
    date: 'Sept 10, 2025',
    excerpt: 'Meri muthi mein band hai tumhara aasmaan.....',
    lines: [
      'Meri muthi mein band hai tumhara aasmaan,', 'Tumhare kadmon ke neeche hai mera jahan ,', '',
      'Meri saanson mein milti hai tumhe panaah ,','Tumhare khatir main kar doon khudko fanaah ,', '',
      'Mere waade se milti hai tumhe saza ,', 'Tumhare jeene ki main hoon eklauti wajah ,','',
      'Mere aankhon ke aansoo kuch kehte kahan ,', 'Tumhare hothon ke moti jo karte bayaan ,','',
      'Mere kaanon mein shor hai chubhte zara ,', 'Tumhare hathon pe baitha jo tota hara ,','',
      'Mere shabdon ke bol hain bharte jo jaam,', 'Tumhare bhajnon ke dhol hain karte woh kaam ,', '',
      'Nikal gayi woh shaam, ', 
      'Jab , meri muthi mein band tha tumhara aasmaan ,', 'Aur tumhare kadmon ke neeche tha mera jahaan...',
    ],
  },
  {
    id: 7,
    num: '007',
    title: 'The Borrow',
    date: 'Sept 9, 2025',
    excerpt: 'Ek udhar, mere seene ka bhaar.....',
    lines: [
      'Ek udhar, mere seene ka bhaar,',
      'aaj hui hai ginti, do duni chaar,',
      'sacchhe bol se khai maine maar,',
      'ginti ginte hui main nizaar,',
      'kyunki, woh ek udharr hai mere seene ka bhaar.','',
      'Yahan bheed hai jami,', 
      'jab mere aankhon mein aai hai nami,',
      'sabne banaye apne-apne vichar,',
      'jo thope mere upar, kiya mujhe zaar-zaar,',
      'un vichaaron se dabkar, isharon se behkar,',
      'kar din maine, apni jawani bekaar,',
      'kyunki, woh ek udhar raha jo mere seene ka bhaar.','',
      'Khai jo maine asliyat ki maar,',
      'usi pal maan li maine apni haar,',
      'bhale hi beete hon saal hazaar,',
      'yaad dilaya sabne meri hi haqiqat mujhe baar-baar,',
      'tabhi toh-', 
      'woh ek udhar, aaj tak hai mere seene ka bhaar....',
    ],
  },
  {
    id: 6,
    num: '006',
    title: 'The Lock Story',
    date: 'Sept 8, 2025',
    excerpt: 'Yeh kaisa taala hai, uski yeh kaisi chaabhi.....',
    lines: [
      'Yeh kaisa taala hai, uski yeh kaisi chaabhi ,',
      'Koshishein bahut ki maine par, mujhse khula na kabhi ,', 
      'Purane daur ki baat hai ,', 'par lagta hai aisa ki, waqt guzra ho abhi ,', 
      'Yaad dhundhli padh gayi jaise, baat bhuli na ho kabhi ,', 
      'Woh sunsaan pal ,', 'paas ke baagon ka phool ,', 
      'raat ki chamak aur, chai ki mehak, band kitaab mein hai dabi ,', 
      'Sard ka kohra, us mard ka chehra ,', 'mere darwaaze par woh pehra ,',
      'yun kitabon ka dhera , jise le gaya woh behra ,',
      'diya usne zakhm mujhe jo gehra ,', 'yun usne muh phera tha jabhi ,',
      'gira gale se gamcha tabhi ,', 'maine uthaya use , jaise gira ho mere liye hi ,','',
      'Chupaya use sabki nazaron se ,', 'Dabaya use sabki khabron se,',
      'band kiya ek taale se ,', 'rakh diya dur is maale(ghar ki chatt) se ,','',
      'Waqt guzra - daur beetein, bakse pe padhti rahi yaadon ki cheetein (aansoon) ,', '',
      'Khol raha hai man mera us taale ko,', 'kaanp raha hai tan mera leke us chabhi ko ,',
      'Jangh lagi hai taale ko, waise hi uski chabhi bhi ,',
      'Sochti hui main, ki khol ke kuch paaungi nahi ,',
      'Woh saamne aa bhi jaye, toh bhi uske pass ab jaungi nahi,',
      'Toh phirr, yeh kaisa taala, aur uski yeh kaisi chaabhi.......',

    ],
  },
  {
    id: 5,
    num: '005',
    title: 'Teacher"s Day',
    date: 'Sep 5, 2025',
    excerpt: 'Ek guru hi hote hai jo har ghadi sath dete hai...',
    lines: [
      'Ek guru hi hote hai, jo har ghadi sath dete hai,',
      'Apne shishyon ke saare ulte-pulte sawalon ke jawaab dete hai, ',
      'Woh hi hain, Jo galtiyon se sikhate hai',
      'Aur us seekh ka sahi matlab batate hain,',
      'Shaant sa swabhaav unka, jheel si aankhein unki,',
      'Jinki baaton mein wajan ho, shabdon ka arth gehra,',
      'Unki koi umar nahi, unka gyaan umaron tak kaam dete hai,',
      'Ek guru hi hote hain, jo har ghadi saath ete hain....'
    ],
  },
  {
    id: 4,
    num: '004',
    title: 'Message from tomorrow',
    date: 'Sept 4, 2025',
    excerpt: 'Kal se kal ki baat aai hai, phir se nayi shuruaat aai hai....',
    lines: [
      'Kal se kal ki baat aai hai', 'phir se nayi shuruaat aai hai,', 
      'tumse milne ki, woh rat aai hai,','',
      'Milungi main tumse, ruth kar milungi ,', 'Mana lena tum, maan jaungi main,',
      'Kyunki, mohabbat mein bhigne waali barsaat aai hai,','',
      'Saath rehna mere, hath main na chodungi',
      'Baat karna tum, chup kar baithungi main,',
      'Kyunki, yeh khamosh shaam barso baad aai hai,','',
      'Duaayein mangi hai, maine chahat ki hai tumse,', 'Main apni jaan waar dungi,',
      'Haalat ke maare ho tum,', 'jazbaat se haari hoon main,',
      'Kyunki, tumhe chahne ki kasam maine baar-baar khai hai, ', '',
      'Aaj uparwale ne bakshi hai yeh rehmat,', 'Tumse dobara milne ki,',
      'Jo mere janaze ki baarat aai hai,','',
      'Tabhi toh, kal se kal ki baat aai hai.....',

    ],
  },
  {
    id: 3,
    num: '003',
    title: 'The last minute gift',
    date: 'Sept 2, 2025',
    excerpt: 'Tumne diya mujhe jo tohfa, woh hai tumhari wafa.....',
    lines: [
      'Tumne diya mujhe jo tohfa, ','woh hai tumhari wafa,','',
      'ankhon mein bhale ho andhera,','unjaalon mein dikha tumhara chehra,','',
      'hawaaon mein jo geet tha,','baharon mein mera meet tha,','',
      'sard thandi raat mein,','woh mere sath mein,','',
      'raag uski baat mein,',
      'na jane kaise, mera hath uske hath mein,','',
      'Vishwas mujhko ho gaya,','prem man ko bhigo gaya,','',
      'akhiri jo waqt tha,','mahaul bilkul sakht tha,','',
      'baat tumne jo kahi,','maana maine sab kuch sahi,','',
      'raat woh nikal gayi,','jane kyun main badal gayi,','',
      'main nahi milungi tumse ab,yeh mujhe hai malum, ',
      'chahe, ab tumhare bagair main akele jiyun,','',
      'shikwe bahut honge tumhe', 'aakhir,kyun beet gaye woh lamhe,','',
      'jo tha ab woh na raha', 'sochti hoon, na jane tumne mujhe kyun chaha,','',
      'kyunki, kiya maine tumko apni zindagi se dafa,',' tumhare prem ke badle maine diya tumhe jafa,','',
      'Is sab se bawajood, tumne nahi choda apna wajood,','',
      'mere salgirah ke mauke par,', '',
      'Tumne diya mujhe jo tohfa, woh hai tumhari wafa... ',
    ],
  },
  {
    id: 2,
    num: '002',
    title: 'The lost letter',
    date: 'Sept 1, 2025',
    excerpt: 'Kho diya woh khat maine....',
    lines: [
      'Kho diya woh khat maine, jo kiya woh sab maine,',
      'Khat mein dard chupaya tha, jisne mujhhe rulaya tha,',
      'Saans atak rahi meri, aankh chalak rahi meri,',
      'shabd bikhar gaye khat par, ',
      'kalam bikhar gaye us waraq(sheet) par,',
      'cheekh raha tha man mera,',
      'bheeg raha tha tan mera,',
      'usne mujhe bigoya hai, jisko maine sanjoya hai,',
      'khaali panno se hathiyar bane,',
      'kuch dhaar wale talwaar bane,',
      '',
      'Kaant rahe raatein jaise, baant rahe baatein khudse,',
      'sookh gayi aankhein meri, ruk gayi saansein meri,',
      'tabah kiya khudko, fanah kiya khudko,',
      'jyon waqt beet-te the, tyon jazbaat badalte the,',
      'jo kuch khaakh kiya hai maine,' ,
      'woh kuch raakh karna hai maine ,',
      'magar,',
      'kho diya woh khat maine, jo kiya woh sab maine.... ',
    ],
  },
  {
    id: 1,
    num: '001',
    title: 'Few Lines - part 1',
    date: 'Aug 28, 2025',
    excerpt: 'Ek safar ke ant pe ek naye nafar ki shuruaat honi hai....',
    lines: [
      'Ek safar ke ant pe ek naye nafar ki shuruaat honi hai,' ,
      'Beet gayi woh raat ab phir nayi subah honi hai ,',
      'Raahi toh saathi sa tha, ab toh raah bhi khoni hai ,',
      'kaal ke sath mein, ',
      'samay ke swabhaav se phir aaj ki baat honi hai ,',
      'Sach hai, ek safar ke ant pe ek naye safar ki shuruaat honi hai...',
    ],
  },
]

// ── useLikes hook ──────────────────────────────────────────────────────────

// ── localStorage — tracks which poems THIS visitor liked ───────────────────

const LIKED_KEY = 'poetry-site:liked'

function loadLiked(): Set<number> {
  try { return new Set(JSON.parse(localStorage.getItem(LIKED_KEY) ?? '[]')) } catch { return new Set() }
}

function saveLiked(liked: Set<number>) {
  localStorage.setItem(LIKED_KEY, JSON.stringify([...liked]))
}

// ── useLikes — reads from Firebase, writes to Firebase ────────────────────

function useLikes() {
  const [likes, setLikes] = useState<LikesMap>({})
  const [liked, setLiked] = useState<Set<number>>(loadLiked)

  // Load all like counts from Firestore on mount
  useEffect(() => {
    poems.forEach(async (poem) => {
      const ref = doc(db, 'likes', String(poem.id))
      const snap = await getDoc(ref)
      if (snap.exists()) {
        setLikes(prev => ({ ...prev, [poem.id]: snap.data().count ?? 0 }))
      } else {
        // Document doesn't exist yet — create it with count 0
        await setDoc(ref, { count: 0 })
        setLikes(prev => ({ ...prev, [poem.id]: 0 }))
      }
    })
  }, [])

  const toggle = async (id: number) => {
    const isLiked = liked.has(id)
    const ref = doc(db, 'likes', String(id))

    // Update Firestore count
    await updateDoc(ref, {
      count: increment(isLiked ? -1 : 1)
    })

    // Update local like counts display
    setLikes(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] ?? 0) + (isLiked ? -1 : 1))
    }))

    // Update which poems this visitor has liked (stored in localStorage)
    setLiked(prev => {
      const next = new Set(prev)
      isLiked ? next.delete(id) : next.add(id)
      saveLiked(next)
      return next
    })
  }

  return { likes, liked, toggle }
}

// ── HeartIcon ──────────────────────────────────────────────────────────────

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="13" height="13" viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

// ── LikeButton ─────────────────────────────────────────────────────────────

interface LikeButtonProps {
  poemId: number
  count: number
  isLiked: boolean
  onToggle: (id: number) => void
}

function LikeButton({ poemId, count, isLiked, onToggle }: LikeButtonProps) {
  const [popping, setPopping] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isLiked) {
      setPopping(true)
      setTimeout(() => setPopping(false), 380)
    }
    onToggle(poemId)
  }

  return (
    <button
      className={`like-btn${isLiked ? ' liked' : ''}${popping ? ' pop' : ''}`}
      onClick={handleClick}
      title={isLiked ? 'Unlike this poem' : 'Like this poem'}
    >
      <HeartIcon filled={isLiked} />
      <span>{count > 0 ? count : ''}</span>
    </button>
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

// ── PoemModal ──────────────────────────────────────────────────────────────

interface PoemModalProps {
  poem: Poem
  likeCount: number
  isLiked: boolean
  onToggleLike: (id: number) => void
  onClose: () => void
}

function PoemModal({ poem, likeCount, isLiked, onToggleLike, onClose }: PoemModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>✕</button>
        <span style={{
          fontFamily: "'Inconsolata', monospace", fontSize: '0.62rem',
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: COLORS.candle, opacity: 0.7, display: 'block', marginBottom: '1rem',
        }}>
          {poem.num} · {poem.date}
        </span>
        <div style={{
          fontFamily: "'IM Fell English', serif", fontSize: '1.8rem',
          fontStyle: 'italic', color: COLORS.paper, marginBottom: '1.5rem',
        }}>
          {poem.title}
        </div>
        <div style={{ fontSize: '1rem', lineHeight: 2.1, color: COLORS.aged }}>
          <PoemLines lines={poem.lines} />
        </div>
        <div style={{
          marginTop: '2rem', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
        }}>
          <LikeButton
            poemId={poem.id}
            count={likeCount}
            isLiked={isLiked}
            onToggle={onToggleLike}
          />
          <span style={{
            fontFamily: "'Inconsolata', monospace", fontSize: '0.68rem',
            letterSpacing: '0.15em', color: COLORS.dim,
          }}>
            — @unpraisedwrites
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Archive (default export) ───────────────────────────────────────────────

export default function Archive() {
  const [selected, setSelected] = useState<Poem | null>(null)
  const { likes, liked, toggle } = useLikes()

  return (
    <section style={{ minHeight: '100vh', padding: '8rem 2rem 5rem', maxWidth: 900, margin: '0 auto' }}>
      <div className="fade-up" style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h2 style={{
          fontFamily: "'IM Fell English', serif", fontSize: '2.5rem',
          fontStyle: 'italic', color: COLORS.paper, marginBottom: '0.5rem',
        }}>
          The Archive
        </h2>
        <p style={{
          fontFamily: "'Inconsolata', monospace", fontSize: '0.7rem',
          letterSpacing: '0.2em', textTransform: 'uppercase', color: COLORS.dim,
        }}>
          All poems · Sorted by shadow
        </p>
      </div>

      <div className='archive-grid' style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)', //fixed 2 columns
        gap: '1.5rem',
      }}>
        {poems.map((poem, idx) => (
          
          <div
            key={poem.id}
            className="poem-card fade-up"
            onClick={() => setSelected(poem)}
            style={{ animationDelay: `${idx * 0.08}s` }}
          >
            <div className="card-bar" style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: 2, background: COLORS.candle,
              transform: 'scaleX(0)', transformOrigin: 'left',
              transition: 'transform 0.4s ease',
            }} />
            <div style={{
              fontFamily: "'Inconsolata', monospace", fontSize: '0.62rem',
              color: COLORS.candle, opacity: 0.5,
              letterSpacing: '0.1em', marginBottom: '0.8rem',
            }}>
              {poem.num}
            </div>
            <div style={{
              fontFamily: "'IM Fell English', serif", fontSize: '1.3rem',
              fontStyle: 'italic', color: COLORS.paper, marginBottom: '0.8rem',
            }}>
              {poem.title}
            </div>
            <div style={{ fontSize: '0.88rem', lineHeight: 1.9, color: COLORS.dim, fontStyle: 'italic',wordBreak: 'break-word', overflowWrap: 'anywhere',
            // overflow: 'hidden',          // ← add this
            // display: '-webkit-box',      // ← add this
            // WebkitLineClamp: 3,          // ← how many lines to show
            // WebkitBoxOrient: 'vertical', 
            }}>
              {poem.excerpt}
            </div>
            <div style={{
              marginTop: '1.2rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontFamily: "'Inconsolata', monospace", fontSize: '0.62rem',
              letterSpacing: '0.12em', color: 'rgba(122,110,95,0.5)', textTransform: 'uppercase',
            }}>
              <span>{poem.date}</span>
              <LikeButton
                poemId={poem.id}
                count={likes[poem.id] ?? 0}
                isLiked={liked.has(poem.id)}
                onToggle={toggle}
              />
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <PoemModal
          poem={selected}
          likeCount={likes[selected.id] ?? 0}
          isLiked={liked.has(selected.id)}
          onToggleLike={toggle}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  )
}
