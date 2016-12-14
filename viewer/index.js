const html = require('choo/html')
const choo = require('choo')
const app = choo()

app.model({
  state: { title: 'Not quite set yet' },
  reducers: {
    update: function (state, data) {
      return { title: data }
    }
  },

  subscriptions: [

    

  ]
})

function mainView (state, prev, send) {
  return html`
    <main>
      <h1>Title: ${state.title}</h1>
      <input type="text" oninput=${update}>
    </main>
  `

  function update (e) {
    send('update', e.target.value)
  }
}

app.router(['/', mainView])

const dom = app.start()
document.body.appendChild(dom)
