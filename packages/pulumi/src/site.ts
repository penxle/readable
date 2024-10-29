import * as aws from '@pulumi/aws';
import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';
import { match } from 'ts-pattern';
import { DopplerSecret } from './doppler-secret';
import { IAMServiceAccount } from './iam-service-account';

type SiteArgs = {
  name: pulumi.Input<string>;

  priority: {
    production: pulumi.Input<string>;
    dev: pulumi.Input<string>;
  };

  domain: {
    production: pulumi.Input<string>;
    dev: pulumi.Input<string>;
  };

  cloudfront?: {
    domainZone: pulumi.Input<string>;
    certificateArn: pulumi.Input<string>;
  };

  image: {
    name: pulumi.Input<string>;
    digest: pulumi.Input<string>;
    command?: pulumi.Input<string[]>;
  };

  resources: {
    cpu: pulumi.Input<string>;
    memory: pulumi.Input<string>;
  };

  autoscale?: {
    minCount?: pulumi.Input<number>;
    maxCount?: pulumi.Input<number>;
    averageCpuUtilization?: pulumi.Input<number>;
  };

  iam?: {
    policy: pulumi.Input<aws.iam.PolicyDocument>;
  };

  secret?: {
    project: pulumi.Input<string>;
  };
};

export class Site extends pulumi.ComponentResource {
  public readonly url: pulumi.Output<string>;

  constructor(name: string, args: SiteArgs, opts?: pulumi.ComponentResourceOptions) {
    super('readable:index:Site', name, {}, opts);

    const project = pulumi.getProject();
    const stack = pulumi.getStack();
    const isProd = stack === 'prod';
    const useCloudfront = isProd && args.cloudfront;

    const domainName = match(stack)
      .with('prod', () => args.domain.production)
      .with('dev', () => args.domain.dev)
      .run();

    const namespace = match(stack)
      .with('prod', () => 'prod')
      .with('dev', () => 'dev')
      .run();

    const config = match(stack)
      .with('prod', () => 'prod')
      .with('dev', () => 'dev')
      .run();

    const priority = match(stack)
      .with('prod', () => args.priority.production)
      .with('dev', () => args.priority.dev)
      .run();

    this.url = pulumi.output(pulumi.interpolate`https://${domainName}`);

    let secret;
    if (args.secret) {
      secret = new DopplerSecret(
        name,
        {
          metadata: {
            name: args.name,
            namespace,
          },
          spec: {
            project: args.secret.project,
            config,
          },
        },
        { parent: this },
      );
    }

    let serviceAccount;
    if (args.iam) {
      serviceAccount = new IAMServiceAccount(
        name,
        {
          metadata: {
            name: args.name,
            namespace,
          },
          spec: {
            policy: args.iam.policy,
          },
        },
        { parent: this },
      );
    }

    const labels = { app: args.name };

    const service = new k8s.core.v1.Service(
      name,
      {
        metadata: {
          name: args.name,
          namespace,
          annotations: {
            'pulumi.com/skipAwait': 'true',
          },
        },
        spec: {
          type: 'NodePort',
          selector: labels,
          ports: [{ port: 3000 }],
        },
      },
      { parent: this },
    );

    const rollout = new k8s.apiextensions.CustomResource(
      name,
      {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'Rollout',

        metadata: {
          name: args.name,
          namespace,
          annotations: {
            'pulumi.com/patchForce': 'true',
            'reloader.stakater.com/auto': 'true',
            ...(isProd && {
              'notifications.argoproj.io/subscribe.on-rollout-completed.slack': 'activities',
            }),
          },
        },
        spec: {
          ...(!isProd && { replicas: 1 }),
          selector: { matchLabels: labels },
          template: {
            metadata: { labels },
            spec: {
              ...(serviceAccount && { serviceAccountName: serviceAccount.metadata.name }),
              containers: [
                {
                  name: 'app',
                  image: pulumi.interpolate`${args.image.name}@${args.image.digest}`,
                  command: args.image.command,
                  env: [
                    { name: 'HTTP_HOST', value: domainName },
                    { name: 'PUBLIC_PULUMI_PROJECT', value: project },
                    { name: 'PUBLIC_PULUMI_STACK', value: stack },
                  ],
                  ...(secret && { envFrom: [{ secretRef: { name: secret.metadata.name } }] }),
                  resources: {
                    requests: { cpu: args.resources.cpu },
                    limits: { memory: args.resources.memory },
                  },
                  readinessProbe: {
                    httpGet: { path: '/healthz', port: 3000 },
                  },
                },
              ],
            },
          },
          strategy: {
            blueGreen: {
              activeService: service.metadata.name,
            },
          },
        },
      },
      {
        parent: this,
      },
    );

    if (isProd) {
      new k8s.autoscaling.v2.HorizontalPodAutoscaler(
        name,
        {
          metadata: {
            name: args.name,
            namespace,
          },
          spec: {
            scaleTargetRef: {
              apiVersion: rollout.apiVersion,
              kind: rollout.kind,
              name: rollout.metadata.name,
            },
            minReplicas: args.autoscale?.minCount ?? 2,
            maxReplicas: args.autoscale?.maxCount ?? 10,
            metrics: [
              {
                type: 'Resource',
                resource: {
                  name: 'cpu',
                  target: {
                    type: 'Utilization',
                    averageUtilization: args.autoscale?.averageCpuUtilization ?? 50,
                  },
                },
              },
            ],
          },
        },
        { parent: this },
      );

      new k8s.policy.v1.PodDisruptionBudget(
        name,
        {
          metadata: {
            name: args.name,
            namespace,
          },
          spec: {
            selector: { matchLabels: labels },
            minAvailable: '50%',
          },
        },
        { parent: this },
      );
    }

    const ingress = new k8s.networking.v1.Ingress(
      name,
      {
        metadata: {
          name: args.name,
          namespace,
          annotations: {
            'alb.ingress.kubernetes.io/group.name': 'public-alb',
            'alb.ingress.kubernetes.io/group.order': priority,
            'alb.ingress.kubernetes.io/listen-ports': JSON.stringify([{ HTTPS: 443 }]),
            'alb.ingress.kubernetes.io/healthcheck-path': '/healthz',
            ...(useCloudfront && { 'external-dns.alpha.kubernetes.io/ingress-hostname-source': 'annotation-only' }),
          },
        },
        spec: {
          ingressClassName: 'alb',
          rules: [
            {
              host: domainName,
              http: {
                paths: [
                  {
                    path: '/',
                    pathType: 'Prefix',
                    backend: {
                      service: {
                        name: service.metadata.name,
                        port: { number: service.spec.ports[0].port },
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      { parent: this },
    );

    if (useCloudfront) {
      const ref = new pulumi.StackReference('readable/infrastructure/base', {}, { parent: this });

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const zone = aws.route53.getZoneOutput({ name: args.cloudfront!.domainZone }, { parent: this });

      const distribution = new aws.cloudfront.Distribution(
        name,
        {
          enabled: true,
          aliases: [domainName],
          httpVersion: 'http2and3',

          origins: [
            {
              originId: 'alb',
              domainName: ingress.status.loadBalancer.ingress[0].hostname,
              customOriginConfig: {
                httpPort: 80,
                httpsPort: 443,
                originProtocolPolicy: 'https-only',
                originSslProtocols: ['TLSv1.2'],
                originReadTimeout: 60,
                originKeepaliveTimeout: 60,
              },
              originShield: { enabled: false, originShieldRegion: 'ap-northeast-2' },
            },
          ],

          defaultCacheBehavior: {
            targetOriginId: 'alb',
            compress: true,
            viewerProtocolPolicy: 'redirect-to-https',
            allowedMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
            cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
            cachePolicyId: ref.requireOutput('AWS_CLOUDFRONT_DYNAMIC_CACHE_POLICY_ID'),
            originRequestPolicyId: ref.requireOutput('AWS_CLOUDFRONT_DYNAMIC_ORIGIN_REQUEST_POLICY_ID'),
            responseHeadersPolicyId: ref.requireOutput('AWS_CLOUDFRONT_DYNAMIC_RESPONSE_HEADERS_POLICY_ID'),
          },

          restrictions: {
            geoRestriction: {
              restrictionType: 'none',
            },
          },

          viewerCertificate: {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            acmCertificateArn: args.cloudfront!.certificateArn,
            sslSupportMethod: 'sni-only',
            minimumProtocolVersion: 'TLSv1.2_2021',
          },
        },
        { parent: this },
      );

      new aws.route53.Record(
        name,
        {
          name: domainName,
          type: 'A',
          zoneId: zone.zoneId,
          aliases: [
            {
              name: distribution.domainName,
              zoneId: distribution.hostedZoneId,
              evaluateTargetHealth: false,
            },
          ],
        },
        { parent: this },
      );
    }
  }
}
