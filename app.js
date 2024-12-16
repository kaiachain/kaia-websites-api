var express = require("express");
var app = express();
const fetch = require("node-fetch");

var StatsData = {};
const { Flipside } = require("@flipsidecrypto/sdk");
require("dotenv").config();

require("./services/partner.js");
const kaiachainService = require("./services/kaiachainService.js");
const faucetService = require('./services/faucetService.js');

const flipside = new Flipside(
  process.env.FLIPSIDE_API_KEY,
  process.env.FLIPSIDE_API_URL
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
    let address = req.query.address || "";
    if(!address) {
      throw new Error("Address is required")
    }
    let results = await faucetService.getBalance(address);
    return res.status(200).json({ success: true, data: results})
  } catch(err) {
    console.log(err.message);
    return res.status(200).json({ success: false, message: err.message, data: {} });
  }
});

app.post("/faucet/run", async function (req, res) {
  try {
    let address = req.query.address || "";
    let _gReCaptchaToken = req.body.recaptcha || "";
    if(!address) {
      throw new Error("Address is required")
    }
    let results = await faucetService.runFaucet(address, _gReCaptchaToken);
    return res.status(200).json({ success: true, data: results})
  } catch(err) {
    console.log(err.message);
    return res.status(200).json({ success: false, message: err.message });
  }
});

app.get("/health", async function (req, res) {
  return res.status(200).json({ success: true });
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

app.get("/*", async function (req, res) {
  return res.status(200).json({ success: true, message: 'Kaia Websites API' });
});

const TRANSACTION_COUNT_SQL = `select count(distinct tx_hash) as total_transactions
    from kaia.core.fact_transactions
    where block_timestamp > current_date - INTERVAL '1 months'`;

const UNIQUE_ACTIVE_WALLETS_SQL = `select count(distinct from_address) as active_wallets
    from kaia.core.fact_transactions
    where block_timestamp > current_date - INTERVAL '1 months'`;

const UNIQUE_ACTIVE_CONTRACTS_SQL = `WITH from_addresses AS (
        SELECT DISTINCT from_address
        FROM kaia.core.fact_transactions
    ),
    to_addresses AS (
        SELECT DISTINCT to_address
        FROM kaia.core.fact_transactions
        WHERE block_timestamp > current_date - INTERVAL '1 months'
    ),
    active_contracts AS (
        SELECT to_address 
        FROM to_addresses
        WHERE to_address NOT IN (SELECT from_address FROM from_addresses)
    )
    SELECT COUNT(*) AS active_contract_count
    FROM active_contracts`;

const loadData = async (_query, _dataElement) => {
  try {
    const queryResultSetTxnCount = await flipside.query.run({ sql: _query });

    let results = await flipside.query.getQueryResults({
      queryRunId: queryResultSetTxnCount.queryId,
      pageNumber: 1,
      pageSize: 1,
    });
  
    if (results.error) {
      throw results.error;
    }
    if (results.records && results.records.length > 0) {
      StatsData[_dataElement] = results.records[0][_dataElement];
      console.log(`Updated ${_dataElement}: ` + results.records[0][_dataElement]);
    }
  } catch(err) {
    console.log("Error while fetching "+_dataElement)
    console.log(err);
  }

};

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
  loadData(TRANSACTION_COUNT_SQL, "total_transactions");
  loadData(UNIQUE_ACTIVE_WALLETS_SQL, "active_wallets");
  loadData(UNIQUE_ACTIVE_CONTRACTS_SQL, "active_contract_count");
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
