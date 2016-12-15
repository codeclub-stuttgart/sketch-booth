const _ = require('lodash')
const update = require('immutability-helper')
const chokidar = require('chokidar')
const html = require('choo/html')
const choo = require('choo')
const uid = require('uid')
const classNames = require('classnames')

const app = choo()

app.model({
  state: {
    selectedSketchId: null,
    sketches: {}
  },

  effects: {
    loadSketch: (state, { path }, send) => {
      const id = uid()

      // this is required to handle files which already exist and are not currently uploaded
      const img = new Image()
      img.src = path
      img.onload = () => send('setSketchStatus', { id, loading: false }, _.noop)

      send('addSketch', { path, id, loading: true }, _.noop)
    }
  },

  reducers: {
    selectSketch: (state, { id }) => {
      return update(state, {
        selectedSketchId: { $set: id }
      });
    },

    addSketch: (state, { path, id, loading }) => {
      return update(state, {
        sketches: { [id]: { $set: { path, id, loading } } }
      })
    },

    removeSketch: (state, { id }) => {
      const sketches = _.omit(state.sketches, [id])

      return update(state, {
        sketches: { $set: sketches }
      })
    },

    setSketchStatus: (state, { id, loading }) => {
      return update(state, {
        sketches: {
          [id]: { loading: { $set: loading } }
        }
      })
    }
  },

  subscriptions: {
    fileWatcher: (send) => {
      chokidar.watch('sketches', { ignored: /[\/\\]\./ })
        .on('add', (path) => send('loadSketch', { path }, _.noop))
        .on('change', _.debounce((path) => send('setSketchStatus', { path, loading: false }, _.noop), 1000))
        .on('unlink', (path) => send('removeSketch', { path }, _.noop));
    }
  }
})

function mainView(state, prev, send) {
  const { sketches, selectedSketchId } = state

  let previewHTML
  const sketchesHTML = _(state.sketches)
    .sortBy('path')
    .reverse()
    .map(({ id, path, loading }) => (
      sketchView({
        id, path, loading,
        selected: id === selectedSketchId,
        onSelect: (id) => send('selectSketch', {id })
      })
    ))
    .value()

  if (selectedSketchId) {
    previewHTML = html`<img src=${sketches[selectedSketchId].path}>`
  }

  return html`
    <main>
      ${previewHTML}
      <div class="sketches">
        ${sketchesHTML}
      </div>
    </main>
  `

  function update(e) {
    send('update', e.target.value)
  }
}

function sketchView({
  id, path, loading, selected,
  onSelect
}) {
  let contentHTML

  if (loading) {
    contentHTML = html`
      <div class="spinner">
        <div class="bounce1"></div>
        <div class="bounce2"></div>
        <div class="bounce3"></div>
      </div>
    `
  } else {
    contentHTML = html`<img src="${path}" draggable>`
  }

  const classes = classNames('sketch', {
    'is-selected': selected
  })

  return html`
    <div class="${classes}" onclick=${() => onSelect(id)}>
      ${contentHTML}
    </div>
  `
}

app.router(['/', mainView])

const dom = app.start()
document.body.appendChild(dom)
