const express = require('express')
const fs = require('fs')
const multer = require('multer')
const path = require('path')
const upload = multer({ dest: 'images/' })
const database = require('./database')


const app = express()
app.use(express.static('dist'))
app.post('/api/images',  upload.single('image'), async (req, res) => {
  const imageName = req.file.filename
  const description = req.body.description

  // Save this data to a database probably
  const image = await database.addImage(imageName, description)
  console.log(description, imageName)
  res.send({image})
})

app.use('/images', express.static('images'))
app.get('/api/images/:imageName', (req, res) => {
  // do a bunch of if statements to make sure the user is 
  // authorized to view this image, then

  const imageName = req.params.imageName
  const readStream = fs.createReadStream(`images/${imageName}`)
  readStream.pipe(res)
})

app.get("/api/images", async (req, res) => {
  const images = await database.getImages()
  res.send({images})
})


app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "./dist/index.html"))
})


const port = process.env.PORT || 8080
app.listen(port, () => console.log("listening on port 8080"))