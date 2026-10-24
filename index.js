const { TOKEN, DEFAULT_PREFIX, MONGODB_URI } = require('./config')
const { Client, Collection } = require('discord.js');
const mongoose = require('mongoose');

const { loadAddons } = require('./utils/loadAddons');
const { botConfig } = require('./utils/config');

// Crear instancia del cliente
const client = new Client(botConfig);

// Configurar propiedades del cliente
setupClientProperties(client);

// Cargar addons
loadAddons(client);

// Iniciar sesión
loginToDiscord(client);

// Manejar rechazos no manejados
handleUnhandledRejections();

connectMongo();

function connectMongo() {
  mongoose.connect(MONGODB_URI)
   .then(() => client.info('Connected to MongoDB'))
   .catch((err) => console.error('Error connecting to MongoDB:', err));
}


// Funciones

function setupClientProperties(client) {
  client.info = function info(message) {
    console.log(`\u001B[32m[${new Date().toLocaleTimeString()}] ${message}\u001B[0m`);
  };

  client.prefix = DEFAULT_PREFIX;
  client.commands = new Collection();
  client.slashcommands = new Collection();
  client.buttons = new Collection();
  client.selectMenus = new Collection();
  client.contextCommands = new Collection();
  client.modals = new Collection();
  client.addonEvents = new Collection();
  client.commandData = [];
}

function loginToDiscord(client) {
  client.login(TOKEN)
    .then(() => client.info(`The ${client.user.tag} bot loaded correctly.`))
    .catch((err) => {
      console.error('Error logging in with the provided token:', err);
      process.exit(1);
    });
}

function handleUnhandledRejections() {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
  });
}

module.exports = client
