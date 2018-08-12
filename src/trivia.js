'use strict';

const timer   = require('timers');
const request = require('request-promise');
const Command = require('renge').Command;
const _       = require('lodash');
const P       = require('bluebird');
const R       = require('ramda');

const CATEGORIES_PER_GAME = 6;
const QUESTIONS_PER_CATEGORY = 5;

const QUESTION_ANSWER_TIMEOUT = 30000;
const QUESTION_SELECT_TIMEOUT = 30000;

const valueIndexMap = {
  "100"  : 0,
  "200"  : 1,
  "300"  : 2,
  "400"  : 3,
  "500" : 4
};

let currentQuestion,
    allPlayers,
    currentPlayer,
    currentChannel,
    questionData,
    scores           = {},
    currentTimeout,
    currentlyRunning = false,
    waitingForAnswer = false,
    waitingForQuestionSelect = false;

function questionsRemaining() {
  // TODO
  return 10;
}

// Get random int, starting with 1
function getRandomInt(max) {
  return Math.random() * (max - 1) + 1;
}

let questionTimeoutSchedule,
    pickQuestionTimeoutSchedule;

class Trivia extends Command {
  constructor(context) {
    super(context);
    this.context.allMessages.on('message', this.onAnyMessage.bind(this));

    // this.startTrivia();
  }

  // LIFECYCLE METHODS/HOOKS --------------
  subscribeToAllMessages() {
    return true;
  }

  filter(message) {
    return message.content.match(/^trivia/);
  }

  onAnyMessage(message) {
    if ( this.messageIsFromPlayer(message) &&
         waitingForAnswer &&
         answerIsCorrect(message) ) {
      cancelTimeout();
      awardPoints(message);
      cleanupAfterQuestion();

      if (questionsRemaining <= 0) {
        finalizeGame( message );
      } else {
        askQuestion( message );
      }
    } else if ( waitingForQuestionSelect && messageIsFromPromptedPlayer(message) ) {
      parseQuestionSelection(message);
    }
  }

  process(message) {
    let subcmd = this.splitCmd(message.content)[1];

    if (subcmd == 'start') {
      this.startTrivia( message );
    } else if (subcmd == 'score') {
      message.reply( JSON.stringify(scores) );
    }
  }

  // END Lifecycle methods ----------------
  printBoard() {
    currentChannel.send({ embed: {
      author: {
        name: this.context.bot.user.username,
        icon_url: this.context.bot.user.avatarURL
      },
      title: "Trivia Board",
      fields: buildBoardFields()
    } })
      .then(promptPlayerToChooseQuestion);
  }

  messageIsFromPlayer(message) {
    return message.author !== this.context.bot.user;
  }

  startTrivia(message) {
    if (currentlyRunning) {
      message.reply( "We're already playing!" );
    } else {
      initializeGame( message );
      fetchQuestions()
        .then( this.printBoard.bind(this) );
    }
  }
}

function cancelTimeout() {
  timer.clearTimeout(currentTimeout);
  }

function cleanupAfterQuestion() {
    waitingForAnswer = false;
    questionsRemaining -= 1;
  }

function initializeGame(message) {
    currentlyRunning = true;
    currentChannel   = message.channel;
    currentPlayer    = message.author;
    allPlayers       = [];
    scores           = {};

    return P.resolve(null);
  }

function buildBoardFields() {
    return questionData.map(categoryToBoardField);
  }

function  fetchQuestions() {
    let offset = getRandomInt(12000);
    return request.get(`http://jservice.io/api/categories?offset=${offset}&count=6`)
      .then(JSON.parse)
      .map( x => request.get(`http://jservice.io/api/category?id=${x.id}`) )
      .map( x => JSON.parse(x) )
      .then( x => questionData = x );
  }

function awardPoints(message) {
    let player       = message.author;
    let currentScore = scores[message.author] || 0;

    scores[player] = currentScore += 10;
  }

// TODO - Do we want to remove punctuation?
// TODO - Handle articles (a, the)
function answerIsCorrect(message) {
    console.log("Answer: ", message.content);

    if (message.content.toLowerCase() == currentQuestion.answer.toLowerCase()) {
      return true;
    }
    return false;
  }


function finalizeGame() {
  currentChannel.send( "Game is over!" );
  currentChannel.send( JSON.stringify(scores) );
}

function promptPlayerToChooseQuestion() {
  currentChannel.send(`${currentPlayer.toString()} You have 30 seconds to pick a question...`);
  timer.setTimeout(questionSelectionTimeout, QUESTION_SELECT_TIMEOUT);
  waitingForQuestionSelect = true;
}

function questionSelectionTimeout() {
  currentChannel.send("Time out on question selection, fuck you, game is over.");
  finalizeGame();
}

function setCurrentQuestion(question) {
  currentQuestion = JSON.parse(question)[0];
  return question;
}

function categoryToBoardField(categoryData, idx) {
  return {
    name: `${idx}) ${categoryData.title}`,
    value: JSON.stringify(categoryData.clues.map( (x) => x.value ))
  };
}

function messageIsFromPromptedPlayer(message) {
  return message.author === currentPlayer;
}

// TODO handle malformed response from user
function parseQuestionSelection(message) {
  const split = message.content.split(' ');
  const category = parseInt(split[0]);
  const index = valueIndexMap[split[1]];
  console.log("Category ", category);
  console.log("Index ", index);
  console.log(questionData);

  currentQuestion = questionData[category]["clues"][index];
  cancelTimeout();
  waitingForQuestionSelect = false;
  waitingForAnswer = true;

  askQuestion();
}

function askQuestion(message) {
  P.resolve(currentQuestion)
    .then( _ => console.log(currentQuestion) )
    .then( _ => currentChannel.send(currentQuestion.question) )
    .then( _ => startQuestionTimer());
}

function startQuestionTimer() {
  timer.setTimeout(questionTimeout, QUESTION_ANSWER_TIMEOUT);    
}

function questionTimeout() {
  currentChannel.send(`Times up! The answer was ${currentQuestion.answer}`);
  cleanupAfterQuestion();
  if (questionsRemaining <= 0) {
    finalizeGame();
  } else {
    askQuestion();
  }
}

module.exports = Trivia;
