const _ = require('lodash')
const update = require('immutability-helper')
const chokidar = require('chokidar')
const html = require('choo/html')
const choo = require('choo')

const app = choo()

app.model({
  state: {
    sketches: []
  },
  reducers: {
    addFile: (state, {sketch}) => {
      return update(state, {
        sketches: {$push: [sketch]}
      })
    },

    removeFile: (state, {sketch}) => {
      const newSketches = _.filter(state.sketches, (otherSketch) => otherSketch !== sketch)

      return update(state, {
        sketches: {$set: newSketches}
      })
    }
  },

  subscriptions: {
    fileWatcher: (send) => {
      chokidar.watch('sketches', {ignored: /[\/\\]\./})
        .on('add', (file) => send('addFile', { sketch: file }, _.noop))
        .on('unlink', (file) => send('removeFile', { sketch: file }, _.noop));
    }
  }
})

function mainView(state, prev, send) {
  return html`
    <main>
      <h1>Sketches</h1>
      
      ${sketchListView({ sketches: state.sketches })}
      
    </main>
  `

  function update(e) {
    send('update', e.target.value)
  }
}

function sketchListView ({ sketches }) {
  const sketchItemsHTML = _.map(sketches, (sketch) => html`
    <div class="sketch" style="background-image: url(${sketch})"></div>
  `)

  return html`
    <div class="sketches">
      ${sketchItemsHTML}
    </div>
  `
}

app.router(['/', mainView])

const dom = app.start()
document.body.appendChild(dom)
