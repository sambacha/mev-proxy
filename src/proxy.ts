/**
 * @file Proxy
 * @version 0.1.0
 * @summary A simple server that proxies only specific methods to an Ethereum JSON-RPC
 */
const express = require('express');

const bodyParser = require('body-parser');

const request = require('request');

const _ = require('lodash');

/** @const ALLOWED_METHODS  */
const ALLOWED_METHODS = ['eth_sendBundle'];

function help() {
  console.log('node ./miner/proxy.js [PUBLIC_PORT] [GETH_PORT] [GETH_URL]');
}

function validPort(port: number) {
  if (isNaN(port) || port < 0 || port > 65535) {
    return false;
  }

  return true;
}

if (_.includes(process.argv, '-h') || _.includes(process.argv, '--help')) {
  help();

  process.exit(0);
}

/** @const PUBLIC_PORT  */
const PUBLIC_PORT = parseInt(_.get(process.argv, '[2]', '18545'));
/** @const GETH_PORT  */
const GETH_PORT = parseInt(_.get(process.argv, '[3]', '8545'));
/** @const GETH_URL  */
const GETH_URL = _.get(process.argv, '[4]', 'http://localhost');

if (!validPort(PUBLIC_PORT)) {
  console.error(`Invalid port specified for PUBLIC_PORT: ${PUBLIC_PORT}`);

  process.exit(1);
}
if (!validPort(GETH_PORT)) {
  console.error(`Invalid port specified for GETH_PORT: ${GETH_PORT}`);

  process.exit(1);
}

const app = express();
app.use(bodyParser.json());

app.use(function (
  req: { body: { method: any } },
  res: { writeHead: (arg0: number) => void; end: (arg0: string) => void },
) {
  if (!req.body) {
    res.writeHead(400);
    res.end('Invalid json body');
    return;
  }
  if (!req.body.method) {
    res.writeHead(400);
    res.end('missing method');
    return;
  }
  if (!_.includes(ALLOWED_METHODS, req.body.method)) {
    res.writeHead(400);
    res.end(
      `Invalid method, only ${ALLOWED_METHODS} supported, you provided: ${req.body.method}`,
    );
    return;
  }

  request
    .post({
      url: `${GETH_URL}:${GETH_PORT}`,
      body: JSON.stringify(req.body),
      headers: { 'Content-Type': 'application/json' },
    })
    .on('error', function (e: any) {
      res.writeHead(500);
      res.end(`ERROR in proxy: ${e}`);
    })
    .pipe(res);
});

app.listen(PUBLIC_PORT, () => {
  console.log(
    `proxy listening at ${PUBLIC_PORT} and forwarding to ${GETH_URL}:${GETH_PORT}`,
  );
});
/** @exports proxy */
