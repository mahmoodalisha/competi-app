export default {
  data: {
    name: "cashout",
    description: "Cash out your positions",
  },
  async execute(interaction) {
    const discordId = interaction.user.id;

    await interaction.deferReply({ ephemeral: true });

    const res = await fetch("http://localhost:3000/api/session/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discordUserId: discordId }),
    });

    const data = await res.json();
    if (data.error) {
      return interaction.editReply(`❌ Failed to create session: ${data.error}`);
    }

    await interaction.editReply(`💸 Cashout session created!\nClick here: ${data.url}`);
  },
};
