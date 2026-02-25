const oceanic = require("oceanic.js");
const nerimity = require("@nerimity/nerimity.js");
const config = require("./config.json");

const discordBot = new oceanic.Client({
    auth: "Bot " + config.discord.token,
    gateway: { intents: ["GUILDS", "GUILD_MESSAGES", "MESSAGE_CONTENT"] },
});

const nerimityBot = new nerimity.Client();

const webhook = new oceanic.Webhook(
    {
        token:
            config.discord.whtoken,
        id: config.discord.whid,
    },
    discordBot
);
const nerimityWebhook = new nerimity.WebhookBuilder(
    config.nerimity.whurl
);

nerimityBot.on("ready", () => {
    console.log("Nerimity logged in!");
});

discordBot.on("ready", async () => {
    console.log("Discord logged in");
});

function stripOldReplyHeader(input) {
    let text = String(input ?? "");
    text = text.replace(/\r\n/g, "\n");

    while (true) {
        const before = text;

        text = text.replace(/^\n+/, "");

        text = text.replace(/^> *@[^:\n]{1,64}:[^\n]*\n?(\n)?/, "");
        text = text.replace(/^@[^:\n]{1,64}:[^\n]*\n?(\n)?/, "");

        if (text === before) break;
    }

    return text;
}

nerimityBot.on(nerimity.Events.MessageCreate, async (message) => {
    if (message.user.bot) return;
    if (message.channel.id !== config.nerimity.channelID) return;
    let channel = discordBot.getChannel(config.discord.channelID);
    if (!channel) return;
    let content = stripOldReplyHeader(message.content);
    if (message.replies.first()) {
        let replyingMessage = message.replies.first();
        const repliedPreview = stripOldReplyHeader(replyingMessage.content);
        content = `\n> @${replyingMessage.user.username}: ${repliedPreview}\n${content}`;
    }
    if(!content) content = '[Attachment]'
    try {
        webhook.execute({
            content: `${content}`,
            avatarURL: `${`https://cdn.nerimity.com/${message.user.avatar}` ??
                "https://github.com/FeatherUtils/feather/blob/master/pack_icon.png?raw=true"
                }`,
            username: `${message.user.username}`,
        });
    } catch { }
});

discordBot.on("messageCreate", async (message) => {
    if (!message.member?.id) return;
    if (message.channel.id !== config.discord.channelID) return;
    let content = stripOldReplyHeader(message.content);
    if (message.referencedMessage) {
        let replyingMessage = message.referencedMessage;
        const repliedPreview = stripOldReplyHeader(replyingMessage.content);
        content = `\n> @${replyingMessage.author.username}: ${repliedPreview}\n${content}`;
    }
    nerimityWebhook.setUsername(message.member.nick ? message.member.nick ? message.member.nick : message.member.displayName : message.member.displayName ? message.member.displayName : message.member.username);
    nerimityWebhook.setAvatar(
        `${message.member.avatarURL('png') ??
        "https://github.com/FeatherUtils/feather/blob/master/pack_icon.png?raw=true"
        }`
    );
    if(!content) content = '[Attachment]';
    try {
        nerimityWebhook.send(content);
    } catch { }
});

discordBot.on("error", (err) => {
    console.error("Noo discord error", err);
});

nerimityBot.login(config.nerimity.token);
discordBot.connect();