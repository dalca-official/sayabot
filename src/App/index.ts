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
const NUM_WORKERS = cpus().length
const workers: IWorker = {}

const closeCluster = (): void => {
  coreLog.log('Master stopped.')

  broadcast({ cmd: 'shutdown' })
}

const broadcast = ({ cmd, data }: IBroadcast) => {
  // tslint:disable-next-line:forin
  for (const pid in workers) {
    workers[pid].send({ cmd, data })
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
Cluster.on('exit', (worker: ICluster) => {
  shardLog.error(`Cluster ${worker.process.pid} died.`)
})

// Bind events for the master
process.on('unhandledRejection', reason => coreLog.error(`Unhandled rejection: ${reason}`))
process.on('SIGTERM', closeCluster)
process.on('SIGINT', closeCluster)
process.on('message', ({ cmd }: IBroadcast) => {
  // Done
})
