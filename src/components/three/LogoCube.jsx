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
  mainColor = '#fc0398',
  accentColor = '#333333',
  animationSpeed = 1,
  animationType = 'wave',
  interactionFactor = 0.3,
  useStoreConfig = false,
  materialSettings = {
    roughness: 0.3,
    metalness: 0.5, 
    envMapIntensity: 1,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2
  },
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
  const storeVisualColors = useLogoCubeStore(state => state.visual.colors || { a: '#fc0398', b: '#333333' })
  const storeAnimationType = useLogoCubeStore(state => state.animation.type)
  const storeAnimationSpeed = useLogoCubeStore(state => state.animation.speed)
  const storeInteractionFactor = useLogoCubeStore(state => state.animation.interactionFactor)
  const storeVisibleCubes = useLogoCubeStore(state => state.visibleCubes)
  const storeAnimationDelay = useLogoCubeStore(state => state.animation.delay)
  const storePosition = useLogoCubeStore(state => state.position)
  
  // Memoize final values to prevent unnecessary rerenders
  const finalValues = useMemo(() => ({
    size: useStoreConfig ? storeSize : size,
    cubeSize: useStoreConfig ? storeVisualCubeSize : cubeSize,
    gap: useStoreConfig ? storeVisualGap : gap,
    mainColor: useStoreConfig ? storeVisualColors.a : mainColor,
    accentColor: useStoreConfig ? storeVisualColors.b : accentColor,
    animationType: useStoreConfig ? storeAnimationType : animationType,
    animationSpeed: useStoreConfig ? storeAnimationSpeed : animationSpeed,
    interactionFactor: useStoreConfig ? storeInteractionFactor : interactionFactor,
    offset: ((useStoreConfig ? storeSize : size) - 1) / 2,
    delay: useStoreConfig ? (storeAnimationDelay || 0.1) : 0.1
  }), [
    useStoreConfig, 
    size, cubeSize, gap, mainColor, accentColor, animationType, animationSpeed, interactionFactor,
    storeSize, storeVisualCubeSize, storeVisualGap, storeVisualColors, 
    storeAnimationType, storeAnimationSpeed, storeInteractionFactor, storeAnimationDelay
  ])
  
  // Define which cubes are visible in the 5x5x5 grid
  const cubePositions = useMemo(() => {
    const { size, cubeSize, gap, offset } = finalValues
    const pattern = []
    
    // If using store configuration, use the visibleCubes map
    if (useStoreConfig) {
      for (const [key, cubeData] of storeVisibleCubes.entries()) {
        if (cubeData.visible) {
          const [x, y, z] = key.split(',').map(Number)
          
          // Convert from grid position to world position
          const worldX = (x - offset) * (cubeSize + gap)
          const worldY = (y - offset) * (cubeSize + gap)
          const worldZ = (z - offset) * (cubeSize + gap)
          
          pattern.push({
            id: key,
            position: [worldX, worldY, worldZ],
            gridPosition: [x, y, z],
            sides: cubeData.sides || {}
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
                sides: {}
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
      console.log(`LogoCube initializing with ${cubePositions.length} cubes`);
      
      // Reset instanceMatrix to ensure clean state
      for (let i = 0; i < 125; i++) {
        // Move unused instances far away
        if (i >= cubePositions.length) {
          tempObject.position.set(10000, 10000, 10000); // Move far away
        }
        tempObject.updateMatrix();
        groupRef.current.setMatrixAt(i, tempObject.matrix);
      }
      
      // Set initial positions without animation for visible cubes
      cubePositions.forEach((cube, i) => {
        const [worldX, worldY, worldZ] = cube.position;
        
        tempObject.position.set(worldX, worldY, worldZ);
        tempObject.rotation.set(0, 0, 0);
        tempObject.updateMatrix();
        
        groupRef.current.setMatrixAt(i, tempObject.matrix);
      });
      
      groupRef.current.instanceMatrix.needsUpdate = true;
      groupRef.current.count = cubePositions.length; // Set count to match actual visible cubes
    }
  }, [cubePositions, tempObject]);
  
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
          
        case 'falling': {
          // Falling cubes animation (great for loading screens)
          const { delay } = finalValues
          // Each cube starts falling at a different time based on index
          const startDelay = i * delay
          const fallStart = Math.max(0, time - startDelay)
          
          // If this cube's time to fall has come
          if (fallStart > 0) {
            // Calculate fall position with gravity
            const gravity = 9.8
            const fallDistance = 20 // Starting height above final position
            const fallTime = fallStart
            
            // Standard falling equation with gravity
            let fallY = fallDistance - 0.5 * gravity * fallTime * fallTime
            
            // Once it reaches its final position, add a bounce effect
            if (fallY <= 0) {
              const timeSinceLanding = fallTime - Math.sqrt(2 * fallDistance / gravity)
              
              if (timeSinceLanding > 0) {
                // Calculate bounce height based on time since landing
                const bounceHeight = 2 * Math.exp(-timeSinceLanding * 2) // Diminishing bounce
                fallY = bounceHeight * Math.abs(Math.sin(timeSinceLanding * 5))
              } else {
                fallY = 0
              }
            }
            
            animY = fallY
          } else {
            // Before falling, keep the cube way above its final position
            animY = 20
          }
          break
        }
          
        case 'disconnect': {
          // Disconnection effect where cubes pull apart and then reconnect
          // Use a periodic function to create a disconnection cycle
          const cycleLength = 4.0 // Seconds for full disconnect-reconnect
          const cycleProgress = (time % cycleLength) / cycleLength
          
          // Phase 1: Pull apart (0-0.4)
          // Phase 2: Hold disconnected (0.4-0.6)
          // Phase 3: Reconnect (0.6-1.0)
          
          let disconnectionFactor = 0
          
          if (cycleProgress < 0.4) {
            // Phase 1: Pulling apart (ease-in)
            disconnectionFactor = Math.pow(cycleProgress / 0.4, 2)
          } else if (cycleProgress < 0.6) {
            // Phase 2: Hold disconnected
            disconnectionFactor = 1
          } else {
            // Phase 3: Reconnect (ease-out)
            disconnectionFactor = Math.pow(1 - (cycleProgress - 0.6) / 0.4, 2)
          }
          
          // Direction of disconnection based on position relative to center
          // Each cube moves away from center
          const direction = [
            position[0] === 0 ? 0 : Math.sign(position[0]),
            position[1] === 0 ? 0 : Math.sign(position[1]),
            position[2] === 0 ? 0 : Math.sign(position[2]),
          ]
          
          // Apply disconnection effect with random jitter per cube
          const jitter = Math.sin(i * 1000) * 0.3
          animX = direction[0] * disconnectionFactor * (1.5 + jitter)
          animY = direction[1] * disconnectionFactor * (1.5 + jitter)
          animZ = direction[2] * disconnectionFactor * (1.5 + jitter)
          
          // Add slight rotation during disconnection
          tempObject.rotation.set(
            disconnectionFactor * Math.sin(i) * Math.PI * 0.2,
            disconnectionFactor * Math.cos(i) * Math.PI * 0.2,
            disconnectionFactor * Math.sin(i * 2) * Math.PI * 0.2
          )
          break
        }
          
        case 'assembly': {
          // Assembly/disassembly animation - cubes come together to form the shape
          const { delay } = finalValues
          const assemblyDuration = 2.0 // seconds
          const fullCycleTime = 5.0 // total cycle time including pause
          
          // Calculate the current phase in the cycle (0 to 1)
          const cycleTime = time % fullCycleTime
          const cyclePhase = cycleTime / fullCycleTime
          
          // Determine if we're in assembly or disassembly phase
          const isAssembling = cyclePhase < 0.5
          
          // Calculate progress through current phase
          const phaseProgress = isAssembling ? 
            cyclePhase * 2 : // 0->0.5 maps to 0->1 
            (1 - (cyclePhase - 0.5) * 2) // 0.5->1 maps to 1->0
          
          // Delay start based on cube index for staggered effect
          const startDelay = i * delay
          const adjustedProgress = Math.max(0, Math.min(1, (phaseProgress * assemblyDuration - startDelay) / (assemblyDuration - startDelay * cubePositions.length / 20)))
          
          // Calculate the starting position (far from center)
          const startPositionFactor = 10 // how far cubes start from center
          const randomDir = [
            Math.sin(i * 123.456),
            Math.sin(i * 234.567),
            Math.sin(i * 345.678)
          ]
          
          // Interpolate between scattered position and final position
          const interpolationFactor = Math.pow(adjustedProgress, 2) // Ease-in curve
          
          animX = randomDir[0] * startPositionFactor * (1 - interpolationFactor)
          animY = randomDir[1] * startPositionFactor * (1 - interpolationFactor)
          animZ = randomDir[2] * startPositionFactor * (1 - interpolationFactor)
          
          // Add rotation during assembly
          const rotationAmount = (1 - interpolationFactor) * Math.PI * 2
          tempObject.rotation.set(
            randomDir[0] * rotationAmount,
            randomDir[1] * rotationAmount,
            randomDir[2] * rotationAmount
          )
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
    groupRef.current.count = cubePositions.length // Ensure count stays at the correct value during animations
    
    // Move any unused instances far away from the scene
    for (let i = cubePositions.length; i < 125; i++) {
      tempObject.position.set(10000, 10000, 10000)
      tempObject.updateMatrix()
      groupRef.current.setMatrixAt(i, tempObject.matrix)
    }
  }, [cubePositions, finalValues, mouse, tempObject])
  
  // Animation frame
  useFrame(animateCubes)
  
  return (
    <group 
      {...props} 
      position={[
        (useStoreConfig ? storePosition.x : 0) + (props.position?.[0] || 0),
        (useStoreConfig ? storePosition.y : 0) + (props.position?.[1] || 0),
        (useStoreConfig ? storePosition.z : 0) + (props.position?.[2] || 0)
      ]}
    >
      <Instances limit={125} count={cubePositions.length} ref={groupRef} castShadow receiveShadow>
        <boxGeometry args={[finalValues.cubeSize, finalValues.cubeSize, finalValues.cubeSize]} />
        <meshPhysicalMaterial 
          color={finalValues.mainColor} 
          roughness={materialSettings.roughness}
          metalness={materialSettings.metalness}
          envMapIntensity={materialSettings.envMapIntensity}
          clearcoat={materialSettings.clearcoat}
          clearcoatRoughness={materialSettings.clearcoatRoughness}
          side={THREE.DoubleSide}
          toneMapped={true}
        />
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
    mainColor: '#fc0398',
    accentColor: '#333333',
    cubeSize: { value: 0.8, min: 0.1, max: 1, step: 0.01 },
    gap: { value: 0.2, min: 0, max: 1, step: 0.01 },
    animationSpeed: { value: 1, min: 0, max: 5, step: 0.1 },
    animationType: { 
      value: 'wave', 
      options: ['none', 'wave', 'breathe', 'twist', 'scatter', 'falling', 'disconnect', 'assembly']
    },
    interactionFactor: { value: 0.3, min: 0, max: 2, step: 0.1 },
    useStore: false,
    materialSettings: useControls('Material Settings', {
      roughness: { value: 0.3, min: 0, max: 1, step: 0.01 },
      metalness: { value: 0.5, min: 0, max: 1, step: 0.01 },
      envMapIntensity: { value: 1, min: 0, max: 5, step: 0.1 },
      clearcoat: { value: 0.5, min: 0, max: 1, step: 0.01 },
      clearcoatRoughness: { value: 0.2, min: 0, max: 1, step: 0.01 },
    }),
  })
  
  // Update the LogoCube component to use the material settings
  const logoProps = {
    ...props,
    ...controls,
    materialSettings: controls.materialSettings,
    useStoreConfig: controls.useStore
  }
  
  return <LogoCube {...logoProps} />
}

/**
 * LogoCubeWithStore - Component that directly uses the store configuration
 */
export function LogoCubeWithStore({ gridSize, fadeDistance, ...props }) {
  // Get values from store
  const size = useLogoCubeStore(state => state.size)
  const cubeSize = useLogoCubeStore(state => state.visual.cubeSize)
  const gap = useLogoCubeStore(state => state.visual.gap)
  const mainColor = useLogoCubeStore(state => state.visual.colors?.a || '#fc0398')
  const accentColor = useLogoCubeStore(state => state.visual.colors?.b || '#333333')
  const animationType = useLogoCubeStore(state => state.animation.type)
  const animationSpeed = useLogoCubeStore(state => state.animation.speed)
  const interactionFactor = useLogoCubeStore(state => state.animation.interactionFactor)
  
  return (
    <LogoCube 
      size={size}
      cubeSize={cubeSize}
      gap={gap}
      mainColor={mainColor}
      accentColor={accentColor}
      animationType={animationType}
      animationSpeed={animationSpeed}
      interactionFactor={interactionFactor}
      useStoreConfig={true}
      gridSize={gridSize}
      fadeDistance={fadeDistance}
      {...props} 
    />
  )
}

export default LogoCube 