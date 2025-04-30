import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Leva } from 'leva'
import Experience from './Experience'
import DesignerExperience from './DesignerExperience'
import LogoControls from './components/ui/LogoControls'
import './App.css'

export default function App() {
  const [isDesignerMode, setIsDesignerMode] = useState(false)
  
  // Create a custom event to notify components when mode changes
  const handleModeChange = (newMode) => {
    setIsDesignerMode(newMode)
    
    // Dispatch a custom event to notify other components about mode change
    const event = new CustomEvent('modechange', { 
      detail: { isDesignerMode: newMode } 
    })
    window.dispatchEvent(event)
  }
  
  return (
    <div className="app">
      {isDesignerMode ? (
        <DesignerExperience />
      ) : (
        <>
          <Canvas
            shadows
            camera={{ position: [5, 5, 5], fov: 45 }}
            dpr={[1, 2]} // Responsive rendering based on device pixel ratio
          >
            <Experience />
          </Canvas>
          <LogoControls />
        </>
      )}
      
      <Leva collapsed hidden />
      
      <div className="info">
        <h1>GNS Logo Cube</h1>
        <p>Interactive 3D logo with customizable patterns and animations</p>
      </div>
      
      <div className="mode-switch">
        <button 
          className={isDesignerMode ? '' : 'active'} 
          onClick={() => handleModeChange(false)}
        >
          Animation Mode
        </button>
        <button 
          className={isDesignerMode ? 'active' : ''} 
          onClick={() => handleModeChange(true)}
        >
          Designer Mode
        </button>
      </div>
    </div>
  )
}
