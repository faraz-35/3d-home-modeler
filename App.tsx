import React, { useMemo, useRef } from 'react';
import { Canvas, type ThreeElements, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Box, Plane, Select } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from './hooks/useStore';
import { SceneObject, ObjectType, Floor, AppState } from './types';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: ThreeElements['group'];
      meshStandardMaterial: ThreeElements['meshStandardMaterial'];
      ambientLight: ThreeElements['ambientLight'];
      directionalLight: ThreeElements['directionalLight'];
    }
  }
}

// --- HELPER & ICON COMPONENTS ---

interface IconButtonProps {
  onClick: (e: React.MouseEvent) => void;
  label: string;
  children: React.ReactNode;
  isActive?: boolean;
  isDisabled?: boolean;
}

const IconButton: React.FC<IconButtonProps> = ({ onClick, label, children, isActive = false, isDisabled = false }) => (
  <button
    onClick={onClick}
    title={label}
    disabled={isDisabled}
    className={`flex flex-col items-center justify-center space-y-1.5 p-2 rounded-lg transition-all duration-200 
    ${ isActive 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'bg-gray-700 text-gray-300'
    } 
    ${ isDisabled 
        ? 'opacity-50 cursor-not-allowed' 
        : 'transform hover:scale-105 ' + (isActive ? '' : 'hover:bg-gray-600')
    }`}
  >
    {children}
    <span className="text-xs font-medium tracking-wide">{label}</span>
  </button>
);

const WallIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v16h16V4H4zm4 4v8m4-8v8m4-8v8" /></svg>;
const DoorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-2m-4 13v- физи-2m0 0V8m0 5a2 2 0 100-4 2 2 0 000 4z" /></svg>;
const WindowIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16M6 4v16m12-16v16" /></svg>;
const AddFloorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const TableIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.5 4L18 8M6 12v4m12-4v4M3 16h18" /></svg>;
const ChairIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21v-4m0 0V5h10v12m-10 0h10M5 21h14M7 5h10M9 13h6" /></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>;
const LoadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const BedIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 9.5V6a2 2 0 00-2-2H6a2 2 0 00-2 2v3.5m16 0a2.5 2.5 0 01-2.5 2.5H6.5A2.5 2.5 0 014 9.5m16 0H4m16 0L20 18H4l-2.05-8.5" /></svg>;
const SofaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 17V8a2 2 0 012-2h12a2 2 0 012 2v9m-16 0h16m-16 0v2a2 2 0 002 2h12a2 2 0 002-2v-2M6 12h12" /></svg>;
const ShelfIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v18M19 3v18M5 8h14M5 16h14" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const UndoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 15l-3-3m0 0l3-3m-3 3h8a5 5 0 000-10H9" /></svg>;
const RedoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 15l3-3m0 0l-3-3m3 3H8a5 5 0 000 10h3" /></svg>;


// --- 3D OBJECT COMPONENTS ---

const SceneBackground: React.FC = () => {
    const { scene } = useThree();
    const sceneBackgroundColor = useStore((state) => state.sceneBackgroundColor);
    React.useEffect(() => { scene.background = new THREE.Color(sceneBackgroundColor); }, [scene, sceneBackgroundColor]);
    return null;
};

interface ObjectProps { object: SceneObject; }

const Wall: React.FC<ObjectProps> = ({ object }) => {
  const { setSelectedObjectId } = useStore();
  return (
    <Box args={object.size} position={object.position} rotation={object.rotation} userData={{id: object.id}} onClick={(e) => { e.stopPropagation(); setSelectedObjectId(object.id); }}>
      <meshStandardMaterial color={object.color} />
    </Box>
  );
};

const Door: React.FC<ObjectProps> = ({ object }) => {
  const { setSelectedObjectId } = useStore();
  return (
    <Box args={object.size} position={object.position} rotation={object.rotation} userData={{id: object.id}} onClick={(e) => { e.stopPropagation(); setSelectedObjectId(object.id); }}>
      <meshStandardMaterial color={object.color} roughness={0.2} metalness={0.1} />
    </Box>
  );
};

const Window: React.FC<ObjectProps> = ({ object }) => {
    const { setSelectedObjectId } = useStore();
    return (
        <Box args={object.size} position={object.position} rotation={object.rotation} userData={{id: object.id}} onClick={(e) => { e.stopPropagation(); setSelectedObjectId(object.id); }}>
            <meshStandardMaterial color={object.color} transparent opacity={0.5} />
        </Box>
    );
};

const Table: React.FC<ObjectProps> = ({ object }) => {
    const { setSelectedObjectId } = useStore();
    const { size, color, position, rotation } = object;
    const [width, height, depth] = size;
    const legThickness = Math.min(width, depth) * 0.08;
    const tabletopThickness = 0.05;
    const legHeight = height - tabletopThickness;

    return (
        <group position={position} rotation={rotation} userData={{id: object.id}} onClick={(e) => { e.stopPropagation(); setSelectedObjectId(object.id); }}>
            {/* Tabletop */}
            <Box args={[width, tabletopThickness, depth]} position={[0, height / 2 - tabletopThickness / 2, 0]}>
                <meshStandardMaterial color={color} />
            </Box>
            {/* Legs */}
            <Box args={[legThickness, legHeight, legThickness]} position={[-width / 2 + legThickness, -tabletopThickness/2, -depth / 2 + legThickness]}>
                <meshStandardMaterial color={color} />
            </Box>
            <Box args={[legThickness, legHeight, legThickness]} position={[width / 2 - legThickness, -tabletopThickness/2, -depth / 2 + legThickness]}>
                <meshStandardMaterial color={color} />
            </Box>
            <Box args={[legThickness, legHeight, legThickness]} position={[-width / 2 + legThickness, -tabletopThickness/2, depth / 2 - legThickness]}>
                <meshStandardMaterial color={color} />
            </Box>
            <Box args={[legThickness, legHeight, legThickness]} position={[width / 2 - legThickness, -tabletopThickness/2, depth / 2 - legThickness]}>
                <meshStandardMaterial color={color} />
            </Box>
        </group>
    );
};

const Chair: React.FC<ObjectProps> = ({ object }) => {
    const { setSelectedObjectId } = useStore();
    const { size, color, position, rotation } = object;
    const [width, height, depth] = size;
    const seatHeight = height * 0.45;
    const legThickness = 0.05;
    const seatThickness = 0.05;
    const backHeight = height - seatHeight;

    return (
        <group position={position} rotation={rotation} userData={{id: object.id}} onClick={(e) => { e.stopPropagation(); setSelectedObjectId(object.id); }}>
            {/* Seat */}
            <Box args={[width, seatThickness, depth]} position={[0, seatHeight/2 - height/2 + seatThickness, 0]}>
                 <meshStandardMaterial color={color} />
            </Box>
             {/* Back */}
            <Box args={[width, backHeight, legThickness]} position={[0, seatHeight / 2 - height / 2 + backHeight/2 + seatThickness*2, -depth/2 + legThickness/2]}>
                 <meshStandardMaterial color={color} />
            </Box>
            {/* Legs */}
            <Box args={[legThickness, seatHeight, legThickness]} position={[-width/2+legThickness/2, -height/2 + seatHeight/2, -depth/2+legThickness/2]}>
                 <meshStandardMaterial color={color} />
            </Box>
            <Box args={[legThickness, seatHeight, legThickness]} position={[width/2-legThickness/2, -height/2 + seatHeight/2, -depth/2+legThickness/2]}>
                 <meshStandardMaterial color={color} />
            </Box>
            <Box args={[legThickness, seatHeight, legThickness]} position={[-width/2+legThickness/2, -height/2 + seatHeight/2, depth/2-legThickness/2]}>
                 <meshStandardMaterial color={color} />
            </Box>
            <Box args={[legThickness, seatHeight, legThickness]} position={[width/2-legThickness/2, -height/2 + seatHeight/2, depth/2-legThickness/2]}>
                 <meshStandardMaterial color={color} />
            </Box>
        </group>
    );
};

const Bed: React.FC<ObjectProps> = ({ object }) => {
    const { setSelectedObjectId } = useStore();
    const { size, color, position, rotation } = object;
    const [width, height, depth] = size;
    const mattressHeight = height * 0.5;
    const headboardHeight = height * 0.8;
    const headboardThickness = 0.1;

    return (
        <group position={position} rotation={rotation} userData={{id: object.id}} onClick={(e) => { e.stopPropagation(); setSelectedObjectId(object.id); }}>
            {/* Mattress */}
            <Box args={[width, mattressHeight, depth]} position={[0, mattressHeight/2 - height/2, 0]}>
                <meshStandardMaterial color={color} />
            </Box>
            {/* Headboard */}
            <Box args={[width, headboardHeight, headboardThickness]} position={[0, headboardHeight/2 - height/2, -depth/2 - headboardThickness/2]}>
                 <meshStandardMaterial color={color} />
            </Box>
        </group>
    );
};

const Sofa: React.FC<ObjectProps> = ({ object }) => {
    const { setSelectedObjectId } = useStore();
    const { size, color, position, rotation } = object;
    const [width, height, depth] = size;
    const seatHeight = height * 0.5;
    const armrestHeight = height * 0.7;
    const backHeight = height;
    const thickness = 0.15;

    return (
        <group position={position} rotation={rotation} userData={{id: object.id}} onClick={(e) => { e.stopPropagation(); setSelectedObjectId(object.id); }}>
            {/* Base/Seat */}
            <Box args={[width, seatHeight, depth]} position={[0, seatHeight/2 - height/2, 0]}>
                <meshStandardMaterial color={color} />
            </Box>
            {/* Back */}
            <Box args={[width, backHeight, thickness]} position={[0, backHeight/2 - height/2, -depth/2 + thickness/2]}>
                <meshStandardMaterial color={color} />
            </Box>
            {/* Armrests */}
            <Box args={[thickness, armrestHeight, depth]} position={[-width/2 + thickness/2, armrestHeight/2 - height/2, 0]}>
                <meshStandardMaterial color={color} />
            </Box>
            <Box args={[thickness, armrestHeight, depth]} position={[width/2 - thickness/2, armrestHeight/2 - height/2, 0]}>
                <meshStandardMaterial color={color} />
            </Box>
        </group>
    );
};

const Shelf: React.FC<ObjectProps> = ({ object }) => {
    const { setSelectedObjectId } = useStore();
    const { size, color, position, rotation } = object;
    const [width, height, depth] = size;
    const numShelves = 5;
    const shelfThickness = 0.04;
    const supportThickness = 0.04;

    return (
        <group position={position} rotation={rotation} userData={{id: object.id}} onClick={(e) => { e.stopPropagation(); setSelectedObjectId(object.id); }}>
            {/* Supports */}
            <Box args={[supportThickness, height, depth]} position={[-width/2 + supportThickness/2, 0, 0]}>
                <meshStandardMaterial color={color} />
            </Box>
            <Box args={[supportThickness, height, depth]} position={[width/2 - supportThickness/2, 0, 0]}>
                <meshStandardMaterial color={color} />
            </Box>
            {/* Shelves */}
            {Array.from({ length: numShelves }).map((_, i) => (
                <Box key={i} args={[width - supportThickness*2, shelfThickness, depth]} position={[0, -height/2 + (i * height/(numShelves-1)) - shelfThickness/2, 0]}>
                    <meshStandardMaterial color={color} />
                </Box>
            ))}
        </group>
    );
};

interface FloorPlaneProps { floorData: Floor; }

const FloorPlane: React.FC<FloorPlaneProps> = ({ floorData }) => {
    const { setSelectedObjectId } = useStore();
    return (
        <Plane args={[35, 70]} rotation={[-Math.PI / 2, 0, 0]} position={[0, floorData.y - 0.05, 0]} userData={{id: floorData.id}} onClick={(e) => { e.stopPropagation(); setSelectedObjectId(floorData.id); }}>
            <meshStandardMaterial color={floorData.color} />
        </Plane>
    );
};

// --- UI COMPONENTS ---

const PropertyInput: React.FC<{ label: string; value: number; onChange: (val: number) => void; step?: number; }> = ({ label, value, onChange, step = 0.1 }) => (
    <div className="flex items-center justify-between text-sm">
        <label className="text-gray-400 w-24 truncate" title={label}>{label}</label>
        <input type="number" value={Number.isInteger(value) ? value : value.toFixed(2)} step={step} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="w-36 bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
    </div>
);

const ColorInput: React.FC<{ label: string; value: string; onChange: (val: string) => void; }> = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between text-sm">
        <label className="text-gray-400 w-24">{label}</label>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-36 h-9 bg-gray-700 border border-gray-600 rounded-md p-1 cursor-pointer" />
    </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="px-4 py-5 border-b border-gray-700">
        <h2 className="text-xs font-bold uppercase text-gray-500 mb-4 tracking-widest">{title}</h2>
        {children}
    </div>
);


const PropertiesPanelContent: React.FC = () => {
  const { selectedObjectId, objects, floors, updateObject, deleteObject, updateFloor } = useStore();
  const selectedObject = useMemo(() => objects.find(o => o.id === selectedObjectId), [objects, selectedObjectId]);
  const selectedFloor = useMemo(() => floors.find(f => f.id === selectedObjectId), [floors, selectedObjectId]);

  if (!selectedObjectId) {
    return <div className="p-6 text-gray-500 text-center text-sm">Select an object to see its properties.</div>;
  }
  
  if (selectedFloor) {
    return (
        <div className="space-y-4 p-4">
            <h3 className="text-lg font-bold text-white border-b border-gray-700 pb-3 mb-4">Floor Properties</h3>
            <PropertyInput label="Height (Y)" value={selectedFloor.y} onChange={(val) => updateFloor(selectedFloor.id, { y: val })}/>
            <ColorInput label="Color" value={selectedFloor.color} onChange={(val) => updateFloor(selectedFloor.id, { color: val })}/>
        </div>
    );
  }

  if (selectedObject) {
    const handleRotationChange = (axis: 'x' | 'y' | 'z', value: number) => {
        if (!selectedObject) return;
        const newRotation = [...selectedObject.rotation] as [number, number, number];
        const radValue = THREE.MathUtils.degToRad(value);
        if (axis === 'x') newRotation[0] = radValue;
        if (axis === 'y') newRotation[1] = radValue;
        if (axis === 'z') newRotation[2] = radValue;
        updateObject(selectedObject.id, { rotation: newRotation });
    };

    const handleDelete = () => {
        if(window.confirm('Are you sure you want to delete this object?')) {
            deleteObject(selectedObject.id);
        }
    };

    return (
      <div className="space-y-3 p-4">
        <h3 className="text-lg font-bold text-white border-b border-gray-700 pb-3 mb-4 capitalize">{selectedObject.type.toLowerCase()} Properties</h3>
        <div className="space-y-3"><h4 className="text-md font-semibold text-gray-300 pt-2">Position</h4>
            <PropertyInput label="X" value={selectedObject.position[0]} onChange={(val) => updateObject(selectedObject.id, { position: [val, selectedObject.position[1], selectedObject.position[2]] })} />
            <PropertyInput label="Y" value={selectedObject.position[1]} onChange={(val) => updateObject(selectedObject.id, { position: [selectedObject.position[0], val, selectedObject.position[2]] })} />
            <PropertyInput label="Z" value={selectedObject.position[2]} onChange={(val) => updateObject(selectedObject.id, { position: [selectedObject.position[0], selectedObject.position[1], val] })} />
        </div>
        <div className="space-y-3 pt-3 border-t border-gray-800 mt-4"><h4 className="text-md font-semibold text-gray-300">Rotation (Deg)</h4>
            <PropertyInput label="X" value={THREE.MathUtils.radToDeg(selectedObject.rotation[0])} onChange={(val) => handleRotationChange('x', val)} step={1} />
            <PropertyInput label="Y" value={THREE.MathUtils.radToDeg(selectedObject.rotation[1])} onChange={(val) => handleRotationChange('y', val)} step={1} />
            <PropertyInput label="Z" value={THREE.MathUtils.radToDeg(selectedObject.rotation[2])} onChange={(val) => handleRotationChange('z', val)} step={1} />
        </div>
        <div className="space-y-3 pt-3 border-t border-gray-800 mt-4"><h4 className="text-md font-semibold text-gray-300">Dimensions</h4>
            <PropertyInput label="Width" value={selectedObject.size[0]} onChange={(val) => updateObject(selectedObject.id, { size: [val, selectedObject.size[1], selectedObject.size[2]] })} />
            <PropertyInput label="Height" value={selectedObject.size[1]} onChange={(val) => updateObject(selectedObject.id, { size: [selectedObject.size[0], val, selectedObject.size[2]] })} />
            <PropertyInput label="Depth" value={selectedObject.size[2]} onChange={(val) => updateObject(selectedObject.id, { size: [selectedObject.size[0], selectedObject.size[1], val] })} />
        </div>
        <div className="space-y-3 pt-3 border-t border-gray-800 mt-4"><h4 className="text-md font-semibold text-gray-300">Appearance</h4>
            <ColorInput label="Color" value={selectedObject.color} onChange={(val) => updateObject(selectedObject.id, { color: val })}/>
        </div>
        <div className="pt-4 mt-4 border-t border-gray-700">
            <button 
                onClick={handleDelete}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
                Delete Object
            </button>
        </div>
      </div>
    );
  }
  return null;
};

const PropertiesPanel: React.FC = () => (
    <div className="w-80 h-full bg-gray-900 text-white shadow-lg flex flex-col border-l border-gray-700">
        <div className="p-4 border-b border-gray-700 h-20 flex items-center"><h1 className="text-xl font-bold tracking-wider">Properties</h1></div>
        <div className="flex-grow overflow-y-auto"><PropertiesPanelContent /></div>
    </div>
);


const ItemsPanel: React.FC<{ onFileLoad: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ onFileLoad }) => {
    const { 
        addObject, addFloor, deleteFloor, floors, currentFloorIndex, setCurrentFloorIndex, 
        objects, selectedObjectId, setSelectedObjectId, sceneBackgroundColor, setSceneBackgroundColor,
        undo, redo, past, future
    } = useStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentFloorObjects = objects.filter(obj => obj.floorIndex === currentFloorIndex);
    const currentFloor = floors[currentFloorIndex];
    
    const handleSave = () => {
        const state = useStore.getState();
        const { loadState, past, future, ...savableState } = state; // Exclude non-serializable parts
        const dataStr = JSON.stringify(savableState, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'project.homemodeler';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleLoadClick = () => {
        fileInputRef.current?.click();
    };

    const handleDeleteFloor = () => {
        if (window.confirm('Are you sure you want to delete this floor and all its objects?')) {
            deleteFloor(currentFloorIndex);
        }
    };
    
    return (
        <div className="w-80 h-full bg-gray-900 text-white shadow-lg flex flex-col">
            <input type="file" ref={fileInputRef} onChange={onFileLoad} accept=".homemodeler" style={{ display: 'none' }} />
            <div className="p-4 border-b border-gray-700 h-20 flex items-center"><h1 className="text-xl font-bold tracking-wider">3D Home Modeler</h1></div>

            <div className="flex-grow overflow-y-auto">
                <Section title="File">
                    <div className="grid grid-cols-2 gap-4">
                        <IconButton onClick={handleSave} label="Save"><SaveIcon /></IconButton>
                        <IconButton onClick={handleLoadClick} label="Load"><LoadIcon /></IconButton>
                    </div>
                </Section>
                
                <Section title="Edit">
                    <div className="grid grid-cols-2 gap-4">
                        <IconButton onClick={undo} label="Undo" isDisabled={past.length === 0}><UndoIcon /></IconButton>
                        <IconButton onClick={redo} label="Redo" isDisabled={future.length === 0}><RedoIcon /></IconButton>
                    </div>
                </Section>

                <Section title="Architecture">
                    <div className="grid grid-cols-3 gap-4">
                        <IconButton onClick={() => addObject(ObjectType.Wall)} label="Wall"><WallIcon /></IconButton>
                        <IconButton onClick={() => addObject(ObjectType.Door)} label="Door"><DoorIcon /></IconButton>
                        <IconButton onClick={() => addObject(ObjectType.Window)} label="Window"><WindowIcon /></IconButton>
                    </div>
                </Section>

                <Section title="Furniture">
                    <div className="grid grid-cols-3 gap-4">
                        <IconButton onClick={() => addObject(ObjectType.Table)} label="Table"><TableIcon /></IconButton>
                        <IconButton onClick={() => addObject(ObjectType.Chair)} label="Chair"><ChairIcon /></IconButton>
                        <IconButton onClick={() => addObject(ObjectType.Sofa)} label="Sofa"><SofaIcon /></IconButton>
                        <IconButton onClick={() => addObject(ObjectType.Bed)} label="Bed"><BedIcon /></IconButton>
                        <IconButton onClick={() => addObject(ObjectType.Shelf)} label="Shelf"><ShelfIcon /></IconButton>
                    </div>
                </Section>

                <Section title="Floors">
                     <div className="flex gap-3 items-center">
                        <select value={currentFloorIndex} onChange={(e) => setCurrentFloorIndex(parseInt(e.target.value))} className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                          {floors.map((_, index) => ( <option key={index} value={index}>Floor {index + 1}</option>))}
                        </select>
                        <IconButton onClick={addFloor} label="Add"><AddFloorIcon /></IconButton>
                        <IconButton onClick={handleDeleteFloor} label="Delete" isDisabled={floors.length <= 1}><DeleteIcon /></IconButton>
                     </div>
                </Section>

                <Section title="Settings">
                    <ColorInput label="Background" value={sceneBackgroundColor} onChange={setSceneBackgroundColor}/>
                </Section>
                
                <div className="px-4 py-5 space-y-2">
                    <h2 className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-widest">Scene Items</h2>
                    {currentFloor ? (
                        <>
                            <div onClick={() => setSelectedObjectId(currentFloor.id)} className={`p-2.5 rounded-md cursor-pointer transition-colors text-sm ${selectedObjectId === currentFloor.id ? 'bg-blue-600 font-semibold' : 'hover:bg-gray-800'}`}>
                                Floor {currentFloorIndex + 1}
                            </div>
                            <div className="pl-4 pt-1 space-y-1 border-l-2 border-gray-700 ml-2">
                                {currentFloorObjects.length > 0 ? currentFloorObjects.map(obj => (
                                    <div key={obj.id} onClick={(e) => { e.stopPropagation(); setSelectedObjectId(obj.id); }} className={`p-2.5 text-sm rounded-md cursor-pointer transition-colors capitalize ${selectedObjectId === obj.id ? 'bg-blue-600 font-semibold' : 'hover:bg-gray-800'}`}>
                                        {obj.type.toLowerCase()}
                                    </div>
                                )) : <div className="text-xs text-gray-500 italic p-2.5">No objects on this floor.</div>}
                            </div>
                        </>
                    ) : <div className="text-xs text-gray-500 italic p-2.5">Add a floor to begin.</div>}
                </div>
            </div>
        </div>
    );
};

// --- MAIN SCENE & APP ---

const SceneContent: React.FC = () => {
    const { objects, floors, selectedObjectId, setSelectedObjectId, currentFloorIndex } = useStore();
    const visibleObjects = objects.filter(obj => obj.floorIndex === currentFloorIndex);
    const currentFloorY = floors[currentFloorIndex]?.y ?? 0;

    return (
        <>
            <SceneBackground />
            <ambientLight intensity={0.8} />
            <directionalLight position={[20, 30, 15]} intensity={1.2} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
            <directionalLight position={[-20, 30, -15]} intensity={0.5} />
            
            {floors.map(floor => <FloorPlane key={floor.id} floorData={floor} />)}
            
            <Grid position={[0, currentFloorY, 0]} args={[35, 70]} cellSize={1} cellColor="#4A5568" sectionSize={5} sectionColor="#3B82F6" sectionThickness={1.5} fadeDistance={50} infiniteGrid />

            <Select box multiple={false} onChange={(selected) => {
                if (selected.length > 0) {
                    const obj = selected[0] as unknown as THREE.Mesh;
                    const id = obj.userData.id;
                    if (id !== selectedObjectId) setSelectedObjectId(id);
                } else { if (selectedObjectId) setSelectedObjectId(null); }
            }}>
                <group position={[0, currentFloorY, 0]}>
                    {visibleObjects.map(obj => {
                        const ObjectComponent = {
                            [ObjectType.Wall]: Wall,
                            [ObjectType.Door]: Door,
                            [ObjectType.Window]: Window,
                            [ObjectType.Table]: Table,
                            [ObjectType.Chair]: Chair,
                            [ObjectType.Bed]: Bed,
                            [ObjectType.Sofa]: Sofa,
                            [ObjectType.Shelf]: Shelf,
                            [ObjectType.Floor]: React.Fragment,
                        }[obj.type];
                        return <ObjectComponent key={obj.id} object={obj} />;
                    })}
                </group>
            </Select>

            <OrbitControls 
                makeDefault 
                minDistance={5} 
                maxDistance={80}
                mouseButtons={{
                    LEFT: THREE.MOUSE.ROTATE,
                    MIDDLE: THREE.MOUSE.PAN,
                    RIGHT: THREE.MOUSE.PAN,
                }}
                screenSpacePanning={false}
            />
        </>
    );
};

const ControlsHelpText: React.FC = () => {
    const [visible, setVisible] = React.useState(true);

    React.useEffect(() => {
        const timer = setTimeout(() => setVisible(false), 5000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`absolute bottom-4 right-4 bg-gray-900 bg-opacity-70 text-white text-xs rounded-lg px-3 py-2 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'} pointer-events-none z-20`}>
            <b>Controls:</b> Left-click: Rotate | Right/Middle-click: Pan | Scroll: Zoom
        </div>
    );
};

export default function App() {
  const { setSelectedObjectId, selectedObjectId, loadState } = useStore();
  const showPropertiesPanel = !!selectedObjectId;

  const handleFileLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    const loadedState = JSON.parse(text) as Omit<AppState, 'loadState'>;
                    loadState(loadedState);
                }
            } catch (error) {
                console.error("Failed to load or parse project file:", error);
                alert("Error: Could not load the project file. It may be corrupted.");
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input to allow loading the same file again
    }
  };

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-gray-800">
        <div className="absolute top-0 left-0 h-full flex z-10 pointer-events-none">
            <div className="pointer-events-auto"><ItemsPanel onFileLoad={handleFileLoad} /></div>
            <div className={`pointer-events-auto transition-all duration-300 ease-in-out overflow-hidden ${showPropertiesPanel ? 'w-80' : 'w-0'}`}>
                <PropertiesPanel />
            </div>
        </div>
      
      <main className="absolute top-0 bottom-0 right-0 transition-all duration-300 ease-in-out" style={{ left: showPropertiesPanel ? '40rem' : '20rem' }} onClick={() => setSelectedObjectId(null)}>
        <Canvas camera={{ position: [25, 25, 25], fov: 50 }} shadows>
            <SceneContent />
        </Canvas>
      </main>
      <ControlsHelpText />
    </div>
  );
}