const { EmbedBuilder } = require('discord.js')
const { embedsCategories } = require('../utils/addonsData');

module.exports = {
  name: 'help-menu',
  async execute(interaction) {
  const selectedCategory = interaction.values[0];

  await interaction.update({
    embeds: [embedsCategories[selectedCategory]],
    components: [],
  });
}

}