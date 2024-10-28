import * as k8s from '@pulumi/kubernetes';
import { filesystems } from '$aws/efs';

new k8s.storage.v1.StorageClass('efs', {
  metadata: {
    name: 'efs',
  },

  provisioner: 'efs.csi.aws.com',

  parameters: {
    provisioningMode: 'efs-ap',
    fileSystemId: filesystems.eks.id,
    directoryPerms: '700',
    ensureUniqueDirectory: 'true',
  },
});
