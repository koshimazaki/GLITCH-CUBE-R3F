import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Grid, GizmoHelper, GizmoViewport, AccumulativeShadows, RandomizedLight } from '@react-three/drei'
import { useState, useRef, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import { GridCoordinatesHelper, TexturedLogoCube, CubeHighlighter } from './components/three/CoordinateLabels'
import useLogoCubeStore from './store/logoCubeStore'
import './DesignerExperience.css'
import KeyboardControl from './KeyboardControl'
import DesignerControls from './components/ui/DesignerControls'

// Interactive Cube component for clicking
const InteractiveCubeGrid = ({ size = 5, cubeSize = 0.8, gap = 0.2 }) => {
  const { toggleCube } = useLogoCubeStore()
  const [hovered, setHovered] = useState(null)
  const [currentPosition, setCurrentPosition] = useState([Math.floor(size/2), Math.floor(size/2), Math.floor(size/2)])
  
  // Calculate the offset for positioning
  const offset = (size - 1) / 2
  
  // Create a reference to the group containing all the invisible hit boxes
  const groupRef = useRef()
  
  // Handle click events on the hitboxes
  const handleClick = useCallback((e) => {
    e.stopPropagation()
    if (e.object.userData.coordinates) {
      const [x, y, z] = e.object.userData.coordinates
      toggleCube(x, y, z)
    }
  }, [toggleCube])
  
  // Handle hover events
  const handlePointerOver = useCallback((e) => {
    e.stopPropagation()
    if (e.object.userData.coordinates) {
      setHovered(e.object.userData.coordinates)
    }
  }, [])
  
  const handlePointerOut = useCallback(() => {
    setHovered(null)
  }, [])
  
  // Create invisible hitboxes for the entire grid
  const hitboxes = []
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        // Calculate world position
        const worldX = (x - offset) * (cubeSize + gap)
        const worldY = (y - offset) * (cubeSize + gap)
        const worldZ = (z - offset) * (cubeSize + gap)
        
        const key = `${x},${y},${z}`
        
        // Create hitbox with reduced opacity for better interaction
        hitboxes.push(
          <mesh
            key={key}
            position={[worldX, worldY, worldZ]}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            userData={{ coordinates: [x, y, z] }}
          >
            <boxGeometry args={[cubeSize * 1.1, cubeSize * 1.1, cubeSize * 1.1]} />
            <meshBasicMaterial 
              transparent 
              opacity={0.0} 
              wireframe={false} 
              depthWrite={false}
            />
          </mesh>
        )
      }
    }
  }
  
  return (
    <group ref={groupRef}>
      {/* Use the centralized KeyboardControl component for designer mode */}
      <KeyboardControl 
        gridSize={size}
        toggleCube={toggleCube}
        enableSpaceToggle={true}
        setCurrentPosition={setCurrentPosition}
        setHovered={setHovered}
        currentPosition={currentPosition}
      />
      {hitboxes}
      {hovered && <CubeHighlighter coordinates={hovered} color="#ff05b0" />}
      {/* Always show current position cursor even when not hovering */}
      <CubeHighlighter coordinates={currentPosition} color="#0088ff" />
    </group>
  )
}

// Scene component to hold all Three.js elements
const DesignerScene = ({ wireframe, showGrid, showCoordinates, cubeColor, textColor, orbitControlsRef, autoRotate }) => {
  return (
    <>
      <color attach="background" args={['lightgray']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} />
      
      {/* Use the TexturedLogoCube component with the selected colors */}
      <TexturedLogoCube 
        wireframe={wireframe} 
        color={cubeColor} 
        textColor={textColor} 
      />
      
      <InteractiveCubeGrid />
      
      {showGrid && (
        <gridHelper args={[30, 30, 'gray', 'gray']} />
      )}
      
      {showCoordinates && (
        <GridCoordinatesHelper />
      )}
      
      <OrbitControls 
        ref={orbitControlsRef}
        makeDefault 
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.8}
        enablePan={true}
        panSpeed={1.0}
        minDistance={5}
        maxDistance={30}
        maxPolarAngle={Math.PI * 0.9} // Prevent going below the grid
        screenSpacePanning={true}
        enableZoom={true}
        zoomSpeed={1.2}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
      />
    </>
  )
}

const DesignerExperience = () => {
  const [debugOptions, setDebugOptions] = useState({
    showGrid: true,
    showCoordinates: true,
    showWireframe: false,
  })

  // Use store to get and set values
  const logoCubeStore = useLogoCubeStore()
  const [patternName, setPatternName] = useState('')
  
  // Color state
  const [cubeColor, setCubeColor] = useState(logoCubeStore.visual.color)
  const [textColor, setTextColor] = useState('#000000')
  
  // Camera controls state
  const [cameraControls, setCameraControls] = useState({
    autoRotate: false
  })
  
  // Ref for OrbitControls
  const orbitControlsRef = useRef(null)
  
  // Ref to track initialization
  const isInitializedRef = useRef(false)

  // Initialize the store when entering designer mode
  useEffect(() => {
    // Only run this once per component mount
    if (!isInitializedRef.current) {
      // When entering designer mode, set animation to none to prevent movement
      if (logoCubeStore.animation.type !== 'none') {
        logoCubeStore.setAnimationType('none')
      }
      
      // Set default pattern name based on current pattern
      setPatternName(logoCubeStore.currentPattern || '')
      
      // Mark as initialized
      isInitializedRef.current = true
    }
    
    // Listen for mode changes to save state before exiting
    const handleModeChange = (event) => {
      if (event.detail.isDesignerMode === false) {
        // Transitioning to animation mode
        // Nothing special needed - the store already has all the data
      }
    }
    
    window.addEventListener('modechange', handleModeChange)
    
    return () => {
      window.removeEventListener('modechange', handleModeChange)
    }
  }, [])

  const handleDebugToggle = (option) => {
    setDebugOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }))
  }
  
  // Handle updating the cube color
  const handleCubeColorChange = (color) => {
    setCubeColor(color)
    logoCubeStore.setColor(color)
  }
  
  // Camera control functions
  const toggleAutoRotate = () => {
    setCameraControls(prev => ({ ...prev, autoRotate: !prev.autoRotate }))
  }
  
  const setCameraPosition = (position) => {
    if (orbitControlsRef.current) {
      const controls = orbitControlsRef.current
      
      // Reset any ongoing animations/rotations
      controls.autoRotate = false
      setCameraControls(prev => ({ ...prev, autoRotate: false }))
      
      // Get the target point (usually at the center)
      const targetPosition = controls.target.clone()
      
      // Calculate the new camera position based on the preset view
      switch(position) {
        case 'front':
          controls.object.position.set(0, 0, 15)
          break
        case 'back':
          controls.object.position.set(0, 0, -15)
          break
        case 'left':
          controls.object.position.set(-15, 0, 0)
          break
        case 'right':
          controls.object.position.set(15, 0, 0)
          break
        case 'top':
          controls.object.position.set(0, 15, 0)
          break
        case 'bottom':
          controls.object.position.set(0, -15, 0)
          break
        case 'isometric':
          controls.object.position.set(10, 10, 10)
          break
        default:
          return
      }
      
      // Look at the target
      controls.object.lookAt(targetPosition)
      controls.update()
    }
  }

  return (
    <div className="designer-container">
      <DesignerControls
        debugOptions={debugOptions}
        handleDebugToggle={handleDebugToggle}
        patternName={patternName}
        setPatternName={setPatternName}
        cubeColor={cubeColor}
        textColor={textColor}
        handleCubeColorChange={handleCubeColorChange}
        setTextColor={setTextColor}
        cameraControls={cameraControls}
        toggleAutoRotate={toggleAutoRotate}
        setCameraPosition={setCameraPosition}
      />

      <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
        <DesignerScene 
          wireframe={debugOptions.showWireframe}
          showGrid={debugOptions.showGrid}
          showCoordinates={debugOptions.showCoordinates}
          cubeColor={cubeColor}
          textColor={textColor}
          orbitControlsRef={orbitControlsRef}
          autoRotate={cameraControls.autoRotate}
        />
          {/* Gizmo Helper */}
    <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport axisColors={['#fc0398', '#42d5ca', '#ffcf33']} labelColor="white" />
      </GizmoHelper>
      </Canvas>


    </div>
  )
}

export default DesignerExperience 