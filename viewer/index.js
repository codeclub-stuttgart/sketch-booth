const _ = require('lodash')
const update = require('immutability-helper')
const chokidar = require('chokidar')
const html = require('choo/html')
const choo = require('choo')
const classNames = require('classnames')

const app = choo()

app.model({
  state: {
    sketches: {}
  },

  effects: {
    loadFile: (state, { path }, send) => {
      const img = new Image()

      // this is required to handle files which already exist and are not currently uploaded
      img.src = path
      img.onload = () => send('setFileStatus', { path, loading: false }, _.noop)

      send('addFile', { path }, _.noop)
    }
  },

  reducers: {
    addFile: (state, { path }) => {
      return update(state, {
        sketches: { [path]: { $set: { path, loading: true } } }
      })
    },

    removeFile: (state, { path }) => {
      const newSketches = _.omitBy(state.sketches, (sketch) => sketch.path !== path)

      return update(state, {
        sketches: { $set: newSketches }
      })
    },

    setFileStatus: (state, { path, loading }) => {
      return update(state, {
        sketches: {
          [path]: { loading: { $set: loading } }
        }
      })
    }
  },

  subscriptions: {
    fileWatcher: (send) => {
      chokidar.watch('sketches', { ignored: /[\/\\]\./ })
        .on('add', (path) => send('loadFile', { path }, _.noop))
        .on('change', _.debounce((path) => send('setFileStatus', { path, loading: false }, _.noop), 1000))
        .on('unlink', (path) => send('removeFile', { path }, _.noop));
    }
  }
})

function mainView(state, prev, send) {
  const sketches = _(state.sketches)
    .sortBy('path')
    .reverse()
    .value()

  return html`
    <main>
      ${sketchListView({ sketches })}
    </main>
  `

  function update(e) {
    send('update', e.target.value)
  }
}

function sketchListView({ sketches }) {
  console.log('rerender sketchlist')

  const sketchItemsHTML = _.map(sketches, (sketch) => {
    let contentHTML;

    if (sketch.loading) {
      contentHTML = html`
        <div class="spinner">
          <div class="bounce1"></div>
          <div class="bounce2"></div>
          <div class="bounce3"></div>
        </div>
      `
    } else {
      contentHTML = html`<img src="${sketch.path}" draggable>`
    }

    return html`
      <div class="sketch">
        ${contentHTML}
      </div>
    `
  })

  return html`
    <div class="sketches">
      ${sketchItemsHTML}
    </div>
  `
}

app.router(['/', mainView])

const dom = app.start()
document.body.appendChild(dom)
