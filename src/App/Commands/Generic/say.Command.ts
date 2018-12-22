// src > App > Commands > Generic > say.Command.ts
import { Command } from '@/App/Structures/Command'
import { IRun } from '&types/Command'

import { Console } from '@/Tools'

const commandLog = Console('[Command]')

class Say extends Command {
  constructor() {
    super()

    this.cmds = 'say'
    this.aliases = ['tell', 'talk']
    this.description = 'Say some messages from Sayabot.'
  }

  public async run({ instance, message, args }: IRun): Promise<void> {
    const sayMessage = args.join(' ')

    message.delete().catch(commandLog.error)
    await message.channel.send(sayMessage)
  }
}

export default new Say()
