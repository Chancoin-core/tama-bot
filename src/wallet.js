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
      return this.getOrCreateAddressForUser(message.author)
        .then(getBalanceForAccount)
        .then( x => message.reply(`Your balance is ${x} CHAN`); );
    } else if (subCmd === 'tip') {
      message.reply("This has yet to be implemented, onii-chan.");
    } else if (subCmd === 'rain') {
      message.reply("This has yet to be implemented, onii-chan.");
    } else {
      message.reply("Syntax is `wallet addr|withdraw|balance|tip|rain`")
    }
  }

  getBalanceForAccount(account) {
    return client.getBalance(account);
  }

  getOrCreateAddressForUser(user) {
    return client.getAccountAddress(user.id);
  }

  handleError(err) {
    console.log(err);
  }
}

module.exports = Wallet;
