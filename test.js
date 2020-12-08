'use strict'

const test = require('tape')
const proxyquire = require('proxyquire')
const fixture = require('./fixture.json')
const mocks = []

const collector = proxyquire('.', {
  'aws-sdk': {
    EC2: function (...args) {
      return mocks.shift()(...args)
    }
  }
})

test('basic', function (t) {
  t.plan(4)

  mocks.push(function (opts) {
    t.same(opts, { region: 'us-west-2', apiVersion: '2016-11-15' })

    return {
      describeNetworkInterfaces: function (params, callback) {
        t.same(params, {
          Filters: [{ Name: 'requester-id', Values: ['amazon-elb'] }]
        })

        process.nextTick(callback, null, fixture)
      }
    }
  })

  const c = collector({ region: 'us-west-2' })
  const metrics = []

  c.on('metric', metrics.push.bind(metrics))

  c.ping((err) => {
    t.ifError(err, 'no ping error')
    t.same(metrics.map(simplify), [
      {
        name: 'telemetry.aws.lb.nodes.count',
        unit: 'count',
        resolution: 60,
        tags: {
          region: 'us-west-2',
          name: 'load-balancer-one',
          type: 'application',
          state: 'in-use',
          az: 'a',
          vpc: 'vpc-1'
        },
        value: 2
      },
      {
        name: 'telemetry.aws.lb.nodes.count',
        unit: 'count',
        resolution: 60,
        tags: {
          region: 'us-west-2',
          name: 'load-balancer-two',
          type: 'classic',
          state: 'in-use',
          az: 'a',
          vpc: 'vpc-2'
        },
        value: 1
      },
      {
        name: 'telemetry.aws.lb.nodes.count',
        unit: 'count',
        resolution: 60,
        tags: {
          region: 'us-west-2',
          name: 'load-balancer-two',
          type: 'classic',
          state: 'in-use',
          az: 'b',
          vpc: 'vpc-2'
        },
        value: 2
      },
      {
        name: 'telemetry.aws.lb.nodes.count',
        unit: 'count',
        resolution: 60,
        tags: {
          region: 'us-west-2',
          name: 'load-balancer-three',
          type: 'classic',
          state: 'detaching',
          az: 'a',
          vpc: 'vpc-2'
        },
        value: 1
      },
      {
        name: 'telemetry.aws.lb.nodes.count',
        unit: 'count',
        resolution: 60,
        tags: {
          region: 'us-west-2',
          name: 'load-balancer-three',
          type: 'classic',
          state: 'in-use',
          az: 'a',
          vpc: 'vpc-2'
        },
        value: 1
      }
    ])
  })
})

test('filter by name', function (t) {
  t.plan(2)

  mocks.push(function (opts) {
    return {
      describeNetworkInterfaces: function (params, callback) {
        process.nextTick(callback, null, fixture)
      }
    }
  })

  const c = collector({ region: 'us-west-2', names: ['load-balancer-two'] })
  const metrics = []

  c.on('metric', metrics.push.bind(metrics))

  c.ping((err) => {
    t.ifError(err, 'no ping error')
    t.same(metrics.map(simplify), [
      {
        name: 'telemetry.aws.lb.nodes.count',
        unit: 'count',
        resolution: 60,
        tags: {
          region: 'us-west-2',
          name: 'load-balancer-two',
          type: 'classic',
          state: 'in-use',
          az: 'a',
          vpc: 'vpc-2'
        },
        value: 1
      },
      {
        name: 'telemetry.aws.lb.nodes.count',
        unit: 'count',
        resolution: 60,
        tags: {
          region: 'us-west-2',
          name: 'load-balancer-two',
          type: 'classic',
          state: 'in-use',
          az: 'b',
          vpc: 'vpc-2'
        },
        value: 2
      }
    ])
  })
})

function simplify (metric) {
  delete metric.date
  delete metric.statistic

  return metric
}
