'use strict'

const express = require('express')
const boom = require('express-boom')
const bodyParser = require('body-parser')

const { cors, session, validateBody } = require('./lib/middlewares')
const { user, users } = require('./lib/routes')

const app = express()

app.use(cors)
app.use(session)
app.use(boom())
app.use(bodyParser.json())

app.get('/session', user.session)
app.post('/login', validateBody(user.login))

app.get('/users', users.list)
app.get('/users/:id([0-9]+)', users.findUser, users.get)
app.post('/users/:id([0-9]+)', users.findUser, validateBody(users.update))
app.post('/users', validateBody(users.create))

module.exports = app
