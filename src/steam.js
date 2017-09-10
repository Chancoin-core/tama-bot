'use strict';

const Command = require('./command');
const P = require('bluebird');

class Steam extends Command {
  constructor(context) {
    super(context);
  }

  filter(message) {
    return message.content.match(/steam/);
  }

  process(message) {
    this.context.log(message);
    let match = message.content.match(/steam register (.+)/);
    if (match) {
      this.steamProfileRegister(match[1], message);
    } else {}
  }

  steamProfileRegister(profileId, message) {
    let steamUser = new this.context.steamApi.User(process.env.STEAM_API_KEY, profileId);
    this.setSteamIdForUserId(steamUserIdFromAPIResponse(steamUser),
                             discordUserIDFromMessage(message));
  }

  setSteamIdForUserId(steamId, userId, cb) {
    let t = this;
    this.context.db.put(`${userId}:steamId`,steamId, function(err) {
      if (err) {
        t.context.log(err);
        t.context.message.reply("Gomenasai! There was an error! Please ask a dev to check the logs!");
      } else {
        t.context.message.reply(`Your Steam Id has been registered as ${steamId}!`);
      }
    });
  }  
}

function steamUserIdFromAPIResponse(resp) {
  return resp['steamId'];
}

function discordUsernameFromMessage(msg) {
  return msg.author.username;
}

function discordUserIDFromMessage(msg) {
  return msg.author.id;
}

module.exports = Steam;
