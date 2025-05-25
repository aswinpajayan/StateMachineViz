
import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { StateMachine, StateNode, Transition, Point, NodeType, ConnectingState, NodeConnectionSide, SelectedComponent, AllMachines } from '../types'; // Assuming AllMachines is Record<string, StateMachine>
import { StateNodeDisplay } from './StateNodeDisplay';
import { TransitionLineDisplay } from './TransitionLineDisplay';
import { TransitionTooltip } from './TransitionTooltip';
import { ZoomInIcon, ZoomOutIcon, FitToScreenIcon } from './icons/ZoomIcons';
import { PlusIcon } from './icons/ActionIcons'; // Import PlusIcon
// Fix: Import NODE_HEADER_HEIGHT
import { DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT, HIERARCHICAL_NODE_PADDING, NODE_HEADER_HEIGHT } from '../constants';


interface CanvasAreaProps {
  machine: StateMachine; // This is the top-level active machine
  activeMachineId: string;
  allMachines: AllMachines;
  selectedComponent: SelectedComponent | null;
  onSelectComponent: (type: 'node' | 'transition' | null, id?: string, machineId?: string) => void;
  onOpenTransitionModal: (transition: Transition, targetMachineId: string) => void;
  onNodeToggleExpand: (nodeId: string, targetMachineId: string) => void;
  onNodePositionChange: (nodeId: string, newPosition: Point, targetMachineId: string) => void;
  onTransitionMidpointChange: (transitionId: string, newOffset: Point, oldOffset: Point | undefined, targetMachineId: string) => void;
  onOpenTransitionContextMenu: (transitionId: string, machineId: string, position: Point) => void;
  connectingState: ConnectingState | null;
  onStartTransitionCreation: (sourceMachineId: string, sourceNodeId: string, sourceSide: NodeConnectionSide, previewStartPoint: Point) => void;
  onUpdateConnectingPreviewPoint: (point: Point) => void;
  onCompleteNewTransition: (targetMachineId: string, targetNodeId: string, targetSide: NodeConnectionSide) => void;
  onCancelNewTransition: () => void;
  onOpenAddNodeModalRequest: () => void; // New prop for canvas add node button
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3.0;
const ZOOM_SENSITIVITY = 0.001;
const DRAG_THRESHOLD = 5; // Pixels

interface HoveredTransitionDetails {
  transition: Transition;
  fromNodeTitle: string;
  toNodeTitle: string;
  screenPosition: Point;
  machineId: string;
}

const getEdgePointForPreview = (node: StateNode, side: NodeConnectionSide, svgPoint: Point, offsetX: number = 0, offsetY: number = 0): Point => {
    const { position, size } = node.metadata;
    const nodeX = position.x + offsetX;
    const nodeY = position.y + offsetY;
    const nodeWidth = size?.width || DEFAULT_NODE_WIDTH;
    const nodeHeight = size?.height || DEFAULT_NODE_HEIGHT;

    switch(side) {
        case 'top': return { x: nodeX + nodeWidth / 2, y: nodeY };
        case 'bottom': return { x: nodeX + nodeWidth / 2, y: nodeY + nodeHeight };
        case 'left': return { x: nodeX, y: nodeY + nodeHeight / 2 };
        case 'right': return { x: nodeX + nodeWidth, y: nodeY + nodeHeight / 2 };
        default: return svgPoint;
    }
};


export const CanvasArea: React.FC<CanvasAreaProps> = ({
  machine: activeTopLevelMachine, // Renamed for clarity
  activeMachineId,
  allMachines,
  selectedComponent,
  onSelectComponent,
  onOpenTransitionModal,
  onNodeToggleExpand,
  onNodePositionChange,
  onTransitionMidpointChange,
  onOpenTransitionContextMenu,
  connectingState,
  onStartTransitionCreation,
  onUpdateConnectingPreviewPoint,
  onCompleteNewTransition,
  onCancelNewTransition,
  onOpenAddNodeModalRequest // New prop
}) => {
  const [viewBox, setViewBox] = useState<string>('0 0 1000 800');
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState<Point | null>(null);
  
  const [draggingNodeInfo, setDraggingNodeInfo] = useState<{nodeId: string, machineId: string, startOffset: Point} | null>(null);
  const [didDragNode, setDidDragNode] = useState(false);

  const [draggingTransitionInfo, setDraggingTransitionInfo] = useState<{
    id: string;
    machineId: string;
    initialOffset: Point;
    svgMouseAtDragStart: Point;
    originalMidPointOffset: Point | undefined;
  } | null>(null);
  const [didDragTransitionMidpoint, setDidDragTransitionMidpoint] = useState(false);

  const [hoveredTransitionDetails, setHoveredTransitionDetails] = useState<HoveredTransitionDetails | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  const getSvgCoordinates = useCallback((eventClientX: number, eventClientY: number): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = eventClientX;
    pt.y = eventClientY;
    const screenCTM = svg.getScreenCTM();
    if (screenCTM) {
      return pt.matrixTransform(screenCTM.inverse());
    }
    return { x: 0, y: 0 };
  }, []);

  const handleConnectionPointMouseDown = useCallback((machineId: string, nodeId: string, side: NodeConnectionSide, event: React.MouseEvent) => {
    event.stopPropagation();
    const svgPoint = getSvgCoordinates(event.clientX, event.clientY);
    onStartTransitionCreation(machineId, nodeId, side, svgPoint);
    svgRef.current?.classList.add('cursor-crosshair');
    svgRef.current?.classList.remove('cursor-grab');
  }, [getSvgCoordinates, onStartTransitionCreation]);


  const handleNodeMouseDown = useCallback((machineId: string, nodeId: string, event: React.MouseEvent) => {
    const targetElement = event.target as SVGElement;
    if (targetElement.closest('[data-connection-side]') || targetElement.closest('.expand-collapse-button')) {
        return;
    }
    event.stopPropagation();
    setIsPanning(false);
    
    const machineInstance = allMachines[machineId];
    const node = machineInstance?.nodes.find(n => n.id === nodeId);
    if (!node) return;

    setDraggingNodeInfo({nodeId, machineId, startOffset: {x:0, y:0}}); // Real offset calculated in mousemove
    setDidDragNode(false);
    const svgClickPos = getSvgCoordinates(event.clientX, event.clientY);
    
    // Find the total offset of this node's machine relative to the canvas
    let totalOffsetX = 0;
    let totalOffsetY = 0;
    let currentMachine = machineId;
    let parentNode: StateNode | undefined;

    // Traverse up the hierarchy to find the absolute position of the node on canvas
    // This part is tricky as node positions are relative to their parent machine's container
    // For simplicity, assume dragging node happens in its own machine's coordinate system for now.
    // If node is in a sub-machine, its position is relative.
    // We need node's absolute SVG position. This is given by its metadata.position + parent's offset recursively.
    // For this handler, we'll use the node's position within its direct machine for drag start offset calculation.
    // The actual update in onNodePositionChange will take the new absolute SVG position.
    
    const nodeAbsPositionOnCanvas = {x: node.metadata.position.x, y: node.metadata.position.y};
    // If this node is in a submachine, its metadata.position is relative to that submachine's host node.
    // We need a helper to get the absolute position of a node given its machineId and its relative pos.
    // This is complex. For now, let's simplify the drag offset for nodes in the main machine.
    // The recursive renderer will pass absolute positions.
    
    setDraggingNodeInfo({
      nodeId,
      machineId,
      startOffset: {
        x: svgClickPos.x - node.metadata.position.x,
        y: svgClickPos.y - node.metadata.position.y
      }
    });
    
    svgRef.current?.classList.add('cursor-grabbing');
    svgRef.current?.classList.remove('cursor-grab');

  }, [getSvgCoordinates, allMachines]);

  const handleTransitionMidpointMouseDown = useCallback((machineId: string, transitionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setHoveredTransitionDetails(null);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

    const machineInstance = allMachines[machineId];
    const transition = machineInstance?.transitions.find(t => t.id === transitionId);
    if (!transition) return;

    setDraggingTransitionInfo({
      id: transitionId,
      machineId,
      initialOffset: transition.metadata.midPointOffset || { x: 0, y: 0 },
      svgMouseAtDragStart: getSvgCoordinates(event.clientX, event.clientY),
      originalMidPointOffset: transition.metadata.midPointOffset || { x:0, y:0}
    });
    setDidDragTransitionMidpoint(false);
    svgRef.current?.classList.add('cursor-grabbing');
    svgRef.current?.classList.remove('cursor-grab');
  }, [allMachines, getSvgCoordinates]);


  const handleCanvasMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button !== 0 || draggingNodeInfo || draggingTransitionInfo || connectingState) return;
    
    const targetElement = event.target as SVGElement;
    if (targetElement.closest('.node-interactive-element') || targetElement.closest('[data-connection-side]')) {
        return;
    }
    onSelectComponent(null);
    setIsPanning(true);
    setLastMousePosition({x: event.clientX, y: event.clientY});
    svgRef.current?.classList.add('cursor-grabbing');
    svgRef.current?.classList.remove('cursor-grab');
  }, [draggingNodeInfo, draggingTransitionInfo, connectingState, onSelectComponent]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    const currentSvgMousePos = getSvgCoordinates(event.clientX, event.clientY);

    if (connectingState) {
      event.preventDefault();
      event.stopPropagation();
      onUpdateConnectingPreviewPoint(currentSvgMousePos);
      svgRef.current?.classList.add('cursor-crosshair');
    } else if (isPanning && lastMousePosition) {
      const dx = event.clientX - lastMousePosition.x;
      const dy = event.clientY - lastMousePosition.y;
      setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      setLastMousePosition({x: event.clientX, y: event.clientY});
      setHoveredTransitionDetails(null);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    } else if (draggingNodeInfo && draggingNodeInfo.startOffset) {
      event.preventDefault();
      event.stopPropagation();
      setHoveredTransitionDetails(null);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      
      const machineInstance = allMachines[draggingNodeInfo.machineId];
      const nodeBeingDragged = machineInstance?.nodes.find(n => n.id === draggingNodeInfo.nodeId);
      if (!nodeBeingDragged) return;

      const startSvgMousePosForNodeDrag = {
          x: nodeBeingDragged.metadata.position.x + draggingNodeInfo.startOffset.x,
          y: nodeBeingDragged.metadata.position.y + draggingNodeInfo.startOffset.y
      };
      if (!didDragNode && (Math.abs(currentSvgMousePos.x - startSvgMousePosForNodeDrag.x) > DRAG_THRESHOLD/transform.k || Math.abs(currentSvgMousePos.y - startSvgMousePosForNodeDrag.y) > DRAG_THRESHOLD/transform.k)) {
          setDidDragNode(true);
      }

      const newNodeX = currentSvgMousePos.x - draggingNodeInfo.startOffset.x;
      const newNodeY = currentSvgMousePos.y - draggingNodeInfo.startOffset.y;
      onNodePositionChange(draggingNodeInfo.nodeId, { x: newNodeX, y: newNodeY }, draggingNodeInfo.machineId);

    } else if (draggingTransitionInfo) {
      event.preventDefault();
      event.stopPropagation();
      setHoveredTransitionDetails(null);
       if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

      if (!didDragTransitionMidpoint && (Math.abs(currentSvgMousePos.x - draggingTransitionInfo.svgMouseAtDragStart.x) > DRAG_THRESHOLD/transform.k || Math.abs(currentSvgMousePos.y - draggingTransitionInfo.svgMouseAtDragStart.y) > DRAG_THRESHOLD/transform.k)) {
        setDidDragTransitionMidpoint(true);
      }
      
      const deltaX = currentSvgMousePos.x - draggingTransitionInfo.svgMouseAtDragStart.x;
      const deltaY = currentSvgMousePos.y - draggingTransitionInfo.svgMouseAtDragStart.y;
      
      const newOffset = {
        x: draggingTransitionInfo.initialOffset.x + deltaX,
        y: draggingTransitionInfo.initialOffset.y + deltaY,
      };

        onTransitionMidpointChange(draggingTransitionInfo.id, newOffset, undefined, draggingTransitionInfo.machineId);


    } else if (hoveredTransitionDetails) {
        setHoveredTransitionDetails(prev => prev ? ({...prev, screenPosition: {x: event.clientX, y: event.clientY}}) : null);
    }
  }, [getSvgCoordinates, connectingState, onUpdateConnectingPreviewPoint, isPanning, lastMousePosition, draggingNodeInfo, allMachines, transform.k, didDragNode, onNodePositionChange, draggingTransitionInfo, onTransitionMidpointChange, didDragTransitionMidpoint, hoveredTransitionDetails]);

  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    if (connectingState) {
        const targetElement = event.target as SVGElement;
        // Important: data-machine-id must be on the connection point element
        const connectionPointElement = targetElement.closest('[data-node-id][data-connection-side][data-machine-id]');

        if (connectionPointElement) {
            const targetNodeId = connectionPointElement.getAttribute('data-node-id');
            const targetSide = connectionPointElement.getAttribute('data-connection-side') as NodeConnectionSide;
            const targetMachineId = connectionPointElement.getAttribute('data-machine-id');
            
            const machineInstance = targetMachineId ? allMachines[targetMachineId] : null;
            const targetNode = machineInstance?.nodes.find(n => n.id === targetNodeId);

            if (targetMachineId && targetNodeId && targetSide && targetNode) {
                onCompleteNewTransition(targetMachineId, targetNodeId, targetSide);
            } else {
                onCancelNewTransition();
            }
        } else {
            onCancelNewTransition();
        }
        svgRef.current?.classList.remove('cursor-crosshair');
        svgRef.current?.classList.add('cursor-grab');
        return;
    }

    if (isPanning) {
      setIsPanning(false);
      setLastMousePosition(null);
    }
    if (draggingNodeInfo) {
      if (!didDragNode) {
          const machine = allMachines[draggingNodeInfo.machineId];
          const node = machine?.nodes.find(n => n.id === draggingNodeInfo.nodeId);
          if (node) onSelectComponent('node', node.id, draggingNodeInfo.machineId);
      }
      // Position change is already handled in mouseMove by calling onNodePositionChange
      setDraggingNodeInfo(null);
      setDidDragNode(false);
    }
    if (draggingTransitionInfo) {
      const machine = allMachines[draggingTransitionInfo.machineId];
      const transition = machine?.transitions.find(t => t.id === draggingTransitionInfo.id);
      if (transition) {
        if (!didDragTransitionMidpoint) {
            onSelectComponent('transition', transition.id, draggingTransitionInfo.machineId);
        } else {
            // The final state update with correct old offset for undo is triggered by onTransitionMidpointChange in mouseMove.
            // Here, we just ensure selection.
            onSelectComponent('transition', transition.id, draggingTransitionInfo.machineId);
        }
      }
      setDraggingTransitionInfo(null);
      setDidDragTransitionMidpoint(false);
    }
    svgRef.current?.classList.remove('cursor-grabbing', 'cursor-crosshair');
    svgRef.current?.classList.add('cursor-grab');
  }, [isPanning, draggingNodeInfo, didDragNode, allMachines, onSelectComponent, draggingTransitionInfo, didDragTransitionMidpoint, connectingState, onCompleteNewTransition, onCancelNewTransition]);
  
  const handleMouseLeave = useCallback(() => {
    if (isPanning || draggingNodeInfo || draggingTransitionInfo) {
        // Create a mock event or pass null if handleMouseUp can handle it.
        // For simplicity, if a drag is in progress and mouse leaves canvas, consider it ended.
        handleMouseUp({} as React.MouseEvent);
    }
     if (connectingState) {
        onCancelNewTransition();
        svgRef.current?.classList.remove('cursor-crosshair');
        svgRef.current?.classList.add('cursor-grab');
    }
    setHoveredTransitionDetails(null);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  },[isPanning, draggingNodeInfo, draggingTransitionInfo, handleMouseUp, connectingState, onCancelNewTransition]);


  const handleWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault();
    setHoveredTransitionDetails(null);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (!svgRef.current) return;
    
    const svgCoords = getSvgCoordinates(event.clientX, event.clientY);
    const delta = -event.deltaY * ZOOM_SENSITIVITY;
    let newScale = transform.k * (1 + delta);
    newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));

    const newX = svgCoords.x - (svgCoords.x - transform.x) * (newScale / transform.k);
    const newY = svgCoords.y - (svgCoords.y - transform.y) * (newScale / transform.k);
    
    setTransform({ x: newX, y: newY, k: newScale });
  }, [transform, getSvgCoordinates]);
  
  const zoom = useCallback((factor: number) => {
    if (!svgRef.current) return;
    setHoveredTransitionDetails(null);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const { width, height } = svgRef.current.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    const svgViewportCenterX = width / 2;
    const svgViewportCenterY = height / 2;
    const SvgPointAtViewportCenter = getSvgCoordinates(svgViewportCenterX, svgViewportCenterY);


    const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, transform.k * factor));
    
    const newX = SvgPointAtViewportCenter.x - (SvgPointAtViewportCenter.x - transform.x) * (newScale / transform.k);
    const newY = SvgPointAtViewportCenter.y - (SvgPointAtViewportCenter.y - transform.y) * (newScale / transform.k);

    setTransform({ x: newX, y: newY, k: newScale });
  }, [transform, getSvgCoordinates]);

  const getAllVisibleNodesWithPositions = useCallback((machine: StateMachine, currentOffsetX: number, currentOffsetY: number): { node: StateNode, absX: number, absY: number }[] => {
    let visibleNodes: { node: StateNode, absX: number, absY: number }[] = [];
    machine.nodes.forEach(node => {
      const absX = currentOffsetX + node.metadata.position.x;
      const absY = currentOffsetY + node.metadata.position.y;
      visibleNodes.push({ node, absX, absY });

      if (node.type === NodeType.Hierarchical && node.metadata.isExpanded && node.subMachineId) {
        const subMachine = allMachines[node.subMachineId];
        if (subMachine) {
          const subMachineNodes = getAllVisibleNodesWithPositions(
            subMachine,
            absX + HIERARCHICAL_NODE_PADDING, // Offset for sub-machine content
            // Fix: Use imported NODE_HEADER_HEIGHT
            absY + NODE_HEADER_HEIGHT + HIERARCHICAL_NODE_PADDING
          );
          visibleNodes = visibleNodes.concat(subMachineNodes);
        }
      }
    });
    return visibleNodes;
  }, [allMachines]);


  const zoomToFit = useCallback(() => {
    if (!svgRef.current || !activeTopLevelMachine) return;
    setHoveredTransitionDetails(null);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

    const { width: svgWidth, height: svgHeight } = svgRef.current.getBoundingClientRect();
    if (svgWidth === 0 || svgHeight === 0) return;

    const allNodesWithAbsPos = getAllVisibleNodesWithPositions(activeTopLevelMachine, 0, 0);
    if (allNodesWithAbsPos.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    allNodesWithAbsPos.forEach(({ node, absX, absY }) => {
      const nodeWidth = node.metadata.size?.width || DEFAULT_NODE_WIDTH;
      const nodeHeight = node.metadata.size?.height || DEFAULT_NODE_HEIGHT;
      minX = Math.min(minX, absX);
      minY = Math.min(minY, absY);
      maxX = Math.max(maxX, absX + nodeWidth);
      maxY = Math.max(maxY, absY + nodeHeight);
    });
    
    if (minX === Infinity) return;

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const padding = 50;

    if (contentWidth === 0 || contentHeight === 0) {
        const newScale = 1;
        const targetX = (svgWidth / 2) - ((minX + contentWidth / 2) * newScale) + padding; // Adjust for padding
        const targetY = (svgHeight / 2) - ((minY + contentHeight / 2) * newScale) + padding;
        setTransform({ x: targetX, y: targetY, k: newScale});
        return;
    }
    
    const scaleX = (svgWidth - 2 * padding) / contentWidth;
    const scaleY = (svgHeight - 2 * padding) / contentHeight;
    const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(scaleX, scaleY, MAX_ZOOM)));

    const newX = (svgWidth - contentWidth * newScale) / 2 - minX * newScale;
    const newY = (svgHeight - contentHeight * newScale) / 2 - minY * newScale;

    setTransform({ x: newX, y: newY, k: newScale });
  }, [activeTopLevelMachine, getAllVisibleNodesWithPositions]);


  useLayoutEffect(() => {
    const SvgElement = svgRef.current;
    if (!SvgElement) return;
    let animationFrameId: number | null = null;
    const setupViewBoxAndFit = () => {
        const { width, height } = SvgElement.getBoundingClientRect();
        if (width > 0 && height > 0) {
            setViewBox(`0 0 ${width} ${height}`);
            zoomToFit();
        } else {
            animationFrameId = requestAnimationFrame(setupViewBoxAndFit);
        }
    };
    setupViewBoxAndFit();
    const handleResize = () => {
      const { width, height } = SvgElement.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setViewBox(`0 0 ${width} ${height}`);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [zoomToFit]);

  useEffect(() => {
    if (svgRef.current && svgRef.current.getBoundingClientRect().width > 0) {
        zoomToFit();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMachineId, activeTopLevelMachine?.nodes.length]); // Depends on top level machine


  const handleTransitionMouseEnter = (machineId: string, transition: Transition, event: React.MouseEvent) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if(connectingState || draggingNodeInfo || draggingTransitionInfo || isPanning) return;

    hoverTimeoutRef.current = window.setTimeout(() => {
      const machineInstance = allMachines[machineId];
      if (!machineInstance) return;
      const fromNode = machineInstance.nodes.find(n => n.id === transition.fromNodeId);
      const toNode = machineInstance.nodes.find(n => n.id === transition.toNodeId);
      if (fromNode && toNode) {
        setHoveredTransitionDetails({
          machineId,
          transition,
          fromNodeTitle: fromNode.title,
          toNodeTitle: toNode.title,
          screenPosition: { x: event.clientX, y: event.clientY },
        });
      }
    }, 150);
  };

  const handleTransitionMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredTransitionDetails(null);
  };
  
  const handleTransitionContextMenu = (machineId: string, transitionId: string, event: React.MouseEvent) => {
    event.preventDefault();
    onOpenTransitionContextMenu(transitionId, machineId, { x: event.clientX, y: event.clientY });
  };

  let previewLineStartPoint: Point | null = null;
  if (connectingState) {
    const sourceMachine = allMachines[connectingState.sourceMachineId];
    const sourceNode = sourceMachine?.nodes.find(n => n.id === connectingState.fromNodeId);
    if (sourceNode) {
        // To get the absolute preview line start, need to find sourceNode's absolute position
        // This requires iterating similar to renderMachineRecursive or passing it down.
        // For now, assume preview is relative to the machine where connection started.
        // This will be incorrect if connection starts in a sub-machine displayed offset.
        // TODO: Fix previewLineStartPoint for nested machines.
        // For now, this will only work correctly for connections in the top-level active machine.
        let nodeGlobalOffsetX = 0;
        let nodeGlobalOffsetY = 0;
        // If connectingState.sourceMachineId is not activeMachineId, need to find its offset
        if (connectingState.sourceMachineId !== activeMachineId) {
          // This is complex: find path from activeMachine to connectingState.sourceMachineId
          // and sum up HIERARCHICAL_NODE_PADDING and NODE_HEADER_HEIGHT
        }
        previewLineStartPoint = getEdgePointForPreview(sourceNode, connectingState.fromNodeSide, connectingState.previewEndPoint, nodeGlobalOffsetX, nodeGlobalOffsetY);
    }
  }
  
  const renderMachineRecursive = (
    machineToRender: StateMachine,
    currentMachineId: string,
    offsetX: number,
    offsetY: number,
    depth: number
  ): React.ReactNode[] => {
    if (depth > 5) return []; // Max recursion depth

    const elements: React.ReactNode[] = [];

    // Render transitions for the current machine
    machineToRender.transitions.forEach(transition => {
      const fromNode = machineToRender.nodes.find(n => n.id === transition.fromNodeId);
      const toNode = machineToRender.nodes.find(n => n.id === transition.toNodeId);
      const isSelected = selectedComponent?.type === 'transition' && selectedComponent?.id === transition.id && selectedComponent.machineId === currentMachineId;
      
      if (fromNode && toNode) {
        // Create copies of nodes with positions adjusted by current offset for TransitionLineDisplay
        const fromNodeAbs: StateNode = { ...fromNode, metadata: { ...fromNode.metadata, position: { x: fromNode.metadata.position.x + offsetX, y: fromNode.metadata.position.y + offsetY }}};
        const toNodeAbs: StateNode = { ...toNode, metadata: { ...toNode.metadata, position: { x: toNode.metadata.position.x + offsetX, y: toNode.metadata.position.y + offsetY }}};
        
        elements.push(
          <TransitionLineDisplay
            key={`${currentMachineId}-${transition.id}`}
            transition={transition}
            fromNode={fromNodeAbs}
            toNode={toNodeAbs}
            isSelected={isSelected}
            onMidpointMouseDown={(event) => handleTransitionMidpointMouseDown(currentMachineId, transition.id, event)}
            onMouseEnterLine={(event) => handleTransitionMouseEnter(currentMachineId, transition, event)}
            onMouseLeaveLine={handleTransitionMouseLeave}
            onContextMenuRequested={(event) => handleTransitionContextMenu(currentMachineId, transition.id, event)}
            onDoubleClick={() => onOpenTransitionModal(transition, currentMachineId)}
          />
        );
      }
    });

    // Render nodes for the current machine
    machineToRender.nodes.forEach(node => {
      const isSelected = selectedComponent?.type === 'node' && selectedComponent?.id === node.id && selectedComponent.machineId === currentMachineId;
      const nodeAbsX = node.metadata.position.x + offsetX;
      const nodeAbsY = node.metadata.position.y + offsetY;
      
      elements.push(
        <StateNodeDisplay
          key={`${currentMachineId}-${node.id}`}
          node={{...node, metadata: {...node.metadata, position: {x: nodeAbsX, y: nodeAbsY }}}} // Pass node with absolute position for rendering
          scale={transform.k}
          isSelected={isSelected}
          onClick={() => { /* Click handled by mouseUp on node after drag check */ }}
          onToggleExpand={node.type === NodeType.Hierarchical ? () => onNodeToggleExpand(node.id, currentMachineId) : undefined}
          onNodeMouseDown={(event) => handleNodeMouseDown(currentMachineId, node.id, event)}
          onConnectionPointMouseDown={(originalNodeId, side, event) => handleConnectionPointMouseDown(currentMachineId, originalNodeId, side, event)}
          // Pass machineId to connection point data attributes
          machineId={currentMachineId}
        />
      );

      // If hierarchical and expanded, render sub-machine
      if (node.type === NodeType.Hierarchical && node.metadata.isExpanded && node.subMachineId) {
        const subMachine = allMachines[node.subMachineId];
        if (subMachine) {
          const subMachineOffsetX = nodeAbsX + HIERARCHICAL_NODE_PADDING;
          // Fix: Use imported NODE_HEADER_HEIGHT
          const subMachineOffsetY = nodeAbsY + NODE_HEADER_HEIGHT + HIERARCHICAL_NODE_PADDING;
          elements.push(...renderMachineRecursive(subMachine, node.subMachineId, subMachineOffsetX, subMachineOffsetY, depth + 1));
        }
      }
    });
    return elements;
  };


  return (
    <div className="flex-1 bg-white dark:bg-slate-800 relative overflow-hidden cursor-grab"
         onMouseLeave={handleMouseLeave}
         onClick={(e) => {
            if (e.target === e.currentTarget) {
                onSelectComponent(null);
            }
         }}
    >
      <button
        onClick={onOpenAddNodeModalRequest}
        className="absolute top-4 left-4 z-10 p-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500"
        title="Add New State Node to Active Machine"
      >
        <PlusIcon className="w-6 h-6" />
      </button>
      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox={viewBox}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          <marker
            id="arrowhead"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-slate-600 dark:fill-slate-400" />
          </marker>
           <marker
            id="arrowhead-selected"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-indigo-500 dark:fill-indigo-400" />
          </marker>
        </defs>
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          {activeTopLevelMachine && renderMachineRecursive(activeTopLevelMachine, activeMachineId, 0, 0, 0)}
          
          {connectingState && previewLineStartPoint && (
            <line
                x1={previewLineStartPoint.x}
                y1={previewLineStartPoint.y}
                x2={connectingState.previewEndPoint.x}
                y2={connectingState.previewEndPoint.y}
                className="stroke-indigo-500 dark:stroke-indigo-400 stroke-dasharray-4"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
            />
          )}
        </g>
      </svg>
      <div className="absolute top-4 right-4 flex flex-col space-y-2 z-10">
        <button onClick={() => zoom(1.2)} className="p-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded text-slate-700 dark:text-slate-200 shadow" title="Zoom In"><ZoomInIcon className="w-5 h-5"/></button>
        <button onClick={() => zoom(0.8)} className="p-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded text-slate-700 dark:text-slate-200 shadow" title="Zoom Out"><ZoomOutIcon className="w-5 h-5"/></button>
        <button onClick={zoomToFit} className="p-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded text-slate-700 dark:text-slate-200 shadow" title="Zoom to Fit"><FitToScreenIcon className="w-5 h-5"/></button>
      </div>
      {hoveredTransitionDetails && (
        <TransitionTooltip
          details={hoveredTransitionDetails}
          position={hoveredTransitionDetails.screenPosition}
        />
      )}
    </div>
  );
};
