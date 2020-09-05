import Vue from 'vue';

const Limit = 20;
function postprocessBlocks(items) {
  return items
    .sort((a, b) => (Number(a.timestamp) > Number(b.timestamp) ? -1 : 1))
    .slice(0, Limit);
}

function postprocessTxs(items) {
  return items
    .sort((a, b) => (Number(a.timestamp) > Number(b.timestamp) ? -1 : 1))
    .slice(0, Limit);
}

function getTotalBlockLatency(latencies) {
  latencies = latencies.filter(x => isFinite(x));
  if (!latencies.length) return NaN;

  return (
    latencies.reduce((memo, latency) => memo + latency, 0) / latencies.length
  );
}

let store = {
  data: {
    shards: {},
    blocks: [],
    txs: [],
    stakingTxs: [],
    blockCount: 0,
    txCount: 0,
    stakingTxCount: 0,
    nodeCount: 0,
    coinPrice: '0',
    marketCap: '0',
    lastUpdateTime: 0,
    validators: [],
    pendingTxs: {},
    txVolume: [],
  },

  update(data) {
    this.updateShards(data.shards);
    this.updateGlobalData();
  },
  updateShards(shards) {
    if (shards) {
      Object.values(shards).forEach(this.updateShard.bind(this));
    }
  },
  updateShard(shard) {
    let shardData = this.data.shards[shard.id];
    if (!shardData) {
      Vue.set(this.data.shards, shard.id, shard);
      shardData = this.data.shards[shard.id];
      shardData.blocks = shardData.blocks.slice(0, Limit);
      shardData.txs = shardData.txs.slice(0, Limit);
      shardData.stakingTxs = shardData.stakingTxs.slice(0, Limit);
      return;
    }
    // don't add blocks that are already in latestBlocks
    let blockMap = {};
    shardData.blocks.forEach(b => (blockMap[b.id] = b));
    shard.blocks.forEach(b => (blockMap[b.id] = b));
    shardData.blocks = postprocessBlocks(Object.values(blockMap));

    // don't add txs that are already in latestTxs
    let txMap = {};
    shardData.txs.forEach(t => (txMap[t.id] = t));
    shard.txs.forEach(t => (txMap[t.id] = t));
    shardData.txs = postprocessTxs(Object.values(txMap));

    // don't add txs that are already in latestTxs
    let stakingTxMap = {};
    shardData.stakingTxs.forEach(t => (stakingTxMap[t.id] = t));
    shard.stakingTxs.forEach(t => (stakingTxMap[t.id] = t));
    shardData.stakingTxs = postprocessTxs(Object.values(stakingTxMap));

    shardData.blockCount = shard.blockCount;
    shardData.nodeCount = shard.nodeCount;
    shardData.lastUpdateTime = shard.lastUpdateTime;
    shardData.txCount = shard.txCount;
    shardData.stakingTxCount = shard.stakingTxCount;
  },
  updateGlobalData() {
    this.data.blocks = postprocessBlocks(
      Object.values(this.data.shards).reduce(
        (memo, shard) => memo.concat(shard.blocks),
        []
      )
    );
    this.data.txs = postprocessTxs(
      Object.values(this.data.shards).reduce(
        (memo, shard) => memo.concat(shard.txs),
        []
      )
    );
    this.data.stakingTxs = postprocessTxs(
      Object.values(this.data.shards).reduce(
        (memo, shard) => memo.concat(shard.stakingTxs),
        []
      )
    );
    this.data.blockCount = Object.values(this.data.shards).reduce(
      (memo, shard) => memo + shard.blockCount,
      0
    );
    this.data.txCount = Object.values(this.data.shards).reduce(
      (memo, shard) => memo + shard.txCount,
      0
    );
    this.data.stakingTxCount = Object.values(this.data.shards).reduce(
      (memo, shard) => memo + shard.stakingTxCount,
      0
    );
    this.data.nodeCount = Object.values(this.data.shards).reduce(
      (memo, shard) => memo + shard.nodeCount,
      0
    );
    this.data.shardCount = Object.keys(this.data.shards).length;
    this.data.blockLatency = getTotalBlockLatency(
      Object.values(this.data.shards).map(s => s.blockLatency)
    );
    this.data.lastUpdateTime = Math.max(
      ...Object.values(this.data.shards)
        .map(s => s.lastUpdateTime)
        .filter(x => isFinite(x))
    );
  },
  updateCoinPrice(price) {
    this.data.coinPrice = price;
  },
  updateMarketCap(price) {
    this.data.marketCap = price;
  },
  updateValidators(validators) {
    this.data.validators = validators;
  },
  updatePendingTransactions(txs, shardID) {
    // Need temp reference for update signal
    let pendingTxs = this.data.pendingTxs;
    this.data.pendingTxs = null;

    pendingTxs[shardID] = txs;

    this.data.pendingTxs = pendingTxs;
  },
  updateTransactionVolume(volume) {
    this.data.txVolume = [...volume];
  },
  reset() {
    this.data.blocks = [];
    this.data.txs = [];
    this.data.stakingTxs = [];
    this.data.blockCount = 0;
    this.data.txCount = 0;
    this.data.stakingTxCount = 0;
    this.data.nodeCount = 0;
    this.data.nodes = {};
    this.data.coinPrice = '0';
    this.data.shardCount = 0;
    this.data.validators = [];
    this.data.pendingTxs = {};
  },
};

export default store;
