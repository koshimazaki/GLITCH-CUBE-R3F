import { useState, useMemo } from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import useLogoCubeStore from '../../store/logoCubeStore'

/**
 * CoordinateLabels - Renders text labels with coordinates for each cube in the grid
 * This helps identify which cubes should be included/excluded when designing the logo
 */
export function CoordinateLabels({
  fontSize = 0.15,
  color = '#ffffff',
  textOpacity = 0.8,
  showOnlyVisible = true,
  textOffset = 0.05,
  ...props
}) {
  // Get the grid size and visible cubes from the store
  const size = useLogoCubeStore(state => state.size)
  const visibleCubes = useLogoCubeStore(state => state.visibleCubes)
  const cubeSize = useLogoCubeStore(state => state.visual.cubeSize)
  const gap = useLogoCubeStore(state => state.visual.gap)
  
  // Generate all coordinates that should have labels
  const [coordinates] = useState(() => {
    const allCoords = []
    const offset = (size - 1) / 2
    
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        for (let z = 0; z < size; z++) {
          const key = `${x},${y},${z}`
          
          // Skip if showing only visible cubes and this one isn't visible
          if (showOnlyVisible && !visibleCubes.has(key)) {
            continue
          }
          
          // Calculate world position
          const worldX = (x - offset) * (cubeSize + gap)
          const worldY = (y - offset) * (cubeSize + gap)
          const worldZ = (z - offset) * (cubeSize + gap)
          
          allCoords.push({
            id: key,
            position: [worldX, worldY, worldZ],
            gridPosition: [x, y, z]
          })
        }
      }
    }
    
    return allCoords
  })
  
  return (
    <group {...props}>
      {coordinates.map(coord => {
        const [x, y, z] = coord.gridPosition
        const [worldX, worldY, worldZ] = coord.position
        
        return (
          <Text
            key={coord.id}
            position={[
              worldX, 
              worldY + (cubeSize / 2) + textOffset, 
              worldZ
            ]}
            fontSize={fontSize}
            color={color}
            anchorX="center"
            anchorY="bottom"
            fillOpacity={textOpacity}
            renderOrder={1}
          >
            {`${x},${y},${z}`}
            <meshBasicMaterial 
              transparent 
              opacity={textOpacity} 
              depthTest={false}
            />
          </Text>
        )
      })}
    </group>
  )
}

/**
 * CubeWithCoordinates - Renders a cube with its coordinates as textures on each face
 */
export function CubeWithCoordinates({ 
  position, 
  gridPosition, 
  cubeSize = 0.8,
  color = '#fc0398',
  accentColor = '#333333',
  textColor = '#ffffff',
  wireframe = false,
  sides = [], // Array of face objects { face: 'front', color: 'b' }
  ...props 
}) {
  const [x, y, z] = gridPosition
  const coordText = `${x},${y},${z}`
  
  // Create textures for each face (standard and accent)
  const textures = useMemo(() => {
    // Create base canvas texture
    const createCanvasTexture = (bgColor) => {
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 256
      const context = canvas.getContext('2d')
      
      // Background color
      context.fillStyle = bgColor
      context.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw border
      context.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      context.lineWidth = 8
      context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16)
      
      // Draw text
      context.font = 'bold 48px Arial'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillStyle = textColor
      
      // Draw coordinates
      context.fillText(coordText, canvas.width / 2, canvas.height / 2)
      
      // Create texture
      const texture = new THREE.CanvasTexture(canvas)
      texture.needsUpdate = true
      return texture
    }
    
    // Create a texture for each color
    return {
      main: createCanvasTexture(color),
      accent: createCanvasTexture(accentColor)
    }
  }, [coordText, color, accentColor, textColor])
  
  // Create materials for each face
  const materials = useMemo(() => {
    // Map from face name to material array index
    const faceIndices = {
      right: 0,  // +X
      left: 1,   // -X
      top: 2,    // +Y
      bottom: 3, // -Y
      front: 4,  // +Z
      back: 5    // -Z
    }
    
    // Create default materials (all main color)
    const defaultMaterials = Array(6).fill().map(() => 
      new THREE.MeshStandardMaterial({ 
        color, 
        map: textures.main,
        wireframe 
      })
    )
    
    // Apply accent colors for specific sides
    if (Array.isArray(sides)) {
      sides.forEach(side => {
        if (side.color === 'b' && Object.prototype.hasOwnProperty.call(faceIndices, side.face)) {
          const index = faceIndices[side.face]
          defaultMaterials[index] = new THREE.MeshStandardMaterial({
            color: accentColor,
            map: textures.accent,
            wireframe
          })
        }
      })
    }
    
    return defaultMaterials
  }, [color, accentColor, textures, wireframe, sides])
  
  return (
    <mesh position={position} {...props}>
      <boxGeometry args={[cubeSize, cubeSize, cubeSize]} />
      <primitive object={new THREE.MeshStandardMaterial()} attach="material" />
      {materials.map((material, index) => (
        <primitive key={index} object={material} attach={`material-${index}`} />
      ))}
    </mesh>
  )
}

/**
 * TexturedLogoCube - Renders a cube grid with coordinate textures
 */
export function TexturedLogoCube({
  size = 5,
  cubeSize = 0.8,
  gap = 0.2,
  mainColor = '#fc0398',
  accentColor = '#333333',
  textColor = '#000000',
  wireframe = false,
  ...props
}) {
  // Get visible cubes from store
  const visibleCubes = useLogoCubeStore(state => state.visibleCubes)
  const offset = (size - 1) / 2
  
  // Generate visible cube positions
  const cubes = useMemo(() => {
    const cubeList = []
    
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        for (let z = 0; z < size; z++) {
          const key = `${x},${y},${z}`
          
          // Skip if this cube isn't visible
          if (!visibleCubes.has(key)) {
            continue
          }
          
          // Get the sides array for this cube (for accent colors)
          const sides = visibleCubes.get(key) || []
          
          // Calculate world position
          const worldX = (x - offset) * (cubeSize + gap)
          const worldY = (y - offset) * (cubeSize + gap)
          const worldZ = (z - offset) * (cubeSize + gap)
          
          cubeList.push({
            id: key,
            position: [worldX, worldY, worldZ],
            gridPosition: [x, y, z],
            sides
          })
        }
      }
    }
    
    return cubeList
  }, [size, cubeSize, gap, visibleCubes, offset])
  
  return (
    <group {...props}>
      {cubes.map(cube => (
        <CubeWithCoordinates
          key={cube.id}
          position={cube.position}
          gridPosition={cube.gridPosition}
          cubeSize={cubeSize}
          color={mainColor}
          accentColor={accentColor}
          textColor={textColor}
          wireframe={wireframe}
          sides={cube.sides}
        />
      ))}
    </group>
  )
}

/**
 * CubeHighlighter - Renders a wireframe box around selected cube for highlighting
 */
export function CubeHighlighter({ 
  coordinates, 
  color = '#ff0000',
  wireframeWidth = 1,
  ...props 
}) {
  const size = useLogoCubeStore(state => state.size)
  const cubeSize = useLogoCubeStore(state => state.visual.cubeSize)
  const gap = useLogoCubeStore(state => state.visual.gap)
  
  if (!coordinates || coordinates.length !== 3) {
    return null
  }
  
  // Calculate world position
  const [x, y, z] = coordinates
  const offset = (size - 1) / 2
  
  const worldX = (x - offset) * (cubeSize + gap)
  const worldY = (y - offset) * (cubeSize + gap)
  const worldZ = (z - offset) * (cubeSize + gap)
  
  return (
    <lineSegments {...props} position={[worldX, worldY, worldZ]}>
      <edgesGeometry args={[new THREE.BoxGeometry(cubeSize + 0.04, cubeSize + 0.04, cubeSize + 0.04)]} />
      <lineBasicMaterial color={color} linewidth={wireframeWidth} />
    </lineSegments>
  )
}

/**
 * GridCoordinatesHelper - Renders axes and planes to help visualize the coordinate system
 */
export function GridCoordinatesHelper({ size, ...props }) {
  const storeSize = useLogoCubeStore(state => state.size)
  const gridSize = size || storeSize
  const halfSize = gridSize * 0.6
  
  return (
    <group {...props}>
      {/* X axis - red */}
      <group position={[halfSize, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.03, 0.03, halfSize * 2, 8]} />
          <meshBasicMaterial color="red" />
        </mesh>
        <Text
          position={[halfSize * 0.3, 0, 0]}
          fontSize={0.3}
          color="red"
        >
          X
        </Text>
      </group>
      
      {/* Y axis - green */}
      <group position={[0, halfSize, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, halfSize * 2, 8]} />
          <meshBasicMaterial color="green" />
        </mesh>
        <Text
          position={[0, halfSize * 0.3, 0]}
          fontSize={0.3}
          color="green"
        >
          Y
        </Text>
      </group>
      
      {/* Z axis - blue */}
      <group position={[0, 0, halfSize]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, halfSize * 2, 8]} />
          <meshBasicMaterial color="blue" />
        </mesh>
        <Text
          position={[0, 0, halfSize * 0.3]}
          fontSize={0.3}
          color="blue"
        >
          Z
        </Text>
      </group>
    </group>
  )
}

export default CoordinateLabels 