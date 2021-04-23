function getReqEnvVar(name) {
    const envvar = process.env[name];
    if (envvar === undefined) {
        console.error("Environment variable not set: " + name);
        process.exit(1);
    }
    return envvar;
}
module.exports = {
    getReqEnvVar
}
