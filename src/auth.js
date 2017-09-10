'use strict';
const colors  = require('colors');
const request = require('request-promise');
const Command = require('./command');
const Tokens  = require('csrf');

const tokens = new Tokens();

class Auth extends Command {
  constructor(context) {
    super(context);
    this.context.app.get("/redirect", (req, res) => {
      let t = this;      
      this.context.redis.multi()
        .get(req.query.state)
        .del(req.query.state)
        .exec(function(err, data) {
          let userId = data;
          console.log("DATA: ", data);
          request({
            method: 'POST',
            url: `${process.env['CHAN_AUTH_URL']}/token`,
            form: {
              client_id: process.env['CHAN_CLIENT_ID'],
              client_secret: process.env['CHAN_CLIENT_SECRET'],
              code: req.query.code,
              grant_type: 'authorization_code',
              redirect_uri: t.redirectUri()
            },
            simple: false
          })
            .then(function(parsedBody) {
              t.context.dbRegistry['register']
                .get(userId)
                .then((userRecord) => { console.log("FFF" + userRecord); });
              // Get their account from 'register' sublevel
              // Add jwt and refresh token to record
              // save record
              // return "OK" to the user
              debugger;
              
              res.send(parsedBody);
            })
            .catch(function(err) {
              console.log(err);
              res.send("Something done fucked up");
            });
        });
    });
  }

  filter(message) {
    return message.content.match(/linkaccount/);
  }

  process(message) {
    // Generate a random csrf token so we know what user this is
    // when we get the callback
    let userCsrf = tokens.create(tokens.secretSync());
    this.context.redis.set(userCsrf, message.author, () => {
      message.reply(`${process.env['CHAN_AUTH_URL']}/authorize?` +
                    `client_id=${process.env['CHAN_CLIENT_ID']}&` +
                    `response_type=code&redirect_uri=${this.redirectUri()}&` +
                    `state=${userCsrf}`);
    });
  }

  redirectUri() {
    return process.env['APP_ROOT_URL'] + "/auth/redirect";
  }
}

module.exports = Auth;
