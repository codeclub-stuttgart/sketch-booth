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
      img.onload = () => {
        console.log('loaded')

        send('setFileStatus', { path, loading: false }, _.noop)
      }

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
        .on('change', _.debounce((path) => {
          console.log('change')

          send('setFileStatus', { path, loading: false }, _.noop)
        }, 500))
        .on('unlink', (path) => send('removeFile', { path }, _.noop));
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

function sketchListView({ sketches }) {
  console.log('rerender sketchlist')

  const sketchItemsHTML = _.map(sketches, (sketch) => {
    let spinnerHTML, style;

    if (sketch.loading) {
      spinnerHTML = html`<img class='spinner' src="assets/spinner.svg">`
    } else {
      style = `background-image: url(${sketch.path})`
    }

    return html`
      <div class="sketch" style="${style}">
        ${spinnerHTML}
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
