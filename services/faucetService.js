const {
  KlaytnWeb3,
  TxType,
  toPeb,
  formatUnits,
  parseUnits,
} = require("@kaiachain/web3js-ext");
const { Web3 } = require("web3");
const fetch = require("node-fetch");
const ERC20_ABI = require("../abis/erc20Abi");

global.faucetCache = {};
let service = {};

const provider = new Web3.providers.HttpProvider(process.env.KAIROS_RPC_URL);
const web3 = new KlaytnWeb3(provider);

const validateRecaptchaV2 = async (_gReCaptchaToken) => {
  let reCaptchaRes = await fetch(
    "https://www.google.com/recaptcha/api/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${process.env.FAUCET_RECAPTCHA_SECRET}&response=${_gReCaptchaToken}`,
    }
  ).then((reCaptchaRes) => reCaptchaRes.json());

  console.log(reCaptchaRes);
  if (!(reCaptchaRes && reCaptchaRes.success)) {
    throw new Error("Invalid Recaptcha");
  }
};

async function clearOldCache() {
  let entries = Object.entries(global.faucetCache);
  for (let i = 0; i < entries.length; i++) {
    let item = entries[i];
    if (item[1])
      if (Date.now() - 86400000 > item[1]) {
        delete global.faucetCache[item[0]];
      }
  }
}

function isValidClaim(_address, _tokenTicker) {
  _address = _address.toLowerCase();
  let lastRegisteredTime = global.faucetCache[_address + _tokenTicker] || 0;
  return Date.now() - 86400000 > lastRegisteredTime;
}

async function getBalanceByConfig(_address, tokenConfig) {
  if (tokenConfig.type === "native") {
    const raw = await web3.eth.getBalance(_address);
    return web3.utils.fromWei(raw, "ether");
  } else {
    const token = new web3.eth.Contract(ERC20_ABI, tokenConfig.address);
    const decimals = await token.methods.decimals().call();
    const raw = await token.methods.balanceOf(_address).call();
    return formatUnits(raw, decimals);
  }
}

service.getBalance = async (_address, _tokenTicker = "KAIA") => {
  clearOldCache();
  if (!web3.utils.isAddress(_address)) throw new Error("Not valid Address");

  const tokens = await service.getFaucetConfig();
  const tokenConfig = tokens.find((t) => t.tokenTicker === _tokenTicker);
  if (!tokenConfig) throw new Error("Token not configured in faucet");

  const balance = await getBalanceByConfig(_address, tokenConfig);
  return { token: _tokenTicker, balance };
};

service.getFaucetConfig = async () => {
  try {
    const tokens = [
      {
        tokenId: 1,
        tokenTicker: "KAIA",
        type: "native",
        limit: "50",
      },
      {
        tokenId: 2,
        tokenTicker: "USDT",
        type: "erc20",
        limit: "10",
        address: "0xd077a400968890eacc75cdc901f0356c943e4fdb",
      },
    ];
    return tokens;
  } catch (err) {
    console.log("Error in getFaucetConfig:", err.message);
    throw err;
  }
};

service.runFaucet = async (
  _address,
  _gReCaptchaToken,
  _tokenTicker = "KAIA"
) => {
  try {
    await validateRecaptchaV2(_gReCaptchaToken);

    let isAddress = web3.utils.isAddress(_address);
    if (!isAddress) throw new Error("Not valid Address");
    _address = _address.toLowerCase();
    const tokens = await service.getFaucetConfig();
    const tokenConfig = tokens.find((t) => t.tokenTicker === _tokenTicker);
    if (!tokenConfig) throw new Error("Token not configured in faucet");
    if (!isValidClaim(_address, tokenConfig.tokenTicker)) throw new Error("Already claimed");
    let txnHash;
    const senderAccount = web3.eth.accounts.privateKeyToAccount(
      process.env.FAUCET_PRIVATE_KEY
    );
    if (tokenConfig.type === "native") {
      const tx = {
        type: TxType.ValueTransfer,
        from: process.env.FAUCET_PUBLIC_KEY,
        to: _address,
        value: toPeb(tokenConfig.limit, "KLAY"),
      };
      const signResult = await senderAccount.signTransaction(tx);
      const receipt = await web3.eth.sendSignedTransaction(
        signResult.rawTransaction
      );
      txnHash = receipt.transactionHash;
    } else if (tokenConfig.type === "erc20") {
      const token = new web3.eth.Contract(ERC20_ABI, tokenConfig.address);
      const tokenDecimals = parseInt(await token.methods.decimals().call());
      const limitToken = tokenConfig.limit;
      const amount = parseUnits(limitToken, tokenDecimals);

      const data = token.methods.transfer(_address, amount.toString()).encodeABI();

      let tx = {
        from: process.env.FAUCET_PUBLIC_KEY,
        to: tokenConfig.address,
        data,
      };

      const gas = await web3.eth.estimateGas(tx);
      tx.gas = Math.floor(parseInt(gas) * 1.2);
      const gasPrice = await web3.eth.getGasPrice();
      tx.gasPrice = gasPrice;

      const signResult = await senderAccount.signTransaction(tx);
      const receipt = await web3.eth.sendSignedTransaction(
        signResult.rawTransaction
      );
      txnHash = receipt.transactionHash;
    }

    global.faucetCache[_address + tokenConfig.tokenTicker] = Date.now();
    const balance = await getBalanceByConfig(_address, tokenConfig);
    return { balance, txnHash };
  } catch (err) {
    console.error("runFaucet error:", err.message);
    throw new Error(err.message || "Problem while claiming");
  }
};

module.exports = service;
