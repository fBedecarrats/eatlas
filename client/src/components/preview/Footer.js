// @flow

const h = require('react-hyperscript')
const { FormattedMessage: T } = require('react-intl')
const {
  resourcesTypes,
  aPropos,
  getTopicPageUrl,
  prefixUrl,
} = require('./layout')

const Topics = ({ topics, options }) =>
  h('nav', [
    h(
      'ul',
      topics.map(t =>
        h('li', { key: t.id }, [
          h(
            'a',
            {
              href: getTopicPageUrl(t, options),
            },
            [t.id !== '0' && `${t.id}. `, t.name],
          ),
        ]),
      ),
    ),
  ])

const FooterLogo = ({ options } /*: { options: FrontOptions } */) =>
  h('a', [
    h('img', {
      alt: 'Sciences Po',
      src: prefixUrl('/assets/img/sciences-po.svg', options.preview),
    }),
  ])

const FooterUl = ({ links, options }) =>
  h(
    'ul',
    links.map((r, i) =>
      h('li', { key: i }, [
        h('a', { href: r.url(options) }, h(T, { id: r.text })),
      ]),
    ),
  )

module.exports = (
  { topics, options } /*: {
  topics: Topic[],
  options: Object,
} */,
) =>
  h('footer.container.Footer', { role: 'contentinfo' }, [
    h('.FooterRow', [
      h('.FooterColTopics', [
        h('h2', {}, h(T, { id: 'fo.nav-summary' })),
        h(Topics, { topics, options }),
      ]),
      h('.FooterColResources', [
        h('h2', {}, h(T, { id: 'fo.nav-resources' })),
        h(FooterUl, { links: resourcesTypes, options }),
      ]),
      h('.FooterColAPropos', [
        h('h2', {}, h(T, { id: 'fo.nav-about' })),
        h(FooterUl, { links: aPropos, options }),
      ]),
      h('.FooterColLogo', [h(FooterLogo, { options })]),
    ]),
  ])
