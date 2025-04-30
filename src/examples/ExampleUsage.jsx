import { useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

/**
 * This is an example of how to use the exported GNS Cube configuration
 * in another project. You can import the JSON file and use it to create
 * a similar cube animation with the same settings.
 */

// Example imported configuration
// Replace this with your actual exported configuration file
const exampleConfig = {
  "visual": {
    "color": "#fc0398",
    "cubeSize": 0.8,
    "gap": 0.2
  },
  "animation": {
    "type": "wave",
    "speed": 1,
    "interactionFactor": 0.3
  },
  "meta": {
    "patternName": "custom",
    "exportDate": "2023-05-20T12:00:00.000Z",
    "version": "1.0"
  },
  "pattern": [
    { "x": 0, "y": 0, "z": 0 },
    { "x": 0, "y": 0, "z": 1 },
    { "x": 0, "y": 1, "z": 0 },
    { "x": 0, "y": 1, "z": 1 },
    { "x": 1, "y": 0, "z": 0 },
    { "x": 1, "y": 0, "z": 1 },
    { "x": 1, "y": 1, "z": 0 },
    { "x": 1, "y": 1, "z": 1 }
  ]
};

/**
 * SimpleCube component that uses the exported configuration
 */
function SimpleCube({ config }) {
  const groupRef = useRef();
  const tempObject = useRef(new THREE.Object3D()).current;
  const cubes = useRef([]);
  
  // Extract values from config
  const { visual, animation, pattern } = config;
  const { color, cubeSize, gap } = visual;
  const { type, speed } = animation;
  
  // Create material
  const material = useRef(new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.5,
    metalness: 0.2,
  }));
  
  // Prepare cubes for rendering
  useEffect(() => {
    if (!groupRef.current) return;
    
    // Create positions for all cubes based on pattern
    cubes.current = pattern.map(cube => ({
      position: [
        (cube.x - 2) * (cubeSize + gap),
        (cube.y - 2) * (cubeSize + gap),
        (cube.z - 2) * (cubeSize + gap)
      ],
      id: `${cube.x},${cube.y},${cube.z}`
    }));
    
    // Set initial positions
    cubes.current.forEach((cube, i) => {
      tempObject.position.set(...cube.position);
      tempObject.updateMatrix();
      groupRef.current.setMatrixAt(i, tempObject.matrix);
    });
    
    groupRef.current.instanceMatrix.needsUpdate = true;
  }, [pattern, cubeSize, gap]);
  
  // Animation
  useEffect(() => {
    const animationFrameId = requestAnimationFrame(function animate() {
      if (!groupRef.current) return;
      
      const time = Date.now() * 0.001 * speed;
      
      cubes.current.forEach((cube, i) => {
        const [x, y, z] = cube.position;
        tempObject.position.set(x, y, z);
        
        // Apply animation based on type
        switch (type) {
          case 'wave':
            tempObject.position.y += Math.sin(time + x + z) * 0.2;
            break;
            
          case 'breathe': {
            const scale = 0.8 + Math.sin(time) * 0.2;
            tempObject.scale.set(scale, scale, scale);
            break;
          }
            
          case 'twist':
            tempObject.rotation.y = Math.sin(time + x) * 0.5;
            tempObject.rotation.x = Math.cos(time + z) * 0.5;
            break;
            
          case 'scatter':
            tempObject.position.x += Math.sin(time + y) * 0.1;
            tempObject.position.z += Math.cos(time + x) * 0.1;
            break;
            
          case 'falling': {
            // Falling animation with bouncing effect
            const startDelay = i * (speed * 0.2); // Stagger the falling
            const fallStart = Math.max(0, time - startDelay);
            
            if (fallStart > 0) {
              const gravity = 9.8;
              const fallDistance = 20;
              const fallTime = fallStart;
              
              // Physics-based falling
              let fallY = fallDistance - 0.5 * gravity * fallTime * fallTime;
              
              if (fallY <= 0) {
                const timeSinceLanding = fallTime - Math.sqrt(2 * fallDistance / gravity);
                if (timeSinceLanding > 0) {
                  const bounceHeight = 2 * Math.exp(-timeSinceLanding * 2);
                  fallY = bounceHeight * Math.abs(Math.sin(timeSinceLanding * 5));
                } else {
                  fallY = 0;
                }
              }
              
              tempObject.position.y += fallY;
            } else {
              tempObject.position.y += 20; // Start above
            }
            break;
          }
          
          case 'disconnect': {
            // Pull-apart and reconnect animation
            const cycleLength = 4.0;
            const cycleProgress = (time % cycleLength) / cycleLength;
            
            let disconnectionFactor = 0;
            
            if (cycleProgress < 0.4) {
              disconnectionFactor = Math.pow(cycleProgress / 0.4, 2);
            } else if (cycleProgress < 0.6) {
              disconnectionFactor = 1;
            } else {
              disconnectionFactor = Math.pow(1 - (cycleProgress - 0.6) / 0.4, 2);
            }
            
            const direction = [
              x === 0 ? 0 : Math.sign(x),
              y === 0 ? 0 : Math.sign(y),
              z === 0 ? 0 : Math.sign(z),
            ];
            
            const jitter = Math.sin(i * 1000) * 0.3;
            tempObject.position.x += direction[0] * disconnectionFactor * (1.5 + jitter);
            tempObject.position.y += direction[1] * disconnectionFactor * (1.5 + jitter);
            tempObject.position.z += direction[2] * disconnectionFactor * (1.5 + jitter);
            
            // Add rotation during disconnection
            tempObject.rotation.x = disconnectionFactor * Math.sin(i) * Math.PI * 0.2;
            tempObject.rotation.y = disconnectionFactor * Math.cos(i) * Math.PI * 0.2;
            tempObject.rotation.z = disconnectionFactor * Math.sin(i * 2) * Math.PI * 0.2;
            break;
          }
          
          case 'assembly': {
            // Assembly/disassembly animation
            const assemblyDuration = 2.0;
            const fullCycleTime = 5.0;
            
            const cycleTime = time % fullCycleTime;
            const cyclePhase = cycleTime / fullCycleTime;
            
            const isAssembling = cyclePhase < 0.5;
            const phaseProgress = isAssembling ? 
              cyclePhase * 2 : 
              (1 - (cyclePhase - 0.5) * 2);
            
            const startDelay = i * 0.1;
            const adjustedProgress = Math.max(0, Math.min(1, 
              (phaseProgress * assemblyDuration - startDelay) / 
              (assemblyDuration - startDelay * cubes.current.length / 20)
            ));
            
            const startPositionFactor = 10;
            const randomDir = [
              Math.sin(i * 123.456),
              Math.sin(i * 234.567),
              Math.sin(i * 345.678)
            ];
            
            const interpolationFactor = Math.pow(adjustedProgress, 2);
            
            tempObject.position.x += randomDir[0] * startPositionFactor * (1 - interpolationFactor);
            tempObject.position.y += randomDir[1] * startPositionFactor * (1 - interpolationFactor);
            tempObject.position.z += randomDir[2] * startPositionFactor * (1 - interpolationFactor);
            
            const rotationAmount = (1 - interpolationFactor) * Math.PI * 2;
            tempObject.rotation.x = randomDir[0] * rotationAmount;
            tempObject.rotation.y = randomDir[1] * rotationAmount;
            tempObject.rotation.z = randomDir[2] * rotationAmount;
            break;
          }
            
          default:
            // No animation
            break;
        }
        
        tempObject.updateMatrix();
        groupRef.current.setMatrixAt(i, tempObject.matrix);
      });
      
      groupRef.current.instanceMatrix.needsUpdate = true;
      
      requestAnimationFrame(animate);
    });
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [tempObject, type, speed]);
  
  return (
    <instancedMesh 
      ref={groupRef} 
      args={[null, null, cubes.current.length || 1]}
    >
      <boxGeometry args={[cubeSize, cubeSize, cubeSize]} />
      <meshStandardMaterial ref={material} />
    </instancedMesh>
  );
}

/**
 * Main example component
 */
export default function ExampleUsage() {
  // Using the imported configuration directly without state since we're not modifying it
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas>
        <color attach="background" args={["#15171A"]} />
        
        <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={45} />
        <OrbitControls dampingFactor={0.05} />
        
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        
        <SimpleCube config={exampleConfig} />
      </Canvas>
      
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: 10,
        borderRadius: 5
      }}>
        <h3>GNS Logo Cube Lite Example</h3>
        <p>Using exported configuration from the main app</p>
      </div>
    </div>
  );
} 