const Discord = require("discord.js")
const fetch = require("node-fetch")

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

client.login(process.env.TOKEN)