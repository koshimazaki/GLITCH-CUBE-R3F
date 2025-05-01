import { useRef, useEffect } from 'react'
import useLogoCubeStore from './store/logoCubeStore'

/**
 * KeyboardControl - Centralized keyboard controller component
 * Handles keyboard input for navigation and interaction with the GNS Logo cube
 * 
 * Supports:
 * - WASD: Movement along X/Z axes
 * - QE: Movement along Y axis
 * - Arrow keys: Alternative movement
 * - Space: Toggle cube visibility in designer mode
 * - 1-6: Toggle accent color on specific sides when a cube is selected
 */
export default function KeyboardControl({ 
  gridSize = 5,
  toggleCube = null,
  enableSpaceToggle = false,
  setCurrentPosition = null,
  setHovered = null,
  currentPosition = null
}) {
  // Reference to store movement speed to avoid recreating effects
  const moveSpeedRef = useRef(0.1)
  
  // Get the store for accessing cube state
  const store = useLogoCubeStore.getState()
  
  // Update movement speed when it changes in the store
  useEffect(() => {
    // Set initial value from store
    moveSpeedRef.current = useLogoCubeStore.getState().moveSpeed || 0.1
    
    // Update from the store when it changes
    const unsubscribe = useLogoCubeStore.subscribe(
      state => {
        // Use moveSpeed from the store directly
        if (state.moveSpeed !== undefined) {
          moveSpeedRef.current = state.moveSpeed
        }
      }
    )
    
    return unsubscribe
  }, [])
  
  // Movement controls (WASD/QE and arrow keys)
  useEffect(() => {
    // Keys being pressed
    const keysPressed = new Set()
    
    // Handle key down event
    const handleKeyDown = (e) => {
      keysPressed.add(e.key.toLowerCase())
      
      // Move continuously while keys are pressed
      if (keysPressed.size > 0) {
        requestAnimationFrame(moveWithKeys)
      }
    }
    
    // Handle key up event
    const handleKeyUp = (e) => {
      keysPressed.delete(e.key.toLowerCase())
    }
    
    // Move cube based on keys pressed
    const moveWithKeys = () => {
      // Get current enableKeyboardControls value and current moveSpeed
      const { enableKeyboardControls, moveSpeed } = useLogoCubeStore.getState()
      if (!enableKeyboardControls) return
      
      // Use the store's moveSpeed directly, or the local ref as fallback
      const speed = moveSpeed !== undefined ? moveSpeed : moveSpeedRef.current
      
      // Move based on which keys are pressed
      // Support both WASD and arrow keys
      if (keysPressed.has('w') || keysPressed.has('arrowup')) {
        store.moveZ(-speed)
      }
      if (keysPressed.has('s') || keysPressed.has('arrowdown')) {
        store.moveZ(speed)
      }
      if (keysPressed.has('a') || keysPressed.has('arrowleft')) {
        store.moveX(-speed)
      }
      if (keysPressed.has('d') || keysPressed.has('arrowright')) {
        store.moveX(speed)
      }
      if (keysPressed.has('q')) {
        store.moveY(speed)
      }
      if (keysPressed.has('e')) {
        store.moveY(-speed)
      }
      
      // Continue moving if keys are still pressed
      if (keysPressed.size > 0) {
        requestAnimationFrame(moveWithKeys)
      }
    }
    
    // Add event listeners
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      keysPressed.clear()
    }
  }, [store])

  // Handle designer mode keyboard navigation and cube toggling
  useEffect(() => {
    // Only enable if we're in designer mode (all required props provided)
    if (!enableSpaceToggle || !setCurrentPosition || !setHovered || !currentPosition || !toggleCube) {
      return
    }
    
    const validFaces = ['front', 'back', 'left', 'right', 'top', 'bottom']
    
    const handleKeyDown = (e) => {
      // Clone current position
      const newPos = [...currentPosition]
      const setCubeSideColor = useLogoCubeStore.getState().setCubeSideColor
      
      // Handle face selection with numbers 1-6
      const numberKey = parseInt(e.key)
      if (!isNaN(numberKey) && numberKey >= 1 && numberKey <= 6) {
        // Apply accent color to the selected face
        const face = validFaces[numberKey - 1]
        setCubeSideColor(newPos[0], newPos[1], newPos[2], face, 'b')
        return
      }
      
      switch (e.key.toLowerCase()) {
        // X-axis movement (left-right)
        case 'd': // right
        case 'arrowright':
          newPos[0] = Math.min(newPos[0] + 1, gridSize - 1) // Move right (increase X) when pressing right
          break
        case 'a': // left
        case 'arrowleft':
          newPos[0] = Math.max(newPos[0] - 1, 0) // Move left (decrease X) when pressing left
          break
          
        // Y-axis movement (up-down)
        case 'q': // up
        case 'arrowup':
          newPos[1] = Math.min(newPos[1] + 1, gridSize - 1)
          break
        case 'e': // down
        case 'arrowdown':
          newPos[1] = Math.max(newPos[1] - 1, 0)
          break
          
        // Z-axis movement (forward-backward)
        case 's': // forward
          newPos[2] = Math.min(newPos[2] + 1, gridSize - 1)
          break
        case 'w': // backward
          newPos[2] = Math.max(newPos[2] - 1, 0)
          break
          
        // Toggle cube with spacebar
        case ' ': // space
          // Use direct coordinates without flipping the X axis
          toggleCube(newPos[0], newPos[1], newPos[2])
          break
          
        default:
          return; // Exit for keys we don't handle
      }
      
      // Update position
      setCurrentPosition(newPos)
      // Update hover state
      setHovered(newPos)
      
      // Prevent default behavior (like scrolling)
      e.preventDefault()
    }
    
    // Add the event listener
    window.addEventListener('keydown', handleKeyDown)
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentPosition, gridSize, toggleCube, setCurrentPosition, setHovered, enableSpaceToggle])
  
  // This component doesn't render anything
  return null
}
    