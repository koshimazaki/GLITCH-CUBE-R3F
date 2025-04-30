import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useState, useRef, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import { GridCoordinatesHelper, TexturedLogoCube, CubeHighlighter } from './components/three/CoordinateLabels'
import useLogoCubeStore from './store/logoCubeStore'
import './DesignerExperience.css'

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
      {hovered && <CubeHighlighter coordinates={hovered} color="#00ff00" />}
      {/* Always show current position cursor even when not hovering */}
      <CubeHighlighter coordinates={currentPosition} color="#0088ff" />
    </group>
  )
}

// Scene component to hold all Three.js elements
const DesignerScene = ({ wireframe, showGrid, showCoordinates, cubeColor, textColor }) => {
  return (
    <>
      <color attach="background" args={['#f0f0f0']} />
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
      
      <OrbitControls makeDefault />
    </>
  )
}

// Component for a color picker input with label
const ColorPicker = ({ label, value, onChange }) => {
  return (
    <div className="color-picker">
      <label>{label}:</label>
      <div className="color-picker-input">
        <input 
          type="color" 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
        />
        <span className="color-value">{value}</span>
      </div>
    </div>
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
  const [textColor, setTextColor] = useState('#ffffff')
  
  // File input ref for loading JSON
  const fileInputRef = useRef(null)

  // Initialize the store when entering designer mode
  useEffect(() => {
    // When entering designer mode, set animation to none to prevent movement
    logoCubeStore.setAnimationType('none')
    
    // Set default pattern name based on current pattern
    setPatternName(logoCubeStore.currentPattern || '')
    
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
  }, [logoCubeStore])

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
        <ColorPicker 
          label="Cube Color" 
          value={cubeColor} 
          onChange={handleCubeColorChange} 
        />
        
        <ColorPicker 
          label="Text Color" 
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
        
        <h3>Keyboard Controls</h3>
        <div className="keyboard-controls">
          <p><strong>W/S</strong> - Move Up/Down (Y axis)</p>
          <p><strong>A/D</strong> - Move Left/Right (X axis)</p>
          <p><strong>Q/E</strong> - Move Back/Forward (Z axis)</p>
          <p><strong>Space</strong> - Toggle cube at cursor</p>
        </div>
        
        <h3>Instructions</h3>
        <p className="instruction-text">
          Click on any position to add or remove a cube.
          Hover over a position to see a highlight.
          Use keyboard to navigate through the grid.
        </p>
      </div>

      <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
        <DesignerScene 
          wireframe={debugOptions.showWireframe}
          showGrid={debugOptions.showGrid}
          showCoordinates={debugOptions.showCoordinates}
          cubeColor={cubeColor}
          textColor={textColor}
        />
      </Canvas>
    </div>
  )
}

export default DesignerExperience 