import { Command } from '@/App/structures/command'
import { IRun, intergralMessageTypes } from '&types/Command'

import { Console } from '@/Tools'

const commandLog = Console('[Command]')

class Ping extends Command {
  constructor() {
    super()

    this.name = 'ping'
    this.description = 'Ping? pong!'
  }

  public async run({ instance, message, args }: IRun) {
    await message.channel
      .send('Ping?')
      .then((msg: intergralMessageTypes) =>
        msg.edit(
          `Pong!\nLatency is ${msg.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(
            instance.ping,
          )}ms.`,
        ),
      )
      .catch(err => commandLog.error(err))
  }
}

export default new Ping()
