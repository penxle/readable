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

new aws.iam.Role('slack-app@support', {
  name: 'slack-app@support',
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
    Service: 'supportapp.amazonaws.com',
  }),
  managedPolicyArns: [aws.iam.ManagedPolicy.AWSSupportAppReadOnlyAccess],
});

const datadogIntegration = new aws.iam.Role('integration@datadog', {
  name: 'integration@datadog',
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
    AWS: '417141415827',
  }),
  managedPolicyArns: [aws.iam.ManagedPolicy.SecurityAudit],
});

new aws.iam.RolePolicy('integration@datadog', {
  role: datadogIntegration.name,
  policy: {
    Version: '2012-10-17',
    Statement: [
      {
        Action: [
          'apigateway:GET',
          'autoscaling:Describe*',
          'backup:List*',
          'budgets:ViewBudget',
          'ce:Get*',
          'cloudfront:GetDistributionConfig',
          'cloudfront:ListDistributions',
          'cloudtrail:DescribeTrails',
          'cloudtrail:GetTrailStatus',
          'cloudtrail:LookupEvents',
          'cloudwatch:Describe*',
          'cloudwatch:Get*',
          'cloudwatch:List*',
          'codedeploy:List*',
          'codedeploy:BatchGet*',
          'cur:DescribeReportDefinitions',
          'directconnect:Describe*',
          'dynamodb:List*',
          'dynamodb:Describe*',
          'ec2:Describe*',
          'ec2:GetTransitGatewayPrefixListReferences',
          'ec2:SearchTransitGatewayRoutes',
          'ecs:Describe*',
          'ecs:List*',
          'elasticache:Describe*',
          'elasticache:List*',
          'elasticfilesystem:DescribeFileSystems',
          'elasticfilesystem:DescribeTags',
          'elasticfilesystem:DescribeAccessPoints',
          'elasticloadbalancing:Describe*',
          'elasticmapreduce:List*',
          'elasticmapreduce:Describe*',
          'es:ListTags',
          'es:ListDomainNames',
          'es:DescribeElasticsearchDomains',
          'fsx:DescribeFileSystems',
          'fsx:ListTagsForResource',
          'health:DescribeEvents',
          'health:DescribeEventDetails',
          'health:DescribeAffectedEntities',
          'iam:ListAccountAliases',
          'kinesis:List*',
          'kinesis:Describe*',
          'lambda:GetPolicy',
          'lambda:List*',
          'logs:DeleteSubscriptionFilter',
          'logs:DescribeLogGroups',
          'logs:DescribeLogStreams',
          'logs:DescribeSubscriptionFilters',
          'logs:FilterLogEvents',
          'logs:PutSubscriptionFilter',
          'logs:TestMetricFilter',
          'organizations:Describe*',
          'organizations:List*',
          'pi:GetResourceMetrics',
          'pi:DescribeDimensionKeys',
          'rds:Describe*',
          'rds:List*',
          'redshift:DescribeClusters',
          'redshift:DescribeClusterParameterGroups',
          'redshift:DescribeLoggingStatus',
          'route53:List*',
          's3:GetAccountPublicAccessBlock',
          's3:GetBucketAcl',
          's3:GetBucketLogging',
          's3:GetBucketLocation',
          's3:GetBucketNotification',
          's3:GetBucketPolicyStatus',
          's3:GetBucketPublicAccessBlock',
          's3:GetBucketTagging',
          's3:GetBucketVersioning',
          's3:GetBucketWebsite',
          's3:GetEncryptionConfiguration',
          's3:GetObject',
          's3:ListAllMyBuckets',
          's3:ListBucket',
          's3:PutBucketNotification',
          'servicequotas:ListServiceQuotas',
          'servicequotas:GetServiceQuota',
          'ses:Get*',
          'sns:List*',
          'sns:Publish',
          'sqs:ListQueues',
          'states:ListStateMachines',
          'states:DescribeStateMachine',
          'support:DescribeTrustedAdvisor*',
          'support:RefreshTrustedAdvisorCheck',
          'synthetics:DescribeCanaries',
          'synthetics:GetCanaryRuns',
          'tag:GetResources',
          'tag:GetTagKeys',
          'tag:GetTagValues',
          'xray:BatchGetTraces',
          'xray:GetTraceSummaries',
        ],
        Effect: 'Allow',
        Resource: '*',
      },
      {
        Action: [
          'application-autoscaling:DescribeScalingActivities',
          'application-autoscaling:DescribeScalingPolicies',
          'athena:ListWorkGroups',
          'backup:ListRecoveryPointsByBackupVault',
          'bcm-data-exports:GetExport',
          'bcm-data-exports:ListExports',
          'cassandra:Select',
          'cur:DescribeReportDefinitions',
          'ec2:GetSnapshotBlockPublicAccessState',
          'glacier:GetVaultNotifications',
          'glue:ListRegistries',
          'iam:GenerateCredentialReport',
          'iam:GetAccountAuthorizationDetails',
          'iam:GetAccountSummary',
          'iam:GetPolicyVersion',
          'iam:ListVirtualMFADevices',
          'kafka:ListClustersV2',
          'lightsail:GetInstancePortStates',
          's3:ListAccessGrants',
          'savingsplans:DescribeSavingsPlanRates',
          'savingsplans:DescribeSavingsPlans',
          'sqs:getqueueattributes',
          'timestream:DescribeEndpoints',
          'timestream:ListTables',
          'waf-regional:ListRuleGroups',
          'waf-regional:ListRules',
          'waf:ListRuleGroups',
          'waf:ListRules',
          'wafv2:GetIPSet',
          'wafv2:GetRegexPatternSet',
          'wafv2:GetRuleGroup',
        ],
        Effect: 'Allow',
        Resource: '*',
      },
    ],
  },
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
            'token.actions.githubusercontent.com:sub': 'repo:readable-team/*',
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

export const outputs = {
  AWS_IAM_DEVELOPER_ACCESS_KEY_ID: developerAccessKey.id,
  AWS_IAM_DEVELOPER_SECRET_ACCESS_KEY: developerAccessKey.secret,
};
