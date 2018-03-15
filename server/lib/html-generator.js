'use strict'

// Tools to grab data required by components
const {
  flattenMetas,
  getTopics,
  getDefinitions,
  getArticleResources,
  getImageHeader,
  getTopicResources,
  populateFocus,
  getResource,
  getArticles,
} = require('./generator-utils')

// React dependencies for HTML generation
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

// Inject client-side env variables before requiring components, we don't "require" from there
const config = require('config')
const dotenv = require('dotenv')
dotenv.config({ path: `${config.clientPath}/.env` })
dotenv.config({ path: `${config.clientPath}/.env.local` })

// Inject client-side env variables allowing generation of URLs
for (let key in config.pageUrls) {
  process.env['REACT_APP_PAGE_URL_' + key] = config.pageUrls[key]
}

// Now all env variables are available just like if it was built for client side
const ArticlePage = require('../../client/src/components/preview/ArticlePage')
const FocusPage = require('../../client/src/components/preview/FocusPage')
const TopicPage = require('../../client/src/components/preview/TopicPage')
const ResourcePage = require('../../client/src/components/preview/ResourcePage')
const HomePage = require('../../client/src/components/preview/HomePage')
const MissingPage = require('../../client/src/components/preview/MissingPage')

const wrap = element => `<!DOCTYPE html>${renderToStaticMarkup(element)}`

const topMenuProps = async ({ topics = null, articles = null } = {}) => ({
  topics: topics || (await getTopics()),
  articles: articles || (await getArticles()),
})

exports.generateArticleHTML = async (
  resource,
  { preview = false } = {},
  props = {},
) => {
  const article = flattenMetas(resource)
  const definitions = await getDefinitions()
  let resources = await getArticleResources(resource, { preview })

  // need to retrieve imageHeader for "related" articles in footer since they're transitives deps
  resources = await Promise.all(
    resources.map(async r => {
      if (r.type === 'article') {
        r.imageHeader = await getImageHeader(r)
      }
      return r
    }),
  )

  return wrap(
    React.createElement(ArticlePage, {
      ...(await topMenuProps(props)),
      article,
      definitions,
      resources,
      options: { preview },
    }),
  )
}

exports.generateFocusHTML = async (
  resource,
  { preview = false } = {},
  props = {},
) => {
  let focus = flattenMetas(resource)
  // to create the "go back to article" link
  focus.relatedArticleId = focus.relatedArticle
  focus.relatedArticle = await getResource(focus.relatedArticleId)
  const definitions = await getDefinitions()
  const resources = await getArticleResources(resource, { preview })

  return wrap(
    React.createElement(FocusPage, {
      ...(await topMenuProps(props)),
      focus,
      definitions,
      resources,
      options: { preview },
    }),
  )
}

exports.generateTopicHTML = async (
  topic,
  { preview = false } = {},
  props = {},
) => {
  const resources = await getTopicResources(topic)
  // Enhanced articles for data list in topic page
  props.articles = await Promise.all(
    (props.articles || resources.filter(r => r.type === 'article'))
      .map(flattenMetas)
      .map(async a => {
        a.imageHeader = await getImageHeader(a)
        a.focus = await populateFocus(a, resources)
        return a
      }),
  )

  return wrap(
    React.createElement(TopicPage, {
      ...(await topMenuProps(props)),
      topic,
      articles: props.articles,
      resources,
      options: { preview },
    }),
  )
}

exports.generateResourceHTML = async (
  resource,
  { preview = false } = {},
  props = {},
) => {
  return wrap(
    React.createElement(ResourcePage, {
      ...(await topMenuProps(props)),
      resource,
      options: { preview },
    }),
  )
}

exports.generateHomeHTML = async ({ preview = false } = {}, props = {}) => {
  return wrap(
    React.createElement(HomePage, {
      ...(await topMenuProps(props)),
      options: { preview },
    }),
  )
}

const generateMissingHTML = async ({ preview = false } = {}, props = {}) => {
  return wrap(
    React.createElement(MissingPage, {
      ...(await topMenuProps(props)),
      options: { preview },
    }),
  )
}

exports.generateSearchHTML = generateMissingHTML
exports.generateResourcesHTML = generateMissingHTML
exports.generateAboutWhoHTML = generateMissingHTML
exports.generateAboutContactHTML = generateMissingHTML
exports.generateAboutLegalsHTML = generateMissingHTML
exports.generateSiteMapHTML = generateMissingHTML
