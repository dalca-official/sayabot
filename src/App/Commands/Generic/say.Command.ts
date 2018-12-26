// src > App > Commands > Generic > say.Command.ts
import { Command } from '@/App/Structures/Command'
import { Console } from '@/Tools'

import { intergralMessageTypes } from '&types/Command'

const commandLog = Console('[Command]')

class Say extends Command {
  constructor() {
    super()

    this.cmds = 'say'
    this.aliases = ['tell', 'talk']
    this.description = 'Say some messages from Sayabot.'
    this.group = 'generic'
  }

  public async run(): Promise<void> {
    const message = <intergralMessageTypes>this.instance.receivedData.get('message')
    const args = <string[]>this.instance.receivedData.get('args')
    const sayMessage = args.join(' ')

    message.delete().catch(commandLog.error)
    await message.channel.send(sayMessage)
  }
}

export default new Say()
