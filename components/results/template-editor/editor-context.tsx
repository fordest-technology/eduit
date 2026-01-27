"use client";

import { createContext, useContext, useRef, ReactNode } from "react";
import { createStore, useStore } from "zustand";

export type ElementType = "text" | "image" | "shape" | "dynamic" | "table" | "watermark" | "line";

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  style: Record<string, any>;
  metadata?: Record<string, any>;
  locked?: boolean;
  groupId?: string;
}

export interface SchoolData {
  name: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  address?: string;
  phone?: string;
  email?: string;
  motto?: string;
  assessmentComponents?: {
    id: string;
    name: string;
    key: string;
    maxScore: number;
    weight: number;
  }[];
}

interface EditorState {
  elements: CanvasElement[];
  selectedId: string | null;
  selectedIds: string[]; // Multi-select support
  zoom: number;
  canvasSize: { width: number; height: number };
  gridSize: number;
  showGrid: boolean;
  schoolData: SchoolData | null;
  activeTool: string;
  
  past: Partial<EditorState>[];
  future: Partial<EditorState>[];

  // Actions
  undo: () => void;
  redo: () => void;
  initialize: (data: any) => void;
  setSchoolData: (data: SchoolData) => void;
  addElement: (type: ElementType, x?: number, y?: number) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  setSelectedId: (id: string | null) => void;
  setSelectedIds: (ids: string[]) => void;
  toggleSelectId: (id: string) => void;
  setZoom: (zoom: number) => void;
  setGridSize: (size: number) => void;
  setShowGrid: (show: boolean) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  setCanvasSize: (size: { width: number; height: number }) => void;
  groupElements: (ids: string[]) => void;
  ungroupElements: (groupId: string) => void;
  lockElement: (id: string) => void;
  unlockElement: (id: string) => void;
  addTableRow: (id: string) => void;
  removeTableRow: (id: string) => void;
  addTableColumn: (id: string) => void;
  removeTableColumn: (id: string) => void;
  alignSelected: (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'page-center-x' | 'page-center-y') => void;
  distributeSelected: (direction: 'horizontal' | 'vertical') => void;
  setActiveTool: (tool: string) => void;
  getState: () => any;
}

const MAX_HISTORY = 50;

const createEditorStore = (initialData: any = {}) => {
  return createStore<EditorState>((set, get) => {
    // Helper to save state for undo
    const saveToHistory = (state: EditorState) => {
        const { elements, canvasSize } = state;
        const past = [...state.past, { elements, canvasSize }];
        if (past.length > MAX_HISTORY) past.shift();
        return { past, future: [] };
    };

    return {
    elements: initialData.elements || [],
    selectedId: null,
    selectedIds: [],
    zoom: 1,
    canvasSize: initialData.canvasSize || { width: 794, height: 1123 },
    gridSize: 20,
    showGrid: true,
    schoolData: null,
    activeTool: 'select',
    past: [],
    future: [],

    undo: () => set((state) => {
        if (!state.past || state.past.length === 0) return state;
        const previous = state.past[state.past.length - 1];
        const newPast = state.past.slice(0, state.past.length - 1);
        return {
            elements: previous.elements || state.elements,
            canvasSize: previous.canvasSize || state.canvasSize,
            past: newPast,
            future: [{ elements: state.elements, canvasSize: state.canvasSize }, ...state.future],
        };
    }),

    redo: () => set((state) => {
        if (!state.future || state.future.length === 0) return state;
        const next = state.future[0];
        const newFuture = state.future.slice(1);
        return {
            elements: next.elements || state.elements,
            canvasSize: next.canvasSize || state.canvasSize,
            past: [...state.past, { elements: state.elements, canvasSize: state.canvasSize }],
            future: newFuture,
        };
    }),

    initialize: (data) => set((state) => ({
      ...state,
      elements: data.elements || [],
      canvasSize: data.canvasSize || { width: 794, height: 1123 },
      past: [],
      future: [],
    })),

    setSchoolData: (schoolData) => set({ schoolData }),

    addElement: (type, x = 100, y = 100) => {
      const id = crypto.randomUUID();
      const schoolData = get().schoolData;
      const primaryColor = schoolData?.primaryColor || "#1e40af";
      
      let newElement: CanvasElement;
      
      if (type === "watermark") {
        const canvasSize = get().canvasSize;
        newElement = {
          id,
          type,
          x: canvasSize.width / 2 - 150,
          y: canvasSize.height / 2 - 150,
          width: 300,
          height: 300,
          style: { opacity: 0.08 },
          metadata: { field: "school_logo", isWatermark: true },
          locked: true,
        };
      } else {
        newElement = {
          id,
          type,
          x,
          y,
          width: type === "text" ? 200 : type === "table" ? 500 : type === "line" ? 200 : 100,
          height: type === "text" ? 40 : type === "table" ? 200 : type === "line" ? 2 : 100,
          content: type === "text" ? "Double click to edit" : undefined,
          style: {
            fontSize: 14,
            fontFamily: "Inter, sans-serif",
            color: "#000000",
            backgroundColor: type === "shape" ? primaryColor : "transparent",
            textAlign: "left",
            borderWidth: 0,
            borderColor: "#000000",
            borderRadius: 0,
            opacity: 1,
            padding: 8,
            headerBgColor: primaryColor,
            headerTextColor: "#ffffff",
          },
          metadata: type === "dynamic" 
            ? { field: "student_name" } 
            : type === "table" 
              ? { rows: 4, cols: 4, borderColor: primaryColor, headers: [] } 
              : type === "image"
                ? { field: "", acceptUpload: true }
                : {},
        };
      }
      
      set((state) => ({ 
        ...saveToHistory(state),
        elements: [...state.elements, newElement], 
        selectedId: id,
        selectedIds: [id],
      }));
    },

    updateElement: (id, updates) => set((state) => {
      const element = state.elements.find(el => el.id === id);
      if (!element) return state;

      // Special handling for position updates to move groups and multi-selection
      if (('x' in updates || 'y' in updates) && Object.keys(updates).length <= 2 && updates.width === undefined) {
        const dx = 'x' in updates ? (updates.x as number) - element.x : 0;
        const dy = 'y' in updates ? (updates.y as number) - element.y : 0;

        if (dx === 0 && dy === 0) return state;

        const idsToMove = new Set<string>();
        if (state.selectedIds.includes(id)) {
          state.selectedIds.forEach(sid => idsToMove.add(sid));
        } else {
          idsToMove.add(id);
        }
        
        const groupIds = new Set<string>();
        idsToMove.forEach(sid => {
          const el = state.elements.find(e => e.id === sid);
          if (el?.groupId) groupIds.add(el.groupId);
        });

        if (groupIds.size > 0) {
          state.elements.forEach(el => {
            if (el.groupId && groupIds.has(el.groupId)) idsToMove.add(el.id);
          });
        }

        return {
          ...saveToHistory(state),
          elements: state.elements.map(el => {
            if (idsToMove.has(el.id) && !el.locked) {
              return {
                ...el,
                x: el.x + dx,
                y: el.y + dy,
              };
            }
            return el;
          })
        };
      }

      const isLocked = state.elements.find(el => el.id === id)?.locked;
      if (isLocked && (updates.x !== undefined || updates.y !== undefined || updates.width !== undefined || updates.height !== undefined)) {
          return state;
      }

      return {
        ...saveToHistory(state),
        elements: state.elements.map((el) => (el.id === id ? { ...el, ...updates } : el)),
      };
    }),

    deleteElement: (id) => set((state) => ({
      ...saveToHistory(state),
      elements: state.elements.filter((el) => el.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
      selectedIds: state.selectedIds.filter(sid => sid !== id),
    })),

    duplicateElement: (id) => {
      const element = get().elements.find(el => el.id === id);
      if (!element) return;
      
      const newId = crypto.randomUUID();
      const newElement: CanvasElement = {
        ...element,
        id: newId,
        x: element.x + 20,
        y: element.y + 20,
        groupId: undefined,
      };
      
      set((state) => ({
        ...saveToHistory(state),
        elements: [...state.elements, newElement],
        selectedId: newId,
        selectedIds: [newId],
      }));
    },

    setSelectedId: (id) => set({ 
      selectedId: id, 
      selectedIds: id ? [id] : [] 
    }),
    
    setSelectedIds: (ids) => set({ 
      selectedIds: ids,
      selectedId: ids.length === 1 ? ids[0] : null,
    }),

    toggleSelectId: (id) => set((state) => {
      const isSelected = state.selectedIds.includes(id);
      const newSelectedIds = isSelected 
        ? state.selectedIds.filter(sid => sid !== id)
        : [...state.selectedIds, id];
      return {
        selectedIds: newSelectedIds,
        selectedId: newSelectedIds.length === 1 ? newSelectedIds[0] : null,
      };
    }),
    
    setZoom: (zoom) => set({ zoom }),
    setGridSize: (gridSize) => set({ gridSize }),
    setShowGrid: (showGrid) => set({ showGrid }),

    bringToFront: (id) => set((state) => {
      const elementIndex = state.elements.findIndex(el => el.id === id);
      if (elementIndex === -1 || elementIndex === state.elements.length - 1) return state;
      
      const newElements = [...state.elements];
      const [element] = newElements.splice(elementIndex, 1);
      newElements.push(element);
      
      return { ...saveToHistory(state), elements: newElements };
    }),

    sendToBack: (id) => set((state) => {
      const elementIndex = state.elements.findIndex(el => el.id === id);
      if (elementIndex === -1 || elementIndex === 0) return state;
      
      const newElements = [...state.elements];
      const [element] = newElements.splice(elementIndex, 1);
      newElements.unshift(element);
      
      return { ...saveToHistory(state), elements: newElements };
    }),

    bringForward: (id) => set((state) => {
      const elementIndex = state.elements.findIndex(el => el.id === id);
      if (elementIndex === -1 || elementIndex === state.elements.length - 1) return state;
      
      const newElements = [...state.elements];
      [newElements[elementIndex], newElements[elementIndex + 1]] = 
        [newElements[elementIndex + 1], newElements[elementIndex]];
      
      return { ...saveToHistory(state), elements: newElements };
    }),

    sendBackward: (id) => set((state) => {
      const elementIndex = state.elements.findIndex(el => el.id === id);
      if (elementIndex === -1 || elementIndex === 0) return state;
      
      const newElements = [...state.elements];
      [newElements[elementIndex], newElements[elementIndex - 1]] = 
        [newElements[elementIndex - 1], newElements[elementIndex]];
      
      return { ...saveToHistory(state), elements: newElements };
    }),

    setCanvasSize: (canvasSize) => set((state) => ({ 
        ...saveToHistory(state),
        canvasSize 
    })),

    groupElements: (ids) => {
      if (ids.length < 2) return;
      const groupId = crypto.randomUUID();
      set((state) => ({
        ...saveToHistory(state),
        elements: state.elements.map(el => 
          ids.includes(el.id) ? { ...el, groupId } : el
        ),
      }));
    },

    ungroupElements: (groupId) => set((state) => ({
      ...saveToHistory(state),
      elements: state.elements.map(el => 
        el.groupId === groupId ? { ...el, groupId: undefined } : el
      ),
    })),

    lockElement: (id) => set((state) => ({
      ...saveToHistory(state),
      elements: state.elements.map(el => 
        el.id === id ? { ...el, locked: true } : el
      ),
    })),

    unlockElement: (id) => set((state) => ({
      ...saveToHistory(state),
      elements: state.elements.map(el => 
        el.id === id ? { ...el, locked: false } : el
      ),
    })),

    addTableRow: (id) => set((state) => ({
      ...saveToHistory(state),
      elements: state.elements.map(el => {
        if (el.id !== id || el.type !== "table") return el;
        const currentRows = el.metadata?.rows || 3;
        return {
          ...el,
          metadata: { ...el.metadata, rows: currentRows + 1 }
        };
      }),
    })),

    removeTableRow: (id) => set((state) => ({
      ...saveToHistory(state),
      elements: state.elements.map(el => {
        if (el.id !== id || el.type !== "table") return el;
        const currentRows = el.metadata?.rows || 3;
        if (currentRows <= 1) return el;
        return {
          ...el,
          metadata: { ...el.metadata, rows: currentRows - 1 }
        };
      }),
    })),

    addTableColumn: (id) => set((state) => ({
      ...saveToHistory(state),
      elements: state.elements.map(el => {
        if (el.id !== id || el.type !== "table") return el;
        const currentCols = el.metadata?.cols || 3;
        if (currentCols >= 12) return el;
        
        const headers = [...(el.metadata?.headers || [])];
        while (headers.length < currentCols + 1) headers.push("");
        
        const columnWidths = [...(el.metadata?.columnWidths || [])];
        if (columnWidths.length === 0) {
            for(let i=0; i<currentCols; i++) columnWidths.push(1);
        }
        columnWidths.push(1);
        
        return {
          ...el,
          metadata: { ...el.metadata, cols: currentCols + 1, headers, columnWidths }
        };
      }),
    })),

    removeTableColumn: (id) => set((state) => ({
      ...saveToHistory(state),
      elements: state.elements.map(el => {
        if (el.id !== id || el.type !== "table") return el;
        const currentCols = el.metadata?.cols || 3;
        if (currentCols <= 1) return el;
        
        const headers = (el.metadata?.headers || []).slice(0, currentCols - 1);
        const columnWidths = (el.metadata?.columnWidths || []).slice(0, currentCols - 1);
        
        return {
          ...el,
          metadata: { ...el.metadata, cols: currentCols - 1, headers, columnWidths }
        };
      }),
    })),

    alignSelected: (type) => set((state) => {
        const selectedElements = state.elements.filter(el => state.selectedIds.includes(el.id));
        if (selectedElements.length < 1) return state;

        const minX = Math.min(...selectedElements.map(el => el.x));
        const maxX = Math.max(...selectedElements.map(el => el.x + el.width));
        const minY = Math.min(...selectedElements.map(el => el.y));
        const maxY = Math.max(...selectedElements.map(el => el.y + el.height));
        
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        return {
            ...saveToHistory(state),
            elements: state.elements.map(el => {
                if (!state.selectedIds.includes(el.id)) return el;
                switch (type) {
                    case 'left': return { ...el, x: minX };
                    case 'right': return { ...el, x: maxX - el.width };
                    case 'center': return { ...el, x: centerX - el.width / 2 };
                    case 'top': return { ...el, y: minY };
                    case 'bottom': return { ...el, y: maxY - el.height };
                    case 'middle': return { ...el, y: centerY - el.height / 2 };
                    case 'page-center-x': {
                        const canvasWidth = get().canvasSize.width;
                        const offset = (centerX - (minX + maxX) / 2); // For multi-select offset maintenance
                        const collectiveWidth = maxX - minX;
                        const collectiveX = (canvasWidth - collectiveWidth) / 2;
                        return { ...el, x: collectiveX + (el.x - minX) };
                    }
                    case 'page-center-y': {
                        const canvasHeight = get().canvasSize.height;
                        const collectiveHeight = maxY - minY;
                        const collectiveY = (canvasHeight - collectiveHeight) / 2;
                        return { ...el, y: collectiveY + (el.y - minY) };
                    }
                    default: return el;
                }
            })
        };
    }),

    distributeSelected: (direction) => set((state) => {
        const selectedElements = state.elements
            .filter(el => state.selectedIds.includes(el.id))
            .sort((a, b) => direction === 'horizontal' ? a.x - b.x : a.y - b.y);

        if (selectedElements.length < 3) return state;

        const first = selectedElements[0];
        const last = selectedElements[selectedElements.length - 1];

        if (direction === 'horizontal') {
            const totalWidth = last.x - (first.x + first.width);
            const totalElementsWidth = selectedElements.slice(1, -1).reduce((acc, el) => acc + el.width, 0);
            const space = (totalWidth - totalElementsWidth) / (selectedElements.length - 1);
            
            let currentX = first.x + first.width + space;
            return {
                ...saveToHistory(state),
                elements: state.elements.map(el => {
                    const idx = selectedElements.findIndex(sel => sel.id === el.id);
                    if (idx > 0 && idx < selectedElements.length - 1) {
                        const newX = currentX;
                        currentX += el.width + space;
                        return { ...el, x: newX };
                    }
                    return el;
                })
            };
        } else {
            const totalHeight = last.y - (first.y + first.height);
            const totalElementsHeight = selectedElements.slice(1, -1).reduce((acc, el) => acc + el.height, 0);
            const space = (totalHeight - totalElementsHeight) / (selectedElements.length - 1);
            
            let currentY = first.y + first.height + space;
            return {
                ...saveToHistory(state),
                elements: state.elements.map(el => {
                    const idx = selectedElements.findIndex(sel => sel.id === el.id);
                    if (idx > 0 && idx < selectedElements.length - 1) {
                        const newY = currentY;
                        currentY += el.height + space;
                        return { ...el, y: newY };
                    }
                    return el;
                })
            };
        }
    }),
    
    setActiveTool: (tool) => set({ activeTool: tool }),

    getState: () => ({
      elements: get().elements,
      canvasSize: get().canvasSize,
      schoolData: get().schoolData,
    }),
  };});
};

type EditorStore = ReturnType<typeof createEditorStore>;

const EditorContext = createContext<EditorStore | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<EditorStore>(null);
  if (!storeRef.current) {
    storeRef.current = createEditorStore();
  }
  return <EditorContext.Provider value={storeRef.current}>{children}</EditorContext.Provider>;
}

export function useEditorStore<T>(selector: (state: EditorState) => T): T {
  const store = useContext(EditorContext);
  if (!store) throw new Error("useEditorStore must be used within EditorProvider");
  return useStore(store, selector);
}


