import { create } from 'zustand'
import { shallow } from 'zustand/shallow'

/**
 * Coordinate transformation helpers
 */
// Transform JSON coordinates to our internal system (if needed)
const transformCoordinates = (x, y, z) => {
  // Swap Y and Z axes, as Y represents height in most 3D software
  // In our system, Y is up/down on screen (front to back)
  // This makes (0,0,0) the bottom front corner
  return [x, z, y]
}

// Transform internal coordinates to JSON (inverse of above)
const transformToJSON = (x, y, z) => {
  // Convert from our system to JSON export format
  return [x, z, y]
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
        // Clear previous pattern
        const key = `${x},${y},${z}`
        visibleCubes.delete(key)
        
        // Create G shape
        // Left vertical line
        if (x === 0 && y >= 0 && y < size && z === mid) {
          visibleCubes.set(key, 1)
        }
        // Top horizontal line
        else if (x >= 0 && x < size && y === size - 1 && z === mid) {
          visibleCubes.set(key, 1)
        }
        // Bottom horizontal line
        else if (x >= 0 && x < size && y === 0 && z === mid) {
          visibleCubes.set(key, 1)
        }
        // Middle horizontal line (for G)
        else if (x >= mid && x < size && y === mid && z === mid) {
          visibleCubes.set(key, 1)
        }
        // Right vertical line (only bottom half for G)
        else if (x === size - 1 && y >= 0 && y <= mid && z === mid) {
          visibleCubes.set(key, 1)
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
        // Clear previous pattern
        const key = `${x},${y},${z}`
        visibleCubes.delete(key)
        
        // Create N shape
        // Left vertical line
        if (x === 0 && y >= 0 && y < size && z === mid) {
          visibleCubes.set(key, 1)
        }
        // Right vertical line
        else if (x === size - 1 && y >= 0 && y < size && z === mid) {
          visibleCubes.set(key, 1)
        }
        // Diagonal line - match x and y coordinates
        else if (x === y && z === mid) {
          visibleCubes.set(key, 1)
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
        // Clear previous pattern
        const key = `${x},${y},${z}`
        visibleCubes.delete(key)
        
        // Create S shape
        // Top horizontal line
        if (x >= 0 && x < size && y === size - 1 && z === mid) {
          visibleCubes.set(key, 1)
        }
        // Middle horizontal line
        else if (x >= 0 && x < size && y === mid && z === mid) {
          visibleCubes.set(key, 1)
        }
        // Bottom horizontal line
        else if (x >= 0 && x < size && y === 0 && z === mid) {
          visibleCubes.set(key, 1)
        }
        // Top-left vertical segment
        else if (x === 0 && y >= mid && y < size && z === mid) {
          visibleCubes.set(key, 1)
        }
        // Bottom-right vertical segment
        else if (x === size - 1 && y >= 0 && y <= mid && z === mid) {
          visibleCubes.set(key, 1)
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
        
        // Add with 30% probability
        if (Math.random() < 0.3) {
          visibleCubes.set(key, 1)
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
  
  // Custom pattern - defines which cubes should be visible
  // We store it as a Map with keys like "x,y,z" and values as arrays of face objects
  // Each face object can specify which face has an accent color: { face: 'front', color: 'b' }
  visibleCubes: new Map(),
  
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
    color: '#fc0398', // Main color (a)
    accentColor: '#333333', // Accent color (b)
    cubeSize: 0.8,
    gap: 0.2,
  },
  
  // Position properties for moving the cube with WASD
  position: {
    x: 0,
    y: 0,
    z: 0,
  },
  
  // Control options
  enableKeyboardControls: true,
  
  // Toggle keyboard controls
  setKeyboardControls: (enabled) => {
    set({ enableKeyboardControls: enabled })
  },
  
  // Methods to adjust position
  moveX: (amount) => {
    const { position } = get()
    set({ position: { ...position, x: position.x + amount } })
  },
  
  moveY: (amount) => {
    const { position } = get()
    set({ position: { ...position, y: position.y + amount } })
  },
  
  moveZ: (amount) => {
    const { position } = get()
    set({ position: { ...position, z: position.z + amount } })
  },
  
  setPosition: (x, y, z) => {
    set({ position: { x, y, z } })
  },
  
  resetPosition: () => {
    set({ position: { x: 0, y: 0, z: 0 } })
  },
  
  // Load a custom pattern from a Map or JSON
  loadPattern: (visibleCubes) => {
    // If it's already a Map, use it directly
    if (visibleCubes instanceof Map) {
      // Ensure all values are arrays
      const normalizedCubes = new Map()
      for (const [key, value] of visibleCubes.entries()) {
        normalizedCubes.set(key, Array.isArray(value) ? value : [])
      }
      set({ visibleCubes: normalizedCubes, currentPattern: 'custom' })
    } 
    // Otherwise, try to convert it to a Map
    else if (Array.isArray(visibleCubes)) {
      const cubeMap = new Map()
      visibleCubes.forEach(cube => {
        if (typeof cube.x === 'number' && 
            typeof cube.y === 'number' && 
            typeof cube.z === 'number') {
          // Apply coordinate transformation here
          const [newX, newY, newZ] = transformCoordinates(cube.x, cube.y, cube.z)
          cubeMap.set(`${newX},${newY},${newZ}`, cube.sides || [])
        }
      })
      set({ visibleCubes: cubeMap, currentPattern: 'custom' })
    }
    // If it's a raw object, convert to Map
    else if (typeof visibleCubes === 'object') {
      const cubeMap = new Map()
      Object.entries(visibleCubes).forEach(([key, value]) => {
        if (value) {
          cubeMap.set(key, Array.isArray(value) ? value : [])
        }
      })
      set({ visibleCubes: cubeMap, currentPattern: 'custom' })
    }
  },
  
  // Export the current pattern to JSON array format
  exportPattern: () => {
    const { visibleCubes } = get()
    
    // Convert Map to array of objects with coordinate transformation
    return Array.from(visibleCubes.keys()).map(key => {
      const [x, y, z] = key.split(',').map(Number)
      const [jsonX, jsonY, jsonZ] = transformToJSON(x, y, z)
      return { x: jsonX, y: jsonY, z: jsonZ }
    })
  },
  
  // Export all settings to a complete configuration object
  exportFullConfig: () => {
    const { visibleCubes, visual, animation, currentPattern } = get()
    
    // Convert visibleCubes Map to array format for JSON
    const cubes = Array.from(visibleCubes.entries()).map(([key, sides]) => {
      const [x, y, z] = key.split(',').map(Number)
      return { x, y, z, sides }
    })
    
    return {
      cubes,
      colors: {
        a: visual.color,
        b: visual.accentColor
      },
      meta: {
        patternName: currentPattern,
        size: get().size
      },
      animation
    }
  },
  
  // Import a full configuration
  importFullConfig: (config) => {
    try {
      if (!config.cubes || !Array.isArray(config.cubes)) {
        return false
      }
      
      // Convert cubes array to Map
      const visibleCubes = new Map()
      config.cubes.forEach(cube => {
        if (typeof cube.x === 'number' && 
            typeof cube.y === 'number' && 
            typeof cube.z === 'number') {
          visibleCubes.set(`${cube.x},${cube.y},${cube.z}`, cube.sides || [])
        }
      })
      
      // Update colors if provided
      const visual = { ...get().visual }
      if (config.colors) {
        if (config.colors.a) visual.color = config.colors.a
        if (config.colors.b) visual.accentColor = config.colors.b
      }
      
      // Update pattern name if provided
      const currentPattern = config.meta?.patternName || 'custom'
      
      // Update animation if provided
      const animation = config.animation ? { ...config.animation } : get().animation
      
      // Update store
      set({ 
        visibleCubes, 
        visual, 
        animation, 
        currentPattern
      })
      
      return true
    } catch (error) {
      console.error('Error importing configuration:', error)
      return false
    }
  },
  
  // Set the current pattern by name
  setCurrentPattern: (patternName) => {
    // Implementation for different patterns
    set({ currentPattern: patternName })
    
    const { size } = get()
    let visibleCubes = new Map(get().visibleCubes)
    
    // Clear existing pattern
    visibleCubes.clear()
    
    // Apply the selected pattern
    switch (patternName) {
      case 'G':
        visibleCubes = createGPattern(size, visibleCubes)
        break
        
      case 'N':
        visibleCubes = createNPattern(size, visibleCubes)
        break
        
      case 'S':
        visibleCubes = createSPattern(size, visibleCubes)
        break
        
      case 'cube':
        // Solid cube - all cubes visible
        for (let x = 0; x < size; x++) {
          for (let y = 0; y < size; y++) {
            for (let z = 0; z < size; z++) {
              visibleCubes.set(`${x},${y},${z}`, [])
            }
          }
        }
        break
        
      case 'random':
        visibleCubes = createRandomPattern(size, visibleCubes)
        break
        
      case 'hollow':
      default:
        // Hollow cube pattern - just initialize hollow cube
        get().initializeHollowCube()
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
          if (
            x === 0 || x === size - 1 ||
            y === 0 || y === size - 1 ||
            z === 0 || z === size - 1
          ) {
            // Use a string key for the map: "x,y,z"
            visibleCubes.set(`${x},${y},${z}`, [])
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
            visibleCubes.set(`${x},${y},${z}`, [])
          }
        }
      }
    }
    
    set({ visibleCubes })
  },
  
  // Toggle a specific cube's visibility
  toggleCube: (x, y, z) => {
    const { visibleCubes } = get()
    const key = `${x},${y},${z}`
    
    // Clone the Map to maintain immutability
    const newVisibleCubes = new Map(visibleCubes)
    
    if (visibleCubes.has(key)) {
      // Remove cube if it exists
      newVisibleCubes.delete(key)
    } else {
      // Add cube with empty sides array if it doesn't exist
      newVisibleCubes.set(key, [])
    }
    
    set({ visibleCubes: newVisibleCubes })
  },
  
  // Set animation type
  setAnimationType: (type) => {
    const animation = { ...get().animation, type }
    set({ animation })
  },
  
  // Set animation speed
  setAnimationSpeed: (speed) => {
    const animation = { ...get().animation, speed }
    set({ animation })
  },
  
  // Set interaction factor
  setInteractionFactor: (interactionFactor) => {
    const animation = { ...get().animation, interactionFactor }
    set({ animation })
  },
  
  // Set animation delay (for staggered animations)
  setAnimationDelay: (delay) => {
    const animation = { ...get().animation, delay }
    set({ animation })
  },
  
  // Set animation completion callback
  setAnimationCallback: (callback) => {
    const animation = { ...get().animation, callback }
    set({ animation })
  },
  
  // Set color
  setColor: (color) => {
    const visual = { ...get().visual, color }
    set({ visual })
  },
  
  // Set cube size
  setCubeSize: (cubeSize) => {
    const visual = { ...get().visual, cubeSize }
    set({ visual })
  },
  
  // Set gap between cubes
  setGap: (gap) => {
    const visual = { ...get().visual, gap }
    set({ visual })
  },
  
  // Set accent color
  setAccentColor: (color) => {
    const { visual } = get()
    set({ visual: { ...visual, accentColor: color } })
  },
  
  // Toggle accent color on a specific side of a cube
  setAccentSide: (x, y, z, face) => {
    const { visibleCubes } = get()
    const key = `${x},${y},${z}`
    
    // If cube doesn't exist, do nothing
    if (!visibleCubes.has(key)) return
    
    // Clone the Map to maintain immutability
    const newVisibleCubes = new Map(visibleCubes)
    
    // Get current sides array for this cube
    const sides = [...(visibleCubes.get(key) || [])]
    
    // Check if this face already has a color setting
    const existingIndex = sides.findIndex(side => side.face === face)
    
    if (existingIndex >= 0) {
      // Remove the face entry if it exists (toggle off)
      sides.splice(existingIndex, 1)
    } else {
      // Add face with accent color (b)
      sides.push({ face, color: 'b' })
    }
    
    // Update the cube's sides in the map
    newVisibleCubes.set(key, sides)
    set({ visibleCubes: newVisibleCubes })
  },
  
  initializeGNSLogo: async () => {
    try {
      const logoData = await import('../data/gnsLogo.json');
      const newVisibleCubes = new Map();
      logoData.default.forEach(coord => {
        const key = `${coord.x},${coord.y},${coord.z}`;
        newVisibleCubes.set(key, coord.sides || []);
      });
      set({ visibleCubes: newVisibleCubes });
    } catch (error) {
      console.error('Failed to load GNS logo data:', error);
      // Fallback to a default pattern if loading fails
      get().initializeHollowCube();
    }
  },
}))

// Create a selector hook for better performance when selecting multiple values
export const useLogoCubeSelector = (selector) => useLogoCubeStore(selector, shallow)

export default useLogoCubeStore 