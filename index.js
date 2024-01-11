const TelegramBot = require('node-telegram-bot-api')
const fs = require('fs')
const express = require('express')
const http = require('http')
const WebSocket = require('ws')

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

app.get('/', (req, res) => {
	res.send('hello world!!!!!!!!!!!!!!!!!!!!!!!')
})

const port = 3000
server.listen(port, () => {
	console.log(`server running at the port ${port}`)
})

const bot = new TelegramBot('6882855075:AAHd-vNxndKxIPntyyIldcGDxkSefg32gSY', {
	polling: true,
})

const subscribeToChannelsKeyboard = {
	inline_keyboard: [
		[
			{ text: 'Канал 1', url: 'https://t.me/analginoff' },
			{ text: 'Канал 2', url: 'https://t.me/analginoff2' },
		],
		[{ text: 'Перевірити підписку', callback_data: 'check_subscription' }],
	],
}

const checkSubscription = async (chatId, channelId) => {
	try {
		const chatMember = await bot.getChatMember(channelId, chatId)

		if (
			chatMember.status === 'member' ||
			chatMember.status === 'administrator' ||
			chatMember.status === 'creator'
		) {
			return true
		} else {
			return false
		}
	} catch (error) {
		console.error(error)
		bot.sendMessage(
			chatId,
			'Произошла ошибка при проверке подписки. Перезапустите бота'
		)
	}
}

const start = async chatId => {
	bot.sendMessage(
		chatId,
		'Для використання цього боту, ви маєте бути підписані на ці телеграм канали:',
		{
			reply_markup: subscribeToChannelsKeyboard,
		}
	)
}

bot.on('callback_query', async query => {
	const chatId = query.from.id

	if (query.data === 'check_subscription') {
		const isUserSubscribedFirstChannel = await checkSubscription(
			chatId,
			'@analginoff'
		)

		const isUserSubscribedSecondChannel = await checkSubscription(
			chatId,
			'@analginoff2'
		)

		if (isUserSubscribedFirstChannel && isUserSubscribedSecondChannel) {
			bot.sendMessage(chatId, 'Введіть код фільма. Наприклад: 123')
		} else {
			bot.sendMessage(
				chatId,
				'Ви не підписались на телеграм канали. Підпишіться будьласка',
				{
					reply_markup: subscribeToChannelsKeyboard,
				}
			)
		}
	}
})

bot.on('message', async msg => {
	console.log(msg)
	const chatId = msg.chat.id
	const userId = msg.from.id
	const username = msg.from.username
	const text = msg.text

	if (text.startsWith('/start')) {
		await start(chatId)
	} else {
		const isUserSubscribedFirstChannel = await checkSubscription(
			chatId,
			'@analginoff'
		)

		const isUserSubscribedSecondChannel = await checkSubscription(
			chatId,
			'@analginoff2'
		)
		if (isUserSubscribedFirstChannel && isUserSubscribedSecondChannel) {
			if (!!Number(text)) {
				const movies = JSON.parse(fs.readFileSync('movies.json', 'utf8'))
				let movie = null

				movies.forEach(movieElement => {
					if (movieElement.code === Number(text)) {
						movie = movieElement
					}
				})

				if (!!movie) {
					bot.sendMessage(chatId, `Фільм: ${movie.name}`)
				} else {
					bot.sendMessage(
						chatId,
						`Фільма з таким кодом не знайдено. Спробуйте ввести ще раз код. Наприклад: 123`
					)
				}
			} else {
				bot.sendMessage(
					chatId,
					'Невірний формат написання коду фільма. Введіть код фільма ще раз. Наприклад: 123'
				)
			}
		} else {
			await start(chatId)
		}
	}

	// Convert the message data to JSON and send it to WebSocket clients
	wss.clients.forEach(client => {
		if (client.readyState === WebSocket.OPEN) {
			const messageData = {
				chatId: msg.chat.id,
				userId: msg.from.id,
				username: msg.from.username,
				text: msg.text,
			}
			client.send(JSON.stringify(messageData))
		}
	})
})

// WebSocket server
wss.on('connection', ws => {
	console.log('WebSocket connected')

	ws.on('message', message => {
		console.log(`Received message: ${message}`)
	})

	ws.on('close', () => {
		console.log('WebSocket disconnected')
	})
})
