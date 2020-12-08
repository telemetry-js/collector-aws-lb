'use strict'

const single = require('@telemetry-js/metric').single
const AWS = require('aws-sdk')
const EventEmitter = require('events').EventEmitter

module.exports = function (options) {
  return new NodeCollector(options)
}

class NodeCollector extends EventEmitter {
  constructor (options) {
    if (!options) options = {}
    super()

    if (!options.region) {
      throw new TypeError('The "region" option is required')
    } else if (typeof options.region !== 'string') {
      throw new TypeError('The "region" option must be a string')
    } else if (options.names && !Array.isArray(options.names)) {
      throw new TypeError('The "names" option must be an array')
    }

    this.region = options.region
    this.names = options.names ? new Set(options.names) : null
    this.ec2 = new AWS.EC2({ region: this.region, apiVersion: '2016-11-15' })
  }

  ping (callback) {
    const Filters = [{ Name: 'requester-id', Values: ['amazon-elb'] }]
    const grouped = new Map()

    this.ec2.describeNetworkInterfaces({ Filters }, (err, data) => {
      if (err) return callback(err)

      for (const eni of data.NetworkInterfaces) {
        const { name, type } = extractName(eni.Description)

        if (!name || !type) continue
        if (this.names !== null && !this.names.has(name)) continue

        const state = eni.Status || '-'
        const az = eni.AvailabilityZone[eni.AvailabilityZone.length - 1] // E.g. us-east-1d
        const vpc = eni.VpcId || '-'
        const key = [this.region, name, type, state, az, vpc].join('~')

        if (!grouped.has(key)) {
          const tags = { region: this.region, name, type, state, az, vpc }
          const opts = { unit: 'count', tags, value: 1 }

          grouped.set(key, opts)
        } else {
          grouped.get(key).value++
        }
      }

      for (const opts of grouped.values()) {
        this.emit('metric', single('telemetry.aws.lb.nodes.count', opts))
      }

      callback()
    })
  }
}

function extractName (description) {
  const name = description.replace(/^ELB /, '')

  if (name === description) {
    return { name: null, type: null }
  }

  // Remove ALB/NLB prefix and suffix, e.g. app/<name>/<id>
  const a = name.split('/')
  if (a.length >= 2 && a[0] === 'app') return { name: a[1], type: 'application' }
  if (a.length >= 2 && a[0] === 'net') return { name: a[1], type: 'network' }

  return { name, type: 'classic' }
}
