import { useRef, useEffect, useState, memo } from 'react'
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Grid, GizmoHelper, GizmoViewport, AccumulativeShadows, RandomizedLight } from '@react-three/drei'
import { LogoCubeWithStore } from './components/three/LogoCube'
import useLogoCubeStore from './store/logoCubeStore'
import { useControls, button } from 'leva'
import KeyboardControl from './KeyboardControl'


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
  
  // Color controls
  useControls('Logo Colors', {
    mainColor: {
      value: '#fc0398',
      onChange: (color) => {
        useLogoCubeStore.getState().setColors({ a: color });
      }
    },
    accentColor: {
      value: '#333333',
      onChange: (color) => {
        useLogoCubeStore.getState().setColors({ b: color });
      }
    }
  });
  
  // Movement speed and control settings
  useControls('WASD Controls', {
    moveSpeed: {
      value: 0.1, 
      min: 0.01, 
      max: 1, 
      step: 0.01,
      onChange: (value) => {
        // Update moveSpeed in the store
        if (useLogoCubeStore.getState().setMoveSpeed) {
          useLogoCubeStore.getState().setMoveSpeed(value)
        } else {
          console.warn('setMoveSpeed not available in the store')
        }
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
    
    // Handle pattern loading errors more gracefully
    const handlePatternLoadError = (error) => {
      console.error("Error loading pattern:", error.detail?.error?.message || "Unknown error");
      alert("There was an error loading the pattern. Please try again or try a different file.");
    }
    
    // Add file input listener for Animation mode
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    // Handle pattern loading in Animation mode
    const handlePatternLoad = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          console.log("Animation mode: Loading pattern file:", file.name);
          const content = event.target.result;
          const data = JSON.parse(content);
          console.log("Animation mode: Pattern data parsed:", data);
          
          // Try different loading approaches (failover strategy)
          let success = false;
          
          // Try full config import first
          if (data.pattern || data.visual) {
            console.log("Animation mode: Attempting to load as full config");
            success = useLogoCubeStore.getState().importFullConfig(data);
          }
          
          // If that fails, try direct pattern load
          if (!success && (data.cubes || Array.isArray(data))) {
            console.log("Animation mode: Attempting to load as pattern only");
            success = useLogoCubeStore.getState().loadPattern(data);
          }
          
          if (success) {
            console.log("Animation mode: Pattern loaded successfully");
          } else {
            throw new Error("Failed to load pattern: Unknown format");
          }
        } catch (error) {
          console.error("Animation mode: Error loading pattern:", error);
          console.error("Content:", event.target.result.substring(0, 500) + '...');
          window.dispatchEvent(new CustomEvent('patternloaderror', { 
            detail: { error } 
          }));
        }
      };
      reader.readAsText(file);
      fileInput.value = null; // Reset for reuse
    };
    
    fileInput.addEventListener('change', handlePatternLoad);
    
    // Add keyboard shortcut for loading patterns (e.g., Ctrl+L)
    const handleKeyboardShortcuts = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        fileInput.click(); // Trigger file selection dialog
      }
    };
    
    window.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Add error handling for pattern loading
    window.addEventListener('patternloaderror', handlePatternLoadError);
    
    // Add the event listener
    window.addEventListener('modechange', handleModeChange);
    
    // Clean up
    return () => {
      window.removeEventListener('modechange', handleModeChange);
      window.removeEventListener('patternloaderror', handlePatternLoadError);
      window.removeEventListener('keydown', handleKeyboardShortcuts);
      fileInput.removeEventListener('change', handlePatternLoad);
      document.body.removeChild(fileInput);
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
      
      {/* Centralized keyboard controls */}
      <KeyboardControl />

    </>
  )
}
