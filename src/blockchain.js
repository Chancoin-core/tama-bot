'use strict';

const request = require('request-promise');
const Command = require('renge').Command;
const _       = require('lodash');

const BURNED_COINS = 3000000;

const SUBCOMMAND_URLS = {
  'supply': 'https://www.blockexperts.com/api?coin=4chn&action=getmoneysupply',
  'height': 'http://chancoin.info/api/getblockcount',
  'hashrate': 'http://chancoin.info/api/getnetworkhashps',
  'diff': 'http://chancoin.info/api/getdifficulty'
};

const MSG_PREFIXES = {
  'supply': 'The total CHAN supply (including burned coins) is ',
  'height': 'The current block height is ',
  'hashrate': 'The current network hash rate is ',
  'diff': 'The current block difficulty is '
};

const MSG_POSTFIXES = {
  'supply': '',
  'height': '',
  'hashrate': 'hashes',
  'diff': ''
};

function msgPrefix(cmd) {
  return MSG_PREFIXES[cmd];
}

function msgPostfix(cmd) {
  return MSG_POSTFIXES[cmd];
}

class Blockchain extends Command {
  constructor(context) {
    super(context);
  }

  filter(message) {
    return message.content.match(/^block/);
  }

  process(message) {
    let subcmd = splitCmd(message.content)[1];

    // TODO subtract burned coins from supply
    if (subcommandExists(subcmd)) {
      this.getThing(subcmd)
        .then( x => message.reply(`${msgPrefix(subcmd)}${x}${msgPostfix(subcmd)}`) );
    } else {
      message.reply('Syntax: `block info|height|hashrate|time|difficulty|supply`');
    }
  }

  getThing(thing) {
    return request.get(SUBCOMMAND_URLS[thing]);
  }


  urlForSubcommand(sub) {
    
  }
}

function subcommandExists(subcmd) {
  return _.includes(Object.keys(SUBCOMMAND_URLS), subcmd);
}

function splitCmd(string) {
  return string.split(' ');
};

module.exports = Blockchain;
