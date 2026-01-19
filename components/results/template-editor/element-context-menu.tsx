"use client";

import { useEditorStore } from "./editor-context";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";
import {
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Lock,
  Unlock,
  Group,
  Ungroup,
  Plus,
  Minus,
  Rows3,
  Columns3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Grid
} from "lucide-react";

interface ElementContextMenuProps {
  children: React.ReactNode;
  elementId: string;
  elementType: string;
  isLocked?: boolean;
  groupId?: string;
}

export function ElementContextMenu({ 
  children, 
  elementId, 
  elementType,
  isLocked,
  groupId,
}: ElementContextMenuProps) {
  const deleteElement = useEditorStore((state) => state.deleteElement);
  const duplicateElement = useEditorStore((state) => state.duplicateElement);
  const bringToFront = useEditorStore((state) => state.bringToFront);
  const sendToBack = useEditorStore((state) => state.sendToBack);
  const bringForward = useEditorStore((state) => state.bringForward);
  const sendBackward = useEditorStore((state) => state.sendBackward);
  const lockElement = useEditorStore((state) => state.lockElement);
  const unlockElement = useEditorStore((state) => state.unlockElement);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const groupElements = useEditorStore((state) => state.groupElements);
  const ungroupElements = useEditorStore((state) => state.ungroupElements);
  const addTableRow = useEditorStore((state) => state.addTableRow);
  const removeTableRow = useEditorStore((state) => state.removeTableRow);
  const addTableColumn = useEditorStore((state) => state.addTableColumn);
  const removeTableColumn = useEditorStore((state) => state.removeTableColumn);
  const alignSelected = useEditorStore((state) => state.alignSelected);
  const distributeSelected = useEditorStore((state) => state.distributeSelected);

  const canGroup = selectedIds.length >= 2;

  return (
    <ContextMenu>
      {children}
      <ContextMenuContent className="w-56">
        {/* Duplicate */}
        <ContextMenuItem onClick={() => duplicateElement(elementId)}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
          <ContextMenuShortcut>Ctrl+D</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Layer Controls */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <ArrowUp className="mr-2 h-4 w-4" />
            Arrange
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={() => bringToFront(elementId)}>
              <ChevronsUp className="mr-2 h-4 w-4" />
              Bring to Front
            </ContextMenuItem>
            <ContextMenuItem onClick={() => bringForward(elementId)}>
              <ArrowUp className="mr-2 h-4 w-4" />
              Bring Forward
            </ContextMenuItem>
            <ContextMenuItem onClick={() => sendBackward(elementId)}>
              <ArrowDown className="mr-2 h-4 w-4" />
              Send Backward
            </ContextMenuItem>
            <ContextMenuItem onClick={() => sendToBack(elementId)}>
              <ChevronsDown className="mr-2 h-4 w-4" />
              Send to Back
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Table specific options */}
        {elementType === "table" && (
          <>
            <ContextMenuSeparator />
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Rows3 className="mr-2 h-4 w-4" />
                Rows
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-40">
                <ContextMenuItem onClick={() => addTableRow(elementId)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Row
                </ContextMenuItem>
                <ContextMenuItem onClick={() => removeTableRow(elementId)}>
                  <Minus className="mr-2 h-4 w-4" />
                  Remove Row
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Columns3 className="mr-2 h-4 w-4" />
                Columns
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-40">
                <ContextMenuItem onClick={() => addTableColumn(elementId)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Column
                </ContextMenuItem>
                <ContextMenuItem onClick={() => removeTableColumn(elementId)}>
                  <Minus className="mr-2 h-4 w-4" />
                  Remove Column
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </>
        )}

        <ContextMenuSeparator />

        {/* Alignment Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger disabled={selectedIds.length < 1}>
            <AlignLeft className="mr-2 h-4 w-4" />
            Align
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={() => alignSelected('left')}>
              <AlignLeft className="mr-2 h-4 w-4" />
              Left
            </ContextMenuItem>
            <ContextMenuItem onClick={() => alignSelected('center')}>
              <AlignCenter className="mr-2 h-4 w-4" />
              Center
            </ContextMenuItem>
            <ContextMenuItem onClick={() => alignSelected('right')}>
              <AlignRight className="mr-2 h-4 w-4" />
              Right
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => alignSelected('top')}>
              <ArrowUp className="mr-2 h-4 w-4" />
              Top
            </ContextMenuItem>
            <ContextMenuItem onClick={() => alignSelected('middle')}>
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0-8h8m-8 0H4" /></svg>
              Middle
            </ContextMenuItem>
            <ContextMenuItem onClick={() => alignSelected('bottom')}>
              <ArrowDown className="mr-2 h-4 w-4" />
              Bottom
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Distribution Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger disabled={selectedIds.length < 3}>
            <Grid className="mr-2 h-4 w-4" />
            Distribute
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={() => distributeSelected('horizontal')}>
              Horizontal
            </ContextMenuItem>
            <ContextMenuItem onClick={() => distributeSelected('vertical')}>
              Vertical
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        {/* Grouping */}
        {canGroup && !groupId && (
          <ContextMenuItem onClick={() => groupElements(selectedIds)}>
            <Group className="mr-2 h-4 w-4" />
            Group Selected
            <ContextMenuShortcut>Ctrl+G</ContextMenuShortcut>
          </ContextMenuItem>
        )}
        {groupId && (
          <ContextMenuItem onClick={() => ungroupElements(groupId)}>
            <Ungroup className="mr-2 h-4 w-4" />
            Ungroup
            <ContextMenuShortcut>Ctrl+Shift+G</ContextMenuShortcut>
          </ContextMenuItem>
        )}

        {/* Lock/Unlock */}
        {isLocked ? (
          <ContextMenuItem onClick={() => unlockElement(elementId)}>
            <Unlock className="mr-2 h-4 w-4" />
            Unlock
          </ContextMenuItem>
        ) : (
          <ContextMenuItem onClick={() => lockElement(elementId)}>
            <Lock className="mr-2 h-4 w-4" />
            Lock
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        {/* Delete */}
        <ContextMenuItem 
          onClick={() => {
            if (selectedIds.includes(elementId)) {
                selectedIds.forEach(id => deleteElement(id));
            } else {
                deleteElement(elementId);
            }
          }}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
          <ContextMenuShortcut>Del</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
