const Discord = require("discord.js")
const fetch = require("node-fetch")

function getReqEnvVar(name){
    const envvar = process.env[name]
    if (envvar === undefined) { 
        console.error ("Environment variable not set: " + name)
        process.exit(1)    
    }
    return envvar
}

// Get environment vars and check if they are set correctly
const vhmBotToken           = getReqEnvVar("TOKEN")
const vhmControlChannelId   = getReqEnvVar("VHM_VOICE_CHANNEL_ID")
const awsApiGatewayUrl      = getReqEnvVar("AWS_API_GATEWAY_URL")
const awsApiGatewayKey      = getReqEnvVar("AWS_API_GATEWAY_KEY")


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
    let hasMemberJoinedValheimVoiceChannel = (oldMember.channelID != vhmControlChannelId && newMember.channelID == vhmControlChannelId)
    let hasMemberLeftValheimVoiceChannel = (oldMember.channelID == vhmControlChannelId && newMember.channelID != vhmControlChannelId)
    if ( hasMemberJoinedValheimVoiceChannel || hasMemberLeftValheimVoiceChannel) {
        client.channels.fetch(vhmControlChannelId)
            .then(channel => {
                let membersInChannel = channel.members.keyArray().length
                console.log(membersInChannel)
            })
            .catch(console.error)
    }
})

client.login(vhmBotToken)