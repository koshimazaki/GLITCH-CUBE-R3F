import { useRef, useEffect, useState, memo } from 'react'
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Grid, GizmoHelper, GizmoViewport, AccumulativeShadows, RandomizedLight } from '@react-three/drei'
import { LogoCubeWithStore } from './components/three/LogoCube'
import useLogoCubeStore from './store/logoCubeStore'
import { useControls, button } from 'leva'

// Colors palette 
// https://coolors.co/fc0398-e25259-e66255-ea7250-f19146-ffcf33-42d5ca-03d7fc-0f4757-15171a

// Make OrbitControls available globally for access from LogoControls
window.orbitControlsRef = null
window.setAutoRotate = null

// Shadows component using AccumulativeShadows for better quality
const Shadows = memo(({ shadowColor }) => (
  <AccumulativeShadows 
    temporal 
    frames={100} 
    color={shadowColor} 
    colorBlend={0.5} 
    alphaTest={0.9} 
    scale={20}
    position={[0, -2.5, 0]}
  >
    <RandomizedLight amount={8} radius={4} position={[5, 5, -10]} />
  </AccumulativeShadows>
))

export default function Experience() {
  const cameraRef = useRef()
  const orbitControlsRef = useRef()
  const storeInitializedRef = useRef(false)
  const [autoRotate, setAutoRotate] = useState(false)
  
  // Grid controls using Leva
  const { gridSize, shadowColor, ...gridConfig } = useControls('Scene Settings', {
    gridSize: [10, 10],
    cellSize: { value: 1, min: 0, max: 10, step: 0.1 },
    cellThickness: { value: 1, min: 0, max: 5, step: 0.1 },
    cellColor: '#6f6f6f',
    sectionSize: { value: 5, min: 0, max: 10, step: 0.1 },
    sectionThickness: { value: 1.5, min: 0, max: 5, step: 0.1 },
    sectionColor: '#0370fc',
    fadeDistance: { value: 70, min: 0, max: 100, step: 1 },
    fadeStrength: { value: 1, min: 0, max: 1, step: 0.1 },
    followCamera: true,
    infiniteGrid: true,
    shadowColor: '#8b3568',
    useBetterShadows: true,
  })
  
  // Movement speed and control settings
  useControls('WASD Controls', {
    moveSpeed: {
      value: 0.1, 
      min: 0.01, 
      max: 1, 
      step: 0.01,
      onChange: (value) => {
        // Store moveSpeed in a ref to avoid recreating the effect
        moveSpeedRef.current = value
      }
    },
    enableKeyboardControls: {
      value: true,
      onChange: (value) => {
        useLogoCubeStore.getState().setKeyboardControls(value)
        
        // Show/hide instructions based on controls being enabled
        if (value) {
          showInstructions()
        } else {
          hideInstructions()
        }
      }
    },
    resetPosition: button(() => useLogoCubeStore.getState().resetPosition()),
  })
  
  // Ref to store movement speed for the keyboard movement effect
  const moveSpeedRef = useRef(0.1)
  
  // Create instructions element
  useEffect(() => {
    // Create instruction element if it doesn't exist
    if (!document.getElementById('wasd-instructions')) {
      const instructions = document.createElement('div')
      instructions.id = 'wasd-instructions'
      instructions.style.position = 'absolute'
      instructions.style.top = '100px'
      instructions.style.left = '50%'
      instructions.style.transform = 'translateX(-50%)'
      instructions.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
      instructions.style.color = 'white'
      instructions.style.padding = '8px 16px'
      instructions.style.borderRadius = '8px'
      instructions.style.fontFamily = 'sans-serif'
      instructions.style.fontSize = '14px'
      instructions.style.zIndex = '1000'
      instructions.style.pointerEvents = 'none'
      instructions.style.opacity = '0'
      instructions.style.transition = 'opacity 0.3s ease'
      instructions.textContent = 'Move with WASD — Height with QE'
      
      document.body.appendChild(instructions)
      
      // Show instructions initially if controls are enabled
      if (useLogoCubeStore.getState().enableKeyboardControls) {
        showInstructions()
      }
    }
    
    return () => {
      // Clean up on unmount
      const instructions = document.getElementById('wasd-instructions')
      if (instructions) {
        document.body.removeChild(instructions)
      }
    }
  }, [])
  
  // Function to show instructions
  const showInstructions = () => {
    const instructions = document.getElementById('wasd-instructions')
    if (instructions) {
      instructions.style.opacity = '1'
      
      // Hide after 5 seconds
      setTimeout(() => {
        if (instructions) {
          instructions.style.opacity = '0'
        }
      }, 5000)
    }
  }
  
  // Function to hide instructions
  const hideInstructions = () => {
    const instructions = document.getElementById('wasd-instructions')
    if (instructions) {
      instructions.style.opacity = '0'
    }
  }
  
  // Keyboard movement controls (WASD)
  useEffect(() => {
    const store = useLogoCubeStore.getState()
    
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
      // Get current enableKeyboardControls value
      const currentlyEnabled = useLogoCubeStore.getState().enableKeyboardControls
      if (!currentlyEnabled) return
      
      // Move based on which keys are pressed
      if (keysPressed.has('w')) {
        store.moveZ(-moveSpeedRef.current)
      }
      if (keysPressed.has('s')) {
        store.moveZ(moveSpeedRef.current)
      }
      if (keysPressed.has('a')) {
        store.moveX(-moveSpeedRef.current)
      }
      if (keysPressed.has('d')) {
        store.moveX(moveSpeedRef.current)
      }
      if (keysPressed.has('q')) {
        store.moveY(moveSpeedRef.current)
      }
      if (keysPressed.has('e')) {
        store.moveY(-moveSpeedRef.current)
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
  }, [])
  
  // Make the controls ref available to other components
  useEffect(() => {
    window.orbitControlsRef = orbitControlsRef
    window.setAutoRotate = setAutoRotate
    
    return () => {
      window.orbitControlsRef = null
      window.setAutoRotate = null
    }
  }, [setAutoRotate])
  
  // Initialize the store on component mount
  useEffect(() => {
    // Only initialize once to prevent infinite loops
    if (storeInitializedRef.current) return
    
    const store = useLogoCubeStore.getState()
    
    // Initialize with GNS logo pattern by default
    store.initializeGNSLogo();
    
    // Set default animation values if coming from designer mode
    if (store.animation.type === 'none') {
      store.setAnimationType('wave')
      store.setAnimationSpeed(1.0)
    }
    
    storeInitializedRef.current = true
  }, [])
  
  // Listen for mode changes
  useEffect(() => {
    const handleModeChange = (event) => {
      if (!event.detail.isDesignerMode) {
        // When switching back to animation mode, ensure we have animation
        const store = useLogoCubeStore.getState()
        
        // Set animation type if it was 'none' in designer mode
        if (store.animation.type === 'none') {
          store.setAnimationType('wave')
        }
      }
    }
    
    // Add the event listener
    window.addEventListener('modechange', handleModeChange)
    
    // Clean up
    return () => {
      window.removeEventListener('modechange', handleModeChange)
    }
  }, [])
  
  return (
    <>
      {/* dark grey background */}
      <color attach="background" args={["#15171A"]} />
      
      {/* Camera with controls */}
      <PerspectiveCamera 
        ref={cameraRef}
        makeDefault 
        position={[gridSize[0] * 0.5, gridSize[1] * 0.5, gridSize[0] * 0.5]} 
        fov={45}
      />
      <OrbitControls 
        ref={orbitControlsRef}
        makeDefault
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.8}
        enablePan={true}
        panSpeed={1.0}
        minDistance={3} 
        maxDistance={30}
        maxPolarAngle={Math.PI * 0.9} // Prevent going below the grid
        screenSpacePanning={true}
        enableZoom={true}
        zoomSpeed={1.2}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
      />
      
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-10, -10, -5]} intensity={0.2} />
      
      {/* Environment */}
      <Environment preset="city" />
      
      {/* Logo Cube */}
      <LogoCubeWithStore position={[0, 0, 0]} gridSize={gridSize} fadeDistance={gridConfig.fadeDistance} />
      
      {/* Grid */}
      <Grid position={[0, -2.51, 0]} 
      fadeDistance={70}
      args={gridSize} {...gridConfig} />
      
      {/* Shadows - conditionally show based on the control */}
      {gridConfig.useBetterShadows ? (
        <Shadows shadowColor={shadowColor} />
      ) : (
        <ContactShadows 
          opacity={0.5}
          scale={10}
          blur={1}
          far={10}
          resolution={256}
          color="#000000"
          position={[0, -2.5, 0]}
        />
      )}
      
      {/* Gizmo Helper */}
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport axisColors={['#fc0398', '#42d5ca', '#ffcf33']} labelColor="white" />
      </GizmoHelper>
    </>
  )
}
