const Model = require('./../../lib/model')
const {
  rewardStage
} = require('./../../config/models')

class RewardModel extends Model {
  model() {
    return this.db().define('reward_stage', rewardStage()[0], rewardStage()[1])
  }
}

module.exports = RewardModel