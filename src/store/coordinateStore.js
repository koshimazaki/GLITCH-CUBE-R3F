import { create } from 'zustand'
import { gridToWorld, worldToGrid, isWithinGridBounds } from '../utils/coordinateUtils'

/**
 * Central store for coordinate calculations to ensure consistency
 * across all components of the application
 */
const useCoordinateStore = create((set, get) => ({
  // Grid Settings
  size: 5,         // Size of grid (default 5x5x5)
  cubeSize: 0.8,   // Size of individual cubes
  gap: 0.2,        // Gap between cubes
  
  // Update grid settings
  updateGridSettings: (newSettings) => {
    set({ ...newSettings })
  },
  
  // Coordinate transformation functions that use current store values
  gridToWorld: (x, y, z) => {
    const { size, cubeSize, gap } = get()
    return gridToWorld(x, y, z, size, cubeSize, gap)
  },
  
  worldToGrid: (worldX, worldY, worldZ) => {
    const { size, cubeSize, gap } = get()
    return worldToGrid(worldX, worldY, worldZ, size, cubeSize, gap)
  },
  
  // Helper to check if a position is within bounds
  isWithinGridBounds: (x, y, z) => {
    const { size } = get()
    return isWithinGridBounds(x, y, z, size)
  }
}))

export default useCoordinateStore 