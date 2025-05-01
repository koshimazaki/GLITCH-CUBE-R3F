import React, { useRef, useMemo, useState, useCallback, useEffect, createRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Instance, Instances } from '@react-three/drei'
import * as THREE from 'three'
import { useControls } from 'leva'
import useLogoCubeStore from '../../store/logoCubeStore'
import { gridToWorld } from '../../utils/coordinateUtils'

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
  rippleInteractionFactor = 0.5,
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
    rippleInteractionFactor: useStoreConfig ? (storeInteractionFactor * 1.5) : rippleInteractionFactor,
    offset: ((useStoreConfig ? storeSize : size) - 1) / 2,
    delay: useStoreConfig ? (storeAnimationDelay || 0.1) : 0.1
  }), [
    useStoreConfig, 
    size, cubeSize, gap, mainColor, accentColor, animationType, animationSpeed, 
    interactionFactor, rippleInteractionFactor,
    storeSize, storeVisualCubeSize, storeVisualGap, storeVisualColors, 
    storeAnimationType, storeAnimationSpeed, storeInteractionFactor, storeAnimationDelay
  ])
  
  // Define which cubes are visible in the 5x5x5 grid
  const cubePositions = useMemo(() => {
    const { size, cubeSize, gap } = finalValues
    const pattern = []
    
    // If using store configuration, use the visibleCubes map
    if (useStoreConfig) {
      for (const [key, cubeData] of storeVisibleCubes.entries()) {
        if (cubeData.visible) {
          const [x, y, z] = key.split(',').map(Number)
          
          // Convert from grid position to world position using utility function
          const [worldX, worldY, worldZ] = gridToWorld(x, y, z, size, cubeSize, gap)
          
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
              // Convert from grid position to world position using utility function
              const [worldX, worldY, worldZ] = gridToWorld(x, y, z, size, cubeSize, gap)
              
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
      
      // No need to initialize matrix instances since we're using individual meshes
      // Just ensure we have the right number of refs
      meshRefs.current = Array(cubePositions.length).fill().map((_, i) => 
        meshRefs.current[i] || createRef()
      );
    }
  }, [cubePositions]);
  
  // Updated animation function to work with individual meshes
  const animateCubes = useCallback((state) => {
    const { clock, mouse: sceneMouse } = state;
    const { animationSpeed, animationType, interactionFactor, rippleInteractionFactor } = finalValues;
    const time = clock.getElapsedTime() * animationSpeed;
    
    // Don't animate if animation type is 'none'
    if (animationType === 'none') return;
    
    // Update mouse position with smoothing
    setMouse((prev) => [
      prev[0] + (sceneMouse.x - prev[0]) * 0.1,
      prev[1] + (sceneMouse.y - prev[1]) * 0.1
    ]);
    
    // Animate each cube mesh directly
    cubePositions.forEach((cube, i) => {
      const mesh = meshRefs.current[i]?.current;
      if (!mesh) return;
      
      const { position, gridPosition } = cube;
      
      // Get base position
      const [baseX, baseY, baseZ] = position;
      
      // Apply different animations based on the selected type
      let animX = 0, animY = 0, animZ = 0;
      let rotX = 0, rotY = 0, rotZ = 0;
      
      switch (animationType) {
        case 'wave': {
          // Wave animation based on grid position and time
          animY = Math.sin(time + gridPosition[0] + gridPosition[2]) * 0.2;
          break;
        }
          
        case 'breathe': {
          // Breathing animation - all cubes move slightly in and out
          const breathFactor = Math.sin(time) * 0.1;
          animX = position[0] * breathFactor;
          animY = position[1] * breathFactor;
          animZ = position[2] * breathFactor;
          break;
        }
          
        case 'twist': {
          // Twist animation - rotate around the center
          const angle = time * 0.2;
          const distance = Math.sqrt(position[0] ** 2 + position[2] ** 2);
          animX = Math.cos(angle) * distance * 0.1;
          animZ = Math.sin(angle) * distance * 0.1;
          break;
        }
          
        case 'scatter': {
          // Scatter and reassemble
          const scatterPhase = (Math.sin(time * 0.3) + 1) / 2; // 0 to 1
          const randomOffset = Math.sin(i * 5318.323 + time * 0.5) * scatterPhase;
          animX = randomOffset * 1.5;
          animY = Math.sin(i * 1234.123 + time * 0.5) * scatterPhase * 1.5;
          animZ = Math.cos(i * 8675.309 + time * 0.5) * scatterPhase * 1.5;
          break;
        }
          
        case 'falling': {
          // Falling cubes animation (great for loading screens)
          const { delay } = finalValues;
          // Each cube starts falling at a different time based on index
          const startDelay = i * delay;
          const fallStart = Math.max(0, time - startDelay);
          
          // If this cube's time to fall has come
          if (fallStart > 0) {
            // Calculate fall position with gravity
            const gravity = 9.8;
            const fallDistance = 20; // Starting height above final position
            const fallTime = fallStart;
            
            // Standard falling equation with gravity
            let fallY = fallDistance - 0.5 * gravity * fallTime * fallTime;
            
            // Once it reaches its final position, add a bounce effect
            if (fallY <= 0) {
              const timeSinceLanding = fallTime - Math.sqrt(2 * fallDistance / gravity);
              
              if (timeSinceLanding > 0) {
                // Calculate bounce height based on time since landing
                const bounceHeight = 2 * Math.exp(-timeSinceLanding * 2); // Diminishing bounce
                fallY = bounceHeight * Math.abs(Math.sin(timeSinceLanding * 5));
              } else {
                fallY = 0;
              }
            }
            
            animY = fallY;
          } else {
            // Before falling, keep the cube way above its final position
            animY = 20;
          }
          break;
        }
          
        case 'disconnect': {
          // Disconnection effect where cubes pull apart and then reconnect
          // Use a periodic function to create a disconnection cycle
          const cycleLength = 4.0; // Seconds for full disconnect-reconnect
          const cycleProgress = (time % cycleLength) / cycleLength;
          
          // Phase 1: Pull apart (0-0.4)
          // Phase 2: Hold disconnected (0.4-0.6)
          // Phase 3: Reconnect (0.6-1.0)
          
          let disconnectionFactor = 0;
          
          if (cycleProgress < 0.4) {
            // Phase 1: Pulling apart (ease-in)
            disconnectionFactor = Math.pow(cycleProgress / 0.4, 2);
          } else if (cycleProgress < 0.6) {
            // Phase 2: Hold disconnected
            disconnectionFactor = 1;
          } else {
            // Phase 3: Reconnect (ease-out)
            disconnectionFactor = Math.pow(1 - (cycleProgress - 0.6) / 0.4, 2);
          }
          
          // Calculate direction vector from center 
          const centerX = size * (cubeSize + gap) / 2;
          const centerY = size * (cubeSize + gap) / 2;
          const centerZ = size * (cubeSize + gap) / 2;
          
          const dirX = position[0] - centerX;
          const dirY = position[1] - centerY;
          const dirZ = position[2] - centerZ;
          
          // Normalize and apply disconnection
          const length = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
          
          if (length > 0) {
            const moveFactor = disconnectionFactor * 2; // Adjust this for disconnect distance
            animX = (dirX / length) * moveFactor;
            animY = (dirY / length) * moveFactor;
            animZ = (dirZ / length) * moveFactor;
          }
          break;
        }
          
        case 'assembly': {
          // Assembly effect for revealing the logo
          const cycleLength = 6.0;
          const cycleProgress = Math.min(time / cycleLength, 1.0); // Progress capped at 1
          
          // Easing function for smooth assembly
          const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);
          const easedProgress = easeOutQuart(cycleProgress);
          
          // Starting position - random, far away
          // Ending position - the correct grid position
          
          // Generate a consistent random start position for each cube
          const rndX = Math.sin(i * 1234.5) * 10;
          const rndY = Math.cos(i * 5678.9) * 10; 
          const rndZ = Math.sin(i * 9101.2) * 10;
          
          // Lerp between random start and final position
          const lerpFactor = easedProgress;
          animX = rndX * (1 - lerpFactor);
          animY = rndY * (1 - lerpFactor);
          animZ = rndZ * (1 - lerpFactor);
          
          // Add rotation during assembly
          rotX = (1 - lerpFactor) * Math.PI * 2 * Math.sin(i * 3.14);
          rotY = (1 - lerpFactor) * Math.PI * 2 * Math.cos(i * 1.618);
          rotZ = (1 - lerpFactor) * Math.PI * 2 * Math.sin(i * 2.718);
          break;
        }
      }
      
      // Apply both interaction types if enabled
      
      // 1. Original interaction - direct influence based on mouse position
      if (interactionFactor > 0) {
        // Original behavior - affects both X and Y directly
        animX += mouse[0] * interactionFactor * position[0];
        animY += mouse[1] * interactionFactor * position[1];
      }
      
      // 2. Ripple interaction - distance-based influence (additive to direct interaction)
      if (rippleInteractionFactor > 0) {
        // Calculate distance from cursor position to cube
        const distX = baseX - (mouse[0] * 10); // Scale mouse influence
        const distZ = baseZ - (mouse[1] * 10);
        const distance = Math.sqrt(distX * distX + distZ * distZ);
        
        // Apply influence based on distance (inverse square)
        const influence = 1 / (distance * distance + 0.1) * rippleInteractionFactor;
        
        // Add ripple effect on top of any existing Y movement
        animY += influence;
      }
      
      // Update mesh position and rotation
      mesh.position.set(baseX + animX, baseY + animY, baseZ + animZ);
      
      // Apply rotation based on animation or mouse
      if (rotX !== 0 || rotY !== 0 || rotZ !== 0) {
        mesh.rotation.set(rotX, rotY, rotZ);
      } else if (interactionFactor > 0) {
        // Apply subtle rotation based on mouse position
        mesh.rotation.set(
          mouse[1] * 0.1 * interactionFactor,
          mouse[0] * 0.1 * interactionFactor,
          0
        );
      }
    });
  }, [cubePositions, finalValues, mouse, setMouse, size, cubeSize, gap]);
  
  // Animation frame
  useFrame(animateCubes)
  
  // Create an array of materials for each cube with its side colors
  const materials = useMemo(() => {
    return cubePositions.map(cube => {
      const { sides } = cube;
      
      // Create a default material using the main color
      const defaultMaterial = new THREE.MeshPhysicalMaterial({
        color: finalValues.mainColor,
        roughness: materialSettings.roughness,
        metalness: materialSettings.metalness,
        envMapIntensity: materialSettings.envMapIntensity,
        clearcoat: materialSettings.clearcoat,
        clearcoatRoughness: materialSettings.clearcoatRoughness,
        side: THREE.DoubleSide,
        toneMapped: true
      });
      
      // If there are no side colors, return the default material
      if (!sides || Object.keys(sides).length === 0) {
        return [defaultMaterial, defaultMaterial, defaultMaterial, 
                defaultMaterial, defaultMaterial, defaultMaterial];
      }
      
      // Define the face indices in Three.js order
      // 0: right (+X), 1: left (-X), 2: top (+Y), 3: bottom (-Y), 4: front (+Z), 5: back (-Z)
      const faceToIndex = {
        'right': 0,
        'left': 1,
        'top': 2,
        'bottom': 3,
        'front': 4,
        'back': 5
      };
      
      // Create an array of 6 default materials
      const cubeMaterials = Array(6).fill().map(() => defaultMaterial.clone());
      
      // Apply accent color to faces with custom colors
      Object.entries(sides).forEach(([face, colorType]) => {
        if (colorType === 'b' && Object.prototype.hasOwnProperty.call(faceToIndex, face)) {
          const materialIndex = faceToIndex[face];
          cubeMaterials[materialIndex] = new THREE.MeshPhysicalMaterial({
            color: finalValues.accentColor,
            roughness: materialSettings.roughness,
            metalness: materialSettings.metalness,
            envMapIntensity: materialSettings.envMapIntensity,
            clearcoat: materialSettings.clearcoat,
            clearcoatRoughness: materialSettings.clearcoatRoughness,
            side: THREE.DoubleSide,
            toneMapped: true
          });
        }
      });
      
      return cubeMaterials;
    });
  }, [cubePositions, finalValues.mainColor, finalValues.accentColor, materialSettings]);
  
  // References to store all cube meshes for direct manipulation during animation
  const meshRefs = useRef([]);
  
  return (
    <group 
      {...props} 
      position={[
        (useStoreConfig ? storePosition.x : 0) + (props.position?.[0] || 0),
        (useStoreConfig ? storePosition.y : 0) + (props.position?.[1] || 0),
        (useStoreConfig ? storePosition.z : 0) + (props.position?.[2] || 0)
      ]}
      ref={groupRef}
    >
      {/* Render individual meshes with their own materials */}
      {cubePositions.map((cube, index) => {
        const [worldX, worldY, worldZ] = cube.position;
        return (
          <mesh 
            key={cube.id}
            ref={meshRefs.current[index]}
            position={[worldX, worldY, worldZ]}
            castShadow 
            receiveShadow
          >
            <boxGeometry args={[finalValues.cubeSize, finalValues.cubeSize, finalValues.cubeSize]} />
            {materials[index].map((material, matIndex) => (
              <primitive key={`${cube.id}-mat-${matIndex}`} object={material} attach={`material-${matIndex}`} />
            ))}
          </mesh>
        );
      })}
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
    rippleInteractionFactor: { value: 0.5, min: 0, max: 2, step: 0.1 },
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
  const rippleInteractionFactor = useLogoCubeStore(state => {
    return state.animation.rippleInteractionFactor !== undefined ? state.animation.rippleInteractionFactor : 0.5
  })
  
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
      rippleInteractionFactor={rippleInteractionFactor}
      useStoreConfig={true}
      gridSize={gridSize}
      fadeDistance={fadeDistance}
      {...props} 
    />
  )
}

export default LogoCube 