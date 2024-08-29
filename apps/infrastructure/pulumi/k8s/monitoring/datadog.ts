import * as k8s from '@pulumi/kubernetes';
import * as readable from '@readable/pulumi';
import { namespace } from '$k8s/monitoring';

new k8s.helm.v3.Chart('datadog-operator', {
  chart: 'datadog-operator',
  namespace: namespace.metadata.name,
  fetchOpts: {
    repo: 'https://helm.datadoghq.com',
  },
});

const secret = new readable.DopplerSecret('datadog', {
  metadata: {
    name: 'datadog',
    namespace: namespace.metadata.name,
  },

  spec: {
    project: 'datadog',
    config: 'default',
  },
});

new k8s.apiextensions.CustomResource('datadog', {
  apiVersion: 'datadoghq.com/v2alpha1',
  kind: 'DatadogAgent',
  metadata: {
    name: 'datadog',
    namespace: namespace.metadata.name,
  },
  spec: {
    global: {
      site: 'ap1.datadoghq.com',
      clusterName: 'readable',

      credentials: {
        appSecret: {
          secretName: secret.metadata.name,
          keyName: 'APP_KEY',
        },
        apiSecret: {
          secretName: secret.metadata.name,
          keyName: 'API_KEY',
        },
      },
    },

    features: {
      clusterChecks: {
        useClusterChecksRunners: true,
      },

      logCollection: {
        enabled: true,
        containerCollectAll: true,
      },
    },
  },
});
