# Phantom - Multi-Function Discord Bot

Phantom is a JavaScript-based multi-function Discord bot designed exclusively for personal use and buyers. This bot allows you to enhance the experience on your Discord server with a customizable addon architecture that lets you create and add your own functions to the bot as needed.

## Key Features

- **Addon Architecture**: Phantom uses a modular architecture that enables you to create and add your own addons to extend the bot's capabilities. Customization is in your hands!

- **Easy Setup**: Configure Phantom on your Discord server with a few simple steps.

## Installation and Usage

1. Clone the repository URL you use for this project.

`git clone <your-repository-url>`

2. Install the dependencies.

`npm install`

3. Copy `config-example.json` to `config.json` and add the bot token, application ID, default prefix, and MongoDB URI. Keep `config.json` private; it is excluded from Git.

4. Run `npm start` to start the bot.

## Admin dashboard

Phantom includes a Discord-authenticated server dashboard. Admins can select servers where they have **Manage Server** or **Administrator** access and the bot is installed. The dashboard has live controls for:

- Audit log channel and enable/disable setting
- Ticket log and transcript channels, ticket categories, and ticket panels
- Captcha verification panels and assigned roles
- Server text-command prefix

Other Phantom modules have dedicated reference pages and list their current Discord commands. Their settings are not editable from the website because the bot does not currently expose web controls for them.

### Run locally

1. Create a Discord application and OAuth client in the [Discord Developer Portal](https://discord.com/developers/applications). Add `http://localhost:3000/auth/callback` as an OAuth2 redirect URL. Enable the bot in a test server and grant it the permissions needed by the modules you plan to use.
2. Copy `.env.example` to `.env` and fill in the Discord application ID, OAuth client secret, bot token, and MongoDB connection URI. `.env` is ignored by Git. Never commit real credentials.
3. Start the web dashboard with `npm run website`, then open `http://localhost:3000` and sign in with Discord.

Use the same MongoDB database URI in the bot's private `config.json` and the dashboard's private `.env`, so web changes and bot commands share server settings.

For deployment, use HTTPS, set `NODE_ENV=production`, set `APP_ORIGIN` and `DISCORD_REDIRECT_URI` to the site's HTTPS URLs, and store all credentials in your hosting provider's private environment settings. The dashboard uses in-memory sessions; restart logs users out. Use a persistent session store before running multiple web instances.

After sign-in, the dashboard checks every server returned by Discord for the current user, then lists every server where the user has Manage Server or Administrator permission and Phantom is installed. There is no hard-coded server list or server-count limit. The Add Phantom link lets an admin install the bot in another server; refresh the list after the install completes.

Only Discord users with Manage Server or Administrator permission can access a server's dashboard. The backend checks those permissions again for every server request, and checks that Phantom is installed in the selected server. It does not ask for or store a Discord user access token after login. The install link requests the permissions used by the current ticket, audit log, and verification modules.


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
