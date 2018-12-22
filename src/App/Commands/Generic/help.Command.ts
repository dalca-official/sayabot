// src > App > Commands > Generic > help.Command.ts
import * as Discord from 'discord.js'

import { Command } from '@/App/Structures/Command'
import { IRun } from '&types/Command'

import { Console } from '@/Tools'

const commandLog = Console('[Command]')

class Help extends Command {
  constructor() {
    super()

    this.cmds = 'help'
    this.aliases = ['h', 'commands', 'cmds']
    this.description = 'Print all helps for Sayabots'
  }

  public async run({ instance, message, args }: IRun): Promise<void> {
    const richEmbed = new Discord.RichEmbed()
      .setTitle('This is help main title')
      .setDescription('hi dude')
      .setColor(0x00ae86)
    const commands = Array.from(instance.commandsExcludeAliases.keys())

    commands.map(cmd => {
      const command = <any>instance.commandsExcludeAliases.get(cmd)
      richEmbed.addField(`>${command.cmds}`, command.description)
    })

    await message.channel.send(richEmbed).catch(err => commandLog.error(err))
  }
}

export default new Help()
