const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllInterests = async (req, res) => {
  try {
    const interests = await prisma.interests.findMany();
    res.status(200).json(interests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching interests', error });
  }
};

exports.getInterestById = async (req, res) => {
  try {
    const interest = await prisma.interests.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!interest) {
      return res.status(404).json({ message: 'Interest not found' });
    }
    res.status(200).json(interest);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching interest', error });
  }
};

exports.createInterest = async (req, res) => {
  try {
    const newInterest = await prisma.interests.create({
      data: req.body,
    });
    res.status(201).json(newInterest);
  } catch (error) {
    res.status(400).json({ message: 'Error creating interest', error });
  }
};

exports.updateInterest = async (req, res) => {
  try {
    const updatedInterest = await prisma.interests.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.status(200).json(updatedInterest);
  } catch (error) {
    res.status(400).json({ message: 'Error updating interest', error });
  }
};

exports.deleteInterest = async (req, res) => {
  try {
    await prisma.interests.delete({
      where: { id: Number(req.params.id) },
    });
    res.status(200).json({ message: 'Interest deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting interest', error });
  }
};

exports.assignUserInterests = async (req, res) => {
  const { userId } = req.params;
  const { interestIds } = req.body;

  try {
    await prisma.users.update({
      where: { id: Number(userId) },
      data: {
        interests: {
          set: interestIds.map(id => ({ id })), 
        },
      },
    });
    res.status(200).json({ message: "Interests updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error assigning interests", error });
  }
};

exports.getPostsByUserInterest = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await prisma.users.findUnique({
      where: { id: Number(userId) },
      include: {
        interests: {
          include: {
            tags: true,
          },
        },
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const tagIds = [
      ...new Set(user.interests.flatMap(i => i.tags.map(t => t.id)))
    ];

    if (tagIds.length === 0) {
      return res.status(200).json([]);
    }

    const posts = await prisma.posts.findMany({
      where: {
        postTags: {
          some: {
            tag_id: { in: tagIds },
          },
        },
      },
      include: {
        users: true,
        postTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts", error });
  }
};
