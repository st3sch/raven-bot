const helpers = require("./helpers");
const fetch = require("node-fetch");

const awsApiGatewayUrl = helpers.getReqEnvVar("AWS_API_GATEWAY_URL");
const awsApiGatewayKey = helpers.getReqEnvVar("AWS_API_GATEWAY_KEY");

async function getServerStatus() {
    const url = awsApiGatewayUrl + "/serverstatus";
    const res = await fetch(url);
    const body = await res.text();
    console.log("Response:" + body);
    serverStatus = JSON.parse(body);
    serverStatus.ip = serverStatus.ip.substring(0, serverStatus.ip.length - 5); // throw away port
    return serverStatus;
}

function buildStartStopUrl(desiredCount) {
    return awsApiGatewayUrl + "/startstop?key=" + awsApiGatewayKey + "&desiredCount=" + desiredCount;
}


async function callStartStopUrl(desiredCount) {
    const url = buildStartStopUrl(desiredCount);
    const res = await fetch(url);
    const body = await res.text();
    console.log("Desired Count: " + desiredCount + " Response:" + body);
}

module.exports = {
    getServerStatus,
    callStartStopUrl
}