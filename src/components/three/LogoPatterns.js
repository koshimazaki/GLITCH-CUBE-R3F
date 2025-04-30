/**
 * LogoPatterns.js - Collection of pattern functions for the GNS Logo Cube
 * Each function takes (x, y, z, size) parameters and returns true if that voxel should be visible
 */

/**
 * Hollow cube pattern - displays only the edges of the cube
 */
export const hollowCubePattern = (x, y, z, size) => {
  return x === 0 || x === size - 1 || y === 0 || y === size - 1 || z === 0 || z === size - 1
}

/**
 * Nested cubes pattern - creates two concentric hollow cubes
 */
export const nestedCubesPattern = (x, y, z, size) => {
  // Outer shell
  if (x === 0 || x === size - 1 || y === 0 || y === size - 1 || z === 0 || z === size - 1) {
    return true
  }
  
  // Inner shell (if size is big enough)
  if (size >= 5) {
    if (
      (x === 1 || x === size - 2) && 
      (y === 1 || y === size - 2) && 
      (z === 1 || z === size - 2)
    ) {
      return true
    }
  }
  
  return false
}

/**
 * G letter pattern - attempts to form a 3D letter G
 * Works best with size 5 or larger
 */
export const gLetterPattern = (x, y, z, size) => {
  // Only consider the front face
  if (z !== 0) {
    return false
  }
  
  // For a 5x5x5 cube, create a "G" shape on the front face
  // Top horizontal bar
  if (y === size - 1 && x >= 1 && x <= size - 2) {
    return true
  }
  
  // Left vertical bar
  if (x === 1 && y >= 1 && y <= size - 2) {
    return true
  }
  
  // Bottom horizontal bar
  if (y === 1 && x >= 1 && x <= size - 2) {
    return true
  }
  
  // Right partial vertical bar
  if (x === size - 2 && y >= 1 && y <= Math.floor(size / 2)) {
    return true
  }
  
  // Middle horizontal connector
  if (y === Math.floor(size / 2) && x >= Math.floor(size / 2) && x <= size - 2) {
    return true
  }
  
  return false
}

/**
 * N letter pattern - forms a 3D letter N
 * Works best with size 5 or larger
 */
export const nLetterPattern = (x, y, z, size) => {
  // Only consider the front face
  if (z !== 0) {
    return false
  }
  
  // Left vertical bar
  if (x === 1 && y >= 1 && y <= size - 2) {
    return true
  }
  
  // Right vertical bar
  if (x === size - 2 && y >= 1 && y <= size - 2) {
    return true
  }
  
  // Diagonal connector
  const diagonalSlope = (size - 3) / (size - 3)
  const expectedY = Math.round(1 + (x - 1) * diagonalSlope)
  
  if (x >= 1 && x <= size - 2 && y === expectedY) {
    return true
  }
  
  return false
}

/**
 * S letter pattern - forms a 3D letter S
 * Works best with size 5 or larger
 */
export const sLetterPattern = (x, y, z, size) => {
  // Only consider the front face
  if (z !== 0) {
    return false
  }
  
  // Top horizontal bar
  if (y === size - 2 && x >= 1 && x <= size - 2) {
    return true
  }
  
  // Middle horizontal bar
  if (y === Math.floor(size / 2) && x >= 1 && x <= size - 2) {
    return true
  }
  
  // Bottom horizontal bar
  if (y === 1 && x >= 1 && x <= size - 2) {
    return true
  }
  
  // Top left vertical bar
  if (x === 1 && y >= Math.floor(size / 2) && y <= size - 2) {
    return true
  }
  
  // Bottom right vertical bar
  if (x === size - 2 && y >= 1 && y <= Math.floor(size / 2)) {
    return true
  }
  
  return false
}

/**
 * 3D GNS pattern - tries to form 'GNS' on three different faces
 * Works best with size 5 or larger
 */
export const gnsPattern = (x, y, z, size) => {
  // G on front face (z = 0)
  if (z === 0) {
    // Top horizontal bar
    if (y === size - 2 && x >= 1 && x <= size - 2) {
      return true
    }
    
    // Left vertical bar
    if (x === 1 && y >= 1 && y <= size - 2) {
      return true
    }
    
    // Bottom horizontal bar
    if (y === 1 && x >= 1 && x <= size - 2) {
      return true
    }
    
    // Right partial vertical bar
    if (x === size - 2 && y >= 1 && y <= Math.floor(size / 2)) {
      return true
    }
    
    // Middle horizontal connector
    if (y === Math.floor(size / 2) && x >= Math.floor(size / 2) && x <= size - 2) {
      return true
    }
  }
  
  // N on right face (x = size-1)
  if (x === size - 1) {
    // Left vertical bar
    if (z === 1 && y >= 1 && y <= size - 2) {
      return true
    }
    
    // Right vertical bar
    if (z === size - 2 && y >= 1 && y <= size - 2) {
      return true
    }
    
    // Diagonal connector
    const diagonalSlope = (size - 3) / (size - 3)
    const expectedY = Math.round(1 + (z - 1) * diagonalSlope)
    
    if (z >= 1 && z <= size - 2 && y === expectedY) {
      return true
    }
  }
  
  // S on top face (y = size-1)
  if (y === size - 1) {
    // Top horizontal bar
    if (z === size - 2 && x >= 1 && x <= size - 2) {
      return true
    }
    
    // Middle horizontal bar
    if (z === Math.floor(size / 2) && x >= 1 && x <= size - 2) {
      return true
    }
    
    // Bottom horizontal bar
    if (z === 1 && x >= 1 && x <= size - 2) {
      return true
    }
    
    // Top left vertical bar
    if (x === 1 && z >= Math.floor(size / 2) && z <= size - 2) {
      return true
    }
    
    // Bottom right vertical bar
    if (x === size - 2 && z >= 1 && z <= Math.floor(size / 2)) {
      return true
    }
  }
  
  return false
}

/**
 * Cross pattern - creates a 3D cross through the center of the cube
 */
export const crossPattern = (x, y, z, size) => {
  const center = Math.floor(size / 2)
  
  // Horizontal beam along x-axis
  if (y === center && z === center) {
    return true
  }
  
  // Vertical beam along y-axis
  if (x === center && z === center) {
    return true
  }
  
  // Depth beam along z-axis
  if (x === center && y === center) {
    return true
  }
  
  return false
}

/**
 * Stairs pattern - creates a spiral staircase-like pattern
 */
export const stairsPattern = (x, y, z, size) => {
  // Get normalized coordinates (0 to 1)
  const nx = x / (size - 1)
  const ny = y / (size - 1)
  const nz = z / (size - 1)
  
  // Stair steps based on height
  if (Math.abs(ny - nz) < 0.2 && nx < 0.8) {
    return true
  }
  
  // Stair steps based on depth
  if (Math.abs(nx - ny) < 0.2 && nz < 0.8) {
    return true
  }
  
  return false
}

/**
 * Random pattern (with seed) - creates a consistent random pattern
 */
export const randomPattern = (x, y, z) => {
  // Pseudorandom hash function
  const hash = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791)
  const normalizedHash = (hash % 100) / 100
  
  // Only show voxels with hash value over threshold
  // Adjust threshold to control density (higher = fewer voxels)
  return normalizedHash > 0.7
}

/**
 * Sphere pattern - approximates a sphere inside the cube
 */
export const spherePattern = (x, y, z, size) => {
  const center = (size - 1) / 2
  const radius = center * 0.8
  
  // Calculate squared distance from center
  const dx = x - center
  const dy = y - center
  const dz = z - center
  const distSquared = dx * dx + dy * dy + dz * dz
  
  // Check if point is inside sphere
  return distSquared <= radius * radius
}

// Export a mapping of pattern names to functions for easier selection
export const patternMap = {
  hollow: hollowCubePattern,
  nested: nestedCubesPattern,
  g: gLetterPattern,
  n: nLetterPattern,
  s: sLetterPattern,
  gns: gnsPattern,
  cross: crossPattern,
  stairs: stairsPattern,
  random: randomPattern,
  sphere: spherePattern,
} 