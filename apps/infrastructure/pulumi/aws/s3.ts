import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

const cdn = new aws.s3.Bucket('cdn', {
  bucket: 'readable-cdn',
});

new aws.s3.BucketPolicy('cdn', {
  bucket: cdn.bucket,
  policy: {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { Service: 'cloudfront.amazonaws.com' },
        Action: ['s3:GetObject'],
        Resource: [pulumi.interpolate`${cdn.arn}/*`],
      },
    ],
  },
});

const sdk = new aws.s3.Bucket('sdk', {
  bucket: 'readable-sdk',
});

new aws.s3.BucketPolicy('sdk', {
  bucket: sdk.bucket,
  policy: {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { Service: 'cloudfront.amazonaws.com' },
        Action: ['s3:GetObject'],
        Resource: [pulumi.interpolate`${sdk.arn}/*`],
      },
    ],
  },
});

const usercontents = new aws.s3.Bucket('usercontents', {
  bucket: 'readable-usercontents',

  lifecycleRules: [
    {
      enabled: true,
      transitions: [
        {
          days: 0,
          storageClass: 'INTELLIGENT_TIERING',
        },
      ],
    },
  ],
});

new aws.s3.BucketPolicy('usercontents', {
  bucket: usercontents.bucket,
  policy: {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { Service: 'cloudfront.amazonaws.com' },
        Action: ['s3:GetObject'],
        Resource: [pulumi.interpolate`${usercontents.arn}/*`],
      },
    ],
  },
});

const uploads = new aws.s3.Bucket('uploads', {
  bucket: 'readable-uploads',

  corsRules: [
    {
      allowedHeaders: ['*'],
      allowedMethods: ['POST'],
      allowedOrigins: ['https://app.rdbl.io', 'https://app.rdbl.ninja', 'http://localhost:4100'],
    },
  ],

  lifecycleRules: [
    {
      enabled: true,
      expiration: {
        days: 1,
      },
    },
  ],
});

export const buckets = { cdn, sdk, usercontents, uploads };

export const outputs = {
  AWS_S3_BUCKET_SDK_ARN: sdk.arn,
  AWS_S3_BUCKET_USERCONTENTS_ARN: usercontents.arn,
  AWS_S3_BUCKET_UPLOADS_ARN: uploads.arn,
};
