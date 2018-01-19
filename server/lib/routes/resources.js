'use strict'

const request = require('request-promise-native')
const config = require('config')
const Boom = require('boom')
const merge = require('lodash.merge')

const { resources } = require('../model')
const schemas = require('../schemas')
const { parseDocx } = require('../doc-parser')
const { saveMedia } = require('../public-fs')

exports.findResource = (req, res, next) =>
  resources
    .findById(req.params.id)
    .then(resource => {
      if (!resource) {
        return res.boom.notFound('Unknown Resource Id')
      }
      req.foundResource = resource
      next()
    })
    .catch(res.boom.send)

exports.get = (req, res) => res.send(req.foundResource)

exports.update = async (req, res) => {
  resources
    .update(req.foundResource.id, req.body)
    .then(updatedResource => res.send(updatedResource))
    .catch(res.boom.send)
}

exports.addFromGoogle = async (req, res) => {
  try {
    const data = await handleUploads(req.body)

    const resource = await resources.create(
      merge(
        {
          author: req.session.user.email,
          status: 'submitted',
          createdAt: Date.now(),
          id: req.body.id,
          type: req.body.type,
          title: req.body.title,
          subtitle: req.body.subtitle,
          topic: req.body.topic,
          language: req.body.language,
          description: req.body.description,
          copyright: req.body.copyright,
        },
        data,
      ),
    )

    res.send({ id: resource.id })
  } catch (err) {
    if (err.isJoi) {
      res.boom.badRequest(err.message, {
        details: err.details,
        object: err._object,
        annotated: err.annotate(),
      })
    } else if (err.code === 'EDUPLICATE') {
      res.boom.conflict(err.message)
    } else {
      // Force output message to be kept
      res.boom.send(err, { message: err.message })
    }
  }
}
exports.addFromGoogle.schema = schemas.uploadFromGoogleDrive

exports.list = (req, res) =>
  resources
    .list()
    .then(resources => res.send(resources))
    .catch(res.boom.send)

exports.remove = (req, res) =>
  resources
    .remove(req.params.id)
    .then(() => res.status(204).end())
    .catch(res.boom.send)

const getFileUrl = type => ({ fileId, mimeType }) => {
  const exportTrigger = config.google.exportTrigger[type]
  const shouldExport =
    Array.isArray(exportTrigger) && exportTrigger.includes(mimeType)
  const exportFormat = shouldExport && config.google.exportFormat[type]
  const url = exportFormat ? config.google.exportUrl : config.google.downloadUrl
  return url
    .replace(/FILE_ID/g, encodeURIComponent(fileId))
    .replace(/FORMAT/g, encodeURIComponent(exportFormat))
}

const RE_IMAGE_UPLOAD_KEY = /^image-(small|medium|large)-(1x|2x|3x)$/

const expectUploadKeys = (uploads, test) => {
  uploads.forEach(u => {
    if (!test(u.key)) {
      throw new Error('invalid upload key "' + u.key + '"')
    }
  })
}

// TODO check mime-type too
// TODO structure validation may go in a Joi schema with when 'n co, but it may make it too complex (it's enough already)
const validateUploads = (uploads, type, required) => {
  switch (type) {
    case 'article': {
      expectUploadKeys(uploads, k => k === 'article')
      if (required && uploads.length !== 1) {
        throw new Error('expecting a single "article" document')
      }
      break
    }
    case 'map': {
      expectUploadKeys(uploads, k => k === 'map')
      if (required && uploads.length !== 1) {
        throw new Error('expecting a single "map" document')
      }
      break
    }
    case 'image': {
      expectUploadKeys(uploads, k => k.match(RE_IMAGE_UPLOAD_KEY))
      // Mandatory sizes
      if (required && !uploads.some(u => u.key === 'image-medium-1x')) {
        throw new Error('required document "image-medium-1x"')
      }
      break
    }
    default:
      throw Boom.notImplemented()
  }
}

// Returns additional metadata to be merged into resource before creation
const handleUploads = async body => {
  const { uploads, type, accessToken } = body

  // Check uploaded files
  try {
    validateUploads(uploads, type, true)
  } catch (e) {
    throw Boom.badRequest('Upload error: ' + e.message)
  }

  // Fetch contents
  const urls = uploads.map(getFileUrl(type))
  const options = { encoding: null, auth: { bearer: accessToken } }
  const buffers = await Promise.all(urls.map(url => request(url, options)))

  // Inject buffer into each upload object
  uploads.forEach((upload, index) => {
    upload.buffer = buffers[index]
  })

  switch (type) {
    case 'article': {
      const upload = uploads.find(u => u.key === 'article')
      if (!upload) {
        return null
      }
      return parseDocx(upload.buffer)
    }
    case 'map': {
      const upload = uploads.find(u => u.key === 'map')
      if (!upload) {
        return null
      }
      const file = await saveMedia(body)(upload)
      return { file }
    }
    case 'image': {
      const files = await Promise.all(uploads.map(saveMedia(body)))
      const images = {}
      uploads.forEach(({ key }, index) => {
        const [, size, density] = key.match(RE_IMAGE_UPLOAD_KEY)
        if (!images[size]) {
          images[size] = {}
        }
        images[size][density] = files[index]
      })
      return { images }
    }
    default:
      throw Boom.notImplemented()
  }
}
