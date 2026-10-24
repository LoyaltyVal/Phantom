const { readdirSync, existsSync, writeFileSync } = require('fs');
const path = require('path');

function registerSlashCommands(client, addonFolder) {
  if (existsSync(path.join('./addons', addonFolder, 'slashcommands'))) {
    const slashcommandFiles = readdirSync(path.join('./addons', addonFolder, 'slashcommands')).filter((file) => file.endsWith('.js'));
    slashcommandFiles.map((file) => {
      const slashcommand = require(`../addons/${addonFolder}/slashcommands/${file}`);
      if ('data' in slashcommand && 'execute' in slashcommand) {
      client.slashcommands.set(slashcommand.data.name, slashcommand)
      client.commandData.push(slashcommand.data)
      const fs = require('fs');
      const text = require('../addons/help/utils/addonsData.json');
      
      if (text[addonFolder]) {
        if (Array.isArray(text[addonFolder])) {
          text[addonFolder].push({
            name: `${slashcommand.data.name}`,
            description: slashcommand.data.description
          });
        } else {
          text[addonFolder] = [{
            name: `${slashcommand.data.name}`,
            description: slashcommand.data.description
          }];
        }
      } else {
        text[addonFolder] = [{
          name: `${slashcommand.data.name}`,
          description: slashcommand.data.description
        }];
      }
      
      try {
        fs.writeFileSync('./addons/help/utils/addonsData.json', JSON.stringify(text, null, 2));
      } catch (err) {
        console.error('Error al escribir el archivo JSON:', err);
      }
      } else {
        client.info(file)
      }
    });
  }
}

module.exports = { registerSlashCommands };
