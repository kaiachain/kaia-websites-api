let machineTypes = require("./machineTypes.js");
let klaytnReleases = require("./klaytnReleases.js");
let config = require("./releaseConfig.js");
global.releases = [];
let service = {};

service.getKaiaNodeReleases = async () => {
  let releases = await fetch(
    process.env.KAIACHAIN_GITHUB_API,
    {
      method: "GET",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: "Bearer "+process.env.KAIACHAIN_GITHUB_API_KEY,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  ).then((response) => response.json());
  releases = releases.map((_release) => ({
    tag_name: _release.tag_name,
    type: "kaia",
    created_at: _release.created_at,
  }));

  global.releases = [...releases, ...klaytnReleases];
  console.log("Updated Node Releases");
};

service.getKaiaNodeReleasesCache = async (start = 0, size = 10) => {
  return {
    releases: global.releases.slice(start, start + size),
    machineTypes,
    config,
  };
};

module.exports = service;
