const { User } = require('../models');

class UserRepository {
  async findById(id) {
    return await User.findById(id);
  }

  async findOne(filter, options = {}) {
    let query = User.findOne(filter);
    if (options.select) query = query.select(options.select);
    return await query.exec();
  }

  async find(filter, options = {}) {
    let query = User.find(filter);
    if (options.select) query = query.select(options.select);
    return await query.exec();
  }

  async create(data) {
    return await User.create(data);
  }

  async updateById(id, data) {
    return await User.findByIdAndUpdate(id, data, { new: true });
  }

  async count(filter) {
    return await User.countDocuments(filter);
  }
}

module.exports = new UserRepository();
