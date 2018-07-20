#!/usr/bin/env node

let clipboardy = require('clipboardy');
let express = require('express');
let freeportAsync = require('freeport-async');
let isobject = require('isobject');
let localIpV4AddressAsync = require('local-ipv4-address');
let ngrok = require('ngrok');

async function serveAsync(dir, opts) {
  if (isobject(dir)) {
    opts = dir;
    dir = null;
  }
  dir = dir || process.cwd();
  opts = opts || {};
  let port = opts.port || (await freeportAsync());
  let app = express();
  let log = (...args) => {
    console.log(...args);
  };
  if (opts.quiet) {
    log = () => {};
  }
  app.use(express.static(dir));
  await new Promise((resolve, reject) => {
    app.listen(port, () => {
      // log('Listening on port ' + port);
      resolve();
    });
  });

  let main = opts.main || '/main.lua';
  let localUrl = 'http://localhost:' + port + main;
  let lanIp = await localIpV4AddressAsync();
  let lanUrl = 'http://' + lanIp + ':' + port + main;
  let tunnelUrl = (await ngrok.connect(port)) + main;
  await clipboardy.write(lanUrl);

  // log('Listening on port ' + port + '\n');
  log(localUrl);
  log(lanUrl);
  log(tunnelUrl);

  return {
    app,
    port,
    url: {
      local: localUrl,
      lan: lanUrl,
      tunnel: tunnelUrl,
    },
  };
}

if (require.main === module) {
  serveAsync();
}

module.exports = serveAsync;