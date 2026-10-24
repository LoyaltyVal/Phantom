const ticketModel = require('../models/ticketModel');
const { EmbedBuilder, SlashCommandBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, PermissionFlagsBits} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-manager')
        .setDescription('Manage tickets for your server')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(option => option
            .setName('sendpanel')
            .setDescription('Create a new ticket panel')
            .addChannelOption(option => option
                .setName('channel')
                .setDescription('The channel where the ticket panel will be sent')
                .addChannelTypes(ChannelType.GuildText)
            )
        )
        .addSubcommand(option => option
            .setName('setup')
            .setDescription('Setup the ticket system')
            .addChannelOption(option => option
                .setName('channellog')
                .setDescription('The channel where logs about tickets will be posted')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
            )
            .addChannelOption(option => option
                .setName('channeltranscript')
                .setDescription('The channel where transcripts of tickets will be posted')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
            )
        )
        .addSubcommandGroup(option => option
            .setName('categories')
            .setDescription('Manage ticket categories')
            .addSubcommand(option => option
                .setName('create')
                .setDescription('Create a new ticket category')
                .addStringOption(option => option
                    .setName('name')
                    .setDescription('The name of the ticket category')
                    .setRequired(true)
                )
                .addStringOption(option => option
                    .setName('emoji')
                    .setDescription('The emoji representing the ticket category')
                    .setRequired(true)
                )
                .addStringOption(option => option
                    .setName('description')
                    .setDescription('The description of the ticket category')
                    .setRequired(true)
                )
                .addStringOption(option => option
                    .setName('style')
                    .setDescription('The style of the ticket category (default, success, danger, info)')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Red', value: 'Danger' },
                        { name: 'Green', value: 'Success' },
                        { name: 'Blue', value: 'Primary' },
                        { name: 'Grey', value: 'Secondary' }
                    )
                )
                .addRoleOption(option => option
                    .setName('role')
                    .setDescription('The role that will be automatically added to users when they create a ticket')
                    .setRequired(true)
                )
                .addChannelOption(option => option
                    .setName('category')
                    .setDescription('The category the ticket will be placed in')
                    .addChannelTypes(ChannelType.GuildCategory)
                    .setRequired(true)
                )
            )
            .addSubcommand(option => option
                .setName('delete')
                .setDescription('Delete a ticket category')
                .addStringOption(option => option
                    .setName('name')
                    .setDescription('The name of the ticket category to delete')
                    .setRequired(true)
                )
            )
            .addSubcommand(option => option
                .setName('list')
                .setDescription('List all ticket categories')
            )
        ),

    async execute(interaction) {
        const { options, channel, guild } = interaction;
        const subcommand = options.getSubcommand();
        const subcommandGroup = options.getSubcommandGroup(false);

        let ticketData = await ticketModel.findOne({ guildId: guild.id });

        if (['sendpanel', 'create', 'delete', 'list'].includes(subcommand) && (!ticketData || !ticketData.channelLog || !ticketData.channelTranscript)) {
            return interaction.reply({
                content: 'Missing configuration for the ticket system. Please configure it using `/ticket-manager setup`',
                ephemeral: true
            });
        }

        switch (subcommand) {
            case 'sendpanel':
                const channelTarget = options.getChannel('channel') || channel;
                const row = new ActionRowBuilder();

                ticketData.categories.forEach(category => {
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`ticketCategories-${category.name}`)
                            .setLabel(category.name)
                            .setEmoji(category.emoji)
                            .setStyle(category.style)
                    );
                });

                const embed = new EmbedBuilder()
                    .setTitle('Create Ticket')
                    .setColor('Blue')
                    .setFooter({ text: `Ticket Panel for ${guild.name}`, iconURL: guild.iconURL() })
                    .setDescription(
                        `By clicking one of the corresponding button categories on this message, you will create a ticket with direct and private access to the staff.\n\n` +
                        `**__Categories__**\n${ticketData.categories.map(x => `> ${x.emoji} - **${x.description}**`).join('\n')}\n\n` +
                        `**__Ticket Information__**\n` +
                        `\`•\` Before creating a ticket, please read the appropriate FAQ channels.\n` +
                        `\`•\` Abuse of the ticket system will result in punishment(s).`
                    );

                const msg = await channelTarget.send({
                    embeds: [embed],
                    components: [row]
                });

                ticketData.categoryPanel = msg.id;
                await ticketData.save();

                return interaction.reply({
                    content: 'Ticket panel created successfully!',
                    ephemeral: true
                });

            case 'setup':
                ticketData = ticketData || new ticketModel({ guildId: guild.id });
                ticketData.channelLog = options.getChannel('channellog').id;
                ticketData.channelTranscript = options.getChannel('channeltranscript').id;
                await ticketData.save();

                return interaction.reply({
                    content: 'Ticket system setup successfully!',
                    ephemeral: true
                });

            case 'create':
                if (subcommandGroup !== 'categories') return;

                const newCategory = {
                    name: options.getString('name'),
                    emoji: options.getString('emoji'),
                    description: options.getString('description'),
                    style: options.getString('style'),
                    role: options.getRole('role').id,
                    channel: options.getChannel('category').id
                };

                if (ticketData.categories.some(cat => cat.name.toLowerCase() === newCategory.name.toLowerCase())) {
                    return interaction.reply({
                        content: 'A category with the same name already exists.',
                        ephemeral: true
                    });
                }

                ticketData.categories.push(newCategory);
                await ticketData.save();

                return interaction.reply({
                    content: `Ticket category "${newCategory.name}" created successfully!`,
                    ephemeral: true
                });

            case 'delete':
                if (subcommandGroup !== 'categories') return;

                const categoryNameToDelete = options.getString('name').toLowerCase();
                const categoryIndex = ticketData.categories.findIndex(cat => cat.name.toLowerCase() === categoryNameToDelete);

                if (categoryIndex === -1) {
                    return interaction.reply({
                        content: 'A category with the specified name does not exist.',
                        ephemeral: true
                    });
                }

                ticketData.categories.splice(categoryIndex, 1);
                await ticketData.save();

                return interaction.reply({
                    content: `Ticket category "${options.getString('name')}" deleted successfully!`,
                    ephemeral: true
                });

            case 'list':
                const categoriesList = ticketData.categories.map(cat => `${cat.emoji} - **${cat.description}**`).join('\n');

                const categoriesEmbed = new EmbedBuilder()
                    .setTitle('Ticket Categories')
                    .setDescription(categoriesList || 'No categories found.');

                return interaction.reply({ embeds: [categoriesEmbed], ephemeral: true });

            default:
                return interaction.reply({
                    content: 'Invalid subcommand. Use `/ticket-manager` for a list of available commands.',
                    ephemeral: true
                });
        }
    }
};