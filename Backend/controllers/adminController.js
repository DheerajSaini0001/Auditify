import AuditLog from "../models/AuditLog.js";

export const getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, ip, userId, startDate, endDate } = req.query;

    const query = {};
    if (ip) query.ip = ip;
    if (userId) query.userId = userId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({
      success: true,
      logs,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getStats = async (req, res) => {
  try {
    const totalAudits = await AuditLog.countDocuments();
    
    // Unique IPs
    const uniqueIPsResult = await AuditLog.aggregate([
      { $group: { _id: "$ip" } },
      { $count: "count" }
    ]);
    const uniqueIPs = uniqueIPsResult[0]?.count || 0;

    // Suspicious IPs (e.g., > 10 audits in the last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const suspiciousIPs = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: oneHourAgo } } },
      { $group: { _id: "$ip", count: { $sum: 1 } } },
      { $match: { count: { $gt: 10 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      totalAudits,
      uniqueIPs,
      suspiciousIPs: suspiciousIPs.map(item => ({ ip: item._id, count: item.count })),
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
