/**
 * @author Daniel Seifert
 */

const express = require('express')
const db = require('../db')
const security = require('../security')

const router = express.Router()

const table = 'users'

// Create table users
db.createTable(table, {
  id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
  name: 'VARCHAR(50)'
}).then(() => {
  // Insert initial test data
  db.insertToTable(table, {
    name: 'Daniel'
  })

  db.insertToTable(table, {
    name: 'Felix'
  })

  db.insertToTable(table, {
    name: 'Sascha'
  })
})

// Add user
router.post('/', (req, res) => {
  const data = security.xssClean(req.body)

  db.insertToTable(table, data).then((id) => {
    const user = Object.assign(data, { id })

    global.socket.emit('users.created', user)

    res.send({
      status: 'success',
      data: user
    })
  }).catch((err) => {
    res.send({
      status: 'error',
      message: err
    })
  })
})

// Get all users
router.get('/', (req, res) => {
  db.fetchAll(table).then((users) => {
    res.send({
      status: 'success',
      data: {
        users: users || []
      }
    })
  }).catch((err) => {
    res.send({
      status: 'error',
      message: err
    })
  })
})

// Get one user by id
router.get('/:id', (req, res) => {
  const { id } = security.xssClean(req.params)

  db.fetchOneByID(table, id).then((user) => {
    res.send({
      status: 'success',
      data: user || null
    })
  }).catch((err) => {
    res.send({
      status: 'error',
      message: err
    })
  })
})

// Edit user
router.put('/:id', (req, res) => {
  const { id } = security.xssClean(req.params)
  const data = security.xssClean(req.body)

  db.fetchOneByID(table, id).then((user) => {
    if (user) {
      user = Object.assign(user, { id })
      db.updateOneByID(table, Object.assign(user, data), id).then(() => {
        const update = Object.assign(user, data)

        global.socket.emit('users.changed', update)

        res.send({
          status: 'success',
          data: update
        })
      }).catch((err) => {
        res.send({
          status: 'error',
          message: err
        })
      })
    } else {
      res.send({
        status: 'error',
        message: 'user not found'
      })
    }
  }).catch((err) => {
    res.send({
      status: 'error',
      message: err
    })
  })
})

// Delete user
router.delete('/:id', (req, res) => {
  const { id } = security.xssClean(req.params)

  db.fetchOneByID(table, id).then((user) => {
    if (user) {
      db.deleteOneByID(table, req.params.id).then(() => {
        global.socket.emit('users.deleted', user)

        res.send({
          status: 'success',
          data: null
        })
      }).catch((err) => {
        res.send({
          status: 'error',
          message: err
        })
      })
    } else {
      res.send({
        status: 'error',
        message: 'user not found'
      })
    }
  }).catch((err) => {
    res.send({
      status: 'error',
      message: err
    })
  })
})

module.exports = router
