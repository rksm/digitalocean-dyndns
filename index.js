#!/usr/bin/env node
var request = require("request");
var fs = require("fs");
var figlet = require("figlet");

function getIP(v4) {
  const url = v4 ? "http://ip4.iurl.no" : "http://ip6.iurl.no";
  return new Promise((resolve, reject) => request(
    {
      url,
      method: "GET",
      headers: { "Content-Type": "application/text" }
    },
    (error, response, body) => error ? reject(error) : resolve(body)));
}

function updateIP(newIP, domain, API_KEY, domainid) {
  return new Promise((resolve, reject) => request(
    {
      url: "https://api.digitalocean.com/v2/domains/" + domain + "/records/" + domainid,
      qs: { data: newIP },
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + API_KEY
      }
    },
    (error, response, body) => error ? reject(error) : resolve()));
}

function getServerIP(config, i) {
  return new Promise((resolve, reject) => request(
    {
      url:
        "https://api.digitalocean.com/v2/domains/" +
        config.domains[i].name +
        "/records/" +
        config.domains[i].id,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + config.api_key
      }
    },
    (error, response, body) => {
      if (error) return reject(error);
      try {
        var data = JSON.parse(body);
        remoteIP = [data.domain_record.type, data.domain_record.data];
        resolve(remoteIP);
      } catch (error) {
        reject(error);
      }
    }
  ));
}

function getDomainInfo(config) {
  return new Promise((resolve, reject) => request(
    {
      url: "https://api.digitalocean.com/v2/domains/" + config.domains[0].name + "/records/",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + config.api_key
      }
    },
    (error, response, body) => error ? reject(error) : resolve(body)));
}

function showHelp() {
  console.log(
    figlet.textSync("dynDNS", {
      horizontalLayout: "default",
      verticalLayout: "default"
    })
  );
  console.log(
    "\r\ndynDNS updates your Digital Ocean DNS record with your local (public) IPv4 and IPv6"
  );
  console.log("Usage :");
  console.log('dyndns --config "/path/to/file/config.json"');
  console.log(
    "\r\nOptions : \r\n         -h or --help          Show this help"
  );
  console.log("         -l or --list          Lists subdomains");
  console.log("         -ip6                  Include IPv6 when updating");
  console.log('\r\nExample: dyndns --config "/home/testuser/config.json" -ip6');
}

async function main() {
  var args = process.argv, includeIP6 = false, IP6, updated = false;

  if (process.argv.indexOf("-h") != -1 || process.argv.indexOf("--help") != -1) {
    showHelp();
    process.exit();
  }

  try {
    var configFileId = process.argv.indexOf("--config");
    var config = JSON.parse(fs.readFileSync(process.argv[configFileId + 1], "utf8"));
  } catch (error) {
    if (configFileId === -1) {
      console.error(new Date() + " Missing --config parameter.");
    } else {
      console.error(new Date() + " Error reading cofig file. File either missing or malformed.");
    }
    process.exit(1);
  }

  if (process.argv.indexOf("--list") !== -1 || process.argv.indexOf("-l") !== -1) {
    try {
      var domainInfo = JSON.parse(await getDomainInfo(config));
      console.dir(domainInfo, { depth: null, colors: true });
      process.exit();
    } catch (err) {
      console.error(new Date() + " Error getting domaininfo " + error.code);
      process.exit(1);
    }
  }

  if (process.argv.indexOf("-ip6") !== -1) {
    try {
      IP6 = await getIP(false);
    } catch (err) {
      console.error(new Date() + " Error getting IPv6 " + error.code + " (" + error.host + ")");
      process.exit(1);
    }
    includeIP6 = true;
  }

  try {
    var IP4 = await getIP(true);
  } catch (err) {
    console.log(new Date() + " Error getting IP " + error.code + " (" + error.host + ")");
    process.exit(1);
  }

  for (var i = 0; i < config.domains.length; i++) {
    try {
      var dnsIP = await getServerIP(config, i);
    } catch (err) {
      console.error("Error getting server IP", err);
      process.exit(1);
    }

    if (dnsIP[0] === "A" && IP4.localeCompare(dnsIP[1]) != 0) {
      updated = true;
      try {
        await updateIP(
          IP4,
          config.domains[i].name,
          config.api_key,
          config.domains[i].id);
      } catch (err) {
        console.log(new Date() + " Error uppdating IP " + error.code);
        process.exit(1);
      }
      console.log(new Date() + " Updated IP to " + IP4);

      if (includeIP6 && dnsIP[0] === "AAAA" && IP6.localeCompare(dnsIP[1]) != 0) {
        updated = true;
        await updateIP(
          IP6,
          config.domains[i].name,
          config.api_key,
          config.domains[i].id);
        console.log(new Date() + " Updated IPv6 to " + IP6);
      }
    }
  }
  if (!updated) console.log("[" + new Date() + "] IP not updated.");
  process.exit();
}

main().catch(err => { console.error(err); process.exit(2); });
