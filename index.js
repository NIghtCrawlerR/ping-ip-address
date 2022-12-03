const express = require('express')
const ping = require('ping')
const TelegramBot = require('node-telegram-bot-api')
const mongo = require('./database')

require('dotenv').config()

const hostname = '127.0.0.1'
const port = 3000

const app = express()

let db

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true })

const setIPAddress = async (id) => {
  // request an IP address
  const hostAddressMessage = await bot.sendMessage(id, 'Provide IP address', {
    reply_markup: {
      force_reply: true,
    },
  })

  const hostAddressReply = await new Promise((resolve) =>
    bot.onReplyToMessage(id, hostAddressMessage.message_id, resolve),
  )

  // request a host name
  const hostNameMessage = await bot.sendMessage(id, 'Provide a name', {
    reply_markup: {
      force_reply: true,
    },
  })

  const hostNameReply = await new Promise((resolve) => {
    bot.onReplyToMessage(id, hostNameMessage.message_id, resolve)
  })

  const userId = hostNameReply.from.id
  db.collection('users').findOne({ userId }, (err, user) => {
    if (err) return console.log(err)

    // add a new user to db collection if it doesn't exist yet
    if (!user) {
      db.collection('users').insertOne({
        userId,
        ipList: [{ address: hostAddressReply.text, name: hostNameReply.text }],
      })
    } else {
      bot.sendMessage(id, 'User already exists')
    }
  })
}

const detectIPAddress = () => {}

const pingIpAddress = (id, data) => {
  const address = data.split('@')[1]

  ping.sys.probe(address, (isAlive) => {
    const status = isAlive ? 'alive' : 'dead'
    const msg = `host ${address} is ${status}!`

    bot.sendMessage(id, msg)
  })
}

bot.onText(/\/start/, (msg) => {
  const id = msg.chat.id

  const keyboard = [
    [{ text: 'Set IP address manually', callback_data: 'setIPAddress' }],
    [{ text: 'Detect current IP address', callback_data: 'detectIPAddress' }],
  ]

  bot.sendMessage(id, 'Hi! Now set your local IP address', {
    reply_markup: { inline_keyboard: keyboard },
  })
})

bot.onText(/\/getiplist/, async (msg) => {
  const id = msg.chat.id
  const userId = msg.from.id

  const user = await db.collection('users').findOne({ userId })
  const { ipList } = user

  const keyboard = ipList.map((ip) => {
    return [
      {
        text: `${ip.name} (${ip.address})`,
        callback_data: `pingIpAddress@${ip.address}@${ip.name}`,
      },
    ]
  })

  bot.sendMessage(id, 'Select which ip u want to ping', {
    reply_markup: { inline_keyboard: keyboard },
  })
})

bot.on('callback_query', (msg) => {
  const {
    data,
    message: {
      chat: { id },
    },
  } = msg

  if (data.includes('pingIpAddress')) {
    return pingIpAddress(id, data)
  }

  if ('setIPAddress') {
    return setIPAddress(id)
  }
})

app.get('/ping-ip-address', (req, res) => {
  const ipAddress = req.query.address

  ping.sys.probe(ipAddress, (isAlive) => {
    const status = isAlive ? 'alive' : 'dead'
    const msg = `host ${ipAddress} is ${status}!`
    console.log(msg)
  })

  return res.send('Ping!')
})

mongo.connect((err, client) => {
  if (err) console.log(err)

  db = mongo.getDb()

  app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`)
  })
})
