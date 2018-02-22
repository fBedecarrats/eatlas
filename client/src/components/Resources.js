// @flow

import './Resources.css'

import React, { Component, Fragment } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { FormattedMessage as T, FormattedDate, injectIntl } from 'react-intl'
import { withRouter } from 'react-router'
import cx from 'classnames'
import { connect } from 'react-redux'

import { fetchResources, getTopics, getUsers } from './../actions'
import { deleteResource, updateResource } from '../api'
import {
  STATUS_STYLE,
  RESOURCE_STATUSES,
  LEXICON_ID,
  DEFAULT_PAGINATION_COUNT,
} from '../constants'
import { paginationItems, updateLocation } from '../utils'

import Spinner from './Spinner'
import IconButton from './IconButton'
import Icon from './Icon'
import Confirm from './Confirm'
import ResourcesPreviewArticle from './ResourcesArticlePreview'

import type { ContextRouter } from 'react-router'

const STATUS_ORDER = ['published', 'validated', 'submitted', 'deleted']

const FIELDS = (
  process.env.REACT_APP_RESOURCES_COLUMNS || 'status,type,preview,id,title'
).split(',')

type FiltersProps = {
  type: ResourceType | '',
  status: string,
  topic: string,
}

type SortProps = {
  by: string,
  dir: 'asc' | 'desc',
}

type PaginationProps = {
  count: number,
  current: number,
  first: number,
  last: number,
}

type ReduxProps = {
  resources: {
    loading: boolean,
    list: Array<Resource>,
    fetched: boolean,
  },
  topics: {
    loading: boolean,
    list: Array<Topic>,
  },
  users: {
    loading: boolean,
    list: Array<User>,
  },
  locale: Locale,
  displayedResources: Resource[],
  pagination: PaginationProps,
  filters: FiltersProps,
  sort: SortProps,
}

type Props = ContextIntl &
  ContextRouter &
  ReduxProps & {
    // actions
    fetchResources: typeof fetchResources,
    getTopics: typeof getTopics,
    getUsers: typeof getUsers,
  }

type State = {
  removeResource: ?Resource,
  removing: boolean,
  restoring: ?Resource,
}

type MenuItem = {
  icon: string,
  type: ResourceType | '',
}

const typeItems: Array<MenuItem> = [
  { icon: 'list', type: '' },
  { icon: 'file-text', type: 'article' },
  { icon: 'bullseye', type: 'focus' },
  { icon: 'book', type: 'definition' },
  { icon: 'map', type: 'map' },
  { icon: 'camera-retro', type: 'image' },
  { icon: 'film', type: 'video' },
  { icon: 'microphone', type: 'sound' },
]

export const renderPreview = (resource: Resource) => {
  if (resource.type === 'article' || resource.type === 'focus') {
    return (
      <span className="preview">
        <ResourcesPreviewArticle article={resource} />
      </span>
    )
  }

  if (resource.type === 'image' && resource.images) {
    // medium@1x is mandatory, we can count on it
    const file = resource.images.medium['1x']
    if (file) {
      const url = (process.env.REACT_APP_PUBLIC_PATH_image || '/') + file
      return <img className="preview" src={url} alt={file} />
    }
  }

  if (resource.type === 'map' && resource.file) {
    const url = (process.env.REACT_APP_PUBLIC_PATH_map || '/') + resource.file
    return <img className="preview" src={url} alt={resource.file} />
  }

  if (resource.type === 'video') {
    // $FlowFixMe: not undefined
    const id = resource.mediaUrl.slice('https://vimeo.com/'.length)
    return (
      <iframe
        className="preview"
        title={resource.title}
        src={`https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0`}
        frameBorder="0"
        allowFullScreen
      />
    )
  }

  if (resource.type === 'sound' && resource.file) {
    const url = (process.env.REACT_APP_PUBLIC_PATH_sound || '/') + resource.file
    return <audio className="preview" src={url} controls />
  }

  if (resource.type === 'definition' && resource.definitions) {
    return (
      <span className="preview">
        <T id="preview-lexicon" values={{ nb: resource.definitions.length }} />
      </span>
    )
  }

  return null
}

class Resources extends Component<Props, State> {
  state = { removeResource: null, removing: false, restoring: null }

  componentDidMount() {
    if (!this.props.resources.fetched) {
      this.props.fetchResources()
    }
    this.props.getTopics()
    if (this.props.users.list.length === 0) {
      this.props.getUsers()
    }
  }

  getMenuTo(params: { status?: ?string, topic?: ?number, type?: string }) {
    const pathname = `/resources/${
      'type' in params ? String(params.type) : this.props.filters.type
    }`
    const search = Object.assign({}, params, { type: null, page: null })
    return updateLocation(this.props.history.location, { pathname, search })
  }

  renderMenuCountSuffix(field: string, value: ?any) {
    const filter = {
      type: field === 'type' ? value : this.props.filters.type,
      status: field === 'status' ? value : this.props.filters.status,
      topic: field === 'topic' ? value : this.props.filters.topic,
    }
    // $FlowFixMe: I know I'm not passing props but just partial filter (no sort intel either)
    const list = applyFilters(this.props.resources.list, filter)
    const count = list.length
    return ` (${count})`
  }

  renderTypeMenu(items: Array<MenuItem>) {
    return (
      <ul className="menu-list type-menu">
        {items.map(item => (
          <li key={item.type}>
            <NavLink
              activeClassName="active"
              isActive={() => item.type === this.props.filters.type}
              to={this.getMenuTo({ type: item.type })}>
              <Icon size="small" icon={item.icon} />
              <T id={`type-${item.type || 'all'}`} />
              {this.renderMenuCountSuffix('type', item.type)}
            </NavLink>
          </li>
        ))}
      </ul>
    )
  }

  renderStatusMenu() {
    return (
      <ul className="menu-list status-menu">
        <li key="all">
          <NavLink
            activeClassName="active"
            isActive={() => !this.props.filters.status}
            to={this.getMenuTo({ status: null })}>
            <span className="button is-small is-rounded" />
            <T id="type-all" />
            {this.renderMenuCountSuffix('status', null)}
          </NavLink>
        </li>
        {RESOURCE_STATUSES.map(s => (
          <li key={s}>
            <NavLink
              activeClassName="active"
              isActive={() => s === this.props.filters.status}
              to={this.getMenuTo({ status: s })}>
              {this.renderStatusIcon(s)}
              <T id={`status-${s}`} />
              {this.renderMenuCountSuffix('status', s)}
            </NavLink>
          </li>
        ))}
      </ul>
    )
  }

  renderTopicMenu() {
    return (
      <ul className="menu-list status-menu">
        <li key="all">
          <NavLink
            activeClassName="active"
            isActive={() => !this.props.filters.topic}
            to={this.getMenuTo({ topic: null })}>
            <span className="button is-small is-rounded" />
            <T id="type-all" />
            {this.renderMenuCountSuffix('topic', null)}
          </NavLink>
        </li>
        {this.props.topics.list.map(t => (
          <li key={t.id}>
            <NavLink
              activeClassName="active"
              isActive={() => t.id === this.props.filters.topic}
              to={this.getMenuTo({ topic: t.id })}>
              <img alt="icon" src={`/topics/${t.id}.svg`} />
              {t.name}
              {this.renderMenuCountSuffix('topic', t.id)}
            </NavLink>
          </li>
        ))}
      </ul>
    )
  }

  renderStatusIcon(status) {
    return (
      <span
        className={cx(
          'button is-small is-rounded',
          'is-' + STATUS_STYLE[status],
        )}
        title={this.props.intl.formatMessage({
          id: 'status-' + (status || 'null'),
        })}
      />
    )
  }

  renderStatusCell(status) {
    return (
      <NavLink
        activeClassName="active"
        isActive={() => status === this.props.filters.status}
        to={this.getMenuTo({ status })}>
        {this.renderStatusIcon(status)}
      </NavLink>
    )
  }

  renderTypeCell(type) {
    const item = typeItems.find(x => x.type === type)
    if (!item) {
      // Can happen if data has been modified manually
      return <td />
    }
    return (
      <NavLink to={this.getMenuTo({ type })}>
        <Icon size="medium" icon={item.icon} />
      </NavLink>
    )
  }

  renderRow = (resource: Resource) => {
    return (
      <tr key={resource.id}>
        {FIELDS.map(field => (
          <td className={'cell-' + field} key={field}>
            {this.renderTd(resource, field)}
          </td>
        ))}
        <td>
          <div className="field is-grouped">
            <div className="control">
              <Link
                className="button is-primary"
                to={`/resources/${resource.id}/edit`}
                title={this.props.intl.formatMessage({ id: 'edit' })}>
                <IconButton icon="pencil" />
              </Link>
            </div>
            <div className="control">
              <button
                className={cx('button is-danger is-outlined', {
                  'is-loading':
                    this.state.removing &&
                    this.state.removeResource === resource,
                })}
                onClick={() =>
                  resource.status === 'deleted' || resource.id === LEXICON_ID
                    ? this.askHardRemove(resource)
                    : this.softRemove(resource)
                }
                title={this.props.intl.formatMessage({ id: 'delete' })}>
                <IconButton
                  icon={resource.status === 'deleted' ? 'times' : 'trash'}
                />
              </button>
            </div>
            {resource.status !== 'deleted' ? null : (
              <div className="control">
                <button
                  className={cx('button is-info is-outlined', {
                    'is-loading': this.state.restoring === resource,
                  })}
                  onClick={() => this.restore(resource)}
                  title={this.props.intl.formatMessage({ id: 'restore' })}>
                  <IconButton icon="history" />
                </button>
              </div>
            )}
          </div>
        </td>
      </tr>
    )
  }

  askHardRemove(resource: ?Resource) {
    this.setState({ removeResource: resource })
  }

  async restore(resource: Resource) {
    if (resource.status !== 'deleted') {
      return
    }

    // TODO Redux
    this.setState({ restoring: resource })
    await updateResource(resource.id, { status: 'submitted' })
    this.setState({ restoring: null })
    this.props.fetchResources()
  }

  async softRemove(resource: Resource) {
    if (resource.status === 'deleted') {
      return
    }

    // TODO Redux
    this.setState({ removing: true })
    await updateResource(resource.id, { status: 'deleted' })
    this.setState({ removing: false, removeResource: null })
    this.props.fetchResources()
  }

  async hardRemove() {
    const resource = this.state.removeResource
    if (!resource) return

    // TODO Redux
    this.setState({ removing: true })
    await deleteResource(resource.id)
    this.setState({ removing: false, removeResource: null })
    this.props.fetchResources()
  }

  renderList() {
    // Status then id asc
    return (
      <table className="table is-striped is-bordered is-fullwidth">
        <thead>
          <tr>
            {FIELDS.map(field => (
              <Fragment key={field}>{this.renderTh(field)}</Fragment>
            ))}
            <th className="fit" />
          </tr>
        </thead>
        <tbody>{this.props.displayedResources.map(this.renderRow)}</tbody>
      </table>
    )
  }

  renderTh(field) {
    // Unsortable fields
    if (field === 'preview') {
      return (
        <th>
          <T id="preview" />
        </th>
      )
    }

    // Sortable fields
    return (
      <th onClick={this.toggleSort(field)}>
        <T id={'resource-' + field} />
        {this.renderSortIndicator(field)}
      </th>
    )
  }

  renderTd(resource: Resource, field: string) {
    switch (field) {
      case 'status':
        return this.renderStatusCell(resource.status)
      case 'type':
        return this.renderTypeCell(resource.type)
      case 'topic':
        return this.renderTopicCell(resource)
      case 'preview':
        return renderPreview(resource)
      case 'createdAt':
      case 'updatedAt':
        const value: ?string = resource[field]
        if (!value) {
          return <Icon icon="warning" title="Unknown date" />
        }
        return (
          <FormattedDate
            value={new Date(value)}
            year="numeric"
            month="2-digit"
            day="2-digit"
          />
        )
      //case 'createdBy':
      case 'updatedBy':
      case 'author':
        const email: string = resource[field]
        if (this.props.users.loading) {
          return (
            <Fragment>
              <Spinner />
              {email}
            </Fragment>
          )
        }
        const user: ?User = this.props.users.list.find(u => u.email === email)
        if (!user) {
          return (
            <Fragment>
              <Icon icon="warning" title="Unknown user" />
              {email}
            </Fragment>
          )
        }
        return <span title={user.email}>{user.name}</span>
      default:
        return resource[field]
    }
  }

  toggleSort = field => () => {
    const newDir =
      this.props.sort.by === field
        ? this.props.sort.dir === 'asc' ? 'desc' : 'asc'
        : this.props.sort.dir // Same field: toggle direction // Different field: keep direction

    this.props.history.push(
      updateLocation(this.props.history.location, {
        search: {
          sort: field,
          dir: newDir,
        },
      }),
    )
  }

  renderSortIndicator(field) {
    if (this.props.sort.by !== field) {
      return null
    }

    return this.props.sort.dir === 'asc' ? (
      <Icon icon="arrow-down" />
    ) : (
      <Icon icon="arrow-up" />
    )
  }

  renderHeader() {
    const addButton = (
      <div className="level-right">
        <div className="level-item">
          <Link
            className="button is-primary"
            to={`/resources/new/${this.props.filters.type}`}>
            <IconButton label="add" icon="plus" />
          </Link>
        </div>
      </div>
    )
    const title = (
      <div className="level-left">
        <div className="level-item">
          <h1 className="title">
            <NavLink to="/resources">
              <T id="resources" />
            </NavLink>
          </h1>
        </div>
      </div>
    )
    return (
      <div className="level">
        {title}
        {this.canAdd() && addButton}
      </div>
    )
  }

  canAdd() {
    // No 'add' button if we're in the "definition" type, and there is already a lexicon
    if (this.props.filters.type === 'definition') {
      if (!this.props.resources.loaded || this.props.resources.loading) {
        return false
      }
      if (this.props.resources.list.some(r => r.type === 'definition')) {
        return false
      }
    }
    return true
  }

  renderTopicCell(resource: Resource) {
    if (!resource.topic) {
      return <td />
    }

    if (this.props.topics.loading) {
      return (
        <Fragment>
          <Spinner small /> {resource.topic}
        </Fragment>
      )
    }

    const topic = this.props.topics.list.find(t => t.id === resource.topic)

    if (!topic) {
      return (
        <td>
          <Icon icon="exclamation-triangle" /> {resource.topic}
        </td>
      )
    }

    return (
      <td>
        <NavLink
          activeClassName="active"
          isActive={() => topic.id === this.props.filters.topic}
          to={this.getMenuTo({ topic: topic.id })}>
          <img alt="icon" src={`/topics/${topic.id}.svg`} />
        </NavLink>
      </td>
    )
  }

  renderPagination() {
    // Fish pagination:
    // - general template: first … prev current next … last
    // - that's 7 elements, so last ≤ 7  <=>  no ellipsis at all
    // - we don't want to hide a single button behind ellipsis, so "…" means at least 2 pages:
    //   - current > 4         <=>  left ellipsis
    //   - current < last - 3  <=>  right ellipsis
    const { current, first, last } = this.props.pagination

    // Build pages navigation (0 = ellipsis)
    const pages = paginationItems(current, last, 2)

    const pageItem = page => (
      <li key={page}>{page ? pageLink(page) : ellipsis}</li>
    )
    const ellipsis = <span className="pagination-ellipsis">&hellip;</span>
    const pageLink = (page, label = page, cls = '') => {
      let className = 'pagination-link'
      if (cls) {
        className += ' ' + cls
      }
      if (page === current) {
        className += ' is-current'
      }

      const props = {
        className,
        'aria-label': 'Page ' + page,
      }

      if (page < first || page > last) {
        return (
          <a {...props} disabled>
            {label}
          </a>
        )
      }

      return (
        <Link
          {...props}
          to={updateLocation(this.props.history.location, {
            search: { page },
          })}>
          {label}
        </Link>
      )
    }

    return (
      <nav className="pagination" aria-label="pagination">
        {pageLink(
          current - 1,
          <T id="pagination-previous" />,
          'pagination-previous',
        )}
        {pageLink(current + 1, <T id="pagination-next" />, 'pagination-next')}
        <ul className="pagination-list">{pages.map(pageItem)}</ul>
      </nav>
    )
  }

  render() {
    const { loading } = this.props.resources

    return (
      <div className="Resources">
        {this.renderHeader()}
        <div className="columns">
          <div className="column is-2">
            <aside className="menu">
              <p className="menu-label">
                <T id="resource-type" />
              </p>
              {this.renderTypeMenu(typeItems)}

              <p className="menu-label">
                <T id="resource-status" />
              </p>
              {this.renderStatusMenu()}

              <p className="menu-label">
                <T id="resource-topic" />
              </p>
              {this.renderTopicMenu()}
            </aside>
          </div>
          <div className="column is-10">
            {loading ? <Spinner /> : this.renderList()}
            {loading ? null : this.renderPagination()}
          </div>
        </div>
        <Confirm
          model={
            this.state.removeResource
              ? { name: this.state.removeResource.id }
              : null
          }
          removing={this.state.removing}
          onClose={() => this.askHardRemove(null)}
          onConfirm={() => this.hardRemove()}
        />
      </div>
    )
  }
}

const statusOrder = (status: ?ResourceStatus): number =>
  status ? STATUS_ORDER.indexOf(status) : -1

const compare = (
  r1: Resource,
  r2: Resource,
  field: string,
  asc: boolean,
): number => {
  let result = 0
  switch (field) {
    case 'status':
      result = statusOrder(r1.status) - statusOrder(r2.status)
      break
    default:
      const v1 = r1[field]
      const v2 = r2[field]
      result = v1 > v2 ? +1 : v1 < v2 ? -1 : 0
      break
  }
  // always sort by id for equalities
  if (result === 0) {
    result = r1.id > r2.id ? +1 : -1
  }
  return asc ? result : -result
}

const applyFilters = (
  list: Resource[],
  { type, status, topic }: FiltersProps,
  sort: ?SortProps,
) => {
  const filtered = list
    .filter(r => !status || r.status === status)
    .filter(r => !topic || r.topic === topic)
    .filter(r => !type || r.type === type)

  return sort
    ? // $FlowFixMe i've just tested sort is not null!!
      filtered.sort((r1, r2) => compare(r1, r2, sort.by, sort.dir === 'asc'))
    : filtered
}

export default withRouter(
  connect(
    (
      { resources, topics, locale, users }: AppState,
      { match }: ContextRouter,
    ): ReduxProps => {
      const { searchParams } = new URL(window.document.location)
      // $FlowFixMe: allow empty type in create mode
      const _type: ResourceType = match.params.type || ''
      const nbPerPage = Math.max(
        1,
        Number(searchParams.get('count')) || DEFAULT_PAGINATION_COUNT,
      )
      const page = Math.max(1, Number(searchParams.get('page')))
      const filters: FiltersProps = {
        type: _type,
        status: searchParams.get('status'),
        topic: searchParams.get('topic'),
      }
      const sort: SortProps = {
        by: searchParams.get('sort') || 'status',
        dir: searchParams.get('dir') === 'desc' ? 'desc' : 'asc',
      }
      const filteredResources = applyFilters(resources.list, filters, sort)
      const displayedResources = filteredResources.slice(
        (page - 1) * nbPerPage,
        page * nbPerPage,
      )
      const nbPages = Math.ceil(filteredResources.length / nbPerPage)
      return {
        locale,
        topics,
        resources,
        users,
        pagination: {
          count: nbPerPage,
          current: page,
          first: 1,
          last: nbPages,
        },
        sort,
        filters,
        displayedResources,
      }
    },
    {
      getTopics,
      fetchResources,
      getUsers,
    },
  )(injectIntl(Resources)),
)
