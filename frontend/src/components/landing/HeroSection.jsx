"use client"
import { useState, useEffect, useRef } from 'react'
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'

const CHARS = "!@#$%^&*():{};|,.<>/?qwertyuiopasdfghjklzxcvbnm"
// Combined charset for random selection
const GREEK = "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψω"

// Custom Hook for the scramble effect
function useScramble(text, duration = 1000, delay = 0) {
  const [display, setDisplay] = useState(text.split('').map(() => ' '))
  const [complete, setComplete] = useState(false)
  
  useEffect(() => {
    let timeout
    let interval
    
    timeout = setTimeout(() => {
      let iteration = 0
      clearInterval(interval)
      
      interval = setInterval(() => {
        setDisplay(text.split('').map((char, index) => {
          if (index < iteration) {
            return text[index]
          }
          return CHARS[Math.floor(Math.random() * CHARS.length)]
        }))
        
        if (iteration >= text.length) { 
          clearInterval(interval)
          setComplete(true)
        }
        
        iteration += 1 / 3
      }, 30)
    }, delay)

    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [text, duration, delay])

  return { display: display.join(''), complete }
}

export default function HeroSection() {
  const { display, complete } = useScramble("VOTE WITHOUT A TRACE", 2000, 500)
  const canvasRef = useRef(null)
  
  // Mouse tracking for spotlight
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  // Matrix Animation Logic
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    
    let animationFrameId
    const fontSize = 32
    let columns = [] // Array of arrays of cell objects
    
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight 
      const cols = Math.ceil(canvas.width / fontSize)
      const rows = Math.ceil(canvas.height / fontSize)
      
      // Initialize grid
      columns = Array(cols).fill(0).map(() => 
        Array(rows).fill(0).map(() => ({
          char: GREEK[Math.floor(Math.random() * GREEK.length)],
          nextChar: null,
          progress: 0, // 0 to 1
          isFlipping: false
        }))
      )
    }
    
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)"
      ctx.font = `bold ${fontSize}px monospace`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      
      columns.forEach((row, x) => {
        row.forEach((cell, y) => {
          // Trigger flip randomly
          if (!cell.isFlipping && Math.random() < 0.002) {
             cell.isFlipping = true
             cell.progress = 0
             // Pick a different random char
             let next = GREEK[Math.floor(Math.random() * GREEK.length)]
             while (next === cell.char) {
                next = GREEK[Math.floor(Math.random() * GREEK.length)]
             }
             cell.nextChar = next
          }
          
          // Animate
          let scaleX = 1
          if (cell.isFlipping) {
             cell.progress += 0.05 // Flip speed
             if (cell.progress >= 1) {
                cell.isFlipping = false
                cell.char = cell.nextChar
                cell.progress = 0
             } else {
                // Visualize flip: interpolate scale 1 -> 0 -> 1
                // 0 to 0.5: shrink 1 -> 0
                // 0.5 to 1.0: grow 0 -> 1
                if (cell.progress < 0.5) {
                   scaleX = 1 - (cell.progress * 2) 
                } else {
                   scaleX = (cell.progress - 0.5) * 2
                   // visually swap char at the edge
                   cell.char = cell.nextChar
                }
             }
          }
          
          // Draw with transform
          const centerX = x * fontSize + fontSize / 2
          const centerY = y * fontSize + fontSize / 2
          
          if (scaleX < 1) {
             ctx.save()
             ctx.translate(centerX, centerY)
             ctx.scale(scaleX, 1)
             ctx.fillText(cell.char, 0, 0)
             ctx.restore()
          } else {
             ctx.fillText(cell.char, centerX, centerY)
          }
        })
      })
      
      animationFrameId = requestAnimationFrame(draw)
    }
    
    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="relative w-full min-h-screen -mt-32 flex flex-col items-center justify-center overflow-hidden group cursor-crosshair"
    >
      {/* Canvas Background */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none opacity-80"
      />

      {/* Spotlight Overlay */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              600px circle at ${mouseX}px ${mouseY}px,
              rgba(255,255,255,0) 0%,
              rgba(255,255,255,0.8) 50%,
              rgba(255,255,255,1) 100%
            )
          `
        }}
      />
      
      {/* Main Content */}
      <motion.div 
        className="text-center relative z-10 px-4 -mt-12 md:-mt-32"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="inline-block mb-8 px-4 py-2 border border-black/30 text-xs font-mono font-bold uppercase tracking-[0.2em] bg-white">
          Zero Knowledge Protocol
        </div>
        
        <h1 className="text-6xl md:text-9xl font-black font-serif mb-8 tracking-tight leading-none min-h-[1.2em]">
          {display}
        </h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: complete ? 1 : 0, y: complete ? 0 : 20 }}
          transition={{ duration: 0.8 }}
          className="text-xl md:text-2xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed"
        >
          Proving your right to vote without revealing your identity. 
          <br/>
          <span className="text-black font-bold">Mathematical privacy</span> for the decentralized era.
        </motion.p>
      </motion.div>
    </div>
  )
}
