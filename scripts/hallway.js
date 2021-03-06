'use strict'

function Hallway (sites) {
  const feeds = {}
  this.sites = sites
  this.el = document.createElement('div')
  this.el.id = 'hallway'

  this.install = function (host) {
    host.appendChild(this.el)
    this.findFeeds()
  }

  this.start = function () {
    this.el.innerHTML = 'hello'
    this.fetchFeeds()
  }

  this.refresh = function () {
    const entries = this.sortEntries()
    let html = ''
    for (const id in entries) {
      html += `${this.templateEntry(entries[id])}\n`
    }
    this.el.innerHTML = `<ul>${html}</ul>${this._footer()}`
  }

  // Entries

  this.sortEntries = function () {
    const a = []
    for (const id in feeds) {
      const feed = feeds[id]
      for (const i in feed.content) {
        const entry = feed.content[i]
        a.push(entry)
      }
    }
    return a
  }

  this.templateEntry = function (entry) {
    // Find mention
    if (entry.body.indexOf('@<') > -1) {
      const data = entry.body.split('@<').pop().split('>')[0]
      const mention = data.split(' ')
      const name = mention[0]
      const path = mention[1]
      entry.body = entry.body.replace(`@<${data}>`, `<a href='${path}'>@${name}</a>`)
    }

    return `<li class='entry'><span class='date'>${timeAgo(Date.parse(entry.date))}</span> <span class='author'>${entry.author}</span> <span class='body'>${entry.body}</span></li>`
  }

  // Feeds

  this.findFeeds = function () {
    console.log('Finding feeds..')
    for (const id in sites) {
      const site = sites[id]
      if (site.feed && site.author) {
        feeds[site.author] = { path: site.feed }
      }
    }
    console.log(`Found ${Object.keys(feeds).length} feeds.`)
  }

  this.fetchFeeds = function () {
    console.log(`Fetching ${Object.keys(feeds).length} feeds..`)
    for (const id in feeds) {
      this.fetchFeed(id, feeds[id])
    }
  }

  this.fetchFeed = function (id, feed) {
    console.log(`Fetching ${id}(${feed.path})..`)
    Promise.all([ fetch(feed.path + '?v=1', { cache: 'no-store' }).then(x => x.text()) ]).then(([content]) => {
      feeds[id].content = parseFeed(id, content)
      this.refresh()
    })
  }

  // Extras

  this._footer = function () {
    return '<p>The <b>Hallway</b> is a decentralized forum, to join the conversation, simply create yourself a <a href="https://twtxt.readthedocs.io/en/stable/user/twtxtfile.html">twtxt</a> feed and <a href="https://github.com/XXIIVV/Webring/">add it</a> to your entry in the webring.</p>'
  }

  // Utils

  function parseFeed (author, feed) {
    const lines = feed.split('\n')
    const entries = []
    for (const id in lines) {
      const line = lines[id]
      const date = line.substr(0, 25).trim()
      const body = line.substr(26).trim()
      entries.push({ date, body, author })
    }
    return entries
  }

  function timeAgo (dateParam) {
    if (!dateParam) {
      return null
    }

    const date = typeof dateParam === 'object' ? dateParam : new Date(dateParam)
    const DAY_IN_MS = 86400000 // 24 * 60 * 60 * 1000
    const today = new Date()
    const yesterday = new Date(today - DAY_IN_MS)
    const seconds = Math.round((today - date) / 1000)
    const minutes = Math.round(seconds / 60)
    const isToday = today.toDateString() === date.toDateString()
    const isYesterday = yesterday.toDateString() === date.toDateString()

    if (seconds < 5) {
      return 'now'
    } else if (seconds < 60) {
      return `${seconds} seconds ago`
    } else if (seconds < 90) {
      return 'about a minute ago'
    } else if (minutes < 60) {
      return `${minutes} minutes ago`
    } else if (isToday) {
      return `${Math.floor(minutes / 60)} hours ago`
    } else if (isYesterday) {
      return 'yesterday'
    }
    return `${Math.floor(minutes / 1440)} days ago`
  }
}
