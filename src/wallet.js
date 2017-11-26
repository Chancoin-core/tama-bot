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

const DONATION_ADDRESS = process.env.DONATION_ADDRESS;

class Wallet extends Command {
  constructor(context) {
    super(context);
  }

  filter(message) {
    return message.content.match(/^wallet/);
  }

  process(message) {
    let split  = this.splitCmd(message.content);
    let subCmd = split[1];
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
        .then( x => this.getBalanceForAccount(this.accountIdForUser(message.author)) )
        .then( x => message.reply(`Your balance is ${x} CHAN`) );
    } else if (subCmd === 'tip') {
      console.log(message.mentions.users.first());
      let fromId   = message.author.id;
      let toUser   = message.mentions.users.first();
      let toId     = toUser.id;
      let amount   = split[3];
      this.moveCoins({from: fromId, to: toId, amount: amount})
        .then( x => message.reply(`Tipped ${amount} to ${toUser.username} Result - ${x}`) )
        .catch( x => console.log(x.stack) );
    } else if (subCmd === 'rain') {
      message.reply("This has yet to be implemented, onii-chan.");
    } else if (subCmd === 'donate') {
      const address = this.splitCmd(message.content)[2];
      const amount  = this.splitCmd(message.content)[3];
      this.sendCoinsToAddress(address, amount)
        .then( x => message.reply('Thank you for your donation!') );
    } else {
      message.reply("Syntax is `wallet addr|withdraw|balance|tip|rain|donate`");
    }
  }

  getBalanceForAccount(account) {
    return client.getBalance(account);
  }

  accountIdForUser(user) {
    return user.id;
  }

  getOrCreateAddressForUser(user) {
    return client.getAccountAddress(user.id);
  }

  moveCoins(opts) {
    return client.move(opts.from, opts.to, parseFloat(opts.amount));
  }

  sendCoinsToAddress(address, amount) {
    return client.sendToAddress(address, amount);
  }

  handleError(err) {
    console.log(err);
  }

  userTagToUser(message, idString) {
    let userId = idString.substring(2, idString.length - 1);
    let res = message.guild.members.find('id', userId).user;
    return res;
  }
}

module.exports = Wallet;
