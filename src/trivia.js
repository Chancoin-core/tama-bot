'use strict';

const request = require('request-promise');
const Command = require('renge').Command;
const _       = require('lodash');
const P       = require('bluebird');
const R       = require('ramda');


const QUESTIONS_PER_GAME = 10;

let questionsRemaining,
    currentlyRunning = false,
    waitingForAnswer = false;

class Trivia extends Command {
  constructor(context) {
    super(context);
    context.allMessages.on('message', this.onAnyMessage.bind(this));
  }

  subscribeToAllMessages() {
    return true;
  }

  filter(message) {
    return message.content.match(/^trivia/);
  }

  onAnyMessage(message) {

    if ( this.messageIsFromPlayer(message) && waitingForAnswer ) {
      message.reply("I heard your answer");
    }
  }

  process(message) {
    let subcmd = this.splitCmd(message.content)[1];

    if (subcmd == 'start') {
      this.startTrivia(message);
    }
  }

  startTrivia(message) {
    if (currentlyRunning) {
      message.reply("We're already playing!");
    } else {
      currentlyRunning  = true;
      questionsRemaining = QUESTIONS_PER_GAME;

      this.askQuestion(message);
    }
  }

  askQuestion(message) {
    waitingForAnswer = true;
    message.reply('Why is Gossamer so handsome?');
  }

  messageIsFromPlayer(message) {
    return message.author !== this.context.bot.user;
  }
}

module.exports = Trivia;
