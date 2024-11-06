import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

const cdn = new aws.s3.BucketV2('cdn', {
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

const sdk = new aws.s3.BucketV2('sdk', {
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

const usercontents = new aws.s3.BucketV2('usercontents', {
  bucket: 'readable-usercontents',
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

new aws.s3.BucketLifecycleConfigurationV2('usercontents', {
  bucket: usercontents.bucket,
  rules: [
    {
      id: 'transition-to-intelligent-tiering',
      status: 'Enabled',
      transitions: [
        {
          days: 0,
          storageClass: 'INTELLIGENT_TIERING',
        },
      ],
    },
  ],
});

const uploads = new aws.s3.BucketV2('uploads', {
  bucket: 'readable-uploads',
});

new aws.s3.BucketLifecycleConfigurationV2('uploads', {
  bucket: uploads.bucket,
  rules: [
    {
      id: 'delete-after-1-day',
      status: 'Enabled',
      expiration: {
        days: 1,
      },
    },
  ],
});

new aws.s3.BucketCorsConfigurationV2('uploads', {
  bucket: uploads.bucket,
  corsRules: [
    {
      allowedHeaders: ['*'],
      allowedMethods: ['POST'],
      allowedOrigins: ['https://app.rdbl.io', 'https://app.rdbl.ninja', 'http://localhost:4100'],
    },
  ],
});

export const buckets = { cdn, sdk, usercontents, uploads };

export const outputs = {
  AWS_S3_BUCKET_USERCONTENTS_ARN: usercontents.arn,
  AWS_S3_BUCKET_UPLOADS_ARN: uploads.arn,
};
