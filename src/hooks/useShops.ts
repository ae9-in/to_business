import { useContext } from 'react'
import { ShopsContext } from '../providers/ShopsProvider'

export function useShops() {
  const context = useContext(ShopsContext)
  if (!context) throw new Error('useShops must be used inside ShopsProvider')
  return context
}
