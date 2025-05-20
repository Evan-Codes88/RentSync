import Group from '../models/Group.js';

export const createGroup = async (request, response) => {
  const { name } = request.body;

  try {
    if (!name) {
      return response.status(400).json({ message: 'Group name is required' });
    }

    const group = new Group({
      name,
      members: [request.user.id],
      createdBy: request.user.id,
    });

    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('members', 'name email')
      .populate('createdBy', 'name');


    const cleanedGroup = {
      name: populatedGroup.name,
      createdBy: {
        name: populatedGroup.createdBy.name
      },
      members: populatedGroup.members.map(user => ({
        name: user.name,
        email: user.email
      })),
      createdAt: populatedGroup.createdAt
    };

    response.status(201).json(cleanedGroup);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};



export const addUserToGroup = async (request, response) => {
  const { groupId } = request.params;
  const { email } = request.body;

  if (!email) {
    return response.status(400).json({ message: 'User email is required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return response.status(404).json({ message: 'User not found with that email' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return response.status(404).json({ message: 'Group not found' });
    }

    // Check if the user is already a member
    const isMember = group.members.includes(user._id);
    if (isMember) {
      return response.status(400).json({ message: 'User is already a member of this group' });
    }

    group.members.push(user._id);
    await group.save();

    const populatedGroup = await Group.findById(groupId)
      .populate('members', 'name email')
      .populate('createdBy', 'name');

    response.status(200).json(populatedGroup);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};
