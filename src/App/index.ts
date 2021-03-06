// src > App > index.ts
import * as Cluster from 'cluster'
import { cpus } from 'os'
import { join, resolve } from 'path'

import * as pkg from 'package.json'
import * as env from '@/Config/Constant.json'
import { Config } from '@/Config'
import { Console } from '@/Tools'
import { Process } from '@/App/Utils/Process.Util'

import { ICluster } from '&types/App'

const coreLog = Console('[Core]')
const shardLog = Console('[Shard]')
const NODE_VERSION = process.versions.node
const NUM_WORKERS = cpus().length

const closeCluster = (): void => {
  coreLog.log('Master stopped.')

  broadcast('SHUTDOWN')
  return
}

const broadcast = async (cmd: string): Promise<void> => {
  // tslint:disable-next-line:forin
  for (const pid in Cluster.workers) {
    await Cluster.workers[pid].send(cmd)
  }
}

Cluster.setupMaster({
  execArgv: ['-r', 'tsconfig-paths/register', '-r', 'ts-node/register'],
  exec: join(`${__dirname}/Shard.ts`),
})

// Start Sayabot
coreLog.log('Start.')
coreLog.log(`${env.botName} v${pkg.version}`)
coreLog.log(`The minimum supported Node.js version is ${env.minSuppportNodeVersion}`)
coreLog.log(`The host's node version is ${NODE_VERSION}`)

// Set master process title
Process.setTitle(`${env.botName} v${pkg.version}`)

// set environment
const isDevelopment = process.argv.slice(2)[0] === '--dev'

if (isDevelopment) {
  process.env.NODE_ENV = 'development'
  Config.initialise({ path: resolve('src/Config/development.env') })
} else {
  process.env.NODE_ENV = 'production'
  Config.initialise({ path: resolve('src/Config/production.env') })
}

// Initialise the shards
shardLog.log('Initialise the shards')

const clusters = env.useCluster ? NUM_WORKERS : 1

for (let clusterId = 0; clusterId < clusters; clusterId++) {
  const WORKER_ENV = { SHARD_ID: clusterId, SHARD_COUNT: clusters }

  const Worker = Cluster.fork(WORKER_ENV)
  Worker.on('message', command => process.emit(command))
}

// Bind events for the shards
Cluster.on('online', (worker: ICluster) => {
  shardLog.log(`Cluster ${worker.process.pid} has started.`)
})
Cluster.on('exit', (worker: ICluster, exitCode: number) => {
  if (exitCode === 0) return

  shardLog.error(`Cluster ${worker.process.pid} died. ${exitCode}`)
})

// Bind events for the master
process.on('uncaughtException', err => coreLog.error(`Caught exception: ${err.stack}`))
process.on('unhandledRejection', (reason, p) => coreLog.error(`Unhandled rejection at: ${p} bzc of ${reason}`))
process.on('exit', code => shardLog.log(`Exited with code ${code}`))
process.on('SIGTERM', closeCluster)
process.on('SIGINT', closeCluster)
process.on(<NodeJS.Signals>'DISCONENECTED', () => process.exit(0))
