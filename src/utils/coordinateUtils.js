/**
 * Utilities for handling coordinate transformations throughout the GNS Logo R3F project
 * 
 * This centralizes the conversion between grid coordinates (x,y,z) and
 * Three.js world coordinates to ensure consistent handling across components.
 */

/**
 * Convert grid coordinates to world coordinates
 * 
 * @param {number} x - Grid x position
 * @param {number} y - Grid y position
 * @param {number} z - Grid z position
 * @param {number} size - Size of the grid (usually 5)
 * @param {number} cubeSize - Size of individual cubes
 * @param {number} gap - Gap between cubes
 * @returns {[number, number, number]} World coordinates [x, y, z]
 */
export function gridToWorld(x, y, z, size, cubeSize, gap) {
  // Calculate the center offset
  const offset = (size - 1) / 2
  
  // Convert from grid position to world position
  // Fix: For animation mode to have consistent right-front positioning, 
  // we need to invert the x-axis orientation
  const worldX = (offset - x) * (cubeSize + gap) // Invert X-axis orientation
  const worldY = (y - offset) * (cubeSize + gap)
  const worldZ = (z - offset) * (cubeSize + gap)
  
  return [worldX, worldY, worldZ]
}

/**
 * Convert world coordinates to grid coordinates
 * 
 * @param {number} worldX - World x position
 * @param {number} worldY - World y position
 * @param {number} worldZ - World z position
 * @param {number} size - Size of the grid (usually 5)
 * @param {number} cubeSize - Size of individual cubes
 * @param {number} gap - Gap between cubes
 * @returns {[number, number, number]} Grid coordinates [x, y, z]
 */
export function worldToGrid(worldX, worldY, worldZ, size, cubeSize, gap) {
  // Calculate the center offset
  const offset = (size - 1) / 2
  
  // Convert from world position to grid position
  // Matching the inverse of gridToWorld
  const x = Math.round(offset - worldX / (cubeSize + gap)) // Invert X-axis orientation
  const y = Math.round(worldY / (cubeSize + gap) + offset)
  const z = Math.round(worldZ / (cubeSize + gap) + offset)
  
  return [x, y, z]
}

/**
 * Check if a position is within the grid bounds
 * 
 * @param {number} x - Grid x position
 * @param {number} y - Grid y position
 * @param {number} z - Grid z position
 * @param {number} size - Size of the grid (usually 5)
 * @returns {boolean} Whether the position is within bounds
 */
export function isWithinGridBounds(x, y, z, size) {
  return x >= 0 && x < size && y >= 0 && y < size && z >= 0 && z < size
} 