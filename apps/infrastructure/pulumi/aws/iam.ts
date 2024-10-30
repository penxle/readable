import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { buckets } from '$aws/s3';

const admin = new aws.iam.Role('admin@team', {
  name: 'admin@team',
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
    AWS: '886436942314',
  }),
});

new aws.iam.RolePolicy('admin@team', {
  role: admin.name,
  policy: {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: '*',
        Resource: '*',
      },
    ],
  },
});

const developer = new aws.iam.User('developer@team', {
  name: 'developer@team',
});

new aws.iam.UserPolicy('developer@team', {
  user: developer.name,
  policy: {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: ['s3:GetObject', 's3:PutObject'],
        Resource: [pulumi.concat(buckets.uploads.arn, '/*')],
      },
      {
        Effect: 'Allow',
        Action: ['s3:PutObject'],
        Resource: [pulumi.concat(buckets.usercontents.arn, '/*')],
      },
      {
        Effect: 'Allow',
        Action: ['ses:SendEmail'],
        Resource: ['*'],
      },
    ],
  },
});

const developerAccessKey = new aws.iam.AccessKey('developer@team', {
  user: developer.name,
});

const githubActionsOidcProvider = new aws.iam.OpenIdConnectProvider('actions@github', {
  url: 'https://token.actions.githubusercontent.com',
  clientIdLists: ['sts.amazonaws.com'],
  thumbprintLists: ['ffffffffffffffffffffffffffffffffffffffff'],
});

const githubActionsRole = new aws.iam.Role('actions@github', {
  name: 'actions@github',
  assumeRolePolicy: {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { Federated: githubActionsOidcProvider.arn },
        Action: 'sts:AssumeRoleWithWebIdentity',
        Condition: {
          StringLike: {
            'token.actions.githubusercontent.com:sub': 'repo:penxle/*',
          },
          StringEquals: {
            'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          },
        },
      },
    ],
  },
});

new aws.iam.RolePolicy('actions@github', {
  role: githubActionsRole.name,
  policy: {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: '*',
        Resource: '*',
      },
    ],
  },
});

export const roles = {
  admin,
  actions: githubActionsRole,
};

export const outputs = {
  AWS_IAM_DEVELOPER_ACCESS_KEY_ID: developerAccessKey.id,
  AWS_IAM_DEVELOPER_SECRET_ACCESS_KEY: developerAccessKey.secret,
};
