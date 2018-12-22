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
    const commandNames: string[] = []
    const commandDir = join(`${__dirname}/Commands`)
    const commandFiles = this.walkSync(commandDir).filter(file => file.includes('.Command') && file.endsWith('.ts'))

    for (const file of commandFiles) {
      const command = require(file).default

      this.instance.commandsExcludeAliases.set(command.cmds, command)
      command.aliases.unshift(command.cmds)

      // Register command and enable function
      command.aliases.map((cmd: string) => {
        this.instance.commands.set(cmd, command)
        commandNames.push(cmd)
      })
    }

    shardLog.log(`Commands Loaded: ${commandNames.join(', ')}`)
    shardLog.log('Commands are ready.')
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
      await message.reply('There was an error while try to run that command!')
      shardLog.error(`Could not run that command: ${config.commandPrefix}${command}, because of: ${err}`)
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
