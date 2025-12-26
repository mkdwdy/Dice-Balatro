import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics, useBox, usePlane } from '@react-three/cannon';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const SUIT_COLORS: Record<string, string> = {
  'None': '#ffffff',
  '♠': '#ffffff',
  '♦': '#ffffff',
  '♥': '#ffffff',
  '♣': '#ffffff',
};

const SUIT_TEXT_COLORS: Record<string, string> = {
  'None': '#000000',
  '♠': '#1a1a1a',
  '♦': '#f97316',
  '♥': '#dc2626',
  '♣': '#1e3a5f',
};

const PIP_POSITIONS: Record<number, [number, number][]> = {
  1: [[128, 128]],
  2: [[70, 70], [186, 186]],
  3: [[70, 70], [128, 128], [186, 186]],
  4: [[70, 70], [186, 70], [70, 186], [186, 186]],
  5: [[70, 70], [186, 70], [128, 128], [70, 186], [186, 186]],
  6: [[70, 70], [186, 70], [70, 128], [186, 128], [70, 186], [186, 186]],
  7: [[70, 70], [186, 70], [70, 128], [128, 128], [186, 128], [70, 186], [186, 186]],
  8: [[70, 70], [128, 70], [186, 70], [70, 128], [186, 128], [70, 186], [128, 186], [186, 186]],
  9: [[70, 70], [128, 70], [186, 70], [70, 128], [128, 128], [186, 128], [70, 186], [128, 186], [186, 186]],
};

function createDiceFaceTexture(value: number, suit: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = SUIT_COLORS[suit] || '#ffffff';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 8;
  ctx.strokeRect(0, 0, 256, 256);

  ctx.fillStyle = SUIT_TEXT_COLORS[suit] || '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const symbol = (suit === 'None' || !suit) ? '●' : suit;

  if (value >= 1 && value <= 9) {
    const positions = PIP_POSITIONS[value];
    const fontSize = value <= 4 ? 60 : value <= 6 ? 50 : 40;
    ctx.font = `${fontSize}px sans-serif`;
    
    for (const [x, y] of positions) {
      ctx.fillText(symbol, x, y);
    }
  } else {
    ctx.font = 'bold 100px sans-serif';
    ctx.fillText(value.toString(), 128, 128);
    
    if (suit !== 'None' && suit) {
      ctx.font = '40px sans-serif';
      ctx.fillText(suit, 200, 210);
    }
  }

  return new THREE.CanvasTexture(canvas);
}

interface DiceProps {
  id: number;
  position: [number, number, number];
  value: number;
  suit: string;
  isLocked: boolean;
  onLockToggle: (id: number, detectedValue: number) => void;
  rolling: boolean;
  power: number;
  onValueSettled?: (id: number, value: number) => void;
}

const VALUE_TO_ROTATION: Record<number, [number, number, number]> = {
  1: [-Math.PI / 2, 0, 0],
  2: [0, 0, Math.PI / 2],
  3: [0, 0, 0],
  4: [Math.PI, 0, 0],
  5: [0, 0, -Math.PI / 2],
  6: [Math.PI / 2, 0, 0],
};

function Dice({ id, position, value, suit, isLocked, onLockToggle, rolling, power, onValueSettled }: DiceProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wasRollingRef = useRef(false);
  const settledFramesRef = useRef(0);
  const hasReportedValueRef = useRef(false);
  
  const initialRotation: [number, number, number] = VALUE_TO_ROTATION[value] || [0, 0, 0];
  
  const [ref, api] = useBox(() => ({
    mass: isLocked ? 0 : 1.5,
    position,
    rotation: initialRotation,
    args: [1.5, 1.5, 1.5],
    material: { friction: 0.1, restitution: 0.6 },
    type: isLocked ? 'Static' : 'Dynamic',
  }));

  const velocityRef = useRef([0, 0, 0]);
  const angularVelocityRef = useRef([0, 0, 0]);

  useEffect(() => {
    const unsubVel = api.velocity.subscribe((v) => {
      velocityRef.current = v;
    });
    const unsubAngVel = api.angularVelocity.subscribe((v) => {
      angularVelocityRef.current = v;
    });
    return () => {
      unsubVel();
      unsubAngVel();
    };
  }, [api]);

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
    if (rolling && !isLocked) {
      wasRollingRef.current = true;
      hasReportedValueRef.current = false;
      settledFramesRef.current = 0;
      
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

    if (!rolling && wasRollingRef.current && !hasReportedValueRef.current) {
      const vel = velocityRef.current;
      const angVel = angularVelocityRef.current;
      const speed = Math.sqrt(vel[0] ** 2 + vel[1] ** 2 + vel[2] ** 2);
      const angSpeed = Math.sqrt(angVel[0] ** 2 + angVel[1] ** 2 + angVel[2] ** 2);

      if (speed < 0.1 && angSpeed < 0.1) {
        settledFramesRef.current++;
        if (settledFramesRef.current > 10) {
          const mesh = meshRef.current;
          if (mesh && onValueSettled) {
            const topValue = getTopFaceValue(mesh);
            onValueSettled(id, topValue);
            hasReportedValueRef.current = true;
            wasRollingRef.current = false;
          }
        }
      } else {
        settledFramesRef.current = 0;
      }
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    const mesh = meshRef.current;
    if (mesh) {
      const topValue = getTopFaceValue(mesh);
      onLockToggle(id, topValue);
    }
  };

  return (
    <mesh
      ref={(node) => {
        (ref as any).current = node;
        meshRef.current = node as THREE.Mesh;
      }}
      onClick={handleClick}
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
  const quaternion = mesh.getWorldQuaternion(new THREE.Quaternion());
  
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
    const rotatedNormal = face.normal.clone().applyQuaternion(quaternion);
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
  onLockToggle: (id: number, detectedValue: number) => void;
  rolling: boolean;
  power?: number;
  onValueSettled?: (id: number, value: number) => void;
}

function DiceScene({ dices, onLockToggle, rolling, power = 1, onValueSettled }: DiceBoardProps) {
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
            onLockToggle={onLockToggle}
            rolling={rolling}
            power={power}
            onValueSettled={onValueSettled}
          />
        ))}
      </Physics>
    </>
  );
}

export default function DiceBoard({ dices, onLockToggle, rolling, power = 1, onValueSettled }: DiceBoardProps) {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden border-2 border-border shadow-inner bg-black/80 relative">
      <Canvas shadows dpr={[1, 2]}>
        <DiceScene 
          dices={dices} 
          onLockToggle={onLockToggle} 
          rolling={rolling} 
          power={power}
          onValueSettled={onValueSettled}
        />
      </Canvas>
      
      <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground pointer-events-none">
        Drag to rotate view
      </div>
    </div>
  );
}
