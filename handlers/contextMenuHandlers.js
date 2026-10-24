const { readdirSync, existsSync } = require('fs');
const path = require('path');

function registerContextMenu(client, addonFolder) {
  if (existsSync(path.join('./addons', addonFolder, 'contextmenus'))) {
    const contextmenuFiles = readdirSync(path.join('./addons', addonFolder, 'contextmenus')).filter((file) => file.endsWith('.js'));
    contextmenuFiles.map((file) => {
      const contextmenu = require(`../addons/${addonFolder}/contextmenus/${file}`);
      if ('data' in contextmenu && 'execute' in contextmenu) {
        client.contextCommands.set(contextmenu.data.name, contextmenu)
        client.commandData.push(contextmenu.data.toJSON())
      } else {
        client.info(`[WARNING] The contextmenu at ${addonFolder + "/" + file} is missing a required "data" or "execute" property.`);
      }
    });
  }
}

module.exports = { registerContextMenu };
