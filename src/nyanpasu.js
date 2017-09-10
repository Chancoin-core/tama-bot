'use strict';

const Command = require('renge').Command;

class Nyanpasu extends Command {
  constructor(context) {
    super(context);
  }

  filter(message) {
    return message.content.match(/nyanpasu/);
  }

  process(message) {
    message.reply("Nyanpasu!");
  }
}

module.exports = Nyanpasu;
