import * as aws from '@pulumi/aws';
import { zones } from '$aws/route53';
import { securityGroups, subnets } from '$aws/vpc';

const subnetGroup = new aws.elasticache.SubnetGroup('private', {
  name: 'private',
  subnetIds: [subnets.private.az1.id, subnets.private.az2.id],
});

const cluster = new aws.elasticache.ReplicationGroup('readable', {
  replicationGroupId: 'readable',
  description: 'Redis cluster',

  engine: 'redis',
  engineVersion: '7.1',

  nodeType: 'cache.t4g.micro',
  numCacheClusters: 1,

  subnetGroupName: subnetGroup.name,
  securityGroupIds: [securityGroups.internal.id],

  multiAzEnabled: false,
  automaticFailoverEnabled: false,

  atRestEncryptionEnabled: true,
  transitEncryptionEnabled: false,

  snapshotRetentionLimit: 7,
  finalSnapshotIdentifier: 'readable-final-snapshot',

  snapshotWindow: '19:00-20:00',
  maintenanceWindow: 'sun:20:00-sun:22:00',

  applyImmediately: true,
});

new aws.route53.Record('redis.rdbl.app', {
  zoneId: zones.rdbl_app.zoneId,
  type: 'CNAME',
  name: 'redis.rdbl.app',
  records: [cluster.primaryEndpointAddress],
  ttl: 300,
});
