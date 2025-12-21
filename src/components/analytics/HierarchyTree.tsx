import React, { useEffect, useState, useRef } from 'react';
import { aiService } from '../../lib/aiService';

interface HierarchyNode {
    name: string;
    role: string;
    department?: string;
    shift?: string;        // Morning/Afternoon/Night
    shiftTime?: string;    // e.g., "6:00-14:00"
    children?: HierarchyNode[];
}

interface HierarchyTreeProps {
    staffList: any[];
    onDutyMap: Record<string, boolean>;
}

// Draggable & Zoomable Wrapper
const ZoomPanContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY * -0.001;
        const newScale = Math.min(Math.max(0.5, scale + delta), 2);
        setScale(newScale);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        lastPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;
        const deltaX = e.clientX - lastPos.current.x;
        const deltaY = e.clientY - lastPos.current.y;
        setPosition(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
        lastPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    return (
        <div
            className="w-full h-full overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50 cursor-move relative"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            ref={containerRef}
        >
            <div className="absolute top-4 right-4 bg-white/80 p-2 rounded-lg shadow-sm text-xs text-slate-500 z-50">
                Hubot Mouse: Scroll to Zoom, Drag to Pan
            </div>
            <div
                style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transformOrigin: 'center top',
                    transition: isDragging.current ? 'none' : 'transform 0.1s ease-out'
                }}
                className="w-full min-h-full flex justify-center p-20"
            >
                {children}
            </div>
        </div>
    );
};

// Utility: Check if shift has ended
const isShiftComplete = (shiftTime?: string): boolean => {
    if (!shiftTime) return false;

    // Parse end time from "6:00-14:00"
    const match = shiftTime.match(/-(\d+):(\d+)/);
    if (!match) return false;

    const endHour = parseInt(match[1]);
    const endMinute = parseInt(match[2]);

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Handle overnight shifts (22:00-06:00)
    if (endHour < 12 && shiftTime.includes('22:00')) {
        // Night shift ending in morning
        if (currentHour >= endHour && currentHour < 12) return true;
        return false;
    }

    // Regular shift check
    if (currentHour > endHour || (currentHour === endHour && currentMinute >= endMinute)) {
        return true;
    }

    return false;
};

// Node Component
const NodeCard: React.FC<{ node: HierarchyNode; onDuty: boolean }> = ({ node, onDuty }) => {
    // Check node type
    const isDeptHeader = node.role === "Department";
    const isShiftNode = node.role === "Shift";
    const shiftEnded = isShiftComplete(node.shiftTime);

    // Department Header
    if (isDeptHeader) {
        return (
            <div className="bg-gradient-to-r from-slate-700 to-slate-600 text-white px-5 py-3 rounded-lg text-sm font-bold shadow-md mb-4">
                📍 {node.name}
            </div>
        );
    }

    // Shift Node
    if (isShiftNode) {
        const shiftIcon = node.shift === 'Morning' ? '🌅' : node.shift === 'Afternoon' ? '🌞' : '🌙';
        const shiftColor = shiftEnded
            ? 'from-red-500 to-red-600 border-red-300'
            : 'from-blue-500 to-blue-600 border-blue-300';

        return (
            <div className={`relative bg-gradient-to-r ${shiftColor} text-white px-4 py-2 rounded-xl border-2 shadow-lg mb-3 min-w-[180px]`}>
                <div className="flex items-center justify-between">
                    <span className="text-xl">{shiftIcon}</span>
                    <div className="flex-1 text-center">
                        <div className="font-bold text-sm">{node.name}</div>
                        {node.shiftTime && (
                            <div className="text-xs opacity-90 mt-0.5">{node.shiftTime}</div>
                        )}
                    </div>
                    {shiftEnded && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                            ✓
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Regular Staff Node
    return (
        <div className={`relative bg-white/60 backdrop-blur-md border-[1.5px] ${onDuty ? 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'border-red-300 opacity-90'} p-3 rounded-xl min-w-[160px] max-w-[200px] text-center transition-all hover:scale-105 hover:bg-white hover:z-20`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs mx-auto mb-2 ${onDuty ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-400 to-red-500'}`}>
                {node.name.charAt(0)}
            </div>
            <h4 className="font-bold text-slate-800 text-sm leading-tight">{node.name}</h4>
            <p className="text-[10px] text-slate-500 uppercase font-semibold mt-1">{node.role}</p>
        </div>
    );
};

// Recursive Tree Renderer
const TreeRenderer: React.FC<{ node: HierarchyNode; onDutyMap: Record<string, boolean>; level: number }> = ({ node, onDutyMap, level }) => {
    // If we are deep in the tree (Level 3+), we might want to switch to Vertical Stacking for Compactness? 
    // The reference image has Vertical Stacks for departments.
    // Let's assume the data structure is: Root -> Exec Sous -> [Dept1, Dept2...] -> [Staff, Staff...]

    // Check if this node has children
    const hasChildren = node.children && node.children.length > 0;

    // If we are at the "Department Level", we render children vertically.
    // How to detect? If children count is > 1 and they don't have children themselves? 
    // Or based on level? Root=0, ExecSous=1, DeptHeads=2.
    // So Level 2 nodes (Department Heads) should render their children vertically.

    const isVerticalStack = level >= 2;

    return (
        <div className="flex flex-col items-center">
            <NodeCard node={node} onDuty={onDutyMap[node.name] || false} />

            {hasChildren && (
                <>
                    {/* Connector Line Down */}
                    <div className="w-px h-6 bg-slate-400"></div>

                    {isVerticalStack ? (
                        // Vertical Stack Mode (Member -> Member -> Member)
                        <div className="flex flex-col items-center">
                            {node.children!.map((child, idx) => (
                                <div key={idx} className="flex flex-col items-center">
                                    {/* If it's not the first child, we need a connector from prev sibling? No, we are inside a map. */}
                                    {/* Actually, if we map them, they just stack. We need lines between them. */}
                                    {/* The parent loop adds the top line. */}

                                    <TreeRenderer node={child} onDutyMap={onDutyMap} level={level + 1} />
                                    {/* Add line below if not last? Handled by the child's own "Down" line if it has children. 
                                     But here we are stacking siblings.
                                     We need a line betwen siblings.
                                   */}
                                    {idx < node.children!.length - 1 && <div className="w-px h-6 bg-slate-400"></div>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Horizontal Split Mode
                        <div className="flex relative pt-4">
                            {/* Horizontal Bar */}
                            {node.children!.length > 1 && (
                                <div className="absolute top-0 left-0 right-0 h-px bg-slate-400 mx-[20%]"></div> // mx adjusts width of bar
                            )}

                            {/* Children */}
                            <div className="flex gap-8 items-start">
                                {node.children!.map((child, idx) => (
                                    <div key={idx} className="flex flex-col items-center relative">
                                        {/* Connector from Bar to Child */}
                                        <div className="absolute -top-4 w-px h-4 bg-slate-400"></div>
                                        <TreeRenderer node={child} onDutyMap={onDutyMap} level={level + 1} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

const HierarchyTree: React.FC<HierarchyTreeProps> = ({ staffList, onDutyMap }) => {
    const [treeData, setTreeData] = useState<HierarchyNode | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            // We rely on aiService to give us the structure. 
            // We updated buildLocalFallback to give the correct Shape (Exec -> Exec Sous -> Depts).
            const data = await aiService.buildHierarchy(staffList);
            setTreeData(data);
            setLoading(false);
        };
        load();
    }, [staffList]);

    if (loading) return <div className="p-10 text-center text-slate-500">Building Chart...</div>;
    if (!treeData) return <div className="p-10 text-center text-slate-500">No Data</div>;

    return (
        <ZoomPanContainer>
            <div className="absolute top-4 left-4 text-xs text-slate-400">v2.0 Refined Hierarchy</div>
            <TreeRenderer node={treeData} onDutyMap={onDutyMap} level={0} />
        </ZoomPanContainer>
    );
};

export default HierarchyTree;
