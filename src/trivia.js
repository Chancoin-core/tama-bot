'use strict';

const request = require('request-promise');
const Command = require('renge').Command;
const _       = require('lodash');
const P       = require('bluebird');
const R       = require('ramda');

const CATEGORIES_PER_GAME = 6;
const QUESTIONS_PER_CATEGORY = 5;

let currentQuestion,
    allPlayers,
    currentPlayer,
    currentChannel,
    questionData,
    scores           = {},
    currentQuestionTimeout,
    currentlyRunning = false,
    waitingForAnswer = false;

function questionsRemaining() {

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

    questionTimeoutSchedule     = this.context.later.parse.text('every 30 seconds');
    pickQuestionTimeoutSchedule = this.context.later.parse.text('every 30 seconds');
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
         this.answerIsCorrect(message) ) {
      this.cancelQuestionTimeout();
      this.awardPoints(message);
      this.cleanupAfterQuestion();

      if (questionsRemaining <= 0) {
        this.finalizeGame( message );
      } else {
        this.askQuestion( message );
      }
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

  cancelQuestionTimeout() {
    currentQuestionTimeout.clear();
  }

  cleanupAfterQuestion() {
      waitingForAnswer = false;
      questionsRemaining -= 1;
  }

  initializeGame(message) {
    currentlyRunning = true;
    currentChannel   = message.channel;
    currentPlayer    = message.author;
    allPlayers       = [];
    scores           = {};

    return P.resolve(null);
  }

  startTrivia(message) {
    debugger;
    if (currentlyRunning) {
      message.reply( "We're already playing!" );
    } else {
      this.initializeGame( message );
      this.fetchQuestions()
        .then( this.printBoard.bind(this) );
    }
  }

  printBoard() {
    currentChannel.send({ embed: {
      author: {
        name: this.context.bot.user.username,
        icon_url: this.context.bot.user.avatarURL
      },
      title: "Trivia Board",
      fields: this.buildBoardFields()
    } });
  }

  buildBoardFields() {
    return questionData.map(categoryToBoardField);
  }

  fetchQuestions() {
    let offset = getRandomInt(0, 12000);
    console.log(offset);
    return request.get(`http://jservice.io/api/categories?offset=${offset}&count=6`)
      .then(JSON.parse)
      .tap( console.log )
      .map( x => request.get(`http://jservice.io/api/category?id=${x.id}`) )
      .map( x => JSON.parse(x) )
      .then( x => questionData = x );
  }

  awardPoints(message) {
    let player       = message.author;
    let currentScore = scores[message.author] || 0;

    scores[player] = currentScore += 10;
  }

  askQuestion(message) {
    waitingForAnswer = true;
    return this.getQuestion()
      .then(setCurrentQuestion)
      .then( _ => console.log(currentQuestion) )
      .then( _ => currentChannel.send(currentQuestion.question) )
      .then( _ => this.startQuestionTimer());
  }

  startQuestionTimer() {
    currentQuestionTimeout = this.context.later.setTimeout(this.questionTimeout.bind(this), questionTimeoutSchedule);
  }

  questionTimeout() {
    currentChannel.send(`Times up! The answer was ${currentQuestion.answer}`);
    this.cleanupAfterQuestion();
      if (questionsRemaining <= 0) {
        this.finalizeGame();
      } else {
        this.askQuestion();
      }
  }

  // TODO - Do we want to remove punctuation?
  // TODO - Handle articles (a, the)
  answerIsCorrect(message) {
    console.log("Answer: ", message.content);

    if (message.content.toLowerCase() == currentQuestion.answer.toLowerCase()) {
      return true;
    }
    return false;
  }

  messageIsFromPlayer(message) {
    return message.author !== this.context.bot.user;
  }

  finalizeGame() {
    currentChannel.send( "Game is over!" );
    currentChannel.send( JSON.stringify(scores) );
  }

  getQuestion() {
    return request.get('http://jservice.io/api/random');
  }
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

module.exports = Trivia;
