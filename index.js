const express = require('express')
const ping = require('ping')
const TelegramBot = require('node-telegram-bot-api')

require('dotenv').config()

const hostname = '127.0.0.1'
const port = 3000

const app = express()

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true })

const setIPAddress = async (id) => {
  let contentMessage = await bot.sendMessage(id, 'Write ip address', {
    reply_markup: {
      force_reply: true,
    },
  })

  bot.onReplyToMessage(id, contentMessage.message_id, async (reply) => {
    console.log(reply.text)
  })
}

const detectIPAddress = () => {}

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

bot.on('callback_query', (msg) => {
  const {
    data,
    message: {
      chat: { id },
    },
  } = msg

  switch (data) {
    case 'setIPAddress': {
      return setIPAddress(id)
    }

    default:
      return
  }
})

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
