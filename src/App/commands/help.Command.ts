import { Command } from '@/App/structures/command'
import { IRun } from '&types/Command'

import { Console } from '@/Tools'

const commandLog = Console('[Command]')

class Help extends Command {
  constructor() {
    super()

    this.name = 'help'
    this.description = 'Ping? pong!'
  }

  public async run({ instance, message, args }: IRun): Promise<void> {
    await message.channel.send('안녕하세욤?').catch(err => commandLog.error(err))
  }
}

export default new Help()
