// src/shared/utils/logger.ts
import pino from 'pino'
import { NODE_ENV, LOG_LEVEL } from '../config.js'

const isProduction = NODE_ENV === 'production'

export const logger = pino({
  level: LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  
  transport: !isProduction
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname'
        }
      }
    : undefined,

  base: {
    env: NODE_ENV,
    service: 'ecommerce-api'
  },

  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res
  }
})

export const createModuleLogger = (module: string) => {
  return logger.child({ module })
}

export const logDbOperation = (params: {
  operation: string
  entity: string
  id?: string
  success: boolean
  duration?: number
  error?: Error
}) => {
  const logData = {
    operation: params.operation,
    entity: params.entity,
    entityId: params.id,
    duration: params.duration,
    success: params.success
  }

  if (params.success) {
    logger.info(logData, `${params.operation} ${params.entity} successful`)
  } else {
    logger.error({ ...logData, err: params.error }, `${params.operation} ${params.entity} failed`)
  }
}

export const logUserAction = (params: {
  userId: string
  userType: 'admin' | 'employee' | 'customer'
  action: string
  resource: string
  resourceId?: string
  success: boolean
}) => {
  logger.info(
    {
      userId: params.userId,
      userType: params.userType,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      success: params.success
    },
    `User action: ${params.action} ${params.resource}`
  )
}