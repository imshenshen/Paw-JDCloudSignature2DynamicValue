import Singer from './singer.js'

@registerDynamicValueClass
class JDCloudAuthorization {
  static identifier = 'com.imshenshen.PawExtensions.JDCloudSignature2DynamicValue'
  static title = 'JDCloudAuthorization'

  static inputs = [
    DynamicValueInput('JDCLOUD_ACCESS_KEY_ID', 'accessKeyId', 'String'),
    DynamicValueInput(
      'JDCLOUD_SECRET_ACCESS_KEY',
      'secretAccessKey',
      'SecureValue'
    ),
    DynamicValueInput('regionId', 'JDCloud Region (cn-north-1)', 'String'),
    DynamicValueInput('serviceName', 'JDcloud Service (vm)', 'String')
  ]

  evaluate(context) {
    const auth = new Singer(context, {
      accessKeyId: this.JDCLOUD_ACCESS_KEY_ID,
      secretAccessKey: this.JDCLOUD_SECRET_ACCESS_KEY,
      algorithm: this.algorithm || 'JDCLOUD2-HMAC-SHA256',
      regionId: this.regionId,
      serviceName: this.servicename
    })
    return auth.authorization()
  }
}
