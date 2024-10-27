const TelegramBot = require('node-telegram-bot-api');
const { token } = require('./token');

const bot = new TelegramBot(token, { polling: true });

const userStates = {};
const userDepartureAddresses = {};
const userDestinationAddresses = {};

function sendMainMenu(chatId) {
    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: 'Кнопка 1', callback_data: 'button1' }],
            [{ text: 'Адреса', callback_data: 'addresses' }],
            [{ text: 'Кнопка 3', callback_data: 'button3' }]
        ]
    };
    bot.sendMessage(chatId, 'Привет! Выберите опцию:', { reply_markup: inlineKeyboard });
}

function sendButton1SubMenu(chatId) {
    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: 'Подкнопка 1.1', callback_data: 'subbutton1.1' }],
            [{ text: 'Подкнопка 1.2', callback_data: 'subbutton1.2' }],
            [{ text: 'Назад', callback_data: 'back' }]
        ]
    };
    bot.sendMessage(chatId, 'Выберите опцию:', { reply_markup: inlineKeyboard });
}

function handleButton1SubMenu(chatId, data) {
    if (data === 'subbutton1.1') {
        bot.sendMessage(chatId, 'Вы выбрали Подкнопку 1.1');
    } else if (data === 'subbutton1.2') {
        bot.sendMessage(chatId, 'Вы выбрали Подкнопку 1.2');
    } else if (data === 'back') {
        userStates[chatId] = 'main';
        sendMainMenu(chatId);
    }
}

function sendAddressesSubMenu(chatId) {
    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: 'Адреса отправления', callback_data: 'departure_addresses' }],
            [{ text: 'Конечный адрес', callback_data: 'destination_addresses' }],
            [{ text: 'Назад', callback_data: 'back' }]
        ]
    };
    bot.sendMessage(chatId, 'Выберите тип адреса:', { reply_markup: inlineKeyboard });
}

function sendDepartureAddressesSubMenu(chatId) {
    const addresses = userDepartureAddresses[chatId] || [];
    const inlineKeyboard = {
        inline_keyboard: [
            ...addresses.map(address => [{ text: address, callback_data: `edit_departure_${address}` }]),
            [{ text: 'Добавить адрес', callback_data: 'add_departure_address' }],
            [{ text: 'Назад', callback_data: 'back' }]
        ]
    };
    bot.sendMessage(chatId, 'Выберите адрес отправления или добавьте новый:', { reply_markup: inlineKeyboard });
}

function sendDestinationAddressesSubMenu(chatId) {
    const addresses = userDestinationAddresses[chatId] || [];
    const inlineKeyboard = {
        inline_keyboard: [
            ...addresses.map(address => [{ text: address, callback_data: `edit_destination_${address}` }]),
            [{ text: 'Добавить адрес', callback_data: 'add_destination_address' }],
            [{ text: 'Назад', callback_data: 'back' }]
        ]
    };
    bot.sendMessage(chatId, 'Выберите конечный адрес или добавьте новый:', { reply_markup: inlineKeyboard });
}

function handleDepartureAddressesSubMenu(chatId, data) {
    if (data === 'add_departure_address') {
        userStates[chatId] = 'adding_departure_address';
        bot.sendMessage(chatId, 'Введите новый адрес отправления:');
    } else if (data === 'back') {
        userStates[chatId] = 'addresses';
        sendAddressesSubMenu(chatId);
    } else if (data.startsWith('edit_departure_')) {
        const address = data.split('_')[2];
        userStates[chatId] = 'editing_departure_address';
        userStates[chatId + '_address'] = address;
        bot.sendMessage(chatId, `Вы хотите изменить или удалить адрес отправления "${address}"?`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Изменить', callback_data: 'edit_address' }],
                    [{ text: 'Удалить', callback_data: 'delete_address' }],
                    [{ text: 'Назад', callback_data: 'back' }]
                ]
            }
        });
    }
}

function handleDestinationAddressesSubMenu(chatId, data) {
    if (data === 'add_destination_address') {
        userStates[chatId] = 'adding_destination_address';
        bot.sendMessage(chatId, 'Введите новый конечный адрес:');
    } else if (data === 'back') {
        userStates[chatId] = 'addresses';
        sendAddressesSubMenu(chatId);
    } else if (data.startsWith('edit_destination_')) {
        const address = data.split('_')[2];
        userStates[chatId] = 'editing_destination_address';
        userStates[chatId + '_address'] = address;
        bot.sendMessage(chatId, `Вы хотите изменить или удалить конечный адрес "${address}"?`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Изменить', callback_data: 'edit_address' }],
                    [{ text: 'Удалить', callback_data: 'delete_address' }],
                    [{ text: 'Назад', callback_data: 'back' }]
                ]
            }
        });
    }
}

function handleMainMenu(chatId, data) {
    if (data === 'button1') {
        userStates[chatId] = 'button1';
        sendButton1SubMenu(chatId);
    } else if (data === 'addresses') {
        userStates[chatId] = 'addresses';
        sendAddressesSubMenu(chatId);
    } else if (data === 'button3') {
        bot.sendMessage(chatId, 'Вы выбрали Кнопку 3');
    }
}

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if (userStates[chatId] === 'adding_departure_address') {
        const newAddress = msg.text;
        if (!userDepartureAddresses[chatId]) {
            userDepartureAddresses[chatId] = [];
        }
        userDepartureAddresses[chatId].push(newAddress);
        userStates[chatId] = 'departure_addresses';
        sendDepartureAddressesSubMenu(chatId);
    } else if (userStates[chatId] === 'adding_destination_address') {
        const newAddress = msg.text;
        if (!userDestinationAddresses[chatId]) {
            userDestinationAddresses[chatId] = [];
        }
        userDestinationAddresses[chatId].push(newAddress);
        userStates[chatId] = 'destination_addresses';
        sendDestinationAddressesSubMenu(chatId);
    } else if (userStates[chatId] === 'editing_departure_address') {
        const address = userStates[chatId + '_address'];
        const newAddress = msg.text;
        userDepartureAddresses[chatId] = userDepartureAddresses[chatId].map(addr => addr === address ? newAddress : addr);
        userStates[chatId] = 'departure_addresses';
        sendDepartureAddressesSubMenu(chatId);
    } else if (userStates[chatId] === 'editing_destination_address') {
        const address = userStates[chatId + '_address'];
        const newAddress = msg.text;
        userDestinationAddresses[chatId] = userDestinationAddresses[chatId].map(addr => addr === address ? newAddress : addr);
        userStates[chatId] = 'destination_addresses';
        sendDestinationAddressesSubMenu(chatId);
    } else {
        sendMainMenu(chatId);
        userStates[chatId] = 'main';
    }
});

bot.on('callback_query', (query) => {
    const chatId = query.message?.chat.id;
    const data = query.data;

    if (userStates[chatId] === 'main') {
        handleMainMenu(chatId, data);
    } else if (userStates[chatId] === 'button1') {
        handleButton1SubMenu(chatId, data);
    } else if (userStates[chatId] === 'addresses') {
        if (data === 'departure_addresses') {
            userStates[chatId] = 'departure_addresses';
            sendDepartureAddressesSubMenu(chatId);
        } else if (data === 'destination_addresses') {
            userStates[chatId] = 'destination_addresses';
            sendDestinationAddressesSubMenu(chatId);
        } else if (data === 'back') {
            userStates[chatId] = 'main';
            sendMainMenu(chatId);
        }
    } else if (userStates[chatId] === 'departure_addresses') {
        handleDepartureAddressesSubMenu(chatId, data);
    } else if (userStates[chatId] === 'destination_addresses') {
        handleDestinationAddressesSubMenu(chatId, data);
    } else if (userStates[chatId] === 'editing_departure_address' || userStates[chatId] === 'editing_destination_address') {
        if (data === 'edit_address') {
            bot.sendMessage(chatId, 'Введите новый адрес:');
        } else if (data === 'delete_address') {
            const address = userStates[chatId + '_address'];
            if (userStates[chatId] === 'editing_departure_address') {
                userDepartureAddresses[chatId] = userDepartureAddresses[chatId].filter(addr => addr !== address);
                userStates[chatId] = 'departure_addresses';
                sendDepartureAddressesSubMenu(chatId);
            } else if (userStates[chatId] === 'editing_destination_address') {
                userDestinationAddresses[chatId] = userDestinationAddresses[chatId].filter(addr => addr !== address);
                userStates[chatId] = 'destination_addresses';
                sendDestinationAddressesSubMenu(chatId);
            }
        } else if (data === 'back') {
            if (userStates[chatId] === 'editing_departure_address') {
                userStates[chatId] = 'departure_addresses';
                sendDepartureAddressesSubMenu(chatId);
            } else if (userStates[chatId] === 'editing_destination_address') {
                userStates[chatId] = 'destination_addresses';
                sendDestinationAddressesSubMenu(chatId);
            }
        }
    }
});