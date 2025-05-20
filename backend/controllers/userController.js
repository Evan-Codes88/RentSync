import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const signup = async (request, response) => {
  const { name, email, password } = request.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return response.status(400).json({ message: 'User already exists' });
    }
    user = new User({ name, email, password: await bcrypt.hash(password, 10) });
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    response.status(201).json({ token, user: { id: user._id, name, email } });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

export const login = async (request, response) => {
  const { email, password } = request.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return response.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return response.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    response.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in production (HTTPS)
      sameSite: 'Strict',
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    response.json({ message: 'User Logged In Successfully' });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};


export const logout = async (request, response) => {
  try {
    response.clearCookie('token');
    response.json({ message: 'Logged out successfully' });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};


export const getUserProfile = async (request, response) => {
  try {
    const user = await User.findById(request.user.id).select('-password');
    if (!user) {
      return response.status(404).json({ message: 'User not found' });
    }
    response.json(user);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

export const updateUserProfile = async (request, response) => {
  const { name, email, password } = request.body;
  try {
    const user = await User.findById(request.user.id);
    if (!user) {
      return response.status(404).json({ message: 'User not found' });
    }
    if (name) user.name = name;
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }
    if (password) user.password = await bcrypt.hash(password, 10);
    await user.save();
    response.json({ id: user._id, name: user.name, email: user.email });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

export const deleteUserProfile = async (request, response) => {
  try {
    const user = await User.findByIdAndDelete(request.user.id);
    if (!user) {
      return response.status(404).json({ message: 'User not found' });
    }
    response.json({ message: 'User deleted' });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (request, response) => {
  try {
    const users = await User.find().select('name email createdAt');
    response.json(users);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

export const getUserById = async (request, response) => {
  try {
    const user = await User.findById(request.params.id).select('name email createdAt');
    if (!user) {
      return response.status(404).json({ message: 'User not found' });
    }
    response.json(user);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

export const searchUsers = async (request, response) => {
  const { query } = request.query;

  if (!query) {
    return response.status(400).json({ message: 'Search query is required' });
  }

  try {
    const users = await User.find({
      email: { $regex: query, $options: 'i' }
    }).select('name email createdAt');

    if (users.length === 0) {
      return response.status(404).json({ message: 'No users found with that email address' });
    }

    response.json(users);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

