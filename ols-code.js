const TelegramBot = require('node-telegram-bot-api');

const { token } = require('./constants')

const bot = new TelegramBot(token, { polling: true });

const userStates = {
  chatSection: 'main',
  userDepartureAddresses: [
    {
      "x": 167.102,
      "y": 156.305
    }
  ],
  userDestinationAddresses: [{}],
};

// Функция для отправки подменю после нажатия на "Кнопка 1"
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

// Функция для обработки нажатия на кнопки подменю "Кнопка 1"
function handleButton1SubMenu(chatId, data) {
  if (data === 'subbutton1.1') {
    bot.sendMessage(chatId, 'Вы выбрали Подкнопку 1.1');
  } else if (data === 'subbutton1.2') {
    bot.sendMessage(chatId, 'Вы выбрали Подкнопку 1.2');
  } else if (data === 'back') {
    userStates.chatSection = 'main';
    sendMainMenu(chatId);
  }
}

function sendButtonDepartureAddressesSubMenu(chatId) {

  const addresses = userStates.userDepartureAddresses;
  console.log(addresses);
  const inlineKeyboard = {
    inline_keyboard: [
      ...addresses.map((address, index) => [{ text: index, callback_data: `edit_destination_${address}` }]),
      [{ text: 'Добавить адрес', callback_data: 'add_destination_address' }],
      [{ text: 'Назад', callback_data: 'backAddresses' }]
    ]
  };
  bot.sendMessage(chatId, 'Выберите конечный адрес или добавьте новый:', { reply_markup: inlineKeyboard });
}

function handleButtonDepartureAddressesSubMenu(chatId, data) {
  sendButtonDepartureAddressesSubMenu(chatId)

  if (data === 'back') {
    userStates.chatSection = 'main';
    sendMainMenu(chatId);
  }
}

function sendButtonAddressesSubMenu(chatId) {
  const inlineKeyboard = {
    inline_keyboard: [
      [{ text: 'Адреса отправления', callback_data: 'departureButton' }],
      [{ text: 'Конечный адрес', callback_data: 'destinationButton' }],
      [{ text: 'Назад', callback_data: 'back' }]
    ]
  };
  bot.sendMessage(chatId, 'Выберите подкнопку:', { reply_markup: inlineKeyboard });
}

function handleButtonAddressesSubMenu(chatId, data) {
  console.log("data from main handleButtonAddressesSubMenu: " + data);

  if (data === 'departureButton') {
    handleButtonDepartureAddressesSubMenu(chatId, data);
    // userStates.chatSection = 'addressesDeparture'
  } else if (data === 'subbutton1.2') {
    bot.sendMessage(chatId, 'Вы выбрали Подкнопку 1.2');
  } else if (data === 'back') {
    userStates.chatSection = 'main';
    sendMainMenu(chatId);
  } else if (data === 'backAddresses') {
    userStates.chatSection = 'addresses';
    sendButtonAddressesSubMenu(chatId);
  }
}

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

//вызывает всего 3 кнопки главного меню
function handleMainMenu(chatId, data) {
  console.log("data from main senders MainMenu: " + data);

  if (data === 'button1') {
    userStates.chatSection = 'button1';
    sendButton1SubMenu(chatId);
  } else if (data === 'addresses') {
    userStates.chatSection = 'addresses'
    sendButtonAddressesSubMenu(chatId)
  } else if (data === 'button3') {
    bot.sendMessage(chatId, 'Вы выбрали Кнопку 3');
  }
  console.log("state: " + userStates.chatSection);
}

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  sendMainMenu(chatId);
  userStates.chatSection = 'main'; // Устанавливаем начальное состояние
});

// bot.onText(/\/start/, (msg) => {
//   const chatId = msg.chat.id;
//   sendMainMenu(chatId);
//   userStates.chatSection = 'main'; // Устанавливаем начальное состояние
// });

//сюда приходят данные после нажатия любой кнопки
bot.on('callback_query', (query) => {
  const chatId = query.message?.chat.id;
  const data = query.data;
  console.log("data from main callback_query: " + data);
  console.log("state callback_query: " + userStates.chatSection);


  if (userStates.chatSection === 'main') {
    handleMainMenu(chatId, data);
  } else if (userStates.chatSection === 'button1') {
    handleButton1SubMenu(chatId, data);
  } else if (userStates.chatSection === 'addresses') {
    handleButtonAddressesSubMenu(chatId, data);
  } 
});