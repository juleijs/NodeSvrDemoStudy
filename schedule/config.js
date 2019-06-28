module.exports = {
  items: [
    {
      name: '_scheduleInviteReward',
      title: '邀请奖励',
      rule: '*/5 * * * * *'
    },
    {
      name: '_scheduleRewardStage',
      title: '分期奖励',
      rule: '0 0 1 * * *'
    },
    {
      name: '_chargeJobs',
      title: '充值',
      rule: '*/10 * * * * *'
    }
  ]
}