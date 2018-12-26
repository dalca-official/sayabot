const { cpus } = require('os')

const NUM_WORKERS = cpus().length
const availableMaxWorkers = cpus().length
const WORKERS = {}

const closeCluster = () => {
  console.log('Master stopped.')

  broadcast({ cmd: 'SHUTDOWN' })
}

const broadcast = async ({ cmd, data }) => {
  for (const pid in WORKERS) {
    await WORKERS[pid].send({ cmd, data })
  }
}
