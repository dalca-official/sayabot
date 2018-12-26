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
      const command = <any>this.instance.commandsExcludeAliases.get(cmd)
      commandsText.push(`**${command.cmds}** - ${command.details ? command.details : command.description}`)
    })

    richEmbed.setColor(0x00ae86)
    richEmbed.addField(
      '\u200B',
      `**Hello, I'm ${
        env.botName
      }!**\n\nBelow you can see all the commands I know\nIf you need further help with something join our Support Server.\nHave a nice day!`,
    )
    richEmbed.addField('scripts', commandsText.join('\n'))
    richEmbed.addField(
      '\u200B',
      '**Use =help <Category> for more information about a category.**\n**Use =help <Command> for more information about a command.**',
    )

    await message.channel.send(richEmbed).catch(commandLog.error)
  }
}

export default new Help()
