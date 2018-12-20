import chalk from 'chalk'

import { Console } from '@/Tools'

const coreLog = Console('Core')

export class Measure {
  private static beginTime: number
  private static endTime: number
  private static period: number
  private static readonly startMeasurement = (): number => (Measure.beginTime = Date.now())
  private static readonly endMeasurement = (): number => (Measure.endTime = Date.now())
  private static readonly calculateTime = (): number => (Measure.period = Measure.endTime - Measure.beginTime)

  public static readonly time = async (label: string, fn: () => void | Promise<void>): Promise<void> => {
    Measure.startMeasurement()
    await fn()
    Measure.endMeasurement()
    Measure.calculateTime()

    if (Measure.period > 250) {
      coreLog.warn(`The task ${chalk.blue(label)} takes ${Measure.period}ms.`)
    }
  }
}
