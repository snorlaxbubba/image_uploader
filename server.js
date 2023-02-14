const express = require('express')
const fs = require('fs')
const multer = require('multer')
const path = require('path')
const database = require('./database')
const crypto = require('crypto') 
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
const s3file = require('./s3')
const sharp = require('sharp')

const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')

const {S3Client, PutObjectCommand} = require('@aws-sdk/client-s3')

const dotenv = require('dotenv')
dotenv.config()

const bucketName = process.env.AWS_BUCKET_NAME
const bucketRegion = process.env.AWS_BUCKET_REGION
const accessKey = process.env.ACCESS_KEY
const secretAccessKey = process.env.SECRET_ACCESS_KEY

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey
  },
  region: bucketRegion
});

const app = express()
app.use(express.static('dist'))

app.post("/api/images", upload.single('image'), async (req, res) => {
  // Get the data from the post request
  const description = req.body.description
  const fileBuffer = await sharp(req.file.buffer)
  .resize({ height: 1920, width: 1080, fit: "contain" })
  .toBuffer()

  const mimetype = req.file.mimetype
  const fileName = generateFileName()

  // Store the image in s3
  const s3Result = await s3file.uploadImage(fileBuffer, fileName, mimetype)

  // Store the image in the database
  const databaseResult = await database.addImage(fileName, description)

  res.status(201).send(databaseResult)
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

  // Add the signed url to each image
  for (const image of images) {
    image.imageURL = await s3file.getSignedUrl(image.file_name) 
    }  
  res.send(images)
})

app.delete("/api/images/:id", async (req, res) => {
  const id = req.params.id
  const image = await database.getImage(id)

  await database.deleteImage(id)
  await s3file.deleteImage(image.file_name)
  res.redirect("/api/images")
})


app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "./dist/index.html"))
})


const port = process.env.PORT || 8080
app.listen(port, () => console.log("listening on port 8080"))