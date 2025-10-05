import { create } from 'zustand';
import { AppState, ObjectType, Floor, SceneObject } from '../types';

const WALL_HEIGHT = 2.5;
const WALL_THICKNESS = 0.15;
const FLOOR_THICKNESS = 0.1;

// List of properties that should be tracked for undo/redo
const undoableStateKeys: (keyof AppState)[] = ['objects', 'floors', 'sceneBackgroundColor', 'currentFloorIndex', 'selectedObjectId'];


export const useStore = create<AppState>((set, get) => {
  // A helper to save the current state for undo functionality
  const saveState = () => {
    const currentState = get();
    // FIX: Use a type assertion to work around TypeScript's object key correlation issue.
    const stateToSave = undoableStateKeys.reduce((acc, key) => {
        (acc as any)[key] = currentState[key];
        return acc;
    }, {} as Partial<AppState>);

    set(state => ({
        past: [...state.past, stateToSave],
        future: [] // Clear future states on a new action
    }));
  };
  
  return {
  objects: [],
  floors: [{ id: crypto.randomUUID(), y: 0, color: '#808080', name: 'Floor 1' }],
  selectedObjectId: null,
  currentFloorIndex: 0,
  sceneBackgroundColor: '#FFFFFF',
  past: [],
  future: [],

  addFloor: () => {
    saveState();
    set((state) => {
      const highestFloor = state.floors.reduce((max, f) => f.y > max.y ? f : max, state.floors[0] || { y: -WALL_HEIGHT });
      const newY = highestFloor.y + WALL_HEIGHT + FLOOR_THICKNESS;
      const newFloor: Floor = { id: crypto.randomUUID(), y: newY, color: '#808080', name: `Floor ${state.floors.length + 1}` };
      return {
        floors: [...state.floors, newFloor],
        currentFloorIndex: state.floors.length,
      };
    });
  },

  deleteFloor: (index: number) => {
    if (get().floors.length <= 1) return;
    saveState();
    set((state) => {
        const newFloors = state.floors.filter((_, i) => i !== index);
        const newObjects = state.objects
            .filter(obj => obj.floorIndex !== index)
            .map(obj => ({
                ...obj,
                floorIndex: obj.floorIndex > index ? obj.floorIndex - 1 : obj.floorIndex
            }));
        
        const newCurrentFloorIndex = state.currentFloorIndex > index 
            ? state.currentFloorIndex - 1 
            : state.currentFloorIndex === index 
                ? Math.max(0, index - 1) 
                : state.currentFloorIndex;
        
        return {
            floors: newFloors,
            objects: newObjects,
            currentFloorIndex: newCurrentFloorIndex,
            selectedObjectId: null
        };
    });
  },

  setCurrentFloorIndex: (index: number) => {
    set({ currentFloorIndex: index, selectedObjectId: null }); // Deselect object when changing floor
  },

  addObject: (type: ObjectType) => {
    saveState();
    set((state) => {
      const currentFloor = state.floors[state.currentFloorIndex];
      if (!currentFloor) return state;

      const objectCount = state.objects.filter(o => o.type === type).length;
      const typeName = type.charAt(0) + type.slice(1).toLowerCase();
      const newName = `${typeName} ${objectCount + 1}`;
      
      let newObject: SceneObject;
      const commonProps = {
        id: crypto.randomUUID(),
        name: newName,
        floorIndex: state.currentFloorIndex,
        position: [0, 0, 0] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number],
      };

      switch (type) {
        case ObjectType.Door:
          newObject = {
            ...commonProps, type, size: [0.9, 2.0, WALL_THICKNESS * 1.1], position: [0, 1.0, 0], color: '#8B4513',
          };
          break;
        case ObjectType.Window:
          newObject = {
            ...commonProps, type, size: [1.2, 1.0, WALL_THICKNESS * 1.1], position: [0, 1.4, 0], color: '#ADD8E6',
          };
          break;
        case ObjectType.Table:
          newObject = {
            ...commonProps, type, size: [1.2, 0.75, 0.7], position: [0, 0.75 / 2, 0], color: '#A0522D',
          };
          break;
        case ObjectType.Chair:
            newObject = {
            ...commonProps, type, size: [0.45, 0.9, 0.45], position: [0, 0.9 / 2, 0], color: '#654321',
          };
          break;
        case ObjectType.Bed:
            newObject = {
            ...commonProps, type, size: [1.5, 0.9, 2.0], position: [0, 0.9 / 2, 0], color: '#4A5568',
            };
            break;
        case ObjectType.Sofa:
            newObject = {
            ...commonProps, type, size: [2.1, 0.85, 0.9], position: [0, 0.85 / 2, 0], color: '#718096',
            };
            break;
        case ObjectType.Shelf:
            newObject = {
            ...commonProps, type, size: [0.9, 1.8, 0.3], position: [0, 1.8 / 2, 0], color: '#D2B48C',
            };
            break;
        case ObjectType.Wall:
        default:
          newObject = {
            ...commonProps, type: ObjectType.Wall, size: [4, WALL_HEIGHT, WALL_THICKNESS], position: [0, WALL_HEIGHT / 2, 0], color: '#D3D3D3',
          };
          break;
      }
      return { objects: [...state.objects, newObject] };
    });
  },

  deleteObject: (id: string) => {
    saveState();
    set((state) => ({
      objects: state.objects.filter((obj) => obj.id !== id),
      selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId,
    }));
  },

  updateObject: (id, newProps) => {
    // No longer saves state to prevent cluttering undo history with minor changes
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id ? { ...obj, ...newProps } : obj
      ),
    }));
  },
  
  updateFloor: (id, newProps) => {
    // No longer saves state to prevent cluttering undo history with minor changes
    set((state) => ({
      floors: state.floors.map((floor) =>
        floor.id === id ? { ...floor, ...newProps } : floor
      ),
    }));
  },

  setSelectedObjectId: (id) => {
    set({ selectedObjectId: id });
  },

  setSceneBackgroundColor: (color) => {
    saveState();
    set({ sceneBackgroundColor: color });
  },

  undo: () => {
    set(state => {
        if (state.past.length === 0) return {};
        const previousState = state.past[state.past.length - 1];
        const newPast = state.past.slice(0, state.past.length - 1);

        // FIX: Use a type assertion to work around TypeScript's object key correlation issue.
        const currentState = undoableStateKeys.reduce((acc, key) => {
            (acc as any)[key] = state[key];
            return acc;
        }, {} as Partial<AppState>);
        
        return {
            ...previousState,
            past: newPast,
            future: [currentState, ...state.future],
        };
    });
  },

  redo: () => {
    set(state => {
        if (state.future.length === 0) return {};
        const nextState = state.future[0];
        const newFuture = state.future.slice(1);
        
        // FIX: Use a type assertion to work around TypeScript's object key correlation issue.
        const currentState = undoableStateKeys.reduce((acc, key) => {
            (acc as any)[key] = state[key];
            return acc;
        }, {} as Partial<AppState>);

        return {
            ...nextState,
            past: [...state.past, currentState],
            future: newFuture,
        };
    });
  },

  loadState: (newState) => {
    set({...newState, past: [], future: []}); // Reset history on load
  }
}});