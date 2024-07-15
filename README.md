# Kaia Websites API

This is the backend API for https://kaia.io.

## Run as native application

### Server build and start
```
$ git clone https://github.com/kaiachain/kaia-websites-api.git
$ cd kaia-websites-api
$ cp .env.example .env // Configure API keys
$ npm install
$ npm start
```

### Test endpoints
```
$ curl http://localhost:3000/health
$ curl http://localhost:3000/analytics

Response Structure : {"success":true,"data":{"marketcap":559142317,"active_wallets":3522410,"total_transactions":32737945,"active_contract_count":28943}}
Total Marketcap in USD from https://www.coingecko.com/en/coins/klaytn#markets
ActiveWallets,TotalTransactions,ActiveContractCount are records per month
```