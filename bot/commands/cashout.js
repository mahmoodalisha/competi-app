export default {
  data: {
    name: "cashout",
    description: "Cash out your positions",
  },
  async execute(interaction) {
    // For now just reply
    await interaction.reply({
      content: `💸 Cashout command received!`,
      ephemeral: true,
    });

    // Later: call will the Next.js API `/api/cashout`
  },
};
