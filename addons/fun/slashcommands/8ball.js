const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: '8ball',
    description: 'Ask the 8ball and get an answer',
    integration_types: [1],
    contexts: [0, 1, 2],
    options: [{
      name: 'question',
      description: 'Ask a question',
      type: 3,
      required: true
    }]
  },
  async execute(interaction) {
    const { options, user, client, locale } = interaction;
    const question = options.getString('question');
    const responses = [
      "Yes.", "No.", "I don't know.", "100% sure yes.", "100% sure no.",
      "It could be.", "Maybe.", "Definitely yes.", "Definitely no.",
      "Ask again later.", "Don't count on it.", "My sources say no.",
      "Looks good.", "Very doubtful.", "The answer is a resounding yes.",
      "The answer is a resounding no.", "I'm not sure, ask me again.",
      "Better not tell you now.", "My sources say yes.", "Probably."
    ];
    const result = Math.floor((Math.random() * responses.length));

    const embed = new EmbedBuilder()
      .setAuthor({
        name: '8Ball',
        iconURL: user.displayAvatarURL(),
      })
      .addFields(
        { name: 'Question', value: question },
        { name: 'Answer', value: responses[result] }
      )
      .setColor('Green')
      .setTimestamp()
      .setFooter({
        text: client.user.username,
        iconURL: client.user.displayAvatarURL(),
      });

    await interaction.reply({ embeds: [embed] });
  },
};