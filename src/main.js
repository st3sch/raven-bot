const Discord = require("discord.js")
const fetch = require("node-fetch")

function processEnv(name){
    const envvar = process.env[name]
    if (envvar === undefined) { 
        console.error ("Environment variable not set: " + name)
        process.exit(1)    
    }
    return envvar
}

// Get environment vars and check if they are set correctly
const valheimBotToken       = processEnv("TOKEN")
const valheimVoiceChannelId = processEnv("VHM_VOICE_CHANNEL_ID")


const client = new Discord.Client()

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on("message", msg => {
  if (msg.content === "status") {
    fetch(process.env.STATUS_URL)
    .then(res => res.text())
    .then(body => msg.reply(body))
   }
})

client.on("voiceStateUpdate", (oldMember, newMember) => {
    let hasMemberJoinedValheimVoiceChannel = (oldMember.channelID != valheimVoiceChannelId && newMember.channelID == valheimVoiceChannelId)
    let hasMemberLeftValheimVoiceChannel = (oldMember.channelID == valheimVoiceChannelId && newMember.channelID != valheimVoiceChannelId)
    if ( hasMemberJoinedValheimVoiceChannel || hasMemberLeftValheimVoiceChannel) {
        client.channels.fetch(valheimVoiceChannelId)
            .then(channel => {
                let membersInChannel = channel.members.keyArray().length
                console.log(membersInChannel)
            })
            .catch(console.error)
    }
})

client.login(valheimBotToken)