
import React, { useState } from 'react';
import { HierarchicalItem, VariableType, NodeType } from '../types';
import { ChevronDownIcon, ChevronRightIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from './icons/ChevronIcons'; 
import { InputIcon, OutputIcon, IntermediateIcon, StateMachineIcon, FolderIcon, SimpleNodeIcon, HierarchicalNodeIcon } from './icons/TypeIcons';
import { PlusIcon } from './icons/ActionIcons';

interface SideBarItemProps {
  item: HierarchicalItem;
  level: number;
  activeMachineId?: string;
  onMachineSelect: (machineId: string) => void;
  isSidebarCollapsed: boolean;
  onOpenAddVariableModal?: (machineId: string) => void; 
  onOpenAddNodeModal?: (machineId: string) => void; // New prop
}

const SideBarItem: React.FC<SideBarItemProps> = ({ 
    item, 
    level, 
    activeMachineId, 
    onMachineSelect, 
    isSidebarCollapsed,
    onOpenAddVariableModal,
    onOpenAddNodeModal // New prop
}) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (item.type === 'machine') return true;
    return false; 
  });

  let Icon = null;
  switch(item.type) {
    case 'machine': Icon = StateMachineIcon; break;
    case 'variable_group': Icon = FolderIcon; break;
    case 'node_group': Icon = FolderIcon; break; 
    case 'variable':
      switch(item.variableType) {
        case VariableType.Input: Icon = InputIcon; break;
        case VariableType.Output: Icon = OutputIcon; break;
        case VariableType.Intermediate: Icon = IntermediateIcon; break;
      }
      break;
    case 'node':
      Icon = item.nodeType === NodeType.Hierarchical ? HierarchicalNodeIcon : SimpleNodeIcon;
      break;
  }
  
  const canExpand = item.children && item.children.length > 0;
  const isMachineSelected = item.type === 'machine' && item.id === activeMachineId;
  const isMachineItem = item.type === 'machine';
  
  const isMachineVariablesGroupForActiveMachine = item.type === 'variable_group' && 
                                                 item.isMachineVariablesGroup && 
                                                 item.id === `${activeMachineId}-machine-variables`;


  const handleClick = () => {
    if (canExpand) {
      setIsExpanded(!isExpanded);
    }
    if (item.type === 'machine') {
      onMachineSelect(item.id);
    }
  };

  const paddingLeftBase = isSidebarCollapsed ? 8 : 16; 
  const paddingLeft = level * paddingLeftBase + (canExpand || isSidebarCollapsed ? 0 : 20);

  return (
    <li className="text-sm">
      <div
        style={{ paddingLeft: `${paddingLeft}px` }}
        className={`group flex items-center justify-between py-1.5 px-3 rounded-md transition-colors duration-100 
                    ${isMachineSelected 
                      ? 'bg-blue-500 dark:bg-blue-600 text-white font-semibold' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'}`}
        title={item.name}
      >
        <div 
          onClick={handleClick} 
          className="flex items-center flex-grow cursor-pointer min-w-0"
        >
          {canExpand && !isSidebarCollapsed && (
            isExpanded 
              ? <ChevronDownIcon className="w-4 h-4 mr-1.5 text-slate-500 dark:text-slate-400 flex-shrink-0" /> 
              : <ChevronRightIcon className="w-4 h-4 mr-1.5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
          )}
          {Icon && <Icon className={`w-4 h-4 flex-shrink-0 ${isSidebarCollapsed ? 'mx-auto' : 'mr-2'}`} />}
          {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
        </div>
        {isMachineVariablesGroupForActiveMachine && !isSidebarCollapsed && onOpenAddVariableModal && (
            <button
                onClick={(e) => {
                    e.stopPropagation(); 
                    if (activeMachineId) onOpenAddVariableModal(activeMachineId);
                }}
                className="p-0.5 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Add new variable to this machine"
            >
                <PlusIcon className="w-4 h-4"/>
            </button>
        )}
        {isMachineItem && item.id === activeMachineId && !isSidebarCollapsed && onOpenAddNodeModal && (
             <button
                onClick={(e) => {
                    e.stopPropagation();
                    onOpenAddNodeModal(item.id);
                }}
                className="p-0.5 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                title="Add new state node to this machine"
            >
                <PlusIcon className="w-4 h-4"/>
            </button>
        )}
      </div>
      {isExpanded && canExpand && !isSidebarCollapsed && (
        <ul className="pl-0">
          {item.children?.map(child => (
            <SideBarItem 
                key={child.id} 
                item={child} 
                level={level + 1} 
                activeMachineId={activeMachineId} 
                onMachineSelect={onMachineSelect} 
                isSidebarCollapsed={isSidebarCollapsed}
                onOpenAddVariableModal={onOpenAddVariableModal}
                onOpenAddNodeModal={onOpenAddNodeModal} // Pass down
            />
          ))}
        </ul>
      )}
    </li>
  );
};


interface SideBarProps {
  hierarchy: HierarchicalItem[];
  activeMachineId?: string;
  onMachineSelect: (machineId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenAddVariableModal: (machineId: string) => void;
  onOpenAddNodeModal: (machineId: string) => void; // New prop
}

export const SideBar: React.FC<SideBarProps> = ({ 
    hierarchy, 
    activeMachineId, 
    onMachineSelect, 
    isCollapsed, 
    onToggleCollapse,
    onOpenAddVariableModal,
    onOpenAddNodeModal // New prop
}) => {
  const ToggleIcon = isCollapsed ? ChevronDoubleRightIcon : ChevronDoubleLeftIcon;

  return (
    <div 
      className={`bg-slate-100 dark:bg-slate-800 p-3 border-r border-slate-300 dark:border-slate-600 overflow-y-auto flex-shrink-0 h-full transition-width duration-300 ease-in-out flex flex-col
                  ${isCollapsed ? 'w-16' : 'w-72'}`}
    >
      <div className="flex items-center justify-between mb-3 border-b border-slate-300 dark:border-slate-600 pb-2">
        {!isCollapsed && <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate">Explorer</h2>}
        <button 
          onClick={onToggleCollapse} 
          className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <ToggleIcon className="w-5 h-5" />
        </button>
      </div>
      {!isCollapsed && (
        <ul className="space-y-0.5 flex-grow">
          {hierarchy.map(item => (
            <SideBarItem 
              key={item.id} 
              item={item} 
              level={0} 
              activeMachineId={activeMachineId} 
              onMachineSelect={onMachineSelect}
              isSidebarCollapsed={isCollapsed}
              onOpenAddVariableModal={onOpenAddVariableModal}
              onOpenAddNodeModal={onOpenAddNodeModal} // Pass down
            />
          ))}
        </ul>
      )}
       {isCollapsed && (
         <div className="flex-grow flex flex-col items-center space-y-2 mt-2">
            {hierarchy.filter(item => item.type === 'machine').slice(0,5).map(item => ( 
                 (item.type === 'machine') && (
                    <button 
                        key={item.id}
                        onClick={() => {
                            if (item.type === 'machine') onMachineSelect(item.id);
                        }}
                        title={item.name}
                        className={`p-2 rounded-md w-full flex justify-center
                                    ${item.type === 'machine' && item.id === activeMachineId 
                                        ? 'bg-blue-500 dark:bg-blue-600 text-white' 
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                        <StateMachineIcon className="w-5 h-5" />
                    </button>
                 )
            ))}
         </div>
       )}
    </div>
  );
};
