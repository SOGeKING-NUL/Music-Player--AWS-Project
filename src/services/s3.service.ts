import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../config/s3.config";

export async function getPresignedUrl(
    key: string, 
    contentType: string, 
    expiresIn: number= 900  //15 mins
){  
    const bucket= process.env.AWS_BUCKET_NAME;

    if (!bucket){
        throw new Error ('No AWS_BUCKET_NAME found');
    }
    
    const command= new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType
    });

    const uploadUrl= await getSignedUrl(s3Client, command, {expiresIn: expiresIn});

    return {
        uploadUrl,
        key: key,
        expiresIn
    }
}

export async function getStreamPresignedUrl(
    key: string, 
    expiresIn: number = 3600  // 1 hour
){  
    const bucket = process.env.AWS_BUCKET_NAME;

    if (!bucket){
        throw new Error ('No AWS_BUCKET_NAME found');
    }
    
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    });

    const streamUrl = await getSignedUrl(s3Client, command, { expiresIn });

    return {
        streamUrl,
        key: key,
        expiresIn
    }
}