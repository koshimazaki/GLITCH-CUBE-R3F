import { useRef, useEffect, useState } from 'react'
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei'
import { LogoCubeWithStore } from './components/three/LogoCube'
import useLogoCubeStore from './store/logoCubeStore'

// Colors palette 
// https://coolors.co/fc0398-e25259-e66255-ea7250-f19146-ffcf33-42d5ca-03d7fc-0f4757-15171a

// Make OrbitControls available globally for access from LogoControls
window.orbitControlsRef = null
window.setAutoRotate = null

export default function Experience() {
  const cameraRef = useRef()
  const orbitControlsRef = useRef()
  const storeInitializedRef = useRef(false)
  const [autoRotate, setAutoRotate] = useState(false)
  
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
    
    // We only want to initialize with hollow cube pattern if there is no existing pattern
    // This way, we can preserve patterns created in designer mode
    if (store.visibleCubes.size === 0) {
      // Initialize with hollow cube pattern by default
      store.initializeHollowCube()
    }
    
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
        position={[5, 5, 5]} 
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
      <LogoCubeWithStore position={[0, 0, 0]} />
      
      {/* Shadow under the cube */}
      <ContactShadows 
        opacity={0.5}
        scale={10}
        blur={1}
        far={10}
        resolution={256}
        color="#000000"
        position={[0, -2.5, 0]}
      />
    </>
  )
}
