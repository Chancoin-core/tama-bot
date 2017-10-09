'use strict';

const Command = require('renge').Command;
const _       = require('lodash');
const bitcoin = require('bitcoin-promise');

const client = new bitcoin.Client({
  host: process.env.DAEMON_HOST,
  port: process.env.DAEMON_PORT,
  user: process.env.DAEMON_USER,
  pass: process.env.DAEMON_PASS,
  timeout: 30000
});

const ERROR_CODE_MAP = {
  '-5': 'Invalid address.',
  '-3': 'Invalid amount.'
};

class Wallet extends Command {
  constructor(context) {
    super(context);
  }

  filter(message) {
    return message.content.match(/^wallet/);
  }

  process(message) {
    let subCmd = this.splitCmd(message.content)[1];
    if (subCmd === 'addr') {
      return this.getOrCreateAddressForUser(message.author)
        .then( x => message.reply(`Your address is ${x}`) )
        .catch( x => this.handleError(x) );      
    } else if (subCmd === 'withdraw') {
      const address = this.splitCmd(message.content)[2];
      const amount  = this.splitCmd(message.content)[3];
      return client.sendToAddress(address, amount)
        .then( x => message.reply(`Transaction ID: ${x}`) )
        .catch( x => this.handleError(x) );
    } else if (subCmd === 'balance') {

    } else if (subCmd === 'tip') {

    } else if (subCmd === 'rain') {
    }
  }

  getOrCreateAddressForUser(user) {
    return client.getAccountAddress(user.id);
  }

  handleError(err) {
    console.log(err);
  }
}

module.exports = Wallet;
