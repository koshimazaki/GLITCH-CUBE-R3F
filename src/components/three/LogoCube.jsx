import { useRef, useMemo, useState, useCallback, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Instance, Instances } from '@react-three/drei'
import * as THREE from 'three'
import { useControls } from 'leva'
import useLogoCubeStore from '../../store/logoCubeStore'

/**
 * GNS Logo Cube - Renders a 5x5x5 cube with specified voxels present/missing
 */
export function LogoCube({
  size = 5,
  cubeSize = 0.8,
  gap = 0.2,
  color = '#fc0398',
  animationSpeed = 1,
  animationType = 'wave',
  interactionFactor = 0.3,
  useStoreConfig = false,
  ...props
}) {
  // Reference to the entire instances group
  const groupRef = useRef()
  
  // Create a temp object for matrix calculations
  const tempObject = useMemo(() => new THREE.Object3D(), [])
  
  // Mouse position state for interactivity
  const [mouse, setMouse] = useState([0, 0])
  
  // Get configuration from store if enabled - use selectors to avoid re-renders
  const storeSize = useLogoCubeStore(state => state.size)
  const storeVisualCubeSize = useLogoCubeStore(state => state.visual.cubeSize)
  const storeVisualGap = useLogoCubeStore(state => state.visual.gap)
  const storeVisualColor = useLogoCubeStore(state => state.visual.color)
  const storeAnimationType = useLogoCubeStore(state => state.animation.type)
  const storeAnimationSpeed = useLogoCubeStore(state => state.animation.speed)
  const storeInteractionFactor = useLogoCubeStore(state => state.animation.interactionFactor)
  const storeVisibleCubes = useLogoCubeStore(state => state.visibleCubes)
  
  // Memoize final values to prevent unnecessary rerenders
  const finalValues = useMemo(() => ({
    size: useStoreConfig ? storeSize : size,
    cubeSize: useStoreConfig ? storeVisualCubeSize : cubeSize,
    gap: useStoreConfig ? storeVisualGap : gap,
    color: useStoreConfig ? storeVisualColor : color,
    animationType: useStoreConfig ? storeAnimationType : animationType,
    animationSpeed: useStoreConfig ? storeAnimationSpeed : animationSpeed,
    interactionFactor: useStoreConfig ? storeInteractionFactor : interactionFactor,
    offset: ((useStoreConfig ? storeSize : size) - 1) / 2
  }), [
    useStoreConfig, 
    size, cubeSize, gap, color, animationType, animationSpeed, interactionFactor,
    storeSize, storeVisualCubeSize, storeVisualGap, storeVisualColor, 
    storeAnimationType, storeAnimationSpeed, storeInteractionFactor
  ])
  
  // Define which cubes are visible in the 5x5x5 grid
  const cubePositions = useMemo(() => {
    const { size, cubeSize, gap, offset } = finalValues
    const pattern = []
    
    // If using store configuration, use the visibleCubes map
    if (useStoreConfig) {
      for (const [key, value] of storeVisibleCubes.entries()) {
        if (value === 1) {
          const [x, y, z] = key.split(',').map(Number)
          
          // Convert from grid position to world position
          const worldX = (x - offset) * (cubeSize + gap)
          const worldY = (y - offset) * (cubeSize + gap)
          const worldZ = (z - offset) * (cubeSize + gap)
          
          pattern.push({
            id: key,
            position: [worldX, worldY, worldZ],
            gridPosition: [x, y, z],
          })
        }
      }
    } else {
      // Default pattern: Creating a hollow cube
      for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
          for (let z = 0; z < size; z++) {
            // Make cube visible if it's on any edge of the grid
            if (
              x === 0 || x === size - 1 ||
              y === 0 || y === size - 1 ||
              z === 0 || z === size - 1
            ) {
              // Convert from grid position to world position
              const worldX = (x - offset) * (cubeSize + gap)
              const worldY = (y - offset) * (cubeSize + gap)
              const worldZ = (z - offset) * (cubeSize + gap)
              
              pattern.push({
                id: `${x},${y},${z}`,
                position: [worldX, worldY, worldZ],
                gridPosition: [x, y, z],
              })
            }
          }
        }
      }
    }
    
    return pattern
  }, [finalValues, useStoreConfig, storeVisibleCubes])
  
  // Initialize the instances once
  useEffect(() => {
    if (groupRef.current && cubePositions.length > 0) {
      // Set initial positions without animation for all cubes
      cubePositions.forEach((cube, i) => {
        const [worldX, worldY, worldZ] = cube.position
        
        tempObject.position.set(worldX, worldY, worldZ)
        tempObject.rotation.set(0, 0, 0)
        tempObject.updateMatrix()
        
        groupRef.current.setMatrixAt(i, tempObject.matrix)
      })
      
      groupRef.current.instanceMatrix.needsUpdate = true
    }
  }, [cubePositions, tempObject])
  
  // Memoize animation function to prevent recreation on each frame
  const animateCubes = useCallback((state) => {
    const { clock, mouse: sceneMouse } = state
    const { animationSpeed, animationType, interactionFactor } = finalValues
    const time = clock.getElapsedTime() * animationSpeed
    
    // Don't animate if animation type is 'none'
    if (animationType === 'none') return
    
    // Update mouse position with smoothing
    setMouse((prev) => [
      prev[0] + (sceneMouse.x - prev[0]) * 0.1,
      prev[1] + (sceneMouse.y - prev[1]) * 0.1
    ])
    
    if (!groupRef.current) return
    
    // Animate each cube
    cubePositions.forEach((cube, i) => {
      const { position, gridPosition } = cube
      
      // Get base position
      const [baseX, baseY, baseZ] = position
      
      // Apply different animations based on the selected type
      let animX = 0, animY = 0, animZ = 0
      
      switch (animationType) {
        case 'wave': {
          // Wave animation based on grid position and time
          animY = Math.sin(time + gridPosition[0] + gridPosition[2]) * 0.2
          break
        }
          
        case 'breathe': {
          // Breathing animation - all cubes move slightly in and out
          const breathFactor = Math.sin(time) * 0.1
          animX = position[0] * breathFactor
          animY = position[1] * breathFactor
          animZ = position[2] * breathFactor
          break
        }
          
        case 'twist': {
          // Twist animation - rotate around the center
          const angle = time * 0.2
          const distance = Math.sqrt(position[0] ** 2 + position[2] ** 2)
          animX = Math.cos(angle) * distance * 0.1
          animZ = Math.sin(angle) * distance * 0.1
          break
        }
          
        case 'scatter': {
          // Scatter and reassemble
          const scatterPhase = (Math.sin(time * 0.3) + 1) / 2 // 0 to 1
          const randomOffset = Math.sin(i * 5318.323 + time * 0.5) * scatterPhase
          animX = randomOffset * 1.5
          animY = Math.sin(i * 1234.123 + time * 0.5) * scatterPhase * 1.5
          animZ = Math.cos(i * 8675.309 + time * 0.5) * scatterPhase * 1.5
          break
        }
          
        default:
          break
      }
      
      // Add mouse interaction
      animX += mouse[0] * interactionFactor * position[0]
      animY += mouse[1] * interactionFactor * position[1]
      
      // Apply position with animation
      tempObject.position.set(
        baseX + animX,
        baseY + animY,
        baseZ + animZ
      )
      
      // Apply subtle rotation based on animation
      tempObject.rotation.set(
        mouse[1] * 0.1 * interactionFactor,
        mouse[0] * 0.1 * interactionFactor,
        0
      )
      
      // Update the matrix
      tempObject.updateMatrix()
      
      // Set the matrix for this instance
      groupRef.current.setMatrixAt(i, tempObject.matrix)
    })
    
    // Mark instance matrix as needing an update
    groupRef.current.instanceMatrix.needsUpdate = true
  }, [cubePositions, finalValues, mouse, tempObject])
  
  // Animation frame
  useFrame(animateCubes)
  
  return (
    <group {...props}>
      <Instances limit={125} ref={groupRef} castShadow receiveShadow>
        <boxGeometry args={[finalValues.cubeSize, finalValues.cubeSize, finalValues.cubeSize]} />
        <meshStandardMaterial color={finalValues.color} />
        {cubePositions.map((cube) => (
          <Instance key={cube.id} />
        ))}
      </Instances>
    </group>
  )
}

/**
 * LogoCubeWithControls - Component to add debug controls for the cube using Leva
 */
export function LogoCubeWithControls(props) {
  const controls = useControls('Logo Cube', {
    color: '#fc0398',
    cubeSize: { value: 0.8, min: 0.1, max: 1, step: 0.01 },
    gap: { value: 0.2, min: 0, max: 1, step: 0.01 },
    animationSpeed: { value: 1, min: 0, max: 5, step: 0.1 },
    animationType: { 
      value: 'wave', 
      options: ['none', 'wave', 'breathe', 'twist', 'scatter']
    },
    interactionFactor: { value: 0.3, min: 0, max: 2, step: 0.1 },
    useStore: false,
  })
  
  return <LogoCube {...props} {...controls} useStoreConfig={controls.useStore} />
}

/**
 * LogoCubeWithStore - Component that directly uses the store configuration
 */
export function LogoCubeWithStore(props) {
  return <LogoCube {...props} useStoreConfig={true} />
}

export default LogoCube 