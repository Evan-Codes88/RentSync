import Inspection from '../models/Inspection.js';
import Group from '../models/Group.js';
import User from '../models/User.js';

const sanitizeInspection = (inspection) => ({
  id: inspection._id.toString(),
  groupId: inspection.groupId.toString(),
  address: inspection.address,
  date: inspection.date,
  createdBy: {
    name: inspection.createdBy.name,
    email: inspection.createdBy.email,
  },
  assignedTo: inspection.assignedTo.map(user => ({
    name: user.name,
    email: user.email,
  })),
  attendees: inspection.attendees.map(user => ({
    name: user.name,
    email: user.email,
  })),
  createdAt: inspection.createdAt,
});

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createInspection = async (request, response) => {
  const { groupIdentifier, address, date } = request.body;
  try {
    if (!groupIdentifier || !address || !date) {
      return response.status(400).json({ message: 'Please provide group identifier, address, and date.' });
    }
    let group;
    if (groupIdentifier.includes('@')) {
      const user = await User.findOne({ email: groupIdentifier });
      if (!user) {
        return response.status(404).json({ message: 'Group creator not found.' });
      }
      group = await Group.findOne({ createdBy: user._id });
    } else if (isValidObjectId(groupIdentifier)) {
      group = await Group.findById(groupIdentifier);
    } else {
      return response.status(400).json({ message: 'Invalid group identifier.' });
    }
    if (!group) {
      return response.status(404).json({ message: 'Group not found.' });
    }
    if (!group.members.some(member => member._id.toString() === request.user.id)) {
      return response.status(403).json({ message: 'You must be a group member to create an inspection.' });
    }
    const inspection = new Inspection({
      groupId: group._id,
      address,
      date: new Date(date),
      createdBy: request.user.id,
      assignedTo: [],
      attendees: [],
    });
    await inspection.save();
    const populatedInspection = await Inspection.findById(inspection._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('attendees', 'name email');
    response.status(201).json({ message: `Inspection at ${address} scheduled successfully!`, inspection: sanitizeInspection(populatedInspection) });
  } catch (error) {
    response.status(500).json({ message: 'Failed to create inspection. Please try again.' });
  }
};

export const getGroupInspections = async (request, response) => {
  const { groupIdentifier } = request.params;
  try {
    let group;
    if (groupIdentifier.includes('@')) {
      const user = await User.findOne({ email: groupIdentifier });
      if (!user) {
        return response.status(404).json({ message: 'Group creator not found.' });
      }
      group = await Group.findOne({ createdBy: user._id });
    } else if (isValidObjectId(groupIdentifier)) {
      group = await Group.findById(groupIdentifier);
    } else {
      return response.status(400).json({ message: 'Invalid group identifier.' });
    }
    if (!group) {
      return response.status(404).json({ message: 'Group not found.' });
    }
    if (!group.members.some(member => member._id.toString() === request.user.id)) {
      return response.status(403).json({ message: 'You must be a group member to view inspections.' });
    }
    const inspections = await Inspection.find({ groupId: group._id })
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('attendees', 'name email');
    const sanitizedInspections = inspections.map(sanitizeInspection);
    response.json({ message: 'Here are the group’s inspections!', inspections: sanitizedInspections });
  } catch (error) {
    response.status(500).json({ message: 'Failed to fetch inspections. Please try again.' });
  }
};

export const getInspection = async (request, response) => {
  const { id } = request.params;
  try {
    if (!isValidObjectId(id)) {
      return response.status(400).json({ message: 'Invalid inspection ID.' });
    }
    const inspection = await Inspection.findById(id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('attendees', 'name email');
    if (!inspection) {
      return response.status(404).json({ message: 'Inspection not found.' });
    }
    const group = await Group.findById(inspection.groupId);
    if (!group || !group.members.some(member => member._id.toString() === request.user.id)) {
      return response.status(403).json({ message: 'You must be a group member to view this inspection.' });
    }
    response.json({ message: 'Inspection details retrieved successfully!', inspection: sanitizeInspection(inspection) });
  } catch (error) {
    response.status(500).json({ message: 'Failed to fetch inspection. Please try again.' });
  }
};

export const updateInspection = async (request, response) => {
  const { id } = request.params;
  const { address, date } = request.body;
  try {
    if (!isValidObjectId(id)) {
      return response.status(400).json({ message: 'Invalid inspection ID.' });
    }
    const inspection = await Inspection.findById(id);
    if (!inspection) {
      return response.status(404).json({ message: 'Inspection not found.' });
    }
    if (inspection.createdBy.toString() !== request.user.id) {
      return response.status(403).json({ message: 'Only the inspection creator can update it.' });
    }
    if (address) inspection.address = address;
    if (date) inspection.date = new Date(date);
    await inspection.save();
    const populatedInspection = await Inspection.findById(inspection._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('attendees', 'name email');
    response.json({ message: `Inspection at ${inspection.address} updated successfully!`, inspection: sanitizeInspection(populatedInspection) });
  } catch (error) {
    response.status(500).json({ message: 'Failed to update inspection. Please try again.' });
  }
};

export const deleteInspection = async (request, response) => {
  const { id } = request.params;
  try {
    if (!isValidObjectId(id)) {
      return response.status(400).json({ message: 'Invalid inspection ID.' });
    }
    const inspection = await Inspection.findById(id);
    if (!inspection) {
      return response.status(404).json({ message: 'Inspection not found.' });
    }
    if (inspection.createdBy.toString() !== request.user.id) {
      return response.status(403).json({ message: 'Only the inspection creator can delete it.' });
    }
    const address = inspection.address;
    await inspection.deleteOne();
    response.json({ message: `Inspection at ${address} has been cancelled.` });
  } catch (error) {
    response.status(500).json({ message: 'Failed to delete inspection. Please try again.' });
  }
};

export const assignInspection = async (request, response) => {
  const { id } = request.params;
  const { userEmail } = request.query;
  try {
    if (!isValidObjectId(id)) {
      return response.status(400).json({ message: 'Invalid inspection ID.' });
    }
    if (!userEmail) {
      return response.status(400).json({ message: 'User email is required.' });
    }
    const inspection = await Inspection.findById(id);
    if (!inspection) {
      return response.status(404).json({ message: 'Inspection not found.' });
    }
    if (inspection.createdBy.toString() !== request.user.id) {
      return response.status(403).json({ message: 'Only the inspection creator can assign users.' });
    }
    const group = await Group.findById(inspection.groupId);
    if (!group) {
      return response.status(404).json({ message: 'Group not found.' });
    }
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return response.status(404).json({ message: 'User not found.' });
    }
    const userId = user._id.toString();
    if (!group.members.some(member => member._id.toString() === userId)) {
      return response.status(400).json({ message: 'User must be a group member to be assigned.' });
    }
    if (inspection.assignedTo.some(u => u._id.toString() === userId)) {
      return response.status(400).json({ message: `${user.name} is already assigned to this inspection.` });
    }
    inspection.assignedTo.push(userId);
    await inspection.save();
    const populatedInspection = await Inspection.findById(inspection._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('attendees', 'name email');
    response.json({ message: `${user.name} has been assigned to the inspection at ${inspection.address}!`, inspection: sanitizeInspection(populatedInspection) });
  } catch (error) {
    response.status(500).json({ message: 'Failed to assign user. Please try again.' });
  }
};

export const attendInspection = async (request, response) => {
  const { id } = request.params;
  try {
    if (!isValidObjectId(id)) {
      return response.status(400).json({ message: 'Invalid inspection ID.' });
    }
    const inspection = await Inspection.findById(id);
    if (!inspection) {
      return response.status(404).json({ message: 'Inspection not found.' });
    }
    const group = await Group.findById(inspection.groupId);
    if (!group || !group.members.some(member => member._id.toString() === request.user.id)) {
      return response.status(403).json({ message: 'You must be a group member to attend this inspection.' });
    }
    const userId = request.user.id;
    if (inspection.attendees.some(u => u._id.toString() === userId)) {
      return response.status(400).json({ message: 'You’re already marked as attending this inspection.' });
    }
    inspection.attendees.push(userId);
    await inspection.save();
    const populatedInspection = await Inspection.findById(inspection._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('attendees', 'name email');
    response.json({ message: `You’re now attending the inspection at ${inspection.address}!`, inspection: sanitizeInspection(populatedInspection) });
  } catch (error) {
    response.status(500).json({ message: 'Failed to mark attendance. Please try again.' });
  }
};