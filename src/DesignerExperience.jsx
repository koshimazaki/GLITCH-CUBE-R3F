import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Grid, GizmoHelper, GizmoViewport, AccumulativeShadows, RandomizedLight } from '@react-three/drei'
import { useState, useRef, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import { GridCoordinatesHelper, TexturedLogoCube, CubeHighlighter } from './components/three/CoordinateLabels'
import useLogoCubeStore from './store/logoCubeStore'
import ColorPickerInput from './components/ui/ColorPickerInput'
import './DesignerExperience.css'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'



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
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Clone current position
      const newPos = [...currentPosition]
      
      switch (e.key.toLowerCase()) {
        // X-axis movement (left-right)
        case 'd': // right
          newPos[0] = Math.min(newPos[0] + 1, size - 1)
          break
        case 'a': // left
          newPos[0] = Math.max(newPos[0] - 1, 0)
          break
          
        // Y-axis movement (up-down)
        case 'w': // up
          newPos[1] = Math.min(newPos[1] + 1, size - 1)
          break
        case 's': // down
          newPos[1] = Math.max(newPos[1] - 1, 0)
          break
          
        // Z-axis movement (forward-backward)
        case 'e': // forward
          newPos[2] = Math.min(newPos[2] + 1, size - 1)
          break
        case 'q': // backward
          newPos[2] = Math.max(newPos[2] - 1, 0)
          break
          
        // Toggle cube with spacebar
        case ' ': // space
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
  }, [currentPosition, size, toggleCube])
  
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
  
  // File input refs
  const fileInputRef = useRef(null)
  const configFileInputRef = useRef(null)
  
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

  const handlePatternChange = (e) => {
    const pattern = e.target.value
    setPatternName(pattern)
    // Use the store method directly
    logoCubeStore.setCurrentPattern(pattern)
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
  
  // Handle loading a JSON pattern
  const handleLoadPattern = () => {
    // Trigger the hidden file input
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }
  
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const pattern = JSON.parse(event.target.result)
        
        // Clear existing pattern
        const visibleCubes = new Map()
        
        // Process the pattern data
        pattern.forEach(cube => {
          if (typeof cube.x === 'number' && 
              typeof cube.y === 'number' && 
              typeof cube.z === 'number') {
            visibleCubes.set(`${cube.x},${cube.y},${cube.z}`, 1)
          }
        })
        
        // Update the store
        logoCubeStore.loadPattern(visibleCubes)
        
        // Set the pattern name to the filename without extension
        const filename = file.name.replace(/\.[^/.]+$/, "")
        setPatternName(filename)
        
      } catch (error) {
        console.error("Error loading pattern:", error)
        alert("Failed to load pattern: Invalid JSON format")
      }
    }
    
    reader.readAsText(file)
    
    // Reset the file input so the same file can be loaded again
    e.target.value = null
  }

  const handleSavePattern = () => {
    const visibleCubes = Array.from(logoCubeStore.visibleCubes.keys()).map(key => {
      const [x, y, z] = key.split(',').map(Number)
      return { x, y, z }
    })
    const json = JSON.stringify(visibleCubes, null, 2)
    
    // Create a downloadable file
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pattern-${patternName || 'custom'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Handle exporting the full configuration
  const handleExportConfig = () => {
    const config = logoCubeStore.exportFullConfig()
    const json = JSON.stringify(config, null, 2)
    
    // Create a downloadable file
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gns-logo-config-${patternName || 'custom'}-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Handle importing full configuration
  const handleImportConfig = () => {
    if (configFileInputRef.current) {
      configFileInputRef.current.click()
    }
  }

  const handleConfigFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const config = JSON.parse(event.target.result)
        const success = logoCubeStore.importFullConfig(config)
        
        if (success) {
          // Update UI state to match the imported config
          setPatternName(config.meta?.patternName || 'custom')
          setCubeColor(config.visual?.color || '#fc0398')
          // Show success message
          alert('Configuration imported successfully!')
        } else {
          alert('Failed to import configuration. Invalid format.')
        }
      } catch (error) {
        console.error("Error importing configuration:", error)
        alert("Failed to import: Invalid JSON format")
      }
    }
    
    reader.readAsText(file)
    
    // Reset the file input so the same file can be loaded again
    e.target.value = null
  }

  return (
    <div className="designer-container">
      <div className="debug-controls">
        <h3>Debug Controls</h3>
        <label>
          <input 
            type="checkbox" 
            checked={debugOptions.showGrid} 
            onChange={() => handleDebugToggle('showGrid')} 
          />
          Show Grid
        </label>
        <label>
          <input 
            type="checkbox" 
            checked={debugOptions.showCoordinates} 
            onChange={() => handleDebugToggle('showCoordinates')} 
          />
          Show Coordinates
        </label>
        <label>
          <input 
            type="checkbox" 
            checked={debugOptions.showWireframe} 
            onChange={() => handleDebugToggle('showWireframe')} 
          />
          Show Wireframe
        </label>
        
        <h3>Appearance</h3>
        <ColorPickerInput 
          label="Cube" 
          value={cubeColor} 
          onChange={handleCubeColorChange} 
        />
        
        <ColorPickerInput 
          label="Text" 
          value={textColor} 
          onChange={setTextColor} 
        />

        <h3>Pattern Selection</h3>
        <select value={patternName} onChange={handlePatternChange}>
          <option value="">Select a pattern</option>
          <option value="G">G</option>
          <option value="N">N</option>
          <option value="S">S</option>
          <option value="cube">Cube</option>
          <option value="hollow">Hollow Cube</option>
          <option value="random">Random</option>
        </select>
        
        <div className="pattern-actions">
          <button 
            onClick={handleSavePattern}
            className="action-btn save-btn"
          >
            Save Pattern
          </button>
          
          <button 
            onClick={handleLoadPattern}
            className="action-btn load-btn"
          >
            Load Pattern
          </button>
          
          {/* Hidden file input for loading JSON */}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            style={{ display: 'none' }}
          />
        </div>
        
        <h3>Full Configuration</h3>
        <div className="pattern-actions">
          <button 
            onClick={handleExportConfig}
            className="action-btn export-btn"
          >
            Export Config
          </button>
          
          <button 
            onClick={handleImportConfig}
            className="action-btn import-btn"
          >
            Import Config
          </button>
          
          {/* Hidden file input for loading configuration */}
          <input 
            type="file" 
            ref={configFileInputRef}
            onChange={handleConfigFileChange}
            accept=".json"
            style={{ display: 'none' }}
          />
        </div>
        
        {/* Replace separate instruction sections with a single accordion */}
        <Accordion sx={{ 
          marginTop: '20px', 
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
          borderRadius: '4px',
          '&:before': {
            display: 'none',
          }
        }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="instructions-content"
            id="instructions-header"
            sx={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              borderRadius: '4px'
            }}
          >
            <h3 style={{ margin: 0 }}>Instructions</h3>
          </AccordionSummary>
          <AccordionDetails>
            <div>
              <h4>Keyboard Controls</h4>
              <div className="keyboard-controls">
                <p><strong>W/S</strong> - Up/Down (Y axis)</p>
                <p><strong>A/D</strong> - Left/Right (X axis)</p>
                <p><strong>Q/E</strong> - Back/Forward (Z axis)</p>
                <p><strong>Space</strong> - Toggle cube at cursor</p>
              </div>
              
              <h4>Basic Usage</h4>
              <p className="instruction-text">
                Click to add or remove a cube.
                Hover over to see a highlight.
                Use keyboard to navigate the grid.
              </p>
              
              <h4>Camera Controls</h4>
              <p className="camera-instructions">
                <strong>Interact with 3D view:</strong><br/>
                • <strong>Left-click + drag</strong>: Rotate view<br/>
                • <strong>Right-click + drag</strong>: Pan view<br/>
                • <strong>Scroll wheel</strong>: Zoom in/out
              </p>
            </div>
          </AccordionDetails>
        </Accordion>
        
        <h3>Camera Controls</h3>
        <div className="camera-controls">
          <div className="camera-position-controls">
            <button onClick={() => setCameraPosition('front')} className="camera-btn">Front</button>
            <button onClick={() => setCameraPosition('back')} className="camera-btn">Back</button>
            <button onClick={() => setCameraPosition('left')} className="camera-btn">Left</button>
            <button onClick={() => setCameraPosition('right')} className="camera-btn">Right</button>
            <button onClick={() => setCameraPosition('top')} className="camera-btn">Top</button>
            <button onClick={() => setCameraPosition('bottom')} className="camera-btn">Bottom</button>
            <button onClick={() => setCameraPosition('isometric')} className="camera-btn">Isometric</button>
          </div>
          <div className="camera-rotation-controls">
            <label>
              <input
                type="checkbox"
                checked={cameraControls.autoRotate}
                onChange={toggleAutoRotate}
              />
              Auto-Rotate
            </label>
          </div>
        </div>
      </div>

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