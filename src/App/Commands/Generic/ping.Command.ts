// src > App > Commands > Generic > ping.Command.ts
import { Command } from '@/App/Structures/Command'
import { Console } from '@/Tools'

import { intergralMessageTypes } from '&types/Command'

const commandLog = Console('[Command]')

class Ping extends Command {
  constructor() {
    super()

    this.cmds = 'ping'
    this.description = 'Ping? pong!'
    this.group = 'generic'
  }

  public async run() {
    const message = <intergralMessageTypes>this.instance.receivedData.get('message')

    await message.channel
      .send('Ping?')
      .then((msg: intergralMessageTypes) => {
        const Latency = msg.createdTimestamp - message.createdTimestamp
        msg.edit(`Pong!\nLatency is ${Latency}ms. API Latency is ${Math.round(this.instance.ping)}ms.`)
      })
      .catch(commandLog.error)
  }
}

export default new Ping()
