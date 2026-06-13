const { Complaint } = require('../models');

class ComplaintRepository {
  async create(complaintData) {
    const complaint = new Complaint(complaintData);
    return await complaint.save();
  }

  async findById(id) {
    return await Complaint.findById(id);
  }

  async find(filters, options = {}) {
    const { skip = 0, limit = 50, sort = { createdAt: -1 }, populate } = options;
    
    let query = Complaint.find(filters).sort(sort).skip(skip).limit(limit);
    
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach(p => query = query.populate(p));
      } else {
        query = query.populate(populate);
      }
    }

    return await query.exec();
  }

  async count(filters) {
    return await Complaint.countDocuments(filters);
  }

  async updateById(id, updateData) {
    return await Complaint.findByIdAndUpdate(id, updateData, { new: true });
  }

  async aggregate(pipeline) {
    return await Complaint.aggregate(pipeline);
  }
}

module.exports = new ComplaintRepository();
