import * as pulumi from '@pulumi/pulumi';
import * as readable from '@readable/pulumi';

const config = new pulumi.Config('readable');

const ref = new pulumi.StackReference('readable/infrastructure/base');

const site = new readable.Site('website', {
  name: 'website',

  priority: {
    production: '30',
    dev: '130',
  },

  domain: {
    production: 'rdbl.io',
    dev: 'rdbl.ninja',
  },

  cloudfront: {
    certificateArn: ref.requireOutput('AWS_ACM_CLOUDFRONT_RDBL_IO_CERTIFICATE_ARN'),
    domainZone: 'rdbl.io',
  },

  image: {
    name: '637423633734.dkr.ecr.ap-northeast-2.amazonaws.com/readable',
    digest: config.require('digest'),
    command: ['bun', 'run', 'apps/website/index.js'],
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
    project: 'website',
  },
});

new readable.Redirect('www.website', {
  name: 'www.website',

  priority: {
    production: '31',
    dev: '131',
  },

  production: {
    from: { host: 'www.rdbl.io' },
    to: { host: 'rdbl.io' },
  },

  dev: {
    from: { host: 'www.rdbl.ninja' },
    to: { host: 'rdbl.ninja' },
  },

  code: 301,
});

export const SITE_URL = site.url;
