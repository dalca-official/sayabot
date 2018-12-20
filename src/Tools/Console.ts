import chalk from 'chalk'

class Console {
  private static readonly out = (type: string, ...params: any[]) => {
    if (!params.length) {
      console.log()
      return
    }

    console.log(type, chalk.white(...params))
  }

  public static readonly info = (...params: any[]) => Console.out(chalk.green('INFO'), ...params)
  public static readonly warn = (...params: any[]) => Console.out(chalk.yellow('WARN'), ...params)
  public static readonly error = (...params: any[]) => Console.out(chalk.red('ERR！'), ...params)

  public static readonly log = Console.info
}

export const ConsoleBuilder = (prefix: string) => ({
  log(...messages: any[]) {
    Console.log(prefix, ...messages)
  },
  info(...messages: any[]) {
    Console.info(prefix, ...messages)
  },
  warn(...messages: any[]) {
    Console.warn(prefix, ...messages)
  },
  error(...messages: any[]) {
    Console.error(prefix, ...messages)
  },
})
