'use strict';
const dotenv = require('dotenv').config();

const Renge = require('renge');
const Nyanpasu   = require('./src/nyanpasu.js');
const Blockchain = require('./src/blockchain.js');
const Wallet     = require('./src/wallet.js');
const Trivia     = require('./src/trivia.js');

const server = new Renge.Rengebot({
  port: 5555,
  prefix: 'tama',
  botToken: process.env.BOT_TOKEN
});

server.setRootHandler();

server.registerCommand(Nyanpasu);
server.registerCommand(Blockchain);
server.registerCommand(Wallet);
server.registerCommand(Trivia);

server.run();
