import { useRef, useEffect } from 'react'
import useLogoCubeStore from '../../store/logoCubeStore'
import ColorPickerInput from './ColorPickerInput'
import './DesignerControls.css'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { loadPattern as patternLoader, setErrorListenerFlag } from '../../utils/patternLoader'

const DesignerControls = ({ 
  debugOptions, 
  handleDebugToggle, 
  patternName, 
  setPatternName, 
  mainColor, 
  accentColor,
  textColor, 
  handleMainColorChange, 
  handleAccentColorChange,
  setTextColor, 
  cameraControls, 
  toggleAutoRotate,
  setCameraPosition
}) => {
  const logoCubeStore = useLogoCubeStore()
  
  // File input refs
  const fileInputRef = useRef(null)
  const configFileInputRef = useRef(null)

  const handlePatternChange = (e) => {
    const pattern = e.target.value
    setPatternName(pattern)
    // Use the store method directly
    logoCubeStore.setCurrentPattern(pattern)
  }

  // Handle loading a JSON pattern
  const handleLoadPattern = () => {
    // Trigger the hidden file input
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Add listeners for pattern loading events
  useEffect(() => {
    // Set flag to prevent duplicate error alerts
    const cleanup = setErrorListenerFlag();
    
    // Add listeners for pattern load success/error
    const handleSuccess = (event) => {
      // Set the pattern name to something meaningful
      const pattern = event.detail?.pattern;
      if (pattern && pattern.meta && pattern.meta.patternName) {
        setPatternName(pattern.meta.patternName);
      } else {
        setPatternName('custom');
      }
    };
    
    const handleError = (event) => {
      console.error("Pattern load error in DesignerControls:", event.detail.error);
    };
    
    window.addEventListener('patternloadsuccess', handleSuccess);
    window.addEventListener('patternloaderror', handleError);
    
    return () => {
      cleanup();
      window.removeEventListener('patternloadsuccess', handleSuccess);
      window.removeEventListener('patternloaderror', handleError);
    };
  }, [setPatternName]);

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        console.log("Loading pattern file:", file.name)
        
        // Use our standardized pattern loader
        patternLoader(event.target.result);
        
        // Set the pattern name to the filename without extension
        const filename = file.name.replace(/\.[^/.]+$/, "")
        setPatternName(filename)
        
      } catch (error) {
        console.error("Error loading pattern:", error)
      }
    }
    
    reader.readAsText(file)
    
    // Reset the file input so the same file can be loaded again
    e.target.value = null
  }

  const handleSavePattern = () => {
    const json = JSON.stringify(logoCubeStore.exportPattern(), null, 2)
    
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
        console.log("Reading config file:", file.name)
        const config = JSON.parse(event.target.result)
        console.log("Parsed config:", config)
        
        // Print the structure to help debug
        if (config.pattern && config.pattern.cubes) {
          console.log("Found pattern.cubes with length:", config.pattern.cubes.length)
        } else if (config.cubes) {
          console.log("Found top-level cubes with length:", config.cubes.length)
        }
        
        // Handle both formats - full config with pattern field or direct cubes array
        if (config.pattern && config.pattern.cubes) {
          // This is the full configuration format
          const success = logoCubeStore.importFullConfig(config)
          
          if (success) {
            // Update UI with the imported data
            setPatternName(config.meta?.patternName || 'custom')
            
            if (config.visual?.colors?.a) {
              handleMainColorChange(config.visual.colors.a)
            }
            
            if (config.visual?.colors?.b) {
              handleAccentColorChange(config.visual.colors.b)
            }
            
            alert('Configuration imported successfully!')
          } else {
            alert('Failed to import configuration. See console for details.')
          }
        } else if (config.cubes && Array.isArray(config.cubes)) {
          // This is a pattern-only file with the new format
          const visibleCubes = new Map()
          
          config.cubes.forEach(cube => {
            if (typeof cube.x === 'number' && 
                typeof cube.y === 'number' && 
                typeof cube.z === 'number') {
              
              // Process sides information
              const sides = {}
              if (Array.isArray(cube.sides)) {
                cube.sides.forEach(side => {
                  if (side.face && side.color) {
                    sides[side.face] = side.color
                  }
                })
              }
              
              visibleCubes.set(`${cube.x},${cube.y},${cube.z}`, { visible: true, sides })
            }
          })
          
          // Update the store
          logoCubeStore.loadPattern(visibleCubes)
          
          // Update colors if present
          if (config.colors) {
            if (config.colors.a) {
              handleMainColorChange(config.colors.a)
            }
            
            if (config.colors.b) {
              handleAccentColorChange(config.colors.b)
            }
          }
          
          // Update pattern name
          setPatternName(file.name.replace(/\.[^/.]+$/, "") || 'custom')
          
          alert('Pattern imported successfully!')
        } else if (Array.isArray(config)) {
          // Legacy format (plain array of coordinates)
          const visibleCubes = new Map()
          
          config.forEach(cube => {
            if (typeof cube.x === 'number' && 
                typeof cube.y === 'number' && 
                typeof cube.z === 'number') {
              
              // Process sides if they exist
              const sides = {}
              if (Array.isArray(cube.sides)) {
                cube.sides.forEach(side => {
                  if (side.face && side.color) {
                    sides[side.face] = side.color
                  }
                })
              }
              
              visibleCubes.set(`${cube.x},${cube.y},${cube.z}`, { visible: true, sides })
            }
          })
          
          // Update the store
          logoCubeStore.loadPattern(visibleCubes)
          
          // Update pattern name
          setPatternName(file.name.replace(/\.[^/.]+$/, "") || 'custom')
          
          alert('Legacy pattern imported successfully!')
        } else {
          console.error("Unrecognized data format:", config)
          alert('Failed to import: Unrecognized data format')
        }
      } catch (error) {
        console.error("Error importing configuration:", error)
        console.error("File content:", event.target.result)
        alert(`Failed to import: ${error.message}`)
      }
    }
    
    reader.readAsText(file)
    
    // Reset the file input so the same file can be loaded again
    e.target.value = null
  }

  return (
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
        label="Main Color" 
        value={mainColor} 
        onChange={handleMainColorChange} 
      />
      
      <ColorPickerInput 
        label="Accent Color" 
        value={accentColor} 
        onChange={handleAccentColorChange} 
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
      
      <h3>Keyboard Controls</h3>
      <div className="keyboard-controls">
        <p><strong>W/S</strong> - Move cursor Up/Down (Y axis)</p>
        <p><strong>A/D</strong> - Move cursor Left/Right (X axis)</p>
        <p><strong>Q/E</strong> - Move cursor Back/Forward (Z)</p>
        <p><strong>Space</strong> - Toggle cube visibility at cursor</p>
        <p><strong>1-6</strong> - Apply accent color to specific face on selected cube</p>
        <p><strong>Enter</strong> - Cycle through faces on selected cube</p>
        <p><strong>C</strong> - Clear all accent colors from selected cube</p>
        <p><strong>Escape</strong> - Deselect cube</p>
      </div>
      
      <h3>Mouse Controls</h3>
      <div className="mouse-controls">
        <p><strong>Left Click</strong> - Select cube and toggle visibility (adds or removes cube)</p>
        <p><strong>Right Click</strong> - Select cube, make it visible if not already, and cycle through faces to apply accent color</p>
      </div>
      
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <h3 style={{ margin: 0 }}>Camera Controls</h3>
        </AccordionSummary>
        <AccordionDetails>
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
            <p className="camera-instructions">
              <strong>Interact with 3D view:</strong><br/>
              • <strong>Left-click + drag</strong>: Rotate view<br/>
              • <strong>Right-click + drag</strong>: Pan view<br/>
              • <strong>Scroll wheel</strong>: Zoom in/out
            </p>
          </div>
        </AccordionDetails>
      </Accordion>
      
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <h3 style={{ margin: 0 }}>Accent Color Instructions</h3>
        </AccordionSummary>
        <AccordionDetails>
          <div className="accent-instructions">
            <p>
              The accent color feature allows you to add a second color to specific faces of each cube.
            </p>
            
            <h4>Using Accent Colors:</h4>
            <ol>
              <li>First select a cube by left-clicking it. This will toggle the cube's visibility if not already present.</li>
              <li>A selected cube will be highlighted in green.</li>
              <li>Right-click on the selected cube to cycle through faces and apply the accent color to each face.</li>
              <li>Alternatively, with a cube selected, use the number keys 1-6 to directly apply accent color to specific faces.</li>
              <li>Press Enter to cycle through faces on the selected cube.</li>
              <li>To clear all accent colors from a selected cube, press the 'C' key.</li>
              <li>Press Escape to deselect the cube when finished.</li>
            </ol>
            
            <div className="key-mapping">
              <p><strong>1</strong> - Front face</p>
              <p><strong>2</strong> - Back face</p>
              <p><strong>3</strong> - Left face</p>
              <p><strong>4</strong> - Right face</p>
              <p><strong>5</strong> - Top face</p>
              <p><strong>6</strong> - Bottom face</p>
            </div>
            
            <h4>Export Format:</h4>
            <p>
              When you export your design, the pattern will include both colors. 
              The exported JSON will list cubes with their positions and which faces 
              have the accent color applied.
            </p>
          </div>
        </AccordionDetails>
      </Accordion>
    </div>
  )
}

export default DesignerControls 