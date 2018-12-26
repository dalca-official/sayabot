// src > App > Shard.ts
import * as fs from 'fs'
import * as Discord from 'discord.js'
import { join } from 'path'
import { EventEmitter } from 'events'

import * as pkg from 'package.json'
import * as config from '@/Config/Config.json'
import * as env from '@/Config/Constant.json'
import { Console } from '@/Tools'

import { IDiscordInstance, IDiscordActivity } from '&types/App'
import { intergralMessageTypes } from '&types/Command'
import { Command } from '@/App/Structures/Command'

// Set shard process title (shown in 'qs')
process.title = `${env.botName} v${pkg.version} - ${process.pid}`

const { SHARD_ID: shardId, SHARDS_COUNT: shardCount } = process.env
const shardLog = Console('[Shard]')

const EventManager = new EventEmitter()

class Shard {
  private readonly shardId = Number.parseInt(<string>shardId, 10)
  private readonly shards = Number.parseInt(<string>shardCount, 10)
  private instance: IDiscordInstance
  private readonly eventManager: EventEmitter = EventManager

  public constructor() {
    this.isExistsShard()
      .then(() => {
        this.instance = new Discord.Client({
          shardId: this.shardId,
          shardCount: this.shards,
        })
        this.instance.login(config.token)
        this.instance.receivedData = new Map()
        this.instance.commands = new Discord.Collection()
        this.instance.commandsExcludeAliases = new Discord.Collection()
        this.loadCommand()
        this.bindEvent()
      })
      .catch(shardLog.error)
  }

  private readonly isExistsShard = (): Promise<void> => {
    const existsShard = shardId && shardCount

    return new Promise((resolve, reject) => {
      if (existsShard) {
        resolve()
      } else {
        reject('Could not run Shard directly.')
      }
    })
  }

  private readonly walkSync = (dir: string, fileLikeArray: string[] = []): string[] => {
    const files = fs.readdirSync(dir)

    files.map(file => {
      if (fs.statSync(`${dir}/${file}`).isDirectory()) {
        fileLikeArray = this.walkSync(join(dir, file), fileLikeArray)
      } else {
        fileLikeArray.push(join(dir, file))
      }
    })

    return fileLikeArray
  }

  private readonly setStatus = (status: Discord.PresenceStatus): void => {
    this.instance.user.setStatus(status)
  }

  private readonly setActivity = (activity: string, options?: IDiscordActivity): void => {
    this.instance.user.setActivity(activity, options)
  }

  private readonly abbrNum = (num: number, decPlaces: number): string => {
    // @see https://en.wikipedia.org/wiki/Metric_prefix
    let strNum = String(num).length
    decPlaces = Math.pow(10, decPlaces)

    strNum -= strNum % 3

    return Math.round((num * decPlaces) / Math.pow(10, strNum)) / decPlaces + ' kMGTPE'[strNum / 3]
  }

  private readonly loadCommand = (): void => {
    const commandNames = []
    const commandDir = join(`${__dirname}/Commands`)
    const commandFiles = this.walkSync(commandDir).filter(file => file.includes('.Command') && file.endsWith('.ts'))

    for (const file of commandFiles) {
      const command = require(file).default

      this.instance.commandsExcludeAliases.set(command.cmds, command)
      command.initialise(this.instance)
      command.aliases.unshift(command.cmds)
      commandNames.push(command.cmds)

      // Register command and enable function
      command.aliases.map((cmd: string) => {
        this.instance.commands.set(cmd, command)
      })
    }

    shardLog.log(`Commands Loaded: ${commandNames.join(', ')}`)
    shardLog.log('Commands are ready.')
  }

  private readonly bindEvent = (): void => {
    this.instance.on('ready', () => this.readyClient())
    this.instance.on('message', (message: intergralMessageTypes) => this.onMessage(message))
    this.instance.on('guildMemberAdd', member => {
      shardLog.log(`User ${member.user.username} has joined the server.`)

      const role = member.guild.roles.find('name', 'byNode ( Guest )')
      member.addRole(role)
    })
    this.instance.on('guildMemberRemove', () => {
      /** */
    })
    this.instance.on('warn', shardLog.warn)
    this.instance.on('error', shardLog.error)

    this.eventManager.on('SHUTDOWN', this.shutdown)

    process.on('unhandledRejection', reason => shardLog.error(`Unhandled rejection: ${reason}`))
    process.on('message', (cmd: string) => this.eventManager.emit(cmd))
  }

  private readonly readyClient = (): void => {
    // const botActivty = config.botActivity.replace(/{commandPrefix}/, config.commandPrefix)
    this.setStatus('online')
    this.setActivity(`${this.abbrNum(this.instance.users.size, 1)} Users`, { url: 'https://sayakie.com', type: 'LISTENING' })

    /*
    let interval = true
    setInterval((): void => {
      if (interval) {
        this.setActivity(botActivty)
      } else {
        this.setActivity(`${this.instance.guilds.size} Servers / ${this.instance.users.size} Users`)
      }

      interval = !interval
    }, 5000)
    */

    // prettier-ignore
    shardLog.log(`Logged in as: ${this.instance.user.tag}, with ${this.instance.users.size} users of ${this.instance.guilds.size} servers.`)
  }

  private readonly onMessage = async (message: intergralMessageTypes): Promise<void> => {
    // Ignore all messages from other bots
    // or, Ignore all messages that not start with command prefix
    if (message.author.bot || message.content.indexOf(config.commandPrefix) !== 0) {
      return
    }

    // prettier-ignore
    const args = message.cleanContent.slice(config.commandPrefix.length).trim().split(/\s+/g)
    const command = args.shift().toLowerCase()
    const receivedData = { message, args }

    // Ignore if there are no applicable commands
    if (!this.instance.commands.has(command)) {
      shardLog.log(`${message.author.tag} said ${message} but there are no applicable commands. Ignore...`)
      return
    }

    for (const key of Object.keys(receivedData)) {
      this.instance.receivedData.set(key, (<any>receivedData)[key])
    }

    try {
      await (<Command>(<any>this.instance.commands.get(command))).run()
    } catch (err) {
      await message.channel.send('There was an error while try to run that command!')
      shardLog.error(`The following command cannot be executed, bcz of ${err}`)
    } finally {
      shardLog.log(`${message.author.tag} run the full scripts: ${message}`)
    }
  }

  private readonly send = (cmd: string): void => {
    process.send(cmd)
  }

  private readonly shutdown = async (): Promise<void> => {
    await this.send('DISCONNECTED')
    await this.instance.destroy()
  }
}

export default new Shard()
