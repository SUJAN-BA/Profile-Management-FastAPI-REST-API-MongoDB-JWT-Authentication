import { motion } from 'framer-motion'
import { X } from 'lucide-react'

export default function Modal({ open, title, onClose, children }) {
  if (!open) return null
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <motion.section className="modal" role="dialog" aria-modal="true" initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}>
        <header><h2>{title}</h2><button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={18} /></button></header>
        {children}
      </motion.section>
    </div>
  )
}
