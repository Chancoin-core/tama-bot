'use strict';

const Command = require('./command');

class Register extends Command {
  constructor(context) {
    super(context);
  }

  filter(message) {
    return isRegistrationRequest(message);
  }

  process(message) {
    this.getUserRegistration(message, (err, res) => {
      if (err) {
        if (err.notFound) {
          this.createUserRegistration(message);
        } else {
          console.log("ERROR! ", err);
        }
      } else {
        message.reply("Already registered.");
      }
    });
  }

  respondAlreadyRegistered(result) {
    return message.reply("Already registered!");
  }

  getUserRegistration(msg, callback) {
    return this.context.db.get(msg.author, callback);
  }

  createUserRegistration(msg) {
    console.log("2");    
    return this.context.db.put(msg.author, {
      id: msg.author
    }, function(err, res) {
      msg.reply("Created!");
    });
  }
}

function isRegistrationRequest(msg) {
  return msg.content.match(/^register/);
}

module.exports = Register;








