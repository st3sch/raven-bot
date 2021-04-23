const helpers = require("./helpers")
const serverGateway = require("./server-gateway")

const Discord = require("discord.js")

// Get environment vars and check if they are defined
const ravenBotToken             = helpers.getReqEnvVar("RAVEN_BOT_TOKEN")
const ravenControlChannelId     = helpers.getReqEnvVar("RAVEN_CONTROL_CHANNEL_ID")
const ravenLogChannelId         = helpers.getReqEnvVar("RAVEN_LOG_CHANNEL_ID")

const client = new Discord.Client()

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

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
    let serverStatus = await serverGateway.getServerStatus()
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
    serverGateway.fetchStartStopUrl(1)
    checkForDesiredState(true)
}

async function stopServer() {
    serverGateway.fetchStartStopUrl(0)
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