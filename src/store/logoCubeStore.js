import { create } from 'zustand'
import { shallow } from 'zustand/shallow'

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
  // For a 5x5x5 grid, this would typically have 125 entries (0 or 1)
  // 0 = hidden, 1 = visible
  // We store it as a Map for O(1) lookups with string keys like "x,y,z"
  visibleCubes: new Map(),
  
  // Current pattern name
  currentPattern: 'hollow',
  
  // Current animation properties
  animation: {
    type: 'wave',
    speed: 1.0,
    interactionFactor: 0.3,
  },
  
  // Visual properties
  visual: {
    color: '#fc0398',
    cubeSize: 0.8,
    gap: 0.2,
  },
  
  // Load a custom pattern from a Map or JSON
  loadPattern: (visibleCubes) => {
    // If it's already a Map, use it directly
    if (visibleCubes instanceof Map) {
      set({ visibleCubes, currentPattern: 'custom' })
    } 
    // Otherwise, try to convert it to a Map
    else if (Array.isArray(visibleCubes)) {
      const cubeMap = new Map()
      visibleCubes.forEach(cube => {
        if (typeof cube.x === 'number' && 
            typeof cube.y === 'number' && 
            typeof cube.z === 'number') {
          cubeMap.set(`${cube.x},${cube.y},${cube.z}`, 1)
        }
      })
      set({ visibleCubes: cubeMap, currentPattern: 'custom' })
    }
    // If it's a raw object, convert to Map
    else if (typeof visibleCubes === 'object') {
      const cubeMap = new Map()
      Object.entries(visibleCubes).forEach(([key, value]) => {
        if (value) {
          cubeMap.set(key, 1)
        }
      })
      set({ visibleCubes: cubeMap, currentPattern: 'custom' })
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
              visibleCubes.set(`${x},${y},${z}`, 1)
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
            visibleCubes.set(`${x},${y},${z}`, 1)
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
            visibleCubes.set(`${x},${y},${z}`, 1)
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
      visibleCubes.set(key, 1)
    }
    
    set({ visibleCubes })
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
}))

// Create a selector hook for better performance when selecting multiple values
export const useLogoCubeSelector = (selector) => useLogoCubeStore(selector, shallow)

export default useLogoCubeStore 