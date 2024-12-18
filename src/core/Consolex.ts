import { EventBus } from "./EventBus"
import { LogSeverity } from "./Schemas"
import { SendLogEvent } from "../client/Transport"

export const consolex = {
    log: console.log,
    warn: console.warn,
    error: console.error
}

let inited = false

// Only call this in client/browser!
export function initRemoteSender(eventBus: EventBus) {
    if (inited) {
        return
    }
    inited = true

    consolex.log = (...args: any[]): void => {
        console.log(...args);
        eventBus.emit(new SendLogEvent(LogSeverity.Info, args.join(' ')))
    }

    consolex.warn = (...args: any[]): void => {
        console.warn(...args);
        eventBus.emit(new SendLogEvent(LogSeverity.Warn, args.join(' ')))
    }

    consolex.error = (...args: any[]): void => {
        console.error(...args);
        eventBus.emit(new SendLogEvent(LogSeverity.Error, args.join(' ')))
    }
}