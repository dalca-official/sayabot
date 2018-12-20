import * as Discord from 'discord.js'
import * as Cluster from 'cluster'
import { ChildProcess } from 'child_process'

export type IConfig = Readonly<{
  path: string
}>

interface IProcessEnv extends NodeJS.ProcessEnv {
  SHARD_ID: string
  SHARDS_COUNT: string
}

interface IChildProcess extends ChildProcess {
  env?: IProcessEnv
}

export interface ICluster extends Cluster.Worker {
  process: IChildProcess
}

export interface IWorker {
  [key: string]: Cluster.Worker
}

export interface IBroadcast {
  cmd: string
  data?: any
}

export interface IDiscordInstance extends Discord.Client {
  commands?: Discord.Collection<string, string>
}

type ActivityType = 'PLAYING' | 'STREAMING' | 'LISTENING' | 'WATCHING'

export interface IDiscordActivity {
  url?: string
  type?: ActivityType | number
}
