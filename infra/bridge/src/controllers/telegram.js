'use strict'

const express = require('express')
const router = express.Router()

const { telegramAttestation } = require('../utils/validation')

const { redisClient, getbitAsync } = require('../utils/redis')

router.post('/generate-code', telegramAttestation, async (req, res) => {
  const identity = req.query.identity.toLowerCase()

  // Store IP to redis
  redisClient.set(`telegram/attestation/${identity}`, JSON.stringify({
    ip: req.ip
  }), 'EX', 60 * 30)

  res.send({
    code: identity
  })
})

router.get('/status', telegramAttestation, async (req, res) => {
  const identity = req.query.identity.toLowerCase()
  
  const value = await getbitAsync(`telegram/attestation/${identity}/completed`, 0)

  res.status(200)
    .send({
      success: value === 1
    })
})

module.exports = router
