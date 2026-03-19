import React from 'react'
import { getLineColor } from '../utils/mbta'
import { MonoLabel, Pill } from './Primitives'

function FavCard({ fav, onOpen, onRemove, index }) {
  const { mode, route, stop } = fav
  const lc = getLineColor(route?.id)

  return (
    <div
      className="anim-fade-up"
      style={{
        animationDelay: `${index * 0.04}s`,
        background: 'var(--bg-3)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${lc.accent}`,
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        transition: 'border-color var(--transition)',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = lc.accent}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Top color strip */}
      <div style={{ height: 2, background: lc.accent, opacity: 0.6 }} />

      <div style={{ padding: '14px 16px' }}>
        {/* Route badge + mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Pill color={lc.accent}>
            {route?.attributes?.short_name || route?.id}
          </Pill>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)',
            letterSpacing: '0.1em',
          }}>
            {mode?.shortLabel || mode?.id?.toUpperCase()}
          </span>
        </div>

        {/* Stop name */}
        <div style={{
          fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15,
          color: 'var(--text)', letterSpacing: '-0.01em',
          marginBottom: 4, lineHeight: 1.2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {stop?.attributes?.name}
        </div>

        {stop?.attributes?.municipality && (
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)',
            letterSpacing: '0.06em', marginBottom: 12,
          }}>
            {stop.attributes.municipality}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onOpen(fav)}
            style={{
              flex: 1, padding: '8px 0',
              background: `${lc.accent}18`, border: `1px solid ${lc.accent}44`,
              borderRadius: 'var(--radius-sm)',
              color: lc.accent, fontFamily: 'var(--mono)',
              fontSize: 11, letterSpacing: '0.1em', cursor: 'pointer',
              transition: 'all var(--transition)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${lc.accent}30` }}
            onMouseLeave={e => { e.currentTarget.style.background = `${lc.accent}18` }}
          >
            VIEW →
          </button>
          <button
            onClick={() => onRemove(stop.id, route.id)}
            title="Remove favorite"
            style={{
              width: 36, padding: '8px 0',
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-dim)', fontFamily: 'var(--mono)',
              fontSize: 13, cursor: 'pointer',
              transition: 'all var(--transition)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--red)'
              e.currentTarget.style.color = 'var(--red)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.color = 'var(--text-dim)'
            }}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FavoritesPanel({ favorites, onOpen, onRemove }) {
  if (!favorites.length) return null

  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
      }}>
        <MonoLabel>Saved stops</MonoLabel>
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 10,
          color: 'var(--accent)', letterSpacing: '0.08em',
        }}>
          ★ {favorites.length}
        </span>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 10,
      }}>
        {favorites.map((fav, i) => (
          <FavCard
            key={`${fav.stop?.id}-${fav.route?.id}`}
            fav={fav} index={i}
            onOpen={onOpen} onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  )
}
