// src > App > @types > Command.ts
import * as Discord from 'discord.js'
import { IDiscordInstance } from '&types/App'

export type intergralMessageTypes = Discord.Message & Discord.Emoji

export interface IRun {
  instance: IDiscordInstance
  message: intergralMessageTypes
  args: string[]
}
