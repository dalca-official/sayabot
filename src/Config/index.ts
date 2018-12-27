// src > Config > index.ts
import * as dotEnv from 'dotenv'
import { Console } from '@/Tools'

import { IConfig } from '&types/App'

const configLog = Console('[Config]')

export class Config {
  public static readonly initialise = ({ path }: IConfig): void => {
    configLog.log('Initialise the config')
    process.env = <NodeJS.ProcessEnv>dotEnv.config({ path }).parsed
  }
}
