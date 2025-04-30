import { useState, useCallback } from 'react'
import useLogoCubeStore from '../../store/logoCubeStore'
import './PatternEditor.css'

/**
 * PatternEditor - UI component for editing cube patterns by adding or removing specific coordinates
 */
export function PatternEditor() {
  const [x, setX] = useState(0)
  const [y, setY] = useState(0)
  const [z, setZ] = useState(0)
  const [selectedCubes, setSelectedCubes] = useState([])
  const [customPatternName, setCustomPatternName] = useState('my-pattern')
  
  // Get size and visible cubes from store
  const size = useLogoCubeStore(state => state.size)
  const visibleCubes = useLogoCubeStore(state => state.visibleCubes)
  const toggleCube = useLogoCubeStore(state => state.toggleCube)
  const initializeHollowCube = useLogoCubeStore(state => state.initializeHollowCube)
  
  // Convert visible cubes map to array for rendering
  const visibleCubesArray = Array.from(visibleCubes.keys()).map(key => {
    const [x, y, z] = key.split(',').map(Number)
    return { x, y, z, key }
  })
  
  // Handle coordinate input changes
  const handleXChange = (e) => setX(Number(e.target.value))
  const handleYChange = (e) => setY(Number(e.target.value))
  const handleZChange = (e) => setZ(Number(e.target.value))
  
  // Toggle a cube by coordinates
  const handleToggleCube = useCallback(() => {
    if (x >= 0 && x < size && y >= 0 && y < size && z >= 0 && z < size) {
      toggleCube(x, y, z)
    }
  }, [x, y, z, size, toggleCube])
  
  // Add current coordinates to selection
  const handleAddToSelection = useCallback(() => {
    if (x >= 0 && x < size && y >= 0 && y < size && z >= 0 && z < size) {
      setSelectedCubes(prev => {
        // Don't add duplicates
        const coordKey = `${x},${y},${z}`
        if (prev.some(cube => cube.key === coordKey)) {
          return prev
        }
        return [...prev, { x, y, z, key: coordKey }]
      })
    }
  }, [x, y, z, size])
  
  // Remove cube from selection
  const handleRemoveFromSelection = useCallback((cubeKey) => {
    setSelectedCubes(prev => prev.filter(cube => cube.key !== cubeKey))
  }, [])
  
  // Generate pattern code
  const generatePatternCode = useCallback(() => {
    const patternObjects = selectedCubes.map(cube => `{x: ${cube.x}, y: ${cube.y}, z: ${cube.z}}`).join(',\n  ')
    
    const code = `// Custom pattern: ${customPatternName}
const ${customPatternName.replace(/[^a-zA-Z0-9_]/g, '_')}Pattern = [
  ${patternObjects}
]

// Function to check if a coordinate is in the pattern
export const ${customPatternName.replace(/[^a-zA-Z0-9_]/g, '_')}PatternFunc = (x, y, z) => {
  return ${customPatternName.replace(/[^a-zA-Z0-9_]/g, '_')}Pattern.some(
    cube => cube.x === x && cube.y === y && cube.z === z
  )
}
`
    return code
  }, [selectedCubes, customPatternName])
  
  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedCubes([])
  }, [])
  
  // Reset to hollow cube
  const handleResetToHollow = useCallback(() => {
    initializeHollowCube()
  }, [initializeHollowCube])
  
  return (
    <div className="pattern-editor">
      <h3>Pattern Editor</h3>
      
      <div className="editor-section">
        <h4>Coordinates</h4>
        <div className="coordinates-input">
          <div className="coordinate-field">
            <label>X:</label>
            <input
              type="number"
              min="0"
              max={size - 1}
              value={x}
              onChange={handleXChange}
            />
          </div>
          <div className="coordinate-field">
            <label>Y:</label>
            <input
              type="number"
              min="0"
              max={size - 1}
              value={y}
              onChange={handleYChange}
            />
          </div>
          <div className="coordinate-field">
            <label>Z:</label>
            <input
              type="number"
              min="0"
              max={size - 1}
              value={z}
              onChange={handleZChange}
            />
          </div>
        </div>
        
        <div className="button-group">
          <button onClick={handleToggleCube}>
            {visibleCubes.has(`${x},${y},${z}`) ? 'Remove Cube' : 'Add Cube'}
          </button>
          <button onClick={handleAddToSelection}>
            Add to Selection
          </button>
        </div>
      </div>
      
      <div className="editor-section">
        <h4>Selected Cubes</h4>
        <div className="selected-cubes-list">
          {selectedCubes.length > 0 ? (
            selectedCubes.map(cube => (
              <div key={cube.key} className="selected-cube-item">
                <span>{`(${cube.x}, ${cube.y}, ${cube.z})`}</span>
                <button 
                  className="remove-btn"
                  onClick={() => handleRemoveFromSelection(cube.key)}
                >
                  ×
                </button>
              </div>
            ))
          ) : (
            <p className="empty-message">No cubes selected yet</p>
          )}
        </div>
        
        <div className="button-group">
          <button onClick={handleClearSelection}>Clear Selection</button>
          <button onClick={handleResetToHollow}>Reset to Hollow Cube</button>
        </div>
      </div>
      
      <div className="editor-section">
        <h4>Export Pattern</h4>
        <div className="pattern-name-input">
          <label>Pattern Name:</label>
          <input
            type="text"
            value={customPatternName}
            onChange={(e) => setCustomPatternName(e.target.value)}
            placeholder="my-pattern"
          />
        </div>
        
        {selectedCubes.length > 0 && (
          <div className="pattern-code">
            <pre>{generatePatternCode()}</pre>
            <button 
              onClick={() => navigator.clipboard.writeText(generatePatternCode())}
              className="copy-btn"
            >
              Copy to Clipboard
            </button>
          </div>
        )}
      </div>
      
      <div className="editor-section">
        <h4>Visible Cubes ({visibleCubesArray.length})</h4>
        <div className="visible-cubes-list">
          {visibleCubesArray.slice(0, 50).map(cube => (
            <div key={cube.key} className="visible-cube-item">
              <span>{`(${cube.x}, ${cube.y}, ${cube.z})`}</span>
              <button
                className="toggle-btn"
                onClick={() => toggleCube(cube.x, cube.y, cube.z)}
              >
                ×
              </button>
            </div>
          ))}
          {visibleCubesArray.length > 50 && (
            <p className="more-message">...and {visibleCubesArray.length - 50} more</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default PatternEditor 