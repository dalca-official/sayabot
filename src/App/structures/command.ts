// src > App > Structures > Command.ts
import { IDiscordInstance } from '&types/App'

export abstract class Command {
  /** Discord Instance */
  protected instance: IDiscordInstance

  /** Name of this command */
  protected cmds: string

  /** Aliases for this command */
  protected aliases: string[]

  /** Short description of the command  */
  protected description: string

  /** Long description of the command  */
  protected details: string

  /** Whether the command only be run in a guild channel */
  protected guildOnly: boolean

  /** Whether the command only be used by an owner */
  protected ownerOnly: boolean

  /** Whether the command only be used in NSFW channel */
  protected nsfw: boolean

  protected constructor() {
    this.aliases = []
  }

  protected initialise(instance: IDiscordInstance): void {
    this.instance = instance
  }

  protected hasPermission(): void {
    // if (this.ownerOnly)
  }

  public abstract async run(): Promise<void>
}
