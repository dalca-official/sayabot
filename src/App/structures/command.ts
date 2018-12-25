// src > App > Structures > Command.ts
import { IDiscordInstance } from '&types/App'
import { intergralMessageTypes } from '&types/Command'

export abstract class Command {
  /** Discord Instance */
  protected instance: IDiscordInstance

  /** Received message */
  protected message: intergralMessageTypes

  /** Received args */
  protected args: string[]

  /** Name of this command */
  protected cmds: string

  /** Aliases for this command */
  protected aliases: string[]

  /** Short description of the command  */
  protected description: string

  /** Long description of the command  */
  protected details: string

  /** Usage format string of the command */
  protected format: string

  /** Whether the command only be run in a guild channel */
  protected guildOnly: boolean

  /** Whether the command only be used by an owner */
  protected ownerOnly: boolean

  /** Whether the command only be used in NSFW channel */
  protected nsfw: boolean

  /** Whether the command should be hidden from the help command */
  protected hidden: boolean

  protected constructor() {
    this.aliases = []
  }

  protected initialise(instance: IDiscordInstance): void {
    this.instance = instance
  }

  /** Hide this command from the help command */
  protected hide(): void {
    this.hidden = true
  }

  protected hasPermission(): void {
    // if (this.ownerOnly)
  }

  /** Runs the command */
  public async run(): Promise<void> {
    throw new Error(`${this.constructor.name} command does not have a run() method.`)
  }
}
