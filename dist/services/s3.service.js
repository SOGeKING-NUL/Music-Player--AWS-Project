"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPresignedUrl = getPresignedUrl;
exports.getStreamPresignedUrl = getStreamPresignedUrl;
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_config_1 = __importDefault(require("../config/s3.config"));
async function getPresignedUrl(key, contentType, expiresIn = 900 //15 mins
) {
    const bucket = process.env.AWS_BUCKET_NAME;
    if (!bucket) {
        throw new Error('No AWS_BUCKET_NAME found');
    }
    const command = new client_s3_1.PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType
    });
    const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3_config_1.default, command, { expiresIn: expiresIn });
    return {
        uploadUrl,
        key: key,
        expiresIn
    };
}
async function getStreamPresignedUrl(key, expiresIn = 3600 // 1 hour
) {
    const bucket = process.env.AWS_BUCKET_NAME;
    if (!bucket) {
        throw new Error('No AWS_BUCKET_NAME found');
    }
    const command = new client_s3_1.GetObjectCommand({
        Bucket: bucket,
        Key: key,
    });
    const streamUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3_config_1.default, command, { expiresIn });
    return {
        streamUrl,
        key: key,
        expiresIn
    };
}
