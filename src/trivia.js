'use strict';

const request = require('request-promise');
const Command = require('renge').Command;
const _       = require('lodash');
const P       = require('bluebird');
const R       = require('ramda');

class Trivia extends Command {
  constructor(context) {
    super(context);
    context.allMessages.on('message', this.onAnyMessage);
  }

  onAnyMessage(message) {
    console.log("TRIVIA: ", message.content);
  }

  subscribeToAllMessages() {
    return true;
  }

  filter(message) {
    console.log("!"+ message.content);
    return message.content.match(/^trivia/);
  }

  process(message) {

  }
}

module.exports = Trivia;
