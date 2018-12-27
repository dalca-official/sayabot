declare module 'simple-youtube-api' {
  class Video {
    constructor(youtube: YouTube, data: string)
    private _patch(data: object): void
    public readonly title: string

    public maxRes(): object
    public url(): string
    public shortURL(): string
    public durationSeconds(): number
    public fetch(options: object): Video
    public static extractID(url: string): string
  }

  class Playlist {
    constructor(youtube: YouTube, data: object)
    private _patch(data: object): void
    public readonly channel: Channel
    public readonly title: string
    public readonly description: string
    public readonly publishedAt: Date
    public readonly thumbnails: any
    public readonly channelTitle: string
    public readonly defaultLanguage: string
    public readonly localized: { title: string; description: string }
    public readonly privacy: string
    public readonly length: number
    public readonly embedHTML: string

    public url(): string
    public fetch(options: object): Playlist
    public getVideos(limit?: number, options?: object): Promise<Video[]>
    public static extractID(url: string): string
  }

  class Channel {
    constructor(youtube: YouTube, data: object)
    private _patch(data: object): void

    public url(): string
    public fetch(options: object): Channel
    public static extractID(url: string): string
  }

  /**
   * The YouTube API module
   */
  class YouTube {
    constructor(key: string)

    public getVideo(url: string, options?: object): Promise<Video>
    public getVideoByID(id: string, options?: object): Promise<Video>
    public getPlaylist(url: string, options?: object): Promise<Playlist>
    public getPlaylistByID(id: string, options?: object): Promise<Playlist>
    public getChannel(url: string, options?: object): Promise<Channel>
    public getChannelByID(id: string, options?: object): Promise<Channel>
    public search(query: string, limit?: number, options?: object): Promise<Array<Video | Playlist | Channel | null>>
    public searchVideos(query: string, limit?: number, options?: object): Promise<Video[]>
    public searchPlaylists(query: string, limit?: number, options?: object): Promise<Playlist[]>
    public searchChannels(query: string, limit?: number, options?: object): Promise<Channel[]>
  }

  export = YouTube
}
