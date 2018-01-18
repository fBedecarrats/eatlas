// @flow

import React, { Component } from 'react'
import { FormattedMessage as T } from 'react-intl'
import withRouter from 'react-router/withRouter'
import { connect } from 'react-redux'

import { addResourceFromGoogleDrive } from '../api'
import ResourceForm from './ResourceForm'

import type { ContextRouter } from 'react-router'
import type { SaveCallback } from './ResourceForm'

type Props = ContextRouter & {
  forcedType: ?ResourceType,
  initialId: ?string,
}

class Import extends Component<Props> {
  render() {
    return (
      <div className="ResourceCreate">
        <h1 className="title">
          <T id="resource-create" />
        </h1>
        <ResourceForm
          onSubmit={this.save}
          resource={{ type: this.props.forcedType, id: this.props.initialId }}
        />
      </div>
    )
  }

  save: SaveCallback = async (resource, docs, accessToken) => {
    const uploads = Object.keys(docs).reduce((ups, key) => {
      const doc = docs[key]
      return doc
        ? ups.concat([
            {
              key,
              fileId: doc.id,
              mimeType: doc.mimeType,
            },
          ])
        : ups
    }, [])

    const result = await addResourceFromGoogleDrive({
      ...resource,
      uploads,
      accessToken,
    })

    // TODO Add resource to redux
    this.props.history.push(`/resources/${result.id}/edit`)

    return result
  }
}

export default withRouter(
  connect(({ locale }: AppState, { match, location }: ContextRouter) => ({
    forcedType: match.params.type,
    initialId: location.search.substring(1),
  }))(Import),
)
