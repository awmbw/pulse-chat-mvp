const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

const getUploadUrl = async (req, res) => {
    try {
        const { fileType } = req.body; // e.g. 'image/jpeg'
        
        // Generate a random 32-character hex name so files never overwrite each other
        const randomName = crypto.randomBytes(16).toString('hex');

        // Create the AWS Command
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: randomName,
            ContentType: fileType
        });

        // Generate the 60-second temporary upload ticket
        const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
        
        // Calculate where the file will live permanently once uploaded
        const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${randomName}`;

        res.json({ presignedUrl, publicUrl });
    } catch (error) {
        console.error("AWS S3 Error:", error);
        res.status(500).json({ message: 'Error generating upload URL' });
    }
};

const getReadUrl = async (req, res) => {
    try {
        const { key } = req.params;
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
        });

        // Generate a 1-hour secure ticket to read the file
        const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
        res.json({ presignedUrl });
    } catch (error) {
        console.error("AWS S3 Error:", error);
        res.status(500).json({ message: 'Error generating read URL' });
    }
};

module.exports = { getUploadUrl, getReadUrl };
