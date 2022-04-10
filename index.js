const TelegramBot = require('node-telegram-bot-api')
const axios = require('axios')
require('dotenv').config()
const wheaterapiApiKey = process.env.wheaterapi_api_key
// For a description of the Bot API, see this page: https://core.telegram.org/bots/api
// /token via @BotFather
const token = process.env.telegram_token

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true })

// Matches "/report [whatever]"
bot.onText(/^\/weather (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message
  const option = {
    parse_mode: 'Markdown',
    reply_markup: {
      one_time_keyboard: true,
      keyboard: [[{
        text: 'My location',
        request_location: true
      }], ['Cancel']]
    }
  }
  bot.sendMessage(msg.chat.id, 'What location?', option).then(() => {
    bot.once('location', handleLocation)
  })
})

const handleLocation = async (msg) => {
  // bot.sendMessage(msg.chat.id, 'Set current location as favorite!');
  const { latitude, longitude } = msg.location
  const today = Math.floor(Date.now() / 1000)
  const yesterday = today - 24 * 60 * 60 // 24 hours ago
  const weatherEndpoint = (timestamp = '') => {
    const r = `http://api.weatherapi.com/v1/forecast.json?key=${wheaterapiApiKey}&q=${latitude},${longitude}&unixdt=${timestamp}&days=${2}&alerts=yes`
    console.log(r)
    return r
  }
  const todayData = await axios.get(weatherEndpoint())
  const yesterdayData = await axios.get(weatherEndpoint(yesterday))
  bot.sendMessage(msg.chat.id, [
    '[Yesterday]',
    abstractWeatherDay(yesterdayData.data.forecast.forecastday[0]),
    '[Today]',
    abstractWeatherDay(todayData.data.forecast.forecastday[0]),
    '[Tomorrow]',
    abstractWeatherDay(todayData.data.forecast.forecastday[1])
  ].join('\n'))
  bot.sendMessage(msg.chat.id, abstractCurrentWeatherDay(todayData.data))
}

bot.on('location', handleLocation)

function abstractWeatherDay (day) {
  const { date, astro, hour } = day
  const { sunrise, sunset } = astro
  const hourData = [hour[6], hour[8], hour[11], hour[13], hour[16], hour[18], hour[21], hour[23]].map(hour => {
    return `${hour.time.split(' ')[1]}: ${hour.feelslike_c}°C (${hour.feelslike_f}°F) ${hour.humidity}% humid`
  })
  const details = `${date} - ${day.day.condition.text}
    sunrise: ${sunrise}
    sunset: ${sunset}
    ${hourData.join('\n    ')}`
  return details
}

function abstractCurrentWeatherDay (day) {
  const details = `[Right Now] ${day.location.localtime}
  ${day.location.region}
  ${day.current.condition.text}
  ${day.current.feelslike_c}°C (${day.current.feelslike_f}°F) ${day.current.humidity}% humid`
  return details
}

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
  console.log(msg)
})
