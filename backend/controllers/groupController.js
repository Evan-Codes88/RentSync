import Group from '../models/Group.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

const sanitizeGroup = (group) => ({
  id: group._id.toString(),
  name: group.name,
  createdBy: {
    name: group.createdBy.name,
    email: group.createdBy.email,
  },
  members: group.members.map(user => ({
    name: user.name,
    email: user.email,
  })),
  joinRequests: group.joinRequests ? group.joinRequests.map(user => ({
    name: user.name,
    email: user.email,
  })) : [],
  createdAt: group.createdAt,
});

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createGroup = async (request, response) => {
  const { name } = request.body;
  try {
    if (!name) {
      return response.status(400).json({ message: 'Please provide a group name.' });
    }
    const group = new Group({
      name,
      members: [request.user.id],
      createdBy: request.user.id,
      joinRequests: [],
    });
    await group.save();
    const populatedGroup = await Group.findById(group._id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email')
      .populate('joinRequests', 'name email');
    return response.status(201).json({ message: `Group "${name}" created successfully!`, group: sanitizeGroup(populatedGroup) });
  } catch (error) {
    return response.status(500).json({ message: 'Failed to create group. Please try again.' });
  }
};

export const getUserGroups = async (request, response) => {
  try {
    const groups = await Group.find({ members: request.user.id })
      .populate('members', 'name email')
      .populate('createdBy', 'name email')
      .populate('joinRequests', 'name email');
    const sanitizedGroups = groups.map(sanitizeGroup);
    return response.json({ message: 'Here are your groups!', groups: sanitizedGroups });
  } catch (error) {
    return response.status(500).json({ message: 'Failed to fetch groups. Please try again.' });
  }
};

export const getGroup = async (request, response) => {
  const { identifier } = request.params;
  try {
    let group;
    if (identifier.includes('@')) {
      // Find group by creator's email
      const user = await User.findOne({ email: identifier });
      if (!user) {
        return response.status(404).json({ message: 'User not found.' });
      }
      group = await Group.findOne({ createdBy: user._id })
        .populate('members', 'name email')
        .populate('createdBy', 'name email')
        .populate('joinRequests', 'name email');
    } else if (isValidObjectId(identifier)) {
      group = await Group.findById(identifier)
        .populate('members', 'name email')
        .populate('createdBy', 'name email')
        .populate('joinRequests', 'name email');
    } else {
      return response.status(400).json({ message: 'Invalid group identifier.' });
    }
    if (!group) {
      return response.status(404).json({ message: 'Group not found.' });
    }
    if (!group.members.some(member => member._id.toString() === request.user.id)) {
      return response.status(403).json({ message: 'You must be a group member to view this group.' });
    }
    return response.json({ message: 'Group details retrieved successfully!', group: sanitizeGroup(group) });
  } catch (error) {
    return response.status(500).json({ message: 'Failed to fetch group. Please try again.' });
  }
};

export const updateGroup = async (request, response) => {
  const { identifier } = request.params;
  const { name } = request.body;
  try {
    let group;
    if (identifier.includes('@')) {
      const user = await User.findOne({ email: identifier });
      if (!user) {
        return response.status(404).json({ message: 'User not found.' });
      }
      group = await Group.findOne({ createdBy: user._id });
    } else if (isValidObjectId(identifier)) {
      group = await Group.findById(identifier);
    } else {
      return response.status(400).json({ message: 'Invalid group identifier.' });
    }
    if (!group) {
      return response.status(404).json({ message: 'Group not found.' });
    }
    if (group.createdBy.toString() !== request.user.id) {
      return response.status(403).json({ message: 'Only the group creator can update this group.' });
    }
    if (name) group.name = name;
    await group.save();
    const populatedGroup = await Group.findById(group._id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email')
      .populate('joinRequests', 'name email');
    return response.json({ message: `Group "${group.name}" updated successfully!`, group: sanitizeGroup(populatedGroup) });
  } catch (error) {
    return response.status(500).json({ message: 'Failed to update group. Please try again.' });
  }
};

export const deleteGroup = async (request, response) => {
  const { id } = request.params;

  if (!isValidObjectId(id)) {
    return response.status(400).json({ message: 'Invalid group ID.' });
  }

  try {
    const group = await Group.findById(id);
    if (!group) {
      return response.status(404).json({ message: 'Group not found.' });
    }

    if (group.createdBy.toString() !== request.user.id) {
      return response.status(403).json({ message: 'Only the group creator can delete this group.' });
    }

    const groupName = group.name;
    await group.deleteOne();

    return response.json({ message: `Group "${groupName}" has been disbanded.` });
  } catch (error) {
    return response.status(500).json({ message: 'Failed to delete group. Please try again.' });
  }
};


export const requestToJoinGroup = async (request, response) => {
  const { id } = request.params;

  if (!isValidObjectId(id)) {
    return response.status(400).json({ message: 'Invalid group ID.' });
  }

  try {
    const group = await Group.findById(id);
    if (!group) {
      return response.status(404).json({ message: 'Group not found.' });
    }

    const userId = request.user.id;

    if (group.members.some(member => member.toString() === userId)) {
      return response.status(400).json({ message: 'You’re already a member of this group.' });
    }

    if (group.joinRequests.some(id => id.toString() === userId)) {
      return response.status(400).json({ message: 'You’ve already requested to join this group.' });
    }

    group.joinRequests.push(userId);
    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email')
      .populate('joinRequests', 'name email');

    return response.json({
      message: `Your request to join "${group.name}" has been sent!`,
      group: sanitizeGroup(populatedGroup)
    });
  } catch (error) {
    return response.status(500).json({ message: 'Failed to send join request. Please try again.' });
  }
};


export const approveJoinRequest = async (request, response) => {
  const { groupId, userId } = request.params;

  if (!isValidObjectId(groupId) || !isValidObjectId(userId)) {
    return response.status(400).json({ message: 'Invalid ID(s).' });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return response.status(404).json({ message: 'Group not found.' });
    }

    if (group.createdBy.toString() !== request.user.id) {
      return response.status(403).json({ message: 'Only the group creator can approve join requests.' });
    }

    if (!group.joinRequests.some(id => id.toString() === userId)) {
      return response.status(400).json({ message: 'No join request found for this user.' });
    }

    group.members.push(userId);
    group.joinRequests = group.joinRequests.filter(id => id.toString() !== userId);
    await group.save();

    const user = await User.findById(userId);

    const populatedGroup = await Group.findById(group._id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email')
      .populate('joinRequests', 'name email');

    return response.json({
      message: `${user.name} has been added to "${group.name}"!`,
      group: sanitizeGroup(populatedGroup)
    });
  } catch (error) {
    return response.status(500).json({ message: 'Failed to approve join request. Please try again.' });
  }
};


export const rejectJoinRequest = async (request, response) => {
  const { groupId, userId } = request.params;

  if (!isValidObjectId(groupId) || !isValidObjectId(userId)) {
    return response.status(400).json({ message: 'Invalid ID(s).' });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return response.status(404).json({ message: 'Group not found.' });
    }

    if (group.createdBy.toString() !== request.user.id) {
      return response.status(403).json({ message: 'Only the group creator can reject join requests.' });
    }

    if (!group.joinRequests.some(id => id.toString() === userId)) {
      return response.status(400).json({ message: 'No join request found for this user.' });
    }

    group.joinRequests = group.joinRequests.filter(id => id.toString() !== userId);
    await group.save();

    const user = await User.findById(userId);

    const populatedGroup = await Group.findById(group._id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email')
      .populate('joinRequests', 'name email');

    return response.json({
      message: `${user.name}'s join request for "${group.name}" has been rejected.`,
      group: sanitizeGroup(populatedGroup)
    });
  } catch (error) {
    return response.status(500).json({ message: 'Failed to reject join request. Please try again.' });
  }
};


export const leaveGroup = async (request, response) => {
  const { identifier } = request.params;
  try {
    let group;
    if (identifier.includes('@')) {
      const user = await User.findOne({ email: identifier });
      if (!user) {
        return response.status(404).json({ message: 'User not found.' });
      }
      group = await Group.findOne({ createdBy: user._id });
    } else if (isValidObjectId(identifier)) {
      group = await Group.findById(identifier);
    } else {
      return response.status(400).json({ message: 'Invalid group identifier.' });
    }
    if (!group) {
      return response.status(404).json({ message: 'Group not found.' });
    }
    if (!group.members.some(member => member._id.toString() === request.user.id)) {
      return response.status(400).json({ message: 'You’re not a member of this group.' });
    }
    if (group.createdBy.toString() === request.user.id) {
      return response.status(400).json({ message: 'As the creator, you cannot leave the group. Consider deleting it instead.' });
    }
    group.members = group.members.filter(member => member._id.toString() !== request.user.id);
    await group.save();
    const populatedGroup = await Group.findById(group._id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email')
      .populate('joinRequests', 'name email');
    return response.json({ message: `You’ve left "${group.name}" successfully.`, group: sanitizeGroup(populatedGroup) });
  } catch (error) {
    return response.status(500).json({ message: 'Failed to leave group. Please try again.' });
  }
};