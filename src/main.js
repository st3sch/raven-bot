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

// 
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
    console.log(oldMember.channelID)
    console.log(newMember.channelID)

    let hasMemberJoinedValheimVoiceChannel = (oldMember.channelID != valheimVoiceChannelId && newMember.channelID == valheimVoiceChannelId)
    let hasMemberLeftValheimVoiceChannel = (oldMember.channelID == valheimVoiceChannelId && newMember.channelID != valheimVoiceChannelId)
    if ( hasMemberJoinedValheimVoiceChannel || hasMemberLeftValheimVoiceChannel) {
        console.log(hasMemberJoinedValheimVoiceChannel)
        console.log(hasMemberLeftValheimVoiceChannel)
        
    }
})

client.login(valheimBotToken)