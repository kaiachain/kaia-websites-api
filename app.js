var express = require("express");
var app = express();
const fetch = require("node-fetch");

const cors = require("cors");
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  })
);

var StatsData = {};
const { DuneClient } = require("@duneanalytics/client-sdk");
require("dotenv").config();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false }));

const partnerService = require("./services/partner.js");
const kaiachainService = require("./services/kaiachainService.js");
const faucetService = require('./services/faucetService.js');

const duneClient = new DuneClient(
  process.env.DUNE_API
);

const COIN_GECKO_URL =
  process.env.COIN_GECKO_BASE_URL +
  process.env.COINGECKO_API_KEY +
  process.env.COIN_GECKO_POSTFIX;

app.get("/analytics", async function (req, res) {
  return res.status(200).json({ success: true, data: StatsData });
});

app.get("/health", async function (req, res) {
  return res.status(200).json({ success: true });
});

app.get("/faucet/balance", async function (req, res) {
  try {
    const address = req.query.address || "";
    const tokenTicker = req.query.tokenTicker || "KAIA";

    if (!address) {
      throw new Error("Address is required");
    }

    const results = await faucetService.getBalance(address, tokenTicker);
    return res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.log(err.message);
    return res.status(400).json({
      success: false,
      message: err.message,
      data: {},
    });
  }
});

app.get("/faucet/config", async (req, res) => {
  try {
    const results = await faucetService.getFaucetConfig();
    console.log("Faucet config:", results); 
    return res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/faucet/run", async function (req, res) {
  try {
    const { address, recaptcha: _gReCaptchaToken, tokenTicker = "KAIA" } = req.body;
    if(!address) {
      throw new Error("Address is required")
    }
    let results = await faucetService.runFaucet(address, _gReCaptchaToken, tokenTicker);
    return res.status(200).json({ success: true, data: results})
  } catch(err) {
    console.log(err.message);
    return res.status(200).json({ success: false, message: err.message });
  }
});

app.get('/node/releases', async (req, res) => {
  try {
      let start = parseInt(req.query.start || "0");
      let results = await kaiachainService.getKaiaNodeReleasesCache(start);
      return res.status(200).json({success: true, data: results});
  } catch(err) {
      console.log(err.message);
      return res.status(404).json({success: false, message: err.message})
  }
});

app.get('/partners', async (req, res) => {
  try {
    console.log('Partners API called - fetching all partners');
    
    const results = await partnerService.fetchPartnersData();
    
    return res.status(200).json({
      success: true, 
      data: results
    });
  } catch(err) {
    console.log(err.message);
    return res.status(500).json({success: false, message: err.message});
  }
});

app.get("/*", async function (req, res) {
  return res.status(200).json({ success: true, message: 'Kaia Websites API' });
});

const loadCoingeckoData = (_dataElement) => {
  const options = { method: "GET", headers: { accept: "application/json" } };
  fetch(COIN_GECKO_URL, options)
    .then((res) => res.json())
    .then((json) => {
      if (json && json.length > 0) {
        StatsData[_dataElement] = json[0].market_cap;
        console.log("Updated marketcap: " + json[0].market_cap);
      }
    })
    .catch((err) => console.error("error:" + err));
};

const init = () => {
  duneClient.getLatestResult({ queryId: 5271299 }).then((result) => {
    if(result?.result?.rows?.length > 0) {
      StatsData["active_wallets"] = result?.result?.rows[0]?.active_wallets;
      console.log("Updated active_wallets: " + StatsData["active_wallets"]);
    }
  }).catch((err) => {
    console.log(err);
  });

  duneClient.getLatestResult({ queryId: 5271306 }).then((result) => {
    if(result?.result?.rows?.length > 0) {
      StatsData["total_transactions"] = result?.result?.rows[0]?.total_transactions;
      console.log("Updated total_transactions: " + StatsData["total_transactions"]);
    }
  }).catch((err) => {
    console.log(err);
  });

  duneClient.getLatestResult({ queryId: 5265651 }).then((result) => {
    if(result?.result?.rows?.length > 0) {
      StatsData["active_contract_count"] = result?.result?.rows[0]?.unique_active_contracts;
      console.log("Updated active_contract_count: " + StatsData["active_contract_count"]);
    }
  }).catch((err) => {
    console.log(err);
  });
  loadCoingeckoData("marketcap");
};

setInterval(() => {
  try {
    init();
  } catch (err) {
    console.log(err);
  }
}, parseInt(process.env.JOB_INTERVAL));

try {
  init();
} catch (err) {
  console.log(err);
}

setInterval(() => {
  kaiachainService.getKaiaNodeReleases();
}, 10*60*1000);
kaiachainService.getKaiaNodeReleases();

console.log("Listening on 3000");
app.listen(3000);
