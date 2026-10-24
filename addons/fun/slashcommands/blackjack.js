const economyModel = require('../../economy/models/economyModel');
const { SlashCommandBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ChatInputCommandInteraction, ChannelManager } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Play blackjack with your coins.')
    .addNumberOption(option =>
      option
        .setName('amount')
        .setDescription('The amount you want to bet.')
        .setMinValue(100)
        .setRequired(true)
    ),
  /**
   * @param {ChatInputCommandInteraction} interaction 
   * @param {ChannelManager} channel
   */
  async execute(interaction) {
    const amount = interaction.options.getNumber('amount');
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const economyData = await economyModel.findOne({ guildId, userId });

    if (!economyData || economyData.balance < amount) {
      return interaction.reply({
        content: 'You do not have enough coins to make this bet.',
        ephemeral: true
      });
    }

		await interaction.deferReply();
    await startBlackjackGame(interaction, economyData, amount);
  }
};

async function startBlackjackGame(interaction, economyData, betAmount) {
  const deck = createAndShuffleDeck();
  let playerHand = [drawCard(deck), drawCard(deck)];
  let dealerHand = [drawCard(deck), drawCard(deck)];

  let playerTotal = calculateHandValue(playerHand);
  let dealerTotal = calculateHandValue(dealerHand);

  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext('2d');
  await drawInitialGameScreen(ctx, playerHand, dealerHand);

  const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'blackjack.png' });
  const row = createActionButtonRow(economyData.balance, betAmount);

  try {
    await interaction.reply({ components: [row], files: [attachment] });
  } catch {
    await interaction.editReply({ components: [row], files: [attachment] });
  }

  const fetchReply = await interaction.fetchReply();
  const collector = fetchReply.createMessageComponentCollector({ 
    filter: i => ['blackjack_hit', 'blackjack_stand', 'blackjack_d_down'].includes(i.customId) && i.user.id === interaction.user.id,
    time: 60000,
    max: 1
  });

  collector.on('collect', async i => {
    await i.deferUpdate();
    await handleUserAction(i, interaction, economyData, betAmount, deck, playerHand, dealerHand, ctx);
  });

  collector.on('end', async () => {
    if (!collector.ended) {
      await interaction.editReply({ content: 'Game ended due to inactivity.', components: [] });
    }
  });
}

function createActionButtonRow(balance, betAmount) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setStyle('Primary')
      .setCustomId('blackjack_hit')
      .setLabel('Hit'),
    new ButtonBuilder()
      .setStyle('Success')
      .setCustomId('blackjack_stand')
      .setLabel('Stand'),
    new ButtonBuilder()
      .setStyle('Secondary')
      .setCustomId('blackjack_d_down')
      .setLabel('Double down')
      .setDisabled(balance < betAmount * 2)
  );
}

async function handleUserAction(i, interaction, economyData, betAmount, deck, playerHand, dealerHand, ctx) {
  switch (i.customId) {
    case 'blackjack_hit':
      playerHand.push(drawCard(deck));
      const playerTotal = calculateHandValue(playerHand);
      await drawCards(ctx, playerHand, 50, 50);
      if (playerTotal > 21) {
        await endGame(interaction, economyData, -betAmount, 'You have busted. The dealer wins!', ctx);
      } else {
        await interaction.editReply({ files: [new AttachmentBuilder(await ctx.canvas.encode('png'), { name: 'blackjack.png' })] });
        await startBlackjackGame(interaction, economyData, betAmount, deck, playerHand, dealerHand);
      }
      break;
    case 'blackjack_stand':
      await dealerTurn(interaction, economyData, betAmount, deck, playerHand, dealerHand, ctx);
      break;
    case 'blackjack_d_down':
      betAmount *= 2;
      playerHand.push(drawCard(deck));
      const doubleDownTotal = calculateHandValue(playerHand);
      if (doubleDownTotal > 21) {
        await endGame(interaction, economyData, -betAmount, 'You have busted. The dealer wins!', ctx);
      } else {
        await dealerTurn(interaction, economyData, betAmount, deck, playerHand, dealerHand, ctx);
      }
      break;
  }
}

async function dealerTurn(interaction, economyData, betAmount, deck, playerHand, dealerHand, ctx) {
  let dealerTotal = calculateHandValue(dealerHand);

  while (dealerTotal < 17) {
    dealerHand.push(drawCard(deck));
    dealerTotal = calculateHandValue(dealerHand);
  }

  await drawCards(ctx, dealerHand, 400, 210);
  const playerTotal = calculateHandValue(playerHand);

  if (dealerTotal > 21 || playerTotal > dealerTotal) {
    await endGame(interaction, economyData, betAmount, 'Congratulations! You have won the bet.', ctx);
  } else if (dealerTotal > playerTotal) {
    await endGame(interaction, economyData, -betAmount, 'The dealer wins. Better luck next time.', ctx);
  } else {
    await endGame(interaction, economyData, 0, 'It\'s a tie. Your bet has been returned.', ctx);
  }
}

async function endGame(interaction, economyData, amountChange, resultMessage, ctx) {
  economyData.balance += amountChange;
  await economyData.save();

  const finalAttachment = new AttachmentBuilder(await ctx.canvas.encode('png'), { name: 'blackjack_end.png' });
  await interaction.editReply({ content: resultMessage, files: [finalAttachment], components: [] });
}

async function drawInitialGameScreen(ctx, playerHand, dealerHand) {
  const texture = await loadImage(path.join(__dirname, '../card/texture.jpg'));
  ctx.globalAlpha = 0.5;
  ctx.drawImage(texture, 0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.globalAlpha = 1;

  await drawCards(ctx, playerHand, 50, 50);
  await drawCards(ctx, [dealerHand[0], getBackCard()], 400, 210);
}

const suitCard = ['spades', 'clubs', 'hearts', 'diamonds'];
const valueCard = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function createAndShuffleDeck() {
  const deck = suitCard.flatMap(suit => valueCard.map(value => new Card(value, suit)));
  return shuffleDeck(deck);
}

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function drawCard(deck) {
  return deck.pop();
}

class Card {
  constructor(value, suit) {
    this.value = value;
    this.suit = suit;
    this.imagePath = path.join(__dirname, `../card/${value}_of_${suit}.png`);
  }
}

function calculateHandValue(hand) {
  let value = 0;
  let aceCount = 0;

  hand.forEach(card => {
    if (['J', 'Q', 'K'].includes(card.value)) {
      value += 10;
    } else if (card.value === 'A') {
      aceCount++;
      value += 11;
    } else {
      value += parseInt(card.value);
    }
  });

  while (value > 21 && aceCount > 0) {
    value -= 10;
    aceCount--;
  }

  return value;
}

async function drawCards(ctx, hand, startX, startY) {
  for (let i = 0; i < hand.length; i++) {
    const card = hand[i];
    const img = await loadImage(card.imagePath);
    ctx.drawImage(img, startX + i * 120, startY, 100, 150);
  }
}

function getBackCard() {
  return { imagePath: path.join(__dirname, '../card/back.png') };
}
