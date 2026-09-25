import React from 'react'
import { timeAgo } from '../helpers'

interface Props {
  isOffline: boolean
  fromCache: boolean
  cachedAt?: string
}

export const OfflineBanner: React.FC<Props> = ({ isOffline, fromCache, cachedAt }) => {
  if (!isOffline && !fromCache) return null
  return (
    <div className={`flex-shrink-0 text-xs text-center py-1.5 px-4 font-mono tracking-wide border-b ${
      isOffline
        ? 'bg-orange-900/80 text-orange-300 border-orange-700'
        : 'bg-yellow-900/50 text-yellow-400 border-yellow-800'
    }`}>
      {isOffline
        ? '📶 OFFLINE — Showing last synchronized data'
        : `⚠ Cached data${cachedAt ? ` · Last sync: ${timeAgo(cachedAt)}` : ''}. Reconnect to refresh.`}
    </div>
  )
}
