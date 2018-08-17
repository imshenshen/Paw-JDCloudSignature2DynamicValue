import URI from 'urijs'
const unsignableHeaders = ['authorization', 'user-agent']
const v2Identifier = 'jdcloud2_request'
const CryptoJS = require('crypto-js')
function uriEscape(string) {
  var output = encodeURIComponent(string)
  output = output.replace(/[^A-Za-z0-9_.~\-%]+/g, escape)

  // AWS percent-encodes some extra non-standard characters in a URI
  output = output.replace(/[*]/g, function(ch) {
    return (
      '%' +
      ch
        .charCodeAt(0)
        .toString(16)
        .toUpperCase()
    )
  })

  return output
}
function uriEscapePath(string) {
  var parts = []
  string.split('/').forEach(function(part) {
    parts.push(uriEscape(part))
  })
  return parts.join('/')
}
function queryParamsToString(params) {
  var items = []
  var escape = uriEscape
  var sortedKeys = Object.keys(params).sort()

  sortedKeys.forEach(function(name) {
    var value = params[name]
    var ename = escape(name)
    var result = ename + '='
    if (Array.isArray(value)) {
      var vals = []
      value.forEach(function(item) {
        vals.push(escape(item))
      })
      result = ename + '=' + vals.sort().join('&' + ename + '=')
    } else if (value !== undefined && value !== null) {
      result = ename + '=' + escape(value)
    }
    items.push(result)
  })

  return items.join('&')
}

function hash256(input) {
  var dv = DynamicValue('com.luckymarmot.HashDynamicValue', {
    input: input,
    hashType: 5, // SHA256
    encoding: 'Hexadecimal', // Hexadecimal
    uppercase: false // lower case
  })
  return dv.getEvaluatedString()
}

export default class Singer {
  constructor(context, config) {
    this.accessKeyId = config.accessKeyId
    this.secretAccessKey = config.secretAccessKey
    this.algorithm = config.algorithm
    this.context = context
    this.request = context.getCurrentRequest()
    this.uri = URI(this.request.url)
    this.datetime = this.request.getHeaderByName('x-jdcloud-date')
    this.regionId = config.regionId || 'cn-north-1'
    this.serviceName = config.serviceName || 'vm'
  }

  authorization() {
    let parts = []
    let credString = this.credentialString()
    parts.push(`${this.algorithm} Credential=${this.accessKeyId}/${credString}`)
    parts.push(`SignedHeaders=${this.signedHeaders()}`)
    parts.push(`Signature=${this.signature()}`)
    return parts.join(', ')
  }
  signedHeaders() {
    let keys = []
    for (let key in this.request.headers) {
      key = key.toLowerCase()
      if (this.isSignableHeader(key)) {
        keys.push(key)
      }
    }
    return keys.sort().join(';')
  }
  isSignableHeader(key) {
    key = key.toLowerCase()
    if (key.includes('x-jdcloud-')) {
      return true
    }
    return !unsignableHeaders.includes(key)
  }
  signature() {
    return CryptoJS.HmacSHA256(this.stringToSign(), this.getSigningKey())
  }
  stringToSign() {
    let parts = []
    parts.push(this.algorithm)
    parts.push(this.datetime)
    parts.push(this.credentialString())
    parts.push(hash256(this.canonicalString()))
    console.log('stringToSign is :', parts)
    return parts.join('\n')
  }
  canonicalString() {
    let parts = []
    parts.push(this.request.method)
    parts.push(uriEscapePath(this.uri.pathname()))
    parts.push(queryParamsToString(URI.parseQuery(this.request.urlQuery)))
    parts.push(this.canonicalHeaders() + '\n')
    parts.push(this.signedHeaders())
    parts.push(hash256(this.request.body || ''))
    let result = parts.join('\n')
    console.log('canonicalString is :', result)
    return result
  }
  canonicalHeaders() {
    let headers = []
    for (var headerName in this.request.headers) {
      headers.push([headerName, this.request.headers[headerName]])
    }
    headers.sort(function(a, b) {
      return a[0].toLowerCase() < b[0].toLowerCase() ? -1 : 1
    })
    let parts = []
    headers.forEach(item => {
      let key = item[0].toLowerCase()
      if (this.isSignableHeader(key)) {
        parts.push(
          `${key}:${item[1].replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '')}`
        )
      }
    })
    return parts.join('\n')
  }
  credentialString() {
    return this.createScope()
  }
  createScope() {
    return [
      this.datetime.substr(0, 8),
      this.regionId,
      this.serviceName,
      v2Identifier
    ].join('/')
  }
  getSigningKey() {
    let kDate = CryptoJS.HmacSHA256(
      this.datetime.substr(0, 8),
      `JDCLOUD2${this.secretAccessKey}`
    )
    let kRegion = CryptoJS.HmacSHA256(this.regionId, kDate)
    let kService = CryptoJS.HmacSHA256(this.serviceName, kRegion)
    let signingKey = CryptoJS.HmacSHA256(v2Identifier, kService)
    return signingKey
  }
}
