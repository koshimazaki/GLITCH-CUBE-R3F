import { useRef } from 'react'
import useLogoCubeStore from '../../store/logoCubeStore'
import ColorPickerInput from './ColorPickerInput'
import './DesignerControls.css'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

const DesignerControls = ({ 
  debugOptions, 
  handleDebugToggle, 
  patternName, 
  setPatternName, 
  cubeColor, 
  textColor, 
  handleCubeColorChange, 
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
          handleCubeColorChange(config.visual?.color || '#fc0398')
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
  )
}

export default DesignerControls 