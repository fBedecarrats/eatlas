// @flow

// components shared by ArticlePage and FocusPage

const { getSearchUrl, globalPageUrl } = require('./layout')
const { getDefinition, slugify, stripTags } = require('../../universal-utils')
const { Fragment } = require('react')
const { FormattedMessage: T, injectIntl } = require('react-intl')
const h = require('react-hyperscript')
const moment = require('moment')
moment.locale('fr')

const Html = require('./Html')

// spacing info is not kept by the parsing phase
// se we need to emulate basic french typo rules here
const padText = (text, markup, idx) => {
  let prepend = true
  let append = true

  // position
  if (idx === 0) prepend = false
  if (idx === markup.length - 1) append = false

  // punctuation
  if (['.', ',', ')'].includes(text[0])) prepend = false
  if (['('].includes(text[text.length - 1])) append = false

  // siblings
  const next = markup[idx + 1]
  if (next && next.type === 'footnote') append = false

  if (prepend) text = ` ${text}`
  if (append) text = `${text} `
  return text
}

exports.PublishedAt = injectIntl(({ doc, intl } /*: { doc: Resource } */) => {
  const date = doc.visiblePublishedAt || doc.publishedAt
  if (!date) {
    return h('.PublishedAt', h(T, { id: 'article.unpublished' }))
  }
  return h('.PublishedAt', [
    h(T, { id: 'doc.published-at' }),
    ' ',
    h(
      'time',
      { dateTime: date },
      moment(date).format(intl.formatMessage({ id: 'doc.header-date-format' })),
    ),
  ])
})

// used by Paragraphs and Footnotes/References
const renderMarkup = (markup /*: Array<Object> */, lexiconId = {}) =>
  markup.map((m, idx) => {
    // see doc-parsers/article parseMarkup
    switch (m.type) {
      case 'text':
        return h(Fragment, { key: idx }, padText(m.text, markup, idx))

      case 'em':
      case 'strong':
      case 'sup':
        return h(m.type, { key: idx }, m.text)

      case 'link':
        return h(
          'a.external',
          { key: idx, href: m.url, target: '_blank' },
          m.text,
        )

      case 'lexicon':
        return h(
          'a.LexiconLink',
          {
            key: idx,
            href: `#lexicon-${++lexiconId.id}`,
            'data-toggle': 'collapse',
          },
          m.text,
        )

      case 'footnote':
        return h('sup', { key: idx }, [
          h(
            'a.FootnoteLink',
            { id: `note-${m.text}`, href: `#footnote-${m.text}` },
            `[${m.text}]`,
          ),
        ])

      default:
        return null
    }
  })

exports.Paragraph = (
  { p, lexiconId } /*: {
  p: Object,
  lexiconId: { id: number },
} */,
) => {
  if (!p.markup)
    throw new Error('no markup found. This document needs to be reimported')

  return h('p.container.DocParagraph', renderMarkup(p.markup, lexiconId))
}

exports.Keywords = (
  { keywords, options } /*: {
  keywords: Object,
  options: Object,
} */,
) => {
  if (!keywords || !keywords.length) return null

  return h('section.container.Keywords', [
    h('h2', 'Mots-clés'),
    h(
      'ul',
      keywords.map((kw, i) =>
        h('li', { key: i }, [
          h(
            'a',
            {
              href: getSearchUrl({ keywords: [kw.text] }, options),
            },
            kw.text,
          ),
        ]),
      ),
    ),
  ])
}

exports.Quote = ({ doc } /*: { doc: Resource } */) => {
  // TODO conf?
  const publication = `Espace mondial l'Atlas`
  const year = new Date(
    doc.visiblePublishedAt || doc.publishedAt || Date.now(),
  ).getFullYear()
  const url = ''

  const bibtex = `@book{eAtlas,
  title={${stripTags(doc.title)}},
  author={${doc.author}},
  url={TODO},
  year={${year}},
  publisher={${publication}}
}`
  const endnote = `%0 Book
%T ${stripTags(doc.title)}
%A ${doc.author}
%U TODO
%D ${year}
%I ${publication}`

  const refman = `TY  - BOOK
T1  - ${doc.title}
A1  - ${doc.author}
UR  - TODO
Y1  - ${year}
PB  - ${publication}`

  return h('section.container.Quote', [
    h('h2', 'Citation'),
    h('blockquote', [
      h('p', [
        h(
          Html,
          { component: 'span' },
          `"${doc.title}", ${publication}, ${year}, [en ligne], consulté le `,
        ),
        h('span.consultedAt', moment().format('D MMMM YYYY')),
        h('span', ', URL:'),
        h('br'),
        h('span.articleUrl', url),
      ]),
    ]),
    // TODO: where should export links be available? Ref #128
    false &&
      h('ul.exports', [
        h('li', [
          h(
            'a',
            {
              download: 'citation.bibtex',
              href: `data:,${encodeURIComponent(bibtex)}`,
            },
            ['BibTex'],
          ),
        ]),
        h('li', [
          h(
            'a',
            {
              download: 'citation.enw',
              href: `data:,${encodeURIComponent(endnote)}`,
            },
            ['EndNote'],
          ),
        ]),
        h('li', [
          h(
            'a',
            {
              download: 'citation.ris',
              href: `data:,${encodeURIComponent(refman)}`,
            },
            ['RefMan'],
          ),
        ]),
      ]),
  ])
}

// also called simply 'Notes' or 'Références'
exports.Footnotes = (
  {
    references,
    footnotes,
  } /*: {
  references: Object[],
  footnotes: Object[],
} */,
) => {
  if ((!references || !references.length) && (!footnotes || !footnotes.length))
    return null

  return h('section.container.Footnotes', [
    h('h2', 'Références'),
    h('.gradient-expand', [
      footnotes &&
        Boolean(footnotes.length) &&
        h(
          'ol',
          footnotes.map((n, k) =>
            h('li', { id: `footnote-${k + 1}`, key: k }, [
              h('a.back', { href: `#note-${k + 1}` }, '^'),
              renderMarkup(n.markup),
            ]),
          ),
        ),
      references &&
        Boolean(references.length) &&
        h(
          'ol',
          references.map((r, k) => h('li', { key: k }, renderMarkup(r.markup))),
        ),
      h('.read-more', ['▼']),
    ]),
  ])
}

exports.Lexicon = (
  {
    nodes,
    definitions,
    options,
  } /*: {
  nodes: Object[],
  definitions: Object[],
  options: Object,
} */,
) =>
  h(
    'section.Lexicon',
    nodes
      .reduce(
        (acc, node) =>
          node.lexicon && node.lexicon.length ? acc.concat(node.lexicon) : acc,
        [],
      )
      .map((dt, k) =>
        h('.collapse.container', { key: k, id: `lexicon-${k + 1}` }, [
          h('dl', [
            h('dt', [
              h(
                'a',
                {
                  href: globalPageUrl('definition', null, slugify(dt))(options),
                },
                dt,
              ),
            ]),
            h(
              'dd',
              {},
              exports.linkInternalDefinitions(
                getDefinition(dt, definitions, true),
                definitions,
                globalPageUrl('definition')(options),
              ),
            ),
          ]),
        ]),
      ),
  )

const marker = `£¨§ø£`
exports.linkInternalDefinitions = (singleDefinition, definitions, url = '') => {
  if (!singleDefinition) {
    return null
  }
  const { lexicon: dts, dd } = singleDefinition
  const markedText = dts.reduce(
    (txt, dt) => txt.replace(dt, marker + dt + marker),
    dd,
  )
  const tokens = markedText.split(marker)
  return tokens.map(token => {
    const found = getDefinition(token, definitions, true)
    if (found) {
      return h('a', { href: url + '#' + slugify(found.dt) }, token)
    } else {
      return token
    }
  })
}
