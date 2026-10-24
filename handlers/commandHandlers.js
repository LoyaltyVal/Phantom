const { readdirSync, existsSync } = require('fs');
const path = require('path');

function registerCommands(client, addonFolder) {
  if (existsSync(path.join('./addons', addonFolder, 'commands'))) {
    const commandFiles = readdirSync(path.join('./addons', addonFolder, 'commands')).filter((file) => file.endsWith('.js'));
    commandFiles.map((file) => {
      const command = require(`../addons/${addonFolder}/commands/${file}`);
      client.commands.set(command.name.toLowerCase(), command)
            const fs = require('fs');
const text = require('../addons/help/utils/addonsData.json');

if (text[addonFolder]) {
  if (Array.isArray(text[addonFolder])) {
    text[addonFolder].push({
      name: `!${command.name}`,
      description: command.description
    });
  } else {
    text[addonFolder] = [{
      name: `!${command.name}`,
      description: command.description
    }];
  }
} else {
  text[addonFolder] = [{
    name: `!${command.name}`,
    description: command.description
  }];
}

try {
  fs.writeFileSync('./addons/help/utils/addonsData.json', JSON.stringify(text, null, 2));
} catch (err) {
  console.error('Error al escribir el archivo JSON:', err);
}
    });
  }
}

module.exports = { registerCommands };
