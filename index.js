const app = require('express')
const server = require('http').Server(app)
const io = require('socket.io')(server)
const Meetup = require("meetup")
const mup = new Meetup()

const topicsCounter = {}

let lastTenItems = []

server.listen(3002)

const countOccurences = (topics) => {
  topics.forEach(name => {
    topicsCounter[name] ? topicsCounter[name]++ : topicsCounter[name] = 1
  })
}

const topTen = () => {
  return Object.keys(topicsCounter)
    .sort((topicA, topicB) => topicsCounter[topicB] - topicsCounter[topicA])
    .slice(0, 10)
    .map(topic => {
      return { topic, count: topicsCounter[topic] }
    })
}

const inLastTenItems = (item) => {
  return lastTenItems.filter(i => {
    return i[0] === item.member.member_id &&
    i[1] === item.event.event_id
  }).length > 0
}

const addToLastTenItems = (item) => {
  return [[item.member.member_id, item.event.event_id], ...lastTenItems].slice(0, 10)
}

mup.stream("/2/rsvps", stream => {
  stream
    .on("data", item => {
      const topicNames = item.group.group_topics.map(topic => topic.topic_name)

      if (!topicNames.includes('Software Development')) return

      if (inLastTenItems(item)) return

      lastTenItems = addToLastTenItems(item)

      countOccurences(topicNames)

      io.emit('action', {
        type: 'UPDATE_TOPICS',
        payload: topTen()
      })

      io.emit('action', {
        type: 'ADD_RSVP',
        payload: item
      })

    }).on("error", e => {
       console.log("error! " + e)
    })
})

io.on('connection', socket => {
  console.log('got connection')
  socket.emit('action', {
    type: 'UPDATE_TOPICS',
    payload: topTen()
  })
})