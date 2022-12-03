const mongoClient = require('mongodb').MongoClient

const prod = process.env.NODE_ENV === 'production'
if (!prod) {
  require('dotenv').config()
}

const DB_URL = process.env.DB_URL

let _db

module.exports = {
  connect: (callback) => {
    mongoClient.connect(DB_URL, { useNewUrlParser: true }, (err, client) => {
      if (err) {
        console.error('An error occurred connecting to MongoDB: ', err)
      } else {
        _db = client.db('ping-ip-address')

        return callback(err, client)
      }
    })
  },

  getDb: () => {
    return _db
  },
}
