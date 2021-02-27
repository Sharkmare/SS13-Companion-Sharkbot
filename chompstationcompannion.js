try {
    Config = require('./config.json')
} catch (e) {
    console.log('\Goon encountered an error while trying to load the config file, please resolve this issue and restart Goon\n\n' + e.message)
    process.exit()
}
Config = Config.config
//This is just a function to self document a ping being made from an ID
//This should be used only for ocnfig setup really. but hey, you do you
function ping(id) {
    return "<@" + id + ">"
}
//immutable config mapping
//"but why are you doing this"
//We cant put comments into json files so this is both to document and because personally i prefer just a single word over word.word2
//If memory REALLY is that big of a concern for you then.... how much mem does your machine have this should be negligible...
const manifesttrigger = Config.manifesttrigger //Triggers are command names basically, if you make them "" it will disable the command
const reboottrigger = Config.reboottrigger //reboot command! (kills current process doesnt actually make a new one, have an external watchdog)
const singlefaxtrigger = Config.singlefaxtrigger //Single fax render process command!
const multifaxtrigger = Config.multifaxtrigger //The command that triggers the multifax render proces
const logolink = Config.logolink //In the fax part this is what replaces the NT logo in order to load it properly from web
const version = Config.version //just if ya wanna version your things yknow
const botmaster = Config.botmaster //Hey its me!, or if you fork this its you!
const botid = Config.botid //The ID of the bot itself
const defaultsudo = [botmaster, botid].concat(Config.sudo) //This is the default list of people who can use commands.
const publicfaxchannel = Config.publicfaxchannel //This is where we send our job requests! If this is "" we dont do so tho,
//The below are all our department roles! Personally i instantly convert em to ping formatting
const security = ping(Config.security)
const cargo = ping(Config.cargo)
const medical = ping(Config.medical)
const exploration = ping(Config.exploration)
const science = ping(Config.science)
const service = ping(Config.service)
const command = ping(Config.command)
const faxdir = Config.faxdir


//console.log(reboottrigger)
//Requirements
//Important, download the original trim image first to install dependencies, then grab my fork from my github
//The only file that needs to be replaced on trim image is the index.js
const trimImage = require("trim-image"), //The library i modified to detect white pixels, remember to follow above steps.
    fs = require("fs"), 
    path = require("path"), 
    nodeHtmlToImage = require("node-html-to-image"), //Server side HTML rendering, lets go boys
    discordie = require("discordie"); //This library is old and doesnt feature new discord features but we dont need those.
const axios = require("axios"); // IF i ever add web request stuff this will be useed for such


bot = new discordie({
    messageCacheLimit: 50, //we dont need a lot of memory
    autoReconnect: true,
});
bot.connect({
    token: Config.token
})
bot.Dispatcher.on("GATEWAY_READY", e => {
    console.log("Connected as: " + bot.User.username + "\n" + version);
});

//This is a function to send a message to a specific channel.
function CM(channel, message) {
    bot.Channels.get(channel).sendMessage(message)
}
//This is a function to upload a file to a specific channel.
function CMU(channel, message, file) {
    bot.Channels.get(channel).uploadFile(file, file, message)
}
//necromsg.channel.;
//General validation.
//This function checks if our command is called
function validate(e, trigger, allowed) {

    //Check if our command should be disabled by the config
    if (!trigger)
        return false
    //Check if server message
    if (!e.message.guild) {
        return false
    }
    //check if trigger word
    if (e.message && e.message.content.includes(trigger)) {

    } else return false;
    //check if allowed user
    if (!allowed.includes(e.message.author.id)) {
        return false
    }
    console.log(trigger + " by " + e.message.author.username)
    return true
}

//debugging shit
//reboot node
bot.Dispatcher.on("MESSAGE_CREATE", e => {

    var guild;
    var msg;
    if (!validate(e, reboottrigger, defaultsudo))
        return
    guild = e.message.guild.name
    msg = e.message


    process.exit() //Non gracefully kills the process forcing use to reconnect and rerun all scripts.
})

//arbitrary node system
bot.Dispatcher.on("MESSAGE_CREATE", e => {

    var guild;
    var msg;
    if (!validate(e, "-tryrun", defaultsudo))
        return
    guild = e.message.guild.name
    msg = e.message

    //code here
    fs.writeFileSync("tempjs.js", command)
    var child_process = require('child_process'); //we need this module
    child_process.exec("node tempjs.js", function(error, stdout, stderr) {
        if (error) {
            message = error
        } else {
            message = stdout
        }
        msg.reply("Response:\n" + message);
    });
    //code end
})

//manifest
bot.Dispatcher.on("MESSAGE_CREATE", e => {

    var guild;
    var msg;
    if (!validate(e, manifesttrigger, defaultsudo))
        return
    guild = e.message.guild.name
    msg = e.message

    var html = fs.readFileSync('./html.html', 'utf8', );
    //console.log(html)
    var necromsg = msg
    msg.delete()
    nodeHtmlToImage({
            output: './image.png',
            html
        })
        .then(() => {
            console.log("OWO")
            trimImage(`./image.png`, `./image2.png`, {}, (err) => {
                if (err) {
                    console.log(err);
                    return 1;
                }
                console.log(1)
                return 0;
            });
        })
    setTimeout(function() {
        console.log(2)
        necromsg.channel.uploadFile("image2.png", "manifest.png");
    }, 5000);
})

//faxes
bot.Dispatcher.on("MESSAGE_CREATE", e => {

    var guild;
    var msg;
    if (!validate(e, singlefaxtrigger, defaultsudo))
        return
    guild = e.message.guild.name
    msg = e.message

    var fid = msg.content.split(singlefaxtrigger)[1].split(" ")[0].replace("*", "").replace("*", "").replace("*", "").replace("*", "").replace("*", "").replace("*", "")
    console.log(fid)


    try {
        var html = fs.readFileSync(faxdir + fid + ".html", 'utf8', );
    } catch (e) {
        return console.log(e)
    }
    html = html.replace("ntlogo.png", logolink)
    //console.log(html)
    var necromsg = msg
    //msg.delete()
    nodeHtmlToImage({
            output: './image.png',
            html
        })
        .then(() => {
            console.log("OWO")
            trimImage(`./image.png`, `./image2.png`, {}, (err) => {
                if (err) {
                    console.log(err);
                    return 1;
                }
                console.log(1)
                return 0;
            });
        })
    setTimeout(function() {
        console.log(2)
        necromsg.channel.uploadFile("image2.png", "singlefax.png");
        if (publicfaxchannel && html.includes("request: ")) {
            //The below variable starts out as a youg little string containing the department name, but then it will grow up to a big strong ping.
            //unless soeone misspellt the department, we COULD just not ping in such a case i guess
            department = message.split("request: ")[1].split(" ")[0].split("\n")[0].split("<")[0] //These splits make sure we ALWAYS get the word after request even if some funny guy only writes request and the dep


            switch (department) {
                case "security":
                    department = security
                    break;
                case "cargo":
                    department = cargo
                    break;
                case "medical":
                    department = medical
                    break;
                case "exploration":
                    department = exploration
                    break;
                case "science":
                    department = science
                    break;
                case "service":
                    department = service
                    break;
                case "command":
                    department = command
                    break;
                default:
                    department = false //so we can easily check if we succeeded in replacing
                    // code block
            }
            if (department) //department check.//If you want everything relayed, simply change the default to write some default message.
                CMU(publicfaxchannel, department, "image2.png")

        }

    }, 5000);
})

//MuliFax integration
bot.Dispatcher.on("MESSAGE_CREATE", e => {

    var guild;
    var msg;
    if (!validate(e, multifaxtrigger, defaultsudo))
        return
    guild = e.message.guild.name
    msg = e.message

    var fids = msg.content.split(multifaxtrigger)[1].split("|")
    //console.log(fids)
    for (i = 0; i < fids.length; i++) {
        let fid = fids[i]

        try {
            var html = fs.readFileSync(faxdir + fid + ".html", 'utf8', );
        } catch (e) {
            return console.log(e)
        }
        html = html.replace("ntlogo.png", logolink)
        console.log(html)
        var necromsg = msg
        //msg.delete()
        nodeHtmlToImage({
                output: './' + fid + '.png',
                html
            })
            .then(() => {
                console.log("OWO")
                trimImage(`./` + fid + `.png`, `./` + fid + `2.png`, {}, (err) => {
                    if (err) {
                        console.log(err);
                        return 1;
                    }
                    console.log(1)
                    return 0;
                });
            })
        setTimeout(function() {
            console.log(2)
            necromsg.channel.uploadFile(fid + "2.png", "multifax" + [i] + ".png");
        }, 5000);
    }
})
