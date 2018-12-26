// src > App > Commands > Generic > help.Command.ts
import * as Discord from 'discord.js'

import * as env from '@/Config/Constant.json'
import { Command } from '@/App/Structures/Command'
import { Console } from '@/Tools'

import { intergralMessageTypes } from '&types/Command'

const commandLog = Console('[Command]')

class Help extends Command {
  constructor() {
    super()

    this.cmds = 'help'
    this.aliases = ['h', 'commands', 'cmds']
    this.description = 'Print all helps for Sayabots'
    this.group = 'generic'
    this.hide()
  }

  public async run(): Promise<void> {
    const message = <intergralMessageTypes>this.instance.receivedData.get('message')
    const richEmbed = new Discord.RichEmbed()
    const commands = Array.from(this.instance.commandsExcludeAliases.keys())
    const commandsText: string[] = []

    commands.map(cmd => {
      const command = <Help>(<unknown>this.instance.commandsExcludeAliases.get(cmd))

      if (command.hidden) {
        return
      }

      commandsText.push(`**${command.cmds}** - ${command.details ? command.details : command.description}`)
    })

    richEmbed.setColor(0x00ae86)
    richEmbed.setDescription(`**Hello, I'm ${env.botName}!**`)
    richEmbed.addField(
      '\u200B',
      'Below you can see all the commands I know\n' +
        'If you need further help with something join our Support Server.\n\n' +
        '**Have a nice day!**',
    )
    richEmbed.addField('scripts', commandsText.join('\n'))
    richEmbed.addField(
      '\u200B',
      '**Use =help <Category> for more information about a category.**\n' + '**Use =help <Command> for more information about a command.**',
    )

    await message.channel.send(richEmbed).catch(commandLog.error)
  }
}

export default new Help()
