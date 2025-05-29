# GNS Logo Cube

An interactive 3D logo cube with customizable patterns and animations built with React Three Fiber.

https://github.com/user-attachments/assets/9e4c2411-d59c-4e95-a3ac-a700289c5738

## Features

- Two operating modes:
  - **Animation Mode**: View and interact with animated 3D cube patterns
  - **Designer Mode**: Create and edit your own 3D cube patterns with texture mapping
- Multiple predefined patterns:
  - GNS Logo (standard and textured versions)
  - Letter patterns (G, N, S)
  - Geometric patterns (hollow cube, nested cubes, cross, stairs)
  - Random pattern generator
- Rich animation system:
  - Wave, breathe, twist, scatter animations
  - Loading-style animations (falling, assembly)
  - Interactive animations that respond to mouse movement
  - Adjustable speed, delay, and interaction strength
- Advanced pattern management:
  - Pattern loading and saving via JSON
  - Built-in pattern library
  - Shareable configurations
- Comprehensive controls:
  - Camera positioning and auto-rotation
  - WASD keyboard navigation
  - Color customization
  - Size and spacing adjustments

## New Features

### Pattern Library
- Built-in collection of cube patterns
- Easy loading of GNS logo with or without textures
- Support for custom pattern loading

### Enhanced Animation Controls
- Adjustable ripple effect strength
- Direct interaction sensitivity control
- Multiple animation types with custom parameters

### Configuration Export/Import
This application supports exporting and importing the full configuration, including:
- Cube pattern and positions
- Texture face information
- Animation settings
- Visual appearance settings

## How to Use

### Animation Mode
1. Select a pattern from the dropdown menu
2. Adjust animation settings (type, speed, interaction)
3. Customize colors and cube properties
4. Use camera controls to view from different angles
5. Export configuration for sharing

### Designer Mode
1. Click in the 3D grid to add/remove cubes
2. Right-click on cubes to cycle through face texturing
3. Use number keys 1-6 to texture specific faces
4. Press 'C' to clear textures from a selected cube
5. Use WASD/QE keys for navigation in the grid
6. Export your design when complete

### Export/Import

1. **Export Configuration**:
   - In Animation mode: Click the "Export Configuration" button
   - In Designer mode: Click the "Export Config" button
   - The configuration will be saved as a JSON file with a timestamp

2. **Import Configuration**:
   - In Animation mode: Click the "Import Configuration" button
   - In Designer mode: Click the "Import Config" button
   - Select your previously exported JSON file

## Configuration Format

The exported JSON file contains:

```json
{
  "visual": {
    "colors": {
      "a": "#fc0398",
      "b": "#333333"
    },
    "cubeSize": 0.8,
    "gap": 0.2
  },
  "animation": {
    "type": "wave",
    "speed": 1.0,
    "interactionFactor": 0.3,
    "delay": 0.1
  },
  "meta": {
    "patternName": "custom",
    "exportDate": "2023-05-20T12:00:00.000Z",
    "version": "1.1"
  },
  "pattern": {
    "cubes": [
      { 
        "x": 0, 
        "y": 0, 
        "z": 0,
        "sides": [
          { "face": "front", "color": "b" },
          { "face": "top", "color": "b" }
        ]
      },
      // ... more cube positions with texture data
    ],
    "colors": {
      "a": "#ffffff",
      "b": "#333333"
    }
  }
}
```

## Development

### Installation

```bash
npm install
```

### Running the development server

```bash
npm run dev
```

### Building for production

```bash
npm run build
```

## Project Structure

- `src/`
  - `components/`
    - `three/`: 3D components using Three.js/R3F
    - `ui/`: User interface components (controls, color pickers)
  - `data/`: Pattern data files (JSON)
  - `store/`: State management using Zustand
  - `utils/`: Utility functions and helpers
  - `App.jsx`: Main application component
  - `Experience.jsx`: Animation mode scene
  - `DesignerExperience.jsx`: Designer mode scene

## Technologies Used

- React
- Three.js
- React Three Fiber (@react-three/fiber)
- drei (@react-three/drei)
- Zustand (state management)
- Vite (build tool)

## Future Enhancements

See the [TODO.md](./TODO.md) file for planned features and improvements.

## License

MIT
