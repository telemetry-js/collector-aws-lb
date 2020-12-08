# collector-aws-lb

> **Collect a count of AWS LB nodes. For classic and application load balancers (PR welcome for network load balancers).**  
> A [`telemetry`](https://github.com/telemetry-js/telemetry) plugin.

[![npm status](http://img.shields.io/npm/v/telemetry-js/collector-aws-lb.svg)](https://www.npmjs.org/package/@telemetry-js/collector-aws-lb)
[![node](https://img.shields.io/node/v/@telemetry-js/collector-aws-lb.svg)](https://www.npmjs.org/package/@telemetry-js/collector-aws-lb)
[![Test](https://github.com/telemetry-js/collector-aws-lb/workflows/Test/badge.svg?branch=main)](https://github.com/telemetry-js/collector-aws-lb/actions)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Table of Contents

<details><summary>Click to expand</summary>

- [Usage](#usage)
- [API](#api)
  - [Options](#options)
- [Install](#install)
- [Acknowledgements](#acknowledgements)
- [License](#license)

</details>

## Usage

```js
const telemetry = require('@telemetry-js/telemetry')()
const lb = require('@telemetry-js/collector-aws-lb')

telemetry.task()
  .collect(lb, { region: 'us-east-1', names: ['my-load-balancer'] })
  .collect(lb, { region: 'us-west-2', names: ['other-load-balancer'] })
```

## API

### Options

- `region`: string, required.
- `names`: array of load balancers to include by name. If not specified, all load balancers (within the specified region) are included.

## Install

With [npm](https://npmjs.org) do:

```
npm install @telemetry-js/collector-aws-lb
```

## Acknowledgements

This project is kindly sponsored by [Reason Cybersecurity Inc](https://reasonsecurity.com).

[![reason logo](https://cdn.reasonsecurity.com/github-assets/reason_signature_logo.png)](https://reasonsecurity.com)

## License

[MIT](LICENSE) © Vincent Weevers
