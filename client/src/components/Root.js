import React, { Fragment } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { IntlProvider } from 'react-intl'
import * as messages from '../i18n'
import { connect } from 'react-redux'

import App from './App'

type Props = {
  locale: Locale,
}

const Root = ({ locale }: Props) => {
  return (
    <IntlProvider
      key={locale}
      locale={locale}
      messages={messages[locale]}
      textComponent={Fragment}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </IntlProvider>
  )
}

export default connect(({ locale }) => ({ locale }))(Root)
