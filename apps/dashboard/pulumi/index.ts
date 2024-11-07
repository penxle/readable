import * as pulumi from '@pulumi/pulumi';
import * as readable from '@readable/pulumi';

const config = new pulumi.Config('readable');

const ref = new pulumi.StackReference('readable/infrastructure/base');

const site = new readable.Site('dashboard', {
  name: 'dashboard',

  priority: {
    production: '20',
    dev: '120',
  },

  domain: {
    production: 'app.rdbl.io',
    dev: 'app.rdbl.ninja',
  },

  cloudfront: {
    certificateArn: ref.requireOutput('AWS_ACM_CLOUDFRONT_RDBL_IO_CERTIFICATE_ARN'),
    domainZone: 'rdbl.io',
  },

  image: {
    name: '637423633734.dkr.ecr.ap-northeast-2.amazonaws.com/readable',
    digest: config.require('digest'),
    command: ['bun', 'run', 'apps/dashboard/index.js'],
  },

  resources: {
    cpu: '500m',
    memory: '1Gi',
  },

  autoscale: {
    minCount: 2,
    maxCount: 20,
    averageCpuUtilization: 50,
  },

  secret: {
    project: 'dashboard',
  },
});

export const SITE_URL = site.url;
