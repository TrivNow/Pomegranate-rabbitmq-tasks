/**
 * @file index
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Pomegranate-rabbitmq-tasks
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

'use strict';
var util = require('magnum-plugin-utils')
var _ = util.lodash
var path = require('path')

/**
 *
 * @module RabbitWorkQueues
 */

exports.options = {
  workDir: './taskQueues'
}

exports.metadata = {
  name: 'RabbitTasks',
  type: 'action',
  depends: ['RabbitConnection']
}

exports.plugin = {
  load: function(inject, loaded) {
    var workDir = this.options.workDir
    var RabbitConnection = inject('RabbitConnection')

    util.fileList(workDir)
      .then(function(files){
        return _.map(files, function(file){
          return inject(require(path.join(workDir, file)));
        })
      })
      .then(function(queues) {
        return RabbitConnection.createChannel()
          .then(function(channel){
            _.each(queues, function(queue){
              channel.assertQueue(queue.name, {durable: true})
            })
            return channel
          })
          .then(function(channel){
            return _.map(queues, function(queue){
              return channel.consume(queue.name, queue.handler.bind(channel))
            })
          })

      })
      .then(function(activeQueues){
        loaded()
      })

  },
  start: function(done) {
    done()
  },
  stop: function(done) {
    done()
  }

}