import React, { useState } from 'react'
import { MonoLabel } from './Primitives'

// ── Article metadata ──────────────────────────────────────────────────────────
const AUTHOR = {
  name: 'Michael M',
  alias: 'mich',
  bio: 'Boston transit rider, software developer, and MBTA data nerd. Commuting the Newburyport line since 2019.',
}

const ARTICLES = [
  {
    id:       'mbta-commuter-rail-guide',
    slug:     'mbta-commuter-rail-guide',
    title:    'The Complete MBTA Commuter Rail Guide for 2025',
    subtitle: 'Every line, every zone, and how to actually use the system',
    date:     'March 12, 2025',
    readMins: 9,
    tags:     ['Commuter Rail', 'Getting Around', 'Beginner'],
    intro:    "Boston's commuter rail is one of the most underused transit assets in New England. Twelve lines, 145 stations, and service reaching as far as Providence, Needham, and Newburyport. Here is everything you need to know to ride it confidently.",
    content: [
      {
        heading: 'What is the Commuter Rail?',
        body: `The MBTA Commuter Rail is a network of 12 lines operating out of two downtown terminals: North Station and South Station. Lines departing from North Station serve communities north and west of Boston, including Salem, Reading, Lowell, and Fitchburg. Lines from South Station serve communities to the south and southwest, including Providence, Worcester, Needham, and Stoughton.

Unlike the subway, commuter rail trains run on a fixed published schedule rather than continuously. During peak hours on popular routes you might see trains every 30 minutes; on off-peak hours or less-travelled lines, gaps of 60 to 90 minutes are common. This makes planning essential.`,
      },
      {
        heading: 'Zones and Fares',
        body: `Commuter rail fares are distance-based, divided into zones 1A through 10. Zone 1A covers stops inside the immediate Boston area including Back Bay, Ruggles, Forest Hills, and Hyde Park. Zone 1 begins just outside that ring. The further your destination, the higher your fare.

As of 2025, a Zone 1A single ride is $2.40 (the same as a subway fare). A Zone 10 single ride to Providence runs around $12.75. Monthly passes offer significant savings for regular commuters. You can pay on the train with cash or contactless card, or buy tickets in advance through the MBTA app.

One important note: if you board without a ticket at a staffed station, you may be charged a surcharge by the conductor.`,
      },
      {
        heading: 'North Station Lines',
        body: `Fitchburg Line: Runs from North Station through the western suburbs to Fitchburg, stopping at Waltham, Brandeis, Concord, and Ayer along the way. Heavily used by Waltham-area commuters.

Haverhill Line: Heads north through Reading, Lawrence, and Bradford to Haverhill. Reading is a popular suburban stop with good parking. This line is often the one you want if you live north of Boston and work downtown.

Lowell Line: Serves Woburn, Wilmington, and Lowell. Fast service during peak hours with frequent trains.

Newburyport/Rockport Line: Runs along the North Shore through Salem, Beverly, Gloucester, and either Newburyport or Rockport at the end. Salem is the standout stop, heavily used year-round and especially during Halloween season.

Greenbush, Kingston/Plymouth, Middleborough/Lakeville Lines: South Shore lines departing from South Station, serving coastal communities southeast of Boston.`,
      },
      {
        heading: 'South Station Lines',
        body: `Framingham/Worcester Line: One of the most-used CR lines, running west through Framingham, Natick, and Westborough to Worcester. South Station to Worcester takes around 75 minutes non-stop on express trains.

Providence/Stoughton Line: Runs south to Providence, Rhode Island, making it a genuine intercity rail connection. Amtrak trains also use this corridor, so schedules can look complicated. The MBTA fare applies only to MBTA trains.

Franklin/Foxboro Line: Serves the southwestern suburbs and Foxboro, home of Gillette Stadium. Special event trains run for Patriots and Revolution games.

Needham Line: A short branch running from South Station to Needham Heights, useful for Needham residents who work downtown.`,
      },
      {
        heading: 'Tips for First-Time Riders',
        body: `Buy a CharlieCard and load it with funds. It works on the subway and buses too, and the tap-to-pay experience is faster than fumbling with cash.

Check the real-time departures before you leave. Trains do run late, and knowing 10 minutes in advance can save a wasted trip to the station. DWELL shows live commuter rail departures for every station.

Sit in a car toward the middle of the platform. Train lengths vary, and some shorter trains do not open every door.

The Quiet Car is typically the first car from the locomotive end. It is enforced by honor system, but most riders respect it.

If you miss your train, check whether a subway or express bus covers your route as a backup. Many commuter rail stations are also served by local MBTA buses.`,
      },
    ],
  },

  {
    id:       'mbta-transfers-guide',
    slug:     'mbta-transfers-guide',
    title:    'Mastering MBTA Transfers: Downtown Crossing, North Station and More',
    subtitle: 'How to connect between lines efficiently without getting lost',
    date:     'February 28, 2025',
    readMins: 7,
    tags:     ['Transfers', 'Subway', 'Navigation'],
    intro:    "Knowing where and how to transfer between MBTA lines is the difference between a 15-minute ride and a 40-minute one. Here is a practical breakdown of every major transfer point in the system.",
    content: [
      {
        heading: 'Downtown Crossing',
        body: `Downtown Crossing is the most important transfer hub in the MBTA system. Here you can switch between the Red Line and the Orange Line in a single station without exiting and re-entering.

The station is underground and covers multiple levels. Red Line platforms are the deepest; Orange Line platforms are one level up. Follow the clearly marked signs for whichever line you need. The Silver Line buses also serve the surface directly above the station.

Downtown Crossing is also adjacent to Park Street (roughly a five-minute walk through the underground passages or aboveground). This means you can effectively connect between Red, Orange, and all Green Line branches at this cluster of stations.`,
      },
      {
        heading: 'North Station',
        body: `North Station handles two rail modes simultaneously: the Orange Line and the Green Line (B, C, D, E branches) run underground here, and the Commuter Rail platforms sit above at street level inside TD Garden.

If you are arriving from the commuter rail and need to reach downtown, take the Orange Line two stops to State (connecting to Blue) or three stops to Downtown Crossing (connecting to Red). If you need the Green Line, it shares the same North Station stop on the Orange Line platform.

Walk time between the commuter rail platforms and the subway entrance is about 3 to 4 minutes, so factor that into your connection window.`,
      },
      {
        heading: 'South Station',
        body: `South Station is the southern equivalent of North Station, connecting the Red Line to all commuter rail lines departing south and west. The Red Line platform is underground directly beneath the main train hall.

The Silver Line (SL1) to Logan Airport departs from South Station as well, from a separate lower level. If you are heading to the airport from the south side of the city, this is your route.`,
      },
      {
        heading: 'Back Bay',
        body: `Back Bay is a commuter rail station on the Orange Line, served by all South Station commuter rail lines. It is one stop before South Station on many outbound trains, and one stop after on inbound ones.

For commuters heading to the Prudential or Copley area, alighting at Back Bay and walking or taking the Green Line is often faster than continuing to South Station and backtracking.`,
      },
      {
        heading: 'Government Center and State',
        body: `Government Center connects the Blue Line and the Green Line. State, just one stop away, connects the Blue Line and the Orange Line.

If you need to get from the Blue Line to the Red or Orange Line, State is your fastest option. If you need the Green Line, ride one more stop to Government Center.`,
      },
      {
        heading: 'Park Street',
        body: `Park Street is where the Red Line and all Green Line branches meet. It is the busiest station in the system. The Red Line platforms are deep underground; the Green Line platforms are at the mezzanine level.

During rush hour, the Green Line platforms at Park Street can get extremely crowded. If you need an outbound Green Line train and you are coming from the Red Line, consider walking one stop along the surface to Boylston, which is usually less crowded.`,
      },
      {
        heading: 'Ruggles',
        body: `Ruggles sits on the Orange Line and is also a commuter rail station served by Providence, Franklin, and Fairmount lines. It sits in the heart of the Fenway/Mission Hill area and is the quickest connection between those neighborhoods and the southern commuter rail network.`,
      },
    ],
  },

  {
    id:       'mbta-to-logan-airport',
    slug:     'mbta-to-logan-airport',
    title:    'Getting to Logan Airport on the MBTA: The Complete 2025 Guide',
    subtitle: 'Silver Line, Blue Line, bus routes, and when to just take a cab',
    date:     'March 5, 2025',
    readMins: 6,
    tags:     ['Airport', 'Silver Line', 'Travel Tips'],
    intro:    "Logan Airport is three miles from downtown Boston, but the MBTA connection is not always obvious. Here is every option available, with honest advice on which is fastest depending on where you are starting from.",
    content: [
      {
        heading: 'The Silver Line SL1: From South Station',
        body: `The Silver Line SL1 is the most direct MBTA route to Logan. It runs from South Station underground, emerging at the South Boston waterfront, and continues directly into the airport tunnel to terminals A, B, and C.

Travel time from South Station to the first airport terminal is around 12 to 18 minutes depending on traffic in the tunnel section. The bus is free outbound from South Station (you pay the standard $2.40 fare inbound, back to downtown).

The SL1 runs frequently during airport peak hours. Check the departures board at South Station or use DWELL to see real-time departures before you head down.`,
      },
      {
        heading: 'The Blue Line: From Downtown',
        body: `The Blue Line to Airport station is the other main option. From Government Center or State, ride the Blue Line east to the Airport stop. From there, free shuttle buses (the Logan Express Silver Line buses, numbered 22, 33, 44, 55) circulate every few minutes to all terminals.

The walk from the Blue Line platform to the shuttle stop is about two minutes. The shuttle from Airport station to Terminal C or E can take 8 to 15 minutes depending on how many terminals it stops at first.

This route is best if you are coming from the Blue Line corridor (East Boston, Revere) or from the Orange Line via a transfer at State.`,
      },
      {
        heading: 'Commuter Rail Riders',
        body: `If you are arriving at North Station on the commuter rail, your fastest path to Logan is:

Take the Orange Line from North Station to State (2 stops). Transfer to the Blue Line at State. Ride the Blue Line to Airport station. Take the free terminal shuttle.

Total time from North Station to the terminal shuttle stop is typically 20 to 30 minutes, not accounting for wait times. Budget 45 minutes from boarding your Orange Line train to reaching your terminal.`,
      },
      {
        heading: 'When to Skip the T',
        body: `The MBTA is not always the right choice for the airport, even if you are committed to public transit. Specific situations where a rideshare or taxi is better:

If you have more than one large bag. The Silver Line buses and Blue Line trains have limited luggage space and no assistance. Rush hour is unpleasant with a 28-inch rolling suitcase.

If your flight departs before 5:30am. The first SL1 from South Station runs around 5:25am and the Blue Line starts around 5:15am. Earlier departures require a cab or rideshare from wherever you are staying.

If you are coming from the western suburbs. A commuter rail ride to South Station, then the SL1, adds time that a direct cab from Route 128 does not.`,
      },
    ],
  },

  {
    id:       'boston-subway-line-guide',
    slug:     'boston-subway-line-guide',
    title:    'Boston Subway Lines Explained: Red, Orange, Green, Blue',
    subtitle: 'A straightforward guide to every line, its stops, and who uses it',
    date:     'January 18, 2025',
    readMins: 8,
    tags:     ['Subway', 'Beginner', 'Boston'],
    intro:    "Boston's subway, locally called the T, has four main lines and the Silver Line bus rapid transit network. Each runs a distinct corridor through the city. Here is what you need to know about each one.",
    content: [
      {
        heading: 'Red Line',
        body: `The Red Line is the backbone of the system. It runs from Alewife in Cambridge through Harvard, Central, and Kendall/MIT, crosses into Boston at Charles/MGH, passes through Park Street and Downtown Crossing, and then splits into two branches south of JFK/UMass.

The Braintree branch continues south through Quincy Center and Quincy Adams to Braintree. The Ashmont branch serves Savin Hill, Fields Corner, Shawmut, and Ashmont. Both branches are served from the same tracks until JFK/UMass.

The Red Line is the most used subway line in the system. During rush hour it can feel impossibly crowded between Harvard and Downtown Crossing. If you have the flexibility, the first and last cars are typically less packed than the middle ones.`,
      },
      {
        heading: 'Orange Line',
        body: `The Orange Line runs north-south through the center of Boston, from Oak Grove in Malden to Forest Hills in Jamaica Plain. Key stops include North Station, Haymarket, Downtown Crossing, Back Bay, and Jackson Square.

The Orange Line serves a dense corridor of neighborhoods and is the main connection between the North Shore commuter rail (via North Station) and the South Shore commuter rail (via Back Bay and South Station, one stop off the line).

The Orange Line fleet was fully replaced with new cars between 2019 and 2023, making it the newest rolling stock in the system. Ride quality is noticeably smoother than the Red or Green lines.`,
      },
      {
        heading: 'Green Line',
        body: `The Green Line is the most complex part of the T. It runs underground through downtown, emerges at Kenmore, and then splits into four branches: B (Boston College), C (Cleveland Circle), D (Riverside), and E (Heath Street, with a newer extension to Medford/Tufts).

The surface sections of the Green Line are street-running, meaning the trains share space with cars and buses and can get delayed by traffic. This is why Green Line times are harder to predict than other lines.

The B branch is the longest and takes the most time. The D branch is the fastest because it runs on its own right-of-way through Brookline and Newton. If you are heading to Fenway Park, any branch gets you to Kenmore; the D branch is often the fastest.`,
      },
      {
        heading: 'Blue Line',
        body: `The Blue Line runs from Bowdoin in downtown Boston under the harbor to East Boston and then north along the coast to Wonderland in Revere. Key stops are Government Center, State, Airport, and Revere Beach.

The Blue Line is the best public transit option for East Boston and Revere. It is also the only direct transit link to Logan Airport via free terminal shuttles from the Airport station.

The Blue Line uses the oldest tunnel infrastructure in the system, dating to 1904. It also has the shortest trains, typically only two or three cars during off-peak hours.`,
      },
      {
        heading: 'Silver Line',
        body: `The Silver Line is a bus rapid transit network rather than a rail line, though it uses the same CharlieCard fare system. There are three sub-routes: SL1 (South Station to Logan Airport), SL2 (South Station to South Boston Waterfront), and SL3 (South Station to Chelsea via the Seaport).

In the downtown core, the Silver Line buses run underground in a dedicated tunnel. Once they emerge in South Boston or head toward Chelsea, they run in surface traffic like any other bus, which limits reliability.

The SL1 to Logan is free in the outbound direction (South Station to Airport). Inbound (Airport to South Station) costs the standard $2.40 subway fare.`,
      },
      {
        heading: 'Fares and CharlieCard',
        body: `All subway lines charge a flat $2.40 fare per ride as of 2025. The cheapest way to pay is with a CharlieCard, a reusable plastic card that you load with funds at any station kiosk. Cash and contactless credit/debit card payment are also accepted at turnstiles, but cost slightly more per ride.

Transfers between subway lines within the same fare gate are free. If you exit the system and re-enter (for example, to make a long walking transfer), you pay a new fare.

Monthly and weekly passes are available and save money for regular riders. A monthly subway pass runs around $90 and is worth it if you ride more than 38 times per month.`,
      },
    ],
  },
]

// ── Shared components ─────────────────────────────────────────────────────────

function TagBadge({ label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 9px', borderRadius: 999,
      fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
      background: 'var(--bg-4)', border: '1px solid var(--border-mid)',
      color: 'var(--text-muted)',
    }}>{label}</span>
  )
}

function AuthorLine({ date, mins }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: 'var(--bg-4)', border: '2px solid var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color: 'var(--accent)',
        flexShrink: 0,
      }}>M</div>
      <div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
          {AUTHOR.name}
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.08em', marginTop: 2 }}>
          {date} · {mins} min read
        </div>
      </div>
    </div>
  )
}

// ── Article view ──────────────────────────────────────────────────────────────

function ArticlePage({ article, onBack }) {
  return (
    <article className="anim-fade-in">
      <button onClick={onBack} style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28,
        fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em',
        color: 'var(--text-dim)', background: 'transparent', border: 'none',
        cursor: 'pointer', padding: 0, transition: 'color 0.14s',
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
      >
        <span>←</span> All Guides
      </button>

      {/* Tags */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {article.tags.map(t => <TagBadge key={t} label={t} />)}
      </div>

      {/* Title */}
      <h1 style={{
        fontFamily: 'var(--display)', fontWeight: 800,
        fontSize: 'clamp(22px, 5vw, 36px)', letterSpacing: '0.02em',
        color: 'var(--text)', lineHeight: 1.15, marginBottom: 10,
      }}>{article.title}</h1>

      <p style={{
        fontFamily: 'var(--sans)', fontSize: 16, color: 'var(--text-muted)',
        lineHeight: 1.6, marginBottom: 20,
      }}>{article.subtitle}</p>

      <div style={{ height: 2, background: 'linear-gradient(90deg, var(--accent), transparent)', marginBottom: 24, borderRadius: 1 }} />

      <AuthorLine date={article.date} mins={article.readMins} />

      {/* Intro */}
      <p style={{
        fontFamily: 'var(--sans)', fontSize: 16, color: 'var(--text)',
        lineHeight: 1.85, marginBottom: 32,
        paddingLeft: 16, borderLeft: '3px solid var(--accent)',
      }}>{article.intro}</p>

      {/* Sections */}
      {article.content.map((section, i) => (
        <section key={i} style={{ marginBottom: 36 }}>
          <h2 style={{
            fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700,
            letterSpacing: '0.06em', color: 'var(--accent)',
            marginBottom: 14, textTransform: 'uppercase',
          }}>{section.heading}</h2>
          {section.body.split('\n\n').map((para, j) => (
            <p key={j} style={{
              fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--text-muted)',
              lineHeight: 1.85, marginBottom: 16,
            }}>{para}</p>
          ))}
        </section>
      ))}

      {/* Author bio */}
      <div style={{
        marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)',
        display: 'flex', gap: 14, alignItems: 'flex-start',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
          background: 'var(--bg-4)', border: '2px solid var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--display)', fontSize: 18, fontWeight: 800, color: 'var(--accent)',
        }}>M</div>
        <div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
            {AUTHOR.name}
          </div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65 }}>
            {AUTHOR.bio}
          </div>
        </div>
      </div>
    </article>
  )
}

// ── Guides index ──────────────────────────────────────────────────────────────

function GuidesIndex({ onSelect }) {
  return (
    <div className="anim-fade-in">
      <div style={{ paddingLeft: 18, marginBottom: 28, borderLeft: '3px solid var(--accent)', boxShadow: '-4px 0 16px rgba(245,206,62,0.2)' }}>
        <MonoLabel style={{ display: 'block', marginBottom: 8 }}>DWELL</MonoLabel>
        <h1 style={{
          fontFamily: 'var(--display)', fontWeight: 800,
          fontSize: 'clamp(26px, 6vw, 42px)', letterSpacing: '0.04em',
          color: 'var(--text)', lineHeight: 1.1, margin: 0,
        }}>Transit Guides</h1>
        <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.6 }}>
          Practical guides to getting around Greater Boston, written by real commuters.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {ARTICLES.map((a, i) => (
          <button key={a.id} onClick={() => onSelect(a)}
            className="anim-fade-up"
            style={{
              animationDelay: `${i * 0.07}s`,
              display: 'flex', flexDirection: 'column', gap: 10,
              padding: '20px 22px', textAlign: 'left',
              background: 'var(--bg-3)', border: '1px solid var(--border)',
              borderLeft: '3px solid var(--accent)',
              borderRadius: 'var(--radius-sm)',
              clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.background = 'rgba(245,206,62,0.05)'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(245,206,62,0.1), -4px 0 12px rgba(245,206,62,0.2)'
              e.currentTarget.style.transform = 'translateX(3px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.background = 'var(--bg-3)'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.transform = 'none'
            }}
          >
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {a.tags.map(t => <TagBadge key={t} label={t} />)}
            </div>
            <h2 style={{
              fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700,
              letterSpacing: '0.02em', color: 'var(--text)', lineHeight: 1.3,
            }}>{a.title}</h2>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
              {a.subtitle}
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 4 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
                {AUTHOR.name} · {a.date}
              </span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)' }}>{a.readMins} min read</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.1em' }}>READ →</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── GuidesPage — exported ─────────────────────────────────────────────────────
export default function GuidesPage() {
  const [selected, setSelected] = useState(null)

  // Sync URL with selected article
  React.useEffect(() => {
    if (selected) {
      window.history.pushState({}, '', `/guides/${selected.slug}`)
      document.title = `${selected.title} | DWELL`
    } else {
      window.history.pushState({}, '', '/guides')
      document.title = 'Transit Guides | DWELL'
    }
  }, [selected])

  if (selected) return <ArticlePage article={selected} onBack={() => setSelected(null)} />
  return <GuidesIndex onSelect={setSelected} />
}

// Export article list for sitemap generation
export { ARTICLES }
