// src > App > Commands > Music > music.Command.ts
// import * as Youtube from 'simple-youtube-api'

// import * as config from '@/Config/Config.json'
import { Command } from '@/App/Structures/Command'

// import { intergralMessageTypes } from '&types/Command'

class Music extends Command {
  // private readonly youtube = new Youtube(config.youtubeAPI)

  constructor() {
    super()

    this.cmds = 'music'
    this.aliases = ['m']
    this.description = 'Ping? pong!'
    this.guildOnly = true
  }

  /*
  public async run(): Promise<void> {
    this.message = <intergralMessageTypes>this.instance.receivedData.get('message')
    this.args = <string[]>this.instance.receivedData.get('args')

    const musicSubCommand = this.args[0]
    const url = this.args[1] ? this.args[1].replace(/<(.+)>/g, '$1') : ''

    switch (musicSubCommand) {
      case 'play':
        await this.play(url)
        break
      default:
        return
    }
  }

  private readonly play = async (url: string): Promise<void> => {
    const voiceChannel = this.message.member.voiceChannel
    if (!voiceChannel) {
      await this.message.channel.send(`I'm sorry but you need to be in a voice channel to play music!`)
      return
    }

    const permissions = voiceChannel.permissionsFor(this.message.client.user)
    if (!permissions.has('CONNECT')) {
      await this.message.channel.send(`I cannot connect to your voice channel! Make sure I have the proper permissions!`)
      return
    }

    if (!permissions.has('SPEAK')) {
      await this.message.channel.send(`I cannot speak in this voice channel! Make sure I have the proper permissions!`)
      return
    }

    if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
      const playlist = await this.youtube.getPlaylist(url)
      const videos = await playlist.getVideos()

      videos.map(async (video: any) => {
        const vid = await this.youtube.getVideoById(video.id)
        await vid.a()
      })
    }
  }
  */
}

export default new Music()
