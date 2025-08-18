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
// UI Bileşenleri
// -----------------------------
function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <label className={`block text-sm font-bold text-gray-700 ${className}`}>{children}</label>;
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  const { className = "", ...rest } = props;
  return <input {...rest} className={`w-full border-2 rounded-xl px-3 py-2 text-sm shadow-inner bg-white/80 focus:ring-2 focus:ring-blue-400 ${className}`} />;
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { className?: string }) {
  const { className = "", ...rest } = props;
  return <select {...rest} className={`w-full border-2 rounded-xl px-3 py-2 text-sm shadow-inner bg-white/80 focus:ring-2 focus:ring-blue-400 ${className}`} />;
}
function Button3D({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; className?: string }) {
  return <button {...props} className={`px-4 py-2 rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 text-white font-semibold shadow-lg hover:scale-105 active:scale-95 transition ${className}`}>{children}</button>;
}

// -----------------------------
// Sabitler ve Pozisyon Koordinatları
// -----------------------------
const PITCH_WIDTH = 18;
const PITCH_LENGTH = 28;

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
  const positions = POSITION_COORDINATES[team as keyof typeof POSITION_COORDINATES][role as keyof typeof POSITION_COORDINATES[1]];

  if (!positions) {
    // Eğer pozisyon tanımlanmamışsa rastgele yerleştir
    return {
      x: (Math.random() - 0.5) * PITCH_WIDTH,
      z: (Math.random() - 0.5) * PITCH_LENGTH,
      facing: team === 1 ? 0 : Math.PI
    };
  }

  if (Array.isArray(positions)) {
    // Bu pozisyondan kaç oyuncu var
    const sameRoleCount = existingPlayers.filter(p => p.team === team && p.role === role).length;
    const positionIndex = sameRoleCount % positions.length;

    return {
      x: positions[positionIndex].x,
      z: positions[positionIndex].z,
      facing: team === 1 ? 0 : Math.PI
    };
  } else {
    // Tek pozisyon (genellikle kaleci)
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
function PitchGLB(props: JSX.IntrinsicElements["primitive"]) {
  const { scene } = useGLTF("/models/halisaha.glb");

  const [offset] = React.useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    return [[-center.x, -box.min.y, -center.z] as [number, number, number]];
  }, [scene]);

  return (
    <group position={offset} {...props}>
      <primitive object={scene} />
    </group>
  );
}

// -----------------------------
// Oyuncu isimleri ve ikonları - Akıllı görselleştirme
// -----------------------------
function PlayerWithIcon({ p, setDragId, labelStyle }: {
  p: Player;
  setDragId: React.Dispatch<React.SetStateAction<string | null>>;
  labelStyle: LabelStyle;
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
      onPointerDown={(e) => { e.stopPropagation(); setDragId(p.id); }}
    >
      {isTopView ? (
        // Yukarıdan bakış modu
        <group rotation={[-Math.PI / 2, 0, 0]} position={[0, Math.max(0.6, 0.1), 0]}>
          {/* Sahaya paralel isim etiketi - Minimum 0.5 üstünde */}
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

          {/* Yukarıdan bakış için ikon - Minimum 0.5 üstünde */}
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
          {/* Oyuncu İsmi */}
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

          {/* Oyuncu İkonu - İsmin hemen altında ve ortalanmış - Minimum 0.5 yükseklikte */}
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
function SceneContent({ players, setPlayers, orbitEnabled, labelStyle, cameraInfo, setCameraInfo, manualCameraUpdate }: {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  orbitEnabled: boolean;
  labelStyle: LabelStyle;
  cameraInfo: any;
  setCameraInfo: React.Dispatch<React.SetStateAction<any>>;
  manualCameraUpdate: any;
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
    distance *= 0.8; // Daha yakından başla

    // Manuel başlangıç pozisyonu - istenen değerler
    (camera as any).position.set(0.01, 23.4, 20.34);
    (camera as any).lookAt(center);
    (camera as any).lookAt(center);

    if (controlsRef.current) {
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }

    setInitialized(true);
  }, [camera, size, initialized]);

  useEffect(() => {
    const stopDrag = (e: MouseEvent) => {
      if (dragId) {
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
  }, [dragId]);

  const updatePosition = (id: string, x: number, z: number) => {
    setPlayers((prev) => prev.map((pp) => (pp.id === id ? { ...pp, x, z } : pp)));
  };

  const InteractionPlane = () => (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      onPointerMove={(e) => {
        if (!dragId) return;
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
        />
      ))}
      {dragId && <InteractionPlane />}

      <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={50} blur={3} far={10} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={!dragId && orbitEnabled}
        enablePan={true}
        enableRotate={true}
        enableZoom={true}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  );
}

function SceneWrapper({ players, setPlayers, orbitEnabled, labelStyle, cameraInfo, setCameraInfo, manualCameraUpdate }: {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  orbitEnabled: boolean;
  labelStyle: LabelStyle;
  cameraInfo: any;
  setCameraInfo: React.Dispatch<React.SetStateAction<any>>;
  manualCameraUpdate: any;
}) {
  return (
    <Canvas shadows camera={{ position: [0.01, 23.4, 20.34], fov: 55 }}>
      <SceneContent players={players} setPlayers={setPlayers} orbitEnabled={orbitEnabled} labelStyle={labelStyle} cameraInfo={cameraInfo} setCameraInfo={setCameraInfo} manualCameraUpdate={manualCameraUpdate} />
    </Canvas>
  );
}

// -----------------------------
// Inline Düzenlenebilir Oyuncu Kartı
// -----------------------------
function EditablePlayerCard({ player, onUpdate, onRemove, isSelected, onSelect }: {
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

  return (
    <div className={`rounded-xl p-3 border-2 transition-all ${isSelected
      ? `${player.team === 1 ? "bg-blue-50 border-blue-500" : "bg-red-50 border-red-500"}`
      : `${player.team === 1 ? "bg-blue-100 hover:bg-blue-150" : "bg-red-100 hover:bg-red-150"} border-gray-300 hover:border-gray-400`
      }`}>
      <div className="flex items-center gap-2">
        <div className="flex-1 space-y-1">
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
                className="font-bold cursor-pointer hover:bg-white/50 px-2 py-1 rounded flex-1"
                onClick={() => {
                  onSelect();
                  startEdit('name', player.name);
                }}
              >
                {player.name}
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
                <option value="KALECİ">Kaleci</option>
                <option value="DEFANS">Defans</option>
                <option value="ORTA SAHA">Orta Saha</option>
                <option value="FORVET">Forvet</option>
                <option value="KANAT">Kanat</option>
              </Select>
            ) : (
              <div
                className="text-xs text-gray-600 cursor-pointer hover:bg-white/50 px-2 py-1 rounded flex-1"
                onClick={() => {
                  onSelect();
                  startEdit('role', player.role);
                }}
              >
                {player.role}
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
                <option value="1">Takım 1</option>
                <option value="2">Takım 2</option>
              </Select>
            ) : (
              <div
                className="text-xs text-gray-500 cursor-pointer hover:bg-white/50 px-2 py-1 rounded flex-1"
                onClick={() => {
                  onSelect();
                  startEdit('team', player.team.toString());
                }}
              >
                Takım {player.team}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 font-bold text-lg px-2 py-1 hover:bg-red-100 rounded"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// -----------------------------
// Sağ Panel
// -----------------------------
function SidePanel({ players, setPlayers, selectedId, setSelectedId, orbitEnabled, setOrbitEnabled, labelStyle, setLabelStyle, cameraInfo, setCameraPosition, setCameraDistance, setCameraAngle, resetCamera, topView, sideView }: {
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
}) {
  const updatePlayer = (id: string, field: string, value: string) => {
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
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setSelectedId(null);
  };

  return (
    <div className="w-80 bg-gradient-to-b from-gray-100 to-gray-200 backdrop-blur border-l h-screen p-5 overflow-y-auto shadow-2xl">
      <h2 className="text-2xl font-bold mb-4 flex justify-between items-center">Kadro</h2>

      <div className="flex gap-2 mb-4">
        <Button3D onClick={() => addPlayer(1)}>+ Takım 1</Button3D>
        <Button3D onClick={() => addPlayer(2)}>+ Takım 2</Button3D>
      </div>
      <Button3D onClick={addTeam7} className="w-full mb-4">7 - 7 Takım Ekle</Button3D>

      <Button3D onClick={() => setOrbitEnabled(!orbitEnabled)} className="w-full mb-4">
        {orbitEnabled ? "Sabitle" : "Hareketli"}
      </Button3D>

      <div className="mb-4">
        <h3 className="font-bold text-gray-700 mb-2">Oyuncular (Düzenlemek için tıklayın)</h3>
        <div className="grid grid-cols-2 gap-2">
          {/* Sol Kolon - Takım 2 (Kırmızı) */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-red-600 text-center bg-red-100 py-1 rounded">Takım 2</h4>
            {players.filter(p => p.team === 2).map((p) => (
              <EditablePlayerCard
                key={p.id}
                player={p}
                onUpdate={(field, value) => updatePlayer(p.id, field, value)}
                onRemove={() => removePlayer(p.id)}
                isSelected={selectedId === p.id}
                onSelect={() => setSelectedId(p.id)}
              />
            ))}
          </div>

          {/* Sağ Kolon - Takım 1 (Mavi) */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-blue-600 text-center bg-blue-100 py-1 rounded">Takım 1</h4>
            {players.filter(p => p.team === 1).map((p) => (
              <EditablePlayerCard
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

      {/* Kamera Bilgi Paneli */}
      <div className="mb-4 bg-gray-50 rounded-xl p-3 border">
        <h3 className="font-bold text-gray-700 mb-2 text-sm">📹 Kamera Bilgileri</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Mesafe:</span>
            <input
              type="number"
              step="0.1"
              min="1"
              max="100"
              value={cameraInfo.distance}
              onChange={(e) => setCameraDistance(parseFloat(e.target.value))}
              className="font-mono bg-blue-100 px-2 py-1 rounded w-16 text-center"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Açı:</span>
            <input
              type="number"
              step="1"
              min="-90"
              max="90"
              value={parseFloat(cameraInfo.angle)}
              onChange={(e) => setCameraAngle(parseFloat(e.target.value))}
              className="font-mono bg-green-100 px-2 py-1 rounded w-16 text-center"
            />
          </div>
          <div className="grid grid-cols-3 gap-1 mt-2">
            <div className="text-center">
              <div className="text-gray-500">X</div>
              <input
                type="number"
                step="0.1"
                value={parseFloat(cameraInfo.position?.x || '0')}
                onChange={(e) => setCameraPosition('x', parseFloat(e.target.value))}
                className="font-mono text-xs bg-red-100 px-1 py-1 rounded w-full text-center"
              />
            </div>
            <div className="text-center">
              <div className="text-gray-500">Y</div>
              <input
                type="number"
                step="0.1"
                value={parseFloat(cameraInfo.position?.y || '0')}
                onChange={(e) => setCameraPosition('y', parseFloat(e.target.value))}
                className="font-mono text-xs bg-green-100 px-1 py-1 rounded w-full text-center"
              />
            </div>
            <div className="text-center">
              <div className="text-gray-500">Z</div>
              <input
                type="number"
                step="0.1"
                value={parseFloat(cameraInfo.position?.z || '0')}
                onChange={(e) => setCameraPosition('z', parseFloat(e.target.value))}
                className="font-mono text-xs bg-blue-100 px-1 py-1 rounded w-full text-center"
              />
            </div>
          </div>
          <div className="flex gap-1 mt-2">
            <Button3D onClick={resetCamera} className="text-xs px-2 py-1 flex-1">Sıfırla</Button3D>
            <Button3D onClick={topView} className="text-xs px-2 py-1 flex-1">Üstten</Button3D>
            <Button3D onClick={sideView} className="text-xs px-2 py-1 flex-1">Yandan</Button3D>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Yazı Boyutu</Label>
          <input
            type="range"
            min={0.4}
            max={1.4}
            step={0.1}
            value={labelStyle.size}
            onChange={(e) => setLabelStyle({ ...labelStyle, size: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>Küçük (0.4)</span>
            <span className="font-semibold">
              Yazı: {labelStyle.size.toFixed(1)} | İkon: {(labelStyle.size * 0.8).toFixed(1)}
            </span>
            <span>Büyük (1.4)</span>
          </div>
        </div>

        <div>
          <Label>İsim-İkon Mesafesi</Label>
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={labelStyle.nameIconDistance}
            onChange={(e) => setLabelStyle({ ...labelStyle, nameIconDistance: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>Yakın (0)</span>
            <span className="font-semibold">{labelStyle.nameIconDistance.toFixed(1)}</span>
            <span>Uzak (2)</span>
          </div>
        </div>

        <div>
          <Label>Takım 1 Renk</Label>
          <Input type="color" value={labelStyle.colorTeam1} onChange={(e) => setLabelStyle({ ...labelStyle, colorTeam1: e.target.value })} />
        </div>
        <div>
          <Label>Takım 2 Renk</Label>
          <Input type="color" value={labelStyle.colorTeam2} onChange={(e) => setLabelStyle({ ...labelStyle, colorTeam2: e.target.value })} />
        </div>
        <div>
          <Label>Tüm Oyuncular Yükseklik (Y)</Label>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.1}
            value={Math.max(0.5, labelStyle.globalY)}
            onChange={(e) => setLabelStyle({ ...labelStyle, globalY: Math.max(0.5, parseFloat(e.target.value)) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>Minimum (0.5)</span>
            <span className="font-semibold bg-blue-100 px-2 py-1 rounded">{Math.max(0.5, labelStyle.globalY).toFixed(1)} <span className="text-green-600">(Sabit min: 0.5)</span></span>
            <span>Yüksek (5)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------
// Uygulama
// -----------------------------
export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [orbitEnabled, setOrbitEnabled] = useState<boolean>(true);
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
    globalY: Math.max(0.5, 0.6), // Minimum 0.5 yükseklik
    nameIconDistance: 0.25,
  });

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
    <div className="w-full h-screen flex bg-gray-200">
      <div className="flex-1">
        <SceneWrapper
          players={players}
          setPlayers={setPlayers}
          orbitEnabled={orbitEnabled}
          labelStyle={labelStyle}
          cameraInfo={cameraInfo}
          setCameraInfo={setCameraInfo}
          manualCameraUpdate={manualCameraUpdate}
        />
      </div>
      <SidePanel
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
      />
    </div>
  );
}

useGLTF.preload("/models/halisaha.glb");