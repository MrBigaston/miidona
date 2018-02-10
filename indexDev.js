//Importation modules et JSON
var tmi = require("tmi.js");
var TwitterPackage = require('twitter');
const fs = require("fs")
const Discord = require("discord.js");
const config = require("./config.json");
const blacklist = require("./blacklist.json");
const joinMessage = require("./joinMessage.json");
const timed = require("./timed.json");
const ville = require("./ville.json");
const autoBan = require("./autoBan.json");
const clientDiscord = new Discord.Client();
const twitchStreams = require('twitch-get-stream')(config.tokenBot);
var api = require('twitch-api-v5');

api.clientID = "ojigqy6ra0jj7t12bwkh7952cstuia";

var buf = new Buffer(1024);
//Connexion Discord
clientDiscord.login(config.token);

//Fonction envoi message Discord
function sendDiscord(message) {
  var SpecificChannel = clientDiscord.channels.get(config.channelDiscord);
  SpecificChannel.send(message);
}

function sendLog(message) {
  var SpecificChannel = clientDiscord.channels.get(config.channelLog);
  SpecificChannel.send(message);
}

//Variables
var d = new Date()
var allowLog = true
var co = false
var enStream = false;
var prefixTwitch = config.prefixTwitch;
var prefixDiscord = config.prefixDiscord;
//**Tribunal**
var votePourTribunal = 0;
var voteContreTribunal = 0;
var tribunal = false;
var inTribunal = [];
var accuseTribunal = "";

//Fonction test commande Discord
function commandIs(str, msg) {
    return msg.content.startsWith(prefixDiscord + str);
}

//Connexion Twitter
var secret = {
  consumer_key: config.twitterCKey,
  consumer_secret: config.twitterCSecret,
  access_token_key: config.twitterTokenKey,
  access_token_secret: config.twitterTokenSecret
}
var Twitter = new TwitterPackage(secret);

var mute = false;

//Connexion Twitch
//** Bot **
var optionsBot = {
    oprions: {
        debug: true
    },
    connection: {
        cluster: "aws",
        reconnect: true
    },
    identity: {
        username: config.nameBotTwitch,
        password: config.oauthBot
    },
    channels: [config.channelTwitch]
};
//** Streameur **
var optionsStreameur = {
    oprions: {
        debug: true
    },
    connection: {
        cluster: "aws",
        reconnect: true
    },
    identity: {
        username: config.channelTwitch,
        password: config.oauthStreameur
    },
    channels: [config.channelTwitch]
};
//** Connexion **
var clientTwitch = new tmi.client(optionsBot);
var clientStreameur = new tmi.client(optionsStreameur);
clientTwitch.connect();
clientStreameur.connect();

//Test Connexion
//** Discord **
clientDiscord.on("ready", () => {
    if(co === false) {
      console.log("[" + d.getHours() + ":" + d.getMinutes() + "] Discord connecté");
      clientTwitch.whisper(config.channelTwitch, "[" + d.getHours() + ":" + d.getMinutes() + "] Discord connecté")
      clientDiscord.user.setGame("banhammer.exe", "https://mrbigaston.fr");
      Twitter.post("direct_messages/new", {screen_name: "mrbigaston", text: "[" + d.getHours() + ":" + d.getMinutes() + "] Discord connecté"}, function(err, data, response){});
      co = true
    }
});
//** Twitch Bot **
clientTwitch.on("connected", function(address, port) {
    console.log("[" + d.getHours() + ":" + d.getMinutes() + "] Compte Bot connecté | Pseudo du bot : " + config.nameBotTwitch + " | Chaîne : " + config.channelTwitch);
    clientTwitch.whisper(config.channelTwitch, "[" + d.getHours() + ":" + d.getMinutes() + "] Compte Bot Connecté");
    Twitter.post("direct_messages/new", {screen_name: "mrbigaston", text: "[" + d.getHours() + ":" + d.getMinutes() + "] Compte Bot connecté | Pseudo du bot : " + config.nameBotTwitch + " | Chaîne : " + config.channelTwitch}, function(err, data, response){});
});
//** Twitch Streameur **
clientStreameur.on("connected", function(address, port) {
    console.log("[" + d.getHours() + ":" + d.getMinutes() + "] Compte Streamer connecté | Pseudo du streameur : " + config.channelTwitch);
    clientTwitch.whisper(config.channelTwitch, "[" + d.getHours() + ":" + d.getMinutes() + "] Compte Streameur Connecté!");
    Twitter.post("direct_messages/new", {screen_name: "mrbigaston", text: "[" + d.getHours() + ":" + d.getMinutes() + "] Compte Streamer connecté | Pseudo du streameur : " + config.channelTwitch}, function(err, data, response){});
});

//Fonction Test Sub
function isSubscriber(user){
    return user.subscriber;
}

//Fonction Test Streameur
function isBroadcaster(user){
    return user.badges.broadcaster == '1';
}

//Fonction Test Commande Twitch
function commandParser(message){
    let prefixEscaped = prefixTwitch.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
    let regex = new RegExp("^" + prefixEscaped + "([a-zA-Z]+)\s?(.*)");
    return regex.exec(message);
}

//Fonction Génération Raison Ban
function generationRaison() {
  var raison = autoBan.raison;
  var random = Math.floor(Math.random() * raison.length);
  var sortieRaison = raison[random];
  return sortieRaison;
}

//Fonction Machine à Sou Discord
function machineASou() {
  var emojii = [
    ":apple:",
    ":pear:",
    ":tangerine:",
    ":watermelon:",
    ":grapes:",
    ":strawberry:",
    ":cherries:"
  ]
  var random = Math.floor(Math.random() * emojii.length);
  var premier = emojii[random];
  var random = Math.floor(Math.random() * emojii.length);
  var deuxième = emojii[random];
  var random = Math.floor(Math.random() * emojii.length);
  var troisième = emojii[random];
  if(premier === deuxième && deuxième === troisième && premier === troisième){
    var presortie = ":star2: :star2: :star2:  **Grande victoire!**";
  } else if(premier == deuxième || deuxième == troisième || premier == troisième) {
    var presortie = ":star: **Petite victoire**";
  } else {
    var presortie = ":eight_pointed_black_star:  **Défaite**";
  }
  var sortie = [
    premier,
    deuxième,
    troisième,
    presortie
  ];
  return sortie;
}

//Fonction Machine à Sou Twitch
function masTwitch(user) {
  var emote = [
    "VoHiYo",
    "NomNom",
    "Kappa",
    "FrankerZ",
    "PogChamp"
  ];
  var random = Math.floor(Math.random() * emote.length);
  var premier = emote[random];
  var random = Math.floor(Math.random() * emote.length);
  var deuxième = emote[random];
  var random = Math.floor(Math.random() * emote.length);
  var troisième = emote[random];
  if(premier === deuxième && deuxième === troisième && premier === troisième){
    var sortie = "[ " + premier + " | " + deuxième + " | " + troisième + " ] VoteYea GG " + user + " tu as gagné!";
  } else {
    var sortie = "[ " + premier + " | " + deuxième + " | " + troisième + " ] VoteNay Oh non! " + user + " tu as perdu!";
  }
  return sortie;
}

//Fonction Message Timé
function timedMessage() {
  var messages = timed.messages;
  var random = Math.floor(Math.random() * messages.length);
  clientTwitch.say(config.channelTwitch, messages[random]);
}

//Fonction Test Du Stream
/*function testStream(testStream) {
  twitchStreams.get(config.channelTwitch)
  .then(function(streams) {
    if(typeof streams == "object") {
      sendDiscord(config.channelTwitch + " commence à stream! Vous pouvez aller le voir à ce lien https://twitch.tv/" + config.channelTwitch);
      }
    });
  clearInterval(testDebutStream);
}*/

function subs(user) {
  if(isSubscriber(user)) {
    var sortie = true;
  } else {
    clientTwitch.whisper(user["display-name"], "Cette commande est réservée aux Subs! Pour vous abonner : sub.mrbigaston.fr")
  }
  return sortie;
}
 /*
function tribunal() {
  clientTwitch.action(config.channelTwitch, "Le Tribunal des Licornes est maintenant fermé! | Accusé : " + accuseTribunal);
  var tribunal = false;
  if(votePourTribunal > voteContreTribunal) {
    clientTwitch.action(config.channelTwitch, "Vote pour la condamnation : " + votePourTribunal + " | Vote contre la condamnation : " + voteContreTribunal);
    clientTwitch.action(config.channelTwitch, accuseTribunal + " est donc condamné à 60s de TimeOut!");
    console.log("[" + d.getHours() + ":" + d.getMinutes() + "] Tribunal > Fermermeture | Pour : " + votePourTribunal + " Contre : " + voteContreTribunal + " >> Condamné");
    client.timeout(config.channelTwitch, accuseTribunal, 60, "NoLog");
  }
  if(voteContreTribunal > votePourTribunal) {
    clientTwitch.action(config.channelTwitch, "Vote pour la condamnation : " + votePourTribunal + " | Vote contre la condamnation : " + voteContreTribunal);
    clientTwitch.action(config.channelTwitch, accuseTribunal + " est donc gracié par le chat!");
    console.log("[" + d.getHours() + ":" + d.getMinutes() + "] Tribunal > Fermermeture | Pour : " + votePourTribunal + " Contre : " + voteContreTribunal + " >> Non Condamné");

  }
  if(voteContreTribunal == votePourTribunal) {
    clientTwitch.action(config.channelTwitch, "Vote pour la condamnation : " + votePourTribunal + " | Vote contre la condamnation : " + voteContreTribunal);
    clientTwitch.action(config.channelTwitch, "Le vote de la condamnation de " + accuseTribunal + " est donc remis à plus tard!");
    console.log("[" + d.getHours() + ":" + d.getMinutes() + "] Tribunal > Fermermeture | Pour : " + votePourTribunal + " Contre : " + voteContreTribunal + " >> Egalitée");
  }
}

function tribunal1Min() {
  clientTwitch.action(config.channelTwitch, "Plus que 1 minute pour voter! Accusé : " + accuseTribunal + " | !vote [pour/contre]")
  tribunal = setTimeout(tribunal, 30000);
}

function tribunal3Min() {
  clientTwitch.action(config.channelTwitch, "Plus que 3 minutes pour voter! Accusé : " + accuseTribunal + " | !vote [pour/contre]")
  tribunal = setTimeout(tribunal1Min, 30000);
} */

/*
____    _                                   _
|  _ \  (_)  ___    ___    ___    _ __    __| |
| | | | | | / __|  / __|  / _ \  | '__|  / _` |
| |_| | | | \__ \ | (__  | (_) | | |    | (_| |
|____/  |_| |___/  \___|  \___/  |_|     \__,_|
*/

//Commandes Discord
clientDiscord.on("message", message => {
    var args = message.content.split(/[ ]+/);
    if(commandIs("setgame", message)) {
      if(message.author.username == "MrBigaston") {
        var mess = message.content.replace(".setgame", "");
        clientDiscord.user.setGame(mess, "https://mrbigaston.fr");
        message.channel.sendMessage("Le jeu à été changé vers **" + mess + "**!");
      } else {
        message.channel.sendMessage(message.author.username + " tu n'as pas accès à cette commande!");
      }
    }
    if(commandIs("reboot", message)) {
      if(message.author.username == "MrBigaston") {
      message.channel.sendMessage(":arrows_counterclockwise: **REBOOT DU BOT** :arrows_counterclockwise:");
      console.log(">>> REBOOT");
      clientTwitch.action(config.channelTwitch, ">>> REBOOT DU BOT! <<<");
      clientTwitch.whisper(config.channelTwitch, ">>> REBOOT DU BOT! <<<");
      var lolCaCrash;
      lolCaCrash = fs.readFileSync("lolcacrash.txt", "UTF-8");
      } else {
      message.channel.sendMessage(message.author.username + " tu n'as pas accès à cette commande!");
      }
    }
    //Lovecheck
    if(commandIs("lovecheck", message)) {
        var lovecheck = Math.floor(Math.random()*100) + 1;
        if(lovecheck == 0) {
          var finMessage = ":broken_heart: *eRrOR 404 : l0V3 nOT f0Und* :broken_heart:";
        } else if(1 <= lovecheck && lovecheck < 10) {
          var finMessage = ":hearts: Il y a un peu d'amour entre vous! C'est pas la folie, mais ça passe! :hearts:";
        } else if(10 <= lovecheck && lovecheck <= 50) {
          var finMessage = ":heart: :heart: De l'amour, il y en a c'est sur. Vous finirez peut-être par divorcer mais pour le moment, vous vous aimez! :heart: :heart:";
        } else if(51 <= lovecheck && lovecheck < 90) {
          var finMessage = ":heartbeat: L'amour est présent, vous vous aimez, et c'est vraiment beau à voir! :heartbeat:";
        } else if(90 <= lovecheck && lovecheck < 100) {
          var finMessage = ":sparkling_heart: Quand vous êtes ensemble, tous le monde est heureux, les oiseaux chantent, et beaucoup plus! :sparkling_heart:";
        } else if(lovecheck == 100) {
          var finMessage = ":revolving_hearts: :two_hearts: **IT'S OVER 9000! LE DETECTEUR VA EXPLOSER!!** :two_hearts: :revolving_hearts:";
        }

        if(args.length === 1) {
            message.channel.sendMessage("*" + message.author.username + "* :heart: *Sa main droite* **" + lovecheck + "%** | " + finMessage);
            console.log(message.author.username + " a " + lovecheck + "% d'amour avec sa main droite");
        }
        else {
            message.channel.sendMessage("*" + message.author.username + "* :heart: *" + args[1] + "* **" + lovecheck + "%** | " + finMessage);
            console.log(message.author.username + " a " + lovecheck + "% d'amour avec " + args[1]);
        }
    }
    //Lancé de dés
    if(commandIs("roll", message)) {
        var roll = Math.floor(Math.random() * 100) +1;
        if(roll <= 5) {
          var mess = "Tu as fais une **réussite critique**";
        } else if((roll >5) && (roll <=50)) {
          var mess = "Tu as fais une **réussite**";
        } else if((roll > 50) && (roll <=95)) {
          var mess = "Tu as fais un **echec**"
        } else if(roll > 95) {
          var mess = "Tu as fais un **echec critique**";
        }
        message.channel.send({embed: {
        color: 3447003,
        author: {
          name: "Lancé de dé",
          icon_url: message.author.avatarURL
        },
        fields: [{
            name: ":game_die: " + roll,
            value: mess
          }
        ],
        timestamp: new Date(),
        footer: {
          icon_url: clientDiscord.user.avatarURL,
          text: clientDiscord.user.username
        }
      }
    });
    }
    //Vents
    if(commandIs("vent", message)) {
        message.reply("Renaud <3 https://www.youtube.com/watch?v=mm7nGX193bo");
        message.channel.send("https://cdn.discordapp.com/attachments/311941153056620544/312308185870630914/tempete_en_baie.jpg");
      }
    //100%
    if(commandIs("Just100%", message)) {
    message.channel.send("https://cdn.discordapp.com/attachments/259735357740941322/313338634197794816/unknown.png");
    }
    //Calin
    if(commandIs("hug", message)) {
      console.log("[" + d.getHours() + ":" + d.getMinutes() + "]" + "Commande -hug par" + message.author.username);
      if(args.length === 1) {
            message.channel.send("T'es seul ?, viens ici " + message.author, {
        file : "hug.gif"
        });
      } else {
        message.channel.send(message.author + "fait un hug à " + args[1], {
          file : "hug.gif"
        });
      }
    }
    //PatPat
    if(commandIs("patpat", message)) {
      console.log("[" + d.getHours() + ":" + d.getMinutes() + "]" + "Commande -patpat par" + message.author.username);
      if(args.length === 1) {
        message.channel.send("patpat " + message.author, {
          file : "patpat.gif"
        });
      } else {
        message.channel.send("patpat " + args[1], {
          file : "patpat.gif"
        });
      }
    }
    //Anulation Calin/PatPat
    if(commandIs("denied", message)) {
      console.log("[" + d.getHours() + ":" + d.getMinutes() + "]" + "Commande -denied par" + message.author.username);
      if(args.length === 1) {
        message.channel.send(message.author + " a refusé un câlin", {
          file : "hugdenied.gif"
        });
      } else {
        message.reply("à refusé le calin de " + args[1], {
          file : "hugdenied.gif"
        });
      }
    }
    //Bisous
    if(commandIs("kiss", message)) {
      console.log("[" + d.getHours() + ":" + d.getMinutes() + "]" + "Commande -kiss par " + message.author.username);
      if(args.length === 1) {
        message.reply("Ne ten fais pas, quelqu'un doit bien t'aimer au Botswana", {
          file : "lonelykiss.gif"
        });
      } else {
        message.reply("à embrassé " + args[1], {
          file : "kiss.gif"
        });
      }
    }
    //Machine à Sous
    if(commandIs("mas", message)) {
      sortie = machineASou();
      message.channel.send({embed: {
        color: 3447003,
        author: {
          name: "Machine à sous",
          icon_url: message.author.avatarURL
        },
        fields: [{
          name: "**[**" + sortie[0] + "**|**" + sortie[1] + "**|**" + sortie[2] + "**]**",
          value: sortie[3]
        }],
        timestamp: new Date(),
        footer: {
          icon_url: clientDiscord.user.avatarURL,
          text: clientDiscord.user.username
        }
      }
      });
    }
    //Memes
    if(commandIs("meme", message)) {
      if(args.length === 1) {
        message.reply("Il faut specifier un même!");
      } else {
        var meme = args[1].replace(" ", "");
        if(meme == "zinzin") {
          message.reply("**AAAAAAAH. JE SUIS ZINZIN! JE SUIS ZINZIIIIIN** https://www.youtube.com/watch?v=wYIJ8HNiv4s");
        } else if(meme == "new_sax") {
          message.reply("COME ON! https://youtu.be/SWaQdHoCvYk?t=43s");
        } else if(meme == "selectionne") {
          message.reply("J'ai été séléctionnééééééé! https://www.youtube.com/watch?v=yxLu5CpPUFI");
        } else if(meme == "philippe") {
          message.channel.send("- **PHILIPPE! JE SAIS OU TU TE CACHE! VIENS ICI QUE JE TE BUTTE ENCULE!**\n -*TA GUEULE* \nhttps://youtu.be/EOxUWLl2HFs?t=23s");
        } else if(meme == "issou") {
          message.channel.send("ISSOU : https://youtu.be/GDLBaHjy9Ho?t=55s");
        } else if(meme == "we_are_number_one") {
          message.channel.send("WE ARE NUMBER ONE : https://youtu.be/PfYnvDL0Qcw?t=28s");
        } else if(meme == "papillion") {
          message.channel.send("PAPILLION DE LUMIERE : https://youtu.be/keEbsYcgbXU?t=46s");
        } else if(meme == "taisez_vous") {
          if(args.length === 2) {
              message.channel.send("**TAISEZ VOUS** : https://youtu.be/hDvfg63Auv4?t=23s");
          } else {
              message.channel.send(args[2] + message.author.username + " te dis **TAISEZ VOUS** : https://youtu.be/hDvfg63Auv4?t=23s");
          }
        } else if(meme == "chicken") {
          message.channel.send("CHICKEN DANCE : https://youtu.be/msSc7Mv0QHY?t=34s");
        } else if(meme == "coco") {
          message.channel.send("THE COCONUTS : https://youtu.be/w0AOGeqOnFY");
        } else if(meme == "do_the_flop") {
          message.channel.send("EVERYBODY DO THE FLOOOOP : https://youtu.be/L5inD4XWz4U");
        } else if(meme == "trains") {
          message.channel.send("I LIKE TRAINS : https://youtu.be/hHkKJfcBXcw");
        } else if(meme == "ta_guele") {
          message.channel.send("TA GUEULE : https://youtu.be/6uxgII0xDa4");
        } else if(meme == "ah") {
          message.channel.send("AH : https://youtu.be/XE6YaLtctcI");
        } else if(meme == "beep") {
          message.channel.send("BEEP BEPP I'M SHEEP : https://youtu.be/CZlfbep2LdU");
        } else if(meme == "hey") {
          message.channel.send("YEYAAEYAAAEYAEYAA : https://youtu.be/ZZ5LpwO-An4");
        } else if(meme == "nyan_cat") {
          message.channel.send("NYAN CAT : https://youtu.be/QH2-TGUlwu4");
        } else if(meme == "ponponpon") {
          message.channel.send("PONPONPON : https://youtu.be/yzC4hFK5P3g?t=8s");
        } else if(meme == "tunak") {
          message.channel.send("TUNAK TUNAK : https://youtu.be/vTIIMJ9tUc8");
        } else if(meme == "sax") {
          message.channel.send("EPIC SAX GUY : https://youtu.be/gy1B3agGNxw?t=40s");
        } else if(meme == "computer") {
          message.channel.send("COMPUTER : https://youtu.be/vh3tuL_DVsE");
        } else if(meme == "fafa") {
          message.channel.send("FOU DE FAFA : https://youtu.be/EuXdhow3uqQ?t=32s");
        } else if(meme == "popopo") {
          message.channel.send("POPOPOOOOOOO : https://youtu.be/_dhOa8kPiYs");
        } else if(meme == "cotcotyeah") {
          message.channel.send("COT COT YEAH : https://youtu.be/ADk0pG-Thxc?t=12s")
        } else if(meme == "texto") {
          message.channel.send("T.E.X.T.O. GENERATION TEXTO : https://youtu.be/Wxio7XI2ZSU?t=15s")
        }
      }
    }
});

//Channel Create
clientDiscord.on("channelCreate", channel => {
  sendDiscord("Channel " + channel.id);
});

/*
_____              _   _            _
|_   _| __      __ (_) | |_    ___  | |__
 | |   \ \ /\ / / | | | __|  / __| | '_ \
 | |    \ V  V /  | | | |_  | (__  | | | |
 |_|     \_/\_/   |_|  \__|  \___| |_| |_|
*/

//Commandes
clientTwitch.on('chat', (channel, user, message, isSelf) => {
    if (isSelf) return;
    //Appelation Commande Découpage Commande
    let fullCommand = commandParser(message);

    //Découpage
    if(fullCommand){
        let command = fullCommand[1];
        let param = fullCommand[2];

        //Commandes
        switch(command){
			case "start":
				if (isBroadcaster(user)) {
					sendDiscord("@here **MrBigaston** commence un stream ! Vous pouvez aller le voir sur https://twitch.tv/mrbigaston")
					clientTwitch.action(config.channel, "Début du stream");
                    console.log("[" + d.getHours() + ":" + d.getMinutes() + "] Lancement du stream");
                    clientTwitch.whisper(config.channelTwitch, "[" + d.getHours() + ":" + d.getMinutes() + "] Lancement du stream");
                    Twitter.post("direct_messages/new", {screen_name: "mrbigaston", text: "[" + d.getHours() + ":" + d.getMinutes() + "] Lancement du stream"}, function(err, data, response){});
				}
				break;
      case "test":
        api.channels.channel({auth: config.oauthStreameur}, (err, res) => {
          if(err) {
            console.log(err);
          } else {
            console.log(res);
            /* Example response
            {
            display_name: 'Twitch',
            _id: '12826',
            name: 'twitch',
            type: 'user',
            ...
          }
          */
        }
      });
        break;
      case "emote":
        clientTwitch.say(config.channelTwitch, "L'emote du mois de Fevrier est le bigRage ! " + '"MAIS PUTAIN"' + " | Cette licorne est très très en colère. On raconte qu'elle serait capable d'attaquer les autres à coup d'insulte. Sa rage destructrice pourrait détruire le monde...");
        break;
      case "patreon":
              clientTwitch.say(config.channelTwitch, "Si tu veux me soutenir dans le dévelopement de jeux et avoir des avantages exclusifs, tu peux visiter mon Patreon! https://www.patreon.com/mrbigaston")
              break;
            case "soundbox":
              clientTwitch.say(config.channelTwitch, "La soundbox de Triforce Heroes est sortie sur Android! Vous pouvez la télécharger ici : https://goo.gl/eSmvzj");
              break;
            case "defis":
              clientTwitch.say(config.channelTwitch, "En ce moment je vous lance un défis de Sub! Si on atteind les 20 points de subs, je ferrais un stream sur Allan Waker dans le noir!");
              break;
            //Envoit un Tweet depuis Chat
            case "sendTweet":
              if (user.mod || isBroadcaster(user)) { //Test Si Mod/Streameur
                var parametre = param.replace(" ", ""); //Découpage commande + Paramètres
                var tweetAEnvoyer = user["display-name"] + ' à dit "' + parametre + '"'; //Préparation Message de base
                if(tweetAEnvoyer.length <= 140) { //Test longueure tweet
                  Twitter.post('statuses/update', {status: tweetAEnvoyer},  function(error, tweet, response){}); //Envoit Twitter
                  clientTwitch.say(config.channelTwitch, user["display-name"] + ", Message publié! "); //Confirmation sur Chat
                  console.log("[" + d.getHours() + ":" + d.getMinutes() + "] SendTweet >> " + user["display-name"] + ' | Message : "' + parametre + '"') //Log Console
                  clientTwitch.whisper(config.channelTwitch, "[" + d.getHours() + ":" + d.getMinutes() + "] SendTweet >> " + user["display-name"] + ' | Message : "' + parametre + '"'); //Log Whisper
                  Twitter.post("direct_messages/new", {screen_name: "mrbigaston", text: "[" + d.getHours() + ":" + d.getMinutes() + "] SendTweet >> " + user["display-name"] + ' | Message : "' + parametre + '"'}, function(err, data, response){}); //Log MP Twitter
                } else {
                  clientTwitch.say(config.channelTwitch, user["display-name"] + ", Ton message est trop long!"); //Erreur trop Long
                }
              }
                break;
            case "annonce":
              if (isBroadcaster(user)) {
                Twitter.post('statuses/update', {status: param},  function(error, tweet, response){});
              }
              break;
            case "banHammer":
              if(user.mod || isBroadcaster(user)) {
                clientTwitch.say(config.channelTwitch, "La raison du ban serra : " + generationRaison() + " BanHammer");
              }
              break;
            case "autoBan":
              if(user.mod || isBroadcaster(user)) {
                clientTwitch.ban(config.channelTwitch, param.replace(" ", ""), generationRaison());
              }
              break;
            case "bonjour":
              if(user.mod || isBroadcaster(user)) {
                clientTwitch.timeout(config.channelTwitch, param.replace(" ", ""), 900, "On dit bonjours avant de poser son bordel!");
              }
            break;
            case "help":
              if(user.mod || isBroadcaster(user)) {
                clientTwitch.whisper(user["display-name"], 'Les différentes commandes : "!sendTweet" > Envoit un tweet sur le compte de @Miidona | "!banHammer" > Donne une raison de ban | "!autoBan [pseudo]" > Ban automatiquement [pseudo] avec une raison aléatoire!');
              }
              break;
            case "mas":
              if(subs(user) || user.mod) {
                clientTwitch.say(config.channelTwitch, masTwitch(user["display-name"]));
              }
              break;
            case "addlicoins":
              var parametre = param.replace(" ", "");
              if(user["display-name"] === "MrBigaston" || user["display-name"] === "963romain2" ||user["display-name"] === "Yraliix" || user["display-name"] === "Fl0raEevee" || user["display-name"] === "TheArkXIV") {
                if(param == "") {
                  clientTwitch.whisper(user["display-name"], "Vous devez spécifier un utilisateur : !licoins [utilisateur]");
                } else {
                  clientStreameur.say(config.channelTwitch, "!rubis remove " + parametre + " 250");
                  clientTwitch.action(config.channelTwitch, parametre + " a achété un licoins!")
                }
              } else {
                clientTwitch.whisper(parametre, "Vous n'avez pas la permission d'utiliser cette commande!")
              }
              break;
            case "reboot":
              if(isBroadcaster(user)) {
                console.log(">>> REBOOT");
                sendDiscord(":arrows_counterclockwise: REBOOT DU BOT :arrows_counterclockwise:");
                clientTwitch.action(config.channelTwitch, ">>> REBOOT DU BOT! <<<");
                clientTwitch.whisper(config.channelTwitch, ">>> REBOOT DU BOT! <<<");
                var lolCaCrash;
                lolCaCrash = fs.readFileSync("lolcacrash.txt", "UTF-8");
              }
              break;
            case "roulette":
              var random = Math.floor(Math.random() * 6);
              if(random == 0) {
                clientTwitch.say(config.channelTwitch, "Oh non! " + user["display-name"] + " tu as pris la balle!")
                if(user.mod || isBroadcaster(user)) {
                  console.log("[" + d.getHours() + ":" + d.getMinutes() + "] Roulette > " + user["display-name"] + " Défaite")
                  Twitter.post("direct_messages/new", {screen_name: "mrbigaston", text: "[" + d.getHours() + ":" + d.getMinutes() + "] Roulette > " + user["display-name"] + " Défaite"}, function(err, data, response){});
                  clientTwitch.whisper(config.channelTwitch, "[" + d.getHours() + ":" + d.getMinutes() + "] ] Roulette > " + user["display-name"] + " Défaite");
                } else {
                  console.log("[" + d.getHours() + ":" + d.getMinutes() + "] Roulette > " + user["display-name"] + " Défaite (Purge)")
                  Twitter.post("direct_messages/new", {screen_name: "mrbigaston", text: "[" + d.getHours() + ":" + d.getMinutes() + "] Roulette > " + user["display-name"] + " Défaite (Purge)"}, function(err, data, response){});
                  clientTwitch.whisper(config.channelTwitch, "[" + d.getHours() + ":" + d.getMinutes() + "] ] Roulette > " + user["display-name"] + " Défaite (Purge)");
                  clientTwitch.timeout(config.channelTwitch, user["display-name"], 1, "NoLog");
                }
              } else {
                clientTwitch.say(config.channelTwitch, user["display-name"] + " il n'y avait pas de balle...");
                console.log("[" + d.getHours() + ":" + d.getMinutes() + "] Roulette > " + user["display-name"] + " Victoire")
                Twitter.post("direct_messages/new", {screen_name: "mrbigaston", text: "[" + d.getHours() + ":" + d.getMinutes() + "] Roulette > " + user["display-name"] + " Victoire"}, function(err, data, response){});
                clientTwitch.whisper(config.channelTwitch, "[" + d.getHours() + ":" + d.getMinutes() + "] ] Roulette > " + user["display-name"]);
              }
              break;
              /*
            case "openTribunal":
              if(isBroadcaster(user)) {
                var parametre = param.replace(" ", ""); //Découpage commande + Paramètres
                var tribunal = true;
                var accuseTribunal = parametre;
                clientTwitch.action(config.channelTwitch, "Le Tribunal des Licornes est maintenant ouvert contre " + parametre + "! Utilisez !vote [pour/contre] pour voter pour ou contre la condamnation! Vous avez 5 minutes!");
                tribunal = setTimeout(tribunal3Min, 30000);
                console.log("[" + d.getHours() + ":" + d.getMinutes() + "] Tribunal > Ouverture du tribunal conte " + accuseTribunal);
              } else {
                clientTwitch.whisper(user, "Seul le streameur peut utiliser cette commande!");
              }
              break;

            case "vote":
              var parametre = param.replace(" ", ""); //Découpage commande + Paramètres
              if(tribunal == false) {
                clientTwitch.whisper(user["display-name"], "Le Tribunal des Licornes n'est pas ouvert!");
                break;
              }
              for(var i = 0; i < inTribunal.length; i++) {
                if(inTribunal[i] == user["display-name"]) {
                  clientTwitch.whisper(user["display-name"], "Tu as déjà voté!");
                  break;
                }
              }
              if(parametre == "pour") {
                var votePourTribunal = votePourTribunal + 1;
                inTribunal.push(user["display-name"]);
                console.log("[" + d.getHours() + ":" + d.getMinutes() + "] Tribunal > " + user["display-name"] + " Vote Pour");
              } else if(parametre == "contre") {
                var voteContreTribunal = voteContreTribunal + 1;
                inTribunal.push(user["display-name"]);
                console.log("[" + d.getHours() + ":" + d.getMinutes() + "] Tribunal > " + user["display-name"] + " Vote Contre");
              } else {
                clientTwitch.whisper("Utilise !vote [pour/contre]! | Accusé : " + accuseTribunal);
              }
              */
            /*case "1hgj":
              clientTwitch.say(config.channelTwitch, "Je participe actuelement à la 1 Hour Game Jam. Le principe est que je dois coder un jeu en 1H (encore plus cours que les Bigaston's Coding Challenges, je sais). Le jeu serra disponible sur mon site en HTML et sur itch.io en téléchargement. Le site : http://onehourgamejam.com");
              break;*/
            case "alerte":
              var parametre = param.replace(" ", ""); //Découpage commande + Paramètres
              clientTwitch.say(config.channelTwitch, "⚠ ALERTE ENLEVEMENT : " + parametre + " à disparus!");
              break;
            case "discord":
              clientTwitch.say(config.channelTwitch, "Tu peux rejoindre mon Discord pour avoir toutes les infos sur les streams! https://discord.gg/XtuETxw");
              break;
            case "ffz":
              clientTwitch.say(config.channelTwitch, "Tu peux télécharger cette extension pour avoir des emotes exclusives! Par ici: http://www.frankerfacez.com/");
              break;
            case "hug":
              if(param == ""){
                clientTwitch.say(config.channelTwitch, "GivePLZ " + user["display-name"] + " fais un calin à sa main droite TakeNRG");
              } else {
                var parametre = param.replace(" ", ""); //Découpage commande + Paramètres
                clientTwitch.say(config.channelTwitch, "GivePLZ " + user["display-name"] + " fais un calin à " + parametre + " TakeNRG");
              }
              break;
            case "nintendo":
              clientTwitch.say(config.channelTwitch, "Pour jouer avec moi sur les jeux Nintendo, demande moi en ami sur 3DS (2750-2378-3434) ou sur WiiU (MrBigaston) et enfin sur Switch (SW-8577-8363-9202) !");
              break;
            case "slow":
              if(param == "") {
                clientTwitch.say(config.channelTwitch, user["display-name"] + " dance un slow avec personne... Vive la solitude...")
              } else {
                var parametre = param.replace(" ", ""); //Découpage commande + Paramètres
                clientTwitch.say(config.channelTwitch, user["display-name"] + " dance un slow avec " + parametre);
              }
              break;
            case "tip":
              clientTwitch.say(config.channelTwitch, "Tu veux me soutenier dans ma quête d'un stream meilleur? Alors tu peux me faire un petit tips! tip.mrbigaston.fr");
              break;
            case "twitter":
              clientTwitch.say(config.channelTwitch, "Tu peux me suivre sur Twitter! @MrBigaston!");
              break;
            case "mute":
              if(isBroadcaster(user)) {
                var mute = true;
                clientTwitch.action(config.channelTwitch, "Bot Mute")
              }
            case "unmute":
              if(isBroadcaster(user)) {
                var mute = false;
                clientTwitch.action(config.channelTwitch, "Bot unmute")
              }
            /*case "ville":
              var ville = " La ville de ";
              var random = Math.floor(Math.random() * ville.syllabes1.length);
              var ville = ville + ville.syllabes1[random];
              var random = Math.floor(Math.random() * ville.syllabes2.length);
              var ville = ville + ville.syllabes2[random];
              var random = Math.floor(Math.random() * ville.syllabesFin.length);
              var ville = ville + ville.syllabesFin[random];
              var ville = ville + " ";
              var random = Math.floor(Math.random() * ville.phrase.length);
              var ville = ville + ville.phrase[random];
              clientTwitch.say(config.channelTwitch, user["display-name"] + ville);*/
            case "boulet":
              fs.open('boulet.txt', 'r+', function(err, fd) {
                if (err) {
                  return console.error(err);
                }
                console.log("File opened successfully!");
                console.log("Going to read the file");
                fs.read(fd, buf, 0, buf.length, 0, function(err, bytes){
                  if (err){
                    console.log(err);
                  }
                  console.log(bytes + " bytes read");

                  // Print only read bytes to avoid junk.
                  if(bytes > 0){
                    console.log(buf.slice(0, bytes).toString());
                  }
                });
              });
              return;
          }
        }
});

//Messages timé

var messagesTime = setInterval(timedMessage, 300000);

//Test début streams
//var testDebutStream = setInterval(testStream, 60000);

//Host
clientStreameur.on("hosted", function (channel, username, viewers, autohost) {
  if(autohost === true) {
    console.log("[" + d.getHours() + ":" + d.getMinutes() + "] AutoHost > " + username + " (" + viewers + ")");
    clientTwitch.whisper(config.channelTwitch, "[" + d.getHours() + ":" + d.getMinutes() + "] AutoHost > " + username + " (" + viewers + ")");
    Twitter.post("direct_messages/new", {screen_name: "mrbigaston", text: "[" + d.getHours() + ":" + d.getMinutes() + "] AutoHost > " + username + " (" + viewers + ")"}, function(err, data, response){});
    clientTwitch.say(config.channelTwitch, "Merci de ton host " + username + "!");

  } else if(autohost === false) {
    console.log("[" + d.getHours() + ":" + d.getMinutes() + "] Host > " + username + " (" + viewers + ")");
    clientTwitch.whisper(config.channelTwitch, "[" + d.getHours() + ":" + d.getMinutes() + "] Host > " + username + " (" + viewers + ")");
    Twitter.post("direct_messages/new", {screen_name: "mrbigaston", text: "[" + d.getHours() + ":" + d.getMinutes() + "] Host > " + username + " (" + viewers + ")"}, function(err, data, response){});
    sendDiscord({embed: {
    color: 3447003,
    author: {
      name: "Host Twitch",
      icon_url: clientDiscord.user.avatarURL
    },
    fields: [{
        name: ":satellite: **" + username + "** host la chaîne",
        value: "**" + viewers + "** viewers!"
      }
    ],
    timestamp: new Date(),
    footer: {
      icon_url: clientDiscord.user.avatarURL,
      text: clientDiscord.user.username
    }
  }
  });
    if(viewers === 0) {
      clientTwitch.action(config.channelTwitch, "Merci de ton host " + username + "!");
    }
  }
  if(viewers >= 1 && viewers > 10) {
    clientTwitch.action(config.channelTwitch, "Merci de ton host de " + viewers + " viewers " + username + "!");
  } else if(viewers >= 10) {
    clientTwitch.action(config.channelTwitch, "Woaaaa! " + viewers + " viewers? Merci beaucoup " + username);
  }
});

// Host sur
clientTwitch.on("hosting", function (channel, target, viewers) {
  clientTwitch.clear(config.channelTwitch);
  clientTwitch.say(config.channelTwitch, "Je host maintenant la chaine de " + target + "! Vous pouvez allez le voir sur ce lien : https://twitch.tv/" + target);
  if(co == true) {
    sendDiscord({embed: {
      color: 3447003,
      author: {
        name: "Host Twitch",
        icon_url: clientDiscord.user.avatarURL
      },
      fields: [{
        name: ":loudspeaker: Je host maintenant la chaine de " + target,
        value: "[https://twitch.tv/" + target + "](https://twitch.tv/" + target + ")"
      }
    ],
    timestamp: new Date(),
    footer: {
      icon_url: clientDiscord.user.avatarURL,
      text: clientDiscord.user.username
    }
  }
  });
}
  console.log("[" + d.getHours() + ":" + d.getMinutes() + "] Host vers " + target + " (" + viewers + ")");
  clientTwitch.whisper(config.channelTwitch, "[" + d.getHours() + ":" + d.getMinutes() + "] Host vers " + target + " (" + viewers + ")");
  Twitter.post("direct_messages/new", {screen_name: "mrbigaston", text: "[" + d.getHours() + ":" + d.getMinutes() + "] Host vers " + target + " (" + viewers + ")"}, function(err, data, response){});
  //var testDebutStream = setInterval(testStream, 60000);
});

//Clear
clientTwitch.on("clearchat", function(channel) {
  console.log("[" + d.getHours() + ":" + d.getMinutes() + "] Clear du t'chat");
  clientTwitch.whisper(config.channelTwitch, "[" + d.getHours() + ":" + d.getMinutes() + "] Clear du t'chat");
  Twitter.post("direct_messages/new", {screen_name: "mrbigaston", text: "[" + d.getHours() + ":" + d.getMinutes() + "] Clear du t'chat"}, function(err, data, response){});
});

//Ban
clientTwitch.on("ban", function(channel, user, reason) {
  if(reason === null) {
    clientTwitch.action(config.channelTwitch, user +  " a été banni du t'chat! BanHammer");
    sendLog({embed: {
    color: 3447003,
    author: {
      name: "Sanction Twitch",
      icon_url: clientDiscord.user.avatarURL
    },
    fields: [{
        name: ':no_entry: **' + user +  "** a été banni du t'chat!",
        value: "*Pas de raison spécifié*"
      }
    ],
    timestamp: new Date(),
    footer: {
      icon_url: clientDiscord.user.avatarURL,
      text: clientDiscord.user.username
    }
  }
});
    console.log("[" + d.getHours() + ":" + d.getMinutes() + "] Ban >> " + user);
    Twitter.post('statuses/update', {status: user + " a été banni du chat!"},  function(error, tweet, response){});
    if(allowLog === true) {
      clientTwitch.whisper(config.channelTwitch, "[" + d.getHours() + ":" + d.getMinutes() + "] Ban >> " + user);
      Twitter.post("direct_messages/new", {screen_name: "mrbigaston", text: "[" + d.getHours() + ":" + d.getMinutes() + "] Ban >> " + user}, function(err, data, response){});
    }
  } else {
    clientTwitch.action(config.channelTwitch, user +  ' a été banni du chat! | Raison : "' + reason + '"');
    sendLog({embed: {
    color: 3447003,
    author: {
      name: "Sanction Twitch",
      icon_url: clientDiscord.user.avatarURL
    },
    fields: [{
        name: ':no_entry: **' + user +  "** a été banni du t'chat!",
        value: "*" + reason + "*"
      }
    ],
    timestamp: new Date(),
    footer: {
      icon_url: clientDiscord.user.avatarURL,
      text: clientDiscord.user.username
    }
  }
});
    console.log("[" + d.getHours() + ":" + d.getMinutes() + "] Ban >> " + user + " | " + reason);
    Twitter.post('statuses/update', {status: user + " a été banni du chat! | Raison : " + reason},  function(error, tweet, response){});

    if(allowLog === true) {
      clientTwitch.whisper(config.channelTwitch, "[" + d.getHours() + ":" + d.getMinutes() + "] Ban >> " + user + " | Raison : " + reason);
      Twitter.post("direct_messages/new", {screen_name: "mrbigaston", text: "[" + d.getHours() + ":" + d.getMinutes() + "] Ban >> " + user + " | Raison : " + reason}, function(err, data, response){});
    }
  }
});

// TimeOut et Purge
clientTwitch.on("timeout", function(channel, user, reason, duration) {
  if(user === "wizebot") {
    return;
  }
  if(reason === "NoLog") {
    return;
  }
  if(duration === 1){
    if(reason === null) {
      clientTwitch.action(config.channelTwitch, user + " a été purge du t'chat");
      clientDiscord.send({embed: {
      color: 3447003,
      author: {
        name: "Sanction Twitch",
        icon_url: clientDiscord.user.avatarURL
      },
      fields: [{
          name: ":anger: **" + user + "** a été purge du t'chat!",
          value: "*Pas de raison spécifié*"
        }
      ],
      timestamp: new Date(),
      footer: {
        icon_url: clientDiscord.user.avatarURL,
        text: clientDiscord.user.username
      }
    }
  });
      console.log("[" + d.getHours() + ":" + d.getMinutes() + "] Purge >> " + user);
      if(allowLog === true) {
        clientTwitch.whisper(config.channelTwitch, "[" + d.getHours() + ":" + d.getMinutes() + "] Purge >> " + user);
        Twitter.post("direct_messages/new", {screen_name: "mrbigaston", text: "[" + d.getHours() + ":" + d.getMinutes() + "] Purge >> " + user}, function(err, data, response){});
      }
    } else {
      clientTwitch.action(config.channelTwitch, user + " a été purge du t'chat " + ' | Raison : "' + reason + '"');
      sendLog({embed: {
      color: 3447003,
      author: {
        name: "Sanction Twitch",
        icon_url: clientDiscord.user.avatarURL
      },
      fields: [{
          name: ":anger: **" + user + "** a été purge du t'chat!",
          value: "*" + reason + "*"
        }
      ],
      timestamp: new Date(),
      footer: {
        icon_url: clientDiscord.user.avatarURL,
        text: clientDiscord.user.username
      }
    }
  });
      console.log("[" + d.getHours() + ":" + d.getMinutes() + "] Purge >> " + user + " | Raison : " + reason);
      if(allowLog === true) {
        clientTwitch.whisper(config.channelTwitch, "[" + d.getHours() + ":" + d.getMinutes() + "] Purge >> " + user + " | Raison : " + reason);
        Twitter.post("direct_messages/new", {screen_name: "mrbigaston", text: "[" + d.getHours() + ":" + d.getMinutes() + "] Purge >> " + user + " | Raison : " + reason}, function(err, data, response){});
      }
    }
  } else {
    if(reason === null) {
      clientTwitch.action(config.channelTwitch, user + " a été TimeOut du t'chat (" + duration +"s)");
      sendLog({embed: {
      color: 3447003,
      author: {
        name: "Sanction Twitch",
        icon_url: clientDiscord.user.avatarURL
      },
      fields: [{
          name: ":no_entry_sign: **" + user + "** a été TimeOut du t'chat (" + duration +"s)",
          value: "*Pas de raison spécifié*"
        }
      ],
      timestamp: new Date(),
      footer: {
        icon_url: clientDiscord.user.avatarURL,
        text: clientDiscord.user.username
      }
    }
  });
      console.log("[" + d.getHours() + ":" + d.getMinutes() + "] TimeOut >> " + user + " (" + duration + "s)");
      if(allowLog === true) {
        clientTwitch.whisper(config.channelTwitch, "[" + d.getHours() + ":" + d.getMinutes() + "] TimeOut >> " + user + " (" + duration + "s)");
        Twitter.post("direct_messages/new", {screen_name: "mrbigaston", text: "[" + d.getHours() + ":" + d.getMinutes() + "] TimeOut >> " + user + " (" + duration + "s)"}, function(err, data, response){});
      }
    } else {
      clientTwitch.action(config.channelTwitch, user + " a été purge du t'chat (" + duration +"s) " + '| Raison : "' + reason + '"');
      sendLog({embed: {
      color: 3447003,
      author: {
        name: "Sanction Twitch",
        icon_url: clientDiscord.user.avatarURL
      },
      fields: [{
          name: ":no_entry_sign: **" + user + "** a été TimeOut du t'chat (" + duration +"s)",
          value: "*" + reason + "*"
        }
      ],
      timestamp: new Date(),
      footer: {
        icon_url: clientDiscord.user.avatarURL,
        text: clientDiscord.user.username
      }
    }
  });
      console.log("[" + d.getHours() + ":" + d.getMinutes() + "] TimeOut >> " + user + " (" + duration + "s) | " + reason);
      if(allowLog === true) {
        clientTwitch.whisper(config.channelTwitch, "[" + d.getHours() + ":" + d.getMinutes() + "] TimeOut >> " + user + " (" + duration + "s) | " + reason);
        Twitter.post("direct_messages/new", {screen_name: "mrbigaston", text: "[" + d.getHours() + ":" + d.getMinutes() + "] TimeOut >> " + user + " (" + duration + "s) | Raison : " + reason}, function(err, data, response){});
      }
    }
  }
});

//Cheer
clientTwitch.on("cheer", function (channel, user, message) {
  console.log("[" + d.getHours() + ":" + d.getMinutes() + "] Cheer >> " + user["display-name"] + " (" + user.bits +') | Message : "' + message + '"');
  clientTwitch.whisper(config.channelTwitch, "[" + d.getHours() + ":" + d.getMinutes() + "] Cheer >> " + user["display-name"] + " (" + user.bits +') | Message : "' + message + '"');
  clientTwitch.action(config.channelTwitch, "Merci " + user["display-name"] + " pour tes " + user.bits + " bits! bigLove")
  Twitter.post('statuses/update', {status: "💎 Merci " + user["display-name"] + " pour tes " + user.bits + " bits! 💎"},  function(error, tweet, response){}); //Envoit Twitter
  sendDiscord({embed: {
  color: 3447003,
  author: {
    name: "Cheer",
    icon_url: clientDiscord.user.avatarURL
  },
  fields: [{
      name: ":gem: Merci **" + user["display-name"] + "** pour tes **" + user.bits + "** bits!",
      value: "*" + message + "*"
    }
  ],
  timestamp: new Date(),
  footer: {
    icon_url: clientDiscord.user.avatarURL,
    text: clientDiscord.user.username
  }
}
});
  Twitter.post("direct_messages/new", {screen_name: "mrbigaston", text: "[" + d.getHours() + ":" + d.getMinutes() + "] Cheer >> " + user["display-name"] + " (" + user.bits +') | Message : "' + message + '"'}, function(err, data, response){});
});

//Sub
clientStreameur.on("subscription", function (channel, username, method, message, userstate) {
  if(message === null) {
    Twitter.post('statuses/update', {status: "🦄 " + username + " à rejoind le Reich des Licornes! 🦄"},  function(error, tweet, response){}); //Envoit Twitter
    clientTwitch.action(config.channelTwitch, "🦄" + username + " à rejoind le Reich des Licornes! 🦄");
    clientTwitch.whisper(username, "Salut! Merci d'avoir rejoind le Reich des Licornes 🦄 ! Pense à rejoindre le Discord et à connecter ton compte Twitch sur ton compte Discord pour pouvoir utiliser les emotes sur tous les serveur Discord!");
    clientTwitch.whisper(config.channelTwitch, "[" + d.getHours() + ":" + d.getMinutes() + "] Sub >> " + username);
    console.log("[" + d.getHours() + ":" + d.getMinutes() + "] Sub >> " + username);
    Twitter.post("direct_messages/new", {screen_name: "mrbigaston", text: "[" + d.getHours() + ":" + d.getMinutes() + "] Sub >> " + username}, function(err, data, response){});
    sendDiscord({embed: {
    color: 3447003,
    author: {
      name: "Sub",
      icon_url: clientDiscord.user.avatarURL
    },
    fields: [{
        name: ":unicorn: **" + username + "** à rejoind le Reich des Licornes!",
        value: "*Pas de message*"
      }
    ],
    timestamp: new Date(),
    footer: {
      icon_url: clientDiscord.user.avatarURL,
      text: clientDiscord.user.username
    }
  }
  });
} else {
  Twitter.post('statuses/update', {status: "🦄 " + username + " à rejoind le Reich des Licornes! 🦄"},  function(error, tweet, response){}); //Envoit Twitter
  clientTwitch.action(config.channelTwitch, "🦄" + username + " à rejoind le Reich des Licornes! 🦄");
  clientTwitch.whisper(username, "Salut! Merci d'avoir rejoind le Reich des Licornes 🦄 ! Pense à rejoindre le Discord et à connecter ton compte Twitch sur ton compte Discord pour pouvoir utiliser les emotes sur tous les serveur Discord!");
  clientTwitch.whisper(config.channelTwitch, "[" + d.getHours() + ":" + d.getMinutes() + "] Sub >> " + username + " | Message : " + message);
  Twitter.post("direct_messages/new", {screen_name: "mrbigaston", text: "[" + d.getHours() + ":" + d.getMinutes() + "] Sub >> " + username + " | Message : " + message}, function(err, data, response){});
  console.log("[" + d.getHours() + ":" + d.getMinutes() + "] Sub >> " + username + " | Message : " + message);
  sendDiscord({embed: {
  color: 3447003,
  author: {
    name: "Sub",
    icon_url: clientDiscord.user.avatarURL
  },
  fields: [{
      name: ":unicorn: **" + username + "** à rejoind le Reich des Licornes!",
      value: "*" + message + "*"
    }
  ],
  timestamp: new Date(),
  footer: {
    icon_url: clientDiscord.user.avatarURL,
    text: clientDiscord.user.username
  }
}
});
}
});

//Resub
clientStreameur.on("resub", function (channel, username, months, message, userstate, methods) {
  if(message === null) {
    Twitter.post('statuses/update', {status: "🦄 " + username + " est dans le Reich des Licornes depuis " + months + " mois! 🦄"},  function(error, tweet, response){}); //Envoit Twitter
    clientTwitch.action(config.channelTwitch, "bigFab " + username + " est dans le Reich des Licornes depuis " + months + " mois! bigFab");
    clientTwitch.whisper(username, "Salut! Merci d'être revenu dans le Reich des Licornes 🦄 ! Pense à rejoindre le Discord et à connecter ton compte Twitch sur ton compte Discord pour pouvoir utiliser les emotes sur tous les serveur Discord!");
    clientTwitch.whisper(config.channelTwitch, "[" + d.getHours() + ":" + d.getMinutes() + "] Resub >> " + username);
    console.log("[" + d.getHours() + ":" + d.getMinutes() + "] Resub >> " + username);
    Twitter.post("direct_messages/new", {screen_name: "mrbigaston", text: "[" + d.getHours() + ":" + d.getMinutes() + "] Resub >> " + username}, function(err, data, response){});
    sendDiscord({embed: {
    color: 3447003,
    author: {
      name: "Resub",
      icon_url: clientDiscord.user.avatarURL
    },
    fields: [{
        name: ":bigFab: **" + username + "** est dans le Reich des Licornes depuis " + months + " mois!",
        value: "*Pas de message*"
      }
    ],
    timestamp: new Date(),
    footer: {
      icon_url: clientDiscord.user.avatarURL,
      text: clientDiscord.user.username
    }
  }
  });
} else {
  Twitter.post('statuses/update', {status: "🦄 " + username + " à rejoind le Reich des Licornes depuis " + months + " mois! 🦄"},  function(error, tweet, response){}); //Envoit Twitter
  clientTwitch.action(config.channelTwitch, "bigFab " + username + " est dans le Reich des Licornes depuis " + months + " mois! bigFab");
  clientTwitch.whisper(username, "Salut! Merci d'être revenu dans le Reich des Licornes 🦄 ! Pense à rejoindre le Discord et à connecter ton compte Twitch sur ton compte Discord pour pouvoir utiliser les emotes sur tous les serveur Discord!");
  clientTwitch.whisper(config.channelTwitch, "[" + d.getHours() + ":" + d.getMinutes() + "] Resub >> " + username + " (" + months + ") | Message : " + message);
  Twitter.post("direct_messages/new", {screen_name: "mrbigaston", text: "[" + d.getHours() + ":" + d.getMinutes() + "] Resub >> " + username + " (" + months + ") | Message : " + message}, function(err, data, response){});
  console.log("[" + d.getHours() + ":" + d.getMinutes() + "] Resub >> " + username + " (" + months + ") | Message : " + message);
  sendDiscord({embed: {
  color: 3447003,
  author: {
    name: "Resub",
    icon_url: clientDiscord.user.avatarURL
  },
  fields: [{
      name: ":bigFab: **" + username + "** est dans le Reich des Licornes depuis " + months + " mois!",
      value: "*" + message + "*"
    }
  ],
  timestamp: new Date(),
  footer: {
    icon_url: clientDiscord.user.avatarURL,
    text: clientDiscord.user.username
  }
}
});
}
});

//Join
clientTwitch.on("join", function (channel, user, self) {
  for (var i = 0; i < blacklist.pseudo.length; i++) {

    //Blacklist User
    if(user === blacklist.pseudo[i]) {
      clientTwitch.ban(config.channelTwitch, user, generationRaison() + "(Blacklist User)");
    }

    //Message de Join
    if(user === joinMessage.pseudo[i]) {
      clientTwitch.say(config.channelTwitch, joinMessage.message[i]);
    }
  }
});

//whisper
clientTwitch.on("whisper", function (from, userstate, message, self) {
    if (self) return;
    if(from == "#mrbigaston") {
      sendDiscord(":arrow_forward: " + message);
      clientTwitch.whisper("mrbigaston", message + " >> Envoyé");
    }
});
