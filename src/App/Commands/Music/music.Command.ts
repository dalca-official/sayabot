// src > App > Commands > Music > music.Command.ts
import { Command } from '@/App/Structures/Command'
import { Console } from '@/Tools'

import { intergralMessageTypes } from '&types/Command'

const commandLog = Console('[Command]')

class Music extends Command {
  constructor() {
    super()

    this.cmds = 'music'
    this.aliases = ['m']
    this.description = 'Ping? pong!'
  }

  public async run() {
    const message = <intergralMessageTypes>this.instance.receivedData.get('message')
    const args = <string[]>this.instance.receivedData.get('args')

    switch (args[0]) {
      case 'play':
        const voiceChannel = message.member.voiceChannel
        if (!voiceChannel) {
          await message.channel.send(`I'm sorry but you need to be in a voice channel to play music!`)
          return
        }

        const permissions = voiceChannel.permissionsFor(message.client.user)
        if (!permissions.has('CONNECT')) {
          await message.channel.send('')
        }
        break
      default:
        return
    }
  }
}

export default new Music()
