// src > App > Commands > Generic > prune.Command.ts
import { Command } from '@/App/Structures/Command'
import { Console } from '@/Tools'

import { intergralMessageTypes } from '&types/Command'

const commandLog = Console('[Command]')

class Prune extends Command {
  constructor() {
    super()

    this.cmds = 'prune'
    this.aliases = ['del', 'delete', 'remove']
    this.description = 'Remove some data.'
  }

  public async run(): Promise<void> {
    const message = <intergralMessageTypes>this.instance.receivedData.get('message')
    const args = <string[]>this.instance.receivedData.get('args')
    const deleteCounts = Number.parseInt(args[0], 10)

    if (isNaN(deleteCounts) || !deleteCounts) {
      await message.channel.send(`That doesn't semm to be a valid number.`)
      return
    } else if (deleteCounts <= 1 || deleteCounts > 100) {
      await message.channel.send('You need to input a number between 2 and 100.')
      return
    }

    await message.channel
      .fetchMessages({ limit: deleteCounts })
      .then(messages => {
        message.channel.bulkDelete(messages)
        message.channel.send(`Succeessfully deletes ${messages.array().length} messages`)
      })
      .catch(commandLog.error)
  }
}

export default new Prune()
