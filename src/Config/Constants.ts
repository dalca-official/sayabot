// src > Config > Constants.ts
export const botName = 'Sayabot'

export const minSupportNodeVersion = 10

export const useCluster = false

export enum IPCEvents {
  EVAL,
  MESSAGE,
  BROADCAST,
  READY,
  SHARDREADY,
  SHARDRECONNECT,
  SHARDRESUMED,
  SHARDISCONNECT,
  RESTARTALL,
  RESTART,
  FETCHUSER,
  FETCHCHANNEL,
  FETCHGUILD,
}
