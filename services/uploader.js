const aws = require('aws-sdk');

const { CELLAR } = require('../config');

// set the keys
aws.config.update({
  accessKeyId: CELLAR.KEY_ID,
  secretAccessKey: CELLAR.KEY_SECRET,
});

const s3 = new aws.S3({ endpoint: new aws.Endpoint(CELLAR.HOST) });

s3.listBuckets((err, res) => console.log(err, res));

/* In order to share access to access non-public files via HTTP, you need to get a presigned url for a specific key
 * the example above present a 'getObject' presigned URL. If you want to put a object in the bucket via HTTP,
 * you'll need to use 'putObject' instead.
 * see doc : http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getSignedUrl-property
 */
s3.getSignedUrl('getObject', { Bucket: '<YouBucket>', Key: '<YourKey>' });
