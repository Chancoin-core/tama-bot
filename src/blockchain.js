'use strict';

const request = require('request-promise');
const Command = require('renge').Command;
const _       = require('lodash');
const P       = require('bluebird');

const BURNED_COINS = 3000000;

const SUBCOMMAND_URLS = {
  'supply': 'https://www.blockexperts.com/api?coin=4chn&action=getmoneysupply',
  'height': 'http://chancoin.info/api/getblockcount',
  'hashrate': 'http://chancoin.info/api/getnetworkhashps',
  'diff': 'http://chancoin.info/api/getdifficulty',
  'price': 'http://api.coinmarketcap.com/v1/ticker/chancoin'
};

const MSG_PREFIXES = {
  'supply': 'The total CHAN supply (including burned coins) is ',
  'height': 'The current block height is ',
  'hashrate': 'The current network hash rate is ',
  'diff': 'The current block difficulty is ',
  'price': 'The price of 4CHN on coinmarketcap.com is currently '
};

const MSG_POSTFIXES = {
  'supply': '',
  'height': '',
  'hashrate': 'hashes',
  'diff': '',
  'price': ' BTC.'
};

const MSG_FUNCTIONS = {
  'price': function(data) {
    return data[0]['price_btc'];
  }
}

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
    let subcmd = this.splitCmd(message.content)[1];

    if (subcommandExists(subcmd)) {
      this.getThing(subcmd)
        .then( x => message.reply(`${msgPrefix(subcmd)}${x}${msgPostfix(subcmd)}`) );
    } else if (subcmd === 'time') {
      P.all([this.getThing('hashrate'),
             this.getThing('diff')])
        .then( x => ( parseInt(x[1]) * 2 ** 32 ) / parseFloat(x[0]) )
        .tap( x => console.log(x) )
        .then( x => message.reply(`Estimated time to find block: ${secondsToHumanReadable(x)}`) );
    } else if (subcmd === 'info') {
      P.all([this.getThing('height'),
             this.getThing('diff'),
             this.getThing('hashrate')])
        .then( x => message.reply(`We are at block #${x[0]} with difficulty ${x[1]} and network hashrate ${x[2]}`) );
    } else {
      message.reply('Syntax: `block info|height|hashrate|time|diff|supply|price`');
    }
  }

  getThing(thing) {
    return request.get({uri: SUBCOMMAND_URLS[thing]})
      .then( (response) => JSON.parse(response) )
      .then( (stuff) => { console.log(typeof stuff); return typeof stuff === 'object' ? stuff[0].price_btc : stuff } );
  }
}

function subcommandExists(subcmd) {
  return _.includes(Object.keys(SUBCOMMAND_URLS), subcmd);
}

function secondsToHumanReadable(duration){
  var hour = 0;
  var min = 0;
  var sec = 0;

  if (duration){
    if (duration >= 60) {
      min = Math.floor(duration / 60);
      sec = duration % 60;
    }
    else {
      sec = duration;
    }

    if (min >= 60) {
      hour = Math.floor(min / 60);
      min = min - hour * 60;
    }

    if ( hour < 10 ) { hour = '0'+hour; }
    if ( min < 10 ) { min = '0'+min; }
    if ( sec < 10 ) { sec = '0'+sec; }
  }
  
  return hour +":"+ min +":"+ Math.trunc(sec);
}

module.exports = Blockchain;
