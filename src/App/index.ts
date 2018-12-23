import * as Cluster from 'cluster'
import { cpus } from 'os'
import { join, resolve } from 'path'

import * as pkg from 'package.json'
import * as env from '@/Config/Constant.json'
import { Config } from '@/Config'
import { Console } from '@/Tools'

import { IBroadcast, ICluster, IWorker } from '&types/App'

const coreLog = Console('[Core]')
const shardLog = Console('[Shard]')
const NODE_VERSION = process.versions.node
let receivedCounts = 0
const NUM_WORKERS = cpus().length
const workers: IWorker = {}

const closeCluster = (): void => {
  coreLog.log('Master stopped.')

  broadcast({ cmd: 'SHUTDOWN' })
}

const broadcast = async ({ cmd, data }: IBroadcast): Promise<void> => {
  // tslint:disable-next-line:forin
  for (const pid in workers) {
    await workers[pid].send({ cmd, data })
  }
}

Cluster.setupMaster({
  execArgv: ['-r', 'tsconfig-paths/register', '-r', 'ts-node/register'],
  exec: join(`${__dirname}/Shard.ts`),
})

// Start Sayabot
coreLog.log(`Start ${process.pid}`)

coreLog.log(`${env.botName} v${pkg.version}`)
coreLog.log(`The minimum supported Node.js version is ${env.minSuppportNodeVersion}`)
coreLog.log(`The host's node version is ${NODE_VERSION}`)

// Set master process title
process.title = `${env.botName} v${pkg.version}`

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
  const WORKER_ENV = { SHARD_ID: clusterId, SHARDS_COUNT: clusters }

  const worker = Cluster.fork(WORKER_ENV)
  workers[worker.process.pid] = worker
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
process.removeAllListeners('SIGTERM')
process.removeAllListeners('SIGINT')
process.on('unhandledRejection', reason => coreLog.error(`Unhandled rejection: ${reason}`))
process.on('SIGTERM', closeCluster)
process.on('SIGINT', closeCluster)
process.on('message', ({ cmd }: IBroadcast) => {
  coreLog.log(`Received command ${cmd} from cluster`)

  switch (cmd) {
    case 'DISCONNECTED':
    case 'FORCE_DISCONNECTED':
      ++receivedCounts

      if (receivedCounts >= NUM_WORKERS) {
        coreLog.log('All cluster has closed. Stopping...')
        process.exit(0)
      }
      break
    default:
      coreLog.warn(`Unknown command received from cluster. Entire command: ${cmd}`)
  }
})
