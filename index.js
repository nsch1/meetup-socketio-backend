const app = require('express')
const server = require('http').Server(app)
const io = require('socket.io')(server)
const Meetup = require("meetup")
const mup = new Meetup()

const topicsCounter = {}

server.listen(3002)

mup.stream("/2/rsvps", stream => {
  stream
    .on("data", item => {
      const topicNames = item.group.group_topics.map(topic => topic.topic_name)
      if (topicNames.includes('Software Development')) {
        topicNames.forEach(name => {
          if (topicsCounter[name]) {
            topicsCounter[name]++
          }
          else {
            topicsCounter[name] = 1
          }
        })
        const arrayOfTopics = Object.keys(topicsCounter)

        arrayOfTopics.sort((topicA, topicB) => {
          return topicsCounter[topicB] - topicsCounter[topicA]
        })

        const topTopics = arrayOfTopics.slice(0, 10).map(topic => {
          return { topic, count: topicsCounter[topic] }
        })

        io.emit('action', { topTopics })

      }
    }).on("error", e => {
       console.log("error! " + e)
    })
})

io.on('connection', socket => {
  console.log('got connection')
})