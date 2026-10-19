import { isEnabled, write, type LogFields, type LogLevel } from './lib/core'

type Logger = {
  debug: (event: string, fields?: LogFields) => void
  info: (event: string, fields?: LogFields) => void
  warn: (event: string, fields?: LogFields) => void
  error: (event: string, fields?: LogFields) => void
  child: (bound: LogFields) => Logger
}

function createLogger(minimum: LogLevel = 'info', bound: LogFields = {}): Logger {
  function emit(level: LogLevel, event: string, fields: LogFields = {}) {
    if (isEnabled(level, minimum)) {
      write(level, event, { ...bound, ...fields })
    }
  }

  return {
    debug: (event, fields) => emit('debug', event, fields),
    info: (event, fields) => emit('info', event, fields),
    warn: (event, fields) => emit('warn', event, fields),
    error: (event, fields) => emit('error', event, fields),
    child: (extra) => createLogger(minimum, { ...bound, ...extra }),
  }
}

export const logger = createLogger(import.meta.env.DEV ? 'debug' : 'info')
