const BigNumber = require('ethers').BigNumber;

const bigMin = (a, b) => {
  if (a.lte(b)) return a;
  else return b;
};

const randomBigNum = (base, max, min) => {
  let num = Math.round(Math.random() * max);
  num = Math.max(num, min);
  return BigNumber.from(10).pow(base).mul(num);
};

const calculateBalances = (start, cliff, amount, rate, time) => {
  let remainder =BigNumber.from(0);
  let balance = BigNumber.from(0);
  if (start >= time || cliff >= time) {
    remainder = amount;
    balance = 0;
  } else {
    let streamed = BigNumber.from(time).sub(start).mul(rate);
    balance = bigMin(streamed, amount);
    remainder = amount.sub(balance);
  }
  return {
    balance,
    remainder,
  };
};

const calculateEnd = (amount, rate, start) => {
  let end = BigNumber.from(0);
  end = amount.div(rate).add(start);
  end = amount.mod(rate) == 0 ? end : end.add(1);
  return end;
}

module.exports = {
  ZERO: BigNumber.from(0),
  ONE: BigNumber.from(1),
  E6_1: BigNumber.from(10).pow(6),
  E6_2: BigNumber.from(10).pow(6).mul(2),
  E6_5: BigNumber.from(10).pow(6).mul(5),
  E6_10: BigNumber.from(10).pow(6).mul(10),
  E6_100: BigNumber.from(10).pow(6).mul(100),
  E6_1000: BigNumber.from(10).pow(6).mul(1000),
  E6_10000: BigNumber.from(10).pow(6).mul(10000),
  E18_05: BigNumber.from(10).pow(18).div(2),
  E18_1: BigNumber.from(10).pow(18), // 1e18
  E18_3: BigNumber.from(10).pow(18).mul(3), // 3e18
  E18_10: BigNumber.from(10).pow(18).mul(10), // 10e18
  E18_12: BigNumber.from(10).pow(18).mul(12), // 12e18
  E18_13: BigNumber.from(10).pow(18).mul(13), // 13e18
  E18_50: BigNumber.from(10).pow(18).mul(50), // 50e18
  E18_100: BigNumber.from(10).pow(18).mul(100), // 100e18
  E18_1000: BigNumber.from(10).pow(18).mul(1000), // 1000e18
  E18_10000: BigNumber.from(10).pow(18).mul(10000), // 1000e18
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
  bigMin,
  randomBigNum,
  calculateBalances,
  calculateEnd
};
