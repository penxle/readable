import * as aws from '@pulumi/aws';
import * as tls from '@pulumi/tls';
import { securityGroups, subnets } from '$aws/vpc';

const clusterRole = new aws.iam.Role('cluster@eks', {
  name: 'cluster@eks',
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
    Service: 'eks.amazonaws.com',
  }),
  managedPolicyArns: [aws.iam.ManagedPolicy.AmazonEKSClusterPolicy],
});

const fargateRole = new aws.iam.Role('fargate@eks', {
  name: 'fargate@eks',
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
    Service: 'eks-fargate-pods.amazonaws.com',
  }),
  managedPolicyArns: [aws.iam.ManagedPolicy.AmazonEKSFargatePodExecutionRolePolicy],
});

const adminRole = new aws.iam.Role('admin@eks', {
  name: 'admin@eks',
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
    AWS: 'arn:aws:iam::637423633734:root',
  }),
});

export const cluster = new aws.eks.Cluster('readable', {
  name: 'readable',
  version: '1.31',
  roleArn: clusterRole.arn,

  bootstrapSelfManagedAddons: false,

  accessConfig: {
    authenticationMode: 'API',
  },

  vpcConfig: {
    subnetIds: [subnets.public.az1.id, subnets.public.az2.id, subnets.private.az1.id, subnets.private.az2.id],
    securityGroupIds: [securityGroups.internal.id],
    endpointPublicAccess: false,
    endpointPrivateAccess: true,
  },

  kubernetesNetworkConfig: {
    serviceIpv4Cidr: '10.64.0.0/16',
  },
});

new aws.eks.Addon('coredns', {
  clusterName: cluster.name,
  addonName: 'coredns',
  addonVersion: aws.eks.getAddonVersionOutput({
    addonName: 'coredns',
    kubernetesVersion: cluster.version,
    mostRecent: true,
  }).version,
});

new aws.eks.Addon('kube-proxy', {
  clusterName: cluster.name,
  addonName: 'kube-proxy',
  addonVersion: aws.eks.getAddonVersionOutput({
    addonName: 'kube-proxy',
    kubernetesVersion: cluster.version,
    mostRecent: true,
  }).version,
});

new aws.eks.Addon('vpc-cni', {
  clusterName: cluster.name,
  addonName: 'vpc-cni',
  addonVersion: aws.eks.getAddonVersionOutput({
    addonName: 'vpc-cni',
    kubernetesVersion: cluster.version,
    mostRecent: true,
  }).version,
});

new aws.eks.Addon('aws-efs-csi-driver', {
  clusterName: cluster.name,
  addonName: 'aws-efs-csi-driver',
  addonVersion: aws.eks.getAddonVersionOutput({
    addonName: 'aws-efs-csi-driver',
    kubernetesVersion: cluster.version,
    mostRecent: true,
  }).version,
});

new aws.eks.Addon('eks-pod-identity-agent', {
  clusterName: cluster.name,
  addonName: 'eks-pod-identity-agent',
  addonVersion: aws.eks.getAddonVersionOutput({
    addonName: 'eks-pod-identity-agent',
    kubernetesVersion: cluster.version,
    mostRecent: true,
  }).version,
});

new aws.eks.AccessEntry('fargate@eks', {
  clusterName: cluster.name,
  principalArn: fargateRole.arn,
  type: 'FARGATE_LINUX',
});

new aws.eks.AccessEntry('admin@eks', {
  clusterName: cluster.name,
  principalArn: adminRole.arn,
});

new aws.eks.AccessPolicyAssociation('admin@eks', {
  clusterName: cluster.name,
  principalArn: adminRole.arn,
  policyArn: 'arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy',
  accessScope: { type: 'cluster' },
});

export const fargate = new aws.eks.FargateProfile('karpenter', {
  fargateProfileName: 'karpenter',

  clusterName: cluster.name,
  podExecutionRoleArn: fargateRole.arn,

  selectors: [{ namespace: 'kube-system', labels: { app: 'karpenter' } }],
  subnetIds: [subnets.private.az1.id, subnets.private.az2.id],
});

const certificate = tls.getCertificateOutput({
  url: cluster.identities[0].oidcs[0].issuer,
});

export const oidcProvider = new aws.iam.OpenIdConnectProvider('cluster@eks', {
  url: cluster.identities[0].oidcs[0].issuer,
  clientIdLists: ['sts.amazonaws.com'],
  thumbprintLists: [certificate.certificates[0].sha1Fingerprint],
});
