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



// Get environment vars and check if they are defined
const vhmBotToken           = getReqEnvVar("TOKEN")
const vhmControlChannelId   = getReqEnvVar("VHM_VOICE_CHANNEL_ID")
const awsApiGatewayUrl      = getReqEnvVar("AWS_API_GATEWAY_URL")
const awsApiGatewayKey      = getReqEnvVar("AWS_API_GATEWAY_KEY")


const client = new Discord.Client()

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

async function getServerStatus() {
    const url = awsApiGatewayUrl + "/serverstatus"
    const res = await fetch(url)
    const body = await res.text()
    console.log(body)
    serverStatus = JSON.parse(body)
    serverStatus.ip = serverStatus.ip.substring(0, serverStatus.ip.length - 5)
    return serverStatus
}

client.on("message", async (msg)  => {
  if (msg.content === "status") {
    serverStatus = await getServerStatus()
    if (serverStatus.running) {
        msg.reply("The portal is open. The koordinates are: " + serverStatus.ip)    
    } else {
        msg.reply("The portal is closed. Join Blubbheim to open it")
    }
    
    
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
body})

client.login(vhmBotToken)