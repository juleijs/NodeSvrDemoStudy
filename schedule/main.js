const nodeSchedule = require('node-schedule')
const CommonControler = require('./../app/common/common_controller')
const uuid = require('uuid')

class Schedule extends CommonControler {
  async _init_ (){
    let schedules = require('./config').items

    this.logger.info('schedules:', schedules)
    this.logger.info('schedules count:', schedules.length)
    schedules.forEach(schedule => {
      let scheduleName = schedule.name
      let scheduleRule = schedule.rule

      if(this[scheduleName]) {
        nodeSchedule.scheduleJob(scheduleRule, () => {
          let ctx = {
            uuid: uuid.v4(),
            ret: {
              code: 0,
              message: ''
            }
          }
          this[scheduleName](ctx)
          this.logger.info('schedule start:', scheduleName, scheduleRule)
        })
      }
    })
  }
}

const start = () => {
  let schedule = new Schedule()
  schedule._init_()
}

module.exports = {
  start,
  getSchedule: () => {
    return new Schedule()
  }
}