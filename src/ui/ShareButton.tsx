import { useEffect, useRef, useState } from 'react'
import { useConfigStore } from '../store/configStore'
import { shareUrl } from '../urlConfig'

/** Copies a link encoding the current design into the clipboard. */
export function ShareButton() {
  const config = useConfigStore((s) => s.config)
  const [copied, setCopied] = useState(false)
  const timer = useRef<number>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const share = async () => {
    const url = shareUrl(config)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard API unavailable (e.g. non-secure context) — show the link.
      window.prompt('Copy this link:', url)
    }
  }

  return (
    <button className="primary" onClick={share}>
      {copied ? 'Link copied!' : 'Share'}
    </button>
  )
}
