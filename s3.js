const {S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand} = require('@aws-sdk/client-s3')
const {  } = require("@aws-sdk/client-s3")
const presigner = require("@aws-sdk/s3-request-presigner")
const AWS = require('@aws-sdk/client-s3')

const dotenv = require('dotenv')
dotenv.config()

const bucketName = process.env.AWS_BUCKET_NAME
const bucketRegion = process.env.AWS_BUCKET_REGION
const accessKey = process.env.ACCESS_KEY
const secretAccessKey = process.env.SECRET_ACCESS_KEY

const s3Client = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey
  },
  region: bucketRegion
});

async function uploadImage(imageBuffer, imageName, mimetype) {
    // Create params that the S3 client will use to upload the image
    const params = {
      Bucket: bucketName,
      Key: imageName,
      Body: imageBuffer,
      ContentType: mimetype
    }
  
    // Upload the image to S3
    const command = new PutObjectCommand(params)
    const data = await s3Client.send(command)
  
    return data
}
exports.uploadImage = uploadImage

async function getSignedUrl(fileName) {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName
    })

    const signedUrl = await presigner.getSignedUrl(s3Client, command, { expiresIn: 60 * 60 * 24 })
    console.log(signedUrl)
    return signedUrl
}
exports.getSignedUrl = getSignedUrl

async function deleteImage(fileName) {

  var params = {
    Bucket: bucketName,
    Key: fileName
  }

  const command = new DeleteObjectCommand(params)
  await s3Client.send(command)
 
}
exports.deleteImage = deleteImage
