import { useState, useEffect } from 'react'

export function useBebiMood() {
  const [mood, setMood] = useState('happy')

  function bumpMood(event) {
    if (event === 'app_open') {
      setMood('happy')
    } else if (event === 'start_program') {
      setMood('focused')
      setTimeout(() => setMood('happy'), 4000)
    } else if (event === 'heavy_set') {
      setMood('strong')
      setTimeout(() => setMood('happy'), 5000)
    } else if (event === 'pr') {
      setMood('rage')
      setTimeout(() => setMood('happy'), 5000)
    } else if (event === 'achievement') {
      setMood('blush')
      setTimeout(() => setMood('happy'), 4000)
    }
  }

  useEffect(() => {
    bumpMood('app_open')
  }, [])

  return { mood, bumpMood }
}
