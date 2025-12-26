import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, useBox, usePlane } from '@react-three/cannon';
import { Text, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// 색상 정의
const SUIT_COLORS: Record<string, string> = {
  'None': '#ffffff',
  '♠': '#1a1a1a', // Black
  '♦': '#e11d48', // Red
  '♥': '#e11d48', // Red
  '♣': '#1a1a1a', // Black
};

const SUIT_TEXT_COLORS: Record<string, string> = {
  'None': '#000000',
  '♠': '#ffffff',
  '♦': '#ffffff',
  '♥': '#ffffff',
  '♣': '#ffffff',
};

// 주사위 면 텍스처 생성 함수
function createDiceFaceTexture(value: number, suit: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // 배경
  ctx.fillStyle = SUIT_COLORS[suit] || '#ffffff';
  ctx.fillRect(0, 0, 256, 256);

  // 테두리
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 10;
  ctx.strokeRect(0, 0, 256, 256);

  // 숫자
  ctx.fillStyle = SUIT_TEXT_COLORS[suit] || '#000000';
  ctx.font = 'bold 120px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  if (value > 0) {
    ctx.fillText(value.toString(), 128, 128);
  }

  // 수트 (작게 표시)
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
}

function Dice({ position, value, suit, isLocked, onLockToggle, rolling }: DiceProps) {
  const [ref, api] = useBox(() => ({
    mass: 1,
    position,
    args: [1, 1, 1],
    material: { friction: 0.1, restitution: 0.5 },
  }));

  const texture = useMemo(() => createDiceFaceTexture(value, suit), [value, suit]);

  // 굴리기 로직
  useEffect(() => {
    if (rolling && !isLocked) {
      // 랜덤한 힘과 회전 가하기
      api.velocity.set(0, 5, 0);
      api.angularVelocity.set(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15
      );
      
      // 위로 튀어오르게
      api.applyImpulse(
        [(Math.random() - 0.5) * 10, 10 + Math.random() * 5, (Math.random() - 0.5) * 10],
        [0, 0, 0]
      );
      // 잠자기 상태 깨우기
      api.wakeUp();
    }
  }, [rolling, isLocked, api]);

  // 락인 상태 시각적 효과
  useFrame(() => {
    if (isLocked) {
      // 락인되면 위치 고정 및 회전 멈춤
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
      
      // 현재 회전 상태를 유지하되 정지 (원한다면 특정 면이 위로 오게 할 수도 있음)
      // 지금은 단순히 물리적 움직임만 정지
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
      {/* 바닥 색상을 좀 더 밝게 하여 시인성 확보 */}
      <meshStandardMaterial color="#1e293b" />
    </mesh>
  );
}

function Wall({ position, args }: { position: [number, number, number], args: [number, number, number] }) {
  const [ref] = useBox(() => ({ position, args }));
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
}

export default function DiceBoard({ dices, onLockToggle, rolling }: DiceBoardProps) {
  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden border-2 border-border shadow-inner bg-black/80 relative">
      <Canvas shadows dpr={[1, 2]}>
        {/* 카메라 위치: 위에서 아래로 직각으로 내려다봄 */}
        <PerspectiveCamera makeDefault position={[0, 25, 1]} fov={35} onUpdate={c => c.lookAt(0, 0, 0)} />
        
        {/* 사용자 조작 가능 (디버깅 및 편의성) */}
        <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={0} maxPolarAngle={Math.PI / 2.5} />

        <ambientLight intensity={1.5} />
        <pointLight position={[10, 20, 10]} intensity={2} castShadow />
        <directionalLight position={[0, 20, 0]} intensity={1.5} castShadow />

        <Physics gravity={[0, -30, 0]}>
          <Plane />
          {/* Walls - 넓은 박스 형태 */}
          <Wall position={[0, 0, -10]} args={[22, 10, 1]} /> {/* Back */}
          <Wall position={[0, 0, 10]} args={[22, 10, 1]} />  {/* Front */}
          <Wall position={[-11, 0, 0]} args={[1, 10, 22]} /> {/* Left */}
          <Wall position={[11, 0, 0]} args={[1, 10, 22]} />  {/* Right */}

          {dices.map((dice, i) => (
            <Dice
              key={dice.id}
              // 초기 위치: 중앙에 모여서 떨어짐
              position={[(i - 2) * 1.5, 5 + i, 0]} 
              value={dice.value}
              suit={dice.suit}
              isLocked={dice.locked}
              onLockToggle={() => onLockToggle(dice.id)}
              rolling={rolling}
            />
          ))}
        </Physics>
      </Canvas>
      
      {/* 3D 뷰포트 안내 텍스트 */}
      <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground pointer-events-none">
        Drag to rotate view
      </div>
    </div>
  );
}
