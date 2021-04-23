const { getReqEnvVar } = require("./helpers")

const Discord = require("discord.js")
const fetch = require("node-fetch")

// Get environment vars and check if they are defined
const ravenBotToken             = getReqEnvVar("RAVEN_BOT_TOKEN")
const ravenControlChannelId     = getReqEnvVar("RAVEN_CONTROL_CHANNEL_ID")
const ravenLogChannelId         = getReqEnvVar("RAVEN_LOG_CHANNEL_ID")

const client = new Discord.Client()

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

const awsApiGatewayUrl          = getReqEnvVar("AWS_API_GATEWAY_URL")
const awsApiGatewayKey          = getReqEnvVar("AWS_API_GATEWAY_KEY")

async function getServerStatus() {
    const url = awsApiGatewayUrl + "/serverstatus"
    const res = await fetch(url)
    const body = await res.text()
    console.log("Response:" + body)
    serverStatus = JSON.parse(body)
    serverStatus.ip = serverStatus.ip.substring(0, serverStatus.ip.length - 5) // throw away port
    return serverStatus
}

function buildStartStopUrl(desiredCount) {
    return awsApiGatewayUrl + "/startstop?key=" + awsApiGatewayKey + "&desiredCount=" + desiredCount 
}

async function fetchStartStopUrl(desiredCount) {
    const url = buildStartStopUrl(desiredCount)
    const res = await fetch(url)
    const body = await res.text()
    console.log("Desired Count: " + desiredCount + " Response:" + body)       
}

function getMemberCountChange(oldMember, newMember){
    let memberCountChange = {
        amount: 0,
        memberName: ""
    }

    if (oldMember.channelID != ravenControlChannelId && newMember.channelID == ravenControlChannelId) {
        memberCountChange.amount = 1
        memberCountChange.memberName = newMember.member.displayName
    }

    if (oldMember.channelID == ravenControlChannelId && newMember.channelID != ravenControlChannelId) {
        memberCountChange.amount = -1
        memberCountChange.memberName = oldMember.member.displayName
    }

    return memberCountChange
}

async function countMembersInControlChannel() {
    const channel = await client.channels.fetch(ravenControlChannelId)
    return channel.members.keyArray().length 
}

function writeToLogChannel(message) {
    client.channels.cache.get(ravenLogChannelId).send(message)
}

async function checkForDesiredState(hasBeenStarted, numberOfTries = 0){
    let serverStatus = await getServerStatus()
    if (serverStatus.running == hasBeenStarted) {
        if (serverStatus.running) {
            writeToLogChannel("The portal is open at: " + serverStatus.ip)
        } else {
            writeToLogChannel("The portal is closed now.")
        }
    }  else {
        if (numberOfTries < 6) {
            numberOfTries = numberOfTries + 1
            setTimeout(checkForDesiredState, 10000, hasBeenStarted, numberOfTries)
        } else {
            writeToLogChannel("I got bored. Stopped checking the portal.")
        }
    }   
}

async function startServer() {
    fetchStartStopUrl(1)
    checkForDesiredState(true)
}

async function stopServer() {
    fetchStartStopUrl(0)
    checkForDesiredState(false)
}

async function runServerControlAction(memberCountChange){
        numberOfMembersInControlChannel = await countMembersInControlChannel()
        if (numberOfMembersInControlChannel > 0) {
            if (memberCountChange.amount == 1) {
                writeToLogChannel(memberCountChange.memberName + " entered the portal room ...")
                startServer()
            }
        } else {
            writeToLogChannel("Closing the portal ...")
            stopServer()
        }
}

client.on("voiceStateUpdate", (oldMember, newMember) => {
    memberCountChange = getMemberCountChange(oldMember, newMember)
    if (memberCountChange.amount != 0) {
        runServerControlAction(memberCountChange).catch((e) => {
            writeToLogChannel("Something went wrong")
            console.error(e)
        })    
    }
})

client.login(ravenBotToken)