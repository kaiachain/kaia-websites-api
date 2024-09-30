let releaseConfig = require("./releaseConfig.js");

const machineTypes = [
  {
    machineType: "rpm",
    default: true,
    binaryBaseUrls: releaseConfig.binaryBaseUrls,
    gitBaseUrls: releaseConfig.gitBaseUrls,
    config: [
      {
        binaryTitle: "FOR KAIA MAINNET",
        binaryNames: ["kcnd", "kpnd", "kend"],
        binaryFileFormat: "{BINARY_NAME}-{TAG_NAME}-0.el7.{ARCH_TYPE}.rpm",
        baseUrl: "{BINARY_BASE_URL}{TAG_NAME}/{BINARY_FILE_FORMAT}",
        releaseLabel: {
          klaytn: "Cypress Mainnet",
          kaia: "Kaia Mainnet",
        },
        releaseNameFormat: "{BINARY_LABEL} {BINARY_NAME} {TAG_NAME}",
      },
      {
        binaryTitle: "FOR KAIROS TESTNET",
        binaryPrefixes: {
          kaia: "kairos",
          klaytn: "baobab",
        },
        binaryNames: ["kcnd", "kpnd", "kend"],
        binaryFileFormat:
          "{BINARY_NAME}-{BINARY_PREFIX}-{TAG_NAME}-0.el7.{ARCH_TYPE}.rpm",
        baseUrl: "{BINARY_BASE_URL}{TAG_NAME}/{BINARY_FILE_FORMAT}",
        releaseLabel: {
          klaytn: "Baobab Testnet",
          kaia: "Kairos Testnet",
        },
        releaseNameFormat: "{BINARY_LABEL} {BINARY_NAME} {TAG_NAME}",
      },
      {
        binaryTitle: "FOR SERVICE PACKAGES",
        binaryNames: ["kscnd", "kspnd", "ksend"],
        binaryFileFormat: "{BINARY_NAME}-{TAG_NAME}-0.el7.{ARCH_TYPE}.rpm",
        baseUrl: "{BINARY_BASE_URL}{TAG_NAME}/{BINARY_FILE_FORMAT}",
        releaseLabel: {
          klaytn: "Service",
          kaia: "Service",
        },
        releaseNameFormat: "{BINARY_LABEL} {BINARY_NAME} {TAG_NAME}",
      },
      {
        binaryTitle: "FOR COMMON PACKAGES",
        binaryNames: ["kbnd", "kgen", "homi"],
        binaryFileFormat: "{BINARY_NAME}-{TAG_NAME}-0.el7.{ARCH_TYPE}.rpm",
        baseUrl: "{BINARY_BASE_URL}{TAG_NAME}/{BINARY_FILE_FORMAT}",
        releaseLabel: {
          klaytn: "Common",
          kaia: "Common",
        },
        releaseNameFormat: "{BINARY_LABEL} {BINARY_NAME} {TAG_NAME}",
      },
    ],
  },
  {
    machineType: "linux",
    default: false,
    binaryBaseUrls: releaseConfig.binaryBaseUrls,
    gitBaseUrls: releaseConfig.gitBaseUrls,
    config: [
      {
        binaryTitle: "FOR KAIA MAINNET",
        binaryNames: ["kcn", "kpn", "ken"],
        binaryFileFormat: "{BINARY_NAME}-{TAG_NAME}-0-{ARCH_TYPE}.tar.gz",
        baseUrl: "{BINARY_BASE_URL}{TAG_NAME}/{BINARY_FILE_FORMAT}",
        releaseLabel: {
          klaytn: "Cypress Mainnet",
          kaia: "Kaia Mainnet",
        },
        releaseNameFormat: "{BINARY_LABEL} {BINARY_NAME} {TAG_NAME}",
      },
      {
        binaryTitle: "FOR KAIROS TESTNET",
        binaryPrefixes: {
          kaia: "kairos",
          klaytn: "baobab",
        },
        binaryNames: ["kcn", "kpn", "ken"],
        binaryFileFormat:
          "{BINARY_NAME}-{BINARY_PREFIX}-{TAG_NAME}-0-{ARCH_TYPE}.tar.gz",
        baseUrl: "{BINARY_BASE_URL}{TAG_NAME}/{BINARY_FILE_FORMAT}",
        releaseLabel: {
          klaytn: "Baobab Testnet",
          kaia: "Kairos Testnet",
        },
        releaseNameFormat: "{BINARY_LABEL} {BINARY_NAME} {TAG_NAME}",
      },
      {
        binaryTitle: "FOR SERVICE PACKAGES",
        binaryNames: ["kscn", "kspn", "ksen"],
        binaryFileFormat: "{BINARY_NAME}-{TAG_NAME}-0-{ARCH_TYPE}.tar.gz",
        baseUrl: "{BINARY_BASE_URL}{TAG_NAME}/{BINARY_FILE_FORMAT}",
        releaseLabel: {
          klaytn: "Service",
          kaia: "Service",
        },
        releaseNameFormat: "{BINARY_LABEL} {BINARY_NAME} {TAG_NAME}",
      },
      {
        binaryTitle: "FOR COMMON PACKAGES",
        binaryNames: ["kbn", "kgen", "homi"],
        binaryFileFormat: "{BINARY_NAME}-{TAG_NAME}-0-{ARCH_TYPE}.tar.gz",
        baseUrl: "{BINARY_BASE_URL}{TAG_NAME}/{BINARY_FILE_FORMAT}",
        releaseLabel: {
          klaytn: "Common",
          kaia: "Common",
        },
        releaseNameFormat: "{BINARY_LABEL} {BINARY_NAME} {TAG_NAME}",
      },
    ],
  },
  {
    machineType: "macos",
    default: false,
    binaryBaseUrls: releaseConfig.binaryBaseUrls,
    gitBaseUrls: releaseConfig.gitBaseUrls,
    config: [
      {
        binaryTitle: "FOR KAIA MAINNET",
        binaryNames: ["kcn", "kpn", "ken"],
        binaryVersion: {
          klaytn: "darwin-10.10-amd64",
          kaia: "darwin-arm64",
        },
        binaryFileFormat: "{BINARY_NAME}-{TAG_NAME}-0-{BINARY_VERSION}.tar.gz",
        baseUrl: "{BINARY_BASE_URL}{TAG_NAME}/{BINARY_FILE_FORMAT}",
        releaseLabel: {
          klaytn: "Cypress Mainnet",
          kaia: "Kaia Mainnet",
        },
        releaseNameFormat: "{BINARY_LABEL} {BINARY_NAME} {TAG_NAME}",
      },
      {
        binaryTitle: "FOR KAIROS TESTNET",
        binaryPrefixes: {
          kaia: "kairos",
          klaytn: "baobab",
        },
        binaryNames: ["kcn", "kpn", "ken"],
        binaryVersion: {
          klaytn: "darwin-10.10-amd64",
          kaia: "darwin-arm64",
        },
        binaryFileFormat:
          "{BINARY_NAME}-{BINARY_PREFIX}-{TAG_NAME}-0-{BINARY_VERSION}.tar.gz",
        baseUrl: "{BINARY_BASE_URL}{TAG_NAME}/{BINARY_FILE_FORMAT}",
        releaseLabel: {
          klaytn: "Baobab Testnet",
          kaia: "Kairos Testnet",
        },
        releaseNameFormat: "{BINARY_LABEL} {BINARY_NAME} {TAG_NAME}",
      },
      {
        binaryTitle: "FOR SERVICE PACKAGES",
        binaryNames: ["kscn", "kspn", "ksen"],
        binaryVersion: {
          klaytn: "darwin-10.10-amd64",
          kaia: "darwin-arm64",
        },
        binaryFileFormat: "{BINARY_NAME}-{TAG_NAME}-0-{BINARY_VERSION}.tar.gz",
        baseUrl: "{BINARY_BASE_URL}{TAG_NAME}/{BINARY_FILE_FORMAT}",
        releaseLabel: {
          klaytn: "Service",
          kaia: "Service",
        },
        releaseNameFormat: "{BINARY_LABEL} {BINARY_NAME} {TAG_NAME}",
      },
      {
        binaryTitle: "FOR COMMON PACKAGES",
        binaryNames: ["kbn", "kgen", "homi"],
        binaryVersion: {
          klaytn: "darwin-10.10-amd64",
          kaia: "darwin-arm64",
        },
        binaryFileFormat: "{BINARY_NAME}-{TAG_NAME}-0-{BINARY_VERSION}.tar.gz",
        baseUrl: "{BINARY_BASE_URL}{TAG_NAME}/{BINARY_FILE_FORMAT}",
        releaseLabel: {
          klaytn: "Common",
          kaia: "Common",
        },
        releaseNameFormat: "{BINARY_LABEL} {BINARY_NAME} {TAG_NAME}",
      },
    ],
  },
  {
    machineType: "windows",
    default: false,
    binaryBaseUrls: {
      kaia: "#",
      klaytn: "#",
    },
    gitBaseUrls: {
      kaia: "https://github.com/kaiachain/kaia",
      klaytn: "https://github.com/klaytn/klaytn",
    },
    config: [
      {
        binaryTitle: "Not supported yet",
        binaryFileFormat: "",
        baseUrl: "",
      },
    ],
  },
  {
    machineType: "docker",
    default: false,
    binaryBaseUrls: {
      kaia: "https://hub.docker.com/r/",
      klaytn: "https://hub.docker.com/r/",
    },
    gitBaseUrls: releaseConfig.gitBaseUrls,
    config: [
      {
        binaryTitle: "Docker",
        binaryPrefixes: {
          kaia: "kaiachain/kaia",
          klaytn: "klaytn/klaytn",
        },
        binaryNames: ["docker"],
        binaryFileFormat: "{BINARY_PREFIX}:{TAG_NAME}",
        baseUrl: "{BINARY_BASE_URL}{BINARY_PREFIX}",
        releaseLabel: {
          klaytn: "DockerHub",
          kaia: "DockerHub",
        },
        releaseNameFormat: "{BINARY_LABEL} {BINARY_NAME} {TAG_NAME}",
      },
    ],
  },
];

module.exports = machineTypes;
