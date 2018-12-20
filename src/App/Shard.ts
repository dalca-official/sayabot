import * as Discord from 'discord.js'

import * as pkg from 'package.json'
import * as config from '@/Config/Config.json'
import * as env from '@/Config/Constant.json'
import { Console } from '@/Tools'

import { IDiscordActivity } from '&types/App'

// Set shard process title (shownin 'qs')
process.title = `${env.botName} v${pkg.version} - ${process.pid}`

const { SHARD_ID: shardId, SHARDS_COUNT: shardCount } = process.env

const shardLog = Console('[Shard]')
process.on('message', message => console.log(message))

class Shard {
  private readonly shardId = Number.parseInt(<string>shardId, 10)
  private readonly shards = Number.parseInt(<string>shardCount, 10)
  private instance: Discord.Client

  public constructor() {
    this.isExistsShard()
      .then(() => {
        this.instance = new Discord.Client({
          shardId: this.shardId,
          shardCount: this.shards,
        })
        this.instance.login(config.token)
        this.bindEvent()
      })
      .catch(err => {
        shardLog.error(`Abnormal appraoch: ${err}`)
        process.exit(0)
      })
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

  private readonly bindEvent = (): void => {
    this.instance.on('ready', () => this.readyClient())
    this.instance.on('message', message => this.onMessage(message))
  }

  private readonly readyClient = (): void => {
    this.setStatus('online')
    this.setActivity(config.botActivity)

    // prettier-ignore
    shardLog.log(`Logged in as: ${this.instance.user.tag}, with ${this.instance.users.size} users of ${this.instance.guilds.size} servers.`)
  }

  private readonly onMessage = async (message: Discord.Message): Promise<void> => {
    // Ignore all private messages
    // or, Ignore all message from other bots
    // or, Ignore all messages that not start with command prefix
    if (!message.guild || message.author.bot || message.content.indexOf(config.prefix) !== 0) return

    const args = message.content
      .slice(config.prefix.length)
      .trim()
      .split(/ +/g)
    const command = args.shift().toLowerCase()
  }
}

export default new Shard()
