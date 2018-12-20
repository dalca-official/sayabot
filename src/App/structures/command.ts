import { IRun } from '&types/Command'

export abstract class Command {
  public name: string
  public description: string
  public aliases: object

  constructor() {
    this.name = null
    this.description = null
    this.aliases = []
  }

  // prettier-ignore
  // tslint:disable-next-line
  public abstract async run({ instance, message, args }: IRun): Promise<void>
}
