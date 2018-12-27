const Cluster = require('cluster')
const { cpus } = require('os')
const { join } = require('path')

const availableMaxWorkers = cpus().length
const WORKERS = {}

Cluster.setupMaster({ exec: join(`${__dirname}/Shard.js`) })

const closeCluster = () => {
  console.log('Master stopped.')

  broadcast({ cmd: 'SHUTDOWN' })
}

const broadcast = async ({ cmd, data }) => {
  for (const pid in WORKERS) {
    await WORKERS[pid].send({ cmd, data })
  }
}

for (let clusterID = 0; clusterID < availableMaxWorkers; clusterID++) {
  const WORKER_ENV = { SHARD_ID: clusterID, SHARD_COUNT: availableMaxWorkers }

  const Worker = Cluster.fork(WORKER_ENV)
  Worker.on('message', command => process.emit(command))
}

process.on('DISCONNECTED', () => {
  console.log('will die')
  process.exit(0)
})
