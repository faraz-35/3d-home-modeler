export enum ObjectType {
  Wall = 'WALL',
  Door = 'DOOR',
  Window = 'WINDOW',
  Floor = 'FLOOR',
  Table = 'TABLE',
  Chair = 'CHAIR',
  Bed = 'BED',
  Sofa = 'SOFA',
  Shelf = 'SHELF',
}

export interface SceneObject {
  id: string;
  type: ObjectType;
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number, number]; // width, height, depth for walls/doors/windows
  color: string;
  floorIndex: number;
}

export interface Floor {
  id:string;
  y: number;
  color: string;
}

export interface AppState {
  objects: SceneObject[];
  floors: Floor[];
  selectedObjectId: string | null;
  currentFloorIndex: number;
  sceneBackgroundColor: string;
  past: Partial<AppState>[];
  future: Partial<AppState>[];
  
  addFloor: () => void;
  deleteFloor: (index: number) => void;
  setCurrentFloorIndex: (index: number) => void;
  addObject: (type: ObjectType) => void;
  deleteObject: (id: string) => void;
  updateObject: (id: string, newProps: Partial<SceneObject>) => void;
  updateFloor: (id: string, newProps: Partial<Floor>) => void;
  setSelectedObjectId: (id: string | null) => void;
  setSceneBackgroundColor: (color: string) => void;
  loadState: (newState: Omit<AppState, 'loadState'>) => void;
  undo: () => void;
  redo: () => void;
}