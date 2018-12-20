import * as fs from 'fs'
import * as Discord from 'discord.js'
import { join } from 'path'

import * as pkg from 'package.json'
import * as config from '@/Config/Config.json'
import * as env from '@/Config/Constant.json'
import { Console } from '@/Tools'

import { IDiscordInstance, IDiscordActivity, IBroadcast } from '&types/App'
import { intergralMessageTypes } from '@/@types/Command'

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
        this.instance.commands = new Discord.Collection()
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

  private readonly setStatus = (status: Discord.PresenceStatus): void => {
    this.instance.user.setStatus(status)
  }

  private readonly setActivity = (activity: string, options?: IDiscordActivity): void => {
    this.instance.user.setActivity(activity, options)
  }

  private readonly loadCommand = (): void => {
    const commandFiles = fs
      .readdirSync(join(`${__dirname}/commands`))
      .filter(file => file.includes('.Command') && file.endsWith('.ts'))

    for (const file of commandFiles) {
      const command = require(join(`${__dirname}/commands/${file}`)).default

      command.aliases.unshift(command.name)

      // Register command
      command.aliases.map((cmd: string) => {
        this.instance.commands.set(cmd, command)
        shardLog.log(`Command ${cmd} loaded.`)
      })
    }
  }

  private readonly bindEvent = (): void => {
    this.instance.on('ready', () => this.readyClient())
    this.instance.on('message', (message: intergralMessageTypes) => this.onMessage(message))
    this.instance.on('warn', shardLog.warn)
    this.instance.on('error', shardLog.error)

    process.on('unhandledRejection', reason => shardLog.error(`Unhandled rejection: ${reason}`))
    process.on('message', ({ cmd }: IBroadcast) => {
      shardLog.log(`Received command ${cmd} from master`)

      switch (cmd) {
        case 'shutdown':
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
    this.setStatus('online')
    this.setActivity(config.botActivity)

    // prettier-ignore
    shardLog.log(`Logged in as: ${this.instance.user.tag}, with ${this.instance.users.size} users of ${this.instance.guilds.size} servers.`)
  }

  private readonly onMessage = async (message: intergralMessageTypes): Promise<void> => {
    // Ignore all private messages
    // or, Ignore all message from other bots
    // or, Ignore all messages that not start with command prefix
    if (!message.guild || message.author.bot || message.content.indexOf(config.commandPrefix) !== 0) return

    const args = message.content
      .slice(config.commandPrefix.length)
      .trim()
      .split(/ +/g)
    const command = args.shift().toLowerCase()

    // Ignore if there are no applicable commands
    if (!this.instance.commands.has(command)) return

    try {
      await (<any>this.instance.commands.get(command)).run({ instance: this.instance, message, args })
    } catch (err) {
      shardLog.error(`Could not run that command: ${config.commandPrefix}${command}, because of: ${err}`)
      message.reply('There was an error while try to run that command!')
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
