;(() => {
  /* globals $, _ */
  $(document).on('click', () => $('.collapse').collapse('hide'))
  const [y, m, d] = new Date()
    .toISOString()
    .slice(0, 10)
    .split('-')
  $('.consultedAt').text(`${d}/${m}/${y}`)
  $('.articleUrl').text(document.location)

  // Search page
  if ($('.SearchPage').length) {
    const resultTpl = _.template($('.SearchPage .results-template').text())
    const $form = $('.SearchPage form')

    // Pre-fill input from query string
    const foundQ = document.location.search.match(/[?&]q=(.+?)(?:[?&]|$)/)
    if (foundQ) {
      $('input[name=q]', $form).val(foundQ[1])
    }

    // Throttle to avoid user double submit
    const search = _.throttle(() => {
      console.log('SEARCH', $form.serialize())
    }, 100)

    $form.on('submit', e => {
      e.preventDefault()
      search()
    })
    $('input, select, textarea', $form).on('change', e => {
      search()
    })

    // Initialize search if there is pre-filled input
    if ($('input[name=q]', $form).val()) {
      search()
    }
  }
})()
