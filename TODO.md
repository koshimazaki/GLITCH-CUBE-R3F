# GNS Cube Logo - TODO List

## Feature Enhancements
- [ ] Copy/paste functionality for cubes with faces in designer mode
- [ ] Complete the library of patterns and JSON loading (partially done)
- [ ] Expand the library of movement animations (partially done)
- [ ] Double-check positioning and animation x,y coordinates for consistency
- [ ] Add option to mute ripple effect while keeping direct interaction
- [ ] Improve ripple effect amount to be more sensitive (0-1 range, not just on/off)
- [ ] Add support for varying grid/cube size (3-8 range) not just 5,5,5
- [ ] Add light settings to UI controls to minimise aliasing and clashing 
- [ ] Add environment settings to UI controls
- [ ] Add button to hide grid and floor for a black scene
- [ ] Toggle for basic materials to test with simple lighting
- [ ] Create a separate scene loader where patterns and animations can be loaded independently
- [ ] Add export functionality for mini-scenes in JSON format for use in other projects

## Bug Fixes
- [ ] Fix texture application in logo with black and white pattern (when clicked multiple faces is applied)
- [ ] Ensure consistent coordinate transformation between modes
- [ ] Fix animation transitions when switching patterns (add larp)
- [ ] Fix patterns like Cross, N, S, G not loading in Animation Mode

## Code Refactoring
- [ ] Consolidate duplicate code in Experience.jsx and DesignerExperience.jsx
- [ ] Reorganize store functions for better organization
- [ ] Split logoCubeStore.js into smaller, more manageable modules
- [ ] Improve error handling for pattern loading

## Performance Improvements
- [ ] Add memory management for loaded patterns
- [ ] Implement level-of-detail for distant cubes
- [ ] Fix persistance between the modes and memory use between them so its consistent

## Documentation
- [ ] Update README with new features and usage instructions
- [ ] Add JSDoc comments to major functions and components
- [ ] Create examples showing how to integrate the logo in other projects
- [ ] Document the pattern format for custom patterns

## Testing
- [ ] Add unit tests for core functionality
- [ ] Create test patterns for verifying rendering
- [ ] Test performance with large cube counts

## UI/UX Improvements
- [ ] Improve designer mode UI for easier cube manipulation
- [ ] Add tooltips and help text for controls
- [ ] Provide visual feedback when actions succeed/fail
- [ ] Create a more intuitive interface for texture application
- [ ] Add undo/redo functionality in designer mode 
- [ ] Add higlihting to green and blue when copy / pasting the cubes