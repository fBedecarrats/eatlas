// @flow
const h = require('react-hyperscript')
const { StyleSheet } = require('./Tags')

module.exports = ({ title }) => {
  return h('head', [
    h('meta', { charSet: 'utf-8' }),
    h('meta', { httpEquiv: 'X-UA-Compatible', content: 'IE=edge' }),
    h('meta', {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    }),
    h('title', `${title} - eAtlas`),
    h('link', {
      rel: 'stylesheet',
      href:
        'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/css/bootstrap.min.css',
    }),
    h('link', {
      rel: 'stylesheet',
      href:
        'https://cdnjs.cloudflare.com/ajax/libs/jasny-bootstrap/3.1.3/css/jasny-bootstrap.min.css',
    }),
    h(StyleSheet, { href: '/index.css' }),
    h('link', {
      rel: 'stylesheet',
      href:
        'https://fonts.googleapis.com/css?family=Fira+Sans:300,300i,400,400i,700,700i',
    }),
    h('link', {
      rel: 'stylesheet',
      href:
        'https://fonts.googleapis.com/css?family=Gentium+Basic:400,400i,700,700i',
    }),
  ])
}

