import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Leva } from 'leva'
import Experience from './Experience'
import DesignerExperience from './DesignerExperience'
import LogoControls from './components/ui/LogoControls'
import './App.css'

export default function App() {
  const [isDesignerMode, setIsDesignerMode] = useState(false)
  const [panelPosition, setPanelPosition] = useState({ x: 10, y: 10 })
  
  // Calculate panel position based on viewport size
  useEffect(() => {
    const calculatePosition = () => {
      // For left position: use positive small value (10px from left)
      setPanelPosition({ x: -1700, y: 0 })
    }
    
    // Set initial position
    calculatePosition()
    
    // Update position when window is resized
    window.addEventListener('resize', calculatePosition)
    
    return () => {
      window.removeEventListener('resize', calculatePosition)
    }
  }, [])
  
  // Create custom theme and position for Leva panel
  // const levaTheme = {
  //   colors: {
  //     accent1: '#fc0398',
  //     accent2: '#03d7fc',
  //     accent3: '#ffcf33',
  //     highlight1: '#fc0398',
  //     highlight2: '#03d7fc',
  //     highlight3: '#ffcf33'
  //   }
  // }
  
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
            gl={{ 
              antialias: true,
              shadowMap: { 
                enabled: true, 
                type: 'PCFSoftShadowMap'
              }
            }}
          >
            <Experience />
          </Canvas>
          <LogoControls />
        </>
      )}
      
      <Leva 
        hidden={true}
        collapsed={false}
        // theme={levaTheme}
        oneLineLabels={false}
        flat={true}
        titleBar={{
          filter: false,
          title: "GNS Logo Controls",
          drag: true,
          position: panelPosition
        }}
      />
      
      <div className="info">
        <div className="info-panel" style={{
          backgroundColor: 'rgba(0, 0, 0, 0.35)',
          padding: '10px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backdropFilter: 'blur(5px)',
          width: '320px',
          height: '90px',
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: '100'
        }}>
          <img 
            src="/src/assets/textures/gnscube_logo_transparnt.png" 
            alt="Glitch NFT Studio Logo" 
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '10px',
              objectFit: 'cover'
            }}
          />
          <div>
            {/* <h3> Glitch NFT Studio</h3> */}
            <h3> GNS Cube Logo Maker</h3>
            <p>Create 3D logo with custom patterns and animations</p>
          </div>
        </div>
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
