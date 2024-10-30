const { KlaytnWeb3, TxType, toPeb } = require("@kaiachain/web3js-ext");
const { Web3 } = require("web3");

global.faucetCache = {};
let service = {};

const provider = new Web3.providers.HttpProvider(process.env.KAIROS_RPC_URL);
const web3 = new KlaytnWeb3(provider);

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

function isValidClaim(_address) {
  _address = _address.toLowerCase();
  let lastRegisteredTime = global.faucetCache[_address] || 0;
  return Date.now() - 86400000 > lastRegisteredTime;
}

service.getBalance = async (_address) => {
  let isAddress = web3.utils.isAddress(_address);
  clearOldCache();
  if (isAddress) {
    let balance = await web3.eth.getBalance(_address);
    console.log(balance);
    balance = web3.utils.fromWei(balance, "ether");
    return { balance };
  } else {
    throw new Error("Not valid Address");
  }
};

service.runFaucet = async (_address) => {
  try {
    let isAddress = web3.utils.isAddress(_address);
    if (isAddress) {
      _address = _address.toLowerCase();

      if (isValidClaim(_address)) {
        const senderAccount = web3.eth.accounts.privateKeyToAccount(
          process.env.FAUCET_PRIVATE_KEY
        );

        const tx = {
          type: TxType.ValueTransfer,
          from: process.env.FAUCET_PUBLIC_KEY,
          to: _address,
          value: toPeb(process.env.FAUCET_TRANSFER_VALUE, "KLAY"),
        };

        const signResult = await senderAccount.signTransaction(tx);
        console.log("rawTx", signResult.rawTransaction);

        const receipt = await web3.eth.sendSignedTransaction(
          signResult.rawTransaction
        );
        console.log(receipt);

        let balance = await web3.eth.getBalance(_address);
        balance = web3.utils.fromWei(balance, "ether");

        global.faucetCache[_address] = Date.now();

        return { balance, txnHash: receipt.transactionHash };
      } else {
        throw new Error("Already claimed");
      }
    } else {
      throw new Error("Not valid Address");
    }
  } catch (err) {
    console.log(err);
    throw new Error("Problem while claiming");
  }
};

module.exports = service;
