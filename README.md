# Phantom - Multi-Function Discord Bot

![Phantom Logo](link_to_your_logo_image.png)

Phantom is a JavaScript-based multi-function Discord bot designed exclusively for personal use and buyers. This bot allows you to enhance the experience on your Discord server with a customizable addon architecture that lets you create and add your own functions to the bot as needed.

## Key Features

- **Addon Architecture**: Phantom uses a modular architecture that enables you to create and add your own addons to extend the bot's capabilities. Customization is in your hands!

- **Easy Setup**: Configure Phantom on your Discord server with a few simple steps.

## Installation and Usage

1. Clone this repository to your local machine.

`git clone https://github.com/helydev/Phantom`

2. Install the dependencies.

`npm install`

3. Configure your Discord bot and obtain a bot token from the [Discord Developer Portal](https://discord.com/developers/applications).

4. Rename a `.env-example` to `.env` file in the project's root directory and place your Discord bot token and the other required settings.

5. Run the bot.

`node index.js`

6. Phantom should now be running on your Discord server.


## Addons

Phantom uses addons to extend its functionality. You can create your own addons by following this directory structure:

```
addons
|-- Your-addon
|-- |-- buttons
|-- |-- |-- your_button.js
|-- |-- commands
|-- |-- |-- your_command.js
|-- |-- contextmenus
|-- |-- |-- your_context_menu.js
|-- |-- events
|-- |-- |-- your_event.js
|-- |-- modals
|-- |-- |-- your_modal.js
|-- |-- selectmenus
|-- |-- |-- your_select_menu.js
|-- |-- slashcommands
|-- |-- |-- your_slash_command.js
```

To create an addon:

1. Create a folder with your addon's name within the `addons` directory.

2. Inside your addon's folder, create subfolders for `buttons`, `commands`, `contextmenus`, `events`, `modals`, `selectmenus`, and `slashcommands`.

3. Place your custom JavaScript files (`.js`) within the respective subfolders. For example, if you're creating a custom command, place it in the `commands` folder.

By following this structure, Phantom will automatically load your addons and make them available for use.

This updated structure allows for a more organized approach to adding custom functionality to Phantom.


## Contribution

This project is designed exclusively for personal use and for buyers, and therefore, external contributions are not accepted.

## License

This project is protected by a private license and is only permitted for personal use and by buyers. Public distribution, resale, and copying are strictly prohibited without explicit permission from the license holder.

---

Enjoy using Phantom on your Discord server and customize its functions with your own addons! If you have any questions or issues, feel free to contact the developer.
