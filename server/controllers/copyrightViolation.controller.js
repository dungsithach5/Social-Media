const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.reportCopyrightViolation = async (req, res) => {
    try {
        const { post_id, reporter_id, violation_type, description } = req.body;

        const report = await prisma.copyrightViolation.create({
            data: {
                post_id,
                reporter_id,
                violation_type, // "unauthorized_use", "stolen_content", etc.
                description,
                status: 'pending', // "pending", "investigating", "resolved"
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });

        res.status(201).json({
            message: 'Copyright violation reported successfully',
            report
        });
    } catch (error) {
        res.status(400).json({ message: 'Error reporting copyright violation', error });
    }
};

exports.getAllViolations = async (req, res) => {
    try {
        const violations = await prisma.copyrightViolation.findMany({
            include: {
                post: true,
                reporter: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.status(200).json(violations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching violations', error });
    }
};

exports.updateViolationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updatedViolation = await prisma.copyrightViolation.update({
            where: { id: Number(id) },
            data: {
                status,
                updatedAt: new Date()
            }
        });

        res.status(200).json(updatedViolation);
    } catch (error) {
        res.status(400).json({ message: 'Error updating violation status', error });
    }
}; 