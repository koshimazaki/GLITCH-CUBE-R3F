import { create } from 'zustand'
import { shallow } from 'zustand/shallow'

/**
 * Coordinate transformation helpers
 */
// Transform JSON coordinates to our internal system (if needed)
// The issue is that we're inconsistently applying transformations
// In Three.js, Y is traditionally up, X is right, and Z is forward
// Let's make our transformations more consistent
const transformCoordinates = (x, y, z) => {
  // More explicit transformation for clarity - this should maintain the spatial orientation
  // when importing from external formats
  console.log(`Transforming external (${x},${y},${z}) to internal coordinates`);
  return [x, y, z]; // Use identity transformation for now to debug
}

// Transform internal coordinates to JSON (inverse of above)
const transformToJSON = (x, y, z) => {
  // Keep consistent with the import transformation
  console.log(`Transforming internal (${x},${y},${z}) to external coordinates`);
  return [x, y, z]; // Use identity transformation for now to debug
}

/**
 * Pattern functions for different letters
 */
// G pattern - creates a "G" shape in the cube
const createGPattern = (size, visibleCubes) => {
  const mid = Math.floor(size / 2)
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        const key = `${x},${y},${z}`
        visibleCubes.delete(key)
        if ((x === 0 && y >= 0 && y < size && z === mid) ||
            (x >= 0 && x < size && y === size - 1 && z === mid) ||
            (x >= 0 && x < size && y === 0 && z === mid) ||
            (x >= mid && x < size && y === mid && z === mid) ||
            (x === size - 1 && y >= 0 && y <= mid && z === mid)) {
          visibleCubes.set(key, { visible: true, sides: {} })
        }
      }
    }
  }
  return visibleCubes
}

// N pattern - creates an "N" shape in the cube
const createNPattern = (size, visibleCubes) => {
  const mid = Math.floor(size / 2)
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        const key = `${x},${y},${z}`
        visibleCubes.delete(key)
        if ((x === 0 && y >= 0 && y < size && z === mid) ||
            (x === size - 1 && y >= 0 && y < size && z === mid) ||
            (x === y && z === mid)) {
          visibleCubes.set(key, { visible: true, sides: {} })
        }
      }
    }
  }
  return visibleCubes
}

// S pattern - creates an "S" shape in the cube
const createSPattern = (size, visibleCubes) => {
  const mid = Math.floor(size / 2)
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        const key = `${x},${y},${z}`
        visibleCubes.delete(key)
        if ((x >= 0 && x < size && y === size - 1 && z === mid) ||
            (x >= 0 && x < size && y === mid && z === mid) ||
            (x >= 0 && x < size && y === 0 && z === mid) ||
            (x === 0 && y >= mid && y < size && z === mid) ||
            (x === size - 1 && y >= 0 && y <= mid && z === mid)) {
          visibleCubes.set(key, { visible: true, sides: {} })
        }
      }
    }
  }
  return visibleCubes
}

// Random pattern - creates random cubes
const createRandomPattern = (size, visibleCubes) => {
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        const key = `${x},${y},${z}`
        visibleCubes.delete(key)
        if (Math.random() < 0.3) {
          visibleCubes.set(key, { visible: true, sides: {} })
        }
      }
    }
  }
  return visibleCubes
}

/**
 * Store for managing the Logo Cube configuration
 * Handles the state of which cubes are visible in the grid
 */
export const useLogoCubeStore = create((set, get) => ({
  // The size of the cube grid
  size: 5,
  
  // Custom pattern - defines which cubes should be visible with their side colors
  // We store it as a Map for O(1) lookups with string keys like "x,y,z"
  visibleCubes: new Map(),
  
  // Version counter to force re-renders when cube sides change
  cubesVersion: 0,
  
  // Current pattern name
  currentPattern: 'hollow',
  
  // Current animation properties
  animation: {
    type: 'wave',
    speed: 1.0,
    interactionFactor: 0.3,
    delay: 0.1, // Delay between cubes for staggered animations
  },
  
  // Visual properties
  visual: {
    colors: { a: '#fc0398', b: '#333333' }, // Main color (a) and accent color (b)
    cubeSize: 0.8,
    gap: 0.2,
  },
  
  // Position properties for moving the cube with WASD
  position: { x: 0, y: 0, z: 0 },
  
  // Movement speed for WASD controls
  moveSpeed: 0.1,
  
  // Control options
  enableKeyboardControls: true,
  
  // Toggle keyboard controls
  setKeyboardControls: (enabled) => set({ enableKeyboardControls: enabled }),
  
  // Set movement speed for WASD controls
  setMoveSpeed: (speed) => set({ moveSpeed: speed }),
  
  // Methods to adjust position
  moveX: (amount) => set(state => ({ position: { ...state.position, x: state.position.x + amount } })),
  moveY: (amount) => set(state => ({ position: { ...state.position, y: state.position.y + amount } })),
  moveZ: (amount) => set(state => ({ position: { ...state.position, z: state.position.z + amount } })),
  setPosition: (x, y, z) => set({ position: { x, y, z } }),
  resetPosition: () => set({ position: { x: 0, y: 0, z: 0 } }),
  
  // Update colors
  setColors: (colors) => set(state => ({ 
    visual: { ...state.visual, colors: { ...state.visual.colors, ...colors } } 
  })),
  
  // Set color for a specific side of a cube
  setCubeSideColor: (x, y, z, face, color) => {
    const key = `${x},${y},${z}`
    const visibleCubes = new Map(get().visibleCubes)
    
    // Only modify existing cubes - don't create new ones
    if (!visibleCubes.has(key)) {
      console.warn(`Attempted to texture non-existent cube at ${key}`)
      return
    }
    
    // Get the existing cube data
    const cubeData = visibleCubes.get(key)
    
    // Create new object references to ensure React detects the change
    const newSides = { ...cubeData.sides }
    
    if (color === 'b') {
      // Add accent color
      newSides[face] = 'b'
    } else if (color === 'a') {
      // Explicitly remove this face's texture
      delete newSides[face]
    } else {
      // Toggle - if the face has accent color, remove it, otherwise add it
      if (newSides[face] === 'b') {
        delete newSides[face] // Remove accent color
      } else {
        newSides[face] = 'b' // Add accent color
      }
    }
    
    // Create a new cubeData object with the updated sides
    const newCubeData = { ...cubeData, sides: newSides }
    visibleCubes.set(key, newCubeData)
    
    // Increment version to force re-renders
    const currentVersion = get().cubesVersion || 0
    set({ visibleCubes, cubesVersion: currentVersion + 1 })
    
    // Log for debugging
    console.log(`Set side color for cube ${key}, face ${face}, color ${color}, result:`, newSides)
  },
  
  // Compatibility method for older code
  setColor: (color) => set(state => ({ 
    visual: { 
      ...state.visual, 
      colors: { ...state.visual.colors, a: color } 
    } 
  })),
  
  // Compatibility method for older code
  setAccentColor: (color) => set(state => ({ 
    visual: { 
      ...state.visual, 
      colors: { ...state.visual.colors, b: color } 
    } 
  })),
  
  // Load a custom pattern from a Map or JSON
  loadPattern: (visibleCubes) => {
    try {
      console.log("Loading pattern:", visibleCubes);
      let cubeMap = new Map();
      
      // If it's already a Map, use it directly
      if (visibleCubes instanceof Map) {
        cubeMap = visibleCubes;
        console.log("Using direct Map for pattern");
      } 
      // If it's an array, process it
      else if (Array.isArray(visibleCubes)) {
        console.log("Processing array pattern with", visibleCubes.length, "cubes");
        visibleCubes.forEach((cube, index) => {
          if (typeof cube.x === 'number' && 
              typeof cube.y === 'number' && 
              typeof cube.z === 'number') {
            // Apply coordinate transformation here
            const [newX, newY, newZ] = transformCoordinates(cube.x, cube.y, cube.z);
            const key = `${newX},${newY},${newZ}`;
            const sides = {};
            
            // Process sides if they exist
            if (Array.isArray(cube.sides)) {
              console.log(`Cube ${index} at (${newX},${newY},${newZ}) has ${cube.sides.length} sides`);
              cube.sides.forEach(side => {
                if (side.face && side.color) {
                  sides[side.face] = side.color;
                  console.log(`  Added ${side.color} to ${side.face} face`);
                }
              });
            } else if (cube.sides && typeof cube.sides === 'object') {
              // Support object format: { front: 'b', back: 'b' }
              console.log(`Cube ${index} at (${newX},${newY},${newZ}) has sides as object`);
              Object.entries(cube.sides).forEach(([face, color]) => {
                sides[face] = color;
                console.log(`  Added ${color} to ${face} face`);
              });
            }
            
            cubeMap.set(key, { visible: true, sides });
          } else {
            console.warn("Invalid cube format:", cube);
          }
        });
      }
      // If it's a complex object with cubes array (like { cubes: [...], colors: {...} })
      else if (visibleCubes.cubes && Array.isArray(visibleCubes.cubes)) {
        console.log("Processing object pattern with", visibleCubes.cubes.length, "cubes");
        visibleCubes.cubes.forEach((cube, index) => {
          if (typeof cube.x === 'number' && 
              typeof cube.y === 'number' && 
              typeof cube.z === 'number') {
            // Apply coordinate transformation
            const [newX, newY, newZ] = transformCoordinates(cube.x, cube.y, cube.z);
            const key = `${newX},${newY},${newZ}`;
            const sides = {};
            
            // Process sides if they exist
            if (Array.isArray(cube.sides)) {
              console.log(`Cube ${index} at (${newX},${newY},${newZ}) has ${cube.sides.length} sides`);
              cube.sides.forEach(side => {
                if (side.face && side.color) {
                  sides[side.face] = side.color;
                  console.log(`  Added ${side.color} to ${side.face} face`);
                }
              });
            } else if (cube.sides && typeof cube.sides === 'object') {
              // Support object format: { front: 'b', back: 'b' }
              console.log(`Cube ${index} at (${newX},${newY},${newZ}) has sides as object`);
              Object.entries(cube.sides).forEach(([face, color]) => {
                sides[face] = color;
                console.log(`  Added ${color} to ${face} face`);
              });
            }
            
            cubeMap.set(key, { visible: true, sides });
          } else {
            console.warn("Invalid cube format:", cube);
          }
        });
        
        // Apply colors if present
        if (visibleCubes.colors) {
          console.log("Setting colors from pattern:", visibleCubes.colors);
          get().setColors(visibleCubes.colors);
        }
      }
      // If it's a raw object, convert to Map
      else if (typeof visibleCubes === 'object') {
        console.log("Processing raw object pattern");
        Object.entries(visibleCubes).forEach(([key, value]) => {
          if (value) {
            cubeMap.set(key, { visible: true, sides: {} });
          }
        });
      } else {
        throw new Error("Unsupported pattern format");
      }
      
      // If the cube map is empty, this is likely an error
      if (cubeMap.size === 0) {
        console.warn("Pattern contains no cubes - falling back to default");
        get().initializeHollowCube();
        return false;
      }
      
      console.log(`Loaded pattern with ${cubeMap.size} cubes`);
      
      // Update the store
      set({ 
        visibleCubes: cubeMap, 
        currentPattern: 'custom',
        // Increment version to force re-renders
        cubesVersion: get().cubesVersion + 1
      });
      
      return true;
    } catch (error) {
      console.error("Error loading pattern:", error);
      // Dispatch an error event for UIs to handle
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent('patternloaderror', { detail: { error } }));
      }
      return false;
    }
  },
  
  // Export the current pattern to JSON format
  exportPattern: () => {
    const { visibleCubes, visual } = get()
    console.log(`Exporting pattern with ${visibleCubes.size} cubes`);
    
    const cubes = Array.from(visibleCubes.entries()).map(([key, data]) => {
      const [x, y, z] = key.split(',').map(Number)
      const [jsonX, jsonY, jsonZ] = transformToJSON(x, y, z)
      
      // Convert sides object to array format for better compatibility
      const sides = Object.entries(data.sides || {}).map(([face, color]) => ({ face, color }))
      
      console.log(`Exporting cube at internal (${x},${y},${z}) -> external (${jsonX},${jsonY},${jsonZ}) with ${sides.length} sides`);
      
      return { x: jsonX, y: jsonY, z: jsonZ, sides }
    })
    
    // Return in the format that works in both Designer and Animation modes
    return { cubes, colors: visual.colors }
  },
  
  // Export all settings to a complete configuration object
  exportFullConfig: () => {
    const state = get()
    return {
      visual: { ...state.visual },
      animation: { ...state.animation },
      meta: { 
        patternName: state.currentPattern, 
        exportDate: new Date().toISOString(), 
        version: "1.1" 
      },
      pattern: state.exportPattern()
    }
  },
  
  // Import a full configuration
  importFullConfig: (config) => {
    // Validate the config
    if (!config || !config.pattern || !config.visual || !config.animation) {
      console.error("Invalid configuration format", config)
      return false
    }
    
    try {
      // Update visual settings
      get().setColors(config.visual.colors || { a: '#fc0398', b: '#333333' })
      get().setCubeSize(config.visual.cubeSize || 0.8)
      get().setGap(config.visual.gap || 0.2)
      
      // Update animation settings
      get().setAnimationType(config.animation.type || 'wave')
      get().setAnimationSpeed(config.animation.speed || 1.0)
      get().setInteractionFactor(config.animation.interactionFactor || 0.3)
      
      // Update the pattern - convert to Map
      const visibleCubes = new Map()
      
      // Handle the new format with cubes and colors
      if (Array.isArray(config.pattern.cubes)) {
        console.log("Processing pattern.cubes array:", config.pattern.cubes.length, "cubes")
        
        config.pattern.cubes.forEach((cube, index) => {
          if (typeof cube.x === 'number' && 
              typeof cube.y === 'number' && 
              typeof cube.z === 'number') {
            // Apply coordinate transformation
            const [newX, newY, newZ] = transformCoordinates(cube.x, cube.y, cube.z)
            const key = `${newX},${newY},${newZ}`
            const sides = {}
            
            // Handle sides in different formats
            if (Array.isArray(cube.sides)) {
              // Format: [{face: "front", color: "b"}, ...]
              console.log(`Cube ${index} has ${cube.sides.length} sides defined as array`)
              cube.sides.forEach(side => {
                if (side.face && side.color) {
                  sides[side.face] = side.color
                }
              })
            } else if (typeof cube.sides === 'object' && cube.sides !== null) {
              // Format: {front: "b", back: "b"}
              console.log(`Cube ${index} has sides defined as object`)
              Object.entries(cube.sides).forEach(([face, color]) => {
                sides[face] = color
              })
            }
            
            visibleCubes.set(key, { visible: true, sides })
          } else {
            console.warn(`Skipping invalid cube at index ${index}:`, cube)
          }
        })
        
        // Apply colors if present in pattern
        if (config.pattern.colors) {
          get().setColors(config.pattern.colors)
        }
      } 
      // Handle legacy format (plain array of coordinates)
      else if (Array.isArray(config.pattern)) {
        console.log("Processing legacy pattern format")
        config.pattern.forEach((cube, index) => {
          if (typeof cube.x === 'number' && 
              typeof cube.y === 'number' && 
              typeof cube.z === 'number') {
            // Apply coordinate transformation
            const [newX, newY, newZ] = transformCoordinates(cube.x, cube.y, cube.z)
            const key = `${newX},${newY},${newZ}`
            const sides = {}
            
            // Handle sides if they exist in the legacy format
            if (Array.isArray(cube.sides)) {
              console.log(`Legacy cube ${index} has ${cube.sides.length} sides defined`)
              cube.sides.forEach(side => {
                if (side.face && side.color) {
                  sides[side.face] = side.color
                }
              })
            }
            
            visibleCubes.set(key, { visible: true, sides })
          } else {
            console.warn(`Skipping invalid legacy cube at index ${index}:`, cube)
          }
        })
      } else {
        console.error("Unrecognized pattern format in config:", config.pattern)
        return false
      }
      
      // Update the store with the new pattern
      set({ 
        visibleCubes,
        currentPattern: config.meta?.patternName || 'custom',
        // Increment version counter to ensure rendering update
        cubesVersion: get().cubesVersion + 1
      })
      
      return true
    } catch (error) {
      console.error("Error importing configuration:", error)
      return false
    }
  },
  
  // Set the current pattern by name
  setCurrentPattern: (patternName) => {
    set({ currentPattern: patternName })
    const { size } = get()
    let visibleCubes = new Map()
    
    // Apply the selected pattern
    switch (patternName) {
      case 'G': 
        visibleCubes = createGPattern(size, visibleCubes); 
        break
      case 'N': 
        visibleCubes = createNPattern(size, visibleCubes); 
        break
      case 'S': 
        visibleCubes = createSPattern(size, visibleCubes); 
        break
      case 'cube':
        // Solid cube - all cubes visible
        for (let x = 0; x < size; x++) {
          for (let y = 0; y < size; y++) {
            for (let z = 0; z < size; z++) {
              visibleCubes.set(`${x},${y},${z}`, { visible: true, sides: {} })
            }
          }
        }
        break
      case 'random': 
        visibleCubes = createRandomPattern(size, visibleCubes); 
        break
      case 'hollow':
      default:
        // Hollow cube pattern - just initialize hollow cube
        get().initializeHollowCube(); 
        return // Early return since initializeHollowCube already sets the state
    }
    
    // Update the store
    set({ visibleCubes })
  },
  
  // Initialize the cube with a hollow cube pattern (only the edges)
  initializeHollowCube: () => {
    const { size } = get()
    const visibleCubes = new Map()
    
    // Create a hollow cube pattern (only edges are visible)
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        for (let z = 0; z < size; z++) {
          if (x === 0 || x === size - 1 || y === 0 || y === size - 1 || z === 0 || z === size - 1) {
            visibleCubes.set(`${x},${y},${z}`, { visible: true, sides: {} })
          }
        }
      }
    }
    
    set({ visibleCubes })
  },
  
  // Initialize with a custom logo pattern
  initializeCustomPattern: (patternFunc) => {
    const { size } = get()
    const visibleCubes = new Map()
    
    // Use the provided pattern function to determine visible cubes
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        for (let z = 0; z < size; z++) {
          if (patternFunc(x, y, z, size)) {
            visibleCubes.set(`${x},${y},${z}`, { visible: true, sides: {} })
          }
        }
      }
    }
    
    set({ visibleCubes })
  },
  
  // Toggle a specific cube's visibility
  toggleCube: (x, y, z) => {
    const visibleCubes = new Map(get().visibleCubes)
    const key = `${x},${y},${z}`
    
    if (visibleCubes.has(key)) {
      visibleCubes.delete(key)
    } else {
      visibleCubes.set(key, { visible: true, sides: {} })
    }
    
    // Increment version to force re-renders
    const currentVersion = get().cubesVersion || 0
    set({ visibleCubes, cubesVersion: currentVersion + 1 })
  },
  
  // Set animation type
  setAnimationType: (type) => set(state => ({ animation: { ...state.animation, type } })),
  
  // Set animation speed
  setAnimationSpeed: (speed) => set(state => ({ animation: { ...state.animation, speed } })),
  
  // Set interaction factor
  setInteractionFactor: (interactionFactor) => set(state => ({ 
    animation: { ...state.animation, interactionFactor } 
  })),
  
  // Set animation delay (for staggered animations)
  setAnimationDelay: (delay) => set(state => ({ animation: { ...state.animation, delay } })),
  
  // Set animation completion callback
  setAnimationCallback: (callback) => set(state => ({ animation: { ...state.animation, callback } })),
  
  // Set cube size
  setCubeSize: (cubeSize) => set(state => ({ visual: { ...state.visual, cubeSize } })),
  
  // Set gap between cubes
  setGap: (gap) => set(state => ({ visual: { ...state.visual, gap } })),
  
  initializeGNSLogo: async () => {
    try {
      const logoData = await import('../data/gnsLogo.json');
      const newVisibleCubes = new Map();
      logoData.default.forEach(coord => {
        const key = `${coord.x},${coord.y},${coord.z}`;
        newVisibleCubes.set(key, { visible: true, sides: {} });
      });
      set({ visibleCubes: newVisibleCubes });
    } catch (error) {
      console.error('Failed to load GNS logo data:', error);
      // Fallback to a default pattern if loading fails
      get().initializeHollowCube();
    }
  },
  
  // Clear accent colors from all sides of a cube
  clearCubeSideColors: (x, y, z) => {
    const key = `${x},${y},${z}`
    const visibleCubes = new Map(get().visibleCubes)
    const cubeData = visibleCubes.get(key)
    
    if (cubeData && cubeData.visible) {
      // Create new object references to ensure React detects the change
      const newCubeData = { ...cubeData, sides: {} }
      visibleCubes.set(key, newCubeData)
      
      // Increment version to force re-renders
      const currentVersion = get().cubesVersion || 0
      set({ visibleCubes, cubesVersion: currentVersion + 1 })
    }
  },
}))

// Create a selector hook for better performance when selecting multiple values
export const useLogoCubeSelector = (selector) => useLogoCubeStore(selector, shallow)

export default useLogoCubeStore 