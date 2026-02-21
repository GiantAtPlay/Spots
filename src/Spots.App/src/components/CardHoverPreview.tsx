import { useState } from 'react'
import { createPortal } from 'react-dom'

interface CardHoverPreviewProps {
  imageUri?: string;
  cardName: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function CardHoverPreview({ imageUri, cardName, children, className, onClick }: CardHoverPreviewProps) {
  const [show, setShow] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent) => {
    setPosition({ x: e.clientX + 20, y: e.clientY - 170 })
  }

  const preview = show && imageUri
    ? createPortal(
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: position.x, top: Math.max(10, position.y) }}
        >
          <img
            src={imageUri}
            alt={cardName}
            className="w-[244px] h-[340px] object-cover rounded-xl shadow-2xl"
          />
        </div>,
        document.body
      )
    : null

  return (
    <tr
      className={className}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onMouseMove={handleMouseMove}
      onClick={onClick}
    >
      {children}
      {preview}
    </tr>
  )
}
