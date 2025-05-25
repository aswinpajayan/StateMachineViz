
import { StateMachine, NodeType, VariableType, NodeConnectionSide } from './types';

export const mainSystemControllerMachine: StateMachine = {
  id: 'mainController',
  name: 'Main System Controller',
  nodes: [
    {
      id: 'node-main-idle',
      title: 'Idle',
      type: NodeType.Simple,
      inputs: ["SystemReset"],
      outputs: ["IsReady"],
      metadata: {
        position: { x: 150, y: 50 },
        size: { width: 180, height: 100 }
      }
    },
    {
      id: 'node-main-active',
      title: 'Active Mission',
      type: NodeType.Hierarchical,
      inputs: ["StartCommand", "SensorData"],
      outputs: ["MissionStatus"],
      subMachineId: 'missionLogic',
      metadata: {
        position: { x: 150, y: 250 },
        isExpanded: false,
        size: { width: 180, height: 120 }
      }
    },
    {
      id: 'node-main-error',
      title: 'Error State',
      type: NodeType.Simple,
      inputs: ["FaultDetected"],
      outputs: ["ErrorCode"],
      metadata: {
        position: { x: 150, y: 450 },
        size: { width: 180, height: 100 }
      }
    },
  ],
  transitions: [
    { 
      id: 't-main-1', 
      fromNodeId: 'node-main-idle', 
      toNodeId: 'node-main-active', 
      rules: 'StartCommand received AND IsReady == true',
      metadata: { fromNodeSide: 'bottom', toNodeSide: 'top' }
    },
    { 
      id: 't-main-2', 
      fromNodeId: 'node-main-active', 
      toNodeId: 'node-main-idle', 
      rules: 'MissionStatus == "Completed" OR SystemReset',
      metadata: { fromNodeSide: 'bottom', toNodeSide: 'top' }
    },
    { 
      id: 't-main-3', 
      fromNodeId: 'node-main-active', 
      toNodeId: 'node-main-error', 
      rules: 'FaultDetected OR MissionStatus == "Failed"',
      metadata: { fromNodeSide: 'bottom', toNodeSide: 'top' }
    },
    { 
      id: 't-main-4', 
      fromNodeId: 'node-main-error', 
      toNodeId: 'node-main-idle', 
      rules: 'SystemReset',
      metadata: { fromNodeSide: 'bottom', toNodeSide: 'top' }
    },
  ],
  variables: {
    'SystemReset': { type: VariableType.Input, value: false },
    'StartCommand': { type: VariableType.Input, value: false },
    'SensorData': { type: VariableType.Input, value: {} },
    'FaultDetected': { type: VariableType.Input, value: false },
    'IsReady': { type: VariableType.Output, value: true },
    'MissionStatus': { type: VariableType.Output, value: "Pending" },
    'ErrorCode': { type: VariableType.Output, value: 0 },
    'InternalCounter': { type: VariableType.Intermediate, value: 0 }
  }
};

export const missionLogicSubMachine: StateMachine = {
  id: 'missionLogic',
  name: 'Mission Logic (Sub-Machine)',
  nodes: [
    {
      id: 'node-sub-init',
      title: 'Initialize',
      type: NodeType.Simple,
      inputs: ["StartCommand"],
      outputs: ["SubInitializeComplete"],
      metadata: {
        position: { x: 100, y: 50 },
        size: { width: 180, height: 100 }
      }
    },
    {
      id: 'node-sub-process',
      title: 'Processing Data',
      type: NodeType.Simple,
      inputs: ["SensorData", "SubInitializeComplete"],
      outputs: ["ProcessedData", "SubProcessingStatus"],
      metadata: {
        position: { x: 100, y: 250 },
        size: { width: 180, height: 120 }
      }
    },
    {
      id: 'node-sub-finalize',
      title: 'Finalize',
      type: NodeType.Simple,
      inputs: ["SubProcessingStatus"],
      outputs: ["MissionOutcome"],
      metadata: {
        position: { x: 100, y: 450 },
        size: { width: 180, height: 100 }
      }
    }
  ],
  transitions: [
    { 
      id: 't-sub-1', 
      fromNodeId: 'node-sub-init', 
      toNodeId: 'node-sub-process', 
      rules: 'SubInitializeComplete == true',
      metadata: { fromNodeSide: 'bottom', toNodeSide: 'top' }
    },
    { 
      id: 't-sub-2', 
      fromNodeId: 'node-sub-process', 
      toNodeId: 'node-sub-finalize', 
      rules: 'SubProcessingStatus == "Done"',
      metadata: { fromNodeSide: 'bottom', toNodeSide: 'top' }
    },
    { 
      id: 't-sub-3', 
      fromNodeId: 'node-sub-process', 
      toNodeId: 'node-sub-init', 
      rules: 'SensorData.error == true',
      metadata: { fromNodeSide: 'bottom', toNodeSide: 'top' }
    },
  ],
  variables: {
    'StartCommand': { type: VariableType.Input }, 
    'SensorData': { type: VariableType.Input },   
    'SubInitializeComplete': { type: VariableType.Output, value: false },
    'ProcessedData': { type: VariableType.Intermediate, value: null },
    'SubProcessingStatus': { type: VariableType.Output, value: "Idle" },
    'MissionOutcome': { type: VariableType.Output, value: null }
  }
};
