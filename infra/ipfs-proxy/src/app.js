const Busboy = require('busboy')
const fileType = require('file-type')
const isJSON = require('is-json')
const http = require('http')
const httpProxy = require('http-proxy')
const request = require('superagent')
const zlib = require('zlib')

const config = require('./config')
const logger = require('./logger')

const validImageTypes = [
  'image/jpeg',
  'image/pjpeg',
  'image/gif',
  'image/png',
  'image/vnd.microsoft.icon',
  'image/x-icon',
  // Not valid but sometimes used for icons
  'image/ico',
  'image/icon'
]

const clusterEndpointPrefixes = [
  '/id',
  '/version',
  '/peers',
  '/add',
  '/allocations',
  '/pins',
  '/health'
]

const validVideoTypes = ['video/mp4']

function isValidFile(buffer) {
  return (
    isValidImage(buffer) || isValidVideo(buffer) || isJSON(buffer.toString())
  )
}

function isValidImage(buffer) {
  const file = fileType(buffer)
  return file && validImageTypes.includes(file.mime)
}

function isValidVideo(buffer) {
  const file = fileType(buffer)
  return file && validVideoTypes.includes(file.mime)
}

function isClusterAPIRequest(req) {
  return (
    config.IPFS_CLUSTER_API_URL &&
    clusterEndpointPrefixes.some(pref => req.url.startsWith(pref))
  )
}

function authenticatedRequest(func, req, res, opts) {
  if (typeof config.SHARED_SECRETS === 'undefined') {
    logger.debug('SHARED_SECRETS is not defined')
    res.writeHead(401, { Connection: 'close' })
    res.end()
    return
  }

  if (req.headers['authorization']) {
    const parts = req.headers['authorization'].split(' ')
    if (parts.length === 2 && ['Bearer', 'Basic'].includes(parts[0])) {
      let token = parts[1]

      if (parts[0] === 'Basic') {
        const authString = Buffer.from(parts[1], 'base64').toString('ascii')
        if (!authString.includes(':')) {
          logger.debug(`401: auth string bad formatting: ${authString}`)
          res.writeHead(401, { Connection: 'close' })
          res.end()
          return
        }
        token = authString.split(':')[1].trim()
      }

      const secrets = config.SHARED_SECRETS.split(',')

      if (secrets.includes(token)) {
        func(req, res, opts)
        return
      }
    }
  }

  logger.debug(`401: not authenticated`)
  res.writeHead(401, { Connection: 'close' })
  res.end()
  return
}

function handleFileUpload(req, res) {
  let busboy

  try {
    busboy = new Busboy({
      headers: req.headers,
      limits: {
        fileSize: 3 * 1024 * 1024
      }
    })
  } catch (error) {
    // Busboy failed to parse request, missing headers?
    logger.error(`Malformed request: ${error}`)
    res.writeHead(400, { Connection: 'close' })
    res.end()
    return
  }

  busboy.on('file', function(fieldname, file) {
    logger.debug(`New file: ${fieldname}`)

    file.fileRead = []

    file.on('data', function(chunk) {
      file.fileRead.push(chunk)
    })

    file.on('limit', function() {
      logger.warn(`File upload too large`)
      res.writeHead(413, { Connection: 'close' })
      res.end()
      req.unpipe(req.busboy)
    })

    file.on('end', function() {
      const buffer = Buffer.concat(file.fileRead)

      if (!isValidFile(buffer)) {
        logger.warn(`Upload of invalid file type attempted`)
        res.writeHead(415, { Connection: 'close' })
        res.end()
        req.unpipe(req.busboy)
      } else {
        const url = config.IPFS_API_URL + req.url
        logger.debug(`Sending file to ${url}`)
        request
          .post(url)
          .set(req.headers)
          .attach('file', buffer)
          .then(
            response => {
              let responseData = response.text
              if (response.headers['content-encoding'] === 'gzip') {
                // Compress the response so the header is correct if necessary
                responseData = zlib.gzipSync(response.text)
              } else if (response.headers['content-encoding'] === 'deflate') {
                responseData = zlib.deflateSync(response.text)
              }
              res.writeHead(response.status, response.headers)
              res.end(responseData)
            },
            error => {
              logger.error(`An error occurred proxying request to IPFS`)
              logger.error(error)
              res.writeHead(500, { Connection: 'close' })
              res.end()
            }
          )
      }
    })
  })

  req.pipe(busboy)
}

function handleForward(req, res, opts) {
  // Simple HTTP request proxy forward
  proxy.web(req, res, {
    target: opts && opts.url ? opts.url : config.IPFS_GATEWAY_URL,
    selfHandleResponse: true
  })
}

function handleGatewayForward(req, res, opts) {
  // Proxy Gateway requests
  handleForward(req, res, {
    url: opts && opts.url ? opts.url : config.IPFS_GATEWAY_URL
  })
}

function handleAPIForward(req, res, opts) {
  // Proxy API requests to API endpoint
  handleForward(req, res, {
    url: opts && opts.url ? opts.url : config.IPFS_API_URL
  })
}

const proxy = httpProxy.createProxyServer({})

// Validate downloads. It is necessary to inspect the file type for downloads
// because it is possible to add IPFS content to a peer and request it using an
// Origin IPFS server which would cause it to be available.
proxy.on('proxyRes', (proxyResponse, req, res) => {
  let buffer = []

  proxyResponse.on('data', data => {
    buffer.push(data)
  })

  proxyResponse.on('end', () => {
    buffer = Buffer.concat(buffer)

    if (isValidFile(buffer) || isClusterAPIRequest(req)) {
      res.writeHead(proxyResponse.statusCode, proxyResponse.headers)
      res.end(buffer)
    } else {
      res.writeHead(415, { Connection: 'close' })
      res.end()
    }
  })
})

proxy.on('error', err => {
  logger.error(err)
})

const server = http
  .createServer((req, res) => {
    logger.info(req.url)
    if (req.url.startsWith('/api/v0/add')) {
      handleFileUpload(req, res)
    } else if (req.url.startsWith('/api/v0')) {
      authenticatedRequest(handleAPIForward, req, res)
    } else if (req.url.startsWith('/ipfs') || req.url.startsWith('/ipns')) {
      handleGatewayForward(req, res)
    } else {
      if (req.url.startsWith('/add')) {
        authenticatedRequest(handleAPIForward, req, res, {
          url: config.IPFS_CLUSTER_API_URL,
          validate: false
        })
      } else if (isClusterAPIRequest(req)) {
        authenticatedRequest(handleAPIForward, req, res, {
          url: config.IPFS_CLUSTER_API_URL
        })
      } else {
        res.writeHead(404, { Connection: 'close' })
        res.end()
      }
    }
  })
  .listen(config.IPFS_PROXY_PORT, config.IPFS_PROXY_ADDRESS)

logger.debug(`Listening on ${config.IPFS_PROXY_PORT}`)
logger.debug(`Proxying to IPFS gateway ${config.IPFS_GATEWAY_URL}`)
logger.debug(`Proxying to IPFS API ${config.IPFS_API_URL}`)
if (config.IPFS_CLUSTER_API_URL) {
  logger.debug(`Proxying to IPFS Cluster API ${config.IPFS_CLUSTER_API_URL}`)
}

process.on('SIGINT', function() {
  logger.debug('\nGracefully shutting down from SIGINT (Ctrl+C)')
  server.close(() => {
    process.exit()
  })
})

module.exports = server
