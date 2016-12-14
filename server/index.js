const path = require('path')
const express = require('express')
const multer  = require('multer')
const upload = multer({ dest: path.join(__dirname, '../sketches') })

const app = express()

app.post('/sketch', upload.single('sketch'), (req, res) => {

  console.log('send me', req.file, req.body)

  res.send('nice');
})

app.use('/', express.static(path.join(__dirname, '../camera')))

app.listen(3000, () => {
  console.log('started server on: http://localhost:3000')
})