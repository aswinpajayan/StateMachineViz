
import React, { useState, useCallback, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { SideBar } from './components/SideBar';
import { CanvasArea } from './components/CanvasArea';
import { Modal } from './components/Modal';
import { ContextMenu } from './components/ContextMenu';
import { TrashIcon, ArrowRightIcon, PlusIcon, XIcon } from './components/icons/ActionIcons'; // Added PlusIcon, XIcon
import { StateMachine, StateNode, Transition, HierarchicalItem, VariableType, Variable, Point, NodeType, NodeUIMetadata, TransitionUIMetadata, NodeConnectionSide, ConnectingState, SelectedComponent, UndoRedoAction } from './types';
import { useToast } from './contexts/ToastContext';
import { assignNodeSizes } from './constants';
import { mainSystemControllerMachine, missionLogicSubMachine } from './default-state-machine';

const initialDefaultMachines: StateMachine[] = [mainSystemControllerMachine, missionLogicSubMachine];

const MAX_UNDO_STACK_SIZE = 50;
const NODE_CONNECTION_SIDES: NodeConnectionSide[] = ['top', 'bottom', 'left', 'right'];
const VARIABLE_TYPES_OPTIONS = [
    { label: 'Input', value: VariableType.Input },
    { label: 'Output', value: VariableType.Output },
    { label: 'Intermediate', value: VariableType.Intermediate },
];
const NODE_TYPE_OPTIONS = [
    { label: 'Simple', value: NodeType.Simple },
    { label: 'Hierarchical', value: NodeType.Hierarchical },
];


const buildSidebarHierarchy = (machines: Record<string, StateMachine>): HierarchicalItem[] => {
  if (!machines || Object.keys(machines).length === 0) {
    return [];
  }
  const hierarchy: HierarchicalItem[] = [];

  Object.values(machines).forEach(machine => {
    const nodeItems: HierarchicalItem[] = machine.nodes.map(node => {
      const nodeDirectChildren: HierarchicalItem[] = [];
      
      if (node.inputs && node.inputs.length > 0) {
        node.inputs.forEach(inputName => {
          nodeDirectChildren.push({
            id: `${machine.id}-${node.id}-input-${inputName}`,
            name: inputName,
            type: 'variable' as 'variable',
            variableType: VariableType.Input,
          });
        });
      }

      if (node.outputs && node.outputs.length > 0) {
        node.outputs.forEach(outputName => {
          nodeDirectChildren.push({
            id: `${machine.id}-${node.id}-output-${outputName}`,
            name: outputName,
            type: 'variable' as 'variable',
            variableType: VariableType.Output,
          });
        });
      }

      return {
        id: `${machine.id}-node-${node.id}`,
        name: node.title,
        type: 'node' as 'node',
        nodeType: node.type,
        children: nodeDirectChildren.length > 0 ? nodeDirectChildren : undefined,
      };
    });

    const machineVariablesGroupChildren: HierarchicalItem[] = [];
    if (machine.variables) {
        Object.entries(machine.variables).sort(([nameA], [nameB]) => nameA.localeCompare(nameB)).forEach(([varName, variable]) => {
            machineVariablesGroupChildren.push({
                id: `${machine.id}-var-${varName}`,
                name: varName,
                type: 'variable' as 'variable',
                variableType: variable.type,
            });
        });
    }
    
    const machineChildren: HierarchicalItem[] = [...nodeItems];
    if (machineVariablesGroupChildren.length > 0 || true) {
      machineChildren.push({
        id: `${machine.id}-machine-variables`,
        name: 'Variables',
        type: 'variable_group' as 'variable_group',
        isMachineVariablesGroup: true,
        children: machineVariablesGroupChildren.length > 0 ? machineVariablesGroupChildren : undefined,
      });
    }


    hierarchy.push({
      id: machine.id,
      name: machine.name,
      type: 'machine' as 'machine',
      children: machineChildren.length > 0 ? machineChildren : undefined,
    });
  });
  
  return hierarchy;
};


const generateUniqueId = (prefix: string = 'id-') => {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const App: React.FC = () => {
  const [allMachines, setAllMachines] = useState<Record<string, StateMachine>>(() => {
    const machinesRecord: Record<string, StateMachine> = {};
    initialDefaultMachines.forEach(machine => {
      const processedNodes = machine.nodes.map(n => ({
        ...n,
        metadata: {
          position: n.metadata?.position || { x:0, y:0 },
          isExpanded: n.metadata?.isExpanded || false,
          size: n.metadata?.size
        } as NodeUIMetadata,
      }));
      
      machinesRecord[machine.id] = {
        ...machine,
        nodes: assignNodeSizes(processedNodes),
        transitions: machine.transitions.map(t => ({
          ...t,
          metadata: {
            midPointOffset: t.metadata?.midPointOffset || { x: 0, y: 0},
            fromNodeSide: t.metadata?.fromNodeSide || 'bottom',
            toNodeSide: t.metadata?.toNodeSide || 'top',
          } as TransitionUIMetadata,
        })),
        variables: machine.variables || {},
      };
    });
    return machinesRecord;
  });

  const [activeMachineId, setActiveMachineId] = useState<string>(() => {
    return initialDefaultMachines[0]?.id || '';
  });

  const [sidebarHierarchy, setSidebarHierarchy] = useState<HierarchicalItem[]>([]);
  const [selectedModalTransition, setSelectedModalTransition] = useState<{transition: Transition, machineId: string} | null>(null);
  const [currentRulesInput, setCurrentRulesInput] = useState<string>('');
  const [editableTransitionFromSide, setEditableTransitionFromSide] = useState<NodeConnectionSide | undefined>(undefined);
  const [editableTransitionToSide, setEditableTransitionToSide] = useState<NodeConnectionSide | undefined>(undefined);
  const { addToast } = useToast();

  const [connectingState, setConnectingState] = useState<ConnectingState | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<SelectedComponent | null>(null);
  const [contextMenuInfo, setContextMenuInfo] = useState<{transitionId: string, machineId: string, position: Point} | null>(null);

  const [undoStack, setUndoStack] = useState<UndoRedoAction[]>([]);
  const [redoStack, setRedoStack] = useState<UndoRedoAction[]>([]);
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [isAddVariableModalOpen, setIsAddVariableModalOpen] = useState(false);
  const [newVariableName, setNewVariableName] = useState('');
  const [newVariableType, setNewVariableType] = useState<VariableType | ''>('');
  const [targetMachineIdForNewVariable, setTargetMachineIdForNewVariable] = useState<string | null>(null);

  // State for "Add Node" Modal
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeType, setNewNodeType] = useState<NodeType | ''>('');
  const [newNodeSelectedMachineVariables, setNewNodeSelectedMachineVariables] = useState<string[]>([]);
  const [showAddNodeVariableSelector, setShowAddNodeVariableSelector] = useState(false);
  const [targetMachineIdForNewNode, setTargetMachineIdForNewNode] = useState<string | null>(null);
  const [variableToAddFromMachine, setVariableToAddFromMachine] = useState<string>('');


  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  const pushToUndoStack = useCallback((action: UndoRedoAction) => {
    setUndoStack(prev => {
      const newStack = [...prev, action];
      if (newStack.length > MAX_UNDO_STACK_SIZE) {
        return newStack.slice(newStack.length - MAX_UNDO_STACK_SIZE);
      }
      return newStack;
    });
    setRedoStack([]);
  }, []);


  useEffect(() => {
    if (Object.keys(allMachines).length === 0 && initialDefaultMachines.length > 0) {
      addToast('No default state machines found to initialize.', 'warning');
    } else if (Object.keys(allMachines).length === 0 && initialDefaultMachines.length === 0) {
      addToast('Application started with no default machines defined.', 'info');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSidebarHierarchy(buildSidebarHierarchy(allMachines));

    const machineKeys = Object.keys(allMachines);
    if (machineKeys.length > 0) {
      if (!activeMachineId || !allMachines[activeMachineId]) {
        setActiveMachineId(machineKeys[0]);
      }
    } else {
      setActiveMachineId('');
    }
  }, [allMachines, activeMachineId]);


  useEffect(() => {
    if (selectedModalTransition) {
      setCurrentRulesInput(selectedModalTransition.transition.rules || '');
      setEditableTransitionFromSide(selectedModalTransition.transition.metadata.fromNodeSide || 'bottom');
      setEditableTransitionToSide(selectedModalTransition.transition.metadata.toNodeSide || 'top');
    } else {
      setCurrentRulesInput('');
      setEditableTransitionFromSide(undefined);
      setEditableTransitionToSide(undefined);
    }
  }, [selectedModalTransition]);

  const activeMachine = allMachines[activeMachineId];

  const handleSelectComponent = useCallback((type: 'node' | 'transition' | null, id?: string, machineId?: string) => {
    if (type && id && machineId) {
      setSelectedComponent({ type, id, machineId });
    } else {
      setSelectedComponent(null);
    }
    setContextMenuInfo(null);
  }, []);
  
  const handleOpenTransitionModal = useCallback((transition: Transition, targetMachineId: string) => {
    setSelectedModalTransition({transition, machineId: targetMachineId});
    handleSelectComponent('transition', transition.id, targetMachineId);
  }, [handleSelectComponent]);


  const handleStartTransitionCreation = useCallback((sourceMachineId: string, sourceNodeId: string, sourceSide: NodeConnectionSide, previewStartPoint: Point) => {
    setConnectingState({
      sourceMachineId,
      fromNodeId: sourceNodeId,
      fromNodeSide: sourceSide,
      previewEndPoint: previewStartPoint,
    });
    handleSelectComponent(null);
  }, [handleSelectComponent]);

  const handleUpdateConnectingPreviewPoint = useCallback((point: Point) => {
    setConnectingState(prev => prev ? { ...prev, previewEndPoint: point } : null);
  }, []);
  
  const handleCompleteNewTransition = useCallback((targetMachineId: string, targetNodeId: string, targetSide: NodeConnectionSide) => {
    if (!connectingState) return;
    if (connectingState.sourceMachineId !== targetMachineId) {
        addToast('Transitions can only be made within the same machine or sub-machine view.', 'warning');
        setConnectingState(null);
        return;
    }

    const newTransition: Transition = {
      id: generateUniqueId('t-'),
      fromNodeId: connectingState.fromNodeId,
      toNodeId: targetNodeId,
      rules: '',
      metadata: {
        fromNodeSide: connectingState.fromNodeSide,
        toNodeSide: targetSide,
        midPointOffset: { x: 0, y: 0 },
      },
    };

    pushToUndoStack({ type: 'CREATE_TRANSITION', machineId: targetMachineId, transition: newTransition });

    setAllMachines(prevMachines => {
      const machineToUpdate = { ...prevMachines[targetMachineId] };
      if (!machineToUpdate) return prevMachines;
      machineToUpdate.transitions = [...machineToUpdate.transitions, newTransition];
      return { ...prevMachines, [targetMachineId]: machineToUpdate };
    });

    setSelectedModalTransition({transition: newTransition, machineId: targetMachineId});
    handleSelectComponent('transition', newTransition.id, targetMachineId);
    setConnectingState(null);
    addToast('Transition created. Define its rules.', 'success');
  }, [connectingState, addToast, handleSelectComponent, pushToUndoStack]);

  const handleCancelNewTransition = useCallback(() => {
    setConnectingState(null);
    addToast('Transition creation cancelled.', 'info');
  }, [addToast]);


  const handleSaveTransitionRules = useCallback(() => {
    if (!selectedModalTransition || editableTransitionFromSide === undefined || editableTransitionToSide === undefined ) return;

    const { transition: currentTransition, machineId: targetMachineId } = selectedModalTransition;
    const machine = allMachines[targetMachineId];
    const oldTransition = machine?.transitions.find(t => t.id === currentTransition.id);
    if (!oldTransition) return;

    const newTransitionData = {
      rules: currentRulesInput,
      metadata: {
        ...currentTransition.metadata,
        fromNodeSide: editableTransitionFromSide,
        toNodeSide: editableTransitionToSide,
      }
    };
    
    pushToUndoStack({
        type: 'UPDATE_TRANSITION_DETAILS',
        machineId: targetMachineId,
        transitionId: currentTransition.id,
        oldRules: oldTransition.rules,
        newRules: newTransitionData.rules,
        oldFromSide: oldTransition.metadata.fromNodeSide,
        newFromSide: newTransitionData.metadata.fromNodeSide,
        oldToSide: oldTransition.metadata.toNodeSide,
        newToSide: newTransitionData.metadata.toNodeSide,
        oldMidPointOffset: oldTransition.metadata.midPointOffset,
        newMidPointOffset: currentTransition.metadata.midPointOffset,
    });
    
    setAllMachines(prevMachines => {
        const machineToUpdate = { ...prevMachines[targetMachineId] };
        if (!machineToUpdate) return prevMachines;
        machineToUpdate.transitions = machineToUpdate.transitions.map(t =>
            t.id === currentTransition.id ? { ...t, ...newTransitionData } : t
        );
        return { ...prevMachines, [targetMachineId]: machineToUpdate };
    });
    addToast('Transition details saved.', 'success');
    setSelectedModalTransition(prev => prev ? { ...prev, transition: {...prev.transition, ...newTransitionData}} : null);
  }, [selectedModalTransition, currentRulesInput, addToast, allMachines, editableTransitionFromSide, editableTransitionToSide, pushToUndoStack]);

  const handleDeleteNode = useCallback((nodeId: string, targetMachineId: string) => {
    const machine = allMachines[targetMachineId];
    const nodeToDelete = machine?.nodes.find(n => n.id === nodeId);
    if (!nodeToDelete) return;

    const connectedTransitions = machine.transitions.filter(
      t => t.fromNodeId === nodeId || t.toNodeId === nodeId
    );
    
    pushToUndoStack({ type: 'DELETE_NODE', machineId: targetMachineId, node: nodeToDelete, connectedTransitions });

    setAllMachines(prev => {
      const updatedMachine = { ...prev[targetMachineId] };
      if (!updatedMachine) return prev;
      updatedMachine.nodes = updatedMachine.nodes.filter(n => n.id !== nodeId);
      updatedMachine.transitions = updatedMachine.transitions.filter(
        t => t.fromNodeId !== nodeId && t.toNodeId !== nodeId
      );
      return { ...prev, [targetMachineId]: updatedMachine };
    });
    addToast(`Node and connected transitions deleted.`, 'success');
    handleSelectComponent(null);
  }, [allMachines, addToast, handleSelectComponent, pushToUndoStack]);

  const handleDeleteTransition = useCallback((transitionId: string, targetMachineId: string) => {
    const machine = allMachines[targetMachineId];
    const transitionToDelete = machine?.transitions.find(t => t.id === transitionId);
    if (!transitionToDelete) return;

    pushToUndoStack({ type: 'DELETE_TRANSITION', machineId: targetMachineId, transition: transitionToDelete });

    setAllMachines(prev => {
      const updatedMachine = { ...prev[targetMachineId] };
      if (!updatedMachine) return prev;
      updatedMachine.transitions = updatedMachine.transitions.filter(t => t.id !== transitionId);
      return { ...prev, [targetMachineId]: updatedMachine };
    });
    addToast('Transition deleted.', 'success');
    handleSelectComponent(null);
    setContextMenuInfo(null);
  }, [allMachines, addToast, handleSelectComponent, pushToUndoStack]);

  const handleOpenTransitionContextMenu = useCallback((transitionId: string, machineId: string, position: Point) => {
    setContextMenuInfo({transitionId, machineId, position});
    handleSelectComponent('transition', transitionId, machineId);
  }, [handleSelectComponent]);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenuInfo(null);
  }, []);

  const handleOpenAddVariableModal = useCallback((machineId: string) => {
    setTargetMachineIdForNewVariable(machineId);
    setNewVariableName('');
    setNewVariableType('');
    setIsAddVariableModalOpen(true);
  }, []);

  const handleCloseAddVariableModal = useCallback(() => {
    setIsAddVariableModalOpen(false);
    setTargetMachineIdForNewVariable(null);
    setNewVariableName('');
  }, []);

  const handleSaveNewVariable = useCallback(() => {
    if (!targetMachineIdForNewVariable || !newVariableName.trim()) {
      addToast('Variable name cannot be empty.', 'error');
      return;
    }
    if (newVariableType === '') {
        addToast('Please select a variable type.', 'error');
        return;
    }
    const machine = allMachines[targetMachineIdForNewVariable];
    if (!machine) {
      addToast('Target machine not found.', 'error');
      return;
    }
    if (machine.variables && machine.variables[newVariableName.trim()]) {
      addToast(`Variable "${newVariableName.trim()}" already exists in this machine.`, 'error');
      return;
    }

    const newVariable: Variable = { type: newVariableType as VariableType };
    const variableName = newVariableName.trim();

    pushToUndoStack({ type: 'ADD_MACHINE_VARIABLE', machineId: targetMachineIdForNewVariable, variableName, variable: newVariable });

    setAllMachines(prev => {
      const updatedMachine = { ...prev[targetMachineIdForNewVariable] };
      updatedMachine.variables = { ...(updatedMachine.variables || {}), [variableName]: newVariable };
      return { ...prev, [targetMachineIdForNewVariable]: updatedMachine };
    });

    addToast(`Variable "${variableName}" added.`, 'success');
    handleCloseAddVariableModal();
  }, [targetMachineIdForNewVariable, newVariableName, newVariableType, allMachines, addToast, pushToUndoStack, handleCloseAddVariableModal]);

  // "Add Node" Modal Handlers
  const handleOpenAddNodeModal = useCallback((machineId: string) => {
    setTargetMachineIdForNewNode(machineId);
    setNewNodeName('');
    setNewNodeType('');
    setNewNodeSelectedMachineVariables([]);
    setShowAddNodeVariableSelector(false);
    setVariableToAddFromMachine('');
    setIsAddNodeModalOpen(true);
  }, []);

  const handleCloseAddNodeModal = useCallback(() => {
    setIsAddNodeModalOpen(false);
    setTargetMachineIdForNewNode(null);
  }, []);

  const handleSaveNewNode = useCallback(() => {
    if (!targetMachineIdForNewNode) {
        addToast('Target machine not specified for new node.', 'error');
        return;
    }
    if (!newNodeName.trim()) {
      addToast('Node name cannot be empty.', 'error');
      return;
    }
    if (newNodeType === '') {
      addToast('Please select a node type.', 'error');
      return;
    }
    
    const machine = allMachines[targetMachineIdForNewNode];
    if (!machine) {
      addToast('Target machine not found.', 'error');
      return;
    }

    const tempNewNode: Omit<StateNode, 'metadata'> & { metadata: Partial<NodeUIMetadata> } = { // Use partial metadata for assignNodeSizes
      id: generateUniqueId('node-'),
      title: newNodeName.trim(),
      type: newNodeType as NodeType,
      inputs: [...newNodeSelectedMachineVariables], // Assign selected machine vars as inputs
      outputs: [], // Default empty outputs
      metadata: {
        position: { x: 50, y: 50 }, // Default position
        isExpanded: false,
      },
    };
    
    // Use assignNodeSizes to get the correct size for the new node
    const sizedNewNode = assignNodeSizes([tempNewNode as StateNode])[0]; // Cast to StateNode for assignNodeSizes

    pushToUndoStack({ type: 'CREATE_NODE', machineId: targetMachineIdForNewNode, node: sizedNewNode });

    setAllMachines(prev => {
      const updatedMachine = { ...prev[targetMachineIdForNewNode] };
      updatedMachine.nodes = [...updatedMachine.nodes, sizedNewNode];
      return { ...prev, [targetMachineIdForNewNode]: updatedMachine };
    });

    addToast(`Node "${sizedNewNode.title}" added.`, 'success');
    handleCloseAddNodeModal();
  }, [targetMachineIdForNewNode, newNodeName, newNodeType, newNodeSelectedMachineVariables, allMachines, addToast, pushToUndoStack, handleCloseAddNodeModal]);

  const handleToggleAddNodeVariableSelector = useCallback(() => {
    setShowAddNodeVariableSelector(prev => !prev);
  }, []);

  const handleAddVariableToNewNodeList = useCallback(() => {
    if (variableToAddFromMachine && !newNodeSelectedMachineVariables.includes(variableToAddFromMachine)) {
      setNewNodeSelectedMachineVariables(prev => [...prev, variableToAddFromMachine]);
      setVariableToAddFromMachine(''); // Reset dropdown after adding
    }
  }, [variableToAddFromMachine, newNodeSelectedMachineVariables]);

  const handleRemoveVariableFromNewNodeList = useCallback((variableNameToRemove: string) => {
    setNewNodeSelectedMachineVariables(prev => prev.filter(v => v !== variableNameToRemove));
  }, []);

  const handleRequestOpenAddNodeModalForActiveMachine = useCallback(() => {
    if (activeMachineId) {
      handleOpenAddNodeModal(activeMachineId);
    } else {
      addToast('No active machine selected to add a node to.', 'warning');
    }
  }, [activeMachineId, handleOpenAddNodeModal, addToast]);


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selectedModalTransition || contextMenuInfo || isAddVariableModalOpen || isAddNodeModalOpen || document.activeElement instanceof HTMLTextAreaElement || document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLSelectElement) return;

      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedComponent) {
        event.preventDefault();
        if (selectedComponent.type === 'node') {
          handleDeleteNode(selectedComponent.id, selectedComponent.machineId);
        } else if (selectedComponent.type === 'transition') {
          handleDeleteTransition(selectedComponent.id, selectedComponent.machineId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedComponent, handleDeleteNode, handleDeleteTransition, selectedModalTransition, contextMenuInfo, isAddVariableModalOpen, isAddNodeModalOpen]);
  
   useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuInfo) {
        const contextMenuElement = document.getElementById('custom-context-menu');
        if (contextMenuElement && !contextMenuElement.contains(event.target as Node)) {
          handleCloseContextMenu();
        } else if (!contextMenuElement) {
            handleCloseContextMenu();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenuInfo, handleCloseContextMenu]);


  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;

    const lastAction = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [lastAction, ...prev]);

    setAllMachines(prevMachines => {
      const machineToUpdate = { ...prevMachines[lastAction.machineId] };
      if (!machineToUpdate) return prevMachines;

      switch (lastAction.type) {
        case 'CREATE_NODE':
          machineToUpdate.nodes = machineToUpdate.nodes.filter(n => n.id !== lastAction.node.id);
          break;
        case 'DELETE_NODE':
          machineToUpdate.nodes = [...machineToUpdate.nodes, lastAction.node];
          machineToUpdate.transitions = [...machineToUpdate.transitions, ...lastAction.connectedTransitions];
          break;
        case 'CREATE_TRANSITION':
          machineToUpdate.transitions = machineToUpdate.transitions.filter(t => t.id !== lastAction.transition.id);
          break;
        case 'DELETE_TRANSITION':
          machineToUpdate.transitions = [...machineToUpdate.transitions, lastAction.transition];
          break;
        case 'UPDATE_TRANSITION_DETAILS':
          machineToUpdate.transitions = machineToUpdate.transitions.map(t => {
            if (t.id === lastAction.transitionId) {
              return {
                ...t,
                rules: lastAction.oldRules,
                metadata: {
                  ...t.metadata,
                  fromNodeSide: lastAction.oldFromSide,
                  toNodeSide: lastAction.oldToSide,
                  midPointOffset: lastAction.oldMidPointOffset,
                }
              };
            }
            return t;
          });
          break;
        case 'UPDATE_NODE_EXPANSION':
          machineToUpdate.nodes = machineToUpdate.nodes.map(n => {
            if (n.id === lastAction.nodeId) {
              return { ...n, metadata: { ...n.metadata, isExpanded: lastAction.oldIsExpanded } };
            }
            return n;
          });
          break;
        case 'ADD_MACHINE_VARIABLE':
          {
            const updatedVars = { ...(machineToUpdate.variables || {}) };
            delete updatedVars[lastAction.variableName];
            machineToUpdate.variables = updatedVars;
          }
          break;
        case 'DELETE_MACHINE_VARIABLE':
          machineToUpdate.variables = { ...(machineToUpdate.variables || {}), [lastAction.variableName]: lastAction.variable };
          break;
      }
      return { ...prevMachines, [lastAction.machineId]: machineToUpdate };
    });
    handleSelectComponent(null);
    addToast(`Undo: ${lastAction.type.toLowerCase().replace(/_/g, ' ')}`, 'info');
  }, [undoStack, addToast, handleSelectComponent]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;

    const actionToRedo = redoStack[0];
    setRedoStack(prev => prev.slice(1));
    setUndoStack(prev => [...prev, actionToRedo]);

    setAllMachines(prevMachines => {
      const machineToUpdate = { ...prevMachines[actionToRedo.machineId] };
      if (!machineToUpdate) return prevMachines;
      
      switch (actionToRedo.type) {
        case 'CREATE_NODE':
          machineToUpdate.nodes = [...machineToUpdate.nodes, actionToRedo.node];
          break;
        case 'DELETE_NODE':
          machineToUpdate.nodes = machineToUpdate.nodes.filter(n => n.id !== actionToRedo.node.id);
          machineToUpdate.transitions = machineToUpdate.transitions.filter(
            t => t.fromNodeId !== actionToRedo.node.id && t.toNodeId !== actionToRedo.node.id
          );
          break;
        case 'CREATE_TRANSITION':
          machineToUpdate.transitions = [...machineToUpdate.transitions, actionToRedo.transition];
          break;
        case 'DELETE_TRANSITION':
          machineToUpdate.transitions = machineToUpdate.transitions.filter(t => t.id !== actionToRedo.transition.id);
          break;
        case 'UPDATE_TRANSITION_DETAILS':
          machineToUpdate.transitions = machineToUpdate.transitions.map(t => {
            if (t.id === actionToRedo.transitionId) {
              return {
                ...t,
                rules: actionToRedo.newRules,
                metadata: {
                  ...t.metadata,
                  fromNodeSide: actionToRedo.newFromSide,
                  toNodeSide: actionToRedo.newToSide,
                  midPointOffset: actionToRedo.newMidPointOffset,
                }
              };
            }
            return t;
          });
          break;
        case 'UPDATE_NODE_EXPANSION':
          machineToUpdate.nodes = machineToUpdate.nodes.map(n => {
            if (n.id === (actionToRedo as Extract<UndoRedoAction, { type: 'UPDATE_NODE_EXPANSION' }>).nodeId) {
              return { ...n, metadata: { ...n.metadata, isExpanded: (actionToRedo as Extract<UndoRedoAction, { type: 'UPDATE_NODE_EXPANSION' }>).newIsExpanded } };
            }
            return n;
          });
          break;
        case 'ADD_MACHINE_VARIABLE':
          machineToUpdate.variables = { ...(machineToUpdate.variables || {}), [actionToRedo.variableName]: actionToRedo.variable };
          break;
        case 'DELETE_MACHINE_VARIABLE':
          {
            const updatedVars = { ...(machineToUpdate.variables || {}) };
            delete updatedVars[actionToRedo.variableName];
            machineToUpdate.variables = updatedVars;
          }
          break;
      }
      return { ...prevMachines, [actionToRedo.machineId]: machineToUpdate };
    });
    handleSelectComponent(null);
    addToast(`Redo: ${actionToRedo.type.toLowerCase().replace(/_/g, ' ')}`, 'info');
  }, [redoStack, addToast, handleSelectComponent]);


  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const content = event.target?.result as string;
            const parsedJson = JSON.parse(content);

            if (!Array.isArray(parsedJson) || !parsedJson.every(m => m.id && m.name && Array.isArray(m.nodes) && Array.isArray(m.transitions))) {
                 throw new Error(`Invalid JSON structure. Expected an array of state machines.`);
            }
            
            const newMachinesData = parsedJson as any[];

            const newMachinesRecord: Record<string, StateMachine> = {};
            let firstNewMachineId = '';

            newMachinesData.forEach((loadedMachine) => {
                const processedNodes = assignNodeSizes(loadedMachine.nodes.map((n: any) => ({
                    ...n,
                    type: n.type === 'HIERARCHICAL' ? NodeType.Hierarchical : NodeType.Simple,
                    metadata: {
                        position: n.metadata?.position || n.position || { x: 0, y: 0 },
                        size: n.metadata?.size || n.size,
                        isExpanded: n.metadata?.isExpanded || n.isExpanded || false,
                    } as NodeUIMetadata,
                })));
                
                newMachinesRecord[loadedMachine.id] = {
                    ...loadedMachine,
                    nodes: processedNodes,
                    transitions: loadedMachine.transitions.map((t: any) => ({
                        ...t,
                        metadata: {
                            midPointOffset: t.metadata?.midPointOffset || t.midPointOffset || {x:0, y:0},
                            fromNodeSide: t.metadata?.fromNodeSide || t.fromNodeSide || 'bottom',
                            toNodeSide: t.metadata?.toNodeSide || t.toNodeSide || 'top',
                        } as TransitionUIMetadata,
                    })),
                    variables: loadedMachine.variables || {},
                };
                if (!firstNewMachineId) {
                    firstNewMachineId = loadedMachine.id;
                }
            });

            setAllMachines(newMachinesRecord);
            setUndoStack([]);
            setRedoStack([]);
            
            if (firstNewMachineId && newMachinesRecord[firstNewMachineId]) {
                 addToast(`Successfully loaded machines from "${file.name}". Active machine set to "${newMachinesRecord[firstNewMachineId].name}".`, 'success');
            } else if (newMachinesData.length > 0) {
                 addToast(`Loaded "${file.name}", but couldn't set an active machine from it. Defaulting if possible.`, 'warning');
            } else {
                addToast(`Loaded "${file.name}", but it contained no machines.`, 'warning');
            }


        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Failed to parse JSON file.';
            addToast(`Error loading file "${file.name}": ${errorMessage}`, 'error');
            console.error("Error parsing uploaded file:", e);
        }
    };
    reader.onerror = () => {
        addToast(`Error reading file "${file.name}".`, 'error');
    };
    reader.readAsText(file);
  }, [addToast]);

  const handleValidate = useCallback(() => {
    addToast('Validate State Machine clicked. Validation logic pending.', 'info');
  }, [addToast]);

  const handleRun = useCallback(() => {
    addToast('Run State Machine clicked. Runtime simulation pending.', 'info');
  }, [addToast]);

  const handleExport = useCallback(() => {
    if (Object.keys(allMachines).length === 0) {
        addToast('No machines to export.', 'warning');
        return;
    }
    const exportData = Object.values(allMachines).map(m => {
        return {
            ...m,
            nodes: m.nodes.map(n => ({
                ...n,
                type: NodeType[n.type] as unknown as NodeType,
            })),
            transitions: m.transitions.map(t => ({
                ...t,
            })),
            variables: m.variables ? Object.fromEntries(
                Object.entries(m.variables).map(([key, val]) => [key, {...val, type: VariableType[val.type] as unknown as VariableType}])
            ) : undefined
        };
    });

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `state_machines_export.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    addToast(`Exported all machines to JSON.`, 'success');
  }, [addToast, allMachines]);

  const handleNodeToggleExpand = useCallback((nodeId: string, targetMachineId: string) => {
    const machine = allMachines[targetMachineId];
    const node = machine?.nodes.find(n => n.id === nodeId && n.type === NodeType.Hierarchical);
    if (!node) return;

    const oldIsExpanded = !!node.metadata.isExpanded;
    const newIsExpanded = !oldIsExpanded;

    pushToUndoStack({
      type: 'UPDATE_NODE_EXPANSION',
      machineId: targetMachineId,
      nodeId,
      oldIsExpanded,
      newIsExpanded,
    });
    
    setAllMachines(prevMachines => {
      const updatedMachine = { ...prevMachines[targetMachineId] };
      if (!updatedMachine) return prevMachines;
      updatedMachine.nodes = updatedMachine.nodes.map(n =>
        n.id === nodeId
          ? { ...n, metadata: { ...n.metadata, isExpanded: newIsExpanded } }
          : n
      );
      return { ...prevMachines, [targetMachineId]: updatedMachine };
    });
  }, [allMachines, pushToUndoStack]);
  
  const handleMachineSelect = useCallback((machineId: string) => {
    if (allMachines[machineId]) {
      if (activeMachineId !== machineId) {
        setActiveMachineId(machineId);
        addToast(`Switched to machine: ${allMachines[machineId].name}`, 'info');
        handleSelectComponent(null);
        setUndoStack([]);
        setRedoStack([]);
      }
    } else {
      addToast(`Machine with ID ${machineId} not found.`, 'error');
    }
  }, [allMachines, addToast, handleSelectComponent, activeMachineId]);

  const handleNodePositionChange = useCallback((nodeId: string, newPosition: Point, targetMachineId: string) => {
    setAllMachines(prevMachines => {
      const machineToUpdate = { ...prevMachines[targetMachineId] };
      if (!machineToUpdate) return prevMachines;

      machineToUpdate.nodes = machineToUpdate.nodes.map(node =>
        node.id === nodeId
          ? { ...node, metadata: { ...node.metadata, position: newPosition } }
          : node
      );
      return { ...prevMachines, [targetMachineId]: machineToUpdate };
    });
  }, [allMachines]);

  const handleTransitionMidpointChange = useCallback((transitionId: string, newOffset: Point, oldOffset: Point | undefined, targetMachineId: string) => {
    const machine = allMachines[targetMachineId];
    const transitionToUpdate = machine?.transitions.find(t => t.id === transitionId);
    if (!transitionToUpdate) return;
    
    const validOldOffset = oldOffset || transitionToUpdate.metadata.midPointOffset || { x:0, y:0 };

    pushToUndoStack({
        type: 'UPDATE_TRANSITION_DETAILS',
        machineId: targetMachineId,
        transitionId: transitionId,
        oldRules: transitionToUpdate.rules,
        newRules: transitionToUpdate.rules,
        oldFromSide: transitionToUpdate.metadata.fromNodeSide,
        newFromSide: transitionToUpdate.metadata.fromNodeSide,
        oldToSide: transitionToUpdate.metadata.toNodeSide,
        newToSide: transitionToUpdate.metadata.toNodeSide,
        oldMidPointOffset: validOldOffset,
        newMidPointOffset: newOffset,
    });

    setAllMachines(prevMachines => {
      const machineToUpdate = { ...prevMachines[targetMachineId] };
      if (!machineToUpdate) return prevMachines;

      machineToUpdate.transitions = machineToUpdate.transitions.map(transition =>
        transition.id === transitionId
          ? { ...transition, metadata: { ...transition.metadata, midPointOffset: newOffset } }
          : transition
      );
      return { ...prevMachines, [targetMachineId]: machineToUpdate };
    });
  }, [allMachines, pushToUndoStack]);
  
  
  const currentActiveMachine = allMachines[activeMachineId];
  const machineForNewNodeModal = targetMachineIdForNewNode ? allMachines[targetMachineIdForNewNode] : null;


  if (Object.keys(allMachines).length === 0) {
     return <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 text-red-500 dark:text-red-400 p-4">
        <h2 className="text-2xl font-semibold mb-2">Application State Error</h2>
        <p className="text-lg">No state machines are loaded or defined.</p>
        <p className="text-sm mt-2">Try uploading a JSON file with state machine definitions.</p>
     </div>;
  }
  
  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none" tabIndex={-1} >
      <TopBar
        onFileUpload={handleFileUpload}
        onValidate={handleValidate}
        onRun={handleRun}
        onExport={handleExport}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        currentMachineName={currentActiveMachine?.name || (Object.keys(allMachines).length > 0 ? "Select a machine" : "No Machines Loaded")}
      />
      <div className="flex flex-1 overflow-hidden">
        <SideBar
          hierarchy={sidebarHierarchy}
          activeMachineId={activeMachineId}
          onMachineSelect={handleMachineSelect}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          onOpenAddVariableModal={handleOpenAddVariableModal}
          onOpenAddNodeModal={handleOpenAddNodeModal} // Pass the new handler
        />
        {currentActiveMachine ? (
          <CanvasArea
            machine={currentActiveMachine}
            activeMachineId={activeMachineId}
            allMachines={allMachines}
            selectedComponent={selectedComponent}
            onSelectComponent={handleSelectComponent}
            onOpenTransitionModal={handleOpenTransitionModal}
            onNodeToggleExpand={handleNodeToggleExpand}
            onNodePositionChange={handleNodePositionChange}
            onTransitionMidpointChange={handleTransitionMidpointChange}
            onOpenTransitionContextMenu={handleOpenTransitionContextMenu}
            connectingState={connectingState}
            onStartTransitionCreation={handleStartTransitionCreation}
            onUpdateConnectingPreviewPoint={handleUpdateConnectingPreviewPoint}
            onCompleteNewTransition={handleCompleteNewTransition}
            onCancelNewTransition={handleCancelNewTransition}
            onOpenAddNodeModalRequest={handleRequestOpenAddNodeModalForActiveMachine} // New prop
          />
        ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400 text-lg p-4">
                Select a state machine from the sidebar, or upload a file if no machines are available.
            </div>
        )}
      </div>
      {selectedModalTransition && allMachines[selectedModalTransition.machineId] && (
        <Modal
          title="Transition Details"
          isOpen={!!selectedModalTransition}
          onClose={() => setSelectedModalTransition(null)}
          primaryActionText="Save Rules"
          onSavePrimaryAction={handleSaveTransitionRules}
        >
          <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded space-y-3">
            <div className="flex items-center justify-between space-x-2">
                <div className="flex items-center space-x-2 flex-shrink min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        From: <span className="font-normal truncate">({allMachines[selectedModalTransition.machineId].nodes.find(n => n.id === selectedModalTransition.transition.fromNodeId)?.title || 'Unknown'})</span>
                    </p>
                    <select
                        id="fromNodeSideSelect"
                        aria-label="Transition from node side"
                        value={editableTransitionFromSide}
                        onChange={(e) => setEditableTransitionFromSide(e.target.value as NodeConnectionSide)}
                        className="p-1.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 text-xs w-auto min-w-[70px]"
                    >
                        {NODE_CONNECTION_SIDES.map(side => <option key={`from-${side}`} value={side}>{side}</option>)}
                    </select>
                </div>
                
                <ArrowRightIcon className="w-5 h-5 text-slate-500 dark:text-slate-400 mx-2 flex-shrink-0" />

                <div className="flex items-center space-x-2 flex-shrink min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        To: <span className="font-normal truncate">({allMachines[selectedModalTransition.machineId].nodes.find(n => n.id === selectedModalTransition.transition.toNodeId)?.title || 'Unknown'})</span>
                    </p>
                    <select
                        id="toNodeSideSelect"
                        aria-label="Transition to node side"
                        value={editableTransitionToSide}
                        onChange={(e) => setEditableTransitionToSide(e.target.value as NodeConnectionSide)}
                        className="p-1.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 text-xs w-auto min-w-[70px]"
                    >
                        {NODE_CONNECTION_SIDES.map(side => <option key={`to-${side}`} value={side}>{side}</option>)}
                    </select>
                </div>
            </div>
            
            <div>
              <label htmlFor="transitionRulesTextarea" className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Rules:</label>
              <textarea
                id="transitionRulesTextarea"
                value={currentRulesInput}
                onChange={(e) => setCurrentRulesInput(e.target.value)}
                className="w-full p-2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                rows={4}
                placeholder="Enter transition rules..."
              />
            </div>
            
            {selectedModalTransition.transition.metadata.midPointOffset && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Curve offset: ({selectedModalTransition.transition.metadata.midPointOffset.x.toFixed(1)}, {selectedModalTransition.transition.metadata.midPointOffset.y.toFixed(1)})
              </p>
            )}
          </div>
        </Modal>
      )}

      {isAddNodeModalOpen && machineForNewNodeModal && (
        <Modal
            title={`Add New State Node to "${machineForNewNodeModal.name}"`}
            isOpen={isAddNodeModalOpen}
            onClose={handleCloseAddNodeModal}
            primaryActionText="Add Node"
            onSavePrimaryAction={handleSaveNewNode}
        >
            <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded space-y-4">
                {/* Line 1: Node Type and Name */}
                <div className="flex items-center space-x-2">
                    <select
                        id="newNodeType"
                        value={newNodeType}
                        onChange={(e) => setNewNodeType(e.target.value as NodeType | '')}
                        className="block w-auto pl-3 pr-10 py-2 text-base bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        aria-label="Node Type"
                    >
                        <option value="" disabled hidden>Select type</option>
                        {NODE_TYPE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <span className="text-slate-700 dark:text-slate-300">:</span>
                    <input
                        type="text"
                        id="newNodeName"
                        value={newNodeName}
                        onChange={(e) => setNewNodeName(e.target.value)}
                        className="block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 dark:placeholder-slate-500
                                   focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        placeholder="Enter the state name"
                        aria-label="Node Name"
                    />
                </div>

                {/* Line 2: Create New Variable and Add Variables Section Toggle */}
                <div className="flex items-center space-x-2 pt-2">
                    <button
                        onClick={() => targetMachineIdForNewNode && handleOpenAddVariableModal(targetMachineIdForNewNode)}
                        className="flex items-center px-3 py-1.5 text-xs bg-sky-500 hover:bg-sky-600 text-white rounded-md shadow-sm"
                        title="Create a new variable for this machine"
                    >
                        <PlusIcon className="w-3.5 h-3.5 mr-1"/>
                        Create new variable
                    </button>
                    <span className="text-sm text-slate-700 dark:text-slate-300 ml-2">Add Variables</span>
                    <button
                        onClick={handleToggleAddNodeVariableSelector}
                        className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                        title={showAddNodeVariableSelector ? "Hide variable selector" : "Show variable selector for this node"}
                    >
                        <PlusIcon className={`w-5 h-5 transition-transform duration-200 ${showAddNodeVariableSelector ? 'rotate-45' : ''}`} />
                    </button>
                </div>

                {/* Conditional Variable Selection UI */}
                {showAddNodeVariableSelector && (
                    <div className="space-y-3 border-t border-slate-300 dark:border-slate-600 pt-3">
                        <div className="flex items-center space-x-2">
                            <select
                                value={variableToAddFromMachine}
                                onChange={(e) => setVariableToAddFromMachine(e.target.value)}
                                className="block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                aria-label="Select variable from machine"
                            >
                                <option value="" disabled>Select a variable...</option>
                                {machineForNewNodeModal.variables && Object.keys(machineForNewNodeModal.variables).length > 0 ? (
                                  Object.keys(machineForNewNodeModal.variables)
                                    .filter(varName => !newNodeSelectedMachineVariables.includes(varName)) // Exclude already selected
                                    .map(varName => (
                                      <option key={varName} value={varName}>{varName} ({machineForNewNodeModal.variables![varName].type})</option>
                                  ))
                                ) : (
                                  <option value="" disabled>No variables in machine</option>
                                )}
                            </select>
                            <button
                                onClick={handleAddVariableToNewNodeList}
                                disabled={!variableToAddFromMachine}
                                className="px-3 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-md shadow-sm disabled:opacity-50"
                            >
                                Add to Node
                            </button>
                        </div>
                        {newNodeSelectedMachineVariables.length > 0 && (
                            <div className="space-y-1">
                                <p className="text-xs text-slate-600 dark:text-slate-400">Selected variables (will be added as inputs):</p>
                                <ul className="max-h-20 overflow-y-auto space-y-1 bg-slate-200 dark:bg-slate-700 p-2 rounded">
                                    {newNodeSelectedMachineVariables.map(varName => (
                                        <li key={varName} className="flex justify-between items-center text-xs text-slate-700 dark:text-slate-200">
                                            <span>- {varName}</span>
                                            <button
                                                onClick={() => handleRemoveVariableFromNewNodeList(varName)}
                                                className="p-0.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                                title={`Remove ${varName}`}
                                            >
                                                <XIcon className="w-3 h-3"/>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
      )}
            {isAddVariableModalOpen && (
        <Modal
            title="Add New Variable"
            isOpen={isAddVariableModalOpen}
            onClose={handleCloseAddVariableModal}
            primaryActionText="Add Variable"
            onSavePrimaryAction={handleSaveNewVariable}
        >
            <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded space-y-4">
                <div className="flex items-center space-x-2">
                    <select
                        id="newVariableType"
                        value={newVariableType}
                        onChange={(e) => setNewVariableType(e.target.value as VariableType | '')}
                        className="block w-auto pl-3 pr-10 py-2 text-base bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        aria-label="Variable Type"
                    >
                        <option value="" disabled hidden>Select type</option>
                        {VARIABLE_TYPES_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <span className="text-slate-700 dark:text-slate-300">:</span>
                    <input
                        type="text"
                        id="newVariableName"
                        value={newVariableName}
                        onChange={(e) => setNewVariableName(e.target.value)}
                        className="block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 dark:placeholder-slate-500
                                   focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
                                   disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none
                                   invalid:border-pink-500 invalid:text-pink-600
                                   focus:invalid:border-pink-500 focus:invalid:ring-pink-500"
                        placeholder="Enter variable name"
                        aria-label="Variable Name"
                    />
                </div>
            </div>
        </Modal>
      )}
      {contextMenuInfo && (
        <ContextMenu
          x={contextMenuInfo.position.x}
          y={contextMenuInfo.position.y}
          actions={[
            {
              label: 'Delete Transition',
              onClick: () => handleDeleteTransition(contextMenuInfo.transitionId, contextMenuInfo.machineId),
              icon: <TrashIcon className="w-4 h-4 mr-2 text-red-500 dark:text-red-400" />
            }
          ]}
          onClose={handleCloseContextMenu}
        />
      )}
    </div>
  );
};

export default App;
