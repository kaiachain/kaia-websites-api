let config = {
    archTypes : ["amd64", "arm64"],
    archTypesData: {
        "rpm": {
            "amd64": "x86_64",
            "arm64": "aarch64"
        },
        "linux": {
            "amd64": "linux-amd64",
            "arm64": "linux-arm64"
        }
        
    },
    gitBaseUrls: {
      "kaia": "https://github.com/kaiachain/kaia/",
      "klaytn": 'https://github.com/klaytn/klaytn/'
    },
    binaryBaseUrls: {
      "kaia": "https://packages.kaia.io/kaia/",
      "klaytn": 'https://packages.kaia.io/klaytn/'
    },
  }
  
  module.exports = config;
  