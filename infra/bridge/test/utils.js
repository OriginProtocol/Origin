'use strict'

const chai = require('chai')
const expect = chai.expect
const request = require('supertest')
const redis = require('redis')

const Identity = require('@origin/identity/src/models').Identity
const app = require('../src/app')

const baseIdentity = {
  ethAddress: '0x000'
}

const client = redis.createClient()

describe('identity exists', () => {
  beforeEach(() => {
    Identity.destroy({
      where: {},
      truncate: true
    })
  })

  it('should return 200 for existing email', async () => {
    const obj = { email: 'foobar@originprotocol.com' }

    await Identity.create({ ...obj, ...baseIdentity })

    const response = await request(app)
      .post('/utils/exists')
      .send(obj)

    expect(response.status).to.equal(200)
  })

  it('should return 200 for existing phone', async () => {
    const obj = { phone: '1234567' }

    await Identity.create({ ...obj, ...baseIdentity })

    const response = await request(app)
      .post('/utils/exists')
      .send(obj)

    expect(response.status).to.equal(200)
  })

  it('should return 204 for non-existent email', async () => {
    const response = await request(app)
      .post('/utils/exists')
      .send({ email: 'foobar@originprotocol.com' })

    expect(response.status).to.equal(204)
  })

  it('should return 204 for non-existent phonen', async () => {
    const response = await request(app)
      .post('/utils/exists')
      .send({ phone: '1234567' })

    expect(response.status).to.equal(204)
  })

  it('should return 400 for bad request', async () => {
    const response = await request(app)
      .post('/utils/exists')
      .send({ foo: 'bar' })

    expect(response.status).to.equal(400)
  })
})

describe('exchange rate poller', () => {
  beforeEach(() => {
    client.del('ETH_USD_price')
    process.env.FALLBACK_EXCHANGE_RATE = '12345.6789'
  })

  it('should return exchange rate from redis', async () => {
    await client.set('ETH_USD_price', '234')
    const response = await request(app)
      .get('/utils/exchange-rate')
      .expect(200)

    expect(response.status).to.equal(200)
    expect(response.body.price).to.equal('234')
  })

  it('should return default exchange rate if not cached', async () => {
    const response = await request(app)
      .get('/utils/exchange-rate')
      .expect(200)

    expect(response.status).to.equal(200)
    expect(response.body.price).to.equal('12345.6789')
  })
})
