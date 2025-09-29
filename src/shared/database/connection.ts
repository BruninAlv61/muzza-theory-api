// src/shared/database/connection.ts
import { createClient } from '@libsql/client'
import { DB_TOKEN, DB_URL } from '../config.js'

export const db = createClient({
  url: DB_URL as string,
  authToken: DB_TOKEN
})