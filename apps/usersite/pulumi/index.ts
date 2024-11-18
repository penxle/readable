import * as pulumi from '@pulumi/pulumi';
import * as readable from '@readable/pulumi';

const config = new pulumi.Config('readable');

const ref = new pulumi.StackReference('readable/infrastructure/base');

const site = new readable.Site('usersite', {
  name: 'usersite',

  priority: {
    production: '40',
    dev: '140',
  },

  domain: {
    production: '*.rdbl.io',
    dev: '*.rdbl.ninja',
  },

  cloudfront: {
    certificateArn: ref.requireOutput('AWS_ACM_CLOUDFRONT_RDBL_IO_CERTIFICATE_ARN'),
    domainZone: 'rdbl.io',
  },

  image: {
    name: '637423633734.dkr.ecr.ap-northeast-2.amazonaws.com/readable',
    digest: config.require('digest'),
    command: ['bun', 'run', 'apps/usersite/index.js'],
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
    project: 'usersite',
  },
});

new readable.Caddy('usersite-proxy', {
  name: 'usersite-proxy',

  caddyfile: pulumi.interpolate`
{
  admin off
  email cert@penxle.io
  storage dynamodb usersite-proxy
  persist_config off

  servers {
    listener_wrappers {
      proxy_protocol {
        allow 10.10.0.0/16
      }

      tls
    }
  }

  on_demand_tls {
    ask http://api:3000/caddy/tls
  }
  
  log {
    format json {
      time_key time
      time_format iso8601
      duration_format string
    }
  }
}

http:// {
  respond /healthz 200
}

https:// {
  respond /healthz 200
  reverse_proxy usersite:3000

  encode zstd gzip

  tls {
    on_demand
  }

  header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    X-Content-Type-Options nosniff
    X-Frame-Options DENY
  }

  log
}
  `,

  domain: {
    production: 'cname.rdbl.io',
    dev: 'cname.rdbl.ninja',
  },

  resources: {
    cpu: '100m',
    memory: '200Mi',
  },

  autoscale: {
    minCount: 2,
    maxCount: 20,
    averageCpuUtilization: 50,
  },

  iam: {
    policy: {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:DeleteItem', 'dynamodb:Scan'],
          Resource: [ref.requireOutput('AWS_DYNAMODB_USERSITE_PROXY_ARN')],
        },
      ],
    },
  },
});

export const SITE_URL = site.url;
