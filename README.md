# RENGEBOT

# Framework todo
 - auto-load and compile templates
 - add subcommands
 - add wrapper for message? Is that a smell?
 - Commands can override their db namespaces
# Feature Wishlist

# TODO for Trivia -
 - if question is answered print (XXX) instead of value
 - Timeout on player prompt - 30 seconds
 - Once timeout or player responds with '(category) (value)', print question clue and start timeout
 - Once player answers - if correct, add points, mark question answered, prompt again. if wrong, prompt next player to pick question.
 - show scores on board with questions
 - Once all questions is answered, whoever wins gets dat skrilla

# Fuck these TODOS, do my TODOs above
* Subtract burned coins from `block supply` command
* Register user
* Email verification for user registration
* Use arrow methods where possible to clean up
* add support for converting other types of steam id
* add steam compare
* Add twitch register
* Add webhook to comment when someone goes live
* Figure out why logger padding doesn't work
* Decide on async job queue handling (zeromq? redis?)

# DONE
- Prompt player to pick question (pick whoever started game for new game)
- Put number of category before each category
* Make message accessible thru context (shoddily)
* Clean out logging statements
* Add bluebird
* Add express
* commands can expose helpers
