// Cron job scheduler.

const path = require('path')
const Queue = require('bull')
const logger = require('./logger')

require('dotenv').config()
try {
  require('envkey')
  logger.info('Envkey configured')
} catch (error) {
  logger.error('EnvKey not configured')
}

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379'

/**
 * Helper function to log events emitted by a queue.
 * @param queue
 */
function watch(queue) {
  queue
    .on('error', function(error) {
      // An error occured.
      logger.error(`Queue ${queue.name} error:`, error, ' Stack:', error.stack)
    })
    .on('waiting', function(jobId) {
      // A Job is waiting to be processed as soon as a worker is idling.
      logger.info(`Job ${jobId} waiting.`)
    })
    .on('active', function(job) {
      // A job has started. You can use `jobPromise.cancel()`` to abort it.
      logger.info(`Job ${job.id} active.`)
    })
    .on('stalled', function(job) {
      // A job has been marked as stalled. This is useful for debugging job
      // workers that crash or pause the event loop.
      logger.info(`Job ${job.id} stalled.`)
    })
    .on('progress', function(job, progress) {
      // A job's progress was updated!
      logger.info(`Job ${job.id} progress:${progress}.`)
    })
    .on('completed', function(job, result) {
      // A job successfully completed with a `result`.
      logger.info(`Job ${job.id} completed. result:`, result)
    })
    .on('failed', function(job, err) {
      // A job failed with reason `err`!
      logger.error(`Job ${job.id} failed:.`, err)
    })
    .on('paused', function() {
      // The queue has been paused.
      logger.info(`Queue ${queue.name} paused.`)
    })
    .on('resumed', function(job) {
      // The queue has been resumed.
      logger.info(`Queue ${queue.name} resumed. id:`, job.id)
    })
    .on('cleaned', function(jobs, types) {
      // Old jobs have been cleaned from the queue. `jobs` is an array of cleaned
      // jobs, and `type` is the type of jobs cleaned.
      logger.info(`Queue ${queue.name} cleaned. jobs:`, jobs, ' types:', types)
    })
    .on('drained', function() {
      // Emitted every time the queue has processed all the waiting jobs
      // (even if there can be some delayed jobs not yet processed)
      logger.info(`Queue ${queue.name} drained.`)
    })
    .on('removed', function(job) {
      // A job successfully removed.
      logger.info(`Job ${job.id} removed.`)
    })
}

/**
 * MAIN
 */
logger.info('Starting cron scheduler loop.')

const jobsPath = path.dirname(__filename) + '/jobs/'

// Franck 08/07/2019 Deactivating this job since not currently used.
// Growth verifier job. Runs daily at 20:00UTC (~noon PST).
// const growthVerifyEventsQueue = new Queue('growthVerifyEvents', redisUrl)
// watch(growthVerifyEventsQueue)
// growthVerifyEventsQueue.process(jobsPath + 'growthVerifyEvents.js')
// growthVerifyEventsQueue.add(
//  { persist: false },
//  { repeat: { cron: '* 20 * * *' } }
// )
// logger.info('Scheduled growthVerifyEvents job.')

// Franck 08/07/2019 Deactivating this job since not currently used.
// Growth campaign update job. Runs daily at 20:30UTC (~12:30 PST).
// const growthUpdateCampaignsQueue = new Queue('growthUpdateCampaigns', redisUrl)
// watch(growthUpdateCampaignsQueue)
// growthUpdateCampaignsQueue.process(jobsPath + 'growthUpdateCampaigns.js')
// growthUpdateCampaignsQueue.add(
//  { persist: false },
//  { repeat: { cron: '30 20 * * *' } }
// )
// logger.info('Scheduled growthUpdateCampaigns job.')

// Consistency checker job job. Runs daily at 23:30UTC
const consistencyQueue = new Queue('consistencyChecker', redisUrl)
watch(consistencyQueue)
consistencyQueue.process(jobsPath + 'consistency.js')
consistencyQueue.add({ persist: false }, { repeat: { cron: '30 23 * * *' } })
logger.info('Scheduled consistencyChecker job.')

// Revert checker job.  Runs daily at 23:00UTC
const revertAlertQueue = new Queue('revertAlert', redisUrl)
watch(revertAlertQueue)
revertAlertQueue.process(jobsPath + 'revertAlertJob.js')
revertAlertQueue.add({ persist: false }, { repeat: { cron: '0 23 * * *' } })
logger.info('Scheduled revertAlert job.')
