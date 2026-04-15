import cron from 'node-cron'
import { logger } from '../lib/logger.js'
import { runReminderIntegrityJob, runReminderStatusJob } from './reminder.jobs.js'

let started = false

export function startJobs() {
  if (started) return
  started = true

  cron.schedule('0 1 * * *', async () => {
    logger.info('Running reminder status job')
    await runReminderStatusJob()
  })

  cron.schedule('30 1 * * *', async () => {
    logger.info('Running reminder integrity job')
    await runReminderIntegrityJob()
  })
}
