import React from 'react'
import avatar from '../assets/avatar.png'

export default function BebiAvatar({ size = 60, mood = 'happy' }) {
  let borderColor = '#ff77c7'
  let shadow = '0 10px 25px rgba(236,72,153,0.55)'
  let transform = 'translateY(0)'
  let filter = 'none'

  if (mood === 'strong') {
    borderColor = '#f97316'
    shadow = '0 12px 28px rgba(249,115,22,0.7)'
    transform = 'translateY(-2px)'
  } else if (mood === 'rage') {
    borderColor = '#ef4444'
    shadow = '0 0 25px rgba(239,68,68,0.9)'
    transform = 'translateY(-3px) scale(1.04)'
    filter = 'saturate(1.2) contrast(1.1)'
  } else if (mood === 'blush') {
    borderColor = '#e879f9'
    shadow = '0 10px 30px rgba(232,121,249,0.8)'
  } else if (mood === 'focused') {
    borderColor = '#38bdf8'
    shadow = '0 10px 26px rgba(56,189,248,0.7)'
  }

  return (
    <img
      src={avatar}
      alt="Bebi Avatar"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        border: `2px solid ${borderColor}`,
        boxShadow: shadow,
        transform,
        filter,
        transition: 'all 0.2s ease-out',
      }}
    />
  )
}