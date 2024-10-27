const TelegramBot = require('node-telegram-bot-api');
const { token } = require('./token');

const bot = new TelegramBot(token, { polling: true });

class UserStateManager {
  constructor() {
    this.userStates = {};
    this.userDepartureAddresses = {};
    this.userDestinationAddresses = {};
  }

  getState(chatId) {
    return this.userStates[chatId] || 'main';
  }

  setState(chatId, state) {
    this.userStates[chatId] = state;
  }

  getAddresses(chatId, type) {
    return type === 'departure' ? this.userDepartureAddresses[chatId] || [] : this.userDestinationAddresses[chatId] || [];
  }

  addAddress(chatId, type, address) {
    const addresses = type === 'departure' ? this.userDepartureAddresses : this.userDestinationAddresses;
    if (!addresses[chatId]) {
      addresses[chatId] = [];
    }
    addresses[chatId].push(address);
  }

  editAddress(chatId, type, oldAddress, newAddress) {
    const addresses = type === 'departure' ? this.userDepartureAddresses : this.userDestinationAddresses;
    addresses[chatId] = addresses[chatId].map(addr => addr === oldAddress ? newAddress : addr);
  }

  deleteAddress(chatId, type, address) {
    const addresses = type === 'departure' ? this.userDepartureAddresses : this.userDestinationAddresses;
    addresses[chatId] = addresses[chatId].filter(addr => addr !== address);
  }
}

const stateManager = new UserStateManager();

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
    stateManager.setState(chatId, 'main');
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
  const addresses = stateManager.getAddresses(chatId, 'departure');
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
  const addresses = stateManager.getAddresses(chatId, 'destination');
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
    stateManager.setState(chatId, 'adding_departure_address');
    bot.sendMessage(chatId, 'Введите новый адрес отправления:');
  } else if (data === 'back') {
    stateManager.setState(chatId, 'addresses');
    sendAddressesSubMenu(chatId);
  } else if (data.startsWith('edit_departure_')) {
    const address = data.split('_')[2];
    stateManager.setState(chatId, 'editing_departure_address');
    stateManager.setState(chatId + '_address', address);
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
    stateManager.setState(chatId, 'adding_destination_address');
    bot.sendMessage(chatId, 'Введите новый конечный адрес:');
  } else if (data === 'back') {
    stateManager.setState(chatId, 'addresses');
    sendAddressesSubMenu(chatId);
  } else if (data.startsWith('edit_destination_')) {
    const address = data.split('_')[2];
    stateManager.setState(chatId, 'editing_destination_address');
    stateManager.setState(chatId + '_address', address);
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
    stateManager.setState(chatId, 'button1');
    sendButton1SubMenu(chatId);
  } else if (data === 'addresses') {
    stateManager.setState(chatId, 'addresses');
    sendAddressesSubMenu(chatId);
  } else if (data === 'button3') {
    bot.sendMessage(chatId, 'Вы выбрали Кнопку 3');
  }
}

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (stateManager.getState(chatId) === 'adding_departure_address') {
    const newAddress = text;
    stateManager.addAddress(chatId, 'departure', newAddress);
    stateManager.setState(chatId, 'departure_addresses');
    sendDepartureAddressesSubMenu(chatId);
  } else if (stateManager.getState(chatId) === 'adding_destination_address') {
    const newAddress = text;
    stateManager.addAddress(chatId, 'destination', newAddress);
    stateManager.setState(chatId, 'destination_addresses');
    sendDestinationAddressesSubMenu(chatId);
  } else if (stateManager.getState(chatId) === 'editing_departure_address') {
    const address = stateManager.getState(chatId + '_address');
    const newAddress = text;
    stateManager.editAddress(chatId, 'departure', address, newAddress);
    stateManager.setState(chatId, 'departure_addresses');
    sendDepartureAddressesSubMenu(chatId);
  } else if (stateManager.getState(chatId) === 'editing_destination_address') {
    const address = stateManager.getState(chatId + '_address');
    const newAddress = text;
    stateManager.editAddress(chatId, 'destination', address, newAddress);
    stateManager.setState(chatId, 'destination_addresses');
    sendDestinationAddressesSubMenu(chatId);
  } else {
    sendMainMenu(chatId);
    stateManager.setState(chatId, 'main');
  }
});

bot.on('callback_query', (query) => {
  const chatId = query.message?.chat.id;
  const data = query.data;
  console.log(stateManager.getAddresses(chatId, 'departure'));
  console.log(stateManager.getAddresses(chatId, 'destination'));

  if (stateManager.getState(chatId) === 'main') {
    handleMainMenu(chatId, data);
  } else if (stateManager.getState(chatId) === 'button1') {
    handleButton1SubMenu(chatId, data);
  } else if (stateManager.getState(chatId) === 'addresses') {
    if (data === 'departure_addresses') {
      stateManager.setState(chatId, 'departure_addresses');
      sendDepartureAddressesSubMenu(chatId);
    } else if (data === 'destination_addresses') {
      stateManager.setState(chatId, 'destination_addresses');
      sendDestinationAddressesSubMenu(chatId);
    } else if (data === 'back') {
      stateManager.setState(chatId, 'main');
      sendMainMenu(chatId);
    }
  } else if (stateManager.getState(chatId) === 'departure_addresses') {
    handleDepartureAddressesSubMenu(chatId, data);
  } else if (stateManager.getState(chatId) === 'destination_addresses') {
    handleDestinationAddressesSubMenu(chatId, data);
  } else if (stateManager.getState(chatId) === 'editing_departure_address' || stateManager.getState(chatId) === 'editing_destination_address') {
    if (data === 'edit_address') {
      bot.sendMessage(chatId, 'Введите новый адрес:');
    } else if (data === 'delete_address') {
      const address = stateManager.getState(chatId + '_address');
      if (stateManager.getState(chatId) === 'editing_departure_address') {
        stateManager.deleteAddress(chatId, 'departure', address);
        stateManager.setState(chatId, 'departure_addresses');
        sendDepartureAddressesSubMenu(chatId);
      } else if (stateManager.getState(chatId) === 'editing_destination_address') {
        stateManager.deleteAddress(chatId, 'destination', address);
        stateManager.setState(chatId, 'destination_addresses');
        sendDestinationAddressesSubMenu(chatId);
      }
    } else if (data === 'back') {
      if (stateManager.getState(chatId) === 'editing_departure_address') {
        stateManager.setState(chatId, 'departure_addresses');
        sendDepartureAddressesSubMenu(chatId);
      } else if (stateManager.getState(chatId) === 'editing_destination_address') {
        stateManager.setState(chatId, 'destination_addresses');
        sendDestinationAddressesSubMenu(chatId);
      }
    }
  }
});