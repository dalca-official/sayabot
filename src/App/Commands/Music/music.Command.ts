// src > App > Commands > Music > music.Command.ts
import * as Discord from 'discord.js'
// @ts-ignore
import * as YouTube from 'simple-youtube-api'
import * as ytdl from 'ytdl-core'

import * as config from '@/Config/Config.json'
import { Command } from '@/App/Structures/Command.Structure'
import { Console } from '@/Tools'

const commandLog = Console('[Command]')

import { intergralMessageTypes } from '&types/Command'

interface IQueueConstruct {
  textChannel: Discord.TextChannel | Discord.DMChannel | Discord.GroupDMChannel
  voiceChannel: Discord.VoiceChannel
  connection: any
  songs: any[]
  volume: number
  playing: boolean
}

class Music extends Command {
  private queue = new Map()
  private voiceChannel: Discord.VoiceChannel
  private readonly youtube = new YouTube(config.youtubeAPI)

  constructor() {
    super()

    this.cmds = 'music'
    this.aliases = ['m']
    this.description = 'Ping? pong!'
    this.guildOnly = true
  }

  public async run(): Promise<void> {
    this.message = <intergralMessageTypes>this.instance.receivedData.get('message')
    this.args = <string[]>this.instance.receivedData.get('args')

    const musicSubCommand = this.args[0]
    const url = this.args[1] ? this.args[1].replace(/<(.+)>/g, '$1') : ''

    switch (musicSubCommand) {
      case 'play':
        await this.play(url)
        break
      case 'skip':
        await this.skip()
        break
      default:
        return
    }
  }

  private readonly play = async (url: string): Promise<void> => {
    this.voiceChannel = this.message.member.voiceChannel
    if (!this.voiceChannel) {
      await this.message.channel.send(`I'm sorry but you need to be in a voice channel to play music!`)
      return
    }

    const permissions = this.voiceChannel.permissionsFor(this.message.client.user)
    if (!permissions.has('CONNECT')) {
      await this.message.channel.send('I cannot connect to your voice channel! Make sure I have the proper permissions!')
      return
    }

    if (!permissions.has('SPEAK')) {
      await this.message.channel.send('I cannot speak in this voice channel! Make sure I have the proper permissions!')
      return
    }

    if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
      const playlist = await this.youtube.getPlaylist(url)
      const videos = await playlist.getVideos()

      videos.map(async (video: any) => {
        const vid = await this.youtube.getVideoByID(video.id)
        await this.handleVideo(vid, true)
      })

      this.message.channel.send(`✅ Playlist: **${playlist.title}** has been added to the queue!`)
      return
    } else {
      let video
      let response
      try {
        video = await this.youtube.getVideo(url)
      } catch (err) {
        try {
          const videos = await this.youtube.searchVideos(this.args.join(' '), 10)
          let index = 0
          this.message.channel.send(`
__**Song selection:**__
${videos.map(video2 => `**${++index} -** ${video2.title}`).join('\n')}
Please provide a value to select one of the search results ranging from 1-10.
        `)
          try {
            response = await this.message.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
              maxMatches: 1,
              time: 10000,
              errors: ['time'],
            })
          } catch (err) {
            commandLog.error(err)
            this.message.channel.send('No or invalid value entered, cancelling video selection.')
            return
          }
          // tslint:disable-next-line:radix
          const videoIndex = parseInt(response.first().content)
          // @ts-ignore
          video = await this.youtube.getVideoByID(videos[videoIndex - 1].id)
        } catch (err) {
          commandLog.error(err)
          this.message.channel.send('🆘 I could not obtain any search results.')
          return
        }
      }

      this.handleVideo(video)
    }
  }

  private readonly skip = async (): Promise<void> => {
    if (!this.message.member.voiceChannel) {
      await this.message.channel.send('You are not in a voice channel!')
      return
    }

    const serverQueue = this.queue.get(this.message.guild.id)
    if (!serverQueue) {
      await this.message.channel.send('There is nothing playing that I could skip for you.')
      serverQueue.connection.dispatcher.end('Skip command has been used!')
      return
    }
  }

  private readonly handleVideo = async (video: any, playlist: boolean = false): Promise<void> => {
    const serverQueue = this.queue.get(this.message.guild.id)
    commandLog.log(video)

    const song = {
      id: video.id,
      title: Discord.Util.escapeMarkdown(video.title),
      url: `https://www.youtube.com/watch?v=${video.id}`,
    }

    if (!serverQueue) {
      // @ts-ignore
      const queueConstruct: IQueueConstruct = {
        textChannel: this.message.channel,
        voiceChannel: this.voiceChannel,
        connection: null,
        songs: [],
        volume: 5,
        playing: true,
      }

      this.queue.set(this.message.guild.id, queueConstruct)
      queueConstruct.songs.push(song)

      try {
        const connection = await this.voiceChannel.join()
        queueConstruct.connection = connection

        this.playVideo(queueConstruct.songs[0])
      } catch (err) {
        commandLog.error(`I could not join the voice channel: ${err}`)
        this.queue.delete(this.message.guild.id)
        this.message.channel.send('I could not join the voice channel!')
        return
      }
    } else {
      serverQueue.songs.push(song)
      commandLog.log(serverQueue.songs)

      if (playlist) {
        return undefined
      } else {
        this.message.channel.send(`✅ **${song.title}** has been added to the queue!`)
        return
      }
    }

    return undefined
  }

  private readonly playVideo = (song: any) => {
    const serverQueue = this.queue.get(this.message.guild.id)

    if (!song) {
      this.voiceChannel.leave()
      this.queue.delete(this.message.guild.id)
      return
    }

    const dispatcher = serverQueue.connection
      .playStream(ytdl(song.url))
      .on('end', (reason: string) => {
        if (reason === 'Stream is not generating quickly enough.') {
          this.message.channel.send('Song ended')
        } else {
          commandLog.log(reason)
        }

        serverQueue.songs.shift()
        this.playVideo(serverQueue.songs[0])
      })
      .on('error', commandLog.error)

    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5)
    this.message.channel.send(`🎶 Start playing: **${song.title}**`)
  }
}

export default new Music()
