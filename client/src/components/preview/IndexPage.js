// @flow

// component also used for SSR, so:
// - require intead of import
// - hyperscript instead of JSX

const { Component } = require('react')
const h = require('react-hyperscript')
const moment = require('moment')
moment.locale('fr')

const { Img } = require('./Tags')
const Head = require('./Head')
const Body = require('./Body')

// subcomponents

const Index = () => {
  return h('article.IndexPage', [
    h('header.container.IndexHeader', [
      h('h1.IndexTitle', 'Un atlas pour comprendre'),
      h('h1.IndexTitle.IndexTitleTyped', "l'espace mondial contemporain"),
      h('div', [
        h('button', 'Commencer la lecture'),
        h('button.tour', 'Visite guidée'),
      ]),
      h('div', [
        h('input', { placeholder: "Rechercher dans l'atlas" }),
        h('button', [h(Img, { alt: '', src: `/assets/img/search.svg` })]),
      ]),
    ]),
    h('section.IndexNav', [
      h('.container', [
        h('.row', [
          h('.col-sm-4', [
            'Un ouvrage numérique accessible librement fruit d’une collaboration de six auteurs.',

            h('button', 'Accéder au sommaire'),
          ]),
          h('.col-sm-4', [
            'Des ressources originales nombreuses (cartes, graphiques, photos, définitions)',
            h('button', 'Voir les ressources'),
          ]),
          h('.col-sm-4', 'Un projet mené par trois équipes de Sciences Po.'),
        ]),
      ]),
    ]),
    h('section.IndexBook', [
      h('.container', [
        h('.row', [
          h(
            '.col-sm-4',
            [ 'Espace Mondial : l’Atlas est aussi un beau livre papier publié aux Presses de Sciences Po.',
            h('button', 'Acheter le livre'),
            ]
          ),
          h('.col-sm-8', ''),
        ]),
      ]),
    ]),
    h('section.IndexToc', [h('.container', [h('h2', 'Sommaire')])]),
    h('section.IndexProject', [
      h('.container', [
        h('h2', 'Le projet'),
        h('.row', [
          h(
            '.col-sm-6',
            'Texte sur le projet... ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.',
          ),
          h(
            '.col-sm-6',
            'nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.',
          ),
        ]),
      ]),
    ]),
    h('section.IndexTeam', [
      h('.container', [
        h('h2', "L'équipe"),
        h('h3', 'Six auteurs'),
        h('ul', [
          h('li', [h('.avatar'), h('div', 'Delphine'), h('div', 'Allès')]),
          h('li', [h('.avatar'), h('div', 'Mélanie'), h('div', 'Albaret')]),
          h('li', [h('.avatar'), h('div', 'Philippe'), h('div', 'Copinschi')]),
          h('li', [
            h('.avatar'),
            h('div', 'Marie Françoise'),
            h('div', 'Durand'),
          ]),
          h('li', [h('.avatar'), h('div', 'Lucile'), h('div', 'Maertens')]),
          h('li', [
            h('.avatar'),
            h('div', 'Delphine'),
            h('div', 'Placidi-Frot'),
          ]),
        ]),
        h('h3', 'Cinq cartographes (Sciences Po - Atelier de cartographie)'),
        h('ul', [
          h('li', [h('.avatar'), h('div', 'Thomas'), h('div', 'Ansart')]),
          h('li', [h('.avatar'), h('div', 'Benoît'), h('div', 'Martin')]),
          h('li', [h('.avatar'), h('div', 'Patrice'), h('div', 'Mitrano')]),
          h('li', [h('.avatar'), h('div', 'Anouk'), h('div', 'Pettes')]),
          h('li', [h('.avatar'), h('div', 'Antoine'), h('div', 'Rio')]),
        ]),
      ]),
    ]),
  ])
}

class IndexPage extends Component /*::<{topics: Topic[]}>*/ {
  render() {
    const { topics, options } = this.props
    return h('html', { lang: 'fr' }, [
      h(Head, { title: 'eAtlas' }),
      h(Body, { topics: [], options, topMenu: true, logoColor: 'white' }, [
        h(Index, { topics: [], options }),
      ]),
    ])
  }
}

module.exports = IndexPage
