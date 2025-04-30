import { useState, useCallback, useRef } from 'react'
import { patternMap } from '../three/LogoPatterns'
import useLogoCubeStore from '../../store/logoCubeStore'
import './LogoControls.css'

/**
 * LogoControls - UI component for adjusting the logo cube settings
 */
export function LogoControls() {
  const [currentPattern, setCurrentPattern] = useState('hollow')
  const fileInputRef = useRef(null)
  
  // Get only the specific store values we need and use separate selectors
  const animation = useLogoCubeStore(state => state.animation)
  const visual = useLogoCubeStore(state => state.visual)
  
  // Get actions from store
  const initializeHollowCube = useLogoCubeStore(state => state.initializeHollowCube)
  const initializeCustomPattern = useLogoCubeStore(state => state.initializeCustomPattern)
  const loadPattern = useLogoCubeStore(state => state.loadPattern)
  const setAnimationType = useLogoCubeStore(state => state.setAnimationType)
  const setAnimationSpeed = useLogoCubeStore(state => state.setAnimationSpeed)
  const setInteractionFactor = useLogoCubeStore(state => state.setInteractionFactor)
  const setColor = useLogoCubeStore(state => state.setColor)
  const setCubeSize = useLogoCubeStore(state => state.setCubeSize)
  const setGap = useLogoCubeStore(state => state.setGap)
  
  // Handle pattern change - use useCallback to memoize handlers
  const handlePatternChange = useCallback((e) => {
    const newPattern = e.target.value
    setCurrentPattern(newPattern)
    
    if (newPattern === 'hollow') {
      initializeHollowCube()
    } else if (newPattern === 'custom') {
      // Trigger file input when custom is selected
      if (fileInputRef.current) {
        fileInputRef.current.click()
      }
    } else {
      const patternFunc = patternMap[newPattern]
      if (patternFunc) {
        initializeCustomPattern(patternFunc)
      }
    }
  }, [initializeHollowCube, initializeCustomPattern])
  
  // Handle loading a custom JSON pattern
  const handleFileChange = useCallback((e) => {
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
        loadPattern(visibleCubes)
        
        // Update the pattern name
        setCurrentPattern('custom')
        
      } catch (error) {
        console.error("Error loading pattern:", error)
        alert("Failed to load pattern: Invalid JSON format")
      }
    }
    
    reader.readAsText(file)
    
    // Reset the file input so the same file can be loaded again
    e.target.value = null
  }, [loadPattern])
  
  // Handle animation type change
  const handleAnimationTypeChange = useCallback((e) => {
    setAnimationType(e.target.value)
  }, [setAnimationType])
  
  // Handle animation speed change
  const handleAnimationSpeedChange = useCallback((e) => {
    setAnimationSpeed(parseFloat(e.target.value))
  }, [setAnimationSpeed])
  
  // Handle interaction factor change
  const handleInteractionFactorChange = useCallback((e) => {
    setInteractionFactor(parseFloat(e.target.value))
  }, [setInteractionFactor])
  
  // Handle color change
  const handleColorChange = useCallback((e) => {
    setColor(e.target.value)
  }, [setColor])
  
  // Handle cube size change
  const handleCubeSizeChange = useCallback((e) => {
    setCubeSize(parseFloat(e.target.value))
  }, [setCubeSize])
  
  // Handle gap change
  const handleGapChange = useCallback((e) => {
    setGap(parseFloat(e.target.value))
  }, [setGap])
  
  // Handle loading a custom pattern button click
  const handleLoadPatternClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [])
  
  return (
    <div className="logo-controls">
      <h3>Logo Controls</h3>
      
      <div className="control-group">
        <label htmlFor="pattern">Pattern:</label>
        <select 
          id="pattern" 
          value={currentPattern} 
          onChange={handlePatternChange}
        >
          <option value="hollow">Hollow Cube</option>
          <option value="nested">Nested Cubes</option>
          <option value="g">G Letter</option>
          <option value="n">N Letter</option>
          <option value="s">S Letter</option>
          <option value="gns">GNS (3D)</option>
          <option value="cross">Cross</option>
          <option value="stairs">Stairs</option>
          <option value="random">Random</option>
          <option value="sphere">Sphere</option>
          <option value="custom">Custom (JSON)</option>
        </select>
      </div>
      
      {/* Custom pattern loading button */}
      <div className="control-group">
        <button 
          className="load-pattern-btn" 
          onClick={handleLoadPatternClick}
        >
          Load JSON Pattern
        </button>
        <input 
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".json"
          onChange={handleFileChange}
        />
      </div>
      
      <div className="control-group">
        <label htmlFor="animationType">Animation:</label>
        <select 
          id="animationType" 
          value={animation.type} 
          onChange={handleAnimationTypeChange}
        >
          <option value="wave">Wave</option>
          <option value="breathe">Breathe</option>
          <option value="twist">Twist</option>
          <option value="scatter">Scatter</option>
        </select>
      </div>
      
      <div className="control-group">
        <label htmlFor="animationSpeed">Speed:</label>
        <input 
          type="range" 
          id="animationSpeed" 
          min="0" 
          max="5" 
          step="0.1" 
          value={animation.speed} 
          onChange={handleAnimationSpeedChange} 
        />
        <span>{animation.speed.toFixed(1)}</span>
      </div>
      
      <div className="control-group">
        <label htmlFor="interactionFactor">Interaction:</label>
        <input 
          type="range" 
          id="interactionFactor" 
          min="0" 
          max="2" 
          step="0.1" 
          value={animation.interactionFactor} 
          onChange={handleInteractionFactorChange} 
        />
        <span>{animation.interactionFactor.toFixed(1)}</span>
      </div>
      
      <div className="control-group">
        <label htmlFor="color">Color:</label>
        <input 
          type="color" 
          id="color" 
          value={visual.color} 
          onChange={handleColorChange} 
        />
      </div>
      
      <div className="control-group">
        <label htmlFor="cubeSize">Cube Size:</label>
        <input 
          type="range" 
          id="cubeSize" 
          min="0.1" 
          max="1" 
          step="0.01" 
          value={visual.cubeSize} 
          onChange={handleCubeSizeChange} 
        />
        <span>{visual.cubeSize.toFixed(2)}</span>
      </div>
      
      <div className="control-group">
        <label htmlFor="gap">Gap:</label>
        <input 
          type="range" 
          id="gap" 
          min="0" 
          max="1" 
          step="0.01" 
          value={visual.gap} 
          onChange={handleGapChange} 
        />
        <span>{visual.gap.toFixed(2)}</span>
      </div>
    </div>
  )
}

export default LogoControls 