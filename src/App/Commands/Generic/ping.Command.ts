// src > App > Commands > Generic > ping.Command.ts
import { Command } from '@/App/Structures/Command'
import { IRun, intergralMessageTypes } from '&types/Command'

import { Console } from '@/Tools'

const commandLog = Console('[Command]')

class Ping extends Command {
  constructor() {
    super()

    this.cmds = 'ping'
    this.description = 'Ping? pong!'
  }

  public async run({ instance, message, args }: IRun) {
    await message.channel
      .send('Ping?')
      .then((msg: intergralMessageTypes) => {
        const Latency = msg.createdTimestamp - message.createdTimestamp
        msg.edit(`Pong!\nLatency is ${Latency}ms. API Latency is ${Math.round(instance.ping)}ms.`)
      })
      .catch(err => commandLog.error(err))
  }
}

export default new Ping()
