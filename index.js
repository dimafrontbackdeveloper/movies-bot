const TelegramBot = require('node-telegram-bot-api')
const fs = require('fs')

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
})
