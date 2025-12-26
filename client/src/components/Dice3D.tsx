import { useRef, useState, useEffect, useMemo } from 'react';
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
  
  if (value > 0) {
    ctx.fillText(value.toString(), 128, 128);
  }

  if (suit !== 'None') {
    ctx.font = '60px sans-serif';
    ctx.fillText(suit, 200, 200);
  }

  return new THREE.CanvasTexture(canvas);
}

interface DiceProps {
  position: [number, number, number];
  value: number;
  suit: string;
  isLocked: boolean;
  onLockToggle: () => void;
  rolling: boolean;
  power: number;
}

function Dice({ position, value, suit, isLocked, onLockToggle, rolling, power }: DiceProps) {
  const [ref, api] = useBox(() => ({
    mass: 1,
    position,
    args: [1, 1, 1],
    material: { friction: 0.1, restitution: 0.5 },
  }));

  const texture = useMemo(() => createDiceFaceTexture(value, suit), [value, suit]);

  useEffect(() => {
    if (rolling && !isLocked) {
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
    }
  });

  return (
    <mesh
      ref={ref as any}
      onClick={(e) => {
        e.stopPropagation();
        onLockToggle();
      }}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial map={texture} color={isLocked ? '#ffff00' : '#ffffff'} />
      {isLocked && (
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
          <meshBasicMaterial color="yellow" />
        </mesh>
      )}
    </mesh>
  );
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
}

export default function DiceBoard({ dices, onLockToggle, rolling, power = 1 }: DiceBoardProps) {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden border-2 border-border shadow-inner bg-black/80 relative">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 25, 1]} fov={35} onUpdate={c => c.lookAt(0, 0, 0)} />
        
        <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={0} maxPolarAngle={Math.PI / 2.5} />

        <ambientLight intensity={1.5} />
        <pointLight position={[10, 20, 10]} intensity={2} castShadow />
        <directionalLight position={[0, 20, 0]} intensity={1.5} castShadow />

        <Physics gravity={[0, -30, 0]}>
          <Plane />
          <DynamicWalls />

          {dices.map((dice, i) => (
            <Dice
              key={dice.id}
              position={[(i - 2) * 1.5, 5 + i, 0]} 
              value={dice.value}
              suit={dice.suit}
              isLocked={dice.locked}
              onLockToggle={() => onLockToggle(dice.id)}
              rolling={rolling}
              power={power}
            />
          ))}
        </Physics>
      </Canvas>
      
      <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground pointer-events-none">
        Drag to rotate view
      </div>
    </div>
  );
}
