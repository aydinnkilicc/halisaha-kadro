import React, { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Text,
  Environment,
  ContactShadows,
  useGLTF,
  Billboard,
} from "@react-three/drei";
import * as THREE from "three";

// -----------------------------
// Modern UI Bileşenleri
// -----------------------------
function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <label className={`block text-sm font-bold text-white/90 mb-2 ${className}`}>{children}</label>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/60 
                 focus:bg-white/15 focus:border-white/40 focus:ring-4 focus:ring-blue-400/30 transition-all duration-300
                 shadow-lg hover:shadow-xl hover:bg-white/15 ${className}`}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { className?: string }) {
  const { className = "", ...rest } = props;
  return (
    <select
      {...rest}
      className={`w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl px-4 py-3 text-white
                 focus:bg-white/15 focus:border-white/40 focus:ring-4 focus:ring-blue-400/30 transition-all duration-300
                 shadow-lg hover:shadow-xl hover:bg-white/15 ${className}`}
    />
  );
}

function ModernButton({ children, variant = "primary", size = "md", className = "", ...props }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    variant?: "primary" | "secondary" | "danger" | "success" | "glass";
    size?: "sm" | "md" | "lg";
    className?: string;
  }) {

  const variants = {
    primary: "bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700 hover:from-blue-600 hover:via-purple-600 hover:to-blue-800 text-white shadow-xl hover:shadow-blue-500/25",
    secondary: "bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 hover:from-gray-700 hover:via-gray-800 hover:to-black text-white shadow-xl hover:shadow-gray-500/25",
    danger: "bg-gradient-to-br from-red-500 via-red-600 to-pink-700 hover:from-red-600 hover:via-pink-600 hover:to-red-800 text-white shadow-xl hover:shadow-red-500/25",
    success: "bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 hover:from-green-600 hover:via-emerald-600 hover:to-green-800 text-white shadow-xl hover:shadow-green-500/25",
    glass: "bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20 text-white shadow-xl hover:shadow-white/10"
  };

  const sizes = {
    sm: "px-3 py-2 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base"
  };

  return (
    <button
      {...props}
      className={`${variants[variant]} ${sizes[size]} rounded-2xl font-semibold transition-all duration-300 
                 hover:scale-[1.03] active:scale-95 transform modern-button touch-target
                 border-0 backdrop-blur-lg ${className}`}
    >
      {children}
    </button>
  );
}

// Modern Toggle Switch
function ModernToggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <div className="flex items-center space-x-3">
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 
                   ${checked ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-white/20'} 
                   shadow-lg backdrop-blur-lg border border-white/20`}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 
                     ${checked ? 'translate-x-7' : 'translate-x-1'}`}
        />
      </button>
      <span className="text-white/90 font-medium">{label}</span>
    </div>
  );
}

// Modern Slider
function ModernSlider({ value, onChange, min, max, step, label, unit = "" }: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  label: string;
  unit?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label>{label}</Label>
        <span className="text-white/80 bg-white/10 px-3 py-1 rounded-xl backdrop-blur-lg border border-white/20 font-mono text-sm">
          {value.toFixed(1)}{unit}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-3 bg-white/10 rounded-xl appearance-none cursor-pointer backdrop-blur-lg premium-slider
                     slider-thumb:appearance-none slider-thumb:h-6 slider-thumb:w-6 slider-thumb:rounded-full 
                     slider-thumb:bg-gradient-to-r slider-thumb:from-blue-500 slider-thumb:to-purple-600
                     slider-thumb:shadow-xl slider-thumb:cursor-pointer hover:slider-thumb:scale-110
                     focus:outline-none focus:ring-4 focus:ring-blue-400/30"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #8b5cf6 ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) 100%)`
          }}
        />
      </div>
    </div>
  );
}

// Modern 3D Admin Status Bar
function AdminStatusBar({ isAdmin, onLogout }: { isAdmin: boolean; onLogout: () => void }) {
  if (!isAdmin) return null;

  return (
    <div className="mb-6 bg-gradient-to-r from-green-500/20 to-emerald-600/20 backdrop-blur-xl 
                    border border-green-400/30 rounded-3xl p-6 shadow-2xl transform perspective-1000 
                    hover:scale-105 hover:rotateX-5 transition-all duration-500 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-5 h-5 bg-green-400 rounded-full animate-ping absolute"></div>
            <div className="w-5 h-5 bg-green-400 rounded-full shadow-lg shadow-green-400/50"></div>
          </div>
          <div>
            <span className="text-green-300 font-bold text-xl block">🛡️ Admin Panel Aktif</span>
            <span className="text-green-200/70 text-sm">Tüm yönetim yetkileriniz aktif</span>
          </div>
        </div>
        <ModernButton
          onClick={onLogout}
          variant="danger"
          size="sm"
          className="animate-bounce hover:animate-none"
        >
          🚪 Güvenli Çıkış
        </ModernButton>
      </div>
    </div>
  );
}

// (AdminHoverPopup bileşeni kaldırıldı)

// Ultra Modern 3D Admin Login Modal
function AdminLoginModal({ isOpen, onClose, onLogin }: {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (password: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnimating(true);

    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        onLogin(password);
        setPassword("");
        setAttempt(0);
      } else {
        setAttempt(prev => prev + 1);
        // Hatalı giriş animasyonu
        setTimeout(() => {
          setPassword("");
        }, 1000);
      }
      setIsAnimating(false);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-pink-900/30 animate-gradient-shift"></div>
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Modal Container */}
      <div className={`relative bg-gradient-to-br from-gray-900/95 via-blue-900/95 to-purple-900/95 backdrop-blur-2xl 
                      border-2 border-white/30 rounded-3xl p-10 shadow-2xl max-w-md w-full mx-4
                      transform transition-all duration-700 hover:scale-105 perspective-1000
                      ${isAnimating ? 'animate-pulse scale-110' : ''}
                      ${attempt > 0 ? 'animate-shake border-red-400/50' : ''}`}>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full
                     flex items-center justify-center text-white/70 hover:text-white transition-all duration-300
                     backdrop-blur-lg border border-white/20 hover:scale-110 hover:rotate-90"
        >
          ✕
        </button>

        {/* Header Section */}
        <div className="text-center mb-8">
          <div className={`w-20 h-20 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 rounded-3xl 
                          flex items-center justify-center mx-auto mb-6 shadow-2xl transform transition-all duration-500
                          ${isAnimating ? 'animate-spin scale-125' : 'hover:scale-110 hover:rotate-12'}`}>
            <span className="text-3xl animate-pulse">🔐</span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🛡️ Güvenli Admin Girişi
          </h2>

          <div className="space-y-2">
            <p className="text-white/80">Yönetici paneline erişim için</p>
            <p className="text-white/60 text-sm">güvenlik şifrenizi giriniz</p>
            {attempt > 0 && (
              <p className="text-red-400 text-sm font-semibold animate-pulse">
                ❌ Hatalı şifre! Deneme: {attempt}/3
              </p>
            )}
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Input
              type="password"
              placeholder="🔑 Güvenlik şifrenizi girin..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`text-center text-lg font-mono tracking-widest transition-all duration-300
                         ${attempt > 0 ? 'border-red-400/50 shake' : ''}
                         ${isAnimating ? 'animate-pulse' : ''}`}
              autoFocus
              disabled={isAnimating}
            />

            {/* Security indicator */}
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              {password.length > 0 && (
                <div className={`w-3 h-3 rounded-full transition-all duration-300
                               ${password === ADMIN_PASSWORD ? 'bg-green-400 animate-pulse' : 'bg-orange-400'}`} />
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <ModernButton
              type="submit"
              variant="success"
              className={`flex-1 relative overflow-hidden group
                         ${isAnimating ? 'animate-pulse pointer-events-none' : ''}`}
              disabled={isAnimating}
            >
              <div className="relative z-10 flex items-center justify-center space-x-2">
                {isAnimating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Doğrulanıyor...</span>
                  </>
                ) : (
                  <>
                    <span>🔓</span>
                    <span>Güvenli Giriş</span>
                  </>
                )}
              </div>

              {/* Button glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 
                             group-hover:opacity-20 transition-opacity duration-300 rounded-2xl" />
            </ModernButton>

            <ModernButton
              type="button"
              onClick={onClose}
              variant="secondary"
              className="flex-1 hover:bg-gradient-to-r hover:from-gray-600 hover:to-gray-800"
              disabled={isAnimating}
            >
              <span className="flex items-center justify-center space-x-2">
                <span>❌</span>
                <span>İptal</span>
              </span>
            </ModernButton>
          </div>

          {/* Help Text */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
              <span className="text-white/30 text-xs">Güvenli bağlantı aktif</span>
            </div>
          </div>
        </form>

        {/* Decorative Elements */}
        <div className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 
                       rounded-full opacity-60 animate-pulse" />
        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-600 
                       rounded-full opacity-60 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
    </div>
  );
}

// -----------------------------
// Sabitler ve Pozisyon Koordinatları
// -----------------------------
const PITCH_WIDTH = 18;
const PITCH_LENGTH = 28;
const ADMIN_PASSWORD = (import.meta.env.VITE_ADMIN_PASSWORD as string) ?? "";

// Pozisyon yerleştirme koordinatları (referans görsele göre ayarlandı)
const POSITION_COORDINATES = {
  1: { // Takım 1 (Mavi - Sağ yarı saha)
    "KALECİ": { x: 11, z: 0 },
    "DEFANS": [
      { x: 7, z: -7 },  // DEFANS 1-3 (alt)
      { x: 7, z: 7 },   // DEFANS 1-2 (üst) 
      { x: 3, z: -3 },  // DEFANS 1-4 (orta alt)
      { x: 7, z: 0 }    // Ek defans pozisyonu
    ],
    "ORTA SAHA": [
      { x: 3, z: 5 },   // ORTA SAHA 1-5 (üst)
      { x: 1, z: 0 },   // ORTA SAHA 1-6 (merkez)
      { x: -2, z: -6 }, // Ek orta saha pozisyonu
      { x: -2, z: 6 }   // Ek orta saha pozisyonu
    ],
    "FORVET": [
      { x: -1, z: 3 },  // FORVET 1-7 (üst)
      { x: -1, z: -3 }  // Ek forvet pozisyonu
    ],
    "KANAT": [
      { x: 4, z: -10 }, // Sol kanat
      { x: 4, z: 10 }   // Sağ kanat
    ]
  },
  2: { // Takım 2 (Kırmızı - Sol yarı saha)  
    "KALECİ": { x: -11, z: 0 },
    "DEFANS": [
      { x: -7, z: 7 },   // DEFANS 2-2 (üst)
      { x: -7, z: -7 },  // DEFANS 2-3 (alt) 
      { x: -7, z: 2 },   // DEFANS 2-4 (orta üst)
      { x: -7, z: -2 }   // Ek defans pozisyonu
    ],
    "ORTA SAHA": [
      { x: -3, z: -5 },  // ORTA SAHA 2-5 (alt)
      { x: -1, z: 0 },   // ORTA SAHA 2-6 (merkez)
      { x: 2, z: 6 },    // Ek orta saha pozisyonu
      { x: 2, z: -6 }    // Ek orta saha pozisyonu
    ],
    "FORVET": [
      { x: 1, z: -3 },   // FORVET 2-7 (alt)
      { x: 1, z: 3 }     // Ek forvet pozisyonu
    ],
    "KANAT": [
      { x: -4, z: 10 },  // Sol kanat
      { x: -4, z: -10 }  // Sağ kanat
    ]
  }
};

// -----------------------------
// Tipler ve Yardımcı Fonksiyonlar
// -----------------------------
type Player = {
  id: string;
  name: string;
  role: string;
  team: number;
  x: number;
  z: number;
  facing: number;
  y: number;
};

type LabelStyle = {
  colorTeam1: string;
  colorTeam2: string;
  size: number;
  outlineWidth: number;
  outlineColor: string;
  globalY: number;
  nameIconDistance: number;
};

// Otomatik pozisyon yerleştirme fonksiyonu
function getAutoPosition(team: number, role: string, existingPlayers: Player[]): { x: number; z: number; facing: number } {
  const teamPositions = POSITION_COORDINATES[team as keyof typeof POSITION_COORDINATES];
  const positions = teamPositions[role as keyof typeof teamPositions];

  if (!positions) {
    return {
      x: (Math.random() - 0.5) * PITCH_WIDTH,
      z: (Math.random() - 0.5) * PITCH_LENGTH,
      facing: team === 1 ? 0 : Math.PI
    };
  }

  if (Array.isArray(positions)) {
    const sameRoleCount = existingPlayers.filter(p => p.team === team && p.role === role).length;
    const positionIndex = sameRoleCount % positions.length;

    return {
      x: positions[positionIndex].x,
      z: positions[positionIndex].z,
      facing: team === 1 ? 0 : Math.PI
    };
  } else {
    return {
      x: positions.x,
      z: positions.z,
      facing: team === 1 ? 0 : Math.PI
    };
  }
}

// -----------------------------
// GLTF Model (Halı saha)
// -----------------------------
function PitchGLB({ object, ...props }: { object?: any } & Partial<JSX.IntrinsicElements["primitive"]>) {
  const { scene } = useGLTF("/models/halisaha.glb");

  const [center, minY] = React.useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const c = new THREE.Vector3();
    box.getCenter(c);
    return [c, box.min.y] as [THREE.Vector3, number];
  }, [scene]);

  // Outer group pivot at model center; positioned so model bottom stays on ground (y=0)
  return (
    <group {...props} position={[0, center.y - minY, 0]}>
      <group position={[-center.x, -center.y, -center.z]}>
        <primitive object={object || scene} />
      </group>
    </group>
  );
}

// -----------------------------
// Oyuncu isimleri ve ikonları - Akıllı görselleştirme
// -----------------------------
function PlayerWithIcon({ p, setDragId, labelStyle, isAdmin }: {
  p: Player;
  setDragId: React.Dispatch<React.SetStateAction<string | null>>;
  labelStyle: LabelStyle;
  isAdmin: boolean;
}) {
  const texture = React.useMemo(() => {
    const loader = new THREE.TextureLoader();
    return loader.load('/icons/ikon.png',
      undefined, // onLoad
      undefined, // onProgress
      (error) => console.warn('Ikon yüklenemedi:', error) // onError
    );
  }, []);

  const iconSize = labelStyle.size * 0.8;
  const { camera } = useThree();
  const [isTopView, setIsTopView] = React.useState(false);

  // Kamera açısını kontrol et
  React.useEffect(() => {
    const checkCameraAngle = () => {
      const cameraY = camera.position.y;
      const distance = Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2);
      const angle = Math.atan2(cameraY, distance) * (180 / Math.PI);

      // 60 derece üstü = yukarıdan bakış
      setIsTopView(angle > 60);
    };

    checkCameraAngle();

    // Kamera hareketi izle
    const interval = setInterval(checkCameraAngle, 100);
    return () => clearInterval(interval);
  }, [camera]);

  return (
    <group
      position={[p.x, Math.max(0.5, labelStyle.globalY), p.z]}
      rotation={[0, p.facing, 0]}
      onPointerDown={isAdmin ? (e) => { e.stopPropagation(); setDragId(p.id); } : undefined}
    >
      {isTopView ? (
        // Yukarıdan bakış modu
        <group rotation={[-Math.PI / 2, 0, 0]} position={[0, Math.max(0.6, 0.1), 0]}>
          <Text
            fontSize={labelStyle.size}
            color={p.team === 1 ? labelStyle.colorTeam1 : labelStyle.colorTeam2}
            anchorX="center"
            anchorY="middle"
            outlineWidth={labelStyle.outlineWidth * 2}
            outlineColor={labelStyle.outlineColor}
            renderOrder={1000}
            position={[0, 0, Math.max(0.55, 0.05)]}
          >
            {p.name || "Oyuncu"}
          </Text>

          <mesh position={[0, 0, Math.max(0.5, 0)]} rotation={[0, 0, 0]}>
            <planeGeometry args={[iconSize, iconSize]} />
            <meshBasicMaterial
              map={texture}
              transparent
              alphaTest={0.1}
              color={p.team === 1 ? labelStyle.colorTeam1 : labelStyle.colorTeam2}
              opacity={0.9}
            />
          </mesh>
        </group>
      ) : (
        // Normal görünüm modu
        <Billboard follow lockX={false} lockY={false} lockZ={false}>
          <Text
            fontSize={labelStyle.size}
            color={p.team === 1 ? labelStyle.colorTeam1 : labelStyle.colorTeam2}
            anchorX="center"
            anchorY="bottom"
            outlineWidth={labelStyle.outlineWidth}
            outlineColor={labelStyle.outlineColor}
            renderOrder={999}
            position={[0, Math.max(0.1, labelStyle.nameIconDistance), 0]}
          >
            {p.name || "Oyuncu"}
          </Text>

          <mesh position={[0, Math.max(0.5, -labelStyle.nameIconDistance), 0]}>
            <planeGeometry args={[iconSize, iconSize]} />
            <meshBasicMaterial
              map={texture}
              transparent
              alphaTest={0.1}
              color={p.team === 1 ? labelStyle.colorTeam1 : labelStyle.colorTeam2}
            />
          </mesh>
        </Billboard>
      )}
    </group>
  );
}

// -----------------------------
// Saha + Oyuncular
// -----------------------------
function SceneContent({ players, setPlayers, orbitEnabled, labelStyle, cameraInfo, setCameraInfo, manualCameraUpdate, isAdmin }: {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  orbitEnabled: boolean;
  labelStyle: LabelStyle;
  cameraInfo: any;
  setCameraInfo: React.Dispatch<React.SetStateAction<any>>;
  manualCameraUpdate: any;
  isAdmin: boolean;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const { camera, size } = useThree();
  const controlsRef = useRef<any>(null);
  const pitchRef = useRef<THREE.Group>(null);
  const [initialized, setInitialized] = useState(false);

  // Kamera bilgilerini sürekli güncelle
  useEffect(() => {
    const updateCameraInfo = () => {
      const pos = camera.position;
      const distance = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2);
      const angle = Math.atan2(pos.y, Math.sqrt(pos.x ** 2 + pos.z ** 2)) * (180 / Math.PI);

      setCameraInfo({
        position: { x: pos.x.toFixed(2), y: pos.y.toFixed(2), z: pos.z.toFixed(2) },
        distance: distance.toFixed(2),
        angle: angle.toFixed(1)
      });
    };

    updateCameraInfo();
    const interval = setInterval(updateCameraInfo, 100);
    return () => clearInterval(interval);
  }, [camera, setCameraInfo]);

  // Manuel kamera güncellemeleri
  useEffect(() => {
    if (manualCameraUpdate) {
      if (manualCameraUpdate.type === 'position') {
        camera.position.set(
          manualCameraUpdate.x,
          manualCameraUpdate.y,
          manualCameraUpdate.z
        );
      } else if (manualCameraUpdate.type === 'distance') {
        const currentPos = camera.position;
        const currentDistance = Math.sqrt(currentPos.x ** 2 + currentPos.y ** 2 + currentPos.z ** 2);
        const ratio = manualCameraUpdate.distance / currentDistance;
        camera.position.multiplyScalar(ratio);
      } else if (manualCameraUpdate.type === 'angle') {
        const currentPos = camera.position;
        const horizontalDistance = Math.sqrt(currentPos.x ** 2 + currentPos.z ** 2);
        const newY = horizontalDistance * Math.tan(manualCameraUpdate.angle * Math.PI / 180);
        camera.position.y = newY;
      } else if (manualCameraUpdate.type === 'preset') {
        camera.position.set(
          manualCameraUpdate.x,
          manualCameraUpdate.y,
          manualCameraUpdate.z
        );
      }

      if (controlsRef.current) {
        controlsRef.current.update();
      }
    }
  }, [manualCameraUpdate, camera]);

  useEffect(() => {
    if (!pitchRef.current || initialized) return;

    const box = new THREE.Box3().setFromObject(pitchRef.current);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const sizeV = new THREE.Vector3();
    box.getSize(sizeV);
    const maxDim = Math.max(sizeV.x, sizeV.y, sizeV.z);

    const fov = (camera as any).fov * (Math.PI / 180);
    let distance = (maxDim / 2) / Math.tan(fov / 2);
    distance *= 0.8;

    (camera as any).position.set(0.01, 23.4, 20.34);
    (camera as any).lookAt(center);

    if (controlsRef.current) {
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }

    setInitialized(true);
  }, [camera, size, initialized]);

  useEffect(() => {
    const stopDrag = (e: MouseEvent) => {
      if (dragId && isAdmin) {
        e.preventDefault();
        setDragId(null);
      }
    };
    window.addEventListener("contextmenu", stopDrag);
    window.addEventListener("mouseup", stopDrag);
    return () => {
      window.removeEventListener("contextmenu", stopDrag);
      window.removeEventListener("mouseup", stopDrag);
    };
  }, [dragId, isAdmin]);

  const updatePosition = (id: string, x: number, z: number) => {
    if (!isAdmin) return;
    setPlayers((prev) => prev.map((pp) => (pp.id === id ? { ...pp, x, z } : pp)));
  };

  const InteractionPlane = () => (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      onPointerMove={(e) => {
        if (!dragId || !isAdmin) return;
        e.stopPropagation();
        updatePosition(dragId, e.point.x, e.point.z);
      }}
    >
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight castShadow intensity={1.2} position={[15, 20, 10]} />
      <Environment preset="sunset" />

      <group ref={pitchRef} position={[0, 0, 0]}>
        <PitchGLB />
      </group>

      {players.map((p) => (
        <PlayerWithIcon
          key={p.id}
          p={p}
          labelStyle={labelStyle}
          setDragId={setDragId}
          isAdmin={isAdmin}
        />
      ))}
      {dragId && isAdmin && <InteractionPlane />}

      <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={50} blur={3} far={10} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={(!dragId || !isAdmin) && orbitEnabled}
        enablePan={true}
        enableRotate={true}
        enableZoom={true}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  );
}

function SceneWrapper({ players, setPlayers, orbitEnabled, labelStyle, cameraInfo, setCameraInfo, manualCameraUpdate, isAdmin }: {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  orbitEnabled: boolean;
  labelStyle: LabelStyle;
  cameraInfo: any;
  setCameraInfo: React.Dispatch<React.SetStateAction<any>>;
  manualCameraUpdate: any;
  isAdmin: boolean;
}) {
  return (
    <Canvas shadows camera={{ position: [0.01, 23.4, 20.34], fov: 55 }}>
      <SceneContent
        players={players}
        setPlayers={setPlayers}
        orbitEnabled={orbitEnabled}
        labelStyle={labelStyle}
        cameraInfo={cameraInfo}
        setCameraInfo={setCameraInfo}
        manualCameraUpdate={manualCameraUpdate}
        isAdmin={isAdmin}
      />
    </Canvas>
  );
}

// -----------------------------
// Modern Oyuncu Kartı
// -----------------------------
function ModernPlayerCard({ player, onUpdate, onRemove, isSelected, onSelect }: {
  player: Player;
  onUpdate: (field: string, value: string) => void;
  onRemove: () => void;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>("");

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
  };

  const finishEdit = () => {
    if (editingField) {
      onUpdate(editingField, tempValue);
    }
    setEditingField(null);
    setTempValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishEdit();
    } else if (e.key === 'Escape') {
      setEditingField(null);
      setTempValue("");
    }
  };

  const teamGradient = player.team === 1
    ? "from-blue-500/30 via-blue-600/30 to-cyan-500/30"
    : "from-red-500/30 via-red-600/30 to-pink-500/30";

  const teamBorder = player.team === 1
    ? "border-blue-400/50"
    : "border-red-400/50";

  return (
    <div className={`bg-gradient-to-br ${teamGradient} backdrop-blur-lg border ${teamBorder} 
                    rounded-2xl p-4 transition-all duration-300 hover:scale-105 shadow-2xl
                    ${isSelected ? 'ring-4 ring-white/50 shadow-2xl' : 'hover:shadow-xl'}
                    transform hover:rotate-1`}>
      <div className="flex items-center gap-3">
        <div className="flex-1 space-y-3">
          {/* Oyuncu Adı */}
          <div className="flex items-center gap-2">
            {editingField === 'name' ? (
              <Input
                type="text"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={finishEdit}
                onKeyDown={handleKeyPress}
                className="text-sm font-bold"
                autoFocus
              />
            ) : (
              <div
                className="font-bold text-white cursor-pointer hover:bg-white/20 px-3 py-2 rounded-xl flex-1 
                           transition-all duration-300 hover:scale-105 backdrop-blur-lg"
                onClick={() => {
                  onSelect();
                  startEdit('name', player.name);
                }}
              >
                ⭐ {player.name}
              </div>
            )}
          </div>

          {/* Pozisyon */}
          <div className="flex items-center gap-2">
            {editingField === 'role' ? (
              <Select
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={finishEdit}
                onKeyDown={handleKeyPress}
                className="text-xs"
                autoFocus
              >
                <option value="KALECİ">🥅 Kaleci</option>
                <option value="DEFANS">🛡️ Defans</option>
                <option value="ORTA SAHA">⚽ Orta Saha</option>
                <option value="FORVET">🎯 Forvet</option>
                <option value="KANAT">🏃 Kanat</option>
              </Select>
            ) : (
              <div
                className="text-sm text-white/90 cursor-pointer hover:bg-white/20 px-3 py-2 rounded-xl flex-1
                           transition-all duration-300 hover:scale-105 backdrop-blur-lg"
                onClick={() => {
                  onSelect();
                  startEdit('role', player.role);
                }}
              >
                {player.role === 'KALECİ' && '🥅'}
                {player.role === 'DEFANS' && '🛡️'}
                {player.role === 'ORTA SAHA' && '⚽'}
                {player.role === 'FORVET' && '🎯'}
                {player.role === 'KANAT' && '🏃'}
                {' '}{player.role}
              </div>
            )}
          </div>

          {/* Takım */}
          <div className="flex items-center gap-2">
            {editingField === 'team' ? (
              <Select
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={finishEdit}
                onKeyDown={handleKeyPress}
                className="text-xs"
                autoFocus
              >
                <option value="1">🔵 Takım 1</option>
                <option value="2">🔴 Takım 2</option>
              </Select>
            ) : (
              <div
                className="text-xs text-white/80 cursor-pointer hover:bg-white/20 px-3 py-2 rounded-xl flex-1
                           transition-all duration-300 hover:scale-105 backdrop-blur-lg"
                onClick={() => {
                  onSelect();
                  startEdit('team', player.team.toString());
                }}
              >
                {player.team === 1 ? '🔵' : '🔴'} Takım {player.team}
              </div>
            )}
          </div>
        </div>

        <ModernButton
          onClick={onRemove}
          variant="danger"
          size="sm"
          className="hover:rotate-90 transform transition-all duration-300"
        >
          🗑️
        </ModernButton>
      </div>
    </div>
  );
}

// -----------------------------
// Modern 3D Sağ Panel (Güncellenmiş tasarım)
// -----------------------------
function ModernSidePanel({
  players, setPlayers, selectedId, setSelectedId, orbitEnabled, setOrbitEnabled,
  labelStyle, setLabelStyle, cameraInfo, setCameraPosition, setCameraDistance,
  setCameraAngle, resetCamera, topView, sideView, isAdmin
}: {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  selectedId: string | null;
  setSelectedId: React.Dispatch<React.SetStateAction<string | null>>;
  orbitEnabled: boolean;
  setOrbitEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  labelStyle: LabelStyle;
  setLabelStyle: React.Dispatch<React.SetStateAction<LabelStyle>>;
  cameraInfo: any;
  setCameraPosition: (axis: string, value: number) => void;
  setCameraDistance: (value: number) => void;
  setCameraAngle: (value: number) => void;
  resetCamera: () => void;
  topView: () => void;
  sideView: () => void;
  isAdmin: boolean;
}) {

  const updatePlayer = (id: string, field: string, value: string) => {
    if (!isAdmin) return;

    if (field === 'team') {
      const player = players.find(p => p.id === id);
      if (player) {
        const newTeam = parseInt(value);
        const autoPos = getAutoPosition(newTeam, player.role, players.filter(p => p.id !== id));
        setPlayers((prev) => prev.map((pp) => (pp.id === id ? {
          ...pp,
          [field]: newTeam,
          x: autoPos.x,
          z: autoPos.z,
          facing: autoPos.facing
        } : pp)));
      }
    } else if (field === 'role') {
      const player = players.find(p => p.id === id);
      if (player) {
        const autoPos = getAutoPosition(player.team, value, players.filter(p => p.id !== id));
        setPlayers((prev) => prev.map((pp) => (pp.id === id ? {
          ...pp,
          [field]: value,
          x: autoPos.x,
          z: autoPos.z,
          facing: autoPos.facing
        } : pp)));
      }
    } else {
      setPlayers((prev) => prev.map((pp) => (pp.id === id ? { ...pp, [field]: value } : pp)));
    }
  };

  const addPlayer = (team: number) => {
    if (!isAdmin) return;

    const newId = Date.now().toString();
    const defaultRole = "ORTA SAHA";
    const autoPos = getAutoPosition(team, defaultRole, players);

    setPlayers((prev) => [...prev, {
      id: newId,
      name: `Oyuncu ${prev.length + 1}`,
      role: defaultRole,
      team,
      x: autoPos.x,
      z: autoPos.z,
      facing: autoPos.facing,
      y: 0
    }]);
    setSelectedId(newId);
  };

  const addTeam7 = () => {
    if (!isAdmin) return;

    const roles7 = ["KALECİ", "DEFANS", "DEFANS", "DEFANS", "ORTA SAHA", "ORTA SAHA", "FORVET"];
    const newPlayers: Player[] = [];

    [1, 2].forEach((team) => {
      roles7.forEach((role, idx) => {
        const newId = `${team}-${Date.now()}-${idx}`;
        const autoPos = getAutoPosition(team, role, [...players, ...newPlayers]);

        newPlayers.push({
          id: newId,
          name: `${role} ${team}-${idx + 1}`,
          role,
          team,
          x: autoPos.x,
          z: autoPos.z,
          facing: autoPos.facing,
          y: 0
        });
      });
    });

    setPlayers((prev) => [...prev, ...newPlayers]);
  };

  const removePlayer = (id: string) => {
    if (!isAdmin) return;
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setSelectedId(null);
  };

  if (!isAdmin) return null;

  return (
    <div className="w-[420px] bg-gradient-to-br from-gray-900/98 via-purple-900/95 to-blue-900/95 
                    backdrop-blur-2xl border-l-2 border-white/30 h-screen overflow-y-auto shadow-2xl
                    modern-scrollbar relative">

      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 animate-gradient-shift"></div>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      <div className="relative p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-blue-600 to-cyan-500 rounded-3xl 
                          flex items-center justify-center mx-auto mb-6 shadow-2xl transform hover:scale-110
                          hover:rotate-12 transition-all duration-500 border-2 border-white/20 animate-pulse">
            <span className="text-3xl">⚽</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Kadro Yönetimi
          </h2>
          <div className="h-1 w-24 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-full mx-auto"></div>
        </div>

        {/* Hızlı Aksiyonlar - İkonlu Toolbar (sticky) */}
        <div className="sticky top-0 z-20 -mt-2">
          <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-xl flex flex-wrap gap-2">
            <ModernButton onClick={() => addPlayer(1)} size="sm" variant="glass" className="px-3">
              <span className="flex items-center gap-1"><i className="fas fa-users"></i> <span>Takım 1</span></span>
            </ModernButton>
            <ModernButton onClick={() => addPlayer(2)} size="sm" variant="glass" className="px-3">
              <span className="flex items-center gap-1"><i className="fas fa-users"></i> <span>Takım 2</span></span>
            </ModernButton>
            <ModernButton onClick={addTeam7} size="sm" variant="glass" className="px-3">
              <span className="flex items-center gap-1"><i className="fas fa-list"></i> <span>7v7</span></span>
            </ModernButton>
            <div className="mx-2 w-px h-6 bg-white/20 rounded" />
            <ModernButton onClick={resetCamera} size="sm" variant="glass" className="px-3">
              <span className="flex items-center gap-1"><i className="fas fa-redo-alt"></i> <span>Reset</span></span>
            </ModernButton>
            <ModernButton onClick={topView} size="sm" variant="glass" className="px-3">
              <span className="flex items-center gap-1"><i className="fas fa-video"></i> <span>Üst</span></span>
            </ModernButton>
            <ModernButton onClick={sideView} size="sm" variant="glass" className="px-3">
              <span className="flex items-center gap-1"><i className="fas fa-video"></i> <span>Yan</span></span>
            </ModernButton>
          </div>
        </div>

        {/* Oyuncu Ekleme Butonları - 3D Modern */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ModernButton
              onClick={() => addPlayer(1)}
              variant="primary"
              className="text-sm transform hover:scale-110 hover:-translate-y-1 hover:rotate-2
                        shadow-2xl border-2 border-blue-300/30 backdrop-blur-lg
                        bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600"
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-lg">🔵</span>
                <span className="font-bold">Takım 1</span>
              </div>
            </ModernButton>

            <ModernButton
              onClick={() => addPlayer(2)}
              variant="danger"
              className="text-sm transform hover:scale-110 hover:-translate-y-1 hover:-rotate-2
                        shadow-2xl border-2 border-red-300/30 backdrop-blur-lg
                        bg-gradient-to-br from-red-500 via-red-600 to-pink-600"
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-lg">🔴</span>
                <span className="font-bold">Takım 2</span>
              </div>
            </ModernButton>
          </div>

          <ModernButton
            onClick={addTeam7}
            variant="success"
            className="w-full transform hover:scale-105 hover:-translate-y-2
                      shadow-2xl border-2 border-green-300/30 backdrop-blur-lg
                      bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600"
          >
            <div className="flex items-center justify-center space-x-3">
              <span className="text-xl">⚽</span>
              <span className="font-bold text-lg">7v7 Takım Kuruluşu</span>
            </div>
          </ModernButton>
        </div>

        {/* Kamera Kontrolleri - Modern 3D Card */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl p-6 
                       border-2 border-white/20 shadow-2xl transform hover:scale-[1.02] transition-all duration-500">
          <h3 className="text-white font-bold mb-6 flex items-center gap-3 text-xl section-title">
            <i className="fas fa-video"></i>
            Kamera Kontrolleri
          </h3>

          <ModernToggle
            checked={orbitEnabled}
            onChange={setOrbitEnabled}
            label="Kamera Hareketi"
          />

          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <ModernButton
                onClick={resetCamera}
                size="sm"
                variant="glass"
                className="transform hover:scale-110 hover:-translate-y-1 shadow-xl"
              >
                🎯 Reset
              </ModernButton>
              <ModernButton
                onClick={topView}
                size="sm"
                variant="glass"
                className="transform hover:scale-110 hover:-translate-y-1 shadow-xl"
              >
                ⬆️ Üst
              </ModernButton>
              <ModernButton
                onClick={sideView}
                size="sm"
                variant="glass"
                className="transform hover:scale-110 hover:-translate-y-1 shadow-xl"
              >
                ➡️ Yan
              </ModernButton>
            </div>

            {/* Kamera Pozisyon Kontrolleri */}
            <div className="grid grid-cols-3 gap-3">
              {['x', 'y', 'z'].map((axis) => (
                <div key={axis} className="text-center">
                  <Label className="text-xs uppercase font-bold text-white/90">{axis}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={parseFloat(cameraInfo.position?.[axis] || '0')}
                    onChange={(e) => setCameraPosition(axis, parseFloat(e.target.value))}
                    className="text-xs h-10 text-center font-mono bg-white/15 border-2 border-white/30 modern-input"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Görsel Ayarlar - Modern 3D Card */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl p-6 
                       border-2 border-white/20 shadow-2xl space-y-6 transform hover:scale-[1.02] transition-all duration-500">
          <h3 className="text-white font-bold flex items-center gap-3 text-xl section-title">
            <i className="fas fa-palette"></i>
            Görsel Ayarlar
          </h3>

          <ModernSlider
            value={labelStyle.size}
            onChange={(value) => setLabelStyle({ ...labelStyle, size: value })}
            min={0.4}
            max={1.4}
            step={0.1}
            label="🔤 Yazı Boyutu"
          />

          <ModernSlider
            value={labelStyle.nameIconDistance}
            onChange={(value) => setLabelStyle({ ...labelStyle, nameIconDistance: value })}
            min={0}
            max={2}
            step={0.1}
            label="📏 İsim-İkon Mesafesi"
          />

          <ModernSlider
            value={Math.max(0.5, labelStyle.globalY)}
            onChange={(value) => setLabelStyle({ ...labelStyle, globalY: Math.max(0.5, value) })}
            min={0.5}
            max={5}
            step={0.1}
            label="📐 Oyuncu Yüksekliği"
            unit=" m"
          />

          {/* Renk Seçiciler - Modern 3D */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <span className="text-2xl">🔵</span>
                Takım 1 Rengi
              </Label>
              <div className="relative group">
                <input
                  type="color"
                  value={labelStyle.colorTeam1}
                  onChange={(e) => setLabelStyle({ ...labelStyle, colorTeam1: e.target.value })}
                  className="w-full h-14 rounded-2xl border-[3px] border-white/30 bg-transparent cursor-pointer
                           transform hover:scale-110 transition-all duration-300 shadow-xl"
                />
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 to-purple-500/30 
                               rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <span className="text-2xl">🔴</span>
                Takım 2 Rengi
              </Label>
              <div className="relative group">
                <input
                  type="color"
                  value={labelStyle.colorTeam2}
                  onChange={(e) => setLabelStyle({ ...labelStyle, colorTeam2: e.target.value })}
                  className="w-full h-14 rounded-2xl border-[3px] border-white/30 bg-transparent cursor-pointer
                           transform hover:scale-110 transition-all duration-300 shadow-xl"
                />
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500/30 to-pink-500/30 
                               rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
              </div>
            </div>
          </div>
        </div>

        {/* Oyuncular - Modern 3D Cards */}
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-white font-bold flex items-center justify-center gap-3 text-xl">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                👥
              </div>
              Oyuncular ({players.length})
            </h3>
          </div>

          <div className="space-y-6">
            {/* Takım 1 - Modern 3D Header */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-500/30 to-cyan-500/30 backdrop-blur-2xl 
                             rounded-2xl p-4 border-2 border-blue-400/40 shadow-2xl transform hover:scale-[1.02] 
                             transition-all duration-500">
                <h4 className="text-blue-200 font-bold text-center text-lg flex items-center justify-center gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">🔵</span>
                  </div>
                  Takım 1 ({players.filter(p => p.team === 1).length} oyuncu)
                </h4>
              </div>

              <div className="space-y-3">
                {players.filter(p => p.team === 1).map((p) => (
                  <ModernPlayerCard
                    key={p.id}
                    player={p}
                    onUpdate={(field, value) => updatePlayer(p.id, field, value)}
                    onRemove={() => removePlayer(p.id)}
                    isSelected={selectedId === p.id}
                    onSelect={() => setSelectedId(p.id)}
                  />
                ))}
              </div>
            </div>

            {/* Takım 2 - Modern 3D Header */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-red-500/30 to-pink-500/30 backdrop-blur-2xl 
                             rounded-2xl p-4 border-2 border-red-400/40 shadow-2xl transform hover:scale-[1.02] 
                             transition-all duration-500">
                <h4 className="text-red-200 font-bold text-center text-lg flex items-center justify-center gap-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">🔴</span>
                  </div>
                  Takım 2 ({players.filter(p => p.team === 2).length} oyuncu)
                </h4>
              </div>

              <div className="space-y-3">
                {players.filter(p => p.team === 2).map((p) => (
                  <ModernPlayerCard
                    key={p.id}
                    player={p}
                    onUpdate={(field, value) => updatePlayer(p.id, field, value)}
                    onRemove={() => removePlayer(p.id)}
                    isSelected={selectedId === p.id}
                    onSelect={() => setSelectedId(p.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------
// Ana Uygulama
// -----------------------------
export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [orbitEnabled, setOrbitEnabled] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [cameraInfo, setCameraInfo] = useState({
    position: { x: '0.01', y: '23.40', z: '20.34' },
    distance: '31.00',
    angle: '49.0'
  });
  const [manualCameraUpdate, setManualCameraUpdate] = useState<any>(null);
  const [labelStyle, setLabelStyle] = useState<LabelStyle>({
    colorTeam1: "#2563eb",
    colorTeam2: "#ef4444",
    size: 0.7,
    outlineWidth: 0.05,
    outlineColor: "#ffffff",
    globalY: Math.max(0.5, 0.6),
    nameIconDistance: 0.25,
  });

  const handleAdminLogin = (password: string) => {
    if (!ADMIN_PASSWORD) {
      alert("Admin parolası yapılandırılmadı. Lütfen .env dosyasında VITE_ADMIN_PASSWORD tanımlayın.");
      return;
    }
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowLoginModal(false);
    } else {
      alert("Hatalı şifre!");
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setSelectedId(null);
  };

  const setCameraPosition = (axis: string, value: number) => {
    const currentPos = {
      x: parseFloat(cameraInfo.position.x),
      y: parseFloat(cameraInfo.position.y),
      z: parseFloat(cameraInfo.position.z)
    };

    currentPos[axis as keyof typeof currentPos] = value;

    setManualCameraUpdate({
      type: 'position',
      x: currentPos.x,
      y: currentPos.y,
      z: currentPos.z,
      timestamp: Date.now()
    });
  };

  const setCameraDistance = (distance: number) => {
    setManualCameraUpdate({
      type: 'distance',
      distance: distance,
      timestamp: Date.now()
    });
  };

  const setCameraAngle = (angle: number) => {
    setManualCameraUpdate({
      type: 'angle',
      angle: angle,
      timestamp: Date.now()
    });
  };

  const resetCamera = () => {
    setManualCameraUpdate({
      type: 'preset',
      x: 0.01,
      y: 23.4,
      z: 20.34,
      timestamp: Date.now()
    });
  };

  const topView = () => {
    setManualCameraUpdate({
      type: 'preset',
      x: 0,
      y: 40,
      z: 0,
      timestamp: Date.now()
    });
  };

  const sideView = () => {
    setManualCameraUpdate({
      type: 'preset',
      x: 30,
      y: 10,
      z: 0,
      timestamp: Date.now()
    });
  };

  return (
    <div className="w-full h-screen flex bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">

      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 animate-gradient-shift"></div>
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/10 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      {/* Admin Hover Popup kaldırıldı */}

      {/* 3D Sahne */}
      <div className={`flex-1 relative ${isAdmin ? 'mr-[420px]' : ''}`}>
        <SceneWrapper
          players={players}
          setPlayers={setPlayers}
          orbitEnabled={orbitEnabled}
          labelStyle={labelStyle}
          cameraInfo={cameraInfo}
          setCameraInfo={setCameraInfo}
          manualCameraUpdate={manualCameraUpdate}
          isAdmin={isAdmin}
        />
      </div>

      {/* Admin Giriş Butonu */}
      {!isAdmin && (
        <div className="fixed bottom-8 left-8 z-[9998]">
          <ModernButton
            onClick={() => setShowLoginModal(true)}
            variant="glass"
            size="lg"
            className="shadow-2xl border border-white/30"
          >
            <span className="flex items-center gap-2">🔐 Admin Girişi</span>
          </ModernButton>
        </div>
      )}

      {/* Admin Paneli (sağ sabit panel) */}
      {isAdmin && (
        <div id="admin-panel" className="fixed inset-y-0 right-0 w-[420px] z-[10000] pointer-events-auto">
          {/* Admin Durum Çubuğu */}
          <div id="admin-status-bar" className="absolute top-0 left-0 right-0 p-4 z-[10001] pointer-events-auto">
            <AdminStatusBar isAdmin={isAdmin} onLogout={handleAdminLogout} />
          </div>

          {/* Sağ Panel */}
          <div className="pt-20 h-full">
            <ModernSidePanel
              players={players}
              setPlayers={setPlayers}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              orbitEnabled={orbitEnabled}
              setOrbitEnabled={setOrbitEnabled}
              labelStyle={labelStyle}
              setLabelStyle={setLabelStyle}
              cameraInfo={cameraInfo}
              setCameraPosition={setCameraPosition}
              setCameraDistance={setCameraDistance}
              setCameraAngle={setCameraAngle}
              resetCamera={resetCamera}
              topView={topView}
              sideView={sideView}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      )}

      {/* Ultra Modern 3D Admin Giriş Modal */}
      <AdminLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleAdminLogin}
      />

      {/* Custom CSS Animations */}
      <style>{`
        /* Fallback styles in case Tailwind isn't applied */
        #admin-panel {
          background: linear-gradient(135deg, rgba(17,24,39,0.95), rgba(30,58,138,0.92));
          backdrop-filter: blur(12px);
          border-left: 1px solid rgba(255,255,255,0.25);
        }

        #admin-status-bar > div { /* wrap of AdminStatusBar root */
          pointer-events: auto;
        }
        @keyframes gradient-shift {
          0%, 100% { background: linear-gradient(45deg, #1e3a8a, #7c3aed, #ec4899); }
          25% { background: linear-gradient(45deg, #7c3aed, #ec4899, #1e3a8a); }
          50% { background: linear-gradient(45deg, #ec4899, #1e3a8a, #7c3aed); }
          75% { background: linear-gradient(45deg, #1e3a8a, #7c3aed, #ec4899); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(120deg); }
          66% { transform: translateY(-10px) rotate(240deg); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-gradient-shift {
          animation: gradient-shift 8s ease-in-out infinite;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        /* Custom slider styling */
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          transition: all 0.3s ease;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
        }
        
        input[type="range"]::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        
        /* Perspective effects */
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .rotateX-5 {
          transform: rotateX(5deg);
        }
      `}</style>
    </div>
  );
}

useGLTF.preload("/models/halisaha.glb");