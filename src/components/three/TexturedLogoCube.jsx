import { useMemo } from 'react'
import * as THREE from 'three'
import useLogoCubeStore from '../../store/logoCubeStore'

// Tracking to avoid duplicate material creation
const processedCubes = new Set()

// This component renders a single cube with configurable textures/colors on each face
export function CubeWithTextures({ coordinates, wireframe, mainColor, accentColor }) {
  const [x, y, z] = coordinates
  const key = `${x},${y},${z}`
  
  // Get cube data from store
  const cubeData = useLogoCubeStore(state => state.visibleCubes.get(key))
  
  // Get sizing info from store - moved before early return to avoid conditional hooks
  const size = useLogoCubeStore(state => state.visual.cubeSize)
  const gap = useLogoCubeStore(state => state.visual.gap)
  
  // Create materials for each face in Three.js order:
  // 0: right (+X), 1: left (-X), 2: top (+Y), 3: bottom (-Y), 4: front (+Z), 5: back (-Z)
  // This must match the faces array in DesignerExperience.jsx: ['front', 'back', 'left', 'right', 'top', 'bottom']
  // Map our logical face names to Three.js material indices
  const faceToMaterialIndex = useMemo(() => ({
    'right': 0,   // +X face
    'left': 1,    // -X face
    'top': 2,     // +Y face (up)
    'bottom': 3,  // -Y face (down)
    'front': 4,   // +Z face (forward)
    'back': 5     // -Z face (backward)
  }), [])
  
  // Generate materials for all 6 faces - moved before early return to avoid conditional hooks
  const materials = useMemo(() => {
    // If cube isn't visible, return empty materials (will return null later)
    if (!cubeData || !cubeData.visible) return Array(6).fill(null)
    
    // Extract sides data
    const sides = cubeData.sides || {}
    
    // Debug: log when creating materials for a cube with textures
    // Use a tracking set to avoid duplicate logging
    if (Object.keys(sides).length > 0) {
      const sidesKey = JSON.stringify(sides) + key
      if (!processedCubes.has(sidesKey)) {
        console.log(`Creating materials for cube ${key} with sides:`, sides)
        processedCubes.add(sidesKey)
        
        // Limit the set size to avoid memory leaks
        if (processedCubes.size > 100) {
          processedCubes.clear()
        }
      }
    }
    
    // Create an array of 6 default materials using the main color
    const mats = Array(6).fill().map(() => 
      new THREE.MeshStandardMaterial({
        color: mainColor,
        wireframe: wireframe
      })
    )
    
    // Apply accent color to specific faces
    Object.entries(sides).forEach(([face, color]) => {
      // Use Object.prototype.hasOwnProperty.call instead of direct method access
      if (color === 'b' && Object.prototype.hasOwnProperty.call(faceToMaterialIndex, face)) {
        const materialIndex = faceToMaterialIndex[face]
        mats[materialIndex] = new THREE.MeshStandardMaterial({
          color: accentColor,
          wireframe: wireframe
        })
        
        // Log texture application but avoid duplicates
        const appliedKey = key + face + accentColor
        if (!processedCubes.has(appliedKey)) {
          console.log(`Applied ${accentColor} to ${face} (materialIndex: ${materialIndex}) of cube ${key}`)
          processedCubes.add(appliedKey)
        }
      }
    })
    
    return mats
  }, [cubeData, mainColor, accentColor, wireframe, faceToMaterialIndex, key])
  
  // If cube isn't visible, don't render anything
  if (!cubeData || !cubeData.visible) return null
  
  // Calculate position based on size/gap
  const offset = 2 // For a 5x5x5 grid, offset is 2
  
  // Calculate the world position - be explicit about coordinate mapping
  // In Three.js: X is right/left, Y is up/down, Z is forward/backward
  const worldX = (x - offset) * (size + gap) // X corresponds to left/right
  const worldY = (y - offset) * (size + gap) // Y corresponds to up/down
  const worldZ = (z - offset) * (size + gap) // Z corresponds to forward/backward
  
  // Log position for debugging
  if (!processedCubes.has(`position-${key}`)) {
    console.log(`Placing cube at grid (${x},${y},${z}) -> world (${worldX},${worldY},${worldZ})`)
    processedCubes.add(`position-${key}`)
  }
  
  return (
    <mesh position={[worldX, worldY, worldZ]}>
      <boxGeometry args={[size, size, size]} />
      {materials.map((material, index) => (
        <primitive key={`${key}-face-${index}`} object={material} attach={`material-${index}`} />
      ))}
    </mesh>
  )
}

// Parent component that renders all visible cubes
export function TexturedLogoCube({ wireframe, mainColor, accentColor }) {
  // Get all visible cubes from store
  const visibleCubes = useLogoCubeStore(state => state.visibleCubes)
  
  // Force the component to rerender when cube sides change
  // This is necessary because Maps don't trigger rerenders with internal changes
  const cubesVersion = useLogoCubeStore(state => state.cubesVersion || 0)
  
  // Create array of coordinates from visible cubes
  const cubeCoordinates = useMemo(() => {
    // Reset processed cubes tracking on full re-render
    processedCubes.clear()
    
    return Array.from(visibleCubes.keys()).map(key => {
      const [x, y, z] = key.split(',').map(Number)
      return [x, y, z]
    })
  }, [visibleCubes, cubesVersion]) // Add cubesVersion to dependencies
  
  return (
    <group>
      {cubeCoordinates.map(coords => (
        <CubeWithTextures
          key={`cube-${coords.join(',')}`}
          coordinates={coords}
          wireframe={wireframe}
          mainColor={mainColor}
          accentColor={accentColor}
        />
      ))}
    </group>
  )
} 