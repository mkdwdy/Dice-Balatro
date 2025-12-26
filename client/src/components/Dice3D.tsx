import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics, useBox, usePlane } from '@react-three/cannon';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const SUIT_COLORS: Record<string, string> = {
  'None': '#ffffff',
  '♠': '#1a1a1a',
  '♦': '#e11d48',
  '♥': '#e11d48',
  '♣': '#1a1a1a',
};

const SUIT_TEXT_COLORS: Record<string, string> = {
  'None': '#000000',
  '♠': '#ffffff',
  '♦': '#ffffff',
  '♥': '#ffffff',
  '♣': '#ffffff',
};

function createDiceFaceTexture(value: number, suit: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = SUIT_COLORS[suit] || '#ffffff';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 10;
  ctx.strokeRect(0, 0, 256, 256);

  ctx.fillStyle = SUIT_TEXT_COLORS[suit] || '#000000';
  ctx.font = 'bold 120px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.fillText(value.toString(), 128, 128);

  if (suit !== 'None') {
    ctx.font = '60px sans-serif';
    ctx.fillText(suit, 200, 200);
  }

  return new THREE.CanvasTexture(canvas);
}

interface DiceProps {
  id: number;
  position: [number, number, number];
  value: number;
  suit: string;
  isLocked: boolean;
  onLockToggle: () => void;
  rolling: boolean;
  power: number;
  onValueDetected: (id: number, value: number) => void;
}

const VALUE_TO_ROTATION: Record<number, [number, number, number]> = {
  1: [Math.PI / 2, 0, 0],
  2: [0, 0, Math.PI / 2],
  3: [0, 0, 0],
  4: [Math.PI, 0, 0],
  5: [0, 0, -Math.PI / 2],
  6: [-Math.PI / 2, 0, 0],
};

function Dice({ id, position, value, suit, isLocked, onLockToggle, rolling, power, onValueDetected }: DiceProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hasReportedValue, setHasReportedValue] = useState(false);
  const lastVelocityRef = useRef<number>(0);
  const stableFramesRef = useRef<number>(0);
  
  const initialRotation: [number, number, number] = VALUE_TO_ROTATION[value] || [0, 0, 0];
  
  const [ref, api] = useBox(() => ({
    mass: isLocked ? 0 : 1.5,
    position,
    rotation: initialRotation,
    args: [1.5, 1.5, 1.5],
    material: { friction: 0.1, restitution: 0.6 },
    type: isLocked ? 'Static' : 'Dynamic',
  }));

  const textures = useMemo(() => {
    return [
      createDiceFaceTexture(2, suit),
      createDiceFaceTexture(5, suit),
      createDiceFaceTexture(3, suit),
      createDiceFaceTexture(4, suit),
      createDiceFaceTexture(1, suit),
      createDiceFaceTexture(6, suit),
    ];
  }, [suit]);

  const materials = useMemo(() => {
    return textures.map(texture => 
      new THREE.MeshStandardMaterial({ 
        map: texture, 
        color: isLocked ? '#ffff00' : '#ffffff' 
      })
    );
  }, [textures, isLocked]);

  useEffect(() => {
    const rotation = VALUE_TO_ROTATION[value] || [0, 0, 0];
    api.rotation.set(rotation[0], rotation[1], rotation[2]);
  }, [value, api]);

  useEffect(() => {
    if (rolling && !isLocked) {
      setHasReportedValue(false);
      stableFramesRef.current = 0;
      
      const powerMultiplier = 0.5 + power * 1.5;
      
      api.velocity.set(0, 5 * powerMultiplier, 0);
      api.angularVelocity.set(
        (Math.random() - 0.5) * 15 * powerMultiplier,
        (Math.random() - 0.5) * 15 * powerMultiplier,
        (Math.random() - 0.5) * 15 * powerMultiplier
      );
      
      api.applyImpulse(
        [
          (Math.random() - 0.5) * 10 * powerMultiplier,
          (10 + Math.random() * 5) * powerMultiplier,
          (Math.random() - 0.5) * 10 * powerMultiplier
        ],
        [0, 0, 0]
      );
      api.wakeUp();
    }
  }, [rolling, isLocked, api, power]);

  useFrame(() => {
    if (isLocked) {
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
      return;
    }

    if (!rolling || hasReportedValue) return;

    const mesh = meshRef.current;
    if (!mesh) return;

    api.velocity.subscribe((velocity) => {
      const speed = Math.sqrt(velocity[0] ** 2 + velocity[1] ** 2 + velocity[2] ** 2);
      
      if (speed < 0.1 && lastVelocityRef.current < 0.1) {
        stableFramesRef.current++;
        
        if (stableFramesRef.current > 30 && !hasReportedValue) {
          const topFaceValue = getTopFaceValue(mesh);
          onValueDetected(id, topFaceValue);
          setHasReportedValue(true);
        }
      } else {
        stableFramesRef.current = 0;
      }
      
      lastVelocityRef.current = speed;
    })();
  });

  return (
    <mesh
      ref={(node) => {
        (ref as any).current = node;
        meshRef.current = node as THREE.Mesh;
      }}
      onClick={(e) => {
        e.stopPropagation();
        onLockToggle();
      }}
      castShadow
      receiveShadow
      material={materials}
    >
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      {isLocked && (
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshBasicMaterial color="yellow" />
        </mesh>
      )}
    </mesh>
  );
}

function getTopFaceValue(mesh: THREE.Mesh): number {
  const rotation = mesh.rotation;
  const matrix = new THREE.Matrix4().makeRotationFromEuler(rotation);
  
  const faces = [
    { normal: new THREE.Vector3(1, 0, 0), value: 2 },
    { normal: new THREE.Vector3(-1, 0, 0), value: 5 },
    { normal: new THREE.Vector3(0, 1, 0), value: 3 },
    { normal: new THREE.Vector3(0, -1, 0), value: 4 },
    { normal: new THREE.Vector3(0, 0, 1), value: 1 },
    { normal: new THREE.Vector3(0, 0, -1), value: 6 },
  ];
  
  const up = new THREE.Vector3(0, 1, 0);
  let maxDot = -Infinity;
  let topValue = 1;
  
  for (const face of faces) {
    const rotatedNormal = face.normal.clone().applyMatrix4(matrix);
    const dot = rotatedNormal.dot(up);
    
    if (dot > maxDot) {
      maxDot = dot;
      topValue = face.value;
    }
  }
  
  return topValue;
}

function Plane() {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    material: { friction: 0.1 }
  }));
  return (
    <mesh ref={ref as any} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#1e293b" />
    </mesh>
  );
}

function Ceiling({ height }: { height: number }) {
  const [ref] = usePlane(() => ({
    rotation: [Math.PI / 2, 0, 0],
    position: [0, height, 0],
    material: { restitution: 0.9 }
  }));
  return <mesh ref={ref as any} visible={false} />;
}

function DynamicWalls() {
  const { camera, size } = useThree();
  
  const bounds = useMemo(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const fovRad = (cam.fov * Math.PI) / 180;
    const cameraHeight = cam.position.y;
    
    const visibleHeight = 2 * Math.tan(fovRad / 2) * cameraHeight;
    const visibleWidth = visibleHeight * (size.width / size.height);
    
    const halfWidth = visibleWidth / 2 * 0.9;
    const halfDepth = visibleHeight / 2 * 0.9;
    const wallHeight = 50;
    const ceilingHeight = 30;
    
    return { halfWidth, halfDepth, wallHeight, ceilingHeight };
  }, [camera, size.width, size.height]);

  return (
    <>
      <Ceiling height={bounds.ceilingHeight} />
      <Wall 
        key={`back-${bounds.halfDepth}`}
        position={[0, bounds.wallHeight / 2, -bounds.halfDepth]} 
        args={[bounds.halfWidth * 2 + 2, bounds.wallHeight, 1]} 
      />
      <Wall 
        key={`front-${bounds.halfDepth}`}
        position={[0, bounds.wallHeight / 2, bounds.halfDepth]} 
        args={[bounds.halfWidth * 2 + 2, bounds.wallHeight, 1]} 
      />
      <Wall 
        key={`left-${bounds.halfWidth}`}
        position={[-bounds.halfWidth, bounds.wallHeight / 2, 0]} 
        args={[1, bounds.wallHeight, bounds.halfDepth * 2 + 2]} 
      />
      <Wall 
        key={`right-${bounds.halfWidth}`}
        position={[bounds.halfWidth, bounds.wallHeight / 2, 0]} 
        args={[1, bounds.wallHeight, bounds.halfDepth * 2 + 2]} 
      />
    </>
  );
}

function Wall({ position, args }: { position: [number, number, number], args: [number, number, number] }) {
  const [ref] = useBox(() => ({ 
    position, 
    args,
    material: { restitution: 0.8 }
  }));
  return (
    <mesh ref={ref as any} visible={false}>
      <boxGeometry args={args} />
    </mesh>
  );
}

interface DiceBoardProps {
  dices: { id: number; value: number; suit: string; locked: boolean }[];
  onLockToggle: (id: number) => void;
  rolling: boolean;
  power?: number;
  onDiceValuesDetected?: (values: Record<number, number>) => void;
}

function DiceScene({ dices, onLockToggle, rolling, power = 1, onDiceValuesDetected }: DiceBoardProps) {
  const detectedValuesRef = useRef<Record<number, number>>({});
  const expectedDiceCountRef = useRef<number>(0);

  useEffect(() => {
    if (rolling) {
      detectedValuesRef.current = {};
      const unlockedCount = dices.filter(d => !d.locked).length;
      expectedDiceCountRef.current = unlockedCount;
    }
  }, [rolling, dices]);

  const handleValueDetected = useCallback((id: number, value: number) => {
    detectedValuesRef.current[id] = value;
    
    const detectedCount = Object.keys(detectedValuesRef.current).length;
    if (detectedCount >= expectedDiceCountRef.current && onDiceValuesDetected) {
      onDiceValuesDetected({ ...detectedValuesRef.current });
    }
  }, [onDiceValuesDetected]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 25, 1]} fov={35} onUpdate={c => c.lookAt(0, 0, 0)} />
      
      <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={0} maxPolarAngle={Math.PI / 2.5} />

      <ambientLight intensity={1.5} />
      <pointLight position={[10, 20, 10]} intensity={2} castShadow />
      <directionalLight 
        position={[0, 30, 0]} 
        intensity={1.5} 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-camera-near={0.1}
        shadow-camera-far={100}
      />

      <Physics gravity={[0, -30, 0]}>
        <Plane />
        <DynamicWalls />

        {dices.map((dice, i) => (
          <Dice
            key={dice.id}
            id={dice.id}
            position={[(i - 2) * 2.5, 6 + i, 0]} 
            value={dice.value}
            suit={dice.suit}
            isLocked={dice.locked}
            onLockToggle={() => onLockToggle(dice.id)}
            rolling={rolling}
            power={power}
            onValueDetected={handleValueDetected}
          />
        ))}
      </Physics>
    </>
  );
}

export default function DiceBoard({ dices, onLockToggle, rolling, power = 1, onDiceValuesDetected }: DiceBoardProps) {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden border-2 border-border shadow-inner bg-black/80 relative">
      <Canvas shadows dpr={[1, 2]}>
        <DiceScene 
          dices={dices} 
          onLockToggle={onLockToggle} 
          rolling={rolling} 
          power={power}
          onDiceValuesDetected={onDiceValuesDetected}
        />
      </Canvas>
      
      <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground pointer-events-none">
        Drag to rotate view
      </div>
    </div>
  );
}
