const express = require('express')
const ping = require('ping')

const hostname = '127.0.0.1'
const port = 3000

const app = express()

app.get('/ping-ip-address', (req, res) => {
  const ipAddress = req.query.address

  ping.sys.probe(ipAddress, (isAlive) => {
    const msg = isAlive
      ? `host ${ipAddress} is alive!`
      : `host ${ipAddress} is dead!`
    console.log(msg)
  })

  return res.send('Ping!')
})

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`)
})
