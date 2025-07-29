const { User } = require("../models");
const { asyncHandler, AppError } = require("../middleware/errorHandler");

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select("-password");
  res.json({ success: true, data: { users } });
});

const createUser = asyncHandler(async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json({ success: true, data: { user: user.getPublicProfile() } });
});

module.exports = { getUsers, createUser };
