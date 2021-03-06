'use strict'

const Boom = require('boom')
const mime = require('mime')

const { parseArticle, parseLexicon } = require('./doc-parsers')
const getConf = require('./dynamic-config-variable')
const { saveAs } = require('./public-fs')

const RE_IMAGE_UPLOAD_KEY = /^image-(small|medium|large)-(1x|2x|3x)$/
const RE_MAP_UPLOAD_KEY = /^map-(small|medium|large)-(1x|2x|3x)$/

exports.article = {
  async save({ newUploads }) {
    const upload = newUploads.find(u => u.key === 'article')
    if (!upload) {
      return null
    }
    // Deletion
    if (!upload.buffer) {
      return { file: null }
    }
    return parseArticle(upload.buffer)
  },
  validate({ required, newUploads, uploads }) {
    expectUploadKeys(uploads, k => k === 'article')
    if (required && newUploads.length !== 1) {
      throw Boom.badRequest('Upload: expecting a single "article" document')
    }
  },
  files() {
    return [] // No file in uploadPath for articles
  },
}

exports.focus = {
  async save({ newUploads }) {
    const upload = newUploads.find(u => u.key === 'focus')
    if (!upload) {
      return null
    }
    // Deletion
    if (!upload.buffer) {
      return { file: null }
    }
    return parseArticle(upload.buffer)
  },
  validate({ required, newUploads, uploads }) {
    expectUploadKeys(uploads, k => k === 'focus')
    if (required && newUploads.length !== 1) {
      throw Boom.badRequest('Upload: expecting a single "focus" document')
    }
  },
  files() {
    return [] // No file in uploadPath for focus
  },
}

exports.map = {
  async save({ newUploads, body, uploads }) {
    // Save new uploads
    const files = await Promise.all(newUploads.map(saveMediaUpload(body)))
    const images = {}
    // Handle *all* uploads (deletions included)
    uploads.forEach(({ key }, index) => {
      const [, size, density] = key.match(RE_MAP_UPLOAD_KEY)
      if (!images[size]) {
        images[size] = {}
      }
      images[size][density] = files[index] || null
      // TODO actually delete files
    })
    return { images }
  },
  validate({ required, newUploads, uploads }) {
    expectUploadKeys(uploads, k => k.match(RE_MAP_UPLOAD_KEY))
    // Mandatory sizes
    if (required && !newUploads.filter(u => u.key.match(/^map-/)).length > 0) {
      throw Boom.badRequest('Upload: required at least one document')
    }
  },
  files({ images }) {
    return Object.values(images)
      .reduce((files, densities) => files.concat(Object.values(densities)), [])
      .filter(f => !!f)
  },
}

exports.image = {
  async save({ newUploads, body, uploads }) {
    // Save new uploads
    const files = await Promise.all(newUploads.map(saveMediaUpload(body)))
    const images = {}
    // Handle *all* uploads (deletions included)
    uploads.forEach(({ key }, index) => {
      const [, size, density] = key.match(RE_IMAGE_UPLOAD_KEY)
      if (!images[size]) {
        images[size] = {}
      }
      images[size][density] = files[index] || null
      // TODO actually delete files
    })
    return { images }
  },
  validate({ required, newUploads, uploads }) {
    expectUploadKeys(uploads, k => k.match(RE_IMAGE_UPLOAD_KEY))
    // Mandatory sizes
    if (
      required &&
      !newUploads.filter(u => u.key.match(/^image-/)).length > 0
    ) {
      throw Boom.badRequest('Upload: required at least one document')
    }
  },
  files({ images }) {
    return Object.values(images)
      .reduce((files, densities) => files.concat(Object.values(densities)), [])
      .filter(f => !!f)
  },
}

exports.sound = {
  async save({ newUploads, body }) {
    const upload = newUploads.find(u => u.key === 'sound')
    if (!upload) {
      return null
    }
    // Deletion
    if (!upload.buffer) {
      // TODO actually delete file
      return { file: null }
    }
    const file = await saveMediaUpload(body)(upload)
    return { file }
  },
  validate({ required, newUploads, uploads }) {
    expectUploadKeys(uploads, k => k === 'sound')
    if (required && newUploads.length !== 1) {
      throw Boom.badRequest('Upload: expecting a single "sound" document')
    }
  },
  files({ file }) {
    return file ? [file] : []
  },
}

exports.definition = {
  async save({ newUploads }) {
    const upload = newUploads.find(u => u.key === 'lexicon')
    if (!upload) {
      return null
    }
    // Deletion? Nope, delete the whole resource then
    if (!upload.buffer) {
      throw new Error(
        'Cannot unselect file for lexicon, you must remove the whole resource',
      )
    }
    return parseLexicon(upload.buffer)
  },
  validate({ required, newUploads, uploads }) {
    expectUploadKeys(uploads, k => k === 'lexicon')
    if (required && newUploads.length !== 1) {
      throw Boom.badRequest('Upload: expecting a single "lexicon" document')
    }
  },
  files() {
    return [] // No file in uploadPath for lexicon
  },
}

exports.video = {
  validate() {
    // No upload expected for video: noop
  },
  async save() {
    // No upload expected for video: noop
  },
  files() {
    return [] // No file in uploadPath for video (vimeo URLs)
  },
}

const expectUploadKeys = (uploads, test) => {
  uploads.forEach(u => {
    if (!test(u.key)) {
      throw new Error('invalid upload key "' + u.key + '"')
    }
  })
}

const saveMediaUpload = ({ id, type }) => async ({ mimeType, key, buffer }) => {
  const fileDir = getConf('uploadPath', {})

  const extension = mime.getExtension(mimeType)
  if (!extension) {
    throw new Error('Unknown mime type "' + mimeType + '"')
  }

  const fileName = getConf('mediaFileName', {
    id,
    type,
    // Remove duplicate 'type' info from upload key
    name: key.replace(new RegExp(`^${type}-`), ''),
    ext: extension,
  })

  await saveAs(fileName, fileDir, buffer)

  return fileName
}
