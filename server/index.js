const path = require('path')
const express = require('express')
const multer  = require('multer')

const app = express()

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../sketches'))
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}.svg`)
  }
})

const upload = multer({ storage })

app.post('/sketch', upload.single('sketch'), (req, res) => {

  console.log('send me', req.file, req.body)

  res.send('nice');
})

app.use('/', express.static(path.join(__dirname, '../camera')))

app.listen(3000, () => {
  console.log('started server on: http://localhost:3000')
})