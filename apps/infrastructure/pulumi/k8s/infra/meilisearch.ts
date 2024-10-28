import * as k8s from '@pulumi/kubernetes';
import * as random from '@pulumi/random';
import { namespace } from '$k8s/infra';

const password = new random.RandomPassword('meilisearch', {
  length: 20,
  special: false,
});

const pvc = new k8s.core.v1.PersistentVolumeClaim('meilisearch@infra', {
  metadata: {
    name: 'meilisearch',
    namespace: namespace.metadata.name,
  },

  spec: {
    storageClassName: 'efs',
    accessModes: ['ReadWriteMany'],
    resources: {
      requests: {
        storage: '5Gi',
      },
    },
  },
});

new k8s.helm.v3.Chart('meilisearch', {
  chart: 'meilisearch',
  version: '0.10.2',
  namespace: namespace.metadata.name,
  fetchOpts: {
    repo: 'https://meilisearch.github.io/meilisearch-kubernetes',
  },

  values: {
    environment: {
      MEILI_ENV: 'production',
      MEILI_MASTER_KEY: password.result,
    },

    persistence: {
      enabled: true,
      existingClaim: pvc.metadata.name,
    },

    service: {
      type: 'NodePort',
    },

    ingress: {
      enabled: true,
      className: 'alb',
      annotations: {
        'alb.ingress.kubernetes.io/group.name': 'private-alb',
        'alb.ingress.kubernetes.io/group.order': '10',
        'alb.ingress.kubernetes.io/listen-ports': JSON.stringify([{ HTTPS: 443 }]),
        'alb.ingress.kubernetes.io/healthcheck-path': '/health',
      },
      hosts: ['search.rdbl.app'],
    },
  },
});

export const outputs = {
  K8S_INFRA_MEILISEARCH_PASSWORD: password.result,
};
