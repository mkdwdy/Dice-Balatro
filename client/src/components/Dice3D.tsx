import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, useBox, usePlane } from '@react-three/cannon';
import { Text, PerspectiveCamera } from '@react-three/drei';
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
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      
      // 약간 위로 튀어오르게
      api.applyImpulse(
        [(Math.random() - 0.5) * 5, 5 + Math.random() * 5, (Math.random() - 0.5) * 5],
        [0, 0, 0]
      );
    }
  }, [rolling, isLocked, api]);

  // 락인 상태 시각적 효과
  useFrame(() => {
    if (isLocked) {
      // 락인되면 위치 고정 및 회전 멈춤
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
      api.rotation.set(0, 0, 0); // 정면을 보게 리셋 (임시)
      // 실제로는 현재 숫자가 위로 오게 회전해야 함
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
      {/* 6면 텍스처 매핑 - 일단은 모두 같은 숫자로 (나중에 면마다 다르게 할 수 있음) */}
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
    position: [0, -2, 0],
    material: { friction: 0.1 }
  }));
  return (
    <mesh ref={ref as any} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#1a1a1a" />
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
    <div className="w-full h-[400px] rounded-xl overflow-hidden border-2 border-border shadow-inner bg-black/50">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 10, 10]} fov={50} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <Physics gravity={[0, -10, 0]}>
          <Plane />
          {/* Walls to keep dice inside */}
          <Wall position={[0, 0, -6]} args={[12, 10, 1]} />
          <Wall position={[0, 0, 6]} args={[12, 10, 1]} />
          <Wall position={[-6, 0, 0]} args={[1, 10, 12]} />
          <Wall position={[6, 0, 0]} args={[1, 10, 12]} />

          {dices.map((dice, i) => (
            <Dice
              key={dice.id}
              position={[(i - 2) * 1.5, 0, 0]} // 초기 위치 분산
              value={dice.value}
              suit={dice.suit}
              isLocked={dice.locked}
              onLockToggle={() => onLockToggle(dice.id)}
              rolling={rolling}
            />
          ))}
        </Physics>
      </Canvas>
    </div>
  );
}
