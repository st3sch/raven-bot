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
    serverStatus = JSON.parse(body)
    serverStatus.ip = serverStatus.ip.substring(0, serverStatus.ip.length - 5) // throw away port
    return serverStatus
}

client.on("message", async (msg)  => {
  if (msg.content === "status") {
    serverStatus = await getServerStatus()
    if (serverStatus.running) {
        msg.reply("The portal is open. The coordinates are: " + serverStatus.ip)    
    } else {
        msg.reply("The portal is closed. Join Blubbheim to open it")
    }
  } 
})


function hasMemberCountOfControlChannelChanged(oldMember, newMember){
    const memberJoined  = (oldMember.channelID != vhmControlChannelId && newMember.channelID == vhmControlChannelId)
    const memberLeft    = (oldMember.channelID == vhmControlChannelId && newMember.channelID != vhmControlChannelId)
    return (memberJoined || memberLeft) 
}

async function countMembersInControlChannel() {
    const channel = await client.channels.fetch(vhmControlChannelId)
    return channel.members.keyArray().length 
}

function buildStartStopUrl(desiredCount) {
    return awsApiGatewayUrl + "/startstop?key=" + awsApiGatewayKey + "&desiredCount=" + desiredCount 
}

async function fetchStartStopUrl(desiredCount) {
    const url = buildStartStopUrl(desiredCount)
    console.log(url)
    const res = await fetch(url)
    const body = await res.text()
    console.log(body)       
}

async function startServer() {
    await fetchStartStopUrl(1)
}

async function stopServer() {
    await fetchStartStopUrl(0)
} 

client.on("voiceStateUpdate", async (oldMember, newMember) => {
    try {
        if (!hasMemberCountOfControlChannelChanged(oldMember, newMember)) {
            return
        }

        numberOfMembersInControlChannel = await countMembersInControlChannel()
        if (currentMembersInControlChannel > 0) {
            console.log("starting server")
            //startServer()
        } else {
            console.log("stopping server")
            //stopServer()
        }
    } catch (e) {
        console.error(e)
    }
})

client.login(vhmBotToken)