// Made by Stratiz

// init project
const express = require('express');
var bodyParser = require('body-parser');
const https = require('https');
const app = express();
const {
    Client,
    MessageEmbed
} = require('discord.js');
let client = new Client();



//// IMPORTANT VVV
let token = process.env.SECRET //Your token goes in key.env (Discord bot)
let prefix = ';'; // Discord bot prefix
let rolename = "rolenamehere"
/// IMPORTANT ^^^

let numbers = [
  "0️⃣",
  "1️⃣",
  "2️⃣",
  "3️⃣",
  "4️⃣"
]

async function startApp() {
    var promise = client.login(token)
    console.log("Starting...");
    promise.catch(function(error) {
      console.error("Discord bot login | " + error);
      process.exit(1);
    });
}
startApp();
client.on("ready", () => {
  console.log("Successfully logged in Discord bot.");
})

const Invalid = new MessageEmbed()
  .setColor('#eb4034')
  .setDescription("Invalid user")



var toBan = [];
function byUID(method,usr,message) {
  const Emb = new MessageEmbed()
      .setColor('#fff200')
      //.setTitle(request.headers.username + "'s Data")
     // .setTitle("Attempt")
      //.setAuthor('Roblox Error','')
      .setDescription("Attempting to "+method+" UserID "+ usr +"...")
      .setTimestamp()
      .setFooter('Developed by Stratiz');
    message.edit(Emb);
  https.get("https://api.roblox.com/users/" + usr, (res) => {
      
      let data = '';
      res.on('data', d => {
        data += d
      })
      res.on('end', () => {
        if (res.statusCode == 200) {
          toBan.push({method: method,username: JSON.parse(data).Username,value: usr,cid: message.channel.id,mid: message.id});
        } else {
          message.edit(Invalid);
        }
      });
  }).on('error', error => {
    console.error("RBLX API (UID) | " + error);
  });
}

function byUser(method,usr,message) {
  const Emb = new MessageEmbed()
        .setColor('#fff200')
        //.setTitle(request.headers.username + "'s Data")
       // .setTitle("Attempt")
        //.setAuthor('Roblox Error','')
        .setDescription("Attempting to "+method+" username "+ usr +"...")
        .setTimestamp()
        .setFooter('Developed by Stratiz');
  message.edit(Emb);
  https.get("https://api.roblox.com/users/get-by-username?username=" + usr, (res) => {
      let data = '';
      res.on('data', d => {
        data += d
      })
      res.on('end', () => {
        if (JSON.parse(data).Id != undefined) {
          toBan.push({method: method,value: JSON.parse(data).Id,username: JSON.parse(data).Username,cid: message.channel.id,mid: message.id});
        } else {
          message.edit(Invalid);
        }
      });
  }).on('error', error => {
    console.error("RBLX API (Username) | " + error);
  });
}

function isCommand(command, message) {
    var command = command.toLowerCase();
    var content = message.content.toLowerCase();
    return content.startsWith(prefix + command);
}

const TookTooLong = new MessageEmbed()
  .setColor('#eb4034')
  .setDescription("You took too long to respond!")


async function determineType(method,message,BotMsg,args) {
  if (isNaN(Number(args[1]))) {
    byUser(method,args[1],BotMsg);
  } else {
    const Emb = new MessageEmbed()
      .setColor('#ea00ff')
      //.setTitle(request.headers.username + "'s Data")
      .setTitle("Is this a UserID or a Username?")
      //.setAuthor('Roblox Error','')
      .setDescription("Please react with the number that matches the answer.")
      .addField(numbers[0] + ": Username","This is a players username in game.")
      .addField(numbers[1] + ": UserID","This is the players UserId connect with the account.")
      .setTimestamp()
      .setFooter('Developed by Stratiz');
    BotMsg.edit(Emb);
    try {
      await BotMsg.react(numbers[0]);
      await BotMsg.react(numbers[1]);
    } catch (error) {
      console.error('One of the emojis failed to react.');
    }
    const filter = (reaction, user) => {
      return numbers.includes(reaction.emoji.name) && user.id === message.author.id;
    };
    BotMsg.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
      .then(collected => {
        const reaction = collected.first();
        const ind = numbers.findIndex(function(n){
           return n == reaction.emoji.name;
        })
        BotMsg.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
        if (ind == 0) {
          byUser(method,args[1],BotMsg);
        } else if (ind == 1) {
          byUID(method,args[1],BotMsg);
        } else {
          BotMsg.edit('Something went wrong');
        }//
      })
      .catch(collected => {
        BotMsg.edit(TookTooLong);
        BotMsg.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
      });
  }
}

client.on('message', async (message) => {
  if(message.author.bot) return;
   if (message.member.roles.cache.some(role => role.name === rolename)) {
      const args = message.content.slice(prefix.length).split(' ');
       var Emb = new MessageEmbed()
          .setColor('#eb4034')
          .setDescription("Working...")

      if (isCommand("Ban", message)) {
        var BotMsg = await message.channel.send("<@" + message.author.id + ">",Emb);
        determineType("Ban",message,BotMsg,args);
      } else if (isCommand("Unban", message)) {
        var BotMsg = await message.channel.send("<@" + message.author.id + ">",Emb);
        determineType("Unban",message,BotMsg,args);
      } else if (isCommand("Kick",message)) {
        var BotMsg = await message.channel.send("<@" + message.author.id + ">",Emb);
        determineType("Kick",message,BotMsg,args);
      }
    }
});
//
app.use(express.static('public'));

app.get('/', async function(request, response) {
  if (request.headers.username != undefined) { 
    const channel = await client.channels.cache.get(request.headers.cid);
    channel.messages.fetch(request.headers.mid)
      .then(msg => {
        if (request.headers.rblxerror == undefined) {
          const Emb = new MessageEmbed()
                .setColor('#00ff44')
                .setTitle(request.headers.method + " successful. ")
                .addField('Username',request.headers.username)
                .addField('UserID',request.headers.value)
                //.addField('Inline field title', 'Some value here', true)
                //.setImage('https://www.roblox.com/Thumbs/Avatar.ashx?x=100&y=100&userId='+request.headers.uid)
                .setTimestamp()
                .setFooter('Developed by Stratiz');
          if (msg.author != undefined) {
            msg.edit(Emb);
          } else {
            channel.send(Emb);
          }
        } else {
          const Emb = new MessageEmbed()
                .setColor('#eb4034')
                .setTitle(request.headers.method + " failed. ")
                .addField('Username',request.headers.username)
                .addField('UserID',request.headers.value)
                .addField('Rblx-Error',request.headers.rblxerror)
                //.addField('Inline field title', 'Some value here', true)
                //.setImage('https://www.roblox.com/Thumbs/Avatar.ashx?x=100&y=100&userId='+request.headers.uid)
                .setTimestamp()
                .setFooter('Developed by Stratiz');
              if (msg.author != undefined) {
                msg.edit(Emb);
              } else {
                channel.send(Emb);
              }
        }
    })
    .catch( err =>{
      console.log(err);       
    });
  }
  response.send(toBan[0]);
  toBan.shift();
});

// listen for requests & Keep bot alive

let listener = app.listen(process.env.PORT, function() {
    //setInterval(() => { // Used to work sometime ago
    //    http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
    //}, 280000);
    console.log('Not that it matters but your app is listening on port ' + listener.address().port);
});

client.on('error', console.error)