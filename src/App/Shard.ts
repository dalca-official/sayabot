// src > App > Shard.ts
import * as fs from 'fs'
import * as Discord from 'discord.js'
import { join } from 'path'

import * as pkg from 'package.json'
import * as config from '@/Config/Config.json'
import * as env from '@/Config/Constant.json'
import { Console } from '@/Tools'

import { IDiscordInstance, IDiscordActivity, IBroadcast } from '&types/App'
import { intergralMessageTypes } from '@/@types/Command'
import { Command } from '@/App/Structures/Command'

// Set shard process title (shownin 'qs')
process.title = `${env.botName} v${pkg.version} - ${process.pid}`

const { SHARD_ID: shardId, SHARDS_COUNT: shardCount } = process.env

const shardLog = Console('[Shard]')

class Shard {
  private readonly shardId = Number.parseInt(<string>shardId, 10)
  private readonly shards = Number.parseInt(<string>shardCount, 10)
  private instance: IDiscordInstance

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
    this.instance.on('warn', shardLog.warn)
    this.instance.on('error', shardLog.error)

    process.on('unhandledRejection', reason => shardLog.error(`Unhandled rejection: ${reason}`))
    process.on('SIGTERM', this.shutdown)
    process.on('SIGINT', this.shutdown)
    process.on('message', ({ cmd }: IBroadcast) => {
      switch (cmd) {
        case 'SHUTDOWN':
          this.shutdown()
            .then(() => {
              this.emit({ cmd: 'DISCONNECTED' })
              process.exit(0)
            })
            .catch(() => {
              shardLog.error('There was an error while shutdown the Discord Instance')

              this.emit({ cmd: 'FORCE_DISCONNECTED' })
              process.exit(0)
            })
          break
        default:
          shardLog.warn(`Unknown command received from master. Entire comamnd: ${cmd}`)
          break
      }
    })
  }

  private readonly readyClient = (): void => {
    let interval = true
    this.setStatus('online')

    setInterval((): void => {
      if (interval) {
        this.setActivity(config.botActivity)
      } else {
        this.setActivity(`${this.instance.guilds.size} Servers / ${this.instance.users.size} Users`)
      }

      interval = !interval
    }, 5000)

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
      // @ts-ignore
      this.instance.receivedData.set(key, receivedData[key])
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

  private readonly emit = ({ cmd, data }: IBroadcast): void => {
    process.send({ cmd, data })
  }

  private readonly shutdown = async (): Promise<void> => {
    await this.instance.destroy()
  }
}

export default new Shard()
