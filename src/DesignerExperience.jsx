import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Grid, GizmoHelper, GizmoViewport, AccumulativeShadows, RandomizedLight } from '@react-three/drei'
import { useState, useRef, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import { GridCoordinatesHelper, CubeHighlighter } from './components/three/CoordinateLabels'
import { TexturedLogoCube } from './components/three/TexturedLogoCube'
import useLogoCubeStore from './store/logoCubeStore'
import './DesignerExperience.css'
import KeyboardControl from './KeyboardControl'
import DesignerControls from './components/ui/DesignerControls'
import { gridToWorld } from './utils/coordinateUtils'

// Interactive Cube component for clicking
const InteractiveCubeGrid = ({ size = 5, cubeSize = 0.8, gap = 0.2 }) => {
  const { toggleCube, setCubeSideColor, clearCubeSideColors } = useLogoCubeStore()
  const [hovered, setHovered] = useState(null)
  const [currentPosition, setCurrentPosition] = useState([Math.floor(size/2), Math.floor(size/2), Math.floor(size/2)])
  const [selectedCube, setSelectedCube] = useState(null)
  const [selectedSideIndex, setSelectedSideIndex] = useState(0)
  
  // Create a reference to the group containing all the invisible hit boxes
  const groupRef = useRef()
  
  // Define face names
  const faces = ['front', 'back', 'left', 'right', 'top', 'bottom']
  
  // Handle left-click events on the hitboxes - fix toggle functionality
  const handleClick = useCallback((e) => {
    if (e.stopPropagation) {
      e.stopPropagation()
    }
    
    // Check if this is a left click (button === 0) or if it's a Three.js intersection event
    const isLeftClick = e.button === undefined || e.button === 0
    
    if (e.object && e.object.userData && e.object.userData.coordinates && isLeftClick) {
      const [x, y, z] = e.object.userData.coordinates
      console.log(`Left-clicked cube at ${x},${y},${z}`)
      
      // Check if clicking on currently selected cube
      const currentlySelected = selectedCube && 
        selectedCube.x === x && 
        selectedCube.y === y && 
        selectedCube.z === z
      
      // If already selected, toggle visibility
      if (currentlySelected) {
        toggleCube(x, y, z) // Remove the cube
        setSelectedCube(null) // Deselect it
        console.log(`Removed cube at ${x},${y},${z}`)
      } else {
        // Check if the cube exists
        const key = `${x},${y},${z}`
        const exists = useLogoCubeStore.getState().visibleCubes.has(key)
        
        // If it doesn't exist, add it
        if (!exists) {
          toggleCube(x, y, z)
          console.log(`Added new cube at ${x},${y},${z}`)
        }
        
        // Clear any previous selection
        if (selectedCube) {
          console.log(`Deselected previous cube at ${selectedCube.x},${selectedCube.y},${selectedCube.z}`)
        }
        
        // Select the new cube
        setSelectedCube({ x, y, z })
        console.log(`Selected cube at ${x},${y},${z}`)
      }
    }
  }, [toggleCube, selectedCube])
  
  // Handle right-click to cycle through sides - fix cycling behavior
  const handleContextMenu = useCallback((e) => {
    // In React Three Fiber, sometimes the event is a Three.js intersection object
    // rather than a regular DOM event
    if (e.preventDefault) {
      e.preventDefault() // Prevent default context menu
      e.stopPropagation()
    }
    
    if (e.object && e.object.userData && e.object.userData.coordinates) {
      const [x, y, z] = e.object.userData.coordinates
      console.log(`Right-clicked cube at ${x},${y},${z}`)
      
      // Make sure cube is visible if not already
      const visibleCubes = useLogoCubeStore.getState().visibleCubes
      const key = `${x},${y},${z}`
      if (!visibleCubes.has(key)) {
        toggleCube(x, y, z)
        console.log(`Created cube at ${x},${y},${z} for texturing`)
      }
      
      // Clear any previous selection
      if (selectedCube && (selectedCube.x !== x || selectedCube.y !== y || selectedCube.z !== z)) {
        console.log(`Deselected previous cube at ${selectedCube.x},${selectedCube.y},${selectedCube.z}`)
      }
      
      // Select the cube
      setSelectedCube({ x, y, z })
      console.log(`Selected cube at ${x},${y},${z} for texturing`)
      
      // Option 1: One face at a time - clear all previous faces first
      // This ensures only one face has texture at a time during cycling
      clearCubeSideColors(x, y, z)
      
      // Cycle to next side
      const nextSideIndex = (selectedSideIndex + 1) % faces.length
      setSelectedSideIndex(nextSideIndex)
      
      // Apply accent color to face
      setCubeSideColor(x, y, z, faces[nextSideIndex], 'b')
      console.log(`Applied texture to face: ${faces[nextSideIndex]}`)
    }
  }, [selectedSideIndex, setCubeSideColor, faces, toggleCube, clearCubeSideColors, selectedCube])
  
  // Handle hover events
  const onHover = useCallback((e) => {
    e.stopPropagation()
    // Don't change hover if a cube is already selected
    if (e.object && !selectedCube) {
      setHovered(e.object.userData.coordinates)
    }
  }, [selectedCube])
  
  const handlePointerOut = useCallback(() => {
    // Only clear hover if no cube is selected
    if (!selectedCube) {
      setHovered(null)
    }
  }, [selectedCube])
  
  // Add keyboard controls for cycling through faces
  useEffect(() => {
    const handleKeyDown = (e) => {
      // If no cube is selected, nothing to do
      if (!selectedCube) return
      
      const { x, y, z } = selectedCube
      const visibleCubes = useLogoCubeStore.getState().visibleCubes
      const key = `${x},${y},${z}`
      
      // Check if the selected cube actually exists
      if (!visibleCubes.has(key)) {
        console.warn(`Selected cube at ${key} doesn't exist, deselecting`)
        setSelectedCube(null)
        return
      }
      
      if (e.key === 'Enter') {
        // Clear all sides when cycling with Enter
        clearCubeSideColors(x, y, z)
        
        // Cycle to next face
        const nextSideIndex = (selectedSideIndex + 1) % faces.length
        setSelectedSideIndex(nextSideIndex)
        
        // Apply accent color to next face
        setCubeSideColor(x, y, z, faces[nextSideIndex], 'b')
        console.log(`Enter key - Applied texture to face: ${faces[nextSideIndex]}`)
      } else if (e.key === 'Escape') {
        // Deselect cube when Escape is pressed
        setSelectedCube(null)
        setSelectedSideIndex(0)
      } else if (e.key === 'c' || e.key === 'C') {
        // Clear all accent colors from selected cube
        clearCubeSideColors(x, y, z)
        console.log('Cleared all textures from cube')
      } else if (['w', 's', 'a', 'd', 'q', 'e'].includes(e.key.toLowerCase())) {
        // Log WASD/QE key presses for debugging
        console.log(`Navigation key pressed: ${e.key}`)
      } else {
        // Handle number keys 1-6 for specific faces
        const numberKey = parseInt(e.key)
        if (!isNaN(numberKey) && numberKey >= 1 && numberKey <= 6) {
          const faceIndex = numberKey - 1
          if (faceIndex < faces.length) {
            // Get current cube data
            const cubeData = visibleCubes.get(key)
            if (!cubeData) {
              console.warn(`Cannot texture non-existent cube at ${key}`)
              return
            }
            
            const sides = cubeData.sides || {}
            
            // Toggle the texture on this face (add if not present, remove if present)
            if (sides[faces[faceIndex]] === 'b') {
              setCubeSideColor(x, y, z, faces[faceIndex], 'a') // Remove texture
              console.log(`Removed texture from face: ${faces[faceIndex]}`)
            } else {
              // Set the selected side index to match the number key pressed
              setSelectedSideIndex(faceIndex)
              setCubeSideColor(x, y, z, faces[faceIndex], 'b') // Add texture
              console.log(`Added texture to face: ${faces[faceIndex]}`)
            }
          }
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedCube, selectedSideIndex, faces, setCubeSideColor, clearCubeSideColors, toggleCube])
  
  // Create invisible hitboxes for the entire grid
  const hitboxes = []
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        // Use utility function for coordinate transformation
        const [worldX, worldY, worldZ] = gridToWorld(x, y, z, size, cubeSize, gap)
        
        const key = `${x},${y},${z}`
        
        // Create hitbox with reduced opacity for better interaction
        hitboxes.push(
          <mesh
            key={key}
            position={[worldX, worldY, worldZ]}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            onPointerOver={onHover}
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
      {selectedCube && <CubeHighlighter coordinates={[selectedCube.x, selectedCube.y, selectedCube.z]} color="#00ff00" />}
      {/* Always show current position cursor even when not hovering */}
      <CubeHighlighter coordinates={currentPosition} color="#0088ff" />
    </group>
  )
}

// Scene component to hold all Three.js elements
const DesignerScene = ({ 
  wireframe, 
  showGrid, 
  showCoordinates, 
  mainColor, 
  accentColor, 
  orbitControlsRef, 
  autoRotate 
}) => {
  return (
    <>
      <color attach="background" args={['lightgray']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} />
      
      {/* Use the TexturedLogoCube component with the selected colors */}
      <TexturedLogoCube 
        wireframe={wireframe} 
        mainColor={mainColor} 
        accentColor={accentColor} 
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
  const [mainColor, setMainColor] = useState(logoCubeStore.visual.colors.a || '#fc0398')
  const [accentColor, setAccentColor] = useState(logoCubeStore.visual.colors.b || '#333333')
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
  
  // Handle updating the main color
  const handleMainColorChange = (color) => {
    setMainColor(color)
    logoCubeStore.setColors({ a: color })
  }
  
  // Handle updating the accent color
  const handleAccentColorChange = (color) => {
    setAccentColor(color)
    logoCubeStore.setColors({ b: color })
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
        mainColor={mainColor}
        accentColor={accentColor}
        textColor={textColor}
        handleMainColorChange={handleMainColorChange}
        handleAccentColorChange={handleAccentColorChange}
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
          mainColor={mainColor}
          accentColor={accentColor}
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