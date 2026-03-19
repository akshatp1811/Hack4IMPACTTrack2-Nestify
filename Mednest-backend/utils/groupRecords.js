/**
 * Smart grouping utility using MongoDB aggregation pipeline.
 * Groups HealthRecords by groupKey for timeline display.
 */
const mongoose = require('mongoose')

/**
 * Build a MongoDB aggregation pipeline that groups records by groupKey.
 *
 * @param {string} userId - The user's ObjectId as a string
 * @param {Object} [matchFilter] - Extra match conditions (e.g. recordType)
 * @returns {Array} Aggregation pipeline stages
 */
function buildGroupPipeline(userId, matchFilter = {}) {
  const match = {
    userId: new mongoose.Types.ObjectId(userId),
    isDeleted: false,
    ...matchFilter,
  }

  return [
    { $match: match },
    { $sort: { recordDate: 1 } },
    {
      $group: {
        _id: '$groupKey',
        subType: { $first: '$subType' },
        recordType: { $first: '$recordType' },
        count: { $sum: 1 },
        latestDate: { $max: '$recordDate' },
        earliestDate: { $min: '$recordDate' },
        records: { $push: '$$ROOT' },
      },
    },
    { $sort: { latestDate: -1 } },
    {
      $project: {
        _id: 0,
        groupKey: '$_id',
        subType: 1,
        recordType: 1,
        count: 1,
        latestDate: 1,
        earliestDate: 1,
        records: 1,
      },
    },
  ]
}

module.exports = { buildGroupPipeline }
