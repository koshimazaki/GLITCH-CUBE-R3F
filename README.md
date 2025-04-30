# GNS Logo Cube

An interactive 3D logo cube with customizable patterns and animations built with React Three Fiber.

## Features

- Interactive 3D cube visualization
- Two operating modes: Animation and Designer
- Multiple predefined patterns (G, N, S letters and more)
- Custom animation types and settings
- Interactive camera controls
- Pattern saving and loading via JSON

## New Feature: Configuration Export/Import

This application now supports exporting and importing the full configuration, including:

- Cube pattern and positions
- Animation settings
- Visual appearance settings

### How to Use Export/Import

1. **Export Configuration**:
   - In Animation mode: Click the "Export Configuration" button in the controls panel
   - In Designer mode: Click the "Export Config" button under the "Full Configuration" section
   - The configuration will be saved as a JSON file with a timestamp

2. **Import Configuration**:
   - In Animation mode: Click the "Import Configuration" button in the controls panel
   - In Designer mode: Click the "Import Config" button under the "Full Configuration" section
   - Select your previously exported JSON file

3. **Using in Other Projects**:
   - You can use the exported configuration in other Three.js or React Three Fiber projects
   - See the example in `src/examples/ExampleUsage.jsx` for a minimal implementation

### Configuration Format

The exported JSON file contains:

```json
{
  "visual": {
    "color": "#fc0398",
    "cubeSize": 0.8,
    "gap": 0.2
  },
  "animation": {
    "type": "wave",
    "speed": 1.0,
    "interactionFactor": 0.3
  },
  "meta": {
    "patternName": "custom",
    "exportDate": "2023-05-20T12:00:00.000Z",
    "version": "1.0"
  },
  "pattern": [
    { "x": 0, "y": 0, "z": 0 },
    { "x": 1, "y": 1, "z": 1 },
    // ... more cube positions
  ]
}
```

## Development

### Installation

```
npm install
```

### Running the development server

```
npm run dev
```

### Building for production

```
npm run build
```

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
