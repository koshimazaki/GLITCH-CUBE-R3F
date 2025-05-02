import { useState, useCallback, useRef, useEffect } from 'react'
// import { patternMap } from '../three/LogoPatterns'
import useLogoCubeStore from '../../store/logoCubeStore'
import ColorPickerInput from './ColorPickerInput'
import './LogoControls.css'
import { loadPattern as patternLoader, setErrorListenerFlag } from '../../utils/patternLoader'

/**
 * CameraControls - Controls for manipulating the camera view
 */
function CameraControls({ orbitControlsRef, autoRotate, setAutoRotate }) {
  // Handle camera position changes
  const setCameraPosition = (position) => {
    // Use the global orbitControlsRef if the passed ref is null
    const controlsRef = orbitControlsRef?.current ? orbitControlsRef : window.orbitControlsRef
    
    if (!controlsRef || !controlsRef.current) return
    
    const controls = controlsRef.current
    
    // Reset any ongoing animations/rotations
    setAutoRotate(false)
    
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
  
  // Toggle auto-rotation
  const toggleAutoRotate = () => {
    // Use window.setAutoRotate if the passed setAutoRotate is not available
    const setAutoRotateFn = setAutoRotate || window.setAutoRotate
    if (setAutoRotateFn) {
      setAutoRotateFn(prev => !prev)
    }
  }
  
  // Only render controls if we have orbit controls available
  if (!orbitControlsRef?.current && !window.orbitControlsRef?.current) {
    return null
  }
  
  return (
    <div className="camera-controls-group">
      <h4 className="camera-controls-title">Camera Controls</h4>
      
      <div className="camera-position-controls">
        <button onClick={() => setCameraPosition('front')} className="camera-btn">Front</button>
        <button onClick={() => setCameraPosition('back')} className="camera-btn">Back</button>
        <button onClick={() => setCameraPosition('left')} className="camera-btn">Left</button>
        <button onClick={() => setCameraPosition('right')} className="camera-btn">Right</button>
        <button onClick={() => setCameraPosition('top')} className="camera-btn">Top</button>
        <button onClick={() => setCameraPosition('bottom')} className="camera-btn">Bottom</button>
        <button onClick={() => setCameraPosition('isometric')} className="camera-btn">Isometric</button>
      </div>
      
      <div className="camera-checkbox-controls">
        <label>
          <input
            type="checkbox"
            checked={autoRotate}
            onChange={toggleAutoRotate}
          />
          Auto-Rotate
        </label>
      </div>
      
      {/* <div className="camera-instructions">
        <strong>Interact with 3D view:</strong><br/>
        • <strong>Left-click + drag</strong>: Rotate view<br/>
        • <strong>Right-click + drag</strong>: Pan view<br/>
        • <strong>Scroll wheel</strong>: Zoom in/out
      </div> */}
    </div>
  )
}

/**
 * LogoControls - UI component for adjusting the logo cube settings
 */
export function LogoControls() {
  const [currentPattern, setCurrentPattern] = useState('hollow')
  const fileInputRef = useRef(null)
  const configFileInputRef = useRef(null)
  
  // Get orbit controls info from global state
  const [orbitControlsRef, setOrbitControlsRef] = useState(null)
  const [autoRotate, setAutoRotate] = useState(false)
  
  // Find the orbit controls in the scene
  useEffect(() => {
    // Use the global reference if available
    if (window.orbitControlsRef && window.orbitControlsRef.current) {
      setOrbitControlsRef(window.orbitControlsRef)
      return;
    }
    
    // Otherwise, try to find the controls in the scene
    try {
      // We'll use a ref passed from Experience component
      const orbitControlsEl = document.querySelector('canvas')
      
      // Delay to ensure the canvas is fully initialized
      const timer = setTimeout(() => {
        // First try the global reference again
        if (window.orbitControlsRef?.current) {
          setOrbitControlsRef(window.orbitControlsRef)
          return;
        }
        
        // Then try the canvas method
        if (orbitControlsEl && orbitControlsEl.__r3f) {
          const scene = orbitControlsEl.__r3f.root.scene
          const orbitControlObj = scene.children.find(child => 
            child.isObject3D && child.type === 'OrbitControls')
          
          if (orbitControlObj) {
            setOrbitControlsRef({ current: orbitControlObj })
          }
        }
      }, 500) // Half second delay to ensure everything is loaded
      
      return () => clearTimeout(timer)
    } catch (err) {
      console.log('Could not access orbit controls:', err)
    }
  }, [])
  
  // Sync auto-rotate state with the controls
  useEffect(() => {
    // Try to get controls from either the local ref or global ref
    const controlsRef = orbitControlsRef?.current ? orbitControlsRef : window.orbitControlsRef
    
    if (controlsRef?.current) {
      controlsRef.current.autoRotate = autoRotate
    }
  }, [autoRotate, orbitControlsRef])
  
  // Get only the specific store values we need and use separate selectors
  const animation = useLogoCubeStore(state => state.animation)
  const visual = useLogoCubeStore(state => state.visual)
  
  // Get actions from store
  // Commented out unused functions to fix linter errors
  // const initializeHollowCube = useCallback(() => {
  //   useLogoCubeStore.getState().initializeHollowCube()
  // }, [])
  //
  // const initializeCustomPattern = useCallback((patternFunc) => {
  //   useLogoCubeStore.getState().initializeCustomPattern(patternFunc)
  // }, [])
  const setAnimationType = useLogoCubeStore(state => state.setAnimationType)
  const setAnimationSpeed = useLogoCubeStore(state => state.setAnimationSpeed)
  const setInteractionFactor = useLogoCubeStore(state => state.setInteractionFactor)
  const setRippleInteractionFactor = useLogoCubeStore(state => state.setRippleInteractionFactor)
  const setAnimationDelay = useLogoCubeStore(state => state.setAnimationDelay)
  const setColor = useLogoCubeStore(state => state.setColor)
  const setCubeSize = useLogoCubeStore(state => state.setCubeSize)
  const setGap = useLogoCubeStore(state => state.setGap)
  
  // Handle ripple interaction factor changes
  const handleRippleInteractionFactorChange = useCallback((e) => {
    const value = parseFloat(e.target.value);
    // Use the proper setter method for ripple interaction
    setRippleInteractionFactor(value);
  }, [setRippleInteractionFactor]);
  
  // Get additional actions from store
  const exportFullConfig = useLogoCubeStore(state => state.exportFullConfig)
  const importFullConfig = useLogoCubeStore(state => state.importFullConfig)
  
  // Handle pattern change - use useCallback to memoize handlers
  const handlePatternChange = useCallback((e) => {
    const pattern = e.target.value
    if (pattern === 'gns') {
      useLogoCubeStore.getState().initializeGNSLogo()
    } else if (pattern === 'gns_bw') {
      useLogoCubeStore.getState().initializeGNSLogo_BW()
    } else {
      useLogoCubeStore.getState().setCurrentPattern(pattern)
    }
    setCurrentPattern(pattern)
  }, [])
  
  // Track pattern load error listeners
  useEffect(() => {
    // Set flag to prevent duplicate error alerts
    const cleanup = setErrorListenerFlag();
    
    // Add listeners for pattern load success/error
    const handleSuccess = () => {
      // Update pattern name in UI
      setCurrentPattern('custom');
      
      // Update UI state to match store
      const store = useLogoCubeStore.getState();
      
      // Update the animation type dropdown
      if (store.animation && store.animation.type) {
        setAnimationType(store.animation.type);
      }
      
      // Update color inputs
      if (store.visual && store.visual.colors) {
        if (store.visual.colors.a) {
          setColor(store.visual.colors.a);
        }
      }
    };
    
    const handleError = (event) => {
      console.error("Pattern load error in LogoControls:", event.detail.error);
    };
    
    window.addEventListener('patternloadsuccess', handleSuccess);
    window.addEventListener('patternloaderror', handleError);
    
    return () => {
      cleanup();
      window.removeEventListener('patternloadsuccess', handleSuccess);
      window.removeEventListener('patternloaderror', handleError);
    };
  }, [setAnimationType, setColor]);
  
  // Handle loading a custom JSON pattern
  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        // Use our utility for consistent pattern loading
        patternLoader(event.target.result);
        setCurrentPattern('custom');
      } catch (error) {
        console.error("Error loading pattern:", error)
      }
    }
    
    reader.readAsText(file)
    
    // Reset the file input so the same file can be loaded again
    e.target.value = null
  }, [])
  
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
  
  // Handle animation delay change for staggered animations
  const handleAnimationDelayChange = useCallback((e) => {
    setAnimationDelay(parseFloat(e.target.value))
  }, [setAnimationDelay])
  
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
  
  // Handle exporting the full configuration
  const handleExportConfig = useCallback(() => {
    const config = exportFullConfig()
    const json = JSON.stringify(config, null, 2)
    
    // Create a downloadable file
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gns-logo-config-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [exportFullConfig])
  
  // Handle importing full configuration
  const handleImportConfig = useCallback(() => {
    if (configFileInputRef.current) {
      configFileInputRef.current.click()
    }
  }, [])
  
  const handleConfigFileChange = useCallback((e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const config = JSON.parse(event.target.result)
        const success = importFullConfig(config)
        
        if (success) {
          // Update UI state to match the imported config
          setCurrentPattern(config.meta?.patternName || 'custom')
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
  }, [importFullConfig])
  
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
          <option value="gns">GNS Logo</option>
          <option value="gns_bw">GNS Logo (BW)</option>
          <option value="hollow">Hollow Cube</option>
          <option value="nested">Nested Cubes</option>
          <option value="g">G Letter</option>
          <option value="n">N Letter</option>
          <option value="s">S Letter</option>
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
          <option value="falling">Falling (Loading)</option>
          <option value="disconnect">Disconnect</option>
          <option value="assembly">Assembly</option>
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
        <label htmlFor="interactionFactor">Direct Interaction:</label>
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
        <label htmlFor="rippleInteractionFactor">Ripple Effect:</label>
        <input 
          type="range" 
          id="rippleInteractionFactor" 
          min="0" 
          max="2" 
          step="0.1" 
          value={animation.rippleInteractionFactor !== undefined ? animation.rippleInteractionFactor : 0.5} 
          onChange={handleRippleInteractionFactorChange} 
        />
        <span>{(animation.rippleInteractionFactor !== undefined ? animation.rippleInteractionFactor : 0.5).toFixed(1)}</span>
      </div>
      
      <div className="control-group">
        <label htmlFor="animationDelay">Delay:</label>
        <input 
          type="range" 
          id="animationDelay" 
          min="0" 
          max="5" 
          step="0.1" 
          value={animation.delay} 
          onChange={handleAnimationDelayChange} 
        />
        <span>{animation.delay.toFixed(1)}</span>
      </div>
      
      <div className="control-group">
        <ColorPickerInput 
          label="Color"
          value={visual.colors?.a || '#fc0398'}
          onChange={setColor}
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
      
      {/* Add camera controls */}
      <CameraControls 
        orbitControlsRef={orbitControlsRef}
        autoRotate={autoRotate}
        setAutoRotate={setAutoRotate}
      />
      
      {/* Export and import configuration buttons */}
      <div className="control-group">
        <button 
          className="export-config-btn" 
          onClick={handleExportConfig}
        >
          Export Configuration
        </button>
        <button 
          className="import-config-btn" 
          onClick={handleImportConfig}
        >
          Import Configuration
        </button>
      </div>
      
      {/* Import configuration file input */}
      <div className="control-group">
        <input 
          type="file"
          ref={configFileInputRef}
          style={{ display: 'none' }}
          accept=".json"
          onChange={handleConfigFileChange}
        />
      </div>
    </div>
  )
}

export default LogoControls 