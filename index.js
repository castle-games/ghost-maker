#!/usr/bin/env node

let clipboardy = require('clipboardy');
let express = require('express');
let freeportAsync = require('freeport-async');
let isobject = require('isobject');
let localIpV4AddressAsync = require('local-ipv4-address');
let ngrok = require('ngrok');
let path = require('path');

async function serveAsync(dir, opts) {
  if (isobject(dir)) {
    opts = dir;
    dir = null;
  }
  dir = dir || process.cwd();
  opts = opts || {};
  let port = opts.port || (await freeportAsync(8000));
  let app = express();
  let log = (...args) => {
    console.log(...args);
  };
  let logError = (...args) => {
    console.error(...args);
  };
  if (opts.quiet) {
    log = () => {};
    logError = () => {};
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
  await clipboardy.write(lanUrl);

  log('// ghost-maker serving ' + dir + ' on port ' + port);
  log(localUrl);
  log(lanUrl);
  let tunnelUrl;
  try {
    tunnelUrl = (await ngrok.connect(port)) + main;
    log(tunnelUrl);
  } catch (e) {
    logError("Couldn't start ngrok tunnel");
  }

  return {
    app,
    port,
    url: {
      local: localUrl,
      lan: lanUrl,
      tunnel: tunnelUrl,
    },
    dir: dir,
    main: main,
  };
}

if (require.main === module) {
  let dir = process.argv[2];
  dir = dir ? path.resolve(dir) : null;
  serveAsync(dir);
}

module.exports = serveAsync;
